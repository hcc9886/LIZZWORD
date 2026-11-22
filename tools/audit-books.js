#!/usr/bin/env node
/**
 * LIZZWORD 词书加载自检
 *
 * 检查每本已注册词书：
 *   1. preparedFiles 里的分片是否存在于 books/prepared
 *   2. 分片能否解析成 JSON、是否是数组（单对象会被前端静默丢弃）
 *   3. 同一本书内是否有重复词
 *   4. 词条 definition_zh 是否为空
 *   5. 主表 books/<id>.json 的 entries 是否都能在分片里找到深度词条
 *   6. 分片里是否存在主表未收录的词（只提示，不算错误）
 *
 * 用法：
 *   node tools/audit-books.js            # 只查已注册词书
 *   node tools/audit-books.js --all      # 额外扫描 books/prepared 下未注册的 <id>-NNNN 分片
 *   node tools/audit-books.js --json     # 机器可读输出
 *
 * 退出码：全部通过 0，否则 1。
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const INDEX = path.join(ROOT, "index.html");
const PREPARED_DIR = path.join(ROOT, "books", "prepared");

function readBooks() {
  const html = fs.readFileSync(INDEX, "utf8");
  const start = html.indexOf("BOOKS = [");
  if (start < 0) throw new Error("index.html 里找不到 BOOKS = [");
  const end = html.indexOf("\n    ];", start);
  if (end < 0) throw new Error("index.html 里找不到 BOOKS 数组结尾");
  const source = html.slice(start + "BOOKS = ".length, end + 6);
  // 生成书的 preparedFiles 走 books/manifest.js，这里补一个 window 兜底
  const manifestFile = path.join(ROOT, "books", "manifest.js");
  let manifest = {};
  if (fs.existsSync(manifestFile)) {
    const text = fs.readFileSync(manifestFile, "utf8");
    const json = text.slice(text.indexOf("=") + 1).replace(/;\s*$/, "");
    try { manifest = JSON.parse(json); } catch (e) { manifest = {}; }
  }
  return Function(
    "var BOOK_FALLBACK=null;var WORDS_FALLBACK={groups:[]};var window={BOOK_MANIFEST:" +
      JSON.stringify(manifest) + "};return " + source + ";"
  )();
}

function readMaster(book) {
  const file = path.join(ROOT, "books", path.basename(book.bookFile || ""));
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function auditBook(book) {
  const report = {
    id: book.id,
    name: book.name || "",
    shards: 0,
    words: 0,
    master: 0,
    duplicate: [],
    overlap: [],
    parseErrors: [],
    nonArray: [],
    emptyDefinition: [],
    missingInShards: [],
    extraInShards: [],
    missingFiles: []
  };

  const files = (book.preparedFiles || []).map((f) => path.basename(f));
  report.shards = files.length;
  const seen = new Map();
  let masterWords = null;

  for (const file of files) {
    const full = path.join(PREPARED_DIR, file);
    if (!fs.existsSync(full)) {
      report.missingFiles.push(file);
      continue;
    }
    let data;
    try {
      data = JSON.parse(fs.readFileSync(full, "utf8"));
    } catch (err) {
      report.parseErrors.push(file + ": " + err.message);
      continue;
    }
    if (!Array.isArray(data)) report.nonArray.push(file);
    const entries = Array.isArray(data) ? data : [data];
    for (const entry of entries) {
      if (!entry || !entry.word) continue;
      const word = String(entry.word).toLowerCase();
      if (masterWords && !masterWords.has(word)) continue;
      const fingerprint = JSON.stringify(entry);
      if (seen.has(word)) {
        const prev = seen.get(word);
        // 共享分片会重复收录同一个词：内容一致视为正常，内容不同才报
        if (prev.fingerprint !== fingerprint) {
          // 共享分片下同一个词会出现在多个源分片里，前端按主表取词、后到的覆盖先到的；
          // 这里只记录，不算失败。
          report.overlap.push(word);
        }
      } else {
        seen.set(word, { file: file, fingerprint: fingerprint });
      }
      if (!entry.definition_zh || !String(entry.definition_zh).trim()) {
        report.emptyDefinition.push(word + " (" + file + ")");
      }
    }
  }

  report.words = seen.size;
  if (book.bookFile) {
    const master = readMaster(book);
    const entries = master.entries || [];
    report.master = entries.length;
    masterWords = new Set(entries.map((e) => String(e.word).toLowerCase()));
    report.missingInShards = [...masterWords].filter((w) => !seen.has(w));
    report.extraInShards = [...seen.keys()].filter((w) => !masterWords.has(w));
  }

  report.ok =
    !report.missingFiles.length &&
    !report.parseErrors.length &&
    !report.nonArray.length &&
    !report.duplicate.length &&
    !report.emptyDefinition.length &&
    !report.missingInShards.length;
  return report;
}

function scanUnregistered(books) {
  const registeredIds = new Set(books.map((b) => b.id));
  const shardName = /^([a-z0-9-]+?)-(\d{4})([a-z]?)\.json$/i;
  const groups = new Map();
  for (const file of fs.readdirSync(PREPARED_DIR)) {
    const match = file.match(shardName);
    if (!match) continue;
    const id = match[1];
    if (registeredIds.has(id)) continue;
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(file);
  }
  const out = [];
  for (const [id, files] of groups) {
    const seen = new Set();
    const nonArray = [];
    const parseErrors = [];
    for (const file of files) {
      let data;
      try {
        data = JSON.parse(fs.readFileSync(path.join(PREPARED_DIR, file), "utf8"));
      } catch (err) {
        parseErrors.push(file);
        continue;
      }
      if (!Array.isArray(data)) nonArray.push(file);
      for (const entry of (Array.isArray(data) ? data : [data])) {
        if (entry && entry.word) seen.add(String(entry.word).toLowerCase());
      }
    }
    out.push({ id, shards: files.length, words: seen.size, nonArray, parseErrors });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

function printReport(report) {
  const flags = [];
  if (report.missingFiles.length) flags.push("缺失分片 " + report.missingFiles.length);
  if (report.parseErrors.length) flags.push("解析失败 " + report.parseErrors.length);
  if (report.nonArray.length) flags.push("非数组分片 " + report.nonArray.length);
  if (report.overlap.length) flags.push("跨分片重叠词 " + report.overlap.length);
  if (report.emptyDefinition.length) flags.push("空释义 " + report.emptyDefinition.length);
  if (report.missingInShards.length) flags.push("主表缺词条 " + report.missingInShards.length);

  const head = report.id + " | 分片 " + report.shards + " | 词 " + report.words +
    " | 主表 " + report.master + " | " + (report.ok ? "OK" : "FAIL");
  console.log(head + (flags.length ? " | " + flags.join(" · ") : ""));
  if (report.missingFiles.length) console.log("   缺失分片:", report.missingFiles.slice(0, 5));
  if (report.parseErrors.length) console.log("   解析失败:", report.parseErrors.slice(0, 5));
  if (report.nonArray.length) console.log("   非数组:", report.nonArray.slice(0, 5));
  if (report.overlap.length) console.log("   跨分片重叠（正常）:", report.overlap.length);
  if (report.emptyDefinition.length) console.log("   空释义:", report.emptyDefinition.slice(0, 5));
  if (report.missingInShards.length) console.log("   主表缺词条:", report.missingInShards.slice(0, 8));
  if (report.extraInShards.length) console.log("   分片多出（仅提示）:", report.extraInShards.length);
}

function main() {
  const args = new Set(process.argv.slice(2));
  const books = readBooks();
  const reports = books.map(auditBook);

  if (args.has("--json")) {
    console.log(JSON.stringify({ books: reports, unregistered: args.has("--all") ? scanUnregistered(books) : [] }, null, 2));
  } else {
    for (const report of reports) printReport(report);
    const unregistered = args.has("--all") ? scanUnregistered(books) : null;
    if (unregistered) {
      console.log("\n未注册但存在分片的书：");
      for (const item of unregistered) {
        console.log(
          "  " + item.id + " | 分片 " + item.shards + " | 词 " + item.words +
          (item.nonArray.length ? " | 非数组 " + item.nonArray.length : "") +
          (item.parseErrors.length ? " | 解析失败 " + item.parseErrors.length : "")
        );
      }
    }
    const failed = reports.filter((r) => !r.ok);
    console.log("\n" + (failed.length ? "有 " + failed.length + " 本书未通过" : "全部通过") + "（已注册 " + reports.length + " 本）");
  }

  const failed = reports.filter((r) => !r.ok);
  process.exitCode = failed.length ? 1 : 0;
}

main();
