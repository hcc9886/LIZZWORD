#!/usr/bin/env node
/**
 * 给 manifest 里每个分片算 hash，生成 books/manifest-hashes.json，
 * 供 App 做增量更新（客户端只重下 hash 变了的文件）。
 */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const ROOT = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "books", "manifest.js"), "utf8").slice(String(fs.readFileSync(path.join(ROOT, "books", "manifest.js"), "utf8")).indexOf("=") + 1).replace(/;\s*$/, ""));
const files = new Set();
for (const list of Object.values(manifest)) for (const file of list) files.add(file.replace(/^\.\//, ""));
const out = { generatedAt: new Date().toISOString(), files: {} };
for (const file of [...files].sort()) {
  const abs = path.join(ROOT, file);
  if (!fs.existsSync(abs)) continue;
  const buf = fs.readFileSync(abs);
  out.files[file] = { size: buf.length, sha1: crypto.createHash("sha1").update(buf).digest("hex") };
}
fs.writeFileSync(path.join(ROOT, "books", "manifest-hashes.json"), JSON.stringify(out, null, 2) + "\n");
console.log("已写 books/manifest-hashes.json，文件", Object.keys(out.files).length, "个");
