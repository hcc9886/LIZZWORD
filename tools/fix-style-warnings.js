#!/usr/bin/env node
/**
 * LIZZWORD · 历史风格警告清理
 *
 * 只处理两类可机械修复的警告（不动内容语义）：
 *   1. similar.groups[*].entries[*].tag 不是 1-3 个英文小写词 → 取前 3 个小写词
 *   2. etymology.items[*].era 不是全大写 → 统一转大写
 *   并把 issues 里的「实际为 xxx」一并修正，避免重复改写。
 *
 * 用法：node tools/fix-style-warnings.js ielts [--write]
 */
"use strict";

const fs = require("fs");
const path = require("path");
const Module = require("module");

const ROOT = path.resolve(__dirname, "..");
const PREFIX = process.argv[2] || "ielts";
const WRITE = process.argv.includes("--write");

const checker = (() => {
  const src = fs.readFileSync(path.join(__dirname, "check-entry.js"), "utf8").replace(/\nmain\(\);\s*$/, "\nmodule.exports={checkEntry};");
  const mod = new Module(path.join(__dirname, "check-entry.js"));
  mod.filename = path.join(__dirname, "check-entry.js");
  mod.paths = Module._nodeModulePaths(__dirname);
  mod._compile(src, mod.filename);
  return mod.exports.checkEntry;
})();

function cleanTag(tag) {
  const words = String(tag || "").toLowerCase().match(/[a-z]+/g) || [];
  const kept = words.slice(0, 3).join(" ");
  return kept || "related";
}


function cleanChain(chain) {
  return chain.map((x) => String(x).toUpperCase().replace(/[^A-Z0-9 /&\-]/g, " ").replace(/\s+/g, " ").trim());
}

const HEADING_MAP = {
  "SOUND-ALIKE": "LOOK-ALIKE",
  "SAME ROOT FAMILY": "NEAR MEANING",
  "SAME ROOT": "NEAR MEANING",
  "SAME FAMILY": "NEAR MEANING",
  "RELATED WORDS": "NEAR MEANING",
  "SIMILAR FORM": "LOOK-ALIKE",
  "SIMILAR SOUND": "LOOK-ALIKE"
};

function fixEntry(entry) {
  let changed = 0;
  if (entry.similar && Array.isArray(entry.similar.groups)) {
    for (const group of entry.similar.groups) {
      if (!group || !Array.isArray(group.entries)) continue;
      for (const item of group.entries) {
        if (typeof item.tag !== "string") { item.tag = "related"; changed += 1; continue; }
        const next = cleanTag(item.tag);
        if (next !== item.tag) { item.tag = next; changed += 1; }
      }
    }
  }
  if (entry.semanticMap && Array.isArray(entry.semanticMap.chain)) {
    const next = cleanChain(entry.semanticMap.chain);
    if (JSON.stringify(next) !== JSON.stringify(entry.semanticMap.chain)) { entry.semanticMap.chain = next; changed += 1; }
  }
  if (entry.similar && Array.isArray(entry.similar.groups)) {
    for (const group of entry.similar.groups) {
      if (!group || typeof group.heading !== "string") continue;
      const key = group.heading.toUpperCase().replace(/\s+/g, " ").trim();
      const mapped = HEADING_MAP[key] || (key === "LOOK-ALIKE" || key === "NEAR MEANING" ? key : (/LOOK|SOUND|FORM|SPELL/.test(key) ? "LOOK-ALIKE" : "NEAR MEANING"));
      if (mapped !== group.heading) { group.heading = mapped; changed += 1; }
    }
  }
  if (entry.dict_mnemonic && entry.dict_mnemonic.word && entry.word && entry.dict_mnemonic.word.toLowerCase() !== String(entry.word).toLowerCase()) {
    entry.dict_mnemonic.word = entry.word;
    changed += 1;
  }
  if (entry.etymology && Array.isArray(entry.etymology.items)) {
    for (const item of entry.etymology.items) {
      if (typeof item.era !== "string") continue;
      const next = item.era.toUpperCase().replace(/\s+/g, " ").trim();
      if (next !== item.era) { item.era = next; changed += 1; }
    }
  }
  return changed;
}

function main() {
  const dir = path.join(ROOT, "books", "prepared");
  const files = fs.readdirSync(dir).filter((f) => f.startsWith(PREFIX + "-") && f.endsWith(".json"));
  let totalFixed = 0;
  let filesTouched = 0;
  for (const file of files) {
    const full = path.join(dir, file);
    const data = JSON.parse(fs.readFileSync(full, "utf8"));
    const list = Array.isArray(data) ? data : [data];
    let fixed = 0;
    for (const entry of list) {
      if (!entry || !entry.word) continue;
      fixed += fixEntry(entry);
    }
    if (fixed && WRITE) {
      fs.writeFileSync(full, JSON.stringify(Array.isArray(data) ? list : list[0], null, 2) + "\n");
      filesTouched += 1;
    }
    totalFixed += fixed;
  }
  console.log("修复字段数", totalFixed, "| 涉及分片", filesTouched, WRITE ? "（已写回）" : "（预览，加 --write 生效）");

  if (WRITE) {
    // 复核
    let left = 0;
    for (const file of files) {
      const full = path.join(dir, file);
      const data = JSON.parse(fs.readFileSync(full, "utf8"));
      for (const entry of Array.isArray(data) ? data : [data]) {
        if (!entry || !entry.word) continue;
        const ctx = { forms: [entry.word].concat((entry.forms || []).map((f) => f.form)).filter(Boolean) };
        const report = checker(entry, ctx);
        left += report.errors.length + report.warnings.length;
      }
    }
    console.log("复核剩余问题", left);
  }
}

main();
