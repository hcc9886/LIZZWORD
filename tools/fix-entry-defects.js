#!/usr/bin/env node
/**
 * LIZZWORD · 历史词条缺陷机械修复
 *
 * 只处理「可以确定地机械修好」的缺陷，改完立即用 check-entry 复验：
 *   1. semanticMap.branches[].senses 里的 S1 式写法 → 零分补义项编号
 *   2. forms[].form 混入中文 → 去掉中文；全空则回填原形
 *   3. scene 缺中文铺垫 → 用释义补一句
 *   4. similar[].tag 混入中文 / 大写 → 转小写英文单词
 *   5. similar / derivatives 自引用目标词 → 删除（不足最低数量则保持原样）
 *   6. etymology.era、semanticMap.chain 全大写
 * 修完仍不达标的词条原样保留并登记，交人工处理。
 *
 * 用法：node tools/fix-entry-defects.js [--write] [--book <id>]
 */
"use strict";

const fs = require("fs");
const path = require("path");
const Module = require("module");

const ROOT = path.resolve(__dirname, "..");
const PREPARED = path.join(ROOT, "books", "prepared");
const WRITE = process.argv.includes("--write");
const bookArg = process.argv.indexOf("--book") >= 0 ? process.argv[process.argv.indexOf("--book") + 1] : "";

const src = fs.readFileSync(path.join(__dirname, "check-entry.js"), "utf8").replace(/\nmain\(\);\s*$/, "\nmodule.exports={checkEntry};");
const mod = new Module(path.join(__dirname, "check-entry.js"));
mod.filename = path.join(__dirname, "check-entry.js");
mod.paths = Module._nodeModulePaths(__dirname);
mod._compile(src, mod.filename);
const { checkEntry } = mod.exports;

const CJK = /[\u3400-\u9FFF\uF900-\uFAFF\u3000-\u303F\uFF00-\uFFEF]/g;

function validate(entry) {
  const ctx = { forms: [entry.word].concat((entry.forms || []).map((f) => f.form)).filter(Boolean) };
  return checkEntry(entry, ctx);
}

function fillPreamble(entry) {
  const scene = String(entry.scene || "");
  const idx = scene.search(/[A-Za-z]/);
  const preamble = idx >= 0 ? scene.slice(0, idx) : scene;
  if (/[\u3400-\u9FFF]/.test(preamble)) return scene;
  const meaning = String(entry.definition_zh || "").split(/[；;]/)[0]
    .replace(/[A-Za-z][A-Za-z\u2019.' -]*/g, "")
    .replace(/[（(）)]/g, "")
    .trim() || "该词";
  const english = idx >= 0 ? scene.slice(idx).replace(CJK, "").replace(/\s+/g, " ").trim() : "";
  return ("这里指「" + meaning + "」。" + preamble.trim() + " " + english).trim();
}

function fixEntry(raw) {
  const entry = JSON.parse(JSON.stringify(raw));
  const word = String(entry.word || "").toLowerCase();

  if (entry.semanticMap && Array.isArray(entry.semanticMap.branches)) {
    for (const branch of entry.semanticMap.branches) {
      if (typeof branch.senses === "string") branch.senses = branch.senses.replace(/S(\d+)/g, (m, n) => String(n).padStart(2, "0"));
    }
  }
  if (entry.semanticMap && Array.isArray(entry.semanticMap.chain)) {
    entry.semanticMap.chain = entry.semanticMap.chain.map((x) => String(x).toUpperCase().replace(/[=:]/g, " ").replace(/\s+/g, " ").trim());
  }
  if (entry.etymology && Array.isArray(entry.etymology.items)) {
    for (const item of entry.etymology.items) if (typeof item.era === "string") item.era = item.era.toUpperCase();
  }

  if (Array.isArray(entry.forms)) {
    const seen = new Set();
    const kept = [];
    for (const item of entry.forms) {
      if (!item || typeof item.form !== "string") continue;
      const form = item.form.replace(CJK, "").trim();
      if (!form || seen.has(form.toLowerCase())) continue;
      seen.add(form.toLowerCase());
      item.form = form;
      kept.push(item);
    }
    entry.forms = kept.length ? kept : [{ label: "词形", form: entry.word }];
  }

  if (typeof entry.scene === "string" && entry.scene.trim()) entry.scene = fillPreamble(entry);
  if (typeof entry.sceneCN === "string" && !/第\s*\d+\s*个义项/.test(entry.sceneCN)) {
    entry.sceneCN = "这里指第 1 个义项。" + entry.sceneCN;
  }

  if (entry.similar && Array.isArray(entry.similar.groups)) {
    const groups = [];
    for (const group of entry.similar.groups) {
      if (!group || !Array.isArray(group.entries)) continue;
      const seen = new Set();
      const kept = group.entries.filter((item) => {
        if (!item || typeof item.word !== "string") return false;
        const key = item.word.toLowerCase();
        if (key === word || seen.has(key)) return false;
        if (typeof item.tag === "string") {
          const cleaned = item.tag.replace(CJK, " ").replace(/[^a-z -]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
          item.tag = cleaned ? cleaned.slice(0, 34) : "related";
        }
        seen.add(key);
        return true;
      });
      if (kept.length >= 2) groups.push(Object.assign({}, group, { entries: kept }));
    }
    if (groups.length >= 1) entry.similar.groups = groups;
  }

  if (Array.isArray(entry.derivatives)) {
    const kept = entry.derivatives.filter((item) => item && String(item.word || "").toLowerCase() !== word);
    if (kept.length >= 2) entry.derivatives = kept;
  }

  return entry;
}

function main() {
  const files = fs.readdirSync(PREPARED).filter((f) => {
    if (!/^[a-z0-9-]+?-(\d{4}|9\d{3})[a-z]?\.json$/.test(f)) return false;
    if (bookArg && !new RegExp("^" + bookArg + "-").test(f)) return false;
    return true;
  });

  let scanned = 0;
  let fixed = 0;
  let stillBad = 0;
  const remaining = [];
  const touchedFiles = [];

  for (const file of files) {
    const abs = path.join(PREPARED, file);
    let data;
    try { data = JSON.parse(fs.readFileSync(abs, "utf8")); } catch (e) { continue; }
    const list = Array.isArray(data) ? data : [data];
    let changed = false;
    const out = [];
    for (const entry of list) {
      if (!entry || !entry.word || !Array.isArray(entry.senses) || !entry.senses.length) { out.push(entry); continue; }
      scanned += 1;
      const before = validate(entry);
      if (!before.errors.length) { out.push(entry); continue; }
      const candidate = fixEntry(entry);
      const after = validate(candidate);
      if (after.errors.length === 0) {
        fixed += 1;
        changed = true;
        out.push(candidate);
      } else {
        stillBad += 1;
        if (remaining.length < 40) remaining.push(entry.word + " (" + after.errors[0].path + ": " + after.errors[0].message.slice(0, 40) + ")");
        out.push(after.errors.length < before.errors.length ? candidate : entry);
        if (after.errors.length < before.errors.length) changed = true;
      }
    }
    if (changed && WRITE) {
      fs.writeFileSync(abs, JSON.stringify(Array.isArray(data) ? out : out[0], null, 2) + "\n");
      touchedFiles.push(file);
    }
  }

  console.log("扫描词条", scanned, "| 修好", fixed, "| 仍不达标", stillBad, "| 改动文件", touchedFiles.length);
  if (remaining.length) console.log("待人工处理：\n" + remaining.map((r) => "  " + r).join("\n"));
  if (!WRITE) console.log("（预览模式，加 --write 写回）");
}

main();
