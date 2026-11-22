#!/usr/bin/env node
/**
 * LIZZWORD · 全站健康检查
 * 一次跑完：注册表 / 分片 / 22 字段 / 主表覆盖 / 页面脚本语法 / 模块依赖 / 数据一致性
 * 用法：node tools/health-check.js [--json]
 */
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const Module = require("module");

const ROOT = path.resolve(__dirname, "..");
const JSON_OUT = process.argv.includes("--json");
const issues = [];
const notes = [];

function fail(area, message) { issues.push({ area, message }); }
function note(message) { notes.push(message); }

// ---------- 1. index.html 内联脚本语法 ----------
function checkInlineScripts() {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const blocks = html.match(/<script>[\s\S]*?<\/script>/g) || [];
  let bad = 0;
  blocks.forEach((block, i) => {
    try {
      new Function(block.replace(/<\/?script>/g, ""));
    } catch (err) {
      bad += 1;
      fail("index.html", `第 ${i + 1} 段内联脚本语法错误：${err.message}`);
    }
  });
  return { blocks: blocks.length, bad };
}

// ---------- 2. 外部 JS 模块语法 ----------
function checkModules() {
  const files = [];
  for (const dir of ["books/lizz", "books/lizz/games"]) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    for (const name of fs.readdirSync(abs)) {
      if (name.endsWith(".js")) files.push(path.join(dir, name));
    }
  }
  files.push("sw.js");
  let bad = 0;
  for (const rel of files) {
    const src = fs.readFileSync(path.join(ROOT, rel), "utf8");
    try {
      new Function(src);
    } catch (err) {
      bad += 1;
      fail("modules", `${rel} 语法错误：${err.message}`);
    }
  }
  return { files: files.length, bad };
}

// ---------- 3. sw.js 预缓存文件是否存在 ----------
function checkServiceWorker() {
  const src = fs.readFileSync(path.join(ROOT, "sw.js"), "utf8");
  const start = src.indexOf("SHELL_FILES = [");
  const end = src.indexOf("];", start);
  if (start < 0 || end < 0) { fail("sw", "找不到 SHELL_FILES"); return { missing: 1 }; }
  const body = src.slice(start, end);
  const list = body.match(/"[^"]+"/g) || body.match(/'[^']+'/g) || [];
  const missing = [];
  for (const raw of list) {
    const rel = raw.slice(1, -1);
    if (rel === "./" || rel.startsWith("http")) continue;
    if (!fs.existsSync(path.join(ROOT, rel.replace(/^\.\//, "")))) missing.push(rel);
  }
  if (missing.length) fail("sw", "预缓存文件缺失：" + missing.slice(0, 6).join(", "));
  return { listed: list.length, missing: missing.length };
}

// ---------- 4. 注册表与分片 ----------
function loadManifest() {
  const text = fs.readFileSync(path.join(ROOT, "books", "manifest.js"), "utf8");
  return JSON.parse(text.slice(text.indexOf("=") + 1).replace(/;\s*$/, ""));
}

function loadBooks() {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const start = html.indexOf("BOOKS = [");
  const end = html.indexOf("\n    ];", start);
  const manifest = loadManifest();
  return Function(
    "var BOOK_FALLBACK=null;var WORDS_FALLBACK={groups:[]};var window={BOOK_MANIFEST:" +
      JSON.stringify(manifest) + "};return " + html.slice(start + "BOOKS = ".length, end + 6) + ";"
  )();
}

function checkBooks() {
  const books = loadBooks();
  const preparedDir = path.join(ROOT, "books", "prepared");
  const report = [];
  for (const book of books) {
    const files = (book.preparedFiles || []).map((f) => path.basename(f));
    const missing = files.filter((f) => !fs.existsSync(path.join(preparedDir, f)));
    const masterPath = path.join(ROOT, "books", path.basename(book.bookFile || ""));
    if (!fs.existsSync(masterPath)) {
      if (book.custom) { report.push({ id: book.id, master: 0, files: files.length, missing: 0, custom: true }); continue; }
      fail("books", `${book.id} 主表不存在：${book.bookFile}`);
      continue;
    }
    const master = JSON.parse(fs.readFileSync(masterPath, "utf8"));
    const entries = (master.entries || []).map((e) => String(e.word).toLowerCase());
    const dup = entries.length - new Set(entries).size;
    if (dup) fail("books", `${book.id} 主表内部重复 ${dup} 个词`);
    if (missing.length) fail("books", `${book.id} 分片缺失 ${missing.length} 个`);

    const have = new Set();
    let nonArray = 0;
    let parseErr = 0;
    for (const file of files) {
      if (!fs.existsSync(path.join(preparedDir, file))) continue;
      let data;
      try { data = JSON.parse(fs.readFileSync(path.join(preparedDir, file), "utf8")); } catch (e) { parseErr += 1; continue; }
      if (!Array.isArray(data)) { nonArray += 1; data = [data]; }
      for (const entry of data) if (entry && entry.word) have.add(String(entry.word).toLowerCase());
    }
    const shallow = entries.filter((w) => !have.has(w));
    if (parseErr) fail("books", `${book.id} 分片解析失败 ${parseErr} 个`);
    if (nonArray) fail("books", `${book.id} 非数组分片 ${nonArray} 个`);
    report.push({ id: book.id, master: entries.length, files: files.length, missing: missing.length, shallow: shallow.length, dup });
  }
  return report;
}

// ---------- 5. 22 字段校验（全库抽样 + 全量） ----------
function checkEntryFields() {
  const src = fs.readFileSync(path.join(ROOT, "tools", "check-entry.js"), "utf8").replace(/\nmain\(\);\s*$/, "\nmodule.exports={checkEntry};");
  const mod = new Module(path.join(ROOT, "tools", "check-entry.js"));
  mod.filename = path.join(ROOT, "tools", "check-entry.js");
  mod.paths = Module._nodeModulePaths(path.join(ROOT, "tools"));
  mod._compile(src, mod.filename);
  const { checkEntry } = mod.exports;

  const TOP = ["word", "ipa_uk", "ipa_us", "definition_zh", "definition_en", "core_image", "scene", "sceneCN", "pos", "collocations", "forms", "derivatives", "senses", "etymology", "similar", "mnemonics", "examples", "dict_mnemonic", "root", "sensesIntro", "semanticMap", "affixes"];
  const preparedDir = path.join(ROOT, "books", "prepared");
  const seen = new Set();
  let total = 0;
  let errors = 0;
  let warnings = 0;
  const errorSamples = [];

  for (const file of fs.readdirSync(preparedDir)) {
    if (!/^[a-z0-9-]+?-(\d{4}|9\d{3})[a-z]?\.json$/.test(file)) continue;
    let data;
    try { data = JSON.parse(fs.readFileSync(path.join(preparedDir, file), "utf8")); } catch (e) { continue; }
    for (const entry of Array.isArray(data) ? data : [data]) {
      if (!entry || !entry.word) continue;
      const key = String(entry.word).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      if (!Array.isArray(entry.senses) || !entry.senses.length) continue;
      total += 1;
      const keys = Object.keys(entry);
      if (keys.length !== TOP.length || keys.some((k, i) => k !== TOP[i])) {
        errors += 1;
        if (errorSamples.length < 10) errorSamples.push(`${entry.word} 键数量/顺序不符（${keys.length}）`);
        continue;
      }
      const ctx = { forms: [entry.word].concat((entry.forms || []).map((f) => f.form)).filter(Boolean) };
      const out = checkEntry(entry, ctx);
      if (out.errors.length) {
        errors += 1;
        if (errorSamples.length < 10) errorSamples.push(`${entry.word}: ${out.errors[0].message.slice(0, 50)}`);
      }
      warnings += out.warnings.length;
    }
  }
  if (errors) fail("entries", `22 字段不合格词条 ${errors} 条（样例：${errorSamples.slice(0, 3).join("；")}）`);
  note(`22 字段词条 ${total} 条，字段错误 ${errors} 条，风格警告 ${warnings} 条`);
  return { total, errors, warnings };
}

// ---------- 6. 关键函数引用完整性 ----------
function checkReferences() {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const fnDefs = new Set();
  const reDef = /function\s+([A-Za-z_$][\w$]*)\s*\(/g;
  let m;
  while ((m = reDef.exec(html))) fnDefs.add(m[1]);

  const called = new Set();
  const reCall = /\b([A-Za-z_$][\w$]*)\s*\(/g;
  while ((m = reCall.exec(html))) called.add(m[1]);
  const builtin = new Set(["if", "for", "while", "switch", "catch", "function", "return", "typeof", "new", "Object", "Array", "String", "Number", "Boolean", "Math", "JSON", "Date", "Set", "Map", "Promise", "RegExp", "Error", "parseInt", "parseFloat", "isNaN", "encodeURIComponent", "decodeURIComponent", "setTimeout", "clearTimeout", "setInterval", "clearInterval", "requestIdleCallback", "fetch", "alert", "confirm", "Element", "Event", "Function", "Symbol", "WeakMap", "Uint8Array", "Intl", "require", "eval"]);
  const missing = [];
  for (const name of called) {
    if (fnDefs.has(name) || builtin.has(name)) continue;
    // 允许 var/let 函数表达式、外部模块函数
    if (new RegExp("(var|let|const)\\s+" + name + "\\s*=").test(html)) continue;
    missing.push(name);
  }
  // 外部模块（window.*）调用不算缺失
  const realMissing = missing.filter((name) => !/^(LZ|LIZZWORD|speakBtn)/.test(name));
  if (realMissing.length) note("可能未定义的调用：" + realMissing.slice(0, 20).join(", "));
  return { defined: fnDefs.size, missing: realMissing.length };
}

// ---------- 7. 数据一致性 ----------
function checkDataConsistency() {
  const keys = ["lizzword_profile_v1", "lizzword_speech_v1", "lizzword_events_v1", "lizzword_wrong_v1", "lizzword_layout_v1", "lizzword_plan_v1", "lizzword_mybook_v1", "lizzword_onboard_seen", "lizzword_free_book_v1"];
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const missing = keys.filter((key) => !html.includes(key) && !fs.readFileSync(path.join(ROOT, "books", "lizz", "entitlements.js"), "utf8").includes(key));
  if (missing.length) note("存储键未在代码中出现：" + missing.join(", "));
  return { keys: keys.length, missing: missing.length };
}

function main() {
  const inline = checkInlineScripts();
  const modules = checkModules();
  const sw = checkServiceWorker();
  const books = checkBooks();
  const entries = checkEntryFields();
  const refs = checkReferences();
  const data = checkDataConsistency();

  const totalWords = books.reduce((sum, b) => sum + (b.master || 0), 0);
  const shallow = books.reduce((sum, b) => sum + (b.shallow || 0), 0);

  if (JSON_OUT) {
    console.log(JSON.stringify({ inline, modules, sw, books, entries, refs, data, issues, notes }, null, 2));
  } else {
    console.log("=== LIZZWORD 健康检查 ===");
    console.log(`内联脚本 ${inline.blocks} 段，语法错误 ${inline.bad}`);
    console.log(`外部模块 ${modules.files} 个，语法错误 ${modules.bad}`);
    console.log(`Service Worker 预缓存 ${sw.listed} 项，缺失 ${sw.missing}`);
    console.log(`词书 ${books.length} 本，主表合计 ${totalWords} 词，主表缺释义 ${shallow} 个`);
    console.log(`22 字段词条 ${entries.total} 条，字段错误 ${entries.errors}，风格警告 ${entries.warnings}`);
    console.log(`函数定义 ${refs.defined} 个，疑似缺失引用 ${refs.missing}`);
    for (const n of notes) console.log("· " + n);
    if (issues.length) {
      console.log("\n发现 " + issues.length + " 个问题：");
      for (const item of issues) console.log(`  [${item.area}] ${item.message}`);
    } else {
      console.log("\n全部通过，没有发现错误。");
    }
  }
  process.exitCode = issues.length ? 1 : 0;
}

main();
