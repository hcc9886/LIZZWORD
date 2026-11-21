#!/usr/bin/env node
// 求某本词书还未收录的词：books/import/filtered/<书>.json 减去 books/prepared/<书>-*.json 已有词
// 用法：node tools/next-words.js ielts [20]
const fs = require("fs");
const path = require("path");

const book = process.argv[2];
const limit = Number(process.argv[3] || 20);
if (!book) {
  console.error("用法：node tools/next-words.js <书id> [词数]");
  process.exit(1);
}

const root = path.join(__dirname, "..");
const preparedDir = path.join(root, "books", "prepared");
const sourceFile = path.join(root, "books", "import", "filtered", book + ".json");

const have = new Set();
for (const f of fs.readdirSync(preparedDir)) {
  if (!f.startsWith(book + "-") || !f.endsWith(".json") || f.startsWith("_tmp_")) continue;
  let data;
  try { data = JSON.parse(fs.readFileSync(path.join(preparedDir, f), "utf8")); } catch (e) { continue; }
  for (const entry of Array.isArray(data) ? data : [data]) {
    if (entry && entry.word) have.add(entry.word.toLowerCase());
  }
}

const raw = JSON.parse(fs.readFileSync(sourceFile, "utf8"));
const words = (Array.isArray(raw) ? raw : raw.words || raw.entries || []).map(w => (typeof w === "string" ? w : w.word));
const missing = [];
const seen = new Set();
for (const w of words) {
  const key = String(w).toLowerCase();
  if (!key || seen.has(key)) continue;
  seen.add(key);
  if (!have.has(key)) missing.push(w);
}

console.log("源词", words.length, "| 本书已收录", have.size, "| 未收录", missing.length,
  "| 剩余批次", Math.ceil(missing.length / limit), "| 下一批", limit, "词：");
console.log(missing.slice(0, limit).join(", "));
