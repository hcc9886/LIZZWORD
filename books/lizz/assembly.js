/* ============================================================
   LIZZWORD · 「写」阶段拼装模块（独立运行）
   ------------------------------------------------------------
   目标：把整词拼写升级为「意群拼装」，并保证任何情况下都不阻断流程。
   选句优先级（四级）：
     1) 共享语境句库（LIZZREAD / 本地共享句索引）
     2) 原有 22 字段词条里的例句（example / examples / sentence / scene）
     3) 在线 LLM 生成（受控约束，失败重试一次）
     4) 回退整词拼写（原逻辑）
   存储：IndexedDB `lizzword_local`
     - sentence_cache   句子缓存（抽取句 + 生成句）
     - sentence_index   lemma → sentence_id 倒排缓存
     - assembly_queue   拼装卡（独立 FSRS，不碰单词卡）
   无 IndexedDB 时自动退回 localStorage，接口不变。
   ============================================================ */
(function (global) {
  "use strict";

  const DB_NAME = "lizzword_local";
  const DB_VERSION = 1;
  const STORES = ["sentence_cache", "sentence_index", "assembly_queue"];
  const LS_PREFIX = "lizzword_asm_";

  let dbPromise = null;
  let indexed = null;        // lemma -> [sentence_id]
  let sharedLoaded = false;
  let llmCaller = null;      // function(prompt) -> Promise<string>

  // ---------- 存储层（IndexedDB 优先，localStorage 兜底） ----------
  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve) => {
      if (typeof indexedDB === "undefined") { resolve(null); return; }
      let req;
      try { req = indexedDB.open(DB_NAME, DB_VERSION); } catch (e) { resolve(null); return; }
      req.onupgradeneeded = () => {
        const db = req.result;
        for (const name of STORES) if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: name === "assembly_queue" ? "card_id" : "sentence_id" });
        if (!db.objectStoreNames.contains("sentence_index")) db.createObjectStore("sentence_index", { keyPath: "lemma" });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
    return dbPromise;
  }

  function lsKey(store, id) { return LS_PREFIX + store + ":" + id; }

  function lsWrite(store, id, value) {
    try { global.localStorage.setItem(lsKey(store, id), JSON.stringify(value)); } catch (e) { /* ignore */ }
  }
  function lsRead(store, id) {
    try {
      const raw = global.localStorage.getItem(lsKey(store, id));
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function lsAll(store) {
    const out = [];
    try {
      for (let i = 0; i < global.localStorage.length; i += 1) {
        const key = global.localStorage.key(i);
        if (!key || key.indexOf(LS_PREFIX + store + ":") !== 0) continue;
        const raw = global.localStorage.getItem(key);
        if (raw) out.push(JSON.parse(raw));
      }
    } catch (e) { /* ignore */ }
    return out;
  }

  function get(store, id) {
    return openDB().then((db) => {
      if (!db) return lsRead(store, id);
      return new Promise((resolve) => {
        const req = db.transaction(store, "readonly").objectStore(store).get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    });
  }

  function put(store, value, id) {
    const key = id || value.sentence_id || value.card_id || value.lemma;
    lsWrite(store, key, value);
    return openDB().then((db) => {
      if (!db) return value;
      return new Promise((resolve) => {
        const req = db.transaction(store, "readwrite").objectStore(store).put(value);
        req.onsuccess = () => resolve(value);
        req.onerror = () => resolve(value);
      });
    });
  }

  function all(store) {
    return openDB().then((db) => {
      if (!db) return lsAll(store);
      return new Promise((resolve) => {
        const req = db.transaction(store, "readonly").objectStore(store).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    });
  }

  // ---------- 文本工具 ----------
  function normalizeText(value) {
    return String(value == null ? "" : value)
      .toLowerCase()
      .replace(/[\u2019\u2018]/g, "'")
      .replace(/[^a-z0-9' ]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function wordCount(text) {
    return String(text || "").trim().split(/\s+/).filter(Boolean).length;
  }

  function levenshtein(a, b) {
    const s = String(a || "");
    const t = String(b || "");
    if (s === t) return 0;
    if (!s.length) return t.length;
    if (!t.length) return s.length;
    const prev = new Array(t.length + 1);
    const curr = new Array(t.length + 1);
    for (let j = 0; j <= t.length; j += 1) prev[j] = j;
    for (let i = 1; i <= s.length; i += 1) {
      curr[0] = i;
      for (let j = 1; j <= t.length; j += 1) {
        const cost = s[i - 1] === t[j - 1] ? 0 : 1;
        curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      }
      for (let j = 0; j <= t.length; j += 1) prev[j] = curr[j];
    }
    return prev[t.length];
  }

  // 词形归一：depend / depends / depended / depending 都归到 depend
  function lemmaMatch(token, lemma) {
    const t = normalizeText(token);
    const l = normalizeText(lemma);
    if (!t || !l) return false;
    if (t === l) return true;
    if (t.indexOf(l) === 0) {
      const rest = t.slice(l.length);
      return ["", "s", "es", "ed", "d", "ing", "er", "est", "ly", "n", "al"].indexOf(rest) >= 0
        || rest === l.slice(-1) + "ed";
    }
    return levenshtein(t, l) <= 1;
  }

  // ---------- 意群切分（本地规则，2–5 块） ----------
  const PREP = ["on", "in", "at", "to", "for", "with", "by", "from", "of", "about", "into", "onto", "upon", "under", "over", "through", "across", "against", "between", "among", "during", "without", "within", "toward", "towards", "after", "before", "since", "until", "despite", "beyond", "beside", "behind", "along"];
  const CONJ = ["and", "or", "but", "yet", "so", "because", "although", "though", "while", "whereas", "if", "when", "unless", "since", "as"];
  const AUX = ["is", "are", "was", "were", "be", "been", "being", "do", "does", "did", "have", "has", "had", "will", "would", "can", "could", "may", "might", "must", "should", "shall"];

  function splitChunks(text) {
    const tokens = String(text || "").trim().split(/\s+/).filter(Boolean);
    if (tokens.length <= 3) return [{ text: tokens.join(" "), role: "clause" }];
    const chunks = [];
    let current = [];
    const roles = [];
    let pendingRole = "subject";
    for (let i = 0; i < tokens.length; i += 1) {
      const token = tokens[i];
      const lower = token.toLowerCase().replace(/[^a-z']/g, "");
      const boundary = i > 0 && (PREP.indexOf(lower) >= 0 || CONJ.indexOf(lower) >= 0 || /[,;:]$/.test(tokens[i - 1]));
      if (boundary && current.length) {
        chunks.push(current.join(" "));
        roles.push(pendingRole);
        current = [];
        pendingRole = PREP.indexOf(lower) >= 0 ? "prep_phrase" : (CONJ.indexOf(lower) >= 0 ? "coordinated_np" : "clause");
      }
      current.push(token);
      if (current.length === 1 && pendingRole === "subject" && AUX.indexOf(lower) >= 0) pendingRole = "subject";
    }
    if (current.length) { chunks.push(current.join(" ")); roles.push(pendingRole); }
    if (chunks.length < 2) {
      const half = Math.ceil(tokens.length / 2);
      return [
        { text: tokens.slice(0, half).join(" "), role: "subject" },
        { text: tokens.slice(half).join(" "), role: "predicate" }
      ];
    }
    if (chunks.length > 5) {
      const merged = [];
      const mergeRoles = [];
      for (let i = 0; i < chunks.length; i += 1) {
        if (i % 2 === 0 && i + 1 < chunks.length) {
          merged.push(chunks[i] + " " + chunks[i + 1]);
          mergeRoles.push(roles[i]);
        } else if (i % 2 === 1 && i + 1 === chunks.length) {
          merged.push(chunks[i]);
          mergeRoles.push(roles[i]);
        }
      }
      return merged.slice(0, 5).map((text, i) => ({ text, role: mergeRoles[i] || "clause" }));
    }
    return chunks.map((text, i) => ({ text, role: roles[i] || "clause" }));
  }

  function sentenceObject(text, zh, lemma, source, level) {
    const chunks = splitChunks(text);
    const targetWords = [];
    for (const token of String(text).split(/\s+/)) {
      if (lemmaMatch(token, lemma)) targetWords.push(token.replace(/[^A-Za-z']/g, ""));
    }
    return {
      sentence_id: (source === "llm_generated" ? "gen_" : source === "curated_word_entry" ? "cur_" : "shd_") + lemma + "_" + Date.now(),
      book_id: null,
      level: level || "",
      text: String(text).trim(),
      zh: zh || "",
      target_words: targetWords.length ? targetWords : [lemma],
      chunks: chunks.map((c) => c.text),
      chunk_roles: chunks.map((c) => c.role),
      source,
      lemma,
      created_at: Date.now()
    };
  }

  // ---------- 句子命中与缓存 ----------
  function cachedFor(lemma) {
    return all("sentence_cache").then((rows) => rows.filter((row) => row && row.lemma === lemma));
  }

  // 从 22 字段词条里抽句（离线可用）
  function extractCuratedSentence(lemma, entry, level) {
    if (!entry) return null;
    const candidates = [];
    const push = (text, zh) => {
      if (!text || typeof text !== "string") return;
      if (wordCount(text) < 8 || wordCount(text) > 20) return;
      if (!String(text).split(/\s+/).some((token) => lemmaMatch(token, lemma))) return;
      candidates.push({ text: text.trim(), zh: zh || "" });
    };
    // 例句池：examples[] 优先，其次 senses[].example，最后 scene
    if (Array.isArray(entry.examples)) {
      for (const item of entry.examples) push(item && item.en, item && item.cn);
    }
    if (Array.isArray(entry.senses)) {
      for (const sense of entry.senses) push(sense && sense.example, sense && sense.exampleCN);
    }
    push(entry.sentence, entry.sentenceCN);
    if (entry.scene) {
      const m = String(entry.scene).match(/[A-Z][^.!?]*[.!?]/);
      if (m) push(m[0], entry.sceneCN);
    }
    if (!candidates.length) return null;
    // 优先选目标词不出现在句首的（更像真实语境），其次选长度居中的
    candidates.sort((a, b) => {
      const aStarts = normalizeText(a.text).indexOf(normalizeText(lemma)) === 0 ? 1 : 0;
      const bStarts = normalizeText(b.text).indexOf(normalizeText(lemma)) === 0 ? 1 : 0;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return Math.abs(wordCount(a.text) - 12) - Math.abs(wordCount(b.text) - 12);
    });
    return sentenceObject(candidates[0].text, candidates[0].zh, lemma, "curated_word_entry", level);
  }

  // ---------- 共享句索引 ----------
  async function loadSharedIndex() {
    if (sharedLoaded) return indexed;
    sharedLoaded = true;
    indexed = new Map();
    // 1) 宿主注入
    if (global.LZ_SHARED_SENTENCES && typeof global.LZ_SHARED_SENTENCES === "object") {
      for (const [lemma, list] of Object.entries(global.LZ_SHARED_SENTENCES)) {
        indexed.set(lemma, (list || []).map((s) => (typeof s === "string" ? { text: s } : s)));
      }
      return indexed;
    }
    // 2) 本地缓存索引
    const cachedIndex = await get("sentence_index", "root");
    if (cachedIndex && cachedIndex.map) {
      for (const [lemma, ids] of Object.entries(cachedIndex.map)) indexed.set(lemma, ids);
      return indexed;
    }
    // 3) 共享句库文件（不存在就跳过，不报错）
    if (typeof fetch === "function" && global.navigator && global.navigator.onLine !== false) {
      try {
        const res = await fetch("LIZZREAD/sentences/index.json");
        if (res && res.ok) {
          const data = await res.json();
          const map = {};
          const rows = Array.isArray(data) ? data : (data.sentences || []);
          for (const row of rows) {
            if (!row || !row.text) continue;
            for (const lemma of (row.target_words || [])) {
              if (!map[lemma]) map[lemma] = [];
              map[lemma].push(row);
            }
          }
          for (const [lemma, list] of Object.entries(map)) indexed.set(lemma, list);
          await put("sentence_index", { lemma: "root", map, updatedAt: Date.now() });
        }
      } catch (e) { /* 没有共享句库就跳过 */ }
    }
    return indexed;
  }

  function pickShared(lemma, index, level) {
    const list = (index && index.get(lemma)) || [];
    if (!list.length) return null;
    const good = list.filter((row) => {
      const text = row && row.text;
      return text && wordCount(text) >= 8 && wordCount(text) <= 20;
    });
    if (!good.length) return null;
    const chosen = good[Math.floor(Math.random() * good.length)];
    return sentenceObject(chosen.text, chosen.zh || "", lemma, "shared_sentence", level || chosen.level);
  }

  // ---------- LLM 生成（可选，失败不影响流程） ----------
  function setLLM(fn) { llmCaller = typeof fn === "function" ? fn : null; }

  async function generateSentence(lemma, options) {
    if (!llmCaller) return null;
    if (global.navigator && global.navigator.onLine === false) return null;
    const opts = options || {};
    const prompt = [
      "你是英语教学例句生成器。只输出 JSON，不要解释。",
      "要求：句子必须包含目标词的某种词形；长度 8–20 个英文单词；难度 " + (opts.level || "B1") + "；自然、无争议、原创。",
      "输出格式：{\"text\":\"...\",\"zh\":\"中文翻译\",\"chunks\":[\"意群1\",\"意群2\",\"意群3\"]}",
      "目标词：" + lemma
    ].join("\n");
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const raw = await llmCaller(prompt);
        const data = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (!data || !data.text) continue;
        const text = String(data.text).trim();
        if (wordCount(text) < 8 || wordCount(text) > 20) continue;
        if (!text.split(/\s+/).some((token) => lemmaMatch(token, lemma))) continue;
        let chunks = Array.isArray(data.chunks) ? data.chunks.filter((c) => c && String(c).trim()) : [];
        if (chunks.length < 2 || chunks.length > 5) chunks = splitChunks(text).map((c) => c.text);
        const sentence = sentenceObject(text, data.zh || "", lemma, "llm_generated", opts.level);
        sentence.chunks = chunks;
        sentence.chunk_roles = chunks.map(() => "clause");
        return sentence;
      } catch (e) { /* 重试一次 */ }
    }
    return null;
  }

  async function cacheSentence(sentence) {
    if (!sentence || !sentence.sentence_id) return null;
    await put("sentence_cache", sentence);
    const index = await loadSharedIndex();
    if (index) index.set(sentence.lemma, (index.get(sentence.lemma) || []).concat([sentence]));
    return sentence;
  }

  // ---------- 四级选句 ----------
  async function getSentenceForWord(lemma, options) {
    const opts = Object.assign({ minLen: 8, maxLen: 20 }, options || {});
    const cached = (await cachedFor(lemma)).filter((s) => s.source !== "shared_sentence");
    if (cached.length) {
      cached.sort((a, b) => (a.source === "curated_word_entry" ? -1 : 1));
      return cached[0];
    }
    const index = await loadSharedIndex();
    const shared = pickShared(lemma, index, opts.level);
    if (shared) return shared;
    if (opts.entry) {
      const curated = extractCuratedSentence(lemma, opts.entry, opts.level);
      if (curated) { await cacheSentence(curated); return curated; }
    }
    return null;
  }

  async function getOrCreateSentenceForWord(lemma, options) {
    const found = await getSentenceForWord(lemma, options);
    if (found) return found;
    const generated = await generateSentence(lemma, options);
    if (generated) { await cacheSentence(generated); return generated; }
    return null;
  }

  // ---------- 判定与错误分流 ----------
  function judgeAndRoute(userChunks, targetChunks, lemma) {
    const user = (userChunks || []).map(normalizeText);
    const target = (targetChunks || []).map(normalizeText);
    const userText = user.join(" ");
    const targetText = target.join(" ");
    if (userText === targetText) return { result: "exact", errorType: "", route: "assembly" };
    if (user.length !== target.length) {
      // 块数不对：如果只有一个块且只错在目标词，按拼写处理
      if (levenshtein(userText, targetText) <= 2 && userText.indexOf(normalizeText(lemma)) >= 0) {
        return { result: "miss", errorType: "spelling", route: "spelling" };
      }
      // 少掉的词里有介词 → 搭配问题；否则算语序
      const targetWords = targetText.split(" ").filter(Boolean);
      const userWords = userText.split(" ").filter(Boolean);
      const missing = targetWords.filter((w) => userWords.indexOf(w) < 0);
      if (missing.some((w) => PREP.indexOf(w) >= 0)) {
        return { result: "miss", errorType: "collocation", route: "assembly" };
      }
      return { result: "miss", errorType: "order", route: "assembly" };
    }
    let diffChunks = 0;
    for (let i = 0; i < target.length; i += 1) if (user[i] !== target[i]) diffChunks += 1;
    if (diffChunks === 1) {
      const idx = user.findIndex((chunk, i) => chunk !== target[i]);
      const targetChunk = target[idx] || "";
      const userChunk = user[idx] || "";
      const lemmaToken = (chunk) => String(chunk).split(" ").find((w) => lemmaMatch(w, lemma)) || "";
      // 目标词本身拼错：两边的目标词词形不一致，且只差一两个字母
      if (lemmaToken(targetChunk) && lemmaToken(userChunk) && lemmaToken(targetChunk) !== lemmaToken(userChunk)
        && levenshtein(lemmaToken(targetChunk), lemmaToken(userChunk)) <= 2) {
        return { result: "miss", errorType: "spelling", route: "spelling" };
      }
      if (lemmaMatch(userChunk, lemma) && !lemmaMatch(targetChunk, lemma)) {
        return { result: "miss", errorType: "spelling", route: "spelling" };
      }
      // 块内只错一个词且只差一两个字母：按拼写处理（不管错的是不是目标词）
      const tWords = targetChunk.split(" ");
      const uWords = userChunk.split(" ");
      if (tWords.length === uWords.length) {
        let typoCount = 0;
        let typoOk = true;
        for (let k = 0; k < tWords.length; k += 1) {
          if (tWords[k] !== uWords[k]) {
            typoCount += 1;
            if (levenshtein(tWords[k], uWords[k]) > 2) typoOk = false;
          }
        }
        if (typoCount === 1 && typoOk) {
          return { result: "near", errorType: "spelling", route: "spelling" };
        }
      }
      const missingPrep = targetChunk.split(" ").some((w) => PREP.indexOf(w) >= 0) && !userChunk.split(" ").some((w) => PREP.indexOf(w) >= 0);
      if (missingPrep) return { result: "near", errorType: "collocation", route: "assembly" };
      const morph = targetChunk.split(" ").some((w) => lemmaMatch(w, lemma)) !== userChunk.split(" ").some((w) => lemmaMatch(w, lemma));
      if (morph) return { result: "near", errorType: "morphology", route: "assembly" };
    }
    if (levenshtein(userText, targetText) <= 2 && userText.length > 0) {
      return { result: "near", errorType: "morphology", route: "assembly" };
    }
    return { result: "miss", errorType: "order", route: "assembly" };
  }

  function updateContextWeakness(lemma, errorType) {
    const key = LS_PREFIX + "weak:" + lemma;
    let data = null;
    try { data = JSON.parse(global.localStorage.getItem(key) || "null"); } catch (e) { data = null; }
    data = data && typeof data === "object" ? data : { spelling: 0, order: 0, collocation: 0, morphology: 0, by_role: {}, last_error: "" };
    const field = errorType === "spelling" ? "spelling" : errorType === "collocation" ? "collocation" : errorType === "morphology" ? "morphology" : "order";
    data[field] = Math.min(1, (Number(data[field]) || 0) + 0.15);
    data.last_error = errorType;
    try { global.localStorage.setItem(key, JSON.stringify(data)); } catch (e) { /* ignore */ }
    return data;
  }

  // ---------- 拼装卡调度（独立 FSRS，简化版） ----------
  function scheduleAssembly(card, grade) {
    const now = Date.now();
    const value = Object.assign({}, card);
    value.card_id = value.card_id || ("asm_" + value.target_word_lemma + "_" + (value.sentence_id || "s"));
    value.fsrs_state = value.fsrs_state || { reps: 0, lapses: 0 };
    const gradeName = grade || "good";
    if (gradeName === "again") {
      value.fsrs_state.lapses = (value.fsrs_state.lapses || 0) + 1;
      value.fsrs_state.reps = 0;
      value.stability = 0.5;
      value.difficulty = Math.min(10, (value.difficulty || 5) + 0.6);
      value.due = now + 10 * 60 * 1000;
    } else {
      value.fsrs_state.reps = (value.fsrs_state.reps || 0) + 1;
      const reps = value.fsrs_state.reps;
      value.stability = Math.round((1.2 * Math.pow(1.9, reps - 1)) * 10) / 10;
      value.difficulty = Math.max(1, (value.difficulty || 5) - (gradeName === "easy" ? 0.4 : 0.15));
      value.due = now + Math.round(value.stability * 24 * 60 * 60 * 1000);
    }
    put("assembly_queue", value);
    return value;
  }

  async function getDueAssemblyCards(now) {
    const cards = await all("assembly_queue");
    const at = Number(now) || Date.now();
    return cards.filter((card) => Number(card.due) <= at);
  }

  // ---------- 粒度自适应 ----------
  function nextGranularity(history) {
    const list = history || [];
    if (list.length >= 2) {
      const last2 = list.slice(-2);
      if (last2.every((x) => x === "again") || last2.some((x) => x === "collocation")) return "fine";
      if (last2.every((x) => x === "easy")) return "whole";
    }
    return "coarse";
  }

  global.LZAssembly = {
    init: () => openDB().then(() => loadSharedIndex()),
    getSentenceForWord,
    getOrCreateSentenceForWord,
    extractCuratedSentence,
    generateSentence,
    cacheSentence,
    judgeAndRoute,
    scheduleAssembly,
    getDueAssemblyCards,
    nextGranularity,
    updateContextWeakness,
    splitChunks,
    lemmaMatch,
    normalizeText,
    setLLM,
    _debug: { all, get, put }
  };
})(typeof window !== "undefined" ? window : globalThis);
