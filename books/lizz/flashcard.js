/* ============================================================
   Lizzword · 记忆卡（闪卡）
   - 正面只有单词；翻面后是含义、核心意象、首个义项与例句
   - 点击卡片 / 空格 / 回车翻面，Esc 或点遮罩关闭
   - 独立于主页面状态，不写入 localStorage
   - 全部 lz- 前缀，无网络、无图片
   ============================================================ */
(function () {
  "use strict";

  let root = null;
  let inner = null;
  let frontWord = null;
  let backDef = null;
  let backCore = null;
  let backSense = null;
  let backScene = null;
  let frontSpeak = null;
  let backSpeak = null;
  let closeButton = null;
  let flipButton = null;
  let flipped = false;
  let lastFocus = null;
  let speakingWord = "";
  let closing = false;
  let closeTimer = null;

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function speak(text) {
    const word = String(text || "").trim();
    if (!word) return;

    const speech = window.LZSpeech;
    if (speech) {
      speech.speak(word, {
        lang: "en-US",
        rate: 0.9,
        timeout: 1800,
        endTimeout: 2500,
        onFail: () => {
          const hint = root && root.querySelector(".lz-flash-hint");
          if (!hint) return;
          if (!hint.dataset.original) hint.dataset.original = hint.textContent;
          hint.textContent = "没听到声音？可以先看音标自己读";
          window.setTimeout(() => {
            if (hint.dataset.original) hint.textContent = hint.dataset.original;
          }, 2600);
        }
      });
      return;
    }

    // 兜底：LZSpeech 未加载时的旧逻辑
    if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== "function") return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new window.SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      /* 浏览器不支持时静默 */
    }
  }

  function build() {
    if (root) return root;
    root = document.createElement("div");
    root.className = "lz-flash";
    root.hidden = true;
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "记忆卡");
    root.innerHTML = `
      <div class="lz-flash-backdrop" data-flash-close></div>
      <article class="lz-flash-card">
        <button type="button" class="lz-flash-close" data-flash-close aria-label="关闭记忆卡">×</button>
        <div class="lz-flash-stage">
          <div class="lz-flash-inner">
            <section class="lz-flash-face lz-flash-front">
              <p class="lz-flash-kicker">单词</p>
              <p class="lz-flash-word"></p>
              <button type="button" class="lz-flash-speak lz-flash-speak-front">🔊 听发音</button>
              <p class="lz-flash-hint">点击卡片翻面</p>
            </section>
            <section class="lz-flash-face lz-flash-back">
              <p class="lz-flash-kicker">含义</p>
              <p class="lz-flash-def"></p>
              <p class="lz-flash-core" hidden></p>
              <p class="lz-flash-sense" hidden></p>
              <p class="lz-flash-scene" hidden></p>
              <button type="button" class="lz-flash-speak lz-flash-speak-back">🔊 听发音</button>
            </section>
          </div>
        </div>
        <div class="lz-flash-actions">
          <button type="button" class="lz-flash-btn" data-flash-flip>翻面</button>
          <button type="button" class="lz-flash-btn ghost" data-flash-close>关闭</button>
        </div>
      </article>`;
    document.body.appendChild(root);

    inner = root.querySelector(".lz-flash-inner");
    frontWord = root.querySelector(".lz-flash-word");
    backDef = root.querySelector(".lz-flash-def");
    backCore = root.querySelector(".lz-flash-core");
    backSense = root.querySelector(".lz-flash-sense");
    backScene = root.querySelector(".lz-flash-scene");
    frontSpeak = root.querySelector(".lz-flash-speak-front");
    backSpeak = root.querySelector(".lz-flash-speak-back");
    closeButton = root.querySelector(".lz-flash-close");
    flipButton = root.querySelector("[data-flash-flip]");

    root.addEventListener("click", (event) => {
      if (event.target.closest("[data-flash-close]")) {
        event.preventDefault();
        close();
        return;
      }
      if (event.target.closest("[data-flash-flip]")) {
        event.preventDefault();
        flip();
        return;
      }
      if (event.target.closest(".lz-flash-speak")) {
        event.preventDefault();
        event.stopPropagation();
        speak(speakingWord);
        return;
      }
      if (event.target.closest(".lz-flash-card")) {
        flip();
      } else if (event.target.classList.contains("lz-flash-backdrop")) {
        close();
      }
    });

    document.addEventListener("keydown", onKeydown, true);
    return root;
  }

  function onKeydown(event) {
    if (!root || root.hidden || closing) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    if (event.key === " " || event.key === "Enter") {
      const target = event.target;
      if (target && (target.tagName === "BUTTON" || target.tagName === "INPUT" || target.tagName === "A")) return;
      event.preventDefault();
      event.stopPropagation();
      flip();
    }
  }

  function syncFlipUI() {
    if (!root) return;
    flipped = Boolean(root.classList.contains("is-flipped"));
    if (flipButton) flipButton.textContent = flipped ? "翻回单词" : "翻面";
    root.setAttribute("aria-label", flipped ? "记忆卡 · 含义" : "记忆卡 · 单词");
    const face = root.querySelector(flipped ? ".lz-flash-back" : ".lz-flash-front");
    if (face) face.scrollTop = 0;
  }

  function setText(node, text, hidden) {
    node.textContent = text || "";
    node.hidden = hidden || !text;
  }

  function open(wordItem) {
    if (!wordItem) return false;
    build();
    const wasOpen = !root.hidden && root.classList.contains("is-open") && !closing;
    if (!wasOpen) {
      lastFocus = document.activeElement;
      document.body.classList.add("lz-flash-open");
      root.classList.remove("is-open");
      root.hidden = false;
    }
    closing = false;
    if (closeTimer) {
      window.clearTimeout(closeTimer);
      closeTimer = null;
    }
    root.classList.remove("is-flipped");
    syncFlipUI();

    const word = String(wordItem.word || "");
    speakingWord = word;
    frontWord.textContent = word;
    setText(backDef, wordItem.definition_zh, false);

    const core = wordItem.core_image ? `核心意象：${wordItem.core_image}` : "";
    setText(backCore, core, false);

    const sense = Array.isArray(wordItem.senses) && wordItem.senses.length ? wordItem.senses[0] : null;
    const senseText = sense
      ? `${sense.no ? sense.no + " " : ""}${sense.titleCN || ""}${sense.definitionCN ? " · " + sense.definitionCN : ""}`
      : "";
    setText(backSense, senseText, false);

    const sceneCN = wordItem.sceneCN || (sense && sense.exampleCN) || "";
    setText(backScene, sceneCN ? `例句：${sceneCN}` : "", false);

    if (!wasOpen) {
      window.requestAnimationFrame(() => {
        if (root && !root.hidden && !closing) root.classList.add("is-open");
      });
    }
    // 初始焦点放在“翻面”上：空格/回车直接翻面，而不是误触右上角关闭
    const focusTarget = flipButton || closeButton;
    if (focusTarget) focusTarget.focus({ preventScroll: true });
    return true;
  }

  function close() {
    if (!root || root.hidden || closing) return;
    closing = true;
    root.classList.remove("is-open");
    document.body.classList.remove("lz-flash-open");
    if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus({ preventScroll: true });
    }
    lastFocus = null;
    if (closeTimer) window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      closeTimer = null;
      if (root && !root.classList.contains("is-open")) {
        root.hidden = true;
        root.classList.remove("is-flipped");
        flipped = false;
        syncFlipUI();
      }
    }, 220);
  }

  function flip() {
    if (!root || root.hidden || closing) return;
    root.classList.toggle("is-flipped", !flipped);
    syncFlipUI();
  }

  function isOpen() {
    return Boolean(root && !root.hidden && !closing);
  }

  window.LIZZWORD_FLASHCARD = { open, close, flip, isOpen };
})();
