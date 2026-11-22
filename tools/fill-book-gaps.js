#!/usr/bin/env node
/**
 * LIZZWORD · 补齐词书主表覆盖
 *
 * 背景：共享分片按「选词配额」生成，部分源词表里的词（已存在深度词条）
 * 没被选进本书。这个脚本把这些词补进主表，并把它们所在的分片加进 manifest，
 * 保证「源词表里能查到词条的词，主表都能点到释义」。
 *
 * 用法：node tools/fill-book-gaps.js [--write]
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const BOOKS = path.join(ROOT, "books");
const WRITE = process.argv.includes("--write");

function scanCorpus() {
  const map = new Map();
  for (const file of fs.readdirSync(path.join(BOOKS, "prepared"))) {
    if (!/^[a-z0-9-]+?-(\d{4}|9\d{3})[a-z]?\.json$/.test(file)) continue;
    let data;
    try { data = JSON.parse(fs.readFileSync(path.join(BOOKS, "prepared", file), "utf8")); } catch (e) { continue; }
    for (const entry of Array.isArray(data) ? data : [data]) {
      if (!entry || !entry.word) continue;
      if (!Array.isArray(entry.senses) || !entry.senses.length) continue;
      const key = String(entry.word).toLowerCase();
      if (!map.has(key)) map.set(key, { file, entry });
    }
  }
  return map;
}

function loadManifest() {
  const text = fs.readFileSync(path.join(BOOKS, "manifest.js"), "utf8");
  return JSON.parse(text.slice(text.indexOf("=") + 1).replace(/;\s*$/, ""));
}

function writeManifest(manifest) {
  const header = "/* 由 tools/build-library.js 生成：每本书引用哪些分片。不要手改。 */\nwindow.BOOK_MANIFEST = ";
  fs.writeFileSync(path.join(BOOKS, "manifest.js"), header + JSON.stringify(manifest, null, 2) + ";\n");
}

function main() {
  const corpus = scanCorpus();
  const manifest = loadManifest();
  let added = 0;
  const stillMissing = [];

  for (const bookId of Object.keys(manifest)) {
    const sourcePath = path.join(BOOKS, "import", "filtered", bookId + ".json");
    const masterPath = path.join(BOOKS, bookId + ".json");
    if (!fs.existsSync(sourcePath) || !fs.existsSync(masterPath)) continue;
    const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
    const master = JSON.parse(fs.readFileSync(masterPath, "utf8"));
    const have = new Set(master.entries.map((entry) => String(entry.word).toLowerCase()));
    let touched = 0;

    for (const item of source) {
      const word = String(item.word || "").toLowerCase();
      if (!word || have.has(word)) continue;
      const hit = corpus.get(word);
      if (!hit) {
        stillMissing.push(bookId + ":" + word);
        continue;
      }
      const file = "./books/prepared/" + hit.file;
      if (manifest[bookId].indexOf(file) < 0) manifest[bookId].push(file);
      master.entries.push({ word: item.word, index: master.entries.length + 1, tier: 1 });
      have.add(word);
      touched += 1;
      added += 1;
    }

    if (touched) {
      master.declaredTotal = master.entries.length;
      master.importedCount = master.entries.length;
      if (Array.isArray(master.tiers) && master.tiers[0]) master.tiers[0].count = master.entries.length;
      manifest[bookId].sort();
      console.log(bookId.padEnd(15), "补进", touched, "词 → 主表", master.entries.length);
      if (WRITE) fs.writeFileSync(masterPath, JSON.stringify(master, null, 2) + "\n");
    }
  }

  console.log("合计补进", added, "词；仍无词条的源词", stillMissing.length);
  if (stillMissing.length) console.log("待写词条：", stillMissing.slice(0, 12).join(" "));
  if (WRITE) {
    writeManifest(manifest);
    console.log("manifest 已更新");
  }
}

main();
