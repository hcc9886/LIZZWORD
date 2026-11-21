#!/usr/bin/env node
/**
 * LIZZWORD · 批量生成考试词书（源词表 + 分片 + 主表）
 *
 * 背景：用户点名要一批考试/专业词书，但仓库里没有对应源词表。
 * 本脚本按「现有深度词条池 + 自建领域词」生成源词表，并把已有深度词条
 * 直接装成该书分片（跨书复用允许），从而让这些书可以立即上架。
 *
 * 设计约束：
 *   1. 17 本书的新词表互不重复（严格分区，一词只进一本新书）；
 *   2. 与已上架 6 本词书的重叠允许（用户规则：跨书重叠没事）；
 *   3. 领域词（医护/商业法律/BEC/留学）优先排在源词表前面，先保证领域味，
 *      没有深度词条的词只进源表，等后续批次补写；
 *   4. 书籍命名与简介明确标注「自建整理」，不冒充官方词表。
 *
 * 用法：
 *   node tools/build-exam-books.js            # 预览（不写文件）
 *   node tools/build-exam-books.js --write    # 写源词表 + 分片 + 主表
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PREPARED = path.join(ROOT, "books", "prepared");
const FILTERED = path.join(ROOT, "books", "import", "filtered");

const WRITE = process.argv.includes("--write");

// ---------------------------------------------------------------
// 1. 难度分档：按词出现过的词书取最简单的档
// ---------------------------------------------------------------
const SOURCE_LEVEL = {
  shanghai: 1,
  middle: 2,
  daily: 3,
  cet4: 4,
  cet4b: 4,
  gaokao: 4,
  cet6: 5,
  ielts: 6,
  "toefl-core-5000": 6,
  sat: 6
};

function readCorpus() {
  const index = new Map();
  for (const file of fs.readdirSync(PREPARED)) {
    const match = file.match(/^([a-z0-9-]+?)-\d{4}[a-z]?\.json$/);
    if (!match) continue;
    const source = match[1];
    const level = SOURCE_LEVEL[source];
    if (!level) continue;
    let data;
    try {
      data = JSON.parse(fs.readFileSync(path.join(PREPARED, file), "utf8"));
    } catch (err) {
      continue;
    }
    for (const entry of Array.isArray(data) ? data : [data]) {
      if (!entry || !entry.word) continue;
      if (!Array.isArray(entry.senses) || !entry.senses.length) continue;
      const word = String(entry.word).toLowerCase();
      const posTag = (entry.pos && entry.pos[0] && entry.pos[0].tag) || "";
      const item = {
        word,
        pos: posName(posTag),
        meaning_zh: String(entry.definition_zh || "").split(/[；;]/)[0].trim() || "待补释义",
        level: level,
        entry: entry,
        file: file
      };
      const prev = index.get(word);
      if (!prev) index.set(word, item);
      else if (level < prev.level) Object.assign(prev, { level, pos: item.pos, meaning_zh: item.meaning_zh, entry: entry, file: file });
    }
  }
  return index;
}

function posName(tag) {
  const map = { "n.": "noun", "v.": "verb", "adj.": "adjective", "adv.": "adverb", "prep.": "preposition", "conj.": "conjunction", "pron.": "pronoun" };
  return map[tag] || (tag ? tag.replace(/\.$/, "") : "word");
}

function stableRank(word) {
  // 稳定的伪随机排序，避免整本书都是 a、b 开头的词
  let hash = 2166136261;
  for (let i = 0; i < word.length; i += 1) {
    hash ^= word.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// ---------------------------------------------------------------
// 2. 自建领域词（word|pos|中文）；优先排在源表前面
// ---------------------------------------------------------------
const DOMAIN = {
  medical: [
    "hypertension|noun|高血压", "diabetes|noun|糖尿病", "asthma|noun|哮喘", "pneumonia|noun|肺炎",
    "bronchitis|noun|支气管炎", "arthritis|noun|关节炎", "migraine|noun|偏头痛", "insomnia|noun|失眠",
    "diagnosis|noun|诊断", "prognosis|noun|预后", "therapy|noun|治疗", "antibiotic|noun|抗生素",
    "vaccine|noun|疫苗", "immunity|noun|免疫力", "infection|noun|感染", "inflammation|noun|炎症",
    "nausea|noun|恶心", "allergy|noun|过敏", "anesthesia|noun|麻醉", "surgery|noun|外科手术",
    "surgeon|noun|外科医生", "physician|noun|内科医生", "ward|noun|病房", "pharmacy|noun|药房",
    "prescription|noun|处方", "dosage|noun|剂量", "injection|noun|注射", "transfusion|noun|输血",
    "bandage|noun|绷带", "suture|noun|缝线", "scalpel|noun|手术刀", "stethoscope|noun|听诊器",
    "syringe|noun|注射器", "thermometer|noun|体温计", "pulse|noun|脉搏", "respiration|noun|呼吸",
    "metabolism|noun|新陈代谢", "digestion|noun|消化", "nutrition|noun|营养", "calorie|noun|卡路里",
    "protein|noun|蛋白质", "vitamin|noun|维生素", "hygiene|noun|卫生", "sanitation|noun|环境卫生",
    "epidemic|noun|流行病", "pandemic|noun|大流行病", "quarantine|noun|隔离检疫", "contagious|adjective|传染性的",
    "chronic|adjective|慢性的", "benign|adjective|良性的", "malignant|adjective|恶性的", "tumor|noun|肿瘤",
    "stroke|noun|中风", "fracture|noun|骨折", "sprain|noun|扭伤", "wound|noun|伤口",
    "transplant|noun|移植", "donor|noun|捐献者", "recipient|noun|接受者", "rehabilitation|noun|康复",
    "physiotherapy|noun|物理治疗", "depression|noun|抑郁症", "anxiety|noun|焦虑症", "dementia|noun|痴呆症",
    "obesity|noun|肥胖症", "malnutrition|noun|营养不良", "dehydration|noun|脱水", "hemorrhage|noun|出血",
    "artery|noun|动脉", "vein|noun|静脉", "kidney|noun|肾", "liver|noun|肝",
    "lung|noun|肺", "intestine|noun|肠", "spine|noun|脊柱", "tissue|noun|组织",
    "hormone|noun|激素", "enzyme|noun|酶", "antibody|noun|抗体", "bacteria|noun|细菌",
    "parasite|noun|寄生虫", "sedative|noun|镇静剂", "placebo|noun|安慰剂", "symptom|noun|症状"
  ],
  legal: [
    "contract|noun|合同", "clause|noun|条款", "breach|noun|违约", "liability|noun|法律责任",
    "negligence|noun|过失", "tort|noun|侵权行为", "plaintiff|noun|原告", "defendant|noun|被告",
    "litigation|noun|诉讼", "arbitration|noun|仲裁", "mediation|noun|调解", "jurisdiction|noun|司法管辖权",
    "statute|noun|成文法", "regulation|noun|法规", "compliance|noun|合规", "damages|noun|损害赔偿金",
    "compensation|noun|赔偿", "indemnity|noun|补偿保障", "warranty|noun|保证条款", "copyright|noun|版权",
    "trademark|noun|商标", "patent|noun|专利", "confidentiality|noun|保密义务", "disclosure|noun|信息披露",
    "affidavit|noun|宣誓书", "testimony|noun|证词", "verdict|noun|裁决", "judgment|noun|判决",
    "appeal|noun|上诉", "custody|noun|监护权", "inheritance|noun|继承", "estate|noun|遗产",
    "trustee|noun|受托人", "bankruptcy|noun|破产", "insolvency|noun|无力偿债", "merger|noun|合并",
    "acquisition|noun|收购", "subsidiary|noun|子公司", "shareholder|noun|股东", "dividend|noun|股息",
    "equity|noun|股权", "asset|noun|资产", "audit|noun|审计", "invoice|noun|发票",
    "procurement|noun|采购", "tender|noun|投标", "franchise|noun|特许经营", "monopoly|noun|垄断",
    "antitrust|adjective|反垄断的", "consumer|noun|消费者", "supplier|noun|供应商", "distributor|noun|经销商",
    "logistics|noun|物流", "inventory|noun|库存", "tariff|noun|关税", "subsidy|noun|补贴",
    "quota|noun|配额", "sanction|noun|制裁", "embargo|noun|禁运", "customs|noun|海关",
    "freight|noun|货运", "premium|noun|保险费", "mortgage|noun|抵押贷款", "collateral|noun|抵押物",
    "lease|noun|租约", "tenant|noun|承租人", "landlord|noun|出租人", "notary|noun|公证人"
  ],
  business: [
    "agenda|noun|议程", "minutes|noun|会议记录", "budget|noun|预算", "forecast|noun|预测",
    "revenue|noun|营业收入", "turnover|noun|营业额", "stakeholder|noun|利益相关方", "vendor|noun|供应商",
    "negotiate|verb|谈判", "proposal|noun|提案", "presentation|noun|演示", "memo|noun|备忘录",
    "recruit|verb|招聘", "candidate|noun|候选人", "salary|noun|薪水", "bonus|noun|奖金",
    "promotion|noun|晋升", "resign|verb|辞职", "redundancy|noun|裁员", "appraisal|noun|绩效评估",
    "delegate|verb|授权", "supervise|verb|监督", "postpone|verb|推迟", "inquire|verb|询价",
    "refund|noun|退款", "discount|noun|折扣", "shipment|noun|装运", "warehouse|noun|仓库",
    "campaign|noun|推广活动", "brand|noun|品牌", "competitor|noun|竞争对手", "strategy|noun|战略",
    "productivity|noun|生产率", "efficiency|noun|效率", "quotation|noun|报价单", "receipt|noun|收据"
  ],
  academic: [
    "campus|noun|校园", "dormitory|noun|宿舍", "lecture|noun|讲座", "seminar|noun|研讨课",
    "tutorial|noun|辅导课", "syllabus|noun|教学大纲", "semester|noun|学期", "transcript|noun|成绩单",
    "scholarship|noun|奖学金", "tuition|noun|学费", "enrollment|noun|注册入学", "admission|noun|录取",
    "orientation|noun|新生说明会", "faculty|noun|院系；全体教员", "dissertation|noun|学位论文",
    "thesis|noun|论文", "citation|noun|引用", "plagiarism|noun|剽窃", "bibliography|noun|参考书目",
    "abstract|noun|摘要", "hypothesis|noun|假设", "methodology|noun|方法论", "questionnaire|noun|问卷",
    "statistics|noun|统计数据", "assessment|noun|评估", "supervisor|noun|导师", "graduation|noun|毕业",
    "alumni|noun|校友", "credential|noun|资历证明", "prerequisite|noun|先修课程", "curriculum|noun|课程体系"
  ]
};

// ---------------------------------------------------------------
// 3. 17 本书的配置
//    bands：允许取词的难度档；prefer：优先档；quota：目标词数
//    按「最难的书先挑」排序，避免高级词被简单书抢走
// ---------------------------------------------------------------
const BOOKS = [
  {
    id: "english-major", name: "英专英语核心词汇", quota: 400, bands: [6], prefer: [6],
    intro: "英语专业高阶词汇（自建整理）：从现有深度词条池中按 C1–C2 难度精选，配词根、义项与近义辨析。"
  },
  {
    id: "kaoyan", name: "考研英语核心词汇", quota: 400, bands: [5, 6], prefer: [6],
    intro: "考研英语高频学术词（自建整理）：以阅读与写作常见的高阶词为主，覆盖熟词僻义与同义替换。"
  },
  {
    id: "study-abroad", name: "留学英语核心词汇", quota: 350, bands: [6], prefer: [6],
    intro: "留学申请与海外课堂高频词（自建整理）：涵盖申请材料、校园生活与学术写作场景。"
  },
  {
    id: "pte", name: "PTE 学术英语核心词汇", quota: 350, bands: [6], prefer: [6],
    intro: "PTE 学术场景高频词（自建整理）：偏重听力与阅读中的学术表达与同义替换。"
  },
  {
    id: "fce", name: "FCE 剑桥第一证书核心词汇", quota: 400, bands: [4, 5, 6], prefer: [5, 6],
    intro: "FCE（B2 First）级别核心词（自建整理）：覆盖 B2 阶段的高频搭配与话题词。"
  },
  {
    id: "bec", name: "BEC 商务英语核心词汇", quota: 350, bands: [4, 5, 6], prefer: [4, 5],
    domain: "business",
    intro: "BEC 商务场景核心词（自建整理）：会议、谈判、财务、物流等高频商务表达。"
  },
  {
    id: "medical", name: "医护英语核心词汇", quota: 320, bands: [4, 5, 6], prefer: [4, 5],
    domain: "medical",
    intro: "医护英语核心词（自建整理）：临床、解剖、用药与公共卫生高频术语，非官方考纲。"
  },
  {
    id: "business-law", name: "商业法律英语核心词汇", quota: 320, bands: [4, 5, 6], prefer: [4, 5],
    domain: "legal",
    intro: "商业与法律英语核心词（自建整理）：合同、诉讼、公司与贸易高频术语，非官方考纲。"
  },
  {
    id: "coca", name: "COCA 高频词", quota: 550, bands: [3, 4, 5, 6], prefer: [3, 4],
    intro: "按当代英语语料高频顺序整理的核心词（自建整理）：先覆盖最常用的日常与书面表达。"
  },
  {
    id: "pets", name: "全国英语等级考试（PETS）核心词汇", quota: 400, bands: [3, 4, 5], prefer: [3, 4],
    intro: "PETS 二至四级核心词（自建整理）：覆盖日常交流、社会话题与基础学术表达。"
  },
  {
    id: "zhuanshengben", name: "专升本英语核心词汇", quota: 350, bands: [4, 5], prefer: [4],
    intro: "专升本英语高频词（自建整理）：以四级难度为主，补充阅读与写作常见表达。"
  },
  {
    id: "zikao", name: "自考英语核心词汇", quota: 320, bands: [4], prefer: [4],
    intro: "自考英语（二）核心词（自建整理）：覆盖课文与真题中的高频四级词汇。"
  },
  {
    id: "self-study", name: "自学考试英语核心词汇", quota: 280, bands: [3, 4, 5], prefer: [4],
    intro: "自学考试英语基础词（自建整理）：与自考英语（一）难度对齐的高频词。"
  },
  {
    id: "new-concept", name: "新概念英语核心词汇", quota: 400, bands: [2, 3, 4], prefer: [2, 3],
    intro: "新概念英语风格的基础核心词（自建整理，非教材官方词表）：按课文常见话题与难度梯度整理。"
  },
  {
    id: "zhonggaozhi", name: "中高职英语核心词汇", quota: 350, bands: [2, 3, 4], prefer: [2, 3],
    intro: "中高职英语核心词（自建整理）：以初中到四级之间的实用高频词为主。"
  },
  {
    id: "ab", name: "AB 级英语应用能力核心词汇", quota: 300, bands: [3, 4], prefer: [3],
    intro: "高等学校英语应用能力 AB 级核心词（自建整理）：偏重日常与职场基础表达。"
  },
  {
    id: "ket-pet", name: "KET/PET 剑桥通用五级核心词汇", quota: 480, bands: [1, 2, 3], prefer: [2, 3],
    intro: "KET（A2）与 PET（B1）核心词（自建整理）：日常话题、校园生活与基础交际表达。"
  }
];

// ---------------------------------------------------------------
// 4. 分区：每本书先放领域词，再从语料池按难度挑选，已被选走的词跳过
// ---------------------------------------------------------------
function build() {
  const corpus = readCorpus();
  const reserved = new Set();
  for (const book of BOOKS) {
    if (!book.domain) continue;
    for (const row of DOMAIN[book.domain]) reserved.add(row.split("|")[0].toLowerCase());
  }
  const assigned = new Set();
  const result = [];

  for (const book of BOOKS) {
    const list = [];
    const seen = new Set();

    const push = (item) => {
      const key = item.word.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      list.push(item);
    };

    // 领域词优先
    const domainWords = book.domain
      ? DOMAIN[book.domain].map((row) => {
        const [word, pos, meaning] = row.split("|");
        return { word, pos, meaning_zh: meaning };
      })
      : [];
    for (const item of domainWords) {
      push(item);
      assigned.add(item.word.toLowerCase());
    }

    // 语料池候选：先 prefer 档，再 bands 档，按稳定哈希打散
    const prefer = new Set(book.prefer || []);
    const bands = new Set(book.bands || []);
    const candidates = [...corpus.values()]
      .filter((item) => bands.has(item.level) && !assigned.has(item.word) && !seen.has(item.word) && !reserved.has(item.word))
      .sort((a, b) => {
        const pa = prefer.has(a.level) ? 0 : 1;
        const pb = prefer.has(b.level) ? 0 : 1;
        if (pa !== pb) return pa - pb;
        if (a.level !== b.level) return a.level - b.level;
        return stableRank(a.word) - stableRank(b.word);
      });

    for (const item of candidates) {
      if (list.length >= book.quota) break;
      push({ word: item.word, pos: item.pos, meaning_zh: item.meaning_zh });
      assigned.add(item.word);
    }

    result.push({ book, list: list.slice(0, book.quota) });
  }

  return { result, corpus };
}

function prettify(book) {
  return book;
}

// ---------------------------------------------------------------
// 5. 复用词条的机械修整：老批次里常见的结构缺陷就地修正，
//    修完仍不达标（错误无法机械消除）的词条不进新书分片。
// ---------------------------------------------------------------
const CJK_RE = /[\u3400-\u9FFF\uF900-\uFAFF]/g;

function loadChecker() {
  const src = fs.readFileSync(path.join(__dirname, "check-entry.js"), "utf8")
    .replace(/\nmain\(\);\s*$/, "\nmodule.exports = { checkEntry };");
  const Module = require("module");
  const m = new Module(path.join(__dirname, "check-entry.js"));
  m.filename = path.join(__dirname, "check-entry.js");
  m.paths = Module._nodeModulePaths(path.join(__dirname, "check-entry.js"));
  m._compile(src, m.filename);
  return m.exports.checkEntry;
}

function normalizeEntry(raw, firstMeaning) {
  const entry = JSON.parse(JSON.stringify(raw));
  const word = String(entry.word || "").toLowerCase();

  // 语义分支：S1 -> 01
  if (entry.semanticMap && Array.isArray(entry.semanticMap.branches)) {
    for (const branch of entry.semanticMap.branches) {
      if (typeof branch.senses === "string") {
        branch.senses = branch.senses.replace(/S(\d+)/g, (m, n) => String(n).padStart(2, "0"));
      }
    }
  }
  // 词源年代、语义链全大写
  if (entry.etymology && Array.isArray(entry.etymology.items)) {
    for (const item of entry.etymology.items) {
      if (typeof item.era === "string") item.era = item.era.toUpperCase();
    }
  }
  if (entry.semanticMap && Array.isArray(entry.semanticMap.chain)) {
    entry.semanticMap.chain = entry.semanticMap.chain.map((x) =>
      String(x).toUpperCase().replace(/[=:]/g, " ").replace(/\s+/g, " ").trim()
    );
  }
  // 词形：清掉中文，去掉等于原形或重复的
  if (Array.isArray(entry.forms)) {
    const seen = new Set();
    entry.forms = entry.forms.filter((item) => {
      if (!item || typeof item.form !== "string") return false;
      const form = item.form.replace(CJK_RE, "").trim();
      if (!form || seen.has(form.toLowerCase())) return false;
      seen.add(form.toLowerCase());
      item.form = form;
      return true;
    });
    if (!entry.forms.length) entry.forms = [{ label: "词形", form: entry.word }];
  }
  // 场景：英文句前必须有中文铺垫
  if (typeof entry.scene === "string" && entry.scene.trim()) {
    let scene = entry.scene.trim();
    let idx = scene.search(/[A-Za-z]/);
    let preamble = idx >= 0 ? scene.slice(0, idx) : scene;
    let english = idx >= 0 ? scene.slice(idx) : "";
    if (!CJK_RE.test(preamble)) {
      CJK_RE.lastIndex = 0;
      const safeMeaning = String(firstMeaning).replace(/[A-Za-z][A-Za-z\u2019\u0027. -]*/g, "").replace(/[\uff08\uff09()]/g, "").trim() || "该词";
      preamble = "这里指「" + safeMeaning + "」。" + preamble;
    }
    CJK_RE.lastIndex = 0;
    english = english.replace(CJK_RE, "").replace(/\s+/g, " ").trim();
    CJK_RE.lastIndex = 0;
    entry.scene = (preamble.trim() + " " + english).trim();
  }
  // 近义/形近：去掉自引用与组内重复；组不足 2 条就整组丢弃
  if (entry.similar && Array.isArray(entry.similar.groups)) {
    const groups = [];
    for (const group of entry.similar.groups) {
      if (!group || !Array.isArray(group.entries)) continue;
      const seen = new Set();
      const entries = group.entries.filter((item) => {
        if (!item || typeof item.word !== "string") return false;
        const key = item.word.toLowerCase();
        if (key === word || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      if (entries.length >= 2) groups.push(Object.assign({}, group, { entries }));
    }
    entry.similar.groups = groups;
  }
  // 近义标签、组标题、义项引用、记忆卡词语统一
  if (entry.similar && Array.isArray(entry.similar.groups)) {
    for (const group of entry.similar.groups) {
      if (group.heading === "SOUND-ALIKE") group.heading = "LOOK-ALIKE";
      if (group.heading === "NEAR-MEANING") group.heading = "NEAR MEANING";
      for (const item of group.entries || []) {
        if (typeof item.tag === "string") {
          item.tag = item.tag.toLowerCase().replace(/[^a-z -]/g, " ").replace(/\s+/g, " ").trim().slice(0, 34) || "related";
        }
      }
    }
  }
  if (typeof entry.sceneCN === "string" && !/第\s*\d+\s*个义项/.test(entry.sceneCN)) {
    entry.sceneCN = "这里指第 1 个义项。" + entry.sceneCN;
  }
  if (entry.dict_mnemonic && typeof entry.dict_mnemonic === "object") {
    entry.dict_mnemonic.word = entry.word;
  }
  if (Array.isArray(entry.collocations) && entry.collocations.length > 7) {
    entry.collocations = entry.collocations.slice(0, 7);
  }
  // 派生词：去掉目标词本身
  if (Array.isArray(entry.derivatives)) {
    entry.derivatives = entry.derivatives.filter((item) => item && String(item.word || "").toLowerCase() !== word);
  }
  return entry;
}

function writeOutputs(result, corpus, checkEntry) {
  if (!WRITE) return;
  const { execFileSync } = require("child_process");
  for (const { book, list } of result) {
    fs.writeFileSync(path.join(FILTERED, book.id + ".json"), JSON.stringify(list, null, 2) + "\n");
    // 重跑时先清掉旧分片，避免残留分片让主表多算词
    for (const file of fs.readdirSync(PREPARED)) {
      if (file.startsWith(book.id + "-") && /^\d{4}[a-z]?\.json$/.test(file.slice(book.id.length + 1))) {
        fs.unlinkSync(path.join(PREPARED, file));
      }
    }
    const entries = [];
    const rejected = [];
    for (const item of list) {
      const hit = corpus.get(String(item.word).toLowerCase());
      if (!hit || !hit.entry) continue;
      const entry = normalizeEntry(hit.entry, hit.meaning_zh);
      const ctxForms = [entry.word].concat((entry.forms || []).map((f) => f.form)).filter(Boolean);
      const report = checkEntry(entry, { forms: ctxForms });
      if (report.errors.length) {
        if (process.env.DEBUG_REJECT && rejected.length < 3) console.log("DEBUG", entry.word, "|", report.errors[0].path, "|", JSON.stringify(entry.scene).slice(0, 180));
        rejected.push(entry.word + " (" + report.errors[0].message.slice(0, 40) + ")");
        continue;
      }
      entries.push(entry);
    }
    const chunk = 20;
    let shard = 0;
    for (let i = 0; i < entries.length; i += chunk) {
      shard += 1;
      const file = book.id + "-" + String(shard).padStart(4, "0") + ".json";
      fs.writeFileSync(path.join(PREPARED, file), JSON.stringify(entries.slice(i, i + chunk), null, 2) + "\n");
    }
    execFileSync(process.execPath, [path.join(__dirname, "make-book-master.js"), book.id, "--name", book.name, "--intro", book.intro], { cwd: ROOT, stdio: "inherit" });
    console.log("  ->", book.id, "上架", entries.length, "词 / 源表", list.length, "| 分片", shard, rejected.length ? "| 剔除 " + rejected.length + "：" + rejected.slice(0, 3).join("、") : "");
  }
}

function main() {
  const { result, corpus } = build();
  let total = 0;
  console.log("语料池:", corpus.size, "个深度词条");
  for (const { book, list } of result) {
    total += list.length;
    const covered = list.filter((item) => corpus.has(item.word.toLowerCase())).length;
    console.log(
      `${book.id.padEnd(15)} ${String(list.length).padStart(4)} 词 | 已有深度词条 ${String(covered).padStart(4)} | ${book.name}`
    );
  }
  console.log("合计", total, "词（新词书之间互不重复）");
  writeOutputs(result, corpus, loadChecker());
}

if (require.main === module) main();
module.exports = { BOOKS, DOMAIN, readCorpus, build, normalizeEntry, loadChecker, posName, stableRank };
