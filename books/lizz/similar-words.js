/* ============================================================
   LIZZWORD · 相似词整理（独立模块，无依赖，file:// 可用）

   把词条里的 similar.groups 整理成可直接渲染的两组：
     { near: [...], lookAlike: [...] }

   similar.groups 目前存在 30 种组标题写法：
     NEAR MEANING（3419 词）、NEAR-SYNONYMS（87）、NEAR-MEANING（15）、
     SOUND-ALIKE（12）、WORD FAMILY（15）、SAME ROOT FAMILY（4）、
     RELATED PROCESSES、SCALE ADJECTIVES、FIGURATIVE 'WORLD' SENSE …
   本模块用关键词打分把任意标题归入“近义 / 形近”两类，不再依赖固定标题。

   同时做四件清理：
   1. 去重（大小写不敏感；同一个词同时出现在两组时优先保留在近义组）
   2. 去掉指向自身词条的条目（例如 insured 的 “insured — itself”）
   3. 过滤空串、null/undefined 之类的占位文本
   4. 缺 field 时按空串输出，渲染方无需再做防御

   用法：
     const groups = window.LZSimilarWords.extract(entry);
     // 也可传原始的 similar 对象：extract(entry.similar, entry.word)
     // 返回：{ near:[{word, ipa, tag, definition, definitionCN, heading, type}],
     //         lookAlike:[...] }
   ============================================================ */
(function () {
  "use strict";

  const VERSION = "1.0.0";
  const PLACEHOLDER = /^(?:undefined|null|none|n\/a|暂无|待补|-|—)$/i;

  // 关键词打分：先看“明确是形近”的强特征，再看“近义”特征；
  // 都不命中时按“形近”处理，避免把词族误当同义词。
  const STRONG_LOOK = ["look-alike", "sound-alike", "form-alike", "spell", "word family", "same root", "root family", "prefix"];
  const NEAR_KEYS = ["near", "synonym", "related", "semantic", "meaning", "field", "sibling", "scale", "figurative", "sense", "similar"];
  const LOOK_KEYS = ["look", "sound", "form", "spell", "word family", "same root", "root family", "prefix", "profession", "family", "root"];

  function isText(value) {
    return typeof value === "string" && value.trim() !== "" && !PLACEHOLDER.test(value.trim());
  }

  function clean(value) {
    return isText(value) ? value.trim() : "";
  }

  function countHits(text, keys) {
    let hits = 0;
    for (let i = 0; i < keys.length; i += 1) {
      if (text.indexOf(keys[i]) > -1) hits += 1;
    }
    return hits;
  }

  /**
   * 判断一个组标题属于“近义”还是“形近”。
   * 返回 "near" 或 "look"；无法识别时按 "look"（更保守，不会把词族当同义词）。
   */
  function classifyHeading(heading) {
    const text = clean(heading).toLowerCase();
    if (!text) return "look";
    if (countHits(text, STRONG_LOOK) > 0) return "look";
    const nearHits = countHits(text, NEAR_KEYS);
    if (nearHits > 0) return "near";
    const lookHits = countHits(text, LOOK_KEYS);
    if (lookHits > 0) return "look";
    // 同分/无关键词：含 “近义/同义” 中文写法时归近义，否则归形近
    return /近义|同义/.test(text) ? "near" : "look";
  }

  function normalizeEntry(raw, heading, type, targetWord, seen) {
    if (!raw || typeof raw !== "object") return null;
    const word = clean(raw.word);
    if (!word) return null;
    const lower = word.toLowerCase();
    if (targetWord && lower === targetWord.toLowerCase()) return null; // 自我引用
    if (seen.has(lower)) return null;
    const definition = clean(raw.definition);
    const definitionCN = clean(raw.definitionCN);
    if (!definition && !definitionCN) return null;
    seen.add(lower);
    return {
      word: word,
      ipa: clean(raw.ipa),
      tag: clean(raw.tag),
      definition: definition,
      definitionCN: definitionCN,
      heading: clean(heading),
      type: type
    };
  }

  /**
   * 从词条或 similar 对象中整理相似词。
   * @param {Object} entry 词条（含 word 与 similar）或直接的 similar 对象
   * @param {String} [targetWord] 仅当第一个参数是 similar 对象时传入目标词
   * @returns {{near: Array, lookAlike: Array}}
   */
  function extract(entry, targetWord) {
    const empty = { near: [], lookAlike: [] };
    if (!entry || typeof entry !== "object") return empty;

    let similar = entry;
    let target = clean(targetWord);
    if (entry.similar && typeof entry.similar === "object") {
      similar = entry.similar;
      if (!target) target = clean(entry.word);
    } else if (!target) {
      target = clean(entry.word);
    }
    if (!similar || !Array.isArray(similar.groups)) return empty;

    const near = [];
    const lookAlike = [];
    const pending = [];

    similar.groups.forEach((group) => {
      if (!group || !Array.isArray(group.entries)) return;
      const heading = clean(group.heading);
      const type = classifyHeading(heading);
      group.entries.forEach((item) => {
        pending.push({ item: item, heading: heading, type: type });
      });
    });

    // 先收近义组，再收形近组：重复词优先保留在近义组
    const seen = new Set();
    pending.forEach((cell) => {
      if (cell.type !== "near") return;
      const item = normalizeEntry(cell.item, cell.heading, "near", target, seen);
      if (item) near.push(item);
    });
    pending.forEach((cell) => {
      if (cell.type === "near") return;
      const item = normalizeEntry(cell.item, cell.heading, "look", target, seen);
      if (item) lookAlike.push(item);
    });

    return { near: near, lookAlike: lookAlike };
  }

  window.LZSimilarWords = {
    version: VERSION,
    extract: extract,
    classifyHeading: classifyHeading
  };
})();
