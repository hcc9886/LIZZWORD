/* ============================================================
   Lizz · 独立状态与视觉资源
   - localStorage key: lizzword_lizz_v1（不改动 lizzword_state_v1 的任何字段）
   - 装扮商店写在同一个 key 的 shop 字段；保存时自动合并磁盘上的最新 shop，
     避免 lizz.js 的旧内存状态覆盖刚买到的装扮或刚赚到的积分
   - 连点 25 次躲起来，背完 10 个单词后悄悄回来（不再有“彻底消失到次日”）
   - 小饼干：每背完 1 个新词 +1 块（库存无上限），玩家可随时自主投喂；
     库存每天清零，跨天后碗里回到 0 块重新攒；
   - 30 种颜文字与 Lizz 台词
   - 内置简笔小狐狸 SVG（不新增图片文件；仍保留 lizz.png 替换槽位）
   ============================================================ */
(function () {
  "use strict";

  // 预览页可以用 window.LIZZWORD_LIZZ_KEY / LIZZWORD_LIZZ_APP_KEY 指向独立的坑，
  // 避免试玩时污染正式存档；正式页面不设置这两个变量，行为完全不变。
  const KEY = (typeof window.LIZZWORD_LIZZ_KEY === "string" && window.LIZZWORD_LIZZ_KEY)
    ? window.LIZZWORD_LIZZ_KEY
    : "lizzword_lizz_v1";
  const APP_KEY = (typeof window.LIZZWORD_LIZZ_APP_KEY === "string" && window.LIZZWORD_LIZZ_APP_KEY)
    ? window.LIZZWORD_LIZZ_APP_KEY
    : "lizzword_state_v1";
  const PHOTO_KEY = "lizzword_lizz_photo_v1";
  const VERSION = 1;

  /* ===== 图片替换槽位 =====
     默认不加载 books/lizz/lizz.png：file:// 下文件不存在时，<img> 会在控制台留下
     一条 “ERR_FILE_NOT_FOUND” 红色报错。放好图片后执行一次
     LIZZWORD_LIZZ.usePhoto() 即可永久启用；也可用 ?lizz-photo=1 临时启用。 */
  const DEFAULT_PHOTO_URL = (function () {
    try {
      const src = document.currentScript && document.currentScript.src ? document.currentScript.src : "";
      return src ? src.replace(/[^\/]*$/, "lizz.png") : "books/lizz/lizz.png";
    } catch (error) {
      return "books/lizz/lizz.png";
    }
  })();

  function photoUrl() {
    try {
      const stored = window.localStorage.getItem(PHOTO_KEY);
      if (stored) return stored;
    } catch (error) { /* 本地存储不可用时保持默认 */ }
    if (window.LIZZWORD_LIZZ_PHOTO === true) return DEFAULT_PHOTO_URL;
    try {
      if (new URLSearchParams(window.location.search).get("lizz-photo") === "1") return DEFAULT_PHOTO_URL;
    } catch (error) { /* 非标准环境忽略 */ }
    return "";
  }

  /* ===== 30 种颜文字 ===== */
  const FACES = [
    "(￣▽￣)",
    "(*¯︶¯*)",
    "（＾∇＾）",
    "(ﾟoﾟ;;",
    "(´･ω･`)",
    "(๑•̀ㅂ•́)و",
    "(＾▽＾)",
    "(￣ω￣)",
    "(´｡• ᵕ •｡`)",
    "(・∀・)",
    "(￣ε￣)",
    "(｡•́︿•̀｡)",
    "(⌒▽⌒)",
    "(´-ω-`)",
    "(≧∇≦)",
    "(；´д｀)",
    "(￣^￣)ゞ",
    "(´,,•ω•,,)",
    "(｡>﹏<｡)",
    "(￣▽￣)ゞ",
    "(•‿•)",
    "(´･_･`)",
    "(＠_＠;)",
    "(￣～￣;)",
    "(Ｔ▽Ｔ)",
    "(￣︶￣)",
    "(๑>؂<๑)",
    "(｡ì _ í｡)",
    "(￣Д￣)ﾉ",
    "(´；ω；`)"
  ];

  /* ===== Lizz 台词（社恐 INFJ 语气） ===== */
  const LINES = {
    intro: [
      "那个…我、我叫 Lizz。",
      "我不太会跟人说话，也不太会看气氛…但我想把这一遍讲清楚。",
      "我们从最简单的三个词开始，好吗？就 hello、bye、love。"
    ],
    introButton: "嗯…开始吧",
    correct: [
      "嗯…对了。",
      "哦…这个你记住了。",
      "你比我稳。我刚刚还有点紧张。",
      "对…对的。慢慢来就好。"
    ],
    wrong: [
      "啊…没关系，我、我也常记错。",
      "先看清正确答案，我们再来一次。",
      "别急…这个词会重新走一遍，我陪着你。"
    ],
    skip: [
      "好…那我先退到一边。想继续的时候再叫我。",
      "没事的，跳过也可以。我就在角落待着。"
    ],
    finish: [
      "走完了…！",
      "五步都走完了。你比我想的厉害。",
      "以后我就待在左下角。点我一下，我会冒个颜文字。"
    ],
    groupPraise: [
      "你、你学完了…！我一直在这边看着。",
      "这一组结束了…你比刚才稳多了。真的。",
      "完成了…我、我有点替你高兴。",
      "你坚持下来了…我在角落里记着呢。",
      "一组学完啦…我、我想给你鼓个掌。",
      "刚才你特别专注…我都不敢出声。"
    ],
    groupThanks: [
      "谢谢你…愿意让我待在旁边。下一组，我还在。",
      "被你想起来…我很开心。我们一点点继续，好吗？",
      "谢谢你还点了我一下…我会一直陪着的。",
      "这声谢谢…我收下了。你慢慢学，不用急。",
      "你愿意继续，我就愿意等。下一组见，好吗？",
      "谢谢你…今天也辛苦了。再来一点点就好。"
    ],
    // 看到碗里食物时的“嘴硬心软”台词（先星星眼，再弱弱地傲娇一句）
    tsundere: [
      "我、我只是回来看看…才不是为了你。",
      "别误会…我只是路过，顺便看看碗里有没有剩的。",
      "……我回来看看而已。你继续学，别管我。",
      "哼…我只是来看一眼。真的，就一眼。",
      "我、我不是特意回来的…只是刚好走到这边。",
      "碗里有东西…我、我可不是被它引回来的。"
    ],
    softHide: [
      "我…先躲起来。",
      "背完 10 个单词我就回来。真的，10 个。"
    ],
    stay: [
      "以后我就待在左下角。",
      "点我一下就好。"
    ],
    click: [
      "……",
      "嗯？",
      "别、别一直点…",
      "我在。"
    ],
    foodFull: [
      "今天吃够了…剩下的明天再吃。",
      "（摸摸肚子）12 块是极限了…明天再吃。",
      "吃、吃饱了…剩下的先存着，坏不了。"
    ]
  };

  /* ===== 内置简笔小狐狸（一只耳朵立着、一只耳朵塌着） ===== */
  const FOX_SVG = `
    <svg viewBox="0 0 100 100" class="lz-fox-svg" role="img" aria-label="Lizz，一只害羞的小狐狸">
      <ellipse class="lz-fox-shadow" cx="50" cy="93" rx="21" ry="3.5" fill="#e3eaf4"/>

      <!-- 尾巴：从身体右侧长出来，向上卷 -->
      <path class="lz-fox-tail" d="M59 83c6 9 17 12 25 8 6-3 7-10 3-14-3-3-8-2-8 2 0 3 3 5 6 4" fill="#f4b26f" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>

      <!-- 身体：坐姿，底部圆润 -->
      <path class="lz-fox-body" d="M40 57c-6 4-8 14-8 23 0 8 7 12 18 12s18-4 18-12c0-9-2-19-8-23z" fill="#f4b26f" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
      <path d="M44 66c0 12 2 20 6 20s6-8 6-20c0-5-12-5-12 0z" fill="#fff"/>
      <ellipse cx="41" cy="91" rx="5.5" ry="3" fill="#f4b26f" stroke="#4a3b32" stroke-width="1.8"/>
      <ellipse cx="59" cy="91" rx="5.5" ry="3" fill="#f4b26f" stroke="#4a3b32" stroke-width="1.8"/>

      <!-- 耳朵：左耳立着，右耳软软地塌下去 -->
      <path class="lz-fox-ear-up" d="M31 24Q27 14 31 4Q38 10 46 19Z" fill="#f4b26f" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
      <path d="M31 18Q29 12 31 8Q35 11 40 15Z" fill="#ffe3cb"/>
      <path class="lz-fox-ear-droop" d="M65 21Q76 24 79 33Q82 41 78 45Q73 48 70 42Q67 34 68 27Q65 24 65 21Z" fill="#f4b26f" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
      <path d="M69 26Q75 30 76 36Q77 41 74 41Q70 37 69 30Z" fill="#ffe3cb"/>

      <!-- 头 -->
      <circle class="lz-fox-head" cx="50" cy="38" r="21" fill="#f4b26f" stroke="#4a3b32" stroke-width="2"/>
      <ellipse cx="50" cy="48" rx="13" ry="9.5" fill="#fff"/>

      <!-- 怯生生的眉眼 -->
      <path class="lz-fox-brow" d="M36 31q3-3 7-1M64 31q-3-3-7-1" fill="none" stroke="#4a3b32" stroke-width="1.5" stroke-linecap="round" opacity=".7"/>
      <circle class="lz-fox-eye" cx="41.5" cy="37" r="2.6" fill="#4a3b32"/>
      <circle class="lz-fox-eye" cx="58.5" cy="37" r="2.6" fill="#4a3b32"/>
      <circle class="lz-fox-glint" cx="42.4" cy="36.1" r=".9" fill="#fff"/>
      <circle class="lz-fox-glint" cx="59.4" cy="36.1" r=".9" fill="#fff"/>

      <!-- 不可置信：瞪大的眼睛 + 张开的嘴（stock ≥ COOKIE_TIERS 的 5 块档） -->
      <g class="lz-fox-shock" aria-hidden="true">
        <circle class="lz-shock-eye" cx="41.5" cy="36.6" r="5" fill="#fff" stroke="#4a3b32" stroke-width="1.6"/>
        <circle class="lz-shock-eye" cx="58.5" cy="36.6" r="5" fill="#fff" stroke="#4a3b32" stroke-width="1.6"/>
        <circle cx="41.5" cy="37.3" r="1.5" fill="#4a3b32"/>
        <circle cx="58.5" cy="37.3" r="1.5" fill="#4a3b32"/>
        <ellipse cx="50" cy="51.2" rx="3" ry="3.8" fill="#4a3b32"/>
        <path d="M29.5 23.5l-2.2-4M70.5 23.5l2.2-4" fill="none" stroke="#4a3b32" stroke-width="1.6" stroke-linecap="round"/>
      </g>

      <!-- 星星眼：默认隐藏，看到碗里有食物时短暂出现 -->
      <g class="lz-fox-star-eyes" aria-hidden="true">
        <path class="lz-star lz-star-left" d="M41.5 31.5l1.6 3.4 3.7.5-2.7 2.6.6 3.7-3.2-1.7-3.2 1.7.6-3.7-2.7-2.6 3.7-.5z" fill="#ffd166" stroke="#4a3b32" stroke-width="1.1" stroke-linejoin="round"/>
        <path class="lz-star lz-star-right" d="M58.5 31.5l1.6 3.4 3.7.5-2.7 2.6.6 3.7-3.2-1.7-3.2 1.7.6-3.7-2.7-2.6 3.7-.5z" fill="#ffd166" stroke="#4a3b32" stroke-width="1.1" stroke-linejoin="round"/>
        <path class="lz-spark lz-spark-right" d="M73 25l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1z" fill="#ffe8a3" stroke="#f4b26f" stroke-width=".8"/>
        <path class="lz-spark lz-spark-left" d="M27 22l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" fill="#ffe8a3" stroke="#f4b26f" stroke-width=".8"/>
      </g>
      <ellipse class="lz-fox-blush lz-fox-blush-left" cx="33" cy="45" rx="4" ry="2.4" fill="#f7b2b2" opacity=".8"/>
      <ellipse class="lz-fox-blush lz-fox-blush-right" cx="67" cy="45" rx="4" ry="2.4" fill="#f7b2b2" opacity=".8"/>
      <path class="lz-fox-nose" d="M47.6 45.5h4.8l-2.4 2.8z" fill="#4a3b32"/>
      <path class="lz-fox-mouth" d="M48.4 50.5q1.6 2.4 3.2 0" fill="none" stroke="#4a3b32" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`;

  window.LIZZWORD_LIZZ_FOX_SVG = FOX_SVG;

  /* ===== 小饼干换算与情绪档位 =====
     饼干库存只由“新词数”决定，玩家可随时自主投喂：
     - COOKIE_PER_WORD：每背完 1 个新词 → 碗里 +1 块，当日库存无上限
     - 库存每天清零：跨天后碗里回到 0 块，重新攒
     - COOKIE_VISIBLE_MAX：碗里最多画 12 块，更多只体现在角标数字
     - COOKIE_TIERS：按库存量决定表情档位，5 块起“不可置信” */
  const COOKIE_PER_WORD = 1;
  const COOKIE_VISIBLE_MAX = 12;
  const COOKIE_TIERS = [
    { min: 0, key: "normal", label: "平静" },
    { min: 1, key: "happy", label: "开心" },
    { min: 3, key: "excited", label: "兴奋" },
    { min: 5, key: "unbelievable", label: "不可置信" },
    { min: 10, key: "overjoyed", label: "幸福到发懵" }
  ];

  // 兼容旧字段名：food 现在是“库存”，不再有 5 份上限
  const FOOD_CAP = Infinity;

  // 今天已吃掉的饼干数：保留字段兼容旧存档，不再设上限
  function clampEat(value) {
    return Math.max(0, Math.floor(Number(value) || 0));
  }

  function moodFor(count) {
    const n = Math.max(0, Math.floor(Number(count) || 0));
    let mood = COOKIE_TIERS[0].key;
    COOKIE_TIERS.forEach((tier) => {
      if (n >= tier.min) mood = tier.key;
    });
    return mood;
  }

  /* ===== 简笔小碗 =====
     碗里最多堆 COOKIE_VISIBLE_MAX 块饼干；底部 5 → 中间 4 → 顶部 3。 */
  const COOKIE_LAYOUT = [
    [7, 9], [13, 9], [19, 9], [25, 9], [31, 9],
    [10, 5.5], [16.5, 5.5], [23, 5.5], [29.5, 5.5],
    [14, 2], [20.5, 2], [27, 2]
  ];
  const COOKIE_ROTATIONS = [-6, 4, -3, 5, -5, 3, -4, 6, -2, 4, -6, 3];

  function cookieSVG(index, xy, rotate) {
    return `<g class="lz-food lz-food-${index}" transform="translate(${xy[0]} ${xy[1]}) rotate(${rotate} 4 2.4)">
      <ellipse cx="4" cy="2.4" rx="4" ry="2.4" fill="#f4b26f" stroke="#4a3b32" stroke-width="1.3"/>
      <circle cx="2.6" cy="1.9" r=".55" fill="#4a3b32"/>
      <circle cx="5.2" cy="2.9" r=".55" fill="#4a3b32"/>
    </g>`;
  }

  const BOWL_SVG = `
    <svg viewBox="0 0 48 34" class="lz-bowl-svg" role="img" aria-label="Lizz 的小碗">
      <ellipse cx="24" cy="31" rx="15" ry="2.6" fill="#e8edf6"/>
      <path d="M6 12h36c0 9-7 15-18 15S6 21 6 12z" fill="#fffaf2" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
      <ellipse cx="24" cy="12" rx="18" ry="4.6" fill="#fffaf2" stroke="#4a3b32" stroke-width="2"/>
      ${COOKIE_LAYOUT.map((xy, i) => cookieSVG(i, xy, COOKIE_ROTATIONS[i])).join("")}
    </svg>`;

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function dateKeyOf(date) {
    const d = date || new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function baseState() {
    return {
      v: VERSION,
      tutorialDone: false,
      tutorialSkippedAt: "",
      tutorialFinishedAt: "",
      introSeen: false,
      mode: "active",          // active | hidden（背完 10 词回来）
      hiddenAt: "",
      hiddenBaseline: null,    // { date, groupsToday, wordsToday }
      lastFace: -1,
      softHideCount: 0,
      food: 0,                 // 饼干库存（无上限；新词结算 + 喂食叠加，Lizz 每天最多吃掉 12 块）
      foodReacted: 0,          // 已经为“第几份食物”冒过星星眼，避免每次点击都重复
      groupSeen: null,         // { date, groupsToday }：识别“又完成了一组”
      thanksPending: false,    // 完成一组后等用户点一下道谢
      praiseAt: "",
      lastPraise: -1,
      lastThanks: -1,
      lastTsundere: -1,
      eatenDate: "",           // Lizz 今天吃掉饼干的日期（跨天重置）
      eatenToday: 0,           // 今天已吃掉的饼干数（保留字段，兼容旧存档）
      foodDate: "",            // 饼干库存归属的日期（跨天清零）
      shop: null,              // 商店状态（points/owned/equipped...），由 lizz-shop.js 维护
      updatedAt: ""
    };
  }

  function normalizeBaseline(value) {
    if (!value || typeof value !== "object") return null;
    return {
      date: typeof value.date === "string" ? value.date : "",
      groupsToday: Number(value.groupsToday) || 0,
      wordsToday: Number(value.wordsToday) || 0
    };
  }

  function normalizeGroupSeen(value) {
    if (!value || typeof value !== "object") return null;
    if (typeof value.date !== "string" || !value.date) return null;
    return {
      date: value.date,
      groupsToday: Number(value.groupsToday) || 0
    };
  }

  /* 只读主应用进度，绝不写 lizzword_state_v1 */
  function readAppProgress() {
    try {
      const raw = window.localStorage.getItem(APP_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      return {
        date: typeof parsed.groupStatsDate === "string" ? parsed.groupStatsDate : "",
        groupsToday: Number(parsed.groupsToday) || 0,
        wordsToday: Number(parsed.wordsToday) || 0
      };
    } catch (error) {
      return null;
    }
  }

  /* 软隐藏后：从躲起来那一刻算，背完 10 个词才回来 */
  function shouldReturn(state) {
    const p = readAppProgress();
    const b = state.hiddenBaseline;
    if (!p) return false;
    const today = dateKeyOf();
    if (b && p.date === b.date) {
      return p.date === today && p.wordsToday - b.wordsToday >= 10;
    }
    // 跨天后：主应用进度已切到新的一天，要求当天累计 ≥ 10
    return p.date === today && p.wordsToday >= 10;
  }

  /* 每次落盘前，先合并磁盘上最新的 shop 字段。
     lizz.js 会长期持有一份内存 state；商店模块随时可能在别处写入积分与装扮。
     如果不合并，点一下狐狸、换个颜文字就可能把刚买的装扮覆盖回旧的。 */
  function mergeLatestShop(state) {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return;
      const latest = JSON.parse(raw);
      if (latest && typeof latest === "object" && latest.shop && typeof latest.shop === "object") {
        state.shop = latest.shop;
      }
    } catch (error) {
      /* 存档损坏时保留内存里的值 */
    }
  }

  function persist(state) {
    mergeLatestShop(state);
    state.updatedAt = new Date().toISOString();
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch (error) {
      /* 隐私模式或存储被禁用时，至少让本次会话继续可用 */
    }
    return state;
  }

  /* 商店模块专用的“读盘 → 改 → 立即写盘”通道：
     不复用内存里的 state，也不会被 mergeLatestShop 用旧值覆盖。
     单线程 localStorage 下，这就是一次完整且不丢字段的事务。 */
  function writeRaw(state) {
    state.v = VERSION;
    state.updatedAt = new Date().toISOString();
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch (error) {
      /* ignore */
    }
    return state;
  }

  function update(mutator) {
    const state = load();
    if (typeof mutator === "function") mutator(state);
    return writeRaw(state);
  }

  function load() {
    let parsed = null;
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) parsed = JSON.parse(raw);
    } catch (error) {
      parsed = null;
    }

    const state = Object.assign(baseState(), parsed && typeof parsed === "object" ? parsed : {});
    state.v = VERSION;
    state.tutorialDone = Boolean(state.tutorialDone);
    state.introSeen = Boolean(state.introSeen);
    state.tutorialSkippedAt = typeof state.tutorialSkippedAt === "string" ? state.tutorialSkippedAt : "";
    state.tutorialFinishedAt = typeof state.tutorialFinishedAt === "string" ? state.tutorialFinishedAt : "";
    state.hiddenAt = typeof state.hiddenAt === "string" ? state.hiddenAt : "";
    state.lastFace = Number.isInteger(state.lastFace) ? state.lastFace : -1;
    state.softHideCount = Number(state.softHideCount) || 0;
    state.hiddenBaseline = normalizeBaseline(state.hiddenBaseline);
    state.food = Math.min(FOOD_CAP, Math.max(0, Number(state.food) || 0));
    state.foodReacted = Math.min(FOOD_CAP, Math.max(0, Number(state.foodReacted) || 0));
    state.groupSeen = normalizeGroupSeen(state.groupSeen);
    state.thanksPending = Boolean(state.thanksPending);
    state.praiseAt = typeof state.praiseAt === "string" ? state.praiseAt : "";
    state.lastPraise = Number.isInteger(state.lastPraise) ? state.lastPraise : -1;
    state.lastThanks = Number.isInteger(state.lastThanks) ? state.lastThanks : -1;
    state.lastTsundere = Number.isInteger(state.lastTsundere) ? state.lastTsundere : -1;

    // 每日吃掉数：跨天自动归零；同日不超过 COOKIE_EAT_CAP
    let changed = false;
    if (state.eatenDate !== dateKeyOf()) {
      state.eatenDate = dateKeyOf();
      state.eatenToday = 0;
      changed = true;
    } else {
      state.eatenToday = clampEat(state.eatenToday);
    }

    // 饼干库存每天清零：跨天后碗里回到 0 块重新攒
    if (state.foodDate !== dateKeyOf()) {
      state.foodDate = dateKeyOf();
      state.food = 0;
      state.foodReacted = 0;
      changed = true;
    }

    // 旧版本“彻底消失到次日”的兼容迁移：
    // mode=gone / goneUntil 一律视为可见，避免老用户升级后狐狸再也不出现。
    const legacyGone = state.mode === "gone";
    if (!["active", "hidden"].includes(state.mode)) state.mode = "active";
    delete state.goneUntil;
    delete state.goneCount;

    if (legacyGone) changed = true;

    // 软隐藏：只有背完 10 个词才回来
    if (state.mode === "hidden") {
      if (shouldReturn(state)) {
        state.mode = "active";
        state.hiddenBaseline = null;
        state.hiddenAt = "";
        changed = true;
      }
    }

    if (changed) persist(state);
    return state;
  }

  function save(state) {
    return persist(state);
  }

  function setMode(state, mode, extra) {
    state.mode = mode;
    if (mode === "active") {
      state.hiddenAt = "";
      state.hiddenBaseline = null;
    }
    if (mode === "hidden") {
      state.hiddenAt = new Date().toISOString();
      const p = readAppProgress();
      state.hiddenBaseline = {
        date: p && p.date ? p.date : dateKeyOf(),
        groupsToday: p ? p.groupsToday : 0,
        wordsToday: p ? p.wordsToday : 0
      };
    }
    if (extra && typeof extra === "object") Object.assign(state, extra);
    return persist(state);
  }

  function pickFace(state, random) {
    if (state.lastFace < 0 || state.lastFace >= FACES.length) {
      state.lastFace = Math.floor((random || Math.random)() * FACES.length);
    } else {
      // 避免连续两次同一个颜文字
      const offset = 1 + Math.floor((random || Math.random)() * (FACES.length - 1));
      state.lastFace = (state.lastFace + offset) % FACES.length;
    }
    persist(state);
    return FACES[state.lastFace];
  }

  window.LIZZWORD_LIZZ_STATE = {
    KEY,
    APP_KEY,
    PHOTO_KEY,
    DEFAULT_PHOTO_URL,
    VERSION,
    FACES,
    LINES,
    FOX_SVG,
    BOWL_SVG,
    FOOD_CAP,
    COOKIE_PER_WORD,
    COOKIE_VISIBLE_MAX,
    moodFor,
    clampEat,
    dateKeyOf,
    readAppProgress,
    shouldReturn,
    load,
    save,
    update,
    writeRaw,
    setMode,
    pickFace,
    photoUrl
  };
})();
