#!/usr/bin/env node
/**
 * LIZZWORD · 词书库生成器（共享分片版）
 *
 * 为什么改成共享分片：
 *   每本书各写一份分片会把 books/prepared 撑到几百 MB，且同一词条被复制十几次。
 *   现在每本书只维护「选词清单」，preparedFiles 直接指向已有的源分片，
 *   前端按主表词集过滤多余词条，因此零新增存储、书可以做得很大。
 *
 * 规则（按用户要求）：
 *   - 同一本书内不允许重复；
 *   - 不同书之间允许重复（跨书重叠没问题）；
 *   - 选词按难度档与领域词优先，配额尽量大。
 *
 * 用法：
 *   node tools/build-library.js            # 预览
 *   node tools/build-library.js --write    # 写源表 + 主表 + manifest
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { readCorpus, stableRank } = require("./build-exam-books.js");

const ROOT = path.resolve(__dirname, "..");
const FILTERED = path.join(ROOT, "books", "import", "filtered");
const BOOKS_DIR = path.join(ROOT, "books");
const WRITE = process.argv.includes("--write");

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

// 配额放大：同一本书内不重复，跨书允许重叠
const BOOKS = [
  { id: "english-major", name: "英专英语核心词汇", quota: 2000, bands: [3, 4, 5, 6], prefer: [5, 6],
    intro: "英语专业高阶词汇（自建整理）：C1–C2 难度为主，覆盖词根、义项与近义辨析。" },
  { id: "kaoyan", name: "考研英语核心词汇", quota: 2000, bands: [3, 4, 5, 6], prefer: [4, 5, 6],
    intro: "考研英语高频学术词（自建整理）：以阅读与写作常见的高阶词为主，覆盖熟词僻义与同义替换。" },
  { id: "study-abroad", name: "留学英语核心词汇", quota: 2000, bands: [3, 4, 5, 6], prefer: [5, 6], domain: "academic",
    intro: "留学申请与海外课堂高频词（自建整理）：涵盖申请材料、校园生活与学术写作场景。" },
  { id: "pte", name: "PTE 学术英语核心词汇", quota: 2000, bands: [3, 4, 5, 6], prefer: [5, 6],
    intro: "PTE 学术场景高频词（自建整理）：偏重听力与阅读中的学术表达与同义替换。" },
  { id: "fce", name: "FCE 剑桥第一证书核心词汇", quota: 2000, bands: [3, 4, 5, 6], prefer: [4, 5],
    intro: "FCE（B2 First）级别核心词（自建整理）：覆盖 B2 阶段的高频搭配与话题词。" },
  { id: "bec", name: "BEC 商务英语核心词汇", quota: 2000, bands: [3, 4, 5, 6], prefer: [4, 5], domain: "business",
    intro: "BEC 商务场景核心词（自建整理）：会议、谈判、财务、物流等高频商务表达。" },
  { id: "medical", name: "医护英语核心词汇", quota: 2000, bands: [3, 4, 5, 6], prefer: [4, 5], domain: "medical",
    intro: "医护英语核心词（自建整理）：临床、解剖、用药与公共卫生高频术语，非官方考纲。" },
  { id: "business-law", name: "商业法律英语核心词汇", quota: 2000, bands: [3, 4, 5, 6], prefer: [4, 5], domain: "legal",
    intro: "商业与法律英语核心词（自建整理）：合同、诉讼、公司与贸易高频术语，非官方考纲。" },
  { id: "coca", name: "COCA 高频词", quota: 2000, bands: [3, 4, 5, 6], prefer: [3, 4],
    intro: "按当代英语语料高频顺序整理的核心词（自建整理）：先覆盖最常用的日常与书面表达。" },
  { id: "pets", name: "全国英语等级考试（PETS）核心词汇", quota: 2000, bands: [2, 3, 4, 5], prefer: [3, 4],
    intro: "PETS 二至四级核心词（自建整理）：覆盖日常交流、社会话题与基础学术表达。" },
  { id: "zhuanshengben", name: "专升本英语核心词汇", quota: 2000, bands: [2, 3, 4, 5], prefer: [4],
    intro: "专升本英语高频词（自建整理）：以四级难度为主，补充阅读与写作常见表达。" },
  { id: "zikao", name: "自考英语核心词汇", quota: 2000, bands: [2, 3, 4], prefer: [4],
    intro: "自考英语（二）核心词（自建整理）：覆盖课文与真题中的高频四级词汇。" },
  { id: "self-study", name: "自学考试英语核心词汇", quota: 2000, bands: [2, 3, 4], prefer: [3, 4],
    intro: "自学考试英语基础词（自建整理）：与自考英语（一）难度对齐的高频词。" },
  { id: "new-concept", name: "新概念英语核心词汇", quota: 2000, bands: [1, 2, 3, 4], prefer: [2, 3],
    intro: "新概念英语风格的基础核心词（自建整理，非教材官方词表）：按课文常见话题与难度梯度整理。" },
  { id: "zhonggaozhi", name: "中高职英语核心词汇", quota: 2000, bands: [1, 2, 3, 4], prefer: [2, 3],
    intro: "中高职英语核心词（自建整理）：以初中到四级之间的实用高频词为主。" },
  { id: "ab", name: "AB 级英语应用能力核心词汇", quota: 2000, bands: [1, 2, 3, 4], prefer: [2, 3],
    intro: "高等学校英语应用能力 AB 级核心词（自建整理）：偏重日常与职场基础表达。" },
  { id: "ket-pet", name: "KET/PET 剑桥通用五级核心词汇", quota: 2000, bands: [1, 2, 3, 4], prefer: [2, 3],
    intro: "KET（A2）与 PET（B1）核心词（自建整理）：日常话题、校园生活与基础交际表达。" },
  { id: "sat", name: "SAT 核心词汇", quota: 2000, bands: [3, 4, 5, 6], prefer: [5, 6],
    intro: "SAT 学术与阅读高频词（自建整理）：以推理、社科、科学类文章常见词为主。" },
  { id: "cet6", name: "CET6 大学英语六级词汇", quota: 2000, bands: [4, 5], prefer: [5],
    intro: "大学英语六级核心词（自建整理）：在四级基础上扩展学术与抽象表达。" },
  { id: "gaokao", name: "高考英语核心词汇", quota: 2000, bands: [2, 3, 4], prefer: [4],
    intro: "高考英语核心词（自建整理）：覆盖阅读、完形与写作的高频词与搭配。" },
  { id: "zero-basic", name: "零基础启蒙 300 词", quota: 300, bands: [1, 2], prefer: [1],
    intro: "零基础启蒙 300 词（自建整理）：只取最常用、最具体的名词动词形容词，配音标、图片联想、短例句与中文记忆钩子；每天 5–10 词就能上手。" },
  { id: "affix-roots", name: "词根词缀核心词", quota: 800, bands: [3, 4, 5, 6], prefer: [5, 6], affix: true,
    intro: "优先收录词缀拆解最完整的高阶词，按「词根 → 前缀/后缀 → 同族词」的路径拆解，先懂构词再背词。" },
  { id: "collocation", name: "高频搭配核心词", quota: 800, bands: [3, 4, 5, 6], prefer: [4, 5], collocation: true,
    intro: "每个词都带 6 条以上常用搭配，按「词块」而不是单词记忆，写作与口语见效最快。" },
  { id: "confusables", name: "易混词辨析", quota: 600, bands: [3, 4, 5, 6], prefer: [5, 6], confusable: true,
    intro: "从近义/形近组里挑出最容易被混淆的一组词，逐个对照义项与搭配差异，专治「认识但选不对」。" }
];

function selectFor(book, corpus) {
  const bands = new Set(book.bands || []);
  const prefer = new Set(book.prefer || []);
  const seen = new Set();
  const list = [];
  const push = (item) => {
    const key = item.word.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    list.push(item);
    return true;
  };

  if (book.domain) {
    for (const row of DOMAIN[book.domain]) {
      const [word, pos, meaning] = row.split("|");
      push({ word, pos, meaning_zh: meaning, entry: null, file: null, level: 0 });
    }
  }

  const candidates = [...corpus.values()].filter((item) => {
    if (!item.entry) return false;
    if (book.affix) {
      const items = item.entry.affixes && item.entry.affixes.items;
      return Array.isArray(items) && items.length >= 9 && bands.has(item.level);
    }
    if (book.collocation) {
      const items = item.entry.collocations;
      return Array.isArray(items) && items.length >= 6 && bands.has(item.level);
    }
    if (book.confusable) {
      const groups = item.entry.similar && item.entry.similar.groups;
      const count = Array.isArray(groups) ? groups.reduce((sum, g) => sum + ((g && g.entries && g.entries.length) || 0), 0) : 0;
      return count >= 6 && bands.has(item.level);
    }
    return bands.has(item.level);
  });

  candidates.sort((a, b) => {
    const pa = prefer.has(a.level) ? 0 : 1;
    const pb = prefer.has(b.level) ? 0 : 1;
    if (pa !== pb) return pa - pb;
    if (a.level !== b.level) return a.level - b.level;
    return stableRank(a.word) - stableRank(b.word);
  });

  for (const item of candidates) {
    if (list.length >= book.quota) break;
    push(item);
  }

  // 配额没满时，从全库补足（按离目标难度最近优先），保证每本都能到目标词数
  if (list.length < book.quota) {
    const target = (book.prefer || book.bands || [3]).reduce((sum, n) => sum + n, 0) / Math.max(1, (book.prefer || book.bands || [3]).length);
    const rest = [...corpus.values()]
      .filter((item) => item.entry && !seen.has(item.word.toLowerCase()))
      .sort((a, b) => {
        const da = Math.abs(a.level - target);
        const db = Math.abs(b.level - target);
        if (da !== db) return da - db;
        return stableRank(a.word) - stableRank(b.word);
      });
    for (const item of rest) {
      if (list.length >= book.quota) break;
      push(item);
    }
  }
  // 控制分片数量：把选中的词按来源分片归并，优先保留词多的分片，
  // 最多 80 片，避免一次打开一本书要拉几百个请求。
  const byFile = new Map();
  for (const item of list) {
    if (!item.file) continue;
    if (!byFile.has(item.file)) byFile.set(item.file, []);
    byFile.get(item.file).push(item);
  }
  // 前端会按主表过滤多余词条，所以分片之间可以重词；这里只按「选中词」累计，
  // 达到配额就停，避免一次打开一本书要拉几百个请求。
  const ranked = [...byFile.entries()].sort((a, b) => b[1].length - a[1].length);
  const chosen = new Set();
  let count = 0;
  for (const [file, items] of ranked) {
    if (count >= book.quota || chosen.size >= 320) break;
    chosen.add(file);
    count += items.length;
  }
  const kept = list.filter((item) => !item.file || chosen.has(item.file)).slice(0, book.quota);
  if (kept.length < list.length) {
    // 重新去重，保持原顺序
    const seen2 = new Set();
    return kept.filter((item) => {
      const k = item.word.toLowerCase();
      if (seen2.has(k)) return false;
      seen2.add(k);
      return true;
    });
  }
  return kept;
}

function main() {
  const corpus = readCorpus();
  const result = BOOKS.map((book) => ({ book, list: selectFor(book, corpus) }));
  for (const { book, list } of result) {
    const covered = list.filter((x) => x.entry).length;
    console.log(book.id.padEnd(15), String(list.length).padStart(4), "词 | 已有词条", String(covered).padStart(4), "|", book.name);
  }
  console.log("合计", result.reduce((s, r) => s + r.list.length, 0), "词（同书内去重，跨书允许重叠）");

  if (!WRITE) return;

  const manifest = {};
  for (const { book, list } of result) {
    fs.writeFileSync(path.join(FILTERED, book.id + ".json"), JSON.stringify(
      list.map((x) => ({ word: x.word, pos: x.pos, meaning_zh: x.meaning_zh })), null, 2) + "\n");

    const files = [...new Set(list.filter((x) => x.file).map((x) => "./books/prepared/" + x.file))].sort();
    manifest[book.id] = files;

    const entries = list.filter((x) => x.entry).map((x) => x.word);
    const master = {
      id: book.id,
      name: book.name,
      intro: book.intro,
      tiers: [{ id: 1, name: "核心词表", count: entries.length }],
      declaredTotal: entries.length,
      importedCount: entries.length,
      entries: entries.map((word, i) => ({ word, index: i + 1, tier: 1 }))
    };
    fs.writeFileSync(path.join(BOOKS_DIR, book.id + ".json"), JSON.stringify(master, null, 2) + "\n");
    console.log("  ->", book.id, "主表", entries.length, "| 引用分片", files.length);
  }

  const header = "/* 由 tools/build-library.js 生成：每本书引用哪些分片。不要手改。 */\nwindow.BOOK_MANIFEST = ";
  fs.writeFileSync(path.join(BOOKS_DIR, "manifest.js"), header + JSON.stringify(manifest, null, 2) + ";\n");
  console.log("已写 books/manifest.js:", Object.keys(manifest).length, "本");
}

main();
