/* ============================================================
   LIZZWORD · 选择题选项生成器（独立模块，无依赖，file:// 可用）

   解决的问题：
   1. 中文题（看英文选中文）原来按“英文拼写相近”挑干扰项，导致
      hereditary 配 提升/改善/提高 这类完全不对路的选项；
   2. 正确项常常是整串 definition_zh（中位数 21 字），而干扰项只有 2-3 字，
      只看长度就能选对；
   3. 干扰项可能正好是正确义项之一，出现多个正确答案；
   4. 63 个固定词组反复使用，3534 道题只有 124 种选项组合。

   做法：
   - 中文题：干扰项直接从本书 3534 词里挑，要求同词性、首义项长度接近、
     且语义与目标词的全部义项不重叠（消除多答案）；正确答案改用“首义项”
     的短释义（中位数 3 字），四个选项长度自然拉平。
   - 英文题：仍按拼写相近挑，但限定在本书词内，并排除派生词、同词族、
     以及中文释义与目标词重叠的词（否则也会出现多个正确答案）。
   - 每个单词维护最近使用过的选项组合，重复出题时自动换一组。

   用法：
     const result = window.LZQuizOptions.buildOptions(entry, pool, "meaning");
     // entry：当前词条（需含 word / pos / definition_zh / senses）
     // pool ：本书全部词条数组（3534 条即可；传当前会话以外的词也行）
     // mode ："meaning"（看英文选中文）| "word"（看中文选英文）
     // 可选 options：
     //   senseIndex: 指定用第几个义项的 titleCN 作正确答案（默认用首词性首义项）
     //   gloss:      直接指定正确答案文本（优先级最高）
     //   rand:       自定义随机函数（默认 Math.random，测试时可固定种子）
     //   attempts:   打散重试次数（默认 6）
     //   maxSpread:  允许的最大选项字数差（默认 4）
     // 返回：
     //   { answer, options:[4], answerIndex, mode,
     //     meta:{ layer, degraded, lengthSpread, attempts, candidates } }

   注意：本模块不读写 localStorage、不发网络请求，不修改任何全局状态。
   ============================================================ */
(function () {
  "use strict";

  const VERSION = "1.0.0";
  const MODE_MEANING = "meaning";
  const MODE_WORD = "word";

  const CN_SPLIT = /[；;、，,]/;
  // “名词：地形上的”“名词缩写：脱氧核糖核酸”“stratum 的复数：地层群”这类前缀统一剥掉
  const POS_PREFIX = /^(?:专有名词短语|状语短语|名词缩写|介词短语|副词性短语|形容词短语|动词短语|名词短语|固定短语|复数名词|不可数名词|单数名词|复数形式|专有名词|名词|动词|形容词|副词|介词|连词|代词|数词|量词|感叹词|短语|习语|缩写)(?:性|短语|缩写|性短语)?\s*[：:]\s*/;
  const LATIN_META_PREFIX = /^[A-Za-z][A-Za-z' -]*\s*的(?:复数|过去式|过去分词|现在分词|比较级|最高级)\s*[：:]\s*/;
  const PLACEHOLDER = /^(?:undefined|null|none|n\/a|暂无|待补|-|—)$/i;
  const ENGLISH_WORD = /^[A-Za-z][A-Za-z' -]*$/;

  const FALLBACK_MEANING = ["另一种含义", "无关的概念", "另一个动作", "另一种状态", "另一类事物", "另一个对象"];
  const FALLBACK_WORD = ["anotherword", "otherword", "thirdword", "fourthword", "fifthword", "sixthword"];

  /* ---------- 文本工具 ---------- */

  function isText(value) {
    return typeof value === "string" && value.trim() !== "" && !PLACEHOLDER.test(value.trim());
  }

  function charLen(value) {
    return Array.from(String(value)).length;
  }

  function clean(value) {
    if (!isText(value)) return "";
    let text = value.trim().replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, "");
    text = text.replace(LATIN_META_PREFIX, "").replace(POS_PREFIX, "").replace(/（[^）]*）|\([^)]*\)/g, "").trim();
    return text;
  }

  function segments(value) {
    const text = clean(value);
    if (!text) return [];
    const parts = text.split(CN_SPLIT).map(clean).filter(Boolean);
    return parts.length ? parts : [text];
  }

  const glossCache = new WeakMap();
  const unitsCache = new WeakMap();
  const posCache = new WeakMap();
  const familyCache = new WeakMap();

  // 首义项短释义：pos[0].zh 的第一段，中位数 3 字
  function firstGloss(entry) {
    if (!entry || typeof entry !== "object") return "";
    if (glossCache.has(entry)) return glossCache.get(entry);
    let value = "";
    const pos = Array.isArray(entry.pos) ? entry.pos : [];
    for (let i = 0; i < pos.length; i += 1) {
      const segs = segments(pos[i] && pos[i].zh);
      if (segs.length) { value = segs[0]; break; }
    }
    if (!value) {
      const segs = segments(entry.definition_zh);
      value = segs[0] || "";
    }
    glossCache.set(entry, value);
    return value;
  }

  // 只取与目标词共享词性的那条 pos 释义：
  // 例如 gorge 作名词是“峡谷”、作动词是“狼吞虎咽”，
  // 目标词是动词时必须取动词义，不能拿名词义当干扰项。
  function glossForTags(entry, tags) {
    if (!entry || typeof entry !== "object") return "";
    if (!tags || !tags.size) return firstGloss(entry);
    const pos = Array.isArray(entry.pos) ? entry.pos : [];
    for (let i = 0; i < pos.length; i += 1) {
      const tag = normTag(pos[i] && pos[i].tag);
      if (!tag || !tags.has(tag)) continue;
      const segs = segments(pos[i] && pos[i].zh);
      if (segs.length) return segs[0];
    }
    return firstGloss(entry);
  }

  // 词条全部中文义项单位（用于“禁止出现与正确义项相同的候选”）
  function glossUnits(entry) {
    if (!entry || typeof entry !== "object") return [];
    if (unitsCache.has(entry)) return unitsCache.get(entry);
    const out = [];
    const push = (value) => {
      const text = clean(value);
      if (text) out.push(text);
    };
    const pos = Array.isArray(entry.pos) ? entry.pos : [];
    pos.forEach((item) => { segments(item && item.zh).forEach(push); });
    segments(entry.definition_zh).forEach(push);
    const senses = Array.isArray(entry.senses) ? entry.senses : [];
    senses.forEach((item) => {
      const title = clean(item && item.titleCN);
      if (!title) return;
      push(title);
      const colon = title.indexOf("：");
      if (colon > -1) {
        push(title.slice(0, colon));
        push(title.slice(colon + 1));
      }
    });
    const unique = Array.from(new Set(out));
    unitsCache.set(entry, unique);
    return unique;
  }

  // 词性归一：vt./vi./v./verb → v，n./noun/proper n. → n，adj./adjective → adj
  function normTag(raw) {
    const tag = String(raw == null ? "" : raw).toLowerCase().replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
    if (!tag) return "";
    if (/^(adv|副词)/.test(tag)) return "adv";
    if (/^(adj|形容词)/.test(tag)) return "adj";
    if (/^(vt|vi|v\.|v |verb|及物|不及物)/.test(tag)) return "v";
    if (/^(proper n|n\.|n |noun|名词)/.test(tag)) return "n";
    if (/^(prep|介词)/.test(tag)) return "prep";
    if (/^(conj|连词)/.test(tag)) return "conj";
    if (/^(pron|代词)/.test(tag)) return "pron";
    if (/^(phr|phrase|短语)/.test(tag)) return "phr";
    return tag.replace(/[.。-]/g, "");
  }

  function posSet(entry) {
    if (posCache.has(entry)) return posCache.get(entry);
    const set = new Set();
    const pos = Array.isArray(entry && entry.pos) ? entry.pos : [];
    pos.forEach((item) => {
      const tag = normTag(item && item.tag);
      if (tag) set.add(tag);
    });
    posCache.set(entry, set);
    return set;
  }

  function sharesPos(a, b) {
    const left = posSet(a);
    const right = posSet(b);
    if (!left.size || !right.size) return false;
    let hit = false;
    left.forEach((tag) => { if (right.has(tag)) hit = true; });
    return hit;
  }

  // 正确答案取自 pos[0]，所以干扰项也只按 pos[0] 的词性匹配；
  // 否则 leaf（名词“叶”、动词“翻阅”）会配出 enable（动词）这种错位选项。
  function primaryPosSet(entry) {
    const pos = Array.isArray(entry && entry.pos) ? entry.pos : [];
    const tag = normTag(pos[0] && pos[0].tag);
    return tag ? new Set([tag]) : posSet(entry);
  }

  function sharesPrimaryPos(entry, cand) {
    const left = primaryPosSet(entry);
    const right = posSet(cand);
    if (!left.size || !right.size) return false;
    let hit = false;
    left.forEach((tag) => { if (right.has(tag)) hit = true; });
    return hit;
  }

  // 词族：变形、派生词、词缀同族词、拉丁同源词
  function familySet(entry) {
    if (familyCache.has(entry)) return familyCache.get(entry);
    const set = new Set();
    const add = (value) => {
      const text = String(value == null ? "" : value).trim().toLowerCase();
      if (text) set.add(text);
    };
    (Array.isArray(entry.forms) ? entry.forms : []).forEach((item) => add(item && item.form));
    (Array.isArray(entry.derivatives) ? entry.derivatives : []).forEach((item) => add(item && item.word));
    const affixes = entry.affixes && typeof entry.affixes === "object" ? entry.affixes : {};
    (Array.isArray(affixes.items) ? affixes.items : []).forEach((item) => add(item && item.word));
    (Array.isArray(affixes.latinEntries) ? affixes.latinEntries : []).forEach((item) => add(item && item.word));
    familyCache.set(entry, set);
    return set;
  }

  function sameStem(a, b) {
    const left = String(a || "").toLowerCase();
    const right = String(b || "").toLowerCase();
    if (!left || !right || left === right) return false;
    const short = left.length <= right.length ? left : right;
    const long = left.length <= right.length ? right : left;
    if (short.length < 4) return false;
    return long.indexOf(short) === 0 && long.length - short.length <= 4;
  }

  function ambiguous(gloss, units, unitSet, isAnswer) {
    if (!gloss) return true;
    if (isAnswer && unitSet.has(gloss)) return true;
    for (let i = 0; i < units.length; i += 1) {
      const unit = units[i];
      if (unit === gloss) return true;
      if (unit.length >= 2 && gloss.length >= 2) {
        if (unit.indexOf(gloss) > -1 || gloss.indexOf(unit) > -1) return true;
      }
    }
    return false;
  }

  function shuffle(list, rand) {
    const out = list.slice();
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rand() * (i + 1));
      const tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }

  // 英文字形相似度：共同前缀 ×3 + 首字母 + 长度接近
  function spellingScore(a, b) {
    const left = String(a || "").toLowerCase();
    const right = String(b || "").toLowerCase();
    let prefix = 0;
    const size = Math.min(left.length, right.length);
    while (prefix < size && left[prefix] === right[prefix]) prefix += 1;
    return prefix * 3
      + (left.charAt(0) === right.charAt(0) ? 2 : 0)
      + (Math.abs(left.length - right.length) <= 2 ? 1 : 0);
  }

  function pickAnswerGloss(entry, opts) {
    if (isText(opts.gloss)) return clean(opts.gloss);
    const index = Number.isInteger(opts.senseIndex) ? opts.senseIndex : -1;
    if (index >= 0 && Array.isArray(entry.senses) && entry.senses[index]) {
      const title = clean(entry.senses[index].titleCN);
      if (title) {
        const colon = title.indexOf("：");
        if (colon > -1) {
          const after = clean(title.slice(colon + 1));
          if (charLen(after) >= 2) return after;
        }
        return title;
      }
    }
    return firstGloss(entry);
  }

  /* ---------- 中文题候选：同词性 + 长度接近 + 义项不重叠 ---------- */

  const MEANING_LAYERS = [
    { samePos: true, tol: 2 },
    { samePos: true, tol: 4 },
    { samePos: true, tol: 8 },
    // 虚词（连词/介词/副词/短语）在词库里只有个位数，先按“同为虚词”兜一层，
    // 避免 albeit 配出“南极的、可靠性”这类名词/形容词
    { functionOnly: true, tol: 99 },
    { samePos: false, tol: 4 },
    { samePos: false, tol: 12 },
    { samePos: false, tol: 99 }
  ];

  const FUNCTION_TAGS = new Set(["conj", "prep", "pron", "adv", "phr", "adv.phr", "prep.phr", "art", "det", "aux", "num"]);

  function isFunctionalTag(tag) {
    return FUNCTION_TAGS.has(tag);
  }

  function meaningCandidates(entry, pool, answer, rand) {
    const targetUnits = glossUnits(entry);
    const unitSet = new Set(targetUnits);
    const targetTags = primaryPosSet(entry);
    let functionalTarget = false;
    targetTags.forEach((tag) => { if (isFunctionalTag(tag)) functionalTarget = true; });
    const answerLen = charLen(answer);
    for (let layer = 0; layer < MEANING_LAYERS.length; layer += 1) {
      const rule = MEANING_LAYERS[layer];
      if (rule.functionOnly && !functionalTarget) continue;
      const found = [];
      const seen = new Set([answer]);
      for (let i = 0; i < pool.length; i += 1) {
        const cand = pool[i];
        if (!cand || cand === entry || !isText(cand.word)) continue;
        if (String(cand.word).trim().toLowerCase() === String(entry.word).trim().toLowerCase()) continue;
        if (rule.functionOnly) {
          const candTag = normTag((Array.isArray(cand.pos) && cand.pos[0] && cand.pos[0].tag) || "");
          if (!isFunctionalTag(candTag)) continue;
        } else if (rule.samePos && !sharesPrimaryPos(entry, cand)) {
          continue;
        }
        // 同词性层必须取“与目标词同词性”的那条释义，避免 gorge 拿名词义配动词题
        const gloss = glossForTags(cand, rule.samePos ? targetTags : null);
        if (!gloss || seen.has(gloss)) continue;
        if (charLen(gloss) > 14) continue;
        if (Math.abs(charLen(gloss) - answerLen) > rule.tol) continue;
        if (ambiguous(gloss, targetUnits, unitSet, false)) continue;
        seen.add(gloss);
        found.push({ entry: cand, value: gloss });
      }
      if (found.length >= 3) {
        const ordered = shuffle(found, rand);
        // 保证四个选项里至少有一个不比正确答案短，避免“最长的就是答案”
        const answerSize = charLen(answer);
        if (ordered.slice(0, 3).every((item) => charLen(item.value) < answerSize)) {
          for (let k = 3; k < ordered.length; k += 1) {
            if (charLen(ordered[k].value) >= answerSize) {
              const tmp = ordered[2];
              ordered[2] = ordered[k];
              ordered[k] = tmp;
              break;
            }
          }
        }
        return { items: ordered, layer: layer };
      }
    }
    return { items: [], layer: -1 };
  }

  /* ---------- 英文题候选：拼写相近 + 本书词内 + 排除词族 ---------- */

  const WORD_LAYERS = [
    { samePos: true, tol: 2 },
    { samePos: true, tol: 5 },
    { samePos: false, tol: 5 },
    { samePos: false, tol: 99 }
  ];

  function wordCandidates(entry, pool, rand) {
    const target = String(entry.word).trim();
    const targetLower = target.toLowerCase();
    const targetLen = charLen(target);
    const family = familySet(entry);
    const targetUnits = glossUnits(entry);
    const unitSet = new Set(targetUnits);
    for (let layer = 0; layer < WORD_LAYERS.length; layer += 1) {
      const rule = WORD_LAYERS[layer];
      const found = [];
      const seen = new Set([targetLower]);
      for (let i = 0; i < pool.length; i += 1) {
        const cand = pool[i];
        if (!cand || cand === entry || !isText(cand.word)) continue;
        const word = String(cand.word).trim();
        const lower = word.toLowerCase();
        if (lower === targetLower || seen.has(lower)) continue;
        if (!ENGLISH_WORD.test(word)) continue;
        if (family.has(lower)) continue;               // 变形/派生/同词族
        if (familySet(cand).has(targetLower)) continue; // 反向派生
        if (sameStem(targetLower, lower)) continue;
        if (rule.samePos && !sharesPos(entry, cand)) continue;
        if (Math.abs(charLen(word) - targetLen) > rule.tol) continue;
        // 中文释义与目标词重叠 → 该选项在语义上也算对，排除
        const candUnits = glossUnits(cand);
        let overlaps = false;
        for (let k = 0; k < candUnits.length && !overlaps; k += 1) {
          const unit = candUnits[k];
          if (unitSet.has(unit)) {
            overlaps = true;
          } else if (unit.length >= 2) {
            for (let t = 0; t < targetUnits.length; t += 1) {
              const targetUnit = targetUnits[t];
              if (targetUnit.length >= 2 && (targetUnit.indexOf(unit) > -1 || unit.indexOf(targetUnit) > -1)) {
                overlaps = true;
                break;
              }
            }
          }
        }
        if (overlaps) continue;
        seen.add(lower);
        found.push({ entry: cand, value: word, score: spellingScore(target, word) + rand() * 3 });
      }
      if (found.length >= 3) {
        found.sort((a, b) => b.score - a.score);
        // 同样保证至少一个干扰项不比正确答案短
        if (found.slice(0, 3).every((item) => charLen(item.value) < targetLen)) {
          for (let k = 3; k < found.length; k += 1) {
            if (charLen(found[k].value) >= targetLen) {
              const tmp = found[2];
              found[2] = found[k];
              found[k] = tmp;
              break;
            }
          }
        }
        return { items: found, layer: layer };
      }
    }
    return { items: [], layer: -1 };
  }

  /* ---------- 选项长度拉平 ---------- */

  function trimTo(value, limit) {
    const chars = Array.from(value);
    if (chars.length <= limit) return value;
    const cut = chars.slice(0, Math.max(1, limit - 1)).join("");
    return cut + "…";
  }

  function balanceDistractors(answer, distractors, maxSpread) {
    const cap = charLen(answer) + Math.max(0, maxSpread);
    const used = new Set([answer]);
    const out = [];
    distractors.forEach((value) => {
      let text = value;
      if (charLen(text) > cap) {
        const cut = trimTo(text, cap);
        const alt = segments(value)[0];
        text = charLen(alt) <= cap ? alt : cut;
      }
      if (used.has(text)) return;
      used.add(text);
      out.push(text);
    });
    return out;
  }

  /* ---------- 最近组合去重（防止同一单词反复出同一组选项） ---------- */

  const recentCombos = new Map();
  const RECENT_LIMIT = 4;
  const RECENT_KEYS = 1200;

  function signature(values) {
    return values.map((value) => String(value)).sort().join("\u0001");
  }

  function isRecent(key, sig) {
    const list = recentCombos.get(key);
    return Boolean(list && list.indexOf(sig) > -1);
  }

  function remember(key, sig) {
    const list = recentCombos.get(key) || [];
    list.push(sig);
    if (list.length > RECENT_LIMIT) list.shift();
    recentCombos.set(key, list);
    if (recentCombos.size > RECENT_KEYS) {
      const first = recentCombos.keys().next();
      if (!first.done) recentCombos.delete(first.value);
    }
  }

  function fillerList(mode) {
    return mode === MODE_WORD ? FALLBACK_WORD : FALLBACK_MEANING;
  }

  /**
   * 生成一道选择题的四个选项。
   * @param {Object} entry 当前词条
   * @param {Array} pool 本书全部词条
   * @param {String} mode "meaning" | "word"
   * @param {Object} [options]
   * @returns {Object} { answer, options, answerIndex, mode, meta }
   */
  function buildOptions(entry, pool, mode, options) {
    if (!entry || !isText(entry.word)) {
      throw new TypeError("buildOptions: entry 需要一个非空 word 字段");
    }
    if (!Array.isArray(pool)) {
      throw new TypeError("buildOptions: pool 必须是词条数组");
    }
    const opts = options && typeof options === "object" ? options : {};
    const rand = typeof opts.rand === "function" ? opts.rand : Math.random;
    const modeName = mode === MODE_WORD ? MODE_WORD : MODE_MEANING;
    const attempts = Math.max(1, Math.min(20, opts.attempts || 6));
    const maxSpread = Number.isFinite(opts.maxSpread) ? opts.maxSpread : 4;
    const answer = modeName === MODE_MEANING
      ? pickAnswerGloss(entry, opts)
      : String(entry.word).trim();
    if (!answer) throw new TypeError("buildOptions: 无法得到正确答案文本");

    const key = modeName + "|" + String(entry.word).trim().toLowerCase();
    const poolSize = pool.filter((item) => item && isText(item.word)).length;
    let lastResult = null;
    let attemptsUsed = 0;

    for (let round = 0; round < attempts; round += 1) {
      attemptsUsed += 1;
      const built = modeName === MODE_MEANING
        ? meaningCandidates(entry, pool, answer, rand)
        : wordCandidates(entry, pool, rand);
      let picked = built.items.map((item) => item.value).filter((value) => value !== answer);

      if (modeName === MODE_MEANING && picked.length) {
        picked = balanceDistractors(answer, picked, maxSpread);
      }
      const fillers = fillerList(modeName);
      let degraded = false;
      if (picked.length < 3) {
        degraded = true;
        for (let i = 0; i < fillers.length && picked.length < 3; i += 1) {
          const value = fillers[i];
          if (value !== answer && picked.indexOf(value) === -1) picked.push(value);
        }
      }
      if (picked.length < 3) {
        for (let i = 1; picked.length < 3; i += 1) {
          const value = "备选" + i;
          if (value !== answer && picked.indexOf(value) === -1) picked.push(value);
        }
      }
      picked = picked.slice(0, 3);

      const values = [answer].concat(picked);
      const sig = signature(values);
      const meta = {
        layer: built.layer,
        degraded: degraded,
        lengthSpread: Math.max.apply(null, values.map(charLen)) - Math.min.apply(null, values.map(charLen)),
        attempts: attemptsUsed,
        candidates: poolSize,
        version: VERSION
      };
      const result = {
        answer: answer,
        options: shuffle(values, rand),
        mode: modeName,
        meta: meta,
        answerIndex: -1
      };
      result.answerIndex = result.options.indexOf(answer);
      lastResult = result;
      if (!isRecent(key, sig)) {
        remember(key, sig);
        return result;
      }
    }
    if (lastResult) recentCombos.delete(key);
    return lastResult;
  }

  /**
   * 清空“最近组合”记录（测试或切换词书时可用）。
   */
  function resetRecent() {
    recentCombos.clear();
  }

  window.LZQuizOptions = {
    version: VERSION,
    buildOptions: buildOptions,
    resetRecent: resetRecent,
    // 便于测试与调试的轻量工具
    firstGloss: firstGloss,
    glossForTags: glossForTags,
    glossUnits: glossUnits
  };
})();
