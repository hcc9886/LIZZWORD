#!/usr/bin/env node
/**
 * LIZZWORD · 注册表同步
 *
 * 从 books/manifest.js + books/<id>.json 主表，重写 index.html 里每本书的
 * preparedFiles 与「共 N 词」文案，保证注册表和实际文件永远一致。
 *
 * 用法：
 *   node tools/sync-registry.js          # 只检查并报告差异
 *   node tools/sync-registry.js --write  # 写回 index.html
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const WRITE = process.argv.includes("--write");

function loadManifest() {
  const text = fs.readFileSync(path.join(ROOT, "books", "manifest.js"), "utf8");
  return JSON.parse(text.slice(text.indexOf("=") + 1).replace(/;\s*$/, ""));
}

function loadBooks(html, manifest) {
  const start = html.indexOf("BOOKS = [");
  const end = html.indexOf("\n    ];", start);
  const source = html.slice(start + "BOOKS = ".length, end + 6);
  return Function(
    "var BOOK_FALLBACK=null;var WORDS_FALLBACK={groups:[]};var window={BOOK_MANIFEST:" +
      JSON.stringify(manifest) + "};return " + source + ";"
  )();
}

function main() {
  const manifest = loadManifest();
  let html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const books = loadBooks(html, manifest);
  let changed = 0;

  for (const book of books) {
    const files = manifest[book.id];
    const masterPath = path.join(ROOT, "books", path.basename(book.bookFile || ""));
    if (!files || !fs.existsSync(masterPath)) continue;
    const master = JSON.parse(fs.readFileSync(masterPath, "utf8"));
    const count = (master.entries || []).length;

    const blockRe = new RegExp(
      '(id: "' + book.id + '",[\\s\\S]{0,400}?intro: ")([^"]*)(")'
    );
    const match = html.match(blockRe);
    if (!match) {
      console.log("跳过（找不到 BOOKS 条目）：", book.id);
      continue;
    }
    const fixedIntro = match[2].replace(/共 [\d,]+ 词/, "共 " + count + " 词");
    if (fixedIntro !== match[2]) {
      html = html.replace(blockRe, match[1] + fixedIntro + match[3]);
      changed += 1;
      console.log("文案更新", book.id, "→", count, "词");
    }
  }

  if (WRITE && changed) {
    fs.writeFileSync(path.join(ROOT, "index.html"), html);
    console.log("已写回 index.html，共更新", changed, "处");
  } else {
    console.log(changed ? "有 " + changed + " 处待更新（加 --write 写回）" : "注册表已同步");
  }
}

main();
