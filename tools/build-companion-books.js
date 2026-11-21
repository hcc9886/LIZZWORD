#!/usr/bin/env node
/**
 * LIZZWORD · 配套词书生成器
 *
 * 生成三本「配套学习」性质的书：
 *   zero-basic     零基础启蒙 300 词 —— 只取最简单的高频词，图/音/短句优先
 *   affix-roots    词根词缀核心词 300 —— 取 affixes 最丰富的词，配合词缀学习
 *   collocation    高频搭配核心词 400 —— 取 collocations 最丰富的词，配合词组学习
 *
 * 与 17 本考试词书不同：这三本是「横切集合」，按学习目标重新组织同一批深度词条，
 * 因此允许与考试词书重叠；但三本之间互不重复。
 *
 * 用法：
 *   node tools/build-companion-books.js            # 预览
 *   node tools/build-companion-books.js --write    # 写源表 + 分片 + 主表
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const PREPARED = path.join(ROOT, "books", "prepared");
const FILTERED = path.join(ROOT, "books", "import", "filtered");

const { readCorpus, normalizeEntry, loadChecker, stableRank } = require("./build-exam-books.js");

const WRITE = process.argv.includes("--write");

const BOOKS = [
  {
    id: "zero-basic",
    name: "零基础启蒙 300 词",
    quota: 300,
    pick(corpus, taken) {
      // 只取最简单的一批：小学 + 初中池，优先具体名词/动词/形容词
      const preferred = new Set(["noun", "verb", "adjective", "adverb"]);
      return [...corpus.values()]
        .filter((item) => item.level <= 2 && !taken.has(item.word) && item.entry)
        .sort((a, b) => {
          const pa = preferred.has(a.pos) ? 0 : 1;
          const pb = preferred.has(b.pos) ? 0 : 1;
          if (pa !== pb) return pa - pb;
          if (a.level !== b.level) return a.level - b.level;
          return stableRank(a.word) - stableRank(b.word);
        });
    },
    intro:
      "零基础启蒙 300 词（自建整理）：只取最常用、最具体的名词动词形容词，配音标、图片联想、短例句与中文记忆钩子；" +
      "每天 5–10 词就能上手，先会读会认，再慢慢展开进阶内容。"
  },
  {
    id: "affix-roots",
    name: "词根词缀核心词 300",
    quota: 300,
    pick(corpus, taken) {
      return [...corpus.values()]
        .filter(
          (item) =>
            item.level >= 4 &&
            !taken.has(item.word) &&
            item.entry &&
            item.entry.affixes &&
            Array.isArray(item.entry.affixes.items) &&
            item.entry.affixes.items.length >= 9
        )
        .sort((a, b) => {
          const la = a.entry.affixes.items.length;
          const lb = b.entry.affixes.items.length;
          if (lb !== la) return lb - la;
          return stableRank(a.word) - stableRank(b.word);
        });
    },
    intro:
      "词根词缀核心词 300（自建整理）：优先收录词缀拆解最完整的高阶词，配合「词根 → 前缀/后缀 → 同族词」的拆解路径，先懂构词再背词。"
  },
  {
    id: "collocation",
    name: "高频搭配核心词 400",
    quota: 400,
    pick(corpus, taken) {
      return [...corpus.values()]
        .filter(
          (item) =>
            !taken.has(item.word) &&
            item.entry &&
            Array.isArray(item.entry.collocations) &&
            item.entry.collocations.length >= 6
        )
        .sort((a, b) => {
          const la = a.entry.collocations.length;
          const lb = b.entry.collocations.length;
          if (lb !== la) return lb - la;
          return stableRank(a.word) - stableRank(b.word);
        });
    },
    intro:
      "高频搭配核心词 400（自建整理）：每个词都带 6 条以上常用搭配，按「词块」而不是单词记忆，写作与口语见效最快。"
  }
];

function main() {
  const corpus = readCorpus();
  const checkEntry = loadChecker();
  const taken = new Set();
  const result = [];

  for (const book of BOOKS) {
    const picks = book.pick(corpus, taken).slice(0, book.quota);
    const list = picks.map((item) => ({
      word: item.word,
      pos: item.pos,
      meaning_zh: item.meaning_zh
    }));
    for (const item of list) taken.add(item.word);
    result.push({ book, list, entries: picks.map((item) => item.entry) });
    console.log(book.id.padEnd(14), list.length, "词 |", book.name);
  }
  const total = result.reduce((sum, r) => sum + r.list.length, 0);
  console.log("合计", total, "词（三本之间互不重复）");
  if (!WRITE) return;

  for (const { book, list, entries } of result) {
    fs.writeFileSync(path.join(FILTERED, book.id + ".json"), JSON.stringify(list, null, 2) + "\n");
    for (const file of fs.readdirSync(PREPARED)) {
      if (file.startsWith(book.id + "-") && /^\d{4}[a-z]?\.json$/.test(file.slice(book.id.length + 1))) {
        fs.unlinkSync(path.join(PREPARED, file));
      }
    }
    const clean = [];
    const rejected = [];
    for (const raw of entries) {
      const entry = normalizeEntry(raw, String(raw.definition_zh || "").split(/[；;]/)[0]);
      const ctx = { forms: [entry.word].concat((entry.forms || []).map((f) => f.form)).filter(Boolean) };
      const report = checkEntry(entry, ctx);
      if (report.errors.length) {
        rejected.push(entry.word + " (" + report.errors[0].message.slice(0, 30) + ")");
        continue;
      }
      clean.push(entry);
    }
    let shard = 0;
    for (let i = 0; i < clean.length; i += 20) {
      shard += 1;
      const file = book.id + "-" + String(shard).padStart(4, "0") + ".json";
      fs.writeFileSync(path.join(PREPARED, file), JSON.stringify(clean.slice(i, i + 20), null, 2) + "\n");
    }
    execFileSync(
      process.execPath,
      [path.join(__dirname, "make-book-master.js"), book.id, "--name", book.name, "--intro", book.intro],
      { cwd: ROOT, stdio: "inherit" }
    );
    console.log("  ->", book.id, "上架", clean.length, "词 / 源表", list.length, "| 分片", shard,
      rejected.length ? "| 剔除 " + rejected.length + "：" + rejected.slice(0, 3).join("、") : "");
  }
}

main();
