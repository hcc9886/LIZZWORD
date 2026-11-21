#!/usr/bin/env node
/**
 * LIZZWORD · 把新写好的深度词条装进「共享分片」词书
 *
 * 共享分片词书（如 medical / business-law）的主表只收录已有词条的词；
 * 新写的领域词条需要：写一个专属分片 → 登记进 manifest → 追加到主表。
 *
 * 用法：
 *   node tools/add-domain-shard.js medical /tmp/n-hypertension.json /tmp/n-diabetes.json ...
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const BOOKS_DIR = path.join(ROOT, "books");
const PREPARED = path.join(BOOKS_DIR, "prepared");

const bookId = process.argv[2];
const files = process.argv.slice(3);
if (!bookId || !files.length) {
  console.error("用法：node tools/add-domain-shard.js <书id> <词条json...>");
  process.exit(1);
}

const entries = files.map((file) => JSON.parse(fs.readFileSync(file, "utf8")));
for (const entry of entries) {
  if (!entry || !entry.word) throw new Error("词条缺少 word：" + JSON.stringify(entry).slice(0, 60));
}

// 专属分片从 9001 开始，避免和已有编号冲突
let index = 9001;
for (;;) {
  const name = bookId + "-" + String(index).padStart(4, "0") + ".json";
  if (!fs.existsSync(path.join(PREPARED, name))) {
    fs.writeFileSync(path.join(PREPARED, name), JSON.stringify(entries, null, 2) + "\n");
    var shardFile = "./books/prepared/" + name;
    console.log("写入分片", shardFile, "词条", entries.length);
    break;
  }
  index += 1;
}

const manifestPath = path.join(BOOKS_DIR, "manifest.js");
const manifestText = fs.readFileSync(manifestPath, "utf8");
const manifest = JSON.parse(manifestText.slice(manifestText.indexOf("=") + 1).replace(/;\s*$/, ""));
if (!manifest[bookId]) throw new Error("manifest 里没有这本书：" + bookId);
if (manifest[bookId].indexOf(shardFile) < 0) manifest[bookId].push(shardFile);
manifest[bookId].sort();

const masterPath = path.join(BOOKS_DIR, bookId + ".json");
const master = JSON.parse(fs.readFileSync(masterPath, "utf8"));
const have = new Set(master.entries.map((entry) => String(entry.word).toLowerCase()));
let added = 0;
for (const entry of entries) {
  const key = String(entry.word).toLowerCase();
  if (have.has(key)) continue;
  have.add(key);
  master.entries.push({ word: entry.word, index: master.entries.length + 1, tier: 1 });
  added += 1;
}
master.declaredTotal = master.entries.length;
master.importedCount = master.entries.length;
if (Array.isArray(master.tiers) && master.tiers[0]) master.tiers[0].count = master.entries.length;

fs.writeFileSync(masterPath, JSON.stringify(master, null, 2) + "\n");
const header = "/* 由 tools/build-library.js 生成：每本书引用哪些分片。不要手改。 */\nwindow.BOOK_MANIFEST = ";
fs.writeFileSync(manifestPath, header + JSON.stringify(manifest, null, 2) + ";\n");
console.log("主表新增", added, "词，现共", master.entries.length, "词");
