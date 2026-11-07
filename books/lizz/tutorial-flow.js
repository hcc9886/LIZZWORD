/* ============================================================
   LIZZWORD 新手教程流程引擎
   按正式学习流程 1:1 模拟：
     认词 → 看中选英 → 看英选中 → 说 → 写
   - 词只有 hello / bye / love，干扰项也只从这三个里出
   - 同词冷却：尽量隔 3–7 个其他作答；只有三个词时自动退化为“最少出现的那个”
   - 非写阶段答错：该词退回第一轮（认词），重新走完整轮次
   - 写阶段答错：只纠正，不重置阶段，排到写队列末尾
   - 任何答错先完整展示正确答案，确认后才能推进
   - 回撤只允许一步
   ============================================================ */
(function () {
  "use strict";

  const S = window.LIZZWORD_LIZZ_STATE;
  const WORDS = window.LIZZWORD_TUTORIAL_WORDS || [];
  const ART = window.LIZZWORD_TUTORIAL_ART || {};

  const STAGES = [
    { key: "stage1", label: "认词", short: "认词" },
    { key: "stage2", label: "看中选英", short: "中→英" },
    { key: "stage2b", label: "看英选中", short: "英→中" },
    { key: "speak", label: "说", short: "说" },
    { key: "write", label: "写", short: "写" }
  ];

  const COOL_MIN = 3;
  const COOL_MAX = 7;

  const STAGE_GUIDES = {
    stage1: {
      title: "第一步：认词",
      what: "先把完整词条看一遍：发音、释义、场景、核心义项。",
      why: "先让声音和意思连起来。后面做选择时，脑子里有东西可取，而不是靠猜。",
      how: "三个词各过一遍。看完一个，点「看完，认识这个词」。",
      voice: "先认识它，不急着考你。看完我们就往下走。"
    },
    stage2: {
      title: "第二步：看中文选英文",
      what: "只给中文释义，你要自己把英文想出来。",
      why: "这一步练「主动提取」：从「我认得它」变成「我想得起它」。",
      how: "选项只有 hello、bye、love 三个。答错这个词会退回第一轮，从认词重新走。",
      voice: "这次只给中文…你先自己想一想，再选。"
    },
    stage2b: {
      title: "第三步：看英文选中文",
      what: "方向反过来：看到英文，立刻反应它的中文意思。",
      why: "真实使用和考试里，两个方向都会出现；反向练习能把词形和意思绑得更紧。",
      how: "先听发音，再从三个中文释义里选。答错同样退回第一轮。",
      voice: "现在反过来。看到词，先回想意思。"
    },
    speak: {
      title: "第四步：说",
      what: "句子里的目标词被挖空，你看着场景把整句读出来。",
      why: "把词放回句子里，才算真的会用。单独认识一个词，不等于能在句子里用它。",
      how: "file:// 或不支持语音识别时用自评：先自己读，再如实选「我读对了 / 我没读对」。点「看一眼提示」可以看答案和朗读。说错和选择题错一样，会退回第一轮。",
      voice: "别怕读错…我会在。读完自己判断就好，诚实比好听重要。"
    },
    write: {
      title: "第五步：写",
      what: "只给中文意境和场景，你要把英文拼出来。",
      why: "拼写会把模糊的记忆逼清楚：会读会认，不代表写得出。",
      how: "输入后按回车或点提交。写错只纠正、不重置阶段，这个词会排到写队列末尾。",
      voice: "最后一关。慢慢拼，不用急。"
    }
  };

  /* 选择题两个方向共用一份“方向参数”：题干取哪个字段、选项取哪个字段，
     都在这里定义，避免题干和选项各写各的又错开 */
  const CHOICE_DIRECTIONS = {
    stage2: {
      promptField: "definition_zh",  // 题干：中文释义
      optionField: "word",           // 选项：英文词形
      label: "看中文，选出对应的英文",
      sub: "只从 hello、bye、love 里选",
      speak: false
    },
    stage2b: {
      promptField: "word",           // 题干：英文词形
      optionField: "definition_zh",  // 选项：中文释义
      label: "看英文，选出对应的中文",
      sub: "先听发音，再选意思",
      speak: true
    }
  };

  let overlay = null;
  let runtime = null;
  let options = {};
  let isOpenNow = false;
  let keyHandler = null;

  /* ============================================================
     工具
     ============================================================ */
  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escRe(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function randomOf(list) {
    if (!list || !list.length) return null;
    return list[Math.floor(Math.random() * list.length)];
  }

  function shuffle(list) {
    const arr = list.slice();
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function getWord(id) {
    return WORDS.find((item) => item.word === id) || WORDS[0];
  }

  function stageLabel(key) {
    const stage = STAGES.find((item) => item.key === key);
    return stage ? stage.label : "完成";
  }

  function stageIndex(key) {
    return STAGES.findIndex((item) => item.key === key);
  }

  function isSpeakAvailable() {
    return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  }

  function speakButton(text, lang, label, extraClass) {
    if (!isSpeakAvailable()) {
      return `<button type="button" class="lz-speak" disabled>🔊 不支持</button>`;
    }
    return `<button type="button" class="lz-speak ${extraClass || ""}" data-lz-say="${esc(text)}" data-lz-lang="${esc(lang || "en-US")}" data-lz-label="${esc(label || "🔊 AI 朗读")}">${esc(label || "🔊 AI 朗读")}</button>`;
  }

  function speakText(text, lang, button) {
    if (!isSpeakAvailable()) {
      setReactionText("这个浏览器不能朗读…我念给你听：先看音标吧。");
      return;
    }
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang || "en-US";
    utterance.rate = 0.9;
    const original = button ? button.getAttribute("data-lz-label") || button.textContent : "";
    if (button) {
      button.classList.add("is-playing");
      button.textContent = "🔊 朗读中";
    }
    utterance.onend = () => {
      if (button) {
        button.classList.remove("is-playing");
        button.textContent = original;
      }
    };
    synth.speak(utterance);
  }

  function allForms(entry) {
    const forms = [];
    if (entry && entry.word) forms.push(entry.word);
    if (entry && Array.isArray(entry.forms)) {
      entry.forms.forEach((item) => {
        if (item && typeof item.form === "string") forms.push(item.form.trim());
      });
    }
    forms.push(
      `${entry.word}s`,
      `${entry.word}es`,
      `${entry.word}ed`,
      `${entry.word}ing`,
      `${entry.word}d`
    );
    return forms.filter((item, index) => item && forms.indexOf(item) === index).sort((a, b) => b.length - a.length);
  }

  function replaceForms(text, entry, replacement) {
    let out = String(text || "");
    allForms(entry).forEach((form) => {
      const re = new RegExp(`\\b${escRe(form)}\\b`, "gi");
      out = out.replace(re, replacement);
    });
    return out;
  }

  function sceneEnglish(entry) {
    const text = String(entry.scene || "");
    const match = text.match(/[A-Za-z]/);
    return match ? text.slice(match.index).trim() : text;
  }

  function blankSentence(entry) {
    return replaceForms(sceneEnglish(entry), entry, "____");
  }

  function hintCN(entry) {
    return replaceForms(entry.sceneCN, entry, "这个词");
  }

  function normalizeAnswer(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[.,!?;:'"”“‘’]+$/g, "")
      .replace(/\s+/g, " ");
  }

  function fullAnswerHTML(entry, sense) {
    return `
      <div class="lz-answer-full">
        <div class="lz-answer-word">${esc(entry.word)}
          <span class="lz-ipa">英 ${esc(entry.ipa_uk)} · 美 ${esc(entry.ipa_us)}</span>
          ${speakButton(entry.word, "en-US", "🔊 AI 朗读", "lz-speak-sm")}
        </div>
        <p class="lz-answer-def">${esc(entry.definition_zh)}</p>
        <p class="lz-answer-sense"><strong>${esc(sense.no)} ${esc(sense.titleCN)}</strong>：${esc(sense.definitionCN)}</p>
        <p class="lz-answer-en">${esc(entry.definition_en)}</p>
      </div>`;
  }

  /* ============================================================
     运行状态
     ============================================================ */
  function createRuntime() {
    return {
      mode: "intro",              // intro | guide | quiz | stageDone | finish
      guideStage: "stage1",
      guideSeen: {},
      stageDoneKey: "",
      done: {
        stage1: [],
        stage2: [],
        stage2b: [],
        speak: [],
        write: []
      },
      wrong: {
        stage1: 0,
        stage2: 0,
        stage2b: 0,
        speak: 0,
        write: 0
      },
      current: null,
      answerSeq: 0,
      lastSeen: {},
      cooldownUntil: {},
      startedAt: Date.now(),
      finishedAt: 0,
      snapshot: null,
      undoUsed: false,
      highlight: 0,
      totalAnswers: 0
    };
  }

  function stageComplete(stageKey) {
    return WORDS.every((entry) => runtime.done[stageKey].includes(entry.word));
  }

  function activeStage() {
    for (let i = 0; i < STAGES.length; i += 1) {
      if (!stageComplete(STAGES[i].key)) return STAGES[i].key;
    }
    return "done";
  }

  function pendingWords(stageKey) {
    return WORDS.filter((entry) => !runtime.done[stageKey].includes(entry.word));
  }

  function markAnswered(wordId) {
    runtime.answerSeq += 1;
    runtime.lastSeen[wordId] = runtime.answerSeq;
    const gap = COOL_MIN + Math.floor(Math.random() * (COOL_MAX - COOL_MIN + 1));
    runtime.cooldownUntil[wordId] = runtime.answerSeq + 1 + gap;
  }

  /* 优先取冷却结束的词；无可用词时退化为最久没出现的词（与正式页面一致） */
  function pickCool(list) {
    if (!list.length) return null;
    const seq = runtime.answerSeq;
    const cool = list.filter((entry) => {
      const until = runtime.cooldownUntil[entry.word];
      return !until || until <= seq;
    });
    if (cool.length) {
      // 冷却中的词也可能全部没到点，这里再按最久未出现排一次，避免偏科
      return cool.sort((a, b) => (runtime.lastSeen[a.word] || 0) - (runtime.lastSeen[b.word] || 0))[0];
    }
    return list.slice().sort((a, b) => (runtime.lastSeen[a.word] || 0) - (runtime.lastSeen[b.word] || 0))[0];
  }

  function resetWord(wordId) {
    STAGES.forEach((stage) => {
      runtime.done[stage.key] = runtime.done[stage.key].filter((id) => id !== wordId);
    });
  }

  function takeSnapshot() {
    runtime.snapshot = {
      done: {
        stage1: runtime.done.stage1.slice(),
        stage2: runtime.done.stage2.slice(),
        stage2b: runtime.done.stage2b.slice(),
        speak: runtime.done.speak.slice(),
        write: runtime.done.write.slice()
      },
      wrong: Object.assign({}, runtime.wrong),
      answerSeq: runtime.answerSeq,
      lastSeen: Object.assign({}, runtime.lastSeen),
      cooldownUntil: Object.assign({}, runtime.cooldownUntil),
      current: runtime.current ? Object.assign({}, runtime.current) : null,
      totalAnswers: runtime.totalAnswers
    };
    runtime.undoUsed = false;
  }

  function undoLast() {
    if (!runtime.snapshot || runtime.undoUsed) return;
    const snap = runtime.snapshot;
    runtime.done = {
      stage1: snap.done.stage1.slice(),
      stage2: snap.done.stage2.slice(),
      stage2b: snap.done.stage2b.slice(),
      speak: snap.done.speak.slice(),
      write: snap.done.write.slice()
    };
    runtime.wrong = Object.assign({}, snap.wrong);
    runtime.answerSeq = snap.answerSeq;
    runtime.lastSeen = Object.assign({}, snap.lastSeen);
    runtime.cooldownUntil = Object.assign({}, snap.cooldownUntil);
    runtime.current = snap.current ? Object.assign({}, snap.current) : null;
    runtime.totalAnswers = snap.totalAnswers;
    runtime.undoUsed = true;
    runtime.highlight = 0;
    setReactionText("好…回撤了一步。只能退这一步，再多就不行了。");
    render();
  }

  /* ============================================================
     DOM 与引导气泡
     ============================================================ */
  function buildOverlay() {
    const fox = window.LIZZWORD_LIZZ_FOX_SVG || "";
    const photo = S && typeof S.photoUrl === "function" ? S.photoUrl() : "";
    const el = document.createElement("div");
    el.className = "lz-tut";
    el.id = "lzTut";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", "Lizzword 新手教程");
    el.innerHTML = `
      <div class="lz-tut-shell">
        <div class="lz-tut-top">
          <button type="button" class="lz-skip" data-lz-skip aria-label="跳过新手教程">跳过</button>
          <span class="lz-tut-title">新手教程</span>
          <span class="lz-tut-progress" id="lzProgress"></span>
        </div>
        <div class="lz-guide">
          <div class="lz-guide-avatar" aria-hidden="true">${photo ? `<img class="lz-guide-photo" src="${esc(photo)}" alt="" onerror="this.remove()">` : ""}${fox}</div>
          <div class="lz-guide-bubble">
            <p class="lz-guide-name">Lizz</p>
            <p class="lz-guide-text" id="lzGuideText"></p>
            <p class="lz-guide-react" id="lzReactText" aria-live="polite"></p>
          </div>
        </div>
        <div class="lz-tut-body" id="lzBody"></div>
      </div>`;
    return el;
  }

  function setGuideLines(lines) {
    const target = overlay.querySelector("#lzGuideText");
    if (!target) return;
    target.innerHTML = (lines || []).map((line) => esc(line)).join("<br>");
  }

  function setGuideHTML(html) {
    const target = overlay.querySelector("#lzGuideText");
    if (target) target.innerHTML = html;
  }

  function setReactionText(text) {
    const target = overlay.querySelector("#lzReactText");
    if (!target) return;
    target.textContent = text || "";
    target.classList.remove("is-pop");
    void target.offsetWidth;
    if (text) target.classList.add("is-pop");
  }

  function setReaction(kind) {
    const lines = (S && S.LINES && S.LINES[kind]) || [];
    setReactionText(randomOf(lines) || "");
  }

  function updateProgress() {
    const target = overlay.querySelector("#lzProgress");
    if (!target) return;
    const stage = activeStage();
    if (stage === "done") {
      target.textContent = "5 / 5";
      return;
    }
    const index = stageIndex(stage);
    const passed = runtime.done[stage].length;
    target.textContent = `阶段 ${index + 1}/5 · ${stageLabel(stage)} · ${passed}/${WORDS.length}`;
  }

  function setBody(html) {
    const body = overlay.querySelector("#lzBody");
    if (body) body.innerHTML = html;
    updateProgress();
  }

  /* ============================================================
     渲染：开场 / 阶段说明 / 阶段完成 / 完成页
     ============================================================ */
  function render() {
    if (!isOpenNow) return;
    if (runtime.mode === "intro") return renderIntro();
    if (runtime.mode === "guide") return renderGuide(runtime.guideStage);
    if (runtime.mode === "quiz") return renderQuiz();
    if (runtime.mode === "stageDone") return renderStageDone(runtime.stageDoneKey);
    if (runtime.mode === "finish") return renderFinish();
    return renderQuiz();
  }

  function renderIntro() {
    setGuideLines((S.LINES && S.LINES.intro) || ["那个…我、我叫 Lizz。"]);
    setReactionText("");
    setBody(`
      <div class="lz-card lz-intro-card">
        <p class="lz-kicker">跟着 Lizz 走一遍</p>
        <h2 class="lz-card-title">先用三个最简单的词，把整个流程走通</h2>
        <p class="lz-card-text">教程会按正式学习流程走五次：<strong>认词 → 看中选英 → 看英选中 → 说 → 写</strong>。词只有 <strong>hello、bye、love</strong> 三个，干扰项也只从这三个里出。</p>
        <ul class="lz-list">
          <li>每一步都会先说清楚「练什么、为什么这样练」，再让你自己动手。</li>
          <li>答错、回撤、写阶段不计入这些关键规则，会在当场用一两句话解释。</li>
          <li>随时可以点左上角「跳过」，之后不会再自动弹出。</li>
        </ul>
        <button type="button" class="lz-btn" data-lz-start>${esc((S.LINES && S.LINES.introButton) || "开始")}</button>
      </div>`);
  }

  function renderGuide(stageKey) {
    const guide = STAGE_GUIDES[stageKey];
    runtime.guideSeen[stageKey] = true;
    setGuideLines([guide.voice]);
    setReactionText("");
    const stage = STAGES.find((item) => item.key === stageKey);
    setBody(`
      <div class="lz-card lz-guide-card">
        <p class="lz-kicker">${esc(`阶段 ${stageIndex(stageKey) + 1} · ${stage ? stage.label : ""}`)}</p>
        <h2 class="lz-card-title">${esc(guide.title)}</h2>
        <div class="lz-guide-block">
          <span class="lz-guide-tag">练什么</span>
          <p>${esc(guide.what)}</p>
        </div>
        <div class="lz-guide-block">
          <span class="lz-guide-tag">为什么这样练</span>
          <p>${esc(guide.why)}</p>
        </div>
        <div class="lz-guide-block">
          <span class="lz-guide-tag">怎么操作</span>
          <p>${esc(guide.how)}</p>
        </div>
        <button type="button" class="lz-btn" data-lz-guide-go>我明白了，开始这一步</button>
      </div>`);
  }

  function renderStageDone(stageKey) {
    const stage = STAGES.find((item) => item.key === stageKey);
    const wrongCount = runtime.wrong[stageKey] || 0;
    const next = activeStage();
    setGuideLines([
      `这一步过了…${wrongCount ? `你在这里答错了 ${wrongCount} 次，但没有关系。` : "一次都没错。"}`,
      "我们继续。"
    ]);
    setReactionText("");
    setBody(`
      <div class="lz-card lz-done-card">
        <p class="lz-kicker">阶段完成</p>
        <h2 class="lz-card-title">${esc(stage ? stage.label : "")} · 三个词都通过了</h2>
        <p class="lz-card-text">这一步练的是：${esc(STAGE_GUIDES[stageKey] ? STAGE_GUIDES[stageKey].what : "")}</p>
        <p class="lz-card-text">${wrongCount ? `本阶段答错 ${wrongCount} 次。答错的词按规则退回了第一轮，已经重新走完。` : "本阶段没有答错，节奏很稳。"}</p>
        <button type="button" class="lz-btn" data-lz-stage-next>${next === "done" ? "查看完成页" : `进入${esc(stageLabel(next))}`}</button>
      </div>`);
  }

  function renderFinish() {
    const totalWrong = Object.values(runtime.wrong).reduce((sum, n) => sum + n, 0);
    const seconds = Math.max(1, Math.round((Date.now() - runtime.startedAt) / 1000));
    setGuideLines((S.LINES && S.LINES.finish) || ["走完了…！"]);
    setReactionText("");
    setBody(`
      <div class="lz-card lz-finish-card">
        <p class="lz-kicker">教程完成</p>
        <h2 class="lz-card-title">五个阶段都走完了</h2>
        <p class="lz-card-text">你刚刚完整走了：认词 → 看中选英 → 看英选中 → 说 → 写。正式学习时也是这个顺序，只是词会变多。</p>
        <div class="lz-stats">
          <div><span>${WORDS.length}</span><small>个词</small></div>
          <div><span>${runtime.totalAnswers}</span><small>次作答</small></div>
          <div><span>${totalWrong}</span><small>次答错</small></div>
          <div><span>${seconds}</span><small>秒</small></div>
        </div>
        <p class="lz-card-text">以后我就待在右下角。点我一下，我会冒一个颜文字；连点三下我会躲起来，只有你背完 10 个单词才回来；连点十下我会消失到明天。</p>
        <button type="button" class="lz-btn" data-lz-finish>完成，回到主界面</button>
      </div>`);
  }

  /* ============================================================
     渲染：题目与反馈
     ============================================================ */
  function ensureCurrent() {
    if (runtime.current) return;
    const stage = activeStage();
    if (stage === "done") {
      runtime.mode = "finish";
      return;
    }
    const pool = stage === "stage1" ? pendingWords(stage) : pendingWords(stage);
    const entry = stage === "stage1" ? randomOf(pool) : pickCool(pool);
    if (!entry) {
      runtime.mode = "finish";
      return;
    }
    const current = {
      stage,
      wordId: entry.word,
      answered: false,
      correct: false,
      chosen: "",
      hintOpen: false,
      input: "",
      message: "",
      values: [],
      answerValue: ""
    };
    const dir = CHOICE_DIRECTIONS[stage];
    if (dir) {
      current.answerValue = entry[dir.optionField];
      current.values = shuffle([
        entry[dir.optionField],
        ...WORDS.filter((item) => item.word !== entry.word).map((item) => item[dir.optionField])
      ]);
    }
    runtime.highlight = 0;
    runtime.current = current;
  }

  function stageBar(stageKey) {
    const stage = STAGES.find((item) => item.key === stageKey);
    return `
      <div class="lz-stagebar">
        <span class="lz-pill">阶段 ${stageIndex(stageKey) + 1} · ${esc(stage ? stage.label : "")}</span>
        <span class="lz-stage-count">已通过 ${runtime.done[stageKey].length}/${WORDS.length}</span>
        <span class="lz-stage-count">答错 ${runtime.wrong[stageKey] || 0}</span>
      </div>`;
  }

  function choiceOptionsHTML(current) {
    return `
      <div class="lz-options" role="listbox" aria-label="选项">
        ${current.values.map((value, index) => `
          <button type="button" role="option" class="lz-option ${index === runtime.highlight ? "is-highlight" : ""} ${runtime.current.answered && value === current.answerValue ? "is-correct" : ""} ${runtime.current.answered && value === current.chosen && value !== current.answerValue ? "is-wrong" : ""}" data-lz-option="${esc(value)}" data-lz-option-index="${index}" aria-selected="${index === runtime.highlight ? "true" : "false"}">
            <span class="lz-option-key">${index + 1}</span>
            <span class="lz-option-text">${esc(value)}</span>
          </button>`).join("")}
      </div>`;
  }

  function currentWord() {
    return getWord(runtime.current ? runtime.current.wordId : "");
  }

  function feedbackBlock(ok, extra) {
    const entry = currentWord();
    const sense = entry.senses[0];
    const current = runtime.current;
    return `
      <div class="lz-feedback ${ok ? "is-ok" : "is-bad"}" role="status">
        <p class="lz-feedback-title">${ok ? "✓ 答对了" : "✗ 答错了"}</p>
        ${ok ? "" : fullAnswerHTML(entry, sense)}
        <div class="lz-summary">
          <p class="lz-summary-word">${esc(entry.word)}
            <span class="lz-ipa">英 ${esc(entry.ipa_uk)} · 美 ${esc(entry.ipa_us)}</span>
            ${speakButton(entry.word, "en-US", "🔊 AI 朗读", "lz-speak-sm")}
          </p>
          <p><strong>核心义：</strong>${esc(entry.definition_zh)}</p>
          <p><strong>本次义项：</strong>${esc(sense.no)} ${esc(sense.titleCN)}——${esc(sense.definitionCN)}</p>
          <p class="lz-example">${esc(sense.example)}<br><span>${esc(sense.exampleCN)}</span></p>
          ${extra ? `<p class="lz-extra">${esc(extra)}</p>` : ""}
        </div>
        <div class="lz-row">
          <button type="button" class="lz-btn ghost" data-lz-undo ${runtime.snapshot && !runtime.undoUsed ? "" : "disabled"}>↩ 回撤这一步</button>
          <button type="button" class="lz-btn" data-lz-next>确认，下一个</button>
        </div>
      </div>`;
  }

  function questionHintHTML() {
    return `
      <div class="lz-row lz-hint-row">
        <button type="button" class="lz-btn ghost" data-lz-hint>${runtime.current.hintOpen ? "收起提示" : "看一眼提示"}</button>
      </div>
      ${runtime.current.hintOpen ? `
        <div class="lz-hint">
          <p class="lz-hint-word">${esc(currentWord().word)} <span class="lz-ipa">英 ${esc(currentWord().ipa_uk)} · 美 ${esc(currentWord().ipa_us)}</span></p>
          <p>${esc(currentWord().definition_zh)}</p>
          <p class="lz-hint-en">${esc(sceneEnglish(currentWord())).replace("____", "<strong>____</strong>")}</p>
        </div>` : ""}
    `;
  }

  function renderQuiz() {
    ensureCurrent();
    if (!runtime.current) {
      if (runtime.mode === "finish") return renderFinish();
      return renderIntro();
    }
    const current = runtime.current;
    const entry = currentWord();
    const stageKey = current.stage;

    if (current.answered) {
      let extra = "";
      if (current.correct) {
        if (stageComplete(stageKey)) {
          if (stageKey === "write") extra = "写阶段完成了。点「确认，下一个」查看完成页。";
          else extra = `阶段 ${stageIndex(stageKey) + 1} 三个词都通过了。点「确认，下一个」继续。`;
        } else {
          extra = "继续下一个。";
        }
      } else {
        if (stageKey === "write") {
          extra = "写阶段只纠正、不重置阶段；这个词已排到写队列末尾，隔几个其他词后会再出现。";
        } else if (stageKey === "speak") {
          extra = "这个词已退回第一轮，从认词重新走完整轮次；其他已经通过的阶段也会重新确认。";
        } else {
          extra = "这个词已退回第一轮，从认词重新走完整轮次；先隔 3–7 个其他词再出现。";
        }
      }
      setBody(`
        ${stageBar(stageKey)}
        ${renderPrompt(current, entry)}
        ${feedbackBlock(current.correct, extra)}
      `);
      return;
    }

    setBody(`
      ${stageBar(stageKey)}
      ${renderPrompt(current, entry)}
      ${stageKey === "write" ? renderWriteBox(current) : ""}
      ${stageKey === "speak" ? questionHintHTML() : ""}
      ${stageKey === "speak" ? `
        <div class="lz-row lz-judge-row">
          <button type="button" class="lz-btn" data-lz-judge="yes">我读对了</button>
          <button type="button" class="lz-btn ghost" data-lz-judge="no">我没读对</button>
        </div>` : ""}
      ${stageKey === "stage2" || stageKey === "stage2b" ? choiceOptionsHTML(current) : ""}
      ${stageKey === "stage1" ? `<button type="button" class="lz-btn lz-mt" data-lz-intro-done>看完，认识这个词</button>` : ""}
      <div class="lz-tip-line">${stageKey === "write" ? "按回车提交；忽略大小写和首尾标点。" : stageKey === "stage2" || stageKey === "stage2b" ? "方向键可切换选项，回车确认。" : stageKey === "speak" ? "先自己读一遍，再如实自评。" : "看完点下面的按钮。"}</div>
    `);
  }

  function renderPrompt(current, entry) {
    if (current.stage === "stage1") {
      return `
        <div class="lz-prompt-note">先看完整个词条，不急着答题。</div>
        ${renderFullCard(entry)}`;
    }
    const dir = CHOICE_DIRECTIONS[current.stage];
    if (dir) {
      const promptText = esc(entry[dir.promptField]);
      const promptClass = dir.speak ? "lz-prompt lz-prompt-word" : "lz-prompt";
      return `
        <div class="lz-quiz-label">${esc(dir.label)}</div>
        <div class="${promptClass}">
          ${promptText}${dir.speak ? `
          <span class="lz-ipa">英 ${esc(entry.ipa_uk)} · 美 ${esc(entry.ipa_us)}</span>
          ${speakButton(entry.word, "en-US", "🔊 AI 朗读")}` : ""}
        </div>
        <div class="lz-prompt-sub">${esc(dir.sub)}</div>`;
    }
    if (current.stage === "speak") {
      return `
        <div class="lz-quiz-label">看场景，把挖空的目标词读出来</div>
        <div class="lz-scene">${ART[entry.word] || ""}</div>
        <div class="lz-scene-sentence">${esc(blankSentence(entry))}</div>
        <div class="lz-scene-cn">${esc(hintCN(entry))}</div>`;
    }
    return `
      <div class="lz-quiz-label">看中文意境，写出英文单词</div>
      <div class="lz-scene">${ART[entry.word] || ""}</div>
      <div class="lz-write-clue">
        <p><strong>核心意象：</strong>${esc(entry.core_image)}</p>
        <p><strong>中文释义：</strong>${esc(entry.definition_zh)}</p>
        <p><strong>场景：</strong>${esc(hintCN(entry))}</p>
      </div>`;
  }

  function renderWriteBox(current) {
    return `
      <div class="lz-write-row">
        <input class="lz-input" id="lzWriteInput" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="在这里拼出英文单词" value="${esc(current.input || "")}" aria-label="写出英文单词">
        <button type="button" class="lz-btn lz-write-submit" data-lz-write-submit>提交</button>
      </div>
      ${current.message ? `<p class="lz-write-msg">${esc(current.message)}</p>` : ""}`;
  }

  /* ============================================================
     完整词条
     ============================================================ */
  function renderFullCard(entry) {
    const senses = entry.senses || [];
    return `
      <article class="lz-wordcard">
        <header class="lz-wordhead">
          <div class="lz-wordrow">
            <h2 class="lz-word">${esc(entry.word)}</h2>
            <span class="lz-ipa">英 ${esc(entry.ipa_uk)} · 美 ${esc(entry.ipa_us)}</span>
          </div>
          <div class="lz-audio-row">
            ${speakButton(entry.word, "en-GB", "🔊 英式", "lz-speak-sm")}
            ${speakButton(entry.word, "en-US", "🔊 美式", "lz-speak-sm")}
            ${speakButton(entry.definition_en, "en-US", "🔊 AI 朗读", "lz-speak-sm")}
          </div>
          <p class="lz-def">${esc(entry.definition_zh)}</p>
          <p class="lz-def-en">${esc(entry.definition_en)}</p>
          <p class="lz-core"><span>核心意象</span>${esc(entry.core_image)}</p>
          <div class="lz-scene">${ART[entry.word] || ""}</div>
          <p class="lz-scene-text">${esc(entry.scene)}</p>
          <p class="lz-scene-cn">${esc(entry.sceneCN)}</p>
        </header>

        <section class="lz-sec">
          <h3>词性与释义</h3>
          ${(entry.pos || []).map((item) => `<p class="lz-pos"><span class="lz-tag">${esc(item.tag)}</span>${esc(item.zh)}</p>`).join("")}
        </section>

        <section class="lz-sec">
          <h3>核心义项</h3>
          <p class="lz-sec-intro">${esc(entry.sensesIntro.cn)}</p>
          ${senses.map((sense, index) => `
            <details class="lz-sense" ${index === 0 ? "open" : ""}>
              <summary><span class="lz-no">${esc(sense.no)}</span><span class="lz-sense-title">${esc(sense.title)}</span><span class="lz-sense-cn">${esc(sense.titleCN)}</span></summary>
              <div class="lz-sense-body">
                <p class="lz-en">${esc(sense.definition)} ${speakButton(sense.definition, "en-US", "🔊 AI 朗读", "lz-speak-sm")}</p>
                <p class="lz-cn">${esc(sense.definitionCN)}</p>
                <p class="lz-example">${esc(sense.example)}<br><span>${esc(sense.exampleCN)}</span></p>
                <p class="lz-why"><strong>为什么是这个意思：</strong>${esc(sense.whyCN)}</p>
                <p class="lz-why-en">${esc(sense.why)}</p>
              </div>
            </details>`).join("")}
        </section>

        <details class="lz-sec lz-fold">
          <summary>语义地图</summary>
          <p class="lz-sec-intro">${esc(entry.semanticMap.core.cn)}</p>
          <div class="lz-chain">
            ${(entry.semanticMap.chain || []).map((item, index) => `<span class="lz-chain-item">${esc(item)}</span>${index < entry.semanticMap.chain.length - 1 ? `<span class="lz-chain-arrow">→</span>` : ""}`).join("")}
          </div>
          ${(entry.semanticMap.branches || []).map((branch) => `
            <p class="lz-branch"><span class="lz-branch-no">${esc(branch.senses)}</span>${esc(branch.cn)}</p>`).join("")}
        </details>

        <details class="lz-sec lz-fold">
          <summary>词源</summary>
          <p class="lz-sec-intro">${esc(entry.etymology.intro.cn)}</p>
          ${(entry.etymology.items || []).map((item) => `
            <div class="lz-etym">
              <span class="lz-era">${esc(item.era)}</span>
              <p class="lz-cn">${esc(item.cn)}</p>
              <p class="lz-en">${esc(item.en)}</p>
            </div>`).join("")}
          <p class="lz-root"><strong>词根线索：</strong>${esc(entry.root)}</p>
        </details>

        <details class="lz-sec lz-fold">
          <summary>词缀与词族</summary>
          <p class="lz-sec-intro">${esc(entry.affixes.intro.cn)}</p>
          ${(entry.affixes.items || []).length ? (entry.affixes.items || []).map((item) => `
            <div class="lz-affix">
              <p class="lz-affix-word">${esc(item.word)} <span>${esc(item.structure)}</span></p>
              <p class="lz-cn">${esc(item.meaningCN)}</p>
              <p class="lz-example">${esc(item.example)}<br><span>${esc(item.exampleCN)}</span></p>
            </div>`).join("") : `<p class="lz-empty">这个词没有能产的词缀，整体记更合适。</p>`}
          ${(entry.affixes.latinEntries || []).length ? `
            <p class="lz-subhead">拉丁同族</p>
            <p class="lz-sec-intro">${esc(entry.affixes.latinIntro.cn)}</p>
            ${(entry.affixes.latinEntries || []).map((item) => `<p class="lz-latin"><strong>${esc(item.word)}</strong>（${esc(item.structure)}）：${esc(item.meaningCN)}</p>`).join("")}
          ` : ""}
        </details>

        <details class="lz-sec lz-fold">
          <summary>相似词与易混点</summary>
          <p class="lz-sec-intro">${esc(entry.similar.note.cn)}</p>
          ${(entry.similar.groups || []).map((group) => `
            <p class="lz-subhead">${esc(group.heading)}</p>
            ${(group.entries || []).map((item) => `
              <div class="lz-similar">
                <p class="lz-similar-head">${esc(item.word)} <span class="lz-ipa">${esc(item.ipa)}</span> <span class="lz-tag">${esc(item.tag)}</span></p>
                <p class="lz-cn">${esc(item.definitionCN)}</p>
                <p class="lz-en">${esc(item.definition)}</p>
              </div>`).join("")}
          `).join("")}
        </details>

        <details class="lz-sec lz-fold">
          <summary>联想记忆</summary>
          <p class="lz-sec-intro">${esc(entry.mnemonics.normalIntro.cn)}</p>
          ${(entry.mnemonics.normal || []).map((item) => `<p class="lz-mnemonic">${esc(item.cn)}<br><span class="lz-en">${esc(item.en)}</span></p>`).join("")}
          <p class="lz-subhead">抽象联想</p>
          ${(entry.mnemonics.abstract || []).map((item) => `<p class="lz-mnemonic">${esc(item.cn)}<br><span class="lz-en">${esc(item.en)}</span></p>`).join("")}
        </details>

        <details class="lz-sec lz-fold">
          <summary>搭配、变形、派生与例句</summary>
          <p class="lz-subhead">常见搭配</p>
          ${(entry.collocations || []).map((item) => `<p class="lz-colloc"><span class="lz-en">${esc(item.phrase)}</span><span class="lz-cn">${esc(item.zh)}</span></p>`).join("")}
          <p class="lz-subhead">变形</p>
          ${(entry.forms || []).map((item) => `<p class="lz-form"><span>${esc(item.label)}</span>${esc(item.form)}</p>`).join("")}
          <p class="lz-subhead">派生词</p>
          ${(entry.derivatives || []).length ? (entry.derivatives || []).map((item) => `<p class="lz-form"><span>${esc(item.pos)}</span>${esc(item.word)}：${esc(item.zh)}</p>`).join("") : `<p class="lz-empty">这个词没有常见的派生词。</p>`}
          <p class="lz-subhead">例句</p>
          ${(entry.examples || []).map((item) => `<p class="lz-example">${esc(item.en)}<br><span>${esc(item.cn)}</span></p>`).join("")}
          <p class="lz-dict"><strong>记忆钩子：</strong>${esc(entry.dict_mnemonic.text)}</p>
        </details>
      </article>`;
  }

  /* ============================================================
     作答
     ============================================================ */
  function addDone(stageKey, wordId) {
    if (!runtime.done[stageKey].includes(wordId)) runtime.done[stageKey].push(wordId);
  }

  function answerChoice(chosen) {
    const current = runtime.current;
    if (!current || current.answered) return;
    const entry = currentWord();
    takeSnapshot();
    markAnswered(entry.word);
    runtime.totalAnswers += 1;
    const correct = chosen === current.answerValue;
    current.answered = true;
    current.correct = correct;
    current.chosen = chosen;
    if (correct) {
      addDone(current.stage, entry.word);
      setReaction("correct");
    } else {
      runtime.wrong[current.stage] += 1;
      resetWord(entry.word);
      setReaction("wrong");
    }
    renderQuiz();
  }

  function judgeSpeak(ok) {
    const current = runtime.current;
    if (!current || current.answered) return;
    const entry = currentWord();
    takeSnapshot();
    markAnswered(entry.word);
    runtime.totalAnswers += 1;
    current.answered = true;
    current.correct = Boolean(ok);
    if (ok) {
      addDone("speak", entry.word);
      setReaction("correct");
    } else {
      runtime.wrong.speak += 1;
      resetWord(entry.word);
      setReaction("wrong");
    }
    renderQuiz();
  }

  function submitWrite() {
    const current = runtime.current;
    if (!current || current.answered) return;
    const input = overlay.querySelector("#lzWriteInput");
    if (!input) return;
    const raw = input.value;
    current.input = raw;
    if (!normalizeAnswer(raw)) {
      current.message = "还没写呢…先拼一个再提交。";
      renderQuiz();
      return;
    }
    const entry = currentWord();
    takeSnapshot();
    markAnswered(entry.word);
    runtime.totalAnswers += 1;
    const correct = normalizeAnswer(raw) === normalizeAnswer(entry.word);
    current.answered = true;
    current.correct = correct;
    current.chosen = raw;
    current.message = "";
    if (correct) {
      addDone("write", entry.word);
      setReaction("correct");
    } else {
      runtime.wrong.write += 1;
      setReaction("wrong");
    }
    renderQuiz();
  }

  function completeIntroWord() {
    const current = runtime.current;
    if (!current || current.stage !== "stage1") return;
    const entry = currentWord();
    addDone("stage1", entry.word);
    setReaction("correct");
    runtime.current = null;
    if (stageComplete("stage1")) {
      runtime.stageDoneKey = "stage1";
      runtime.mode = "stageDone";
      render();
    } else {
      renderQuiz();
    }
  }

  function nextAfterFeedback() {
    if (!runtime.current) return;
    const finishedStage = runtime.current.stage;
    runtime.current = null;
    if (stageComplete(finishedStage)) {
      runtime.stageDoneKey = finishedStage;
      runtime.mode = "stageDone";
      render();
      return;
    }
    runtime.mode = "quiz";
    render();
  }

  function goNextStage() {
    const next = activeStage();
    if (next === "done") {
      runtime.mode = "finish";
      render();
      return;
    }
    runtime.current = null;
    if (!runtime.guideSeen[next]) {
      runtime.guideStage = next;
      runtime.mode = "guide";
    } else {
      runtime.mode = "quiz";
    }
    render();
  }

  /* ============================================================
     键盘
     ============================================================ */
  function onKeyDown(event) {
    if (!runtime) return;
    const current = runtime.current;
    const input = overlay.querySelector("#lzWriteInput");
    const isInput = event.target && event.target.tagName === "INPUT";

    if (current && !current.answered && current.stage === "write") {
      if (event.key === "Enter") {
        event.preventDefault();
        submitWrite();
      }
      return;
    }

    if (isInput) return;

    if (current && !current.answered && (current.stage === "stage2" || current.stage === "stage2b")) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const delta = event.key === "ArrowDown" ? 1 : -1;
        runtime.highlight = (runtime.highlight + delta + current.values.length) % current.values.length;
        overlay.querySelectorAll(".lz-option").forEach((btn, index) => {
          btn.classList.toggle("is-highlight", index === runtime.highlight);
          btn.setAttribute("aria-selected", index === runtime.highlight ? "true" : "false");
        });
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const btn = overlay.querySelector(`.lz-option[data-lz-option-index="${runtime.highlight}"]`);
        if (btn) answerChoice(btn.getAttribute("data-lz-option"));
      }
    }
  }

  /* ============================================================
     交互
     ============================================================ */
  function onOverlayClick(event) {
    const target = event.target;
    if (!target || !target.closest) return;

    const speak = target.closest("[data-lz-say]");
    if (speak) {
      speakText(speak.getAttribute("data-lz-say"), speak.getAttribute("data-lz-lang"), speak);
      return;
    }

    if (target.closest("[data-lz-skip]")) {
      skipTutorial();
      return;
    }

    if (target.closest("[data-lz-start]")) {
      runtime.mode = "guide";
      runtime.guideStage = "stage1";
      render();
      return;
    }

    if (target.closest("[data-lz-guide-go]")) {
      runtime.mode = "quiz";
      runtime.current = null;
      render();
      return;
    }

    if (target.closest("[data-lz-intro-done]")) {
      completeIntroWord();
      return;
    }

    const option = target.closest("[data-lz-option]");
    if (option) {
      answerChoice(option.getAttribute("data-lz-option"));
      return;
    }

    if (target.closest("[data-lz-hint]")) {
      runtime.current.hintOpen = !runtime.current.hintOpen;
      renderQuiz();
      return;
    }

    if (target.closest("[data-lz-judge]")) {
      judgeSpeak(target.closest("[data-lz-judge]").getAttribute("data-lz-judge") === "yes");
      return;
    }

    if (target.closest("[data-lz-write-submit]")) {
      submitWrite();
      return;
    }

    if (target.closest("[data-lz-undo]")) {
      undoLast();
      return;
    }

    if (target.closest("[data-lz-next]")) {
      nextAfterFeedback();
      return;
    }

    if (target.closest("[data-lz-stage-next]")) {
      goNextStage();
      return;
    }

    if (target.closest("[data-lz-finish]")) {
      finishTutorial();
    }
  }

  /* ============================================================
     生命周期
     ============================================================ */
  function openTutorial(opts) {
    if (isOpenNow) return;
    if (!WORDS.length) {
      console.warn("[Lizz] 教程词数据未加载");
      return;
    }
    options = opts || {};
    runtime = createRuntime();
    overlay = buildOverlay();
    document.body.appendChild(overlay);
    document.body.classList.add("lz-tut-open");
    overlay.addEventListener("click", onOverlayClick);
    keyHandler = onKeyDown;
    document.addEventListener("keydown", keyHandler, true);
    isOpenNow = true;
    render();
  }

  function closeTutorial() {
    if (!isOpenNow) return;
    if (keyHandler) {
      document.removeEventListener("keydown", keyHandler, true);
      keyHandler = null;
    }
    if (overlay) {
      overlay.removeEventListener("click", onOverlayClick);
      overlay.remove();
      overlay = null;
    }
    document.body.classList.remove("lz-tut-open");
    isOpenNow = false;
    runtime = null;
    options = {};
  }

  function skipTutorial() {
    if (!isOpenNow) return;
    const callback = options.onSkip;
    closeTutorial();
    if (typeof callback === "function") callback();
  }

  function finishTutorial() {
    if (!isOpenNow) return;
    const summary = {
      words: WORDS.map((item) => item.word),
      totalAnswers: runtime.totalAnswers,
      wrong: Object.assign({}, runtime.wrong),
      seconds: Math.max(1, Math.round((Date.now() - runtime.startedAt) / 1000))
    };
    const callback = options.onFinish;
    closeTutorial();
    if (typeof callback === "function") callback(summary);
  }

  window.LIZZWORD_TUTORIAL = {
    open: openTutorial,
    close: closeTutorial,
    skip: skipTutorial,
    finish: finishTutorial,
    isOpen: () => isOpenNow,
    getRuntime: () => runtime,
    getWords: () => WORDS.slice(),
    stages: STAGES.slice(),
    _test: {
      activeStage,
      stageComplete,
      pendingWords,
      normalizeAnswer,
      blankSentence,
      hintCN
    }
  };
})();
