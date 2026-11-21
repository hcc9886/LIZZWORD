#!/usr/bin/env node
// 由 books/prepared/<书>-*.json 生成词书总表 books/<书>.json（前端 bookFile）
// 只收录「本书分片里已有深度词条」的词：主表列出的每个词都能立即出释义，
// 未撰写的词等批次补上后再进表，避免用户点进去看到空白释义卡。
// 已有主表的 name/intro 会保留，只重算 entries/计数；要改文案用 --name/--intro。
// 用法：node tools/make-book-master.js ielts
const fs = require("fs");
const path = require("path");

const book = process.argv[2];
if (!book) {
  console.error("用法：node tools/make-book-master.js <书id> [--name 名称] [--intro 简介] [--tier 层级名] [--source-order]");
  process.exit(1);
}
const hasFlag = (name) => process.argv.indexOf("--" + name) > 0;
const arg = (name) => {
  const i = process.argv.indexOf("--" + name);
  return i > 0 ? process.argv[i + 1] : null;
};

const root = path.join(__dirname, "..");
const preparedDir = path.join(root, "books", "prepared");
const sourceFile = path.join(root, "books", "import", "filtered", book + ".json");
const target = path.join(root, "books", book + ".json");

// 本书分片里的深度词条（必须带 senses，否则前端点不出释义）
const covered = new Map();
for (const f of fs.readdirSync(preparedDir)) {
  if (!f.startsWith(book + "-") || !f.endsWith(".json") || f.startsWith("_tmp_")) continue;
  let data;
  try { data = JSON.parse(fs.readFileSync(path.join(preparedDir, f), "utf8")); } catch (e) { continue; }
  if (!Array.isArray(data)) { console.error("跳过非数组分片：", f); continue; }
  for (const entry of data) {
    if (entry && entry.word && Array.isArray(entry.senses) && entry.senses.length) {
      covered.set(entry.word.toLowerCase(), f);
    }
  }
}

// 词序：默认按源词表顺序（源表没有的按字典序补在后面），--source-order 关闭源表排序
let words = [...covered.keys()];
if (!hasFlag("no-source-order") && fs.existsSync(sourceFile)) {
  const raw = JSON.parse(fs.readFileSync(sourceFile, "utf8"));
  const source = (Array.isArray(raw) ? raw : raw.words || raw.entries || []).map(w => (typeof w === "string" ? w : w.word).toLowerCase());
  words = source.filter(w => covered.has(w)).concat(words.filter(w => !source.includes(w)).sort());
} else {
  words.sort();
}

const seen = new Set();
words = words.filter(w => !seen.has(w) && seen.add(w));

const prev = fs.existsSync(target) ? JSON.parse(fs.readFileSync(target, "utf8")) : null;
const tierName = arg("tier") || (prev && prev.tiers && prev.tiers[0] && prev.tiers[0].name) || "核心词表";
const out = {
  id: book,
  name: arg("name") || (prev && prev.name) || book,
  intro: arg("intro") || (prev && prev.intro) || (tierName + " " + words.length + " 词，每词均为 22 键深度词条。"),
  tiers: [{ id: 1, name: tierName, count: words.length }],
  declaredTotal: words.length,
  importedCount: words.length,
  entries: words.map((w, i) => ({ word: w, index: i + 1, tier: 1 }))
};

fs.writeFileSync(target, JSON.stringify(out, null, 2) + "\n");
console.log("已写入", path.relative(root, target), "| 词条", out.entries.length, "| 分片覆盖", covered.size);
