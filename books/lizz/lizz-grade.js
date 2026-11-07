/* ============================================================
   Lizzword · 写阶段近似给分
   纯函数，无 DOM、无网络、无状态。可解释的四档规则：
   1.00  精确匹配
   0.80  只差 1 个字母（目标 ≥4 字母）/ 只差 2 个字母（目标 ≥8 字母）/
         合法词形变化（复数、过去式、分词、比较级、原词条 forms 列表）
   0.50  同义表 / 前后缀包含关系 / 同词族派生 / 长词距离 3 且相似度 ≥0.75
   0     其余
   短词保护：2–3 个字母的词不走编辑距离，避免 bye 被 by / bet 混过去
   ============================================================ */
(function () {
  "use strict";

  /* 同义 / 等价表达。只收意思足够接近、学习者写错顺序也不冤的组。 */
  const SYNONYM_GROUPS = [
    ["bye", "goodbye", "farewell"],
    ["hi", "hello", "hey"],
    ["ok", "okay"],
    ["yes", "yeah", "yep"],
    ["no", "nope"],
    ["mom", "mum", "mother"],
    ["dad", "father"],
    ["kid", "child"],
    ["car", "automobile"],
    ["bike", "bicycle"],
    ["big", "large", "huge"],
    ["small", "little", "tiny"],
    ["fast", "quick", "rapid"],
    ["happy", "glad", "joyful"],
    ["sad", "unhappy"],
    ["smart", "clever", "bright"],
    ["angry", "mad"],
    ["tired", "weary"],
    ["begin", "start"],
    ["finish", "end"],
    ["buy", "purchase"],
    ["help", "assist"],
    ["show", "display"],
    ["use", "employ"],
    ["get", "obtain"],
    ["make", "create"],
    ["speak", "talk"],
    ["beautiful", "pretty"],
    ["difficult", "hard"],
    ["easy", "simple"],
    ["good", "fine", "nice"],
    ["phone", "telephone"],
    ["photo", "picture"],
    ["store", "shop"]
  ];

  const SYNONYM_MAP = (function () {
    const map = Object.create(null);
    SYNONYM_GROUPS.forEach((group, index) => {
      group.forEach((word) => {
        if (!map[word]) map[word] = [];
        map[word].push(index);
      });
    });
    return map;
  })();

  const SUFFIXES = [
    "ations", "ation", "ments", "ment", "nesses", "ness", "ities", "ity",
    "ings", "ing", "ers", "est", "ed", "er", "ly", "al", "ous", "ive",
    "able", "ible", "ful", "less", "age", "ism", "ist", "s"
  ];

  const COMBINING_MARKS = /[\u0300-\u036f]/g;

  function normalize(value) {
    let text = String(value == null ? "" : value);
    if (typeof text.normalize === "function") {
      text = text.normalize("NFKD").replace(COMBINING_MARKS, "");
    }
    text = text.replace(/\u3000/g, " ");
    text = text.replace(/[’‘`´]/g, "'");
    text = text.replace(/[–—]/g, "-");
    text = text.toLowerCase().trim();
    text = text.replace(/^[\s"'“”‘’.,!?;:()[\]{}]+/, "").replace(/[\s"'“”‘’.,!?;:()[\]{}]+$/, "");
    text = text.replace(/\s+/g, " ");
    text = text.replace(/'/g, "");
    text = text.replace(/-/g, " ");
    text = text.replace(/^to /, "");
    return text.trim();
  }

  function levenshtein(a, b) {
    const left = String(a || "");
    const right = String(b || "");
    if (left === right) return 0;
    if (!left.length) return right.length;
    if (!right.length) return left.length;
    let prev = new Array(right.length + 1);
    let next = new Array(right.length + 1);
    for (let j = 0; j <= right.length; j += 1) prev[j] = j;
    for (let i = 1; i <= left.length; i += 1) {
      next[0] = i;
      for (let j = 1; j <= right.length; j += 1) {
        const cost = left.charAt(i - 1) === right.charAt(j - 1) ? 0 : 1;
        next[j] = Math.min(next[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      }
      const swap = prev;
      prev = next;
      next = swap;
    }
    return prev[right.length];
  }

  function sameSynonymGroup(input, target) {
    const a = SYNONYM_MAP[input];
    const b = SYNONYM_MAP[target];
    if (!a || !b) return false;
    return a.some((index) => b.indexOf(index) !== -1);
  }

  function hasContainment(input, target) {
    const short = input.length <= target.length ? input : target;
    const long = input.length <= target.length ? target : input;
    if (short.length < 3) return false;
    if (long.length - short.length < 2) return false;
    // 只认后缀包含（goodbye ⊃ bye）；前缀包含交给同词族规则，避免 good → goodbye 误判
    return long.endsWith(short);
  }

  function stemOf(word) {
    for (let i = 0; i < SUFFIXES.length; i += 1) {
      const suffix = SUFFIXES[i];
      if (word.length - suffix.length >= 4 && word.endsWith(suffix)) {
        return word.slice(0, -suffix.length);
      }
    }
    return word;
  }

  function sameFamily(input, target, wordItem) {
    if (input === target) return false;
    if (stemOf(input) === stemOf(target) && stemOf(input).length >= 4) return true;
    const derivatives = wordItem && Array.isArray(wordItem.derivatives) ? wordItem.derivatives : [];
    for (let i = 0; i < derivatives.length; i += 1) {
      const word = normalize(derivatives[i] && derivatives[i].word);
      if (word && word === input) return true;
    }
    return false;
  }

  function generatedForms(target) {
    if (target.indexOf(" ") !== -1) return [];
    const forms = [];
    const push = (value) => {
      const word = normalize(value);
      if (word && word !== target && forms.indexOf(word) === -1) forms.push(word);
    };
    const endsWithY = target.endsWith("y");
    const endsWithE = target.endsWith("e");
    push(target + "s");
    push(endsWithY ? target.slice(0, -1) + "ies" : target + "es");
    push(endsWithY ? target.slice(0, -1) + "ied" : (endsWithE ? target + "d" : target + "ed"));
    push(endsWithE ? target.slice(0, -1) + "ing" : target + "ing");
    push(endsWithY ? target.slice(0, -1) + "ier" : target + "er");
    push(endsWithY ? target.slice(0, -1) + "iest" : target + "est");
    return forms;
  }

  function isLegalForm(input, target, wordItem) {
    const forms = generatedForms(target);
    const declared = wordItem && Array.isArray(wordItem.forms) ? wordItem.forms : [];
    for (let i = 0; i < declared.length; i += 1) {
      const word = normalize(declared[i] && declared[i].form);
      if (word && forms.indexOf(word) === -1) forms.push(word);
    }
    return forms.indexOf(input) !== -1;
  }

  function similarity(a, b) {
    const longest = Math.max(a.length, b.length);
    if (!longest) return 1;
    return 1 - levenshtein(a, b) / longest;
  }

  function result(score, band, reason, target, input) {
    return { score, band, pass: score >= 0.8, reason, target, input };
  }

  function gradeWrite(rawInput, targetWord, wordItem) {
    const input = normalize(rawInput);
    const target = normalize(targetWord);

    if (!input || !target) {
      return result(0, "none", "没有识别到英文单词", target, input);
    }
    if (input === target) {
      return result(1, "exact", "拼写完全一致", target, input);
    }

    const length = target.length;
    const distance = levenshtein(input, target);

    // 0.80 · 近似拼写（短词保护：2–3 个字母不适用编辑距离）
    if ((length >= 4 && distance === 1) || (length >= 8 && distance === 2)) {
      return result(0.8, "near-spelling", `只差 ${distance} 个字母`, target, input);
    }
    // 0.80 · 合法词形变化
    if (isLegalForm(input, target, wordItem)) {
      return result(0.8, "near-spelling", "命中了合法词形变化", target, input);
    }

    // 0.50 · 意思对但写法不同
    if (sameSynonymGroup(input, target)) {
      return result(0.5, "meaning-match", "同义表达", target, input);
    }
    if (hasContainment(input, target)) {
      return result(0.5, "meaning-match", "包含关系", target, input);
    }
    if (sameFamily(input, target, wordItem)) {
      return result(0.5, "meaning-match", "同词族派生", target, input);
    }
    if (length >= 10 && distance === 3 && similarity(input, target) >= 0.75) {
      return result(0.5, "meaning-match", "长词近似", target, input);
    }

    return result(0, "none", "与标准答案不一致", target, input);
  }

  window.LIZZWORD_GRADE = {
    normalize,
    levenshtein,
    gradeWrite
  };
})();
