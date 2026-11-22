#!/usr/bin/env node
/**
 * LIZZWORD · 同根词族专书（从 derivatives + affixes 反向聚合）
 *
 * 选词规则：派生词 ≥5 或 词缀条目 ≥10 的词，按「词族信息量」排序取 500 个。
 * 分片复用现有源分片（共享分片架构），不新增词条文件。
 *
 * 用法：node tools/build-family-book.js --write
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { readCorpus } = require("./build-exam-books.js");

const ROOT = path.resolve(__dirname, "..");
const WRITE = process.argv.includes("--write");
const BOOK = {
  id: "word-family",
  name: "同根词族 500",
  quota: 500,
  intro:
    "同根词族 500（自建整理）：把派生词与词缀最丰富的词挑出来，按「一个词根带动一串词」的方式成组记忆，比单背单词省力。"
};

function score(item) {
  const entry = item.entry || {};
  const der = Array.isArray(entry.derivatives) ? entry.derivatives.length : 0;
  const affix = entry.affixes && Array.isArray(entry.affixes.items) ? entry.affixes.items.length : 0;
  return der * 3 + affix;
}

function main() {
  const corpus = readCorpus();
  const picked = [...corpus.values()]
    .filter((item) => item.entry && score(item) >= 18)
    .sort((a, b) => {
      const diff = score(b) - score(a);
      if (diff !== 0) return diff;
      return a.word.localeCompare(b.word);
    })
    .slice(0, BOOK.quota);

  console.log(BOOK.id, picked.length, "词 | 最低分", picked.length ? score(picked[picked.length - 1]) : 0);
  if (!WRITE) return;

  const list = picked.map((item) => ({ word: item.word, pos: item.pos, meaning_zh: item.meaning_zh }));
  fs.writeFileSync(path.join(ROOT, "books", "import", "filtered", BOOK.id + ".json"), JSON.stringify(list, null, 2) + "\n");

  const files = [...new Set(picked.map((item) => "./books/prepared/" + item.file))].sort();
  const master = {
    id: BOOK.id,
    name: BOOK.name,
    intro: BOOK.intro,
    tiers: [{ id: 1, name: "核心词表", count: list.length }],
    declaredTotal: list.length,
    importedCount: list.length,
    entries: list.map((item, i) => ({ word: item.word, index: i + 1, tier: 1 }))
  };
  fs.writeFileSync(path.join(ROOT, "books", BOOK.id + ".json"), JSON.stringify(master, null, 2) + "\n");

  const manifestPath = path.join(ROOT, "books", "manifest.js");
  const text = fs.readFileSync(manifestPath, "utf8");
  const manifest = JSON.parse(text.slice(text.indexOf("=") + 1).replace(/;\s*$/, ""));
  manifest[BOOK.id] = files;
  const header = "/* 由 tools/build-library.js 生成：每本书引用哪些分片。不要手改。 */\nwindow.BOOK_MANIFEST = ";
  fs.writeFileSync(manifestPath, header + JSON.stringify(manifest, null, 2) + ";\n");
  console.log("主表", list.length, "词 | 引用分片", files.length, "| 已写入 manifest");
}

main();
