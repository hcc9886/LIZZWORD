/* ============================================================
   LIZZWORD · 云端账号与跨设备同步
   ------------------------------------------------------------
   - 账号：邮箱 + 密码，直接调用 Supabase REST（不引入任何 CDN）
   - 配置：从 books/lizz/account-config.js 读取 Project URL 与 anon key
   - 本地优先：未登录时完全等同原来的 localStorage 行为
   - 登录后：本地与云端双向合并，按 updated_at 较新的快照决定可冲突字段，
     进度类集合取并集，已学词 / 复习池 / 积分 / 已购置装扮都不会丢
   - 断网：写入本地待办队列，指数退避重试，绝不打断学习流程
   - file://：自动禁用账号功能，只显示提示
   ------------------------------------------------------------
   对外接口：
     window.LIZZWORD_ACCOUNT = {
       init, open, close, toggle, isOpen,
       signUp, signIn, signOut, syncNow, flushQueue,
       getStatus, getSession, isEnabled, isMock, isFileMode,
       getQueue, getSnapshot, resetMock? // resetMock 由 mock 适配器提供
     }
   事件：
     lizzword:account-changed  { session, status }
     lizzword:account-sync     { ok, datasets, error }
   ============================================================ */
(function () {
  "use strict";

  const CFG = window.LIZZWORD_ACCOUNT_CONFIG || {};
  const ADAPTER = window.LIZZWORD_ACCOUNT_ADAPTER || null;

  const SESSION_KEY = "lizzword_account_v1";
  const META_KEY = "lizzword_account_meta_v1";
  const QUEUE_KEY = "lizzword_account_queue_v1";
  const DEVICE_KEY = "lizzword_account_device_v1";

  const DATASETS = {
    study: {
      key: "lizzword_state_v1",
      table: "study_state",
      label: "学习进度"
    },
    lizz: {
      key: "lizzword_lizz_v1",
      table: "lizz_state",
      label: "Lizz 状态与积分"
    }
  };

  const RETRY_DELAYS = [5000, 20000, 60000, 180000, 600000];
  const isFileMode = (function () {
    try {
      return window.location.protocol === "file:";
    } catch (error) {
      return false;
    }
  })();

  let initialized = false;
  let panel = null;
  let lastFocus = null;
  let syncing = false;
  let syncAgain = false;
  let pushTimer = null;
  let pollTimer = null;
  let queueTimer = null;
  let noticeText = "";
  const cloudCache = { study: null, lizz: null };
  const lastSyncAt = { study: "", lizz: "" };
  let internalWrites = 0;      // 自己写 localStorage 时不计为“用户改动”
  let storageHooked = false;
  let lastError = "";
  let cloudUninitialized = false;
  let entryObserver = null;

  /* ============================================================
     基础工具
     ============================================================ */
  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function clone(value) {
    if (value == null) return value;
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      return value;
    }
  }

  function isObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function safeGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function safeSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      return false;
    }
  }

  function readJson(key, fallback) {
    const raw = safeGet(key);
    if (!raw) return fallback;
    try {
      const parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch (error) {
      return fallback;
    }
  }

  function configReady() {
    if (ADAPTER && typeof ADAPTER.request === "function") return true;
    const url = String(CFG.url || "").trim();
    const key = String(CFG.anonKey || "").trim();
    if (!/^https:\/\/[^\s/]+\.supabase\.co\/?$/.test(url)) return false;
    if (!key || key.length < 20) return false;
    if (/YOUR_|example|xxxx/i.test(url + key)) return false;
    return true;
  }

  function isMock() {
    return Boolean(ADAPTER && ADAPTER.name === "mock");
  }

  function disabledReason() {
    // file:// 默认禁用；只有“预览页 + mock 后端”这一种情况允许例外，方便本地验收
    const fileMock = isMock() && window.LIZZWORD_ACCOUNT_ALLOW_FILE_MOCK === true;
    if (isFileMode && !fileMock) return "file";
    if (CFG.enabled === false) return "disabled";
    if (!configReady()) return "config";
    return "";
  }

  function isEnabled() {
    return disabledReason() === "";
  }

  function baseUrl() {
    return String(CFG.url || "").trim().replace(/\/+$/, "");
  }

  function anonKey() {
    return String(CFG.anonKey || "").trim();
  }

  /* ============================================================
     设备 ID / 元信息
     ============================================================ */
  function deviceId() {
    let id = safeGet(DEVICE_KEY);
    if (id) return id;
    id = "d_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    safeSet(DEVICE_KEY, id);
    return id;
  }

  function readMeta() {
    const meta = readJson(META_KEY, null);
    const out = isObject(meta) ? meta : {};
    if (!isObject(out.updatedAt)) out.updatedAt = {};
    return out;
  }

  function writeMeta(meta) {
    safeSet(META_KEY, JSON.stringify(meta || {}));
  }

  function touchLocalMeta(datasetName) {
    const meta = readMeta();
    meta.updatedAt[datasetName] = nowIso();
    meta.deviceId = deviceId();
    writeMeta(meta);
  }

  /* ============================================================
     会话存储
     ============================================================ */
  function readSession() {
    const raw = readJson(SESSION_KEY, null);
    if (!isObject(raw) || !raw.access_token || !raw.refresh_token) return null;
    if (!isObject(raw.user) || !raw.user.id) return null;
    return raw;
  }

  function saveSession(session) {
    safeSet(SESSION_KEY, JSON.stringify(session));
    dispatch("lizzword:account-changed", { session: session, status: getStatus() });
  }

  function clearSession() {
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch (error) { /* ignore */ }
    dispatch("lizzword:account-changed", { session: null, status: getStatus() });
  }

  function normalizeSession(data) {
    if (!data || !data.access_token) return null;
    const user = data.user && typeof data.user === "object" ? data.user : {};
    const expiresIn = Number(data.expires_in) || 3600;
    return {
      access_token: String(data.access_token),
      refresh_token: String(data.refresh_token || ""),
      expires_at: Number(data.expires_at) || (Math.floor(Date.now() / 1000) + expiresIn),
      user: {
        id: String(user.id || ""),
        email: String(user.email || ""),
        display_name: user.user_metadata && user.user_metadata.display_name
          ? String(user.user_metadata.display_name)
          : ""
      },
      created_at: nowIso()
    };
  }

  function dispatch(name, detail) {
    try {
      document.dispatchEvent(new CustomEvent(name, { detail: detail }));
    } catch (error) { /* 老浏览器忽略 */ }
    refreshEntry();
  }

  /* ============================================================
     网络层：真实 Supabase 或 mock 适配器
     ============================================================ */
  async function request(opts) {
    const options = opts || {};
    if (ADAPTER && typeof ADAPTER.request === "function") {
      return ADAPTER.request(options);
    }

    const method = options.method || "GET";
    const path = options.path || "";
    const query = options.query ? "?" + options.query : "";
    const url = baseUrl() + path + query;
    const headers = {
      apikey: anonKey(),
      "Content-Type": "application/json"
    };
    if (options.token) headers.Authorization = "Bearer " + options.token;
    if (options.prefer) headers.Prefer = options.prefer;

    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timer = controller
      ? window.setTimeout(() => controller.abort(), Number(CFG.requestTimeoutMs) || 12000)
      : null;

    let response;
    try {
      response = await window.fetch(url, {
        method: method,
        headers: headers,
        body: options.body == null ? undefined : JSON.stringify(options.body),
        signal: controller ? controller.signal : undefined,
        cache: "no-store"
      });
    } catch (error) {
      if (timer) window.clearTimeout(timer);
      if (error && error.name === "AbortError") {
        const timeoutError = makeError(0, "请求超时");
        timeoutError.timeout = true;
        throw timeoutError;
      }
      throw makeError(0, "网络中断");
    }
    if (timer) window.clearTimeout(timer);

    let data = null;
    const text = await response.text().catch(() => "");
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (error) {
        data = text;
      }
    }
    if (!response.ok) {
      const message = (isObject(data) && (data.msg || data.message || data.error_description || data.error))
        || ("HTTP " + response.status);
      const code = (isObject(data) && data.code) ? String(data.code) : "";
      throw makeError(response.status, String(message), code);
    }
    return { status: response.status, data: data };
  }

  function makeError(status, message, code) {
    const error = new Error(message);
    error.status = status;
    error.code = code || "";
    error.isNetwork = status === 0 || status >= 500;
    return error;
  }

  // 表还没建（PGRST205）不是网络问题，不重试、不阻塞学习，只提示先初始化
  function isUninitialized(error) {
    if (!error) return false;
    if (String(error.code || "") === "PGRST205") return true;
    return /PGRST205|Could not find the table|relation .* does not exist|数据表不存在/i
      .test(String(error.message || ""));
  }

  function friendlyError(error) {
    const message = String((error && error.message) || "");
    const status = error && error.status;
    if (status === 0) {
      return error && error.timeout
        ? "连接云端超时（15 秒），本地数据已保留，请稍后重试。"
        : "网络不可用，已转入本地队列，稍后自动重试。";
    }
    if (/Invalid login credentials/i.test(message)) return "邮箱或密码不正确。";
    if (/Email not confirmed/i.test(message)) return "邮箱还没确认，请先点邮件里的确认链接。";
    if (/User already registered/i.test(message)) return "这个邮箱已经注册过了，直接登录即可。";
    if (/Password should be at least/i.test(message)) return "密码至少 6 位。";
    if (/Unable to validate email/i.test(message)) return "邮箱格式不正确。";
    if (/security purposes|rate limit/i.test(message)) return "操作太频繁，请稍等一会儿再试。";
    if (/duplicate key/i.test(message)) return "数据写入冲突，请稍后重试。";
    if (status === 401 || status === 403) return "登录已过期，请重新登录。";
    if (status === 404) return "云端未初始化：请在 Supabase 执行 books/lizz/sql/init.sql，再点「立即同步」。";
    return message || "操作失败，请稍后重试。";
  }

  /* ============================================================
     鉴权
     ============================================================ */
  async function signUp(email, password, displayName) {
    if (!isEnabled()) return { ok: false, reason: disabledReason(), message: disableMessage() };
    const cleanEmail = String(email || "").trim();
    const cleanPassword = String(password || "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return { ok: false, message: "邮箱格式不正确。" };
    if (cleanPassword.length < 6) return { ok: false, message: "密码至少 6 位。" };

    const body = {
      email: cleanEmail,
      password: cleanPassword,
      data: { display_name: String(displayName || "").trim() }
    };
    const redirect = String(CFG.emailRedirectTo || "").trim() || safeLocationHref();
    const query = redirect ? "redirect_to=" + encodeURIComponent(redirect) : "";

    try {
      const res = await request({ method: "POST", path: "/auth/v1/signup", query: query, body: body });
      const session = normalizeSession(res.data);
      if (session) {
        saveSession(session);
        await syncNow({ force: true });
        return { ok: true, signedIn: true, needConfirm: false, session: session };
      }
      return { ok: true, signedIn: false, needConfirm: true, message: "注册成功，请到邮箱点确认链接，再回来登录。" };
    } catch (error) {
      return { ok: false, message: friendlyError(error), error: error };
    }
  }

  async function signIn(email, password) {
    if (!isEnabled()) return { ok: false, reason: disabledReason(), message: disableMessage() };
    const cleanEmail = String(email || "").trim();
    const cleanPassword = String(password || "");
    if (!cleanEmail || !cleanPassword) return { ok: false, message: "请填写邮箱和密码。" };

    try {
      const res = await request({
        method: "POST",
        path: "/auth/v1/token",
        query: "grant_type=password",
        body: { email: cleanEmail, password: cleanPassword }
      });
      const session = normalizeSession(res.data);
      if (!session) return { ok: false, message: "登录失败，请稍后重试。" };
      saveSession(session);
      await syncNow({ force: true });
      return { ok: true, session: session };
    } catch (error) {
      return { ok: false, message: friendlyError(error), error: error };
    }
  }

  async function signOut() {
    const session = readSession();
    if (session) {
      try {
        await request({ method: "POST", path: "/auth/v1/logout", token: session.access_token });
      } catch (error) {
        /* 退出登录以本地为准，网络失败也不阻塞 */
      }
    }
    clearSession();
    clearQueue();
    cloudCache.study = null;
    cloudCache.lizz = null;
    lastSyncAt.study = "";
    lastSyncAt.lizz = "";
    renderPanel();
    return { ok: true };
  }

  async function ensureFreshSession() {
    const session = readSession();
    if (!session) return null;
    const nowSec = Math.floor(Date.now() / 1000);
    if (Number(session.expires_at) - 90 > nowSec) return session;

    try {
      const res = await request({
        method: "POST",
        path: "/auth/v1/token",
        query: "grant_type=refresh_token",
        body: { refresh_token: session.refresh_token }
      });
      const refreshed = normalizeSession(res.data);
      if (!refreshed) throw makeError(401, "refresh failed");
      if (!refreshed.user.id) refreshed.user.id = session.user.id;
      refreshed.user.email = refreshed.user.email || session.user.email;
      safeSet(SESSION_KEY, JSON.stringify(refreshed));
      dispatch("lizzword:account-changed", { session: refreshed, status: getStatus() });
      return refreshed;
    } catch (error) {
      if (!error || !error.isNetwork) {
        clearSession();
        renderPanel();
        return null;
      }
      return session; // 断网时先用旧 token，排队稍后重试
    }
  }

  function safeLocationHref() {
    try {
      if (isFileMode) return "";
      return window.location.href.split("#")[0];
    } catch (error) {
      return "";
    }
  }

  /* ============================================================
     合并算法
     ============================================================ */
  function unionList(a, b) {
    const out = [];
    const seen = Object.create(null);
    [a, b].forEach((list) => {
      if (!Array.isArray(list)) return;
      list.forEach((item) => {
        if (typeof item !== "string" || seen[item]) return;
        seen[item] = true;
        out.push(item);
      });
    });
    return out;
  }

  function maxMap(a, b) {
    const out = {};
    const pick = (src) => {
      if (!isObject(src)) return;
      Object.keys(src).forEach((key) => {
        const value = Number(src[key]) || 0;
        out[key] = Math.max(Number(out[key]) || 0, value);
      });
    };
    pick(a);
    pick(b);
    return out;
  }

  function laterDate(a, b) {
    const left = typeof a === "string" ? a : "";
    const right = typeof b === "string" ? b : "";
    if (!left) return right;
    if (!right) return left;
    return left >= right ? left : right;
  }

  function pickReviewEntry(a, b, newerEntry) {
    if (!isObject(a)) return clone(b);
    if (!isObject(b)) return clone(a);
    if (a.mastered === true && b.mastered !== true) return clone(a);
    if (b.mastered === true && a.mastered !== true) return clone(b);

    const leftReviewed = typeof a.lastReviewed === "string" ? a.lastReviewed : "";
    const rightReviewed = typeof b.lastReviewed === "string" ? b.lastReviewed : "";
    if (leftReviewed !== rightReviewed) return clone(leftReviewed > rightReviewed ? a : b);

    const leftNode = Number(a.node) || 0;
    const rightNode = Number(b.node) || 0;
    if (leftNode !== rightNode) return clone(leftNode > rightNode ? a : b);

    const leftDue = typeof a.due === "string" ? a.due : "";
    const rightDue = typeof b.due === "string" ? b.due : "";
    if (leftDue && rightDue && leftDue !== rightDue) return clone(leftDue < rightDue ? a : b);

    return clone(newerEntry);
  }

  function mergeReviewPool(a, b, newerPool) {
    const out = {};
    const left = isObject(a) ? a : {};
    const right = isObject(b) ? b : {};
    const newer = isObject(newerPool) ? newerPool : {};
    const keys = new Set(Object.keys(left).concat(Object.keys(right)));
    keys.forEach((word) => {
      out[word] = pickReviewEntry(left[word], right[word], newer[word] !== undefined ? newer[word] : left[word]);
    });
    return out;
  }

  function dedupeHistory(a, b) {
    const out = [];
    const seen = Object.create(null);
    [a, b].forEach((list) => {
      if (!Array.isArray(list)) return;
      list.forEach((row) => {
        if (!row || typeof row !== "object") return;
        const sig = [row.date || "", row.word || "", row.node, Boolean(row.correct)].join("|");
        if (seen[sig]) return;
        seen[sig] = true;
        out.push(row);
      });
    });
    out.sort((x, y) => String(x.date || "").localeCompare(String(y.date || "")));
    return out.slice(-200);
  }

  /* 学习进度：集合类取并集，可冲突标量按较新快照为准 */
  function mergeStudy(localState, remoteState, localNewer) {
    const newer = localNewer ? localState : remoteState;
    const older = localNewer ? remoteState : localState;
    const out = clone(newer);
    if (!isObject(out)) return isObject(localState) ? clone(localState) : clone(remoteState);

    ["learnedEver", "introSeen", "stage1Done", "stage2Done", "stage2bDone", "writeDone", "speakDone"]
      .forEach((field) => {
        out[field] = unionList(newer[field], older[field]);
      });

    out.reviewPool = mergeReviewPool(newer.reviewPool, older.reviewPool, newer.reviewPool);

    if (Array.isArray(newer.srsHistory) || Array.isArray(older.srsHistory)) {
      out.srsHistory = dedupeHistory(newer.srsHistory, older.srsHistory);
    }

    out.lastSeen = maxMap(newer.lastSeen, older.lastSeen);
    out.cooldownUntil = maxMap(newer.cooldownUntil, older.cooldownUntil);

    const wrongA = isObject(newer.stageWrong) ? newer.stageWrong : {};
    const wrongB = isObject(older.stageWrong) ? older.stageWrong : {};
    out.stageWrong = {};
    Object.keys(Object.assign({}, wrongA, wrongB)).forEach((key) => {
      out.stageWrong[key] = Math.max(Number(wrongA[key]) || 0, Number(wrongB[key]) || 0);
    });

    out.answerSeq = Math.max(Number(newer.answerSeq) || 0, Number(older.answerSeq) || 0);
    out.wrongCount = Number(newer.wrongCount) || 0;
    if (newer.wrongDate && newer.wrongDate === older.wrongDate) {
      out.wrongCount = Math.max(Number(newer.wrongCount) || 0, Number(older.wrongCount) || 0);
    }
    if (newer.groupStatsDate && newer.groupStatsDate === older.groupStatsDate) {
      out.groupsToday = Math.max(Number(newer.groupsToday) || 0, Number(older.groupsToday) || 0);
      out.wordsToday = Math.max(Number(newer.wordsToday) || 0, Number(older.wordsToday) || 0);
    }

    if (!isObject(out.reviewSession) && isObject(older.reviewSession)) out.reviewSession = clone(older.reviewSession);
    if (!isObject(out.learnSummary) && isObject(older.learnSummary)) out.learnSummary = clone(older.learnSummary);

    const startedA = typeof newer.startedAt === "string" ? newer.startedAt : "";
    const startedB = typeof older.startedAt === "string" ? older.startedAt : "";
    if (startedA && startedB) out.startedAt = startedA < startedB ? startedA : startedB;
    return out;
  }

  function mergeShop(localShop, remoteShop, newerShop) {
    const a = isObject(localShop) ? localShop : {};
    const b = isObject(remoteShop) ? remoteShop : {};
    const newer = isObject(newerShop) ? newerShop : a;
    const owned = unionList(a.owned, b.owned);
    const equippedA = typeof a.equipped === "string" ? a.equipped : "";
    const equippedB = typeof b.equipped === "string" ? b.equipped : "";
    let equipped = typeof newer.equipped === "string" ? newer.equipped : "";
    if (!equipped) equipped = equippedA || equippedB;
    if (equipped && !owned.includes(equipped)) equipped = "";

    const words = {
      date: "",
      lastWords: 0,
      counted: 0,
      awarded: 0
    };
    const wa = isObject(a.words) ? a.words : {};
    const wb = isObject(b.words) ? b.words : {};
    const wNew = isObject(newer.words) ? newer.words : wa;
    words.date = typeof wNew.date === "string" ? wNew.date : "";
    const sameDay = wa.date && wb.date && wa.date === wb.date;
    words.lastWords = sameDay ? Math.max(Number(wa.lastWords) || 0, Number(wb.lastWords) || 0) : Number(wNew.lastWords) || 0;
    words.counted = sameDay ? Math.max(Number(wa.counted) || 0, Number(wb.counted) || 0) : Number(wNew.counted) || 0;
    words.awarded = sameDay ? Math.max(Number(wa.awarded) || 0, Number(wb.awarded) || 0) : Number(wNew.awarded) || 0;

    const feedA = isObject(a.feed) ? a.feed : {};
    const feedB = isObject(b.feed) ? b.feed : {};
    const feedNew = isObject(newer.feed) ? newer.feed : feedA;
    const feed = { date: "", used: 0 };
    feed.date = typeof feedNew.date === "string" ? feedNew.date : "";
    feed.used = (feedA.date && feedB.date && feedA.date === feedB.date)
      ? Math.max(Number(feedA.used) || 0, Number(feedB.used) || 0)
      : Number(feedNew.used) || 0;

    // 积分是余额：以较新快照为准；已购置装扮永远取并集，不会因合并而丢
    const points = Number(newer.points) || 0;

    const ledger = [];
    const seen = Object.create(null);
    [a.ledger, b.ledger].forEach((list) => {
      if (!Array.isArray(list)) return;
      list.forEach((row) => {
        if (!isObject(row) || !(Number(row.amount) > 0)) return;
        const sig = [row.at || 0, row.type || "", row.amount].join("|");
        if (seen[sig]) return;
        seen[sig] = true;
        ledger.push(row);
      });
    });
    ledger.sort((x, y) => (Number(x.at) || 0) - (Number(y.at) || 0));

    const reviewA = isObject(a.review) ? a.review : {};
    const reviewB = isObject(b.review) ? b.review : {};
    return {
      points: Math.max(0, Math.floor(points)),
      owned: owned,
      equipped: equipped,
      words: words,
      review: {
        lastAwardDate: laterDate(
          laterDate(reviewA.lastAwardDate, reviewB.lastAwardDate),
          isObject(newer.review) ? newer.review.lastAwardDate : ""
        )
      },
      feed: feed,
      ledger: ledger.slice(-30)
    };
  }

  /* Lizz 状态：数值取大、布尔取或、商店单独合并 */
  function mergeLizz(localState, remoteState, localNewer) {
    const newer = localNewer ? localState : remoteState;
    const older = localNewer ? remoteState : localState;
    const out = clone(newer);
    if (!isObject(out)) return isObject(localState) ? clone(localState) : clone(remoteState);

    out.tutorialDone = Boolean(newer.tutorialDone || older.tutorialDone);
    out.introSeen = Boolean(newer.introSeen || older.introSeen);
    out.tutorialSkippedAt = laterDate(newer.tutorialSkippedAt, older.tutorialSkippedAt);
    out.tutorialFinishedAt = laterDate(newer.tutorialFinishedAt, older.tutorialFinishedAt);
    out.food = Math.max(Number(newer.food) || 0, Number(older.food) || 0);
    out.foodReacted = Math.max(Number(newer.foodReacted) || 0, Number(older.foodReacted) || 0);
    out.softHideCount = Math.max(Number(newer.softHideCount) || 0, Number(older.softHideCount) || 0);
    out.hiddenAt = laterDate(newer.hiddenAt, older.hiddenAt);
    out.praiseAt = laterDate(newer.praiseAt, older.praiseAt);
    out.shop = mergeShop(newer.shop, older.shop, newer.shop);
    out.updatedAt = laterDate(newer.updatedAt, older.updatedAt) || nowIso();
    return out;
  }

  function mergeDataset(name, localState, remoteState, localNewer) {
    return name === "study"
      ? mergeStudy(localState, remoteState, localNewer)
      : mergeLizz(localState, remoteState, localNewer);
  }

  /* ============================================================
     本地读写
     ============================================================ */
  function readLocal(name) {
    const def = DATASETS[name];
    const parsed = readJson(def.key, null);
    if (!isObject(parsed)) return null;
    const meta = readMeta();
    return {
      state: parsed,
      at: typeof meta.updatedAt[name] === "string" ? meta.updatedAt[name] : ""
    };
  }

  function writeLocal(name, state) {
    internalWrites += 1;
    try {
      safeSet(DATASETS[name].key, JSON.stringify(state));
      const meta = readMeta();
      meta.updatedAt[name] = nowIso();
      meta.deviceId = deviceId();
      writeMeta(meta);
    } finally {
      internalWrites = Math.max(0, internalWrites - 1);
    }
  }

  function localNewerThanRemote(name, remoteRow) {
    const meta = readMeta();
    const localAt = typeof meta.updatedAt[name] === "string" ? meta.updatedAt[name] : "";
    if (!localAt) return false;
    const localMs = Date.parse(localAt) || 0;
    // client_rev 是写入方客户端的毫秒时间戳，双方同为客户端时钟，
    // 比“本机时钟 vs 服务器时钟”更不容易被时区/时钟漂移带偏
    const remoteClientMs = remoteRow && Number(remoteRow.client_rev) > 0
      ? Number(remoteRow.client_rev)
      : 0;
    const remoteMs = remoteClientMs
      || (remoteRow && typeof remoteRow.updated_at === "string" ? Date.parse(remoteRow.updated_at) : 0)
      || 0;
    return localMs > remoteMs;
  }

  /* ============================================================
     离线队列
     ============================================================ */
  function readQueue() {
    const raw = readJson(QUEUE_KEY, null);
    if (!Array.isArray(raw)) return [];
    return raw.filter((row) => isObject(row) && DATASETS[row.dataset]);
  }

  function writeQueue(queue) {
    safeSet(QUEUE_KEY, JSON.stringify(queue.slice(-10)));
  }

  function clearQueue() {
    try {
      window.localStorage.removeItem(QUEUE_KEY);
    } catch (error) { /* ignore */ }
  }

  function enqueue(name) {
    const queue = readQueue().filter((row) => row.dataset !== name);
    const previous = readQueue().find((row) => row.dataset === name);
    const attempts = previous ? Number(previous.attempts) || 0 : 0;
    const delay = RETRY_DELAYS[Math.min(attempts, RETRY_DELAYS.length - 1)];
    queue.push({
      dataset: name,
      attempts: attempts + 1,
      nextAt: Date.now() + delay,
      at: nowIso()
    });
    writeQueue(queue);
    scheduleQueueFlush();
  }

  function dequeue(name) {
    const queue = readQueue().filter((row) => row.dataset !== name);
    writeQueue(queue);
  }

  function scheduleQueueFlush() {
    if (queueTimer) window.clearTimeout(queueTimer);
    const queue = readQueue();
    if (!queue.length) return;
    const soonest = queue.reduce((min, row) => Math.min(min, Number(row.nextAt) || 0), Infinity);
    const delay = Math.max(6000, Math.min(60000, (Number.isFinite(soonest) ? soonest : Date.now()) - Date.now()));
    queueTimer = window.setTimeout(() => {
      queueTimer = null;
      if (!readSession() || !isEnabled()) return;
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        scheduleQueueFlush();
        return;
      }
      flushQueue();
    }, delay);
  }

  async function flushQueue() {
    const queue = readQueue();
    if (!queue.length) return { ok: true, flushed: 0 };
    if (!readSession()) return { ok: false, reason: "no-session" };
    const pending = queue.filter((row) => Number(row.nextAt) <= Date.now());
    if (!pending.length) {
      scheduleQueueFlush();
      return { ok: true, flushed: 0 };
    }
    await syncNow({ force: true });
    const remaining = readQueue();
    if (remaining.length) scheduleQueueFlush();
    return { ok: remaining.length === 0, flushed: pending.length };
  }

  /* ============================================================
     同步主流程
     ============================================================ */
  async function pullRow(name, session) {
    const def = DATASETS[name];
    const res = await request({
      method: "GET",
      path: "/rest/v1/" + def.table,
      query: "select=*&user_id=eq." + encodeURIComponent(session.user.id) + "&limit=1",
      token: session.access_token
    });
    const rows = Array.isArray(res.data) ? res.data : (isObject(res.data) ? [res.data] : []);
    return rows.length ? rows[0] : null;
  }

  async function pushRow(name, state, session) {
    const def = DATASETS[name];
    const body = [{
      user_id: session.user.id,
      state: state,
      device_id: deviceId(),
      client_rev: Date.now()
    }];
    const res = await request({
      method: "POST",
      path: "/rest/v1/" + def.table,
      query: "on_conflict=user_id",
      body: body,
      token: session.access_token,
      prefer: "resolution=merge-duplicates,return=representation"
    });
    const rows = Array.isArray(res.data) ? res.data : [];
    return rows.length ? rows[0] : null;
  }

  async function syncDataset(name, session, options) {
    const opts = options || {};
    const def = DATASETS[name];
    const local = readLocal(name);
    let remote = cloudCache[name];

    if (opts.full || !remote) {
      remote = await pullRow(name, session);
      cloudCache[name] = remote;
    }

    let merged = null;
    if (local && remote && isObject(remote.state)) {
      merged = mergeDataset(name, local.state, remote.state, localNewerThanRemote(name, remote));
    } else if (local) {
      merged = local.state;
    } else if (remote && isObject(remote.state)) {
      merged = remote.state;
    }

    if (!merged) {
      lastSyncAt[name] = nowIso();
      return { name: name, ok: true, empty: true };
    }

    writeLocal(name, merged);

    const row = await pushRow(name, merged, session);
    if (row) cloudCache[name] = row;
    lastSyncAt[name] = nowIso();
    return { name: name, ok: true, bytes: JSON.stringify(merged).length };
  }

  async function syncNow(options) {
    const opts = options || {};
    if (!isEnabled()) return { ok: false, reason: disabledReason() || "disabled", message: disableMessage() };

    // 已知云端未初始化：自动同步直接跳过（不发请求、不入队），只有手动重试才真正探一次
    if (cloudUninitialized && !opts.manual && readSession()) {
      renderPanel();
      return { ok: false, reason: "uninitialized", message: uninitializedMessage() };
    }

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      if (!cloudUninitialized) {
        ["study", "lizz"].forEach((name) => { if (readLocal(name)) enqueue(name); });
      }
      lastError = "网络不可用，已排队等待重试。";
      renderPanel();
      return { ok: false, reason: "offline", message: lastError };
    }

    const session = await ensureFreshSession();
    if (!session) return { ok: false, reason: "no-session", message: "请先登录。" };

    if (syncing) {
      syncAgain = true;
      if (!opts.manual) return { ok: false, reason: "busy" };
      // 手动「立即同步」时等一轮后台同步结束，避免误报 busy
      for (let i = 0; i < 24 && syncing; i += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 250));
      }
      if (syncing) return { ok: false, reason: "busy" };
    }

    syncing = true;
    lastError = "";
    const results = [];
    let failed = [];
    let uninitialized = false;
    try {
      for (const name of Object.keys(DATASETS)) {
        try {
          results.push(await syncDataset(name, session, { full: opts.force !== false && opts.full !== false }));
          dequeue(name);
        } catch (error) {
          failed.push(name);
          if (isUninitialized(error)) {
            uninitialized = true;
            lastError = uninitializedMessage();
          } else {
            enqueue(name);
            lastError = friendlyError(error);
            if (error && (error.status === 401 || error.status === 403)) {
              clearSession();
            }
          }
        }
      }
      cloudUninitialized = uninitialized;
      const ok = failed.length === 0;
      dispatch("lizzword:account-sync", { ok: ok, datasets: results, error: lastError });
      renderPanel();
      return {
        ok: ok,
        reason: uninitialized ? "uninitialized" : (failed.length ? "sync-failed" : ""),
        results: results,
        error: lastError,
        queued: uninitialized ? [] : failed
      };
    } finally {
      syncing = false;
      if (syncAgain) {
        syncAgain = false;
        window.setTimeout(() => { syncNow({ force: false }); }, 800);
      }
      if (readQueue().length) scheduleQueueFlush();
    }
  }

  function uninitializedMessage() {
    return "云端未初始化：请在 Supabase SQL Editor 执行 books/lizz/sql/init.sql，然后点「立即同步」。学习进度仍保存在本机。";
  }

  function scheduleSync(delay) {
    if (!isEnabled() || !readSession()) return;
    if (pushTimer) window.clearTimeout(pushTimer);
    pushTimer = window.setTimeout(() => {
      pushTimer = null;
      syncNow({ force: false });
    }, Math.max(600, Number(delay) || Number(CFG.pushDebounceMs) || 3000));
  }

  /* ============================================================
     监听本地写入（本地优先 + 自动推送）
     ============================================================ */
  function hookLocalStorage() {
    if (storageHooked) return;
    try {
      const ls = window.localStorage;
      const original = ls.setItem.bind(ls);
      ls.setItem = function (key, value) {
        original(key, value);
        if (internalWrites > 0) return;
        const name = Object.keys(DATASETS).find((item) => DATASETS[item].key === key);
        if (!name) return;
        touchLocalMeta(name);
        scheduleSync();
      };
      storageHooked = true;
    } catch (error) {
      /* 某些环境不允许改写 localStorage，退化为定时轮询同步 */
    }
  }

  /* ============================================================
     状态快照
     ============================================================ */
  function getSnapshot() {
    const session = readSession();
    return {
      enabled: isEnabled(),
      disabledReason: disabledReason(),
      mock: isMock(),
      fileMode: isFileMode,
      session: session ? { email: session.user.email, id: session.user.id } : null,
      lastSyncAt: lastSyncAt.study || lastSyncAt.lizz || "",
      lastSync: { study: lastSyncAt.study, lizz: lastSyncAt.lizz },
      queue: readQueue().map((row) => ({ dataset: row.dataset, attempts: row.attempts, nextAt: row.nextAt })),
      error: lastError,
      configReady: configReady(),
      cloudUninitialized: cloudUninitialized,
      local: {
        study: Boolean(readLocal("study")),
        lizz: Boolean(readLocal("lizz"))
      }
    };
  }

  function getStatus() {
    return getSnapshot();
  }

  function getQueue() {
    return readQueue();
  }

  function getSession() {
    return readSession();
  }

  function disableMessage() {
    const reason = disabledReason();
    if (reason === "file") return "在 file:// 下账号与云同步已自动关闭，本地学习不受影响。用 http(s) 打开或线上站点即可登录。";
    if (reason === "config") return "云端尚未配置：请在 books/lizz/account-config.js 填入 Supabase 的 Project URL 与 anon key。";
    if (reason === "disabled") return "账号功能当前已关闭。";
    return "";
  }

  /* ============================================================
     界面
     ============================================================ */
  function ensurePanel() {
    if (panel) return panel;
    panel = document.createElement("div");
    panel.className = "lz-acc";
    panel.id = "lzAccount";
    panel.hidden = true;
    panel.innerHTML = `
      <div class="lz-acc-backdrop" data-acc-close></div>
      <div class="lz-acc-shell" role="dialog" aria-modal="true" aria-labelledby="lzAccTitle">
        <header class="lz-acc-top">
          <div>
            <p class="lz-acc-kicker">LIZZ CLOUD</p>
            <h2 class="lz-acc-title" id="lzAccTitle">云端账号</h2>
          </div>
          <button type="button" class="lz-acc-close" data-acc-close aria-label="关闭">×</button>
        </header>
        <div class="lz-acc-body" id="lzAccBody"></div>
      </div>`;
    document.body.appendChild(panel);
    panel.addEventListener("click", onPanelClick);
    panel.addEventListener("submit", onPanelSubmit);
    renderPanel();
    return panel;
  }

  function renderPanel() {
    refreshEntry();
    if (!panel) return;
    const body = panel.querySelector("#lzAccBody");
    if (!body) return;
    const snapshot = getSnapshot();

    if (!snapshot.enabled) {
      body.innerHTML = `
        <p class="lz-acc-notice">${esc(disableMessage())}</p>
        <div class="lz-acc-actions">
          <button type="button" class="lz-acc-btn" data-acc-close>知道了</button>
        </div>`;
      return;
    }

    if (!snapshot.session) {
      body.innerHTML = `
        <p class="lz-acc-hint">登录后，学习进度、积分和已购置装扮会在云端合并同步。未登录时一切照旧只存在本机。</p>
        <div class="lz-acc-tabs" role="tablist">
          <button type="button" class="lz-acc-tab is-active" data-acc-tab="login" role="tab" aria-selected="true">登录</button>
          <button type="button" class="lz-acc-tab" data-acc-tab="signup" role="tab" aria-selected="false">注册</button>
        </div>
        <form class="lz-acc-form" data-acc-form="login" autocomplete="on">
          <label class="lz-acc-field">
            <span>邮箱</span>
            <input type="email" name="email" inputmode="email" autocomplete="email" placeholder="you@example.com" required>
          </label>
          <label class="lz-acc-field">
            <span>密码</span>
            <input type="password" name="password" autocomplete="current-password" placeholder="至少 6 位" minlength="6" required>
          </label>
          <p class="lz-acc-error" data-acc-error hidden></p>
          <button type="submit" class="lz-acc-btn lz-acc-primary">登录并同步</button>
        </form>
        <form class="lz-acc-form" data-acc-form="signup" autocomplete="on" hidden>
          <label class="lz-acc-field">
            <span>邮箱</span>
            <input type="email" name="email" inputmode="email" autocomplete="email" placeholder="you@example.com" required>
          </label>
          <label class="lz-acc-field">
            <span>密码</span>
            <input type="password" name="password" autocomplete="new-password" placeholder="至少 6 位" minlength="6" required>
          </label>
          <label class="lz-acc-field">
            <span>昵称（可选）</span>
            <input type="text" name="displayName" autocomplete="nickname" maxlength="40" placeholder="Lizz 怎么称呼你">
          </label>
          <p class="lz-acc-error" data-acc-error hidden></p>
          <button type="submit" class="lz-acc-btn lz-acc-primary">注册账号</button>
        </form>
        <p class="lz-acc-foot">${snapshot.mock ? "当前为本地 mock 后端，仅用于流程验收。" : "密码由 Supabase Auth 托管，本站不保存明文。"}</p>`;
      return;
    }

    const syncText = snapshot.cloudUninitialized
      ? "云端未初始化"
      : (snapshot.lastSyncAt ? "上次同步 " + formatTime(snapshot.lastSyncAt) : "尚未同步");
    const queueText = snapshot.queue.length
      ? `待重试 ${snapshot.queue.length} 项`
      : "无待重试";
    const errorText = snapshot.cloudUninitialized ? "" : snapshot.error;
    body.innerHTML = `
      ${snapshot.cloudUninitialized ? `<p class="lz-acc-notice">${esc(uninitializedMessage())}</p>` : ""}
      <div class="lz-acc-profile">
        <div class="lz-acc-avatar" aria-hidden="true">${accountEmoji()}</div>
        <div class="lz-acc-profile-info">
          <b>${esc(snapshot.session.email)}</b>
          <span>${snapshot.mock ? "mock 后端" : "Supabase 云端"}</span>
        </div>
      </div>
      <div class="lz-acc-meta">
        <div><span>同步状态</span><b>${esc(syncText)}</b></div>
        <div><span>队列</span><b>${esc(queueText)}</b></div>
        <div><span>本机进度</span><b>${snapshot.local.study ? "已有" : "暂无"} · ${snapshot.local.lizz ? "Lizz 已有" : "Lizz 暂无"}</b></div>
      </div>
      <p class="lz-acc-error" data-acc-error ${errorText ? "" : "hidden"}>${esc(errorText)}</p>
      <div class="lz-acc-actions">
        <button type="button" class="lz-acc-btn lz-acc-primary" data-acc-sync>立即同步</button>
        <button type="button" class="lz-acc-btn" data-acc-signout>退出登录</button>
      </div>
      <p class="lz-acc-foot">退出登录不会删除本机数据，学习流程照旧。</p>`;
  }

  /* ---------- 主页面入口按钮（homeBookBar 内） ---------- */
  function entryLabel() {
    const snapshot = getSnapshot();
    if (!snapshot.session) return "登录 / 注册";
    if (snapshot.cloudUninitialized) return "账号 · 未初始化";
    if (snapshot.error) return "账号 · 待同步";
    if (snapshot.lastSyncAt) return "账号 · 已同步";
    return "账号 · 已登录";
  }

  function refreshEntry() {
    const nodes = document.querySelectorAll("[data-account-entry]");
    for (let i = 0; i < nodes.length; i += 1) {
      const label = entryLabel();
      if (nodes[i].textContent !== label) nodes[i].textContent = label;
      nodes[i].setAttribute("data-account-state",
        !getSession() ? "guest" : (cloudUninitialized ? "uninitialized" : "user"));
    }
  }

  function watchEntry() {
    const mount = document.getElementById("view-home");
    if (!mount || typeof MutationObserver !== "function") return;
    if (entryObserver) entryObserver.disconnect();
    let scheduled = false;
    entryObserver = new MutationObserver(function () {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(function () {
        scheduled = false;
        refreshEntry();
      });
    });
    entryObserver.observe(mount, { childList: true, subtree: true });
  }

  function accountEmoji() {
    return "🦊";
  }

  function formatTime(iso) {
    try {
      const date = new Date(iso);
      if (Number.isNaN(date.getTime())) return String(iso);
      const pad = (n) => String(n).padStart(2, "0");
      return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    } catch (error) {
      return String(iso);
    }
  }

  function setPanelError(message) {
    if (!panel) return;
    const el = panel.querySelector("[data-acc-error]");
    if (!el) return;
    el.textContent = message || "";
    el.hidden = !message;
  }

  function switchTab(tab) {
    if (!panel) return;
    panel.querySelectorAll("[data-acc-tab]").forEach((btn) => {
      const active = btn.getAttribute("data-acc-tab") === tab;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    panel.querySelectorAll("[data-acc-form]").forEach((form) => {
      form.hidden = form.getAttribute("data-acc-form") !== tab;
    });
    setPanelError("");
  }

  async function onPanelSubmit(event) {
    const form = event.target.closest("[data-acc-form]");
    if (!form) return;
    event.preventDefault();
    const kind = form.getAttribute("data-acc-form");
    const data = new FormData(form);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    const submit = form.querySelector("button[type=submit]");
    if (submit) {
      submit.disabled = true;
      submit.dataset.label = submit.textContent;
      submit.textContent = kind === "signup" ? "注册中…" : "登录中…";
    }
    setPanelError("");
    try {
      const result = kind === "signup"
        ? await signUp(email, password, String(data.get("displayName") || ""))
        : await signIn(email, password);
      if (result.ok && result.needConfirm) {
        setPanelError(result.message || "");
        switchTab("login");
        return;
      }
      if (!result.ok) {
        setPanelError(result.message || "操作失败");
        return;
      }
      renderPanel();
    } finally {
      if (submit) {
        submit.disabled = false;
        submit.textContent = submit.dataset.label || "提交";
      }
    }
  }

  async function onPanelClick(event) {
    if (event.target.closest("[data-acc-close]")) {
      close();
      return;
    }
    const tab = event.target.closest("[data-acc-tab]");
    if (tab) {
      switchTab(tab.getAttribute("data-acc-tab"));
      return;
    }
    if (event.target.closest("[data-acc-sync]")) {
      const btn = event.target.closest("[data-acc-sync]");
      btn.disabled = true;
      btn.textContent = "同步中…";
      const result = await syncNow({ force: true, manual: true });
      if (result && !result.ok && result.message) setPanelError(result.message);
      renderPanel();
      return;
    }
    if (event.target.closest("[data-acc-signout]")) {
      await signOut();
      renderPanel();
    }
  }

  function onKeydown(event) {
    if (event.key === "Escape" && panel && !panel.hidden) close();
  }

  function open() {
    if (!initialized) init();
    ensurePanel();
    lastFocus = document.activeElement;
    renderPanel();
    panel.hidden = false;
    document.body.classList.add("lz-acc-open");
    window.requestAnimationFrame(() => panel.classList.add("is-open"));
    document.addEventListener("keydown", onKeydown);
    const first = panel.querySelector("input, button");
    if (first) first.focus();
    if (isEnabled() && readSession()) syncNow({ force: false });
  }

  function close() {
    if (!panel || panel.hidden) return;
    panel.classList.remove("is-open");
    document.body.classList.remove("lz-acc-open");
    window.setTimeout(() => {
      if (panel && !panel.classList.contains("is-open")) panel.hidden = true;
    }, 180);
    document.removeEventListener("keydown", onKeydown);
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    lastFocus = null;
  }

  function toggle() {
    if (panel && !panel.hidden) close();
    else open();
  }

  function isOpen() {
    return Boolean(panel && !panel.hidden);
  }

  /* ============================================================
     初始化
     ============================================================ */
  function init() {
    if (initialized) return;
    initialized = true;

    if (disabledReason() === "config" && !isFileMode) {
      noticeText = disableMessage();
      try {
        console.info("[LIZZWORD] 云端账号未配置：" + noticeText);
      } catch (error) { /* ignore */ }
    }

    hookLocalStorage();

    // 主页面入口按钮：文案随登录态变化，点击打开账号面板
    refreshEntry();
    watchEntry();
    document.addEventListener("click", onEntryClick);

    if (isEnabled()) {
      if (readSession()) {
        // 登录状态：启动后先做一次轻量合并，再挂轮询
        window.setTimeout(() => syncNow({ force: false }), 1200);
      }
      pollTimer = window.setInterval(() => {
        if (document.visibilityState === "hidden") return;
        if (!readSession()) return;
        if (typeof navigator !== "undefined" && navigator.onLine === false) return;
        syncNow({ force: false });
      }, Math.max(15000, Number(CFG.syncIntervalMs) || 60000));
      if (readQueue().length) scheduleQueueFlush();
    }

    window.addEventListener("online", () => {
      if (readSession()) {
        lastError = "";
        syncNow({ force: true });
      }
    });
    window.addEventListener("offline", () => {
      if (readSession()) {
        lastError = "网络不可用，已排队等待重试。";
        renderPanel();
      }
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && readSession() && isEnabled()) {
        syncNow({ force: false });
      }
    });
    refreshEntry();
  }

  function onEntryClick(event) {
    const target = event.target && event.target.closest ? event.target.closest("[data-account-entry]") : null;
    if (!target) return;
    event.preventDefault();
    open();
  }

  window.LIZZWORD_ACCOUNT = {
    init: init,
    open: open,
    close: close,
    toggle: toggle,
    isOpen: isOpen,
    signUp: signUp,
    signIn: signIn,
    signOut: signOut,
    syncNow: syncNow,
    flushQueue: flushQueue,
    getStatus: getStatus,
    getSnapshot: getSnapshot,
    getSession: getSession,
    getQueue: getQueue,
    isEnabled: isEnabled,
    isMock: isMock,
    isFileMode: isFileMode,
    mergeStudy: mergeStudy,
    mergeLizz: mergeLizz,
    DATASETS: DATASETS
  };
})();
