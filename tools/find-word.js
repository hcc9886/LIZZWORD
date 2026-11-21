#!/usr/bin/env node
// 复用检索：给出若干单词，列出全库哪个分片已有该词的深度词条（词条必须含 senses）
// 用法：node tools/find-word.js enrich enroll entity
//      node tools/find-word.js --file /tmp/words.json   （文件为单词数组或逗号分隔）
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const preparedDir = path.join(root, "books", "prepared");

let args = process.argv.slice(2);
let words = [];
if (args[0] === "--file") {
  const raw = fs.readFileSync(args[1], "utf8").trim();
  try { words = JSON.parse(raw); } catch (e) { words = raw.split(/[\s,]+/); }
} else {
  words = args;
}
words = words.map(w => String(typeof w === "string" ? w : (w && w.word) || "").toLowerCase()).filter(Boolean);

const index = new Map();
for (const f of fs.readdirSync(preparedDir)) {
  if (!f.endsWith(".json") || f.startsWith("_tmp_")) continue;
  let data;
  try { data = JSON.parse(fs.readFileSync(path.join(preparedDir, f), "utf8")); } catch (e) { continue; }
  for (const entry of Array.isArray(data) ? data : [data]) {
    if (!entry || !entry.word) continue;
    const key = entry.word.toLowerCase();
    if (!index.has(key)) index.set(key, []);
    index.get(key).push({ file: f, deep: Array.isArray(entry.senses) && entry.senses.length > 0 });
  }
}

let reusable = 0, fresh = 0;
for (const w of words) {
  const hits = (index.get(w) || []).filter(h => h.deep);
  if (hits.length) { reusable++; console.log("可复用", w, "←", hits.map(h => h.file).join(" ")); }
  else { fresh++; console.log("需新撰", w); }
}
console.log("--- 共", words.length, "词：可复用", reusable, "需新撰", fresh);
