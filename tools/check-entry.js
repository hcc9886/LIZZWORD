#!/usr/bin/env node
'use strict';

/**
 * TOEFL 深度词条校验器
 *
 * 用法：
 *   node tools/check-entry.js <文件或目录> [更多文件/目录] [--existing] [--json]
 *
 *   --existing  重新校验「已经并入词库」的历史词条时使用：
 *               跳过「与已有 3534 词重名」的跨库检查，其余规则照常执行。
 *               新增批次不要加这个参数。
 *   --json      以 JSON 输出完整结果，便于机器读取。
 *
 * 退出码：0 = 全部通过；1 = 存在错误（warnings 不影响退出码）。
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PREPARED_DIR = path.join(ROOT, 'books', 'prepared');
const BOOK_FILE = path.join(ROOT, 'books', 'toefl-core-5000.json');

// ---------------------------------------------------------------------------
// 规范常量
// ---------------------------------------------------------------------------

const TOP_KEYS = [
  'word', 'ipa_uk', 'ipa_us', 'definition_zh', 'definition_en', 'core_image',
  'scene', 'sceneCN', 'pos', 'collocations', 'forms', 'derivatives', 'senses',
  'etymology', 'similar', 'mnemonics', 'examples', 'dict_mnemonic', 'root',
  'sensesIntro', 'semanticMap', 'affixes',
];

const TOP_TYPES = {
  word: 'string',
  ipa_uk: 'string',
  ipa_us: 'string',
  definition_zh: 'string',
  definition_en: 'string',
  core_image: 'string',
  scene: 'string',
  sceneCN: 'string',
  pos: 'array',
  collocations: 'array',
  forms: 'array',
  derivatives: 'array',
  senses: 'array',
  etymology: 'object',
  similar: 'object',
  mnemonics: 'object',
  examples: 'array',
  dict_mnemonic: 'object',
  root: 'string',
  sensesIntro: 'object',
  semanticMap: 'object',
  affixes: 'object',
};

const SENSE_KEYS = [
  'no', 'title', 'titleCN', 'definition', 'definitionCN',
  'example', 'exampleCN', 'why', 'whyCN',
];

const CANONICAL_HEADINGS = ['LOOK-ALIKE', 'NEAR MEANING'];

// 只列出「简体中文不会用到」的繁体字，避免把「首、骨、餐、香」这类共用字误判。
const TRADITIONAL_CHARS = new Set([
  '個', '們', '這', '為', '說', '學', '語', '詞', '義', '現', '發', '開', '關', '與', '產',
  '業', '動', '進', '過', '還', '讓', '聽', '讀', '寫', '認', '識', '記', '憶', '練', '習',
  '題', '問', '間', '時', '長', '經', '歷', '處', '麼', '樣', '種', '類', '級', '別', '變',
  '轉', '較', '對', '從', '會', '應', '該', '當', '無', '數', '據', '網', '線', '點', '電',
  '腦', '軟', '體', '資', '訊', '權', '責', '環', '場', '館', '車', '輛', '鐵', '頁', '風',
  '飛', '鳥', '魚', '馬', '龍', '龜', '齒', '頭', '顏', '顯', '願', '驚', '嗎', '誰', '況',
  '準', '備', '標', '確', '證', '專', '課', '試', '驗', '實', '際', '總', '統', '計', '劃',
  '階', '層', '麵', '飯', '飲', '醫', '藥', '療', '術', '護', '係', '織', '組', '團', '隊',
  '員', '眾', '聲', '響', '樂', '畫', '圖', '書', '筆', '紙', '譯', '講', '話', '談', '論',
  '議', '討', '測', '於', '並', '來', '裡', '裏', '後', '將', '給', '帶', '張', '條', '塊',
  '內', '兩', '愛', '節', '歸', '軍', '戰', '爭', '衛', '蘭', '華', '鄉', '縣', '辦', '單',
  '豐', '親', '雜', '離', '難', '陽', '陰', '雲', '霧', '燈', '燒', '熱', '溫', '濕', '滿',
  '淺', '滾', '錯', '錢', '銀', '閃', '閉', '閱', '聞', '鬆', '鬥', '厲', '壽', '夢', '夠',
  '奪', '寧', '審', '褲', '補', '裝', '規', '視', '覺', '觀', '觸', '訂', '訓', '託', '許',
  '設', '訪', '評', '訴', '診', '註', '詩', '詳', '誌', '諾', '謀', '謝', '譜', '讚', '貝',
  '負', '財', '貢', '販', '貪', '貨', '質', '購', '贊', '趕', '趨', '跡', '踐', '軌', '輔',
  '輕', '輪', '輯', '輸', '轟', '邊', '遼', '達', '遷', '選', '遞', '遲', '適', '鑰', '鐘',
  '鋼', '錄', '鎮', '鍵', '鏡', '鐳', '門', '閒', '闆', '陣', '陳', '陸', '隨', '險', '隱',
  '雖', '雙', '雞', '靈', '靜', '頂', '項', '順', '須', '預', '頓', '領', '頰', '頻', '顆',
  '顧', '餘', '駐', '駕', '駛', '髒', '鳴', '鵝', '鷹', '麥', '黃', '黨', '齊', '齡', '龐',
]);

const CJK_RE = /[\u3400-\u9fff]/;
const LATIN_RE = /[A-Za-z]/;

// ---------------------------------------------------------------------------
// 通用工具
// ---------------------------------------------------------------------------

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function typeOf(v) {
  if (Array.isArray(v)) return 'array';
  if (v === null) return 'null';
  return typeof v;
}

function quote(s, n = 80) {
  const t = String(s).replace(/\s+/g, ' ');
  return t.length > n ? t.slice(0, n) + '…' : t;
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasCJK(s) {
  return CJK_RE.test(s);
}

function hasLatin(s) {
  return LATIN_RE.test(s);
}

function wordForms(entry) {
  const forms = [entry.word];
  if (Array.isArray(entry.forms)) {
    for (const f of entry.forms) if (isPlainObject(f) && typeof f.form === 'string') forms.push(f.form);
  }
  return forms.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim());
}

function countOccurrences(text, forms) {
  const found = new Set();
  for (const f of forms) {
    const re = new RegExp('(?<![A-Za-z])' + escapeRe(f) + '(?![A-Za-z])', 'gi');
    let m;
    while ((m = re.exec(text))) {
      found.add(m.index);
      if (m.index === re.lastIndex) re.lastIndex += 1;
    }
  }
  return found.size;
}

function containsAnyForm(text, forms) {
  return countOccurrences(text, forms) > 0;
}

function ipaValid(s) {
  if (typeof s !== 'string' || !s.trim()) return false;
  const parts = s.match(/\/[^/]+\//g);
  if (!parts || !parts.length) return false;
  if (parts.some((p) => p.length < 3)) return false;
  const rest = s
    .replace(/\/[^/]+\//g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/[;,\s·]/g, '');
  return rest.length === 0;
}

function eraUpperValid(s) {
  // era 只允许大写字母、数字与常见分隔符；出现小写字母即视为格式问题。
  return !/[a-z]/.test(s);
}

function latinRuns(s) {
  const stripped = s
    .replace(/“[^”]*”/g, '')
    .replace(/「[^」]*」/g, '')
    .replace(/（[^）]*）/g, '')
    .replace(/\([^)]*\)/g, '');
  const runs = stripped.match(/[A-Za-z][A-Za-z'-]*(?:\s+[A-Za-z][A-Za-z'-]*)+/g) || [];
  return runs.filter((r) => r.split(/\s+/).length >= 6);
}

/**
 * 判断某个字段路径是否属于「中文承载字段」。
 * 这些字段必须包含中文，并且要检查繁體、疑似未翻译英文。
 */
function isChineseField(p) {
  if (p === 'definition_zh' || p === 'core_image' || p === 'sceneCN' || p === 'root') return true;
  if (p === 'dict_mnemonic.note' || p === 'dict_mnemonic.text') return true;
  if (p.endsWith('.cn')) return true;
  if (p.endsWith('.zh')) return true;
  if (p.endsWith('.titleCN') || p.endsWith('.definitionCN')) return true;
  if (p.endsWith('.exampleCN') || p.endsWith('.whyCN')) return true;
  if (p.endsWith('.meaningCN')) return true;
  if (p.endsWith('.label')) return true; // forms[].label
  return false;
}

/** 英文承载字段：不得出现中文字符。 */
function isEnglishField(p) {
  if (p === 'word' || p === 'definition_en' || p === 'ipa_uk' || p === 'ipa_us') return true;
  if (p.endsWith('.en')) return true;
  if (p.endsWith('.definition') || p.endsWith('.title') || p.endsWith('.why')) return true;
  if (p.endsWith('.example') || p.endsWith('.word') || p.endsWith('.phrase')) return true;
  if (p.endsWith('.tag') || p.endsWith('.pos') || p.endsWith('.structure') || p.endsWith('.meaning')) return true;
  if (p.endsWith('.era') || p.endsWith('.form')) return true;
  if (/^semanticMap\.chain\[\d+\]$/.test(p)) return true;
  return false;
}

function walkStrings(value, p, cb) {
  if (typeof value === 'string') {
    cb(p, value);
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => walkStrings(v, `${p}[${i}]`, cb));
  } else if (isPlainObject(value)) {
    for (const k of Object.keys(value)) walkStrings(value[k], p ? `${p}.${k}` : k, cb);
  }
}

function keysOf(obj) {
  return isPlainObject(obj) ? Object.keys(obj) : [];
}

function checkExactKeys(obj, expected, p, err) {
  const keys = keysOf(obj);
  for (const k of expected) if (!keys.includes(k)) err(`${p}.${k}`, '缺少必填子字段');
  for (const k of keys) if (!expected.includes(k)) err(`${p}.${k}`, '存在未定义的多余子字段');
  if (keys.length === expected.length) {
    for (let i = 0; i < expected.length; i++) {
      if (keys[i] !== expected[i]) {
        err(p, `子字段顺序不符：第 ${i + 1} 个应为 ${expected[i]}，实际为 ${keys[i]}`);
        break;
      }
    }
  }
}

function checkString(v, p, err) {
  if (typeof v !== 'string') err(p, `应为字符串，实际为 ${typeOf(v)}`);
  else if (!v.trim()) err(p, '不得为空串');
}

function checkArray(v, p, err, min = 1) {
  if (!Array.isArray(v)) {
    err(p, `应为数组，实际为 ${typeOf(v)}`);
    return false;
  }
  if (v.length < min) err(p, `数组长度不足（至少 ${min}，实际 ${v.length}）`);
  return true;
}

// ---------------------------------------------------------------------------
// 单条词条校验
// ---------------------------------------------------------------------------

function checkEntry(entry, ctx) {
  const errors = [];
  const warnings = [];
  const err = (p, msg) => errors.push({ path: p, message: msg });
  const warn = (p, msg) => warnings.push({ path: p, message: msg });

  if (!isPlainObject(entry)) {
    err('$', `词条必须是对象，实际为 ${typeOf(entry)}`);
    return { errors, warnings };
  }

  // 1. 顶层字段集合、顺序、类型 ---------------------------------------------
  const keys = Object.keys(entry);
  for (const k of TOP_KEYS) if (!keys.includes(k)) err(k, '缺少必填字段');
  for (const k of keys) if (!TOP_KEYS.includes(k)) err(k, '存在未定义的多余字段');
  if (keys.length === TOP_KEYS.length) {
    for (let i = 0; i < TOP_KEYS.length; i++) {
      if (keys[i] !== TOP_KEYS[i]) {
        err('$', `顶层字段顺序不符：第 ${i + 1} 个应为 ${TOP_KEYS[i]}，实际为 ${keys[i]}`);
        break;
      }
    }
  }
  for (const [k, t] of Object.entries(TOP_TYPES)) {
    if (keys.includes(k) && typeOf(entry[k]) !== t) {
      err(k, `应为 ${t}，实际为 ${typeOf(entry[k])}`);
    }
  }

  // 2. 空值扫描（空数组仅允许出现在 affixes.latinEntries）-------------------
  const ZERO_WIDTH_RE = /[\u200B-\u200D\uFEFF\u2060]/;
  walkStrings(entry, '', (p, v) => {
    if (!v.trim()) err(p, '不得为空串或纯空白');
    if (ZERO_WIDTH_RE.test(v)) err(p, '包含零宽字符或被替换的占位字符');
  });
  (function scanEmptyArrays(value, p) {
    if (Array.isArray(value)) {
      if (value.length === 0 && p !== 'affixes.latinEntries') err(p, '数组不得为空');
      value.forEach((v, i) => scanEmptyArrays(v, `${p}[${i}]`));
    } else if (isPlainObject(value)) {
      for (const k of Object.keys(value)) scanEmptyArrays(value[k], p ? `${p}.${k}` : k);
    }
  })(entry, '');

  // 3. word 与 IPA ----------------------------------------------------------
  checkString(entry.word, 'word', err);
  if (typeof entry.word === 'string') {
    const w = entry.word;
    if (w !== w.trim()) err('word', '首尾不得有空白');
    if (/\s{2,}/.test(w)) err('word', '不得包含连续空格');
    if (!/^[A-Za-z](?:[A-Za-z' -]*[A-Za-z])?$/.test(w)) err('word', '只能包含英文字母、空格、连字符或撇号');
  }
  for (const k of ['ipa_uk', 'ipa_us']) {
    if (typeof entry[k] === 'string' && !ipaValid(entry[k])) {
      err(k, `音标格式不合法：${quote(entry[k])}（应为一对或多对 /…/，可用 ; · , 分隔）`);
    }
  }

  // 4. pos / collocations / forms / derivatives -----------------------------
  if (checkArray(entry.pos, 'pos', err)) {
    entry.pos.forEach((x, i) => {
      const p = `pos[${i}]`;
      if (!isPlainObject(x)) return err(p, `应为对象，实际为 ${typeOf(x)}`);
      checkExactKeys(x, ['tag', 'zh'], p, err);
      checkString(x.tag, `${p}.tag`, err);
      checkString(x.zh, `${p}.zh`, err);
    });
  }

  if (checkArray(entry.collocations, 'collocations', err, 4)) {
    entry.collocations.forEach((x, i) => {
      const p = `collocations[${i}]`;
      if (!isPlainObject(x)) return err(p, `应为对象，实际为 ${typeOf(x)}`);
      checkExactKeys(x, ['phrase', 'zh'], p, err);
      checkString(x.phrase, `${p}.phrase`, err);
      checkString(x.zh, `${p}.zh`, err);
      if (typeof x.phrase === 'string' && ctx.forms.length && !containsAnyForm(x.phrase, ctx.forms)) {
        warn(`${p}.phrase`, '搭配中未出现目标词或其变形，请确认这是否是有意为之');
      }
    });
    if (entry.collocations.length > 7) {
      warn('collocations', `标准为 4-7 条，当前 ${entry.collocations.length} 条`);
    }
  }

  if (checkArray(entry.forms, 'forms', err)) {
    entry.forms.forEach((x, i) => {
      const p = `forms[${i}]`;
      if (!isPlainObject(x)) return err(p, `应为对象，实际为 ${typeOf(x)}`);
      checkExactKeys(x, ['label', 'form'], p, err);
      checkString(x.label, `${p}.label`, err);
      checkString(x.form, `${p}.form`, err);
    });
  }

  if (checkArray(entry.derivatives, 'derivatives', err, 2)) {
    if (entry.derivatives.length > 8) {
      warn('derivatives', `标准为 2-8 条，当前 ${entry.derivatives.length} 条`);
    }
    entry.derivatives.forEach((x, i) => {
      const p = `derivatives[${i}]`;
      if (!isPlainObject(x)) return err(p, `应为对象，实际为 ${typeOf(x)}`);
      checkExactKeys(x, ['word', 'pos', 'zh'], p, err);
      checkString(x.word, `${p}.word`, err);
      checkString(x.pos, `${p}.pos`, err);
      checkString(x.zh, `${p}.zh`, err);
      if (typeof x.word === 'string' && entry.word && x.word.toLowerCase() === entry.word.toLowerCase()) {
        err(`${p}.word`, '派生词不能是目标词本身');
      }
    });
  }

  // 5. senses --------------------------------------------------------------
  if (checkArray(entry.senses, 'senses', err)) {
    if (entry.senses.length < 2) {
      err('senses', `义项分组至少需要 2 组，当前 ${entry.senses.length} 组`);
    } else if (entry.senses.length > 10) {
      warn('senses', `义项分组上限为 10 组，当前 ${entry.senses.length} 组`);
    }
    const seenNo = new Set();
    entry.senses.forEach((s, i) => {
      const p = `senses[${i}]`;
      if (!isPlainObject(s)) return err(p, `应为对象，实际为 ${typeOf(s)}`);
      checkExactKeys(s, SENSE_KEYS, p, err);
      for (const k of SENSE_KEYS) checkString(s[k], `${p}.${k}`, err);
      if (typeof s.no === 'string') {
        if (!/^\d{2}$/.test(s.no)) err(`${p}.no`, `义项编号应为两位数字（如 01），实际为 ${JSON.stringify(s.no)}`);
        if (seenNo.has(s.no)) err(`${p}.no`, `义项编号重复：${s.no}`);
        seenNo.add(s.no);
      }
    });
    // 编号必须从 01 连续递增
    const nums = entry.senses.map((s) => (isPlainObject(s) && typeof s.no === 'string' ? s.no : ''));
    for (let i = 0; i < nums.length; i++) {
      const expect = String(i + 1).padStart(2, '0');
      if (nums[i] !== expect) {
        err(`senses[${i}].no`, `义项编号不连续：应为 ${expect}，实际为 ${JSON.stringify(nums[i])}`);
        break;
      }
    }
    // 义项分组不得重复
    for (const field of ['title', 'titleCN', 'definition']) {
      const values = entry.senses
        .filter((s) => isPlainObject(s) && typeof s[field] === 'string')
        .map((s) => s[field].trim().toLowerCase());
      const dup = values.filter((v, i) => values.indexOf(v) !== i);
      if (dup.length) err(`senses.${field}`, `义项内容重复：${quote(dup[0], 40)}`);
    }
  }

  // 6. etymology ------------------------------------------------------------
  if (isPlainObject(entry.etymology)) {
    checkExactKeys(entry.etymology, ['intro', 'items'], 'etymology', err);
    if (!isPlainObject(entry.etymology.intro)) err('etymology.intro', '应为对象');
    else {
      checkExactKeys(entry.etymology.intro, ['en', 'cn'], 'etymology.intro', err);
      checkString(entry.etymology.intro.en, 'etymology.intro.en', err);
      checkString(entry.etymology.intro.cn, 'etymology.intro.cn', err);
    }
    if (checkArray(entry.etymology.items, 'etymology.items', err, 5)) {
      if (entry.etymology.items.length < 5 || entry.etymology.items.length > 6) {
        err('etymology.items', `词源段数应为 5-6 段，当前 ${entry.etymology.items.length} 段`);
      }
      entry.etymology.items.forEach((x, i) => {
        const p = `etymology.items[${i}]`;
        if (!isPlainObject(x)) return err(p, `应为对象，实际为 ${typeOf(x)}`);
        checkExactKeys(x, ['era', 'en', 'cn'], p, err);
        checkString(x.era, `${p}.era`, err);
        checkString(x.en, `${p}.en`, err);
        checkString(x.cn, `${p}.cn`, err);
        if (typeof x.era === 'string' && !eraUpperValid(x.era)) {
          warn(`${p}.era`, `era 建议全部大写，实际为 ${quote(x.era, 40)}`);
        }
      });
    }
  }

  // 7. similar --------------------------------------------------------------
  if (isPlainObject(entry.similar)) {
    checkExactKeys(entry.similar, ['note', 'groups'], 'similar', err);
    if (!isPlainObject(entry.similar.note)) err('similar.note', '应为对象');
    else {
      checkExactKeys(entry.similar.note, ['en', 'cn'], 'similar.note', err);
      checkString(entry.similar.note.en, 'similar.note.en', err);
      checkString(entry.similar.note.cn, 'similar.note.cn', err);
    }
    if (checkArray(entry.similar.groups, 'similar.groups', err, 2)) {
      if (entry.similar.groups.length < 2) {
        err('similar.groups', `近义/形近组至少需要 2 组，当前 ${entry.similar.groups.length} 组`);
      } else if (entry.similar.groups.length > 2) {
        warn('similar.groups', `标准为 2 组，当前 ${entry.similar.groups.length} 组`);
      }
      const headingSeen = new Set();
      entry.similar.groups.forEach((g, gi) => {
        const p = `similar.groups[${gi}]`;
        if (!isPlainObject(g)) return err(p, `应为对象，实际为 ${typeOf(g)}`);
        checkExactKeys(g, ['heading', 'entries'], p, err);
        checkString(g.heading, `${p}.heading`, err);
        if (typeof g.heading === 'string') {
          if (headingSeen.has(g.heading)) err(`${p}.heading`, `组标题重复：${g.heading}`);
          headingSeen.add(g.heading);
          if (!CANONICAL_HEADINGS.includes(g.heading)) {
            warn(`${p}.heading`, `组标题应统一为 ${CANONICAL_HEADINGS.join(' 或 ')}，实际为 ${quote(g.heading, 40)}（历史别名可改）`);
          }
        }
        if (checkArray(g.entries, `${p}.entries`, err, 2)) {
          if (g.entries.length < 2) {
            err(`${p}.entries`, `每组条目至少 2 个，当前 ${g.entries.length} 个`);
          }
          const seenWords = new Set();
          g.entries.forEach((x, ei) => {
            const ep = `${p}.entries[${ei}]`;
            if (!isPlainObject(x)) return err(ep, `应为对象，实际为 ${typeOf(x)}`);
            checkExactKeys(x, ['word', 'ipa', 'tag', 'definition', 'definitionCN'], ep, err);
            for (const k of ['word', 'ipa', 'tag', 'definition', 'definitionCN']) {
              checkString(x[k], `${ep}.${k}`, err);
            }
            if (typeof x.ipa === 'string' && !ipaValid(x.ipa)) {
              err(`${ep}.ipa`, `音标格式不合法：${quote(x.ipa)}`);
            }
            if (typeof x.word === 'string') {
              const wl = x.word.toLowerCase();
              if (entry.word && wl === entry.word.toLowerCase()) {
                err(`${ep}.word`, '近义/形近条目不能引用目标词本身');
              }
              if (seenWords.has(wl)) err(`${ep}.word`, `同一组内条目重复：${x.word}`);
              seenWords.add(wl);
            }
            if (typeof x.tag === 'string' && x.tag.trim()) {
              if (hasCJK(x.tag) || /[A-Z]/.test(x.tag) || x.tag.trim().length > 35) {
                warn(`${ep}.tag`, `tag 建议使用 1-3 个英文小写词，实际为 ${quote(x.tag, 40)}`);
              }
            }
          });
        }
      });
    }
  }

  // 8. mnemonics ------------------------------------------------------------
  if (isPlainObject(entry.mnemonics)) {
    checkExactKeys(entry.mnemonics, ['normalIntro', 'normal', 'abstract'], 'mnemonics', err);
    if (!isPlainObject(entry.mnemonics.normalIntro)) err('mnemonics.normalIntro', '应为对象');
    else {
      checkExactKeys(entry.mnemonics.normalIntro, ['en', 'cn'], 'mnemonics.normalIntro', err);
      checkString(entry.mnemonics.normalIntro.en, 'mnemonics.normalIntro.en', err);
      checkString(entry.mnemonics.normalIntro.cn, 'mnemonics.normalIntro.cn', err);
    }
    for (const [key, expected] of [['normal', 5], ['abstract', 3]]) {
      const arr = entry.mnemonics[key];
      if (!Array.isArray(arr)) {
        err(`mnemonics.${key}`, `应为数组，实际为 ${typeOf(arr)}`);
        continue;
      }
      if (arr.length !== expected) {
        err(`mnemonics.${key}`, `固定 ${expected} 条，当前 ${arr.length} 条`);
      }
      arr.forEach((x, i) => {
        const p = `mnemonics.${key}[${i}]`;
        if (!isPlainObject(x)) return err(p, `应为对象，实际为 ${typeOf(x)}`);
        checkExactKeys(x, ['en', 'cn'], p, err);
        checkString(x.en, `${p}.en`, err);
        checkString(x.cn, `${p}.cn`, err);
      });
    }
  }

  // 9. examples -------------------------------------------------------------
  if (Array.isArray(entry.examples)) {
    if (entry.examples.length !== 3) err('examples', `例句固定 3 条，当前 ${entry.examples.length} 条`);
    let hasWordExample = 0;
    entry.examples.forEach((x, i) => {
      const p = `examples[${i}]`;
      if (!isPlainObject(x)) return err(p, `应为对象，实际为 ${typeOf(x)}`);
      checkExactKeys(x, ['en', 'cn'], p, err);
      checkString(x.en, `${p}.en`, err);
      checkString(x.cn, `${p}.cn`, err);
      if (typeof x.en === 'string' && ctx.forms.length && containsAnyForm(x.en, ctx.forms)) hasWordExample += 1;
    });
    if (!hasWordExample) err('examples', `3 条例句中至少要有 1 条包含目标词或其变形`);
    else if (hasWordExample < 2) warn('examples', '只有 1 条例句包含目标词，建议至少 2 条以体现用法');
  } else {
    err('examples', `应为数组，实际为 ${typeOf(entry.examples)}`);
  }

  // 10. dict_mnemonic / root / sensesIntro ----------------------------------
  if (isPlainObject(entry.dict_mnemonic)) {
    checkExactKeys(entry.dict_mnemonic, ['note', 'text', 'word'], 'dict_mnemonic', err);
    checkString(entry.dict_mnemonic.note, 'dict_mnemonic.note', err);
    checkString(entry.dict_mnemonic.text, 'dict_mnemonic.text', err);
    checkString(entry.dict_mnemonic.word, 'dict_mnemonic.word', err);
    if (typeof entry.dict_mnemonic.word === 'string' && entry.word &&
        entry.dict_mnemonic.word.toLowerCase() !== entry.word.toLowerCase()) {
      warn('dict_mnemonic.word', '应与目标词拼写一致');
    }
  }
  checkString(entry.root, 'root', err);
  if (isPlainObject(entry.sensesIntro)) {
    checkExactKeys(entry.sensesIntro, ['en', 'cn'], 'sensesIntro', err);
    checkString(entry.sensesIntro.en, 'sensesIntro.en', err);
    checkString(entry.sensesIntro.cn, 'sensesIntro.cn', err);
  }

  // 11. semanticMap ---------------------------------------------------------
  if (isPlainObject(entry.semanticMap)) {
    checkExactKeys(entry.semanticMap, ['core', 'chain', 'branches'], 'semanticMap', err);
    if (!isPlainObject(entry.semanticMap.core)) err('semanticMap.core', '应为对象');
    else {
      checkExactKeys(entry.semanticMap.core, ['en', 'cn'], 'semanticMap.core', err);
      checkString(entry.semanticMap.core.en, 'semanticMap.core.en', err);
      checkString(entry.semanticMap.core.cn, 'semanticMap.core.cn', err);
    }
    if (checkArray(entry.semanticMap.chain, 'semanticMap.chain', err, 6)) {
      if (entry.semanticMap.chain.length !== 6) {
        err('semanticMap.chain', `语义链固定 6 环，当前 ${entry.semanticMap.chain.length} 环`);
      }
      entry.semanticMap.chain.forEach((x, i) => {
        if (typeof x !== 'string') err(`semanticMap.chain[${i}]`, `应为字符串，实际为 ${typeOf(x)}`);
        else if (!/^[A-Z][A-Z0-9 /-]*$/.test(x)) warn(`semanticMap.chain[${i}]`, '语义链建议使用大写英文短语');
      });
    }
    if (checkArray(entry.semanticMap.branches, 'semanticMap.branches', err, 5)) {
      if (entry.semanticMap.branches.length !== 5) {
        err('semanticMap.branches', `回指分支固定 5 条，当前 ${entry.semanticMap.branches.length} 条`);
      }
      const senseNos = new Set(
        Array.isArray(entry.senses)
          ? entry.senses.filter((s) => isPlainObject(s) && typeof s.no === 'string').map((s) => s.no)
          : [],
      );
      entry.semanticMap.branches.forEach((b, i) => {
        const p = `semanticMap.branches[${i}]`;
        if (!isPlainObject(b)) return err(p, `应为对象，实际为 ${typeOf(b)}`);
        checkExactKeys(b, ['senses', 'en', 'cn'], p, err);
        checkString(b.en, `${p}.en`, err);
        checkString(b.cn, `${p}.cn`, err);
        if (typeof b.senses === 'string') {
          const refs = b.senses.match(/\d{2}/g) || [];
          if (!refs.length) err(`${p}.senses`, '必须回指至少一个义项编号，如 "01" 或 "01 · 04"');
          for (const r of refs) {
            if (!senseNos.has(r)) err(`${p}.senses`, `回指的义项编号 ${r} 不存在`);
          }
        } else {
          err(`${p}.senses`, `应为字符串，实际为 ${typeOf(b.senses)}`);
        }
      });
    }
  }

  // 12. affixes -------------------------------------------------------------
  if (isPlainObject(entry.affixes)) {
    // affixes.derivatives 为可选字段，因此这里单独检查键集合，不强制固定顺序。
    const affixAllowed = ['intro', 'latinIntro', 'items', 'latinEntries', 'derivatives'];
    const affixKeys = Object.keys(entry.affixes);
    for (const k of ['intro', 'latinIntro', 'items', 'latinEntries']) {
      if (!affixKeys.includes(k)) err(`affixes.${k}`, '缺少必填子字段');
    }
    for (const k of affixKeys) {
      if (!affixAllowed.includes(k)) err(`affixes.${k}`, '存在未定义的多余子字段');
    }
    if (!isPlainObject(entry.affixes.intro)) err('affixes.intro', '应为对象');
    else {
      checkExactKeys(entry.affixes.intro, ['en', 'cn'], 'affixes.intro', err);
      checkString(entry.affixes.intro.en, 'affixes.intro.en', err);
      checkString(entry.affixes.intro.cn, 'affixes.intro.cn', err);
    }
    if (!isPlainObject(entry.affixes.latinIntro)) err('affixes.latinIntro', '应为对象');
    else {
      checkExactKeys(entry.affixes.latinIntro, ['en', 'cn'], 'affixes.latinIntro', err);
      checkString(entry.affixes.latinIntro.en, 'affixes.latinIntro.en', err);
      checkString(entry.affixes.latinIntro.cn, 'affixes.latinIntro.cn', err);
    }
    if (checkArray(entry.affixes.items, 'affixes.items', err, 8)) {
      if (entry.affixes.items.length < 8 || entry.affixes.items.length > 12) {
        err('affixes.items', `构词条目应为 8-12 条，当前 ${entry.affixes.items.length} 条`);
      }
      entry.affixes.items.forEach((x, i) => {
        const p = `affixes.items[${i}]`;
        if (!isPlainObject(x)) return err(p, `应为对象，实际为 ${typeOf(x)}`);
        checkExactKeys(x, ['word', 'structure', 'meaning', 'meaningCN', 'example', 'exampleCN'], p, err);
        for (const k of ['word', 'structure', 'meaning', 'meaningCN', 'example', 'exampleCN']) {
          checkString(x[k], `${p}.${k}`, err);
        }
      });
    }
    if (!Array.isArray(entry.affixes.latinEntries)) {
      err('affixes.latinEntries', `应为数组，实际为 ${typeOf(entry.affixes.latinEntries)}`);
    } else {
      if (entry.affixes.latinEntries.length > 7) {
        warn('affixes.latinEntries', `标准为 0-7 条，当前 ${entry.affixes.latinEntries.length} 条`);
      }
      entry.affixes.latinEntries.forEach((x, i) => {
        const p = `affixes.latinEntries[${i}]`;
        if (!isPlainObject(x)) return err(p, `应为对象，实际为 ${typeOf(x)}`);
        const allowed = ['word', 'structure', 'meaning', 'meaningCN', 'example', 'exampleCN'];
        const ks = Object.keys(x);
        for (const k of ['word', 'structure', 'meaning', 'meaningCN']) {
          if (!ks.includes(k)) err(`${p}.${k}`, '缺少必填子字段');
          else checkString(x[k], `${p}.${k}`, err);
        }
        for (const k of ks) if (!allowed.includes(k)) err(`${p}.${k}`, '存在未定义的多余子字段');
        if (ks.includes('example')) checkString(x.example, `${p}.example`, err);
        if (ks.includes('exampleCN')) checkString(x.exampleCN, `${p}.exampleCN`, err);
      });
    }
    // affixes.derivatives 为可选字段；存在时校验结构。
    if (Object.prototype.hasOwnProperty.call(entry.affixes, 'derivatives')) {
      if (!Array.isArray(entry.affixes.derivatives)) {
        err('affixes.derivatives', `应为数组，实际为 ${typeOf(entry.affixes.derivatives)}`);
      } else {
        entry.affixes.derivatives.forEach((x, i) => {
          const p = `affixes.derivatives[${i}]`;
          if (!isPlainObject(x)) return err(p, `应为对象，实际为 ${typeOf(x)}`);
          const ks = Object.keys(x);
          if (ks.includes('zh')) {
            checkExactKeys(x, ['word', 'pos', 'zh'], p, err);
            checkString(x.word, `${p}.word`, err);
            checkString(x.pos, `${p}.pos`, err);
            checkString(x.zh, `${p}.zh`, err);
          } else {
            checkExactKeys(x, ['word', 'structure', 'meaning', 'meaningCN'], p, err);
            for (const k of ['word', 'structure', 'meaning', 'meaningCN']) checkString(x[k], `${p}.${k}`, err);
          }
        });
      }
    }
  }

  // 13. 语言检查：繁體、中英混杂、英文夹中文 --------------------------------
  walkStrings(entry, '', (p, v) => {
    if (!p) return;
    if (isChineseField(p)) {
      if (!hasCJK(v)) {
        err(p, '中文字段没有中文字符');
        return;
      }
      const trad = [...new Set([...v].filter((ch) => TRADITIONAL_CHARS.has(ch)))];
      if (trad.length) err(p, `出现繁體字：${trad.join('、')}`);
      const runs = latinRuns(v);
      if (runs.length) {
        err(p, `疑似中英混杂（未加引号的连续英文 ≥6 词）：${quote(runs[0])}`);
      }
    } else if (isEnglishField(p)) {
      if (hasCJK(v)) err(p, '英文字段中混入中文字符');
    }
  });

  // 14. scene / sceneCN 专项检查 -------------------------------------------
  if (typeof entry.scene === 'string' && entry.scene.trim()) {
    const idx = entry.scene.search(/[A-Za-z]/);
    const preamble = idx >= 0 ? entry.scene.slice(0, idx) : entry.scene;
    const english = idx >= 0 ? entry.scene.slice(idx) : '';
    if (!hasCJK(preamble)) err('scene', '英文场景句之前缺少中文情境铺垫');
    if (/[0-9]/.test(preamble)) warn('scene', '中文情境铺垫中不应出现阿拉伯数字');
    if (english && hasCJK(english)) err('scene', '英文场景句中混入中文');
    if (english && ctx.forms.length) {
      const n = countOccurrences(english, ctx.forms);
      if (n === 0) err('scene', '英文场景句未出现目标词或其变形');
      else if (n > 1) warn('scene', `英文场景句中目标词出现 ${n} 次，标准要求仅 1 次`);
    }
  }
  if (typeof entry.sceneCN === 'string' && entry.sceneCN.trim()) {
    const m = entry.sceneCN.match(/第\s*(\d+)\s*个义项/);
    if (!m) warn('sceneCN', '缺少「第 N 个义项」引用');
    else {
      const n = Number(m[1]);
      const total = Array.isArray(entry.senses) ? entry.senses.length : 0;
      if (n < 1 || n > total) err('sceneCN', `引用的第 ${n} 个义项超出范围（共 ${total} 组）`);
    }
  }

  // 15. 近义组自己的 ipa 字段（已在上文校验）；此处补一个“组内条目必须归属明确”的检查
  // （tag 已要求非空，上面的 tag 风格检查为 warning）

  return { errors, warnings };
}

// ---------------------------------------------------------------------------
// 语料库与批次读取
// ---------------------------------------------------------------------------

function isEntryFileLike(name) {
  return name.endsWith('.json') && !name.startsWith('_') && !name.includes('duplicate') && !name.startsWith('dedup');
}

function gatherFiles(inputs) {
  const files = [];
  for (const input of inputs) {
    const abs = path.resolve(input);
    if (!fs.existsSync(abs)) {
      files.push({ file: abs, missing: true });
      continue;
    }
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) {
      const names = fs.readdirSync(abs).filter(isEntryFileLike).sort();
      for (const name of names) files.push({ file: path.join(abs, name) });
    } else {
      files.push({ file: abs });
    }
  }
  return files;
}

function readEntries(fileInfo) {
  if (fileInfo.missing) return { entries: [], error: `文件不存在：${fileInfo.file}` };
  let text;
  try {
    text = fs.readFileSync(fileInfo.file, 'utf8');
  } catch (e) {
    return { entries: [], error: `读取失败：${e.message}` };
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return { entries: [], error: `JSON 解析失败：${e.message}` };
  }
  if (Array.isArray(data)) return { entries: data.map((entry) => ({ entry, file: fileInfo.file })) };
  if (isPlainObject(data) && Array.isArray(data.entries)) {
    // 兼容 books/toefl-core-5000.json 这类带 entries 的容器
    return { entries: data.entries.map((entry) => ({ entry, file: fileInfo.file })) };
  }
  if (isPlainObject(data)) return { entries: [{ entry: data, file: fileInfo.file }] };
  return { entries: [], error: `顶层应为数组或对象，实际为 ${typeOf(data)}` };
}

function buildCorpus(excludedFiles) {
  const excluded = new Set(excludedFiles.map((f) => path.resolve(f)));
  const map = new Map(); // word(lower) -> [来源]
  const add = (word, source) => {
    if (typeof word !== 'string' || !word.trim()) return;
    const k = word.trim().toLowerCase();
    if (!map.has(k)) map.set(k, []);
    const list = map.get(k);
    if (!list.includes(source)) list.push(source);
  };

  // 1) 权威 3534 词
  try {
    const book = JSON.parse(fs.readFileSync(BOOK_FILE, 'utf8'));
    if (Array.isArray(book.entries)) {
      for (const e of book.entries) if (isPlainObject(e)) add(e.word, 'books/toefl-core-5000.json');
    }
  } catch (_) {
    // 词书缺失时跳过，不阻断条目校验
  }

  // 2) 已落盘的所有 prepared 批次
  if (fs.existsSync(PREPARED_DIR)) {
    for (const name of fs.readdirSync(PREPARED_DIR)) {
      if (!isEntryFileLike(name)) continue;
      const abs = path.join(PREPARED_DIR, name);
      if (excluded.has(abs)) continue;
      let data;
      try {
        data = JSON.parse(fs.readFileSync(abs, 'utf8'));
      } catch (_) {
        continue;
      }
      if (!Array.isArray(data)) continue;
      for (const e of data) if (isPlainObject(e)) add(e.word, path.join('books', 'prepared', name));
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const opts = { existing: false, json: false };
  const inputs = [];
  for (const a of args) {
    if (a === '--existing') opts.existing = true;
    else if (a === '--json') opts.json = true;
    else if (a === '-h' || a === '--help') {
      console.log('用法：node tools/check-entry.js <文件或目录> [更多文件/目录] [--existing] [--json]');
      process.exit(0);
    } else inputs.push(a);
  }

  if (!inputs.length) {
    console.error('请提供要校验的 JSON 文件或目录。');
    console.error('用法：node tools/check-entry.js <文件或目录> [更多文件/目录] [--existing] [--json]');
    process.exit(2);
  }

  const fileInfos = gatherFiles(inputs);
  const results = [];
  const parseIssues = [];
  let totalEntries = 0;

  for (const info of fileInfos) {
    const r = readEntries(info);
    if (r.error) parseIssues.push({ file: info.file, error: r.error });
    for (const item of r.entries) {
      totalEntries += 1;
      const ctx = { forms: wordForms(item.entry) };
      const out = checkEntry(item.entry, ctx);
      results.push({
        file: item.file,
        word: isPlainObject(item.entry) && typeof item.entry.word === 'string' ? item.entry.word : '(无 word)',
        errors: out.errors,
        warnings: out.warnings,
      });
    }
  }

  // 批次内重名
  const batchWords = new Map();
  for (const r of results) {
    const k = r.word.trim().toLowerCase();
    if (!batchWords.has(k)) batchWords.set(k, []);
    batchWords.get(k).push(r);
  }
  const batchDuplicates = [...batchWords.entries()].filter(([, list]) => list.length > 1);

  // 与已有词库重名
  let corpus = new Map();
  if (!opts.existing) {
    corpus = buildCorpus(fileInfos.map((f) => f.file));
  }
  const crossDuplicates = [];
  if (!opts.existing) {
    for (const r of results) {
      const k = r.word.trim().toLowerCase();
      if (corpus.has(k)) {
        crossDuplicates.push({ word: r.word, corpusSources: corpus.get(k), file: r.file });
        r.errors.push({ path: 'word', message: `与已有词库重名（来源：${corpus.get(k).join(', ')}）` });
      }
    }
  }

  // 汇总
  const failed = results.filter((r) => r.errors.length > 0);
  const passed = results.length - failed.length;
  const errorCount = results.reduce((n, r) => n + r.errors.length, 0);
  const warningCount = results.reduce((n, r) => n + r.warnings.length, 0);

  if (opts.json) {
    console.log(JSON.stringify({
      mode: opts.existing ? 'existing' : 'batch',
      files: fileInfos.map((f) => f.file),
      parseIssues,
      summary: {
        entries: results.length,
        passed,
        failed: failed.length,
        errors: errorCount,
        warnings: warningCount,
        batchDuplicates: batchDuplicates.length,
        crossDuplicates: crossDuplicates.length,
      },
      results,
      batchDuplicates: batchDuplicates.map(([w, list]) => ({ word: w, files: list.map((r) => r.file) })),
      crossDuplicates,
    }, null, 2));
  } else {
    for (const issue of parseIssues) {
      console.log(`\n✗ ${issue.file}\n  ERROR  ${issue.error}`);
    }
    for (const r of results) {
      if (!r.errors.length && !r.warnings.length) continue;
      console.log(`\n${r.errors.length ? '✗' : '!'} ${r.word}  (${path.relative(ROOT, r.file)})`);
      for (const e of r.errors) console.log(`  ERROR  ${e.path}: ${e.message}`);
      for (const w of r.warnings) console.log(`  WARN   ${w.path}: ${w.message}`);
    }
    for (const [word, list] of batchDuplicates) {
      console.log(`\n✗ ${word}\n  ERROR  批次内重复出现：${list.map((r) => path.relative(ROOT, r.file)).join(', ')}`);
    }

    console.log('\n=== 汇总 ===');
    console.log(`模式：${opts.existing ? 'existing（跳过跨库重名检查）' : 'batch（包含跨库重名检查）'}`);
    if (!opts.existing) {
      console.log(`语料库：${corpus.size} 个唯一词（books/toefl-core-5000.json 与 books/prepared/*.json）`);
    }
    console.log(`词条总数：${results.length}`);
    console.log(`通过：${passed}`);
    console.log(`失败：${failed.length}`);
    console.log(`错误：${errorCount} 条`);
    console.log(`警告：${warningCount} 条`);
    console.log(`批次内重名：${batchDuplicates.length} 组`);
    console.log(`与已有词库重名：${opts.existing ? '（已跳过）' : crossDuplicates.length + ' 个'}`);
    console.log(`文件解析失败：${parseIssues.length} 个`);
    console.log(failed.length || parseIssues.length ? '结果：未通过' : '结果：全部通过');
  }

  process.exit(failed.length || parseIssues.length ? 1 : 0);
}

main();
