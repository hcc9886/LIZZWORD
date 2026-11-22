#!/usr/bin/env node
/**
 * LIZZWORD · 跨书复用装片
 *
 * 把「源词表里有、本书还没有、但全库已有 22 字段词条」的词，整条复用进本书。
 * 复用前先修历史缺陷（S1→01、词形去中文、场景补中文铺垫、标签小写等），
 * 修完仍不达标的词跳过，绝不引入不合格词条。
 *
 * 用法：node tools/reuse-to-book.js ielts [--write]
 */
"use strict";

const fs = require("fs");
const path = require("path");
const Module = require("module");

const ROOT = path.resolve(__dirname, "..");
const BOOK = process.argv[2] || "ielts";
const WRITE = process.argv.includes("--write");

const checker = (() => {
  const src = fs.readFileSync(path.join(__dirname, "check-entry.js"), "utf8").replace(/\nmain\(\);\s*$/, "\nmodule.exports={checkEntry};");
  const mod = new Module(path.join(__dirname, "check-entry.js"));
  mod.filename = path.join(__dirname, "check-entry.js");
  mod.paths = Module._nodeModulePaths(__dirname);
  mod._compile(src, mod.filename);
  return mod.exports.checkEntry;
})();

const CJK = /[\u3400-\u9FFF\uF900-\uFAFF]/g;

function loadCorpus() {
  const map = new Map();
  const dir = path.join(ROOT, "books", "prepared");
  for (const file of fs.readdirSync(dir)) {
    if (!/^[a-z0-9-]+?-(\d{4}|9\d{3})[a-z]?\.json$/.test(file)) continue;
    let data;
    try { data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")); } catch (e) { continue; }
    for (const entry of Array.isArray(data) ? data : [data]) {
      if (!entry || !entry.word) continue;
      if (!Array.isArray(entry.senses) || !entry.senses.length) continue;
      const key = String(entry.word).toLowerCase();
      if (!map.has(key)) map.set(key, entry);
    }
  }
  return map;
}

function normalize(raw) {
  const entry = JSON.parse(JSON.stringify(raw));
  const word = String(entry.word || "").toLowerCase();
  if (entry.semanticMap && Array.isArray(entry.semanticMap.branches)) {
    for (const b of entry.semanticMap.branches) if (typeof b.senses === "string") b.senses = b.senses.replace(/S(\d+)/g, (m, n) => String(n).padStart(2, "0"));
  }
  if (entry.semanticMap && Array.isArray(entry.semanticMap.chain)) {
    entry.semanticMap.chain = entry.semanticMap.chain.map((x) => String(x).toUpperCase().replace(/[=:]/g, " ").replace(/\s+/g, " ").trim());
  }
  if (entry.etymology && Array.isArray(entry.etymology.items)) for (const it of entry.etymology.items) if (typeof it.era === "string") it.era = it.era.toUpperCase();
  if (Array.isArray(entry.forms)) {
    const seen = new Set();
    const kept = [];
    for (const it of entry.forms) {
      if (!it || typeof it.form !== "string") continue;
      const form = it.form.replace(CJK, "").trim();
      if (!form || seen.has(form.toLowerCase())) continue;
      seen.add(form.toLowerCase());
      it.form = form;
      kept.push(it);
    }
    entry.forms = kept.length ? kept : [{ label: "词形", form: entry.word }];
  }
  if (typeof entry.scene === "string" && entry.scene.trim()) {
    const idx = entry.scene.search(/[A-Za-z]/);
    const preamble = idx >= 0 ? entry.scene.slice(0, idx) : entry.scene;
    if (!/[\u3400-\u9FFF]/.test(preamble)) {
      const meaning = String(entry.definition_zh || "").split(/[；;]/)[0].replace(/[A-Za-z][A-Za-z\u2019.' -]*/g, "").replace(/[（(）)]/g, "").trim() || "该词";
      const english = idx >= 0 ? entry.scene.slice(idx).replace(CJK, "").replace(/\s+/g, " ").trim() : "";
      entry.scene = ("这里指「" + meaning + "」。" + preamble.trim() + " " + english).trim();
    }
  }
  if (typeof entry.sceneCN === "string" && !/第\s*\d+\s*个义项/.test(entry.sceneCN)) {
    entry.sceneCN = "这里指第 1 个义项。" + entry.sceneCN;
  }
  if (entry.similar && Array.isArray(entry.similar.groups)) {
    const groups = [];
    for (const g of entry.similar.groups) {
      if (!g || !Array.isArray(g.entries)) continue;
      const seen = new Set();
      const kept = g.entries.filter((it) => {
        if (!it || typeof it.word !== "string") return false;
        const key = it.word.toLowerCase();
        if (key === word || seen.has(key)) return false;
        if (typeof it.tag === "string") {
          const cleaned = it.tag.replace(CJK, " ").replace(/[^a-z -]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
          it.tag = cleaned ? cleaned.slice(0, 34) : "related";
        }
        seen.add(key);
        return true;
      });
      if (kept.length >= 2) groups.push(Object.assign({}, g, { entries: kept }));
    }
    if (groups.length) entry.similar.groups = groups;
  }
  if (Array.isArray(entry.derivatives)) {
    const kept = entry.derivatives.filter((it) => it && String(it.word || "").toLowerCase() !== word);
    if (kept.length >= 2) entry.derivatives = kept;
  }
  return entry;
}

function main() {
  const corpus = loadCorpus();
  const sourcePath = path.join(ROOT, "books", "import", "filtered", BOOK + ".json");
  const source = JSON.parse(fs.readFileSync(sourcePath, "utf8")).map((x) => String(x.word || x).toLowerCase());
  const masterPath = path.join(ROOT, "books", BOOK + ".json");
  const master = JSON.parse(fs.readFileSync(masterPath, "utf8"));
  const have = new Set(master.entries.map((e) => String(e.word).toLowerCase()));

  const reusable = [];
  const rejected = [];
  for (const word of source) {
    if (have.has(word)) continue;
    const hit = corpus.get(word);
    if (!hit) continue;
    const candidate = normalize(hit);
    const ctx = { forms: [candidate.word].concat((candidate.forms || []).map((f) => f.form)).filter(Boolean) };
    const report = checker(candidate, ctx);
    if (report.errors.length) { rejected.push(word + " (" + report.errors[0].message.slice(0, 30) + ")"); continue; }
    reusable.push(candidate);
  }

  console.log("可复用", reusable.length, "| 剔除", rejected.length);
  if (rejected.length) console.log("剔除样例：", rejected.slice(0, 6).join("；"));
  if (!WRITE || !reusable.length) return;

  // 每 20 词写一片，编号从 2001 起，避免与现有批次冲突
  let shard = 2001;
  const preparedDir = path.join(ROOT, "books", "prepared");
  const manifestPath = path.join(ROOT, "books", "manifest.js");
  const manifestText = fs.readFileSync(manifestPath, "utf8");
  const manifest = JSON.parse(manifestText.slice(manifestText.indexOf("=") + 1).replace(/;\s*$/, ""));
  const files = [];
  for (let i = 0; i < reusable.length; i += 20) {
    const name = BOOK + "-" + String(shard).padStart(4, "0") + ".json";
    fs.writeFileSync(path.join(preparedDir, name), JSON.stringify(reusable.slice(i, i + 20), null, 2) + "\n");
    files.push("./books/prepared/" + name);
    shard += 1;
  }
  console.log("写入复用分片", files.length, "个");

  // 主表按源词表顺序重排：已有词条的词全部收录
  const covered = new Set(reusable.map((e) => String(e.word).toLowerCase()));
  const ordered = [];
  for (const word of source) if (have.has(word) || covered.has(word)) ordered.push(word);
  const entries = ordered.map((word, i) => ({ word, index: i + 1, tier: 1 }));
  master.entries = entries;
  master.declaredTotal = entries.length;
  master.importedCount = entries.length;
  if (Array.isArray(master.tiers) && master.tiers[0]) master.tiers[0].count = entries.length;
  fs.writeFileSync(masterPath, JSON.stringify(master, null, 2) + "\n");
  console.log("主表现有", entries.length, "词");
}

main();
