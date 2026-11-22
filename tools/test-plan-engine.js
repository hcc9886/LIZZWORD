#!/usr/bin/env node
/**
 * 学习计划引擎单测（纯函数，无 DOM 依赖）
 * 运行：node tools/test-plan-engine.js
 */
"use strict";

const assert = require("assert");
const path = require("path");
const { buildPlan, normalizeProfile, GOALS, MINUTE_PLANS } = require(path.join(__dirname, "..", "books", "lizz", "plan-engine.js"));

let passed = 0;
function check(name, fn) {
  try {
    fn();
    passed += 1;
    console.log("✓", name);
  } catch (err) {
    console.log("✗", name, "-", err.message);
    process.exitCode = 1;
  }
}

check("零基础 + 10 分钟 → 词数减半", () => {
  const plan = buildPlan({ goal: "zero", minutes: 10, level: "zero", prefs: ["listen"] });
  assert.ok(plan.newWords >= 3 && plan.newWords < MINUTE_PLANS[10].words, plan.newWords);
  assert.strictEqual(plan.bookId, "zero-basic");
});

check("雅思目标 → 主词书 ielts", () => {
  const plan = buildPlan({ goal: "exam_ielts", minutes: 20, level: "cet4", prefs: ["example"] });
  assert.strictEqual(plan.bookId, "ielts");
  assert.strictEqual(plan.minutes, 20);
});

check("考研目标 → 主词书 kaoyan", () => {
  assert.strictEqual(buildPlan({ goal: "exam_postgrad", minutes: 30 }).bookId, "kaoyan");
});

check("30 分钟 → 20 新词起步", () => {
  const plan = buildPlan({ goal: "interest", minutes: 30, level: "some", prefs: ["listen"] });
  assert.strictEqual(plan.newWords, 20);
});

check("正确率 45% → 减量", () => {
  const base = buildPlan({ goal: "interest", minutes: 20, level: "some", prefs: ["listen"] });
  const low = buildPlan({ goal: "interest", minutes: 20, level: "some", prefs: ["listen"] }, { accuracy: 45 });
  assert.ok(low.newWords < base.newWords, low.newWords + " vs " + base.newWords);
});

check("正确率 92% → 加量但不超过 40", () => {
  const high = buildPlan({ goal: "interest", minutes: 30, level: "some", prefs: ["listen"] }, { accuracy: 92 });
  assert.ok(high.newWords >= 20 && high.newWords <= 40, String(high.newWords));
});

check("复习积压多 → 新词减量", () => {
  const normal = buildPlan({ goal: "exam_cet", minutes: 20 }, { due: 10 });
  const piled = buildPlan({ goal: "exam_cet", minutes: 20 }, { due: 200 });
  assert.ok(piled.newWords < normal.newWords);
});

check("考试倒计时给出提示", () => {
  const plan = buildPlan(
    { goal: "exam_ielts", minutes: 20, level: "cet4", prefs: ["listen"], examDate: "2027-06-01" },
    { learned: 500, total: 6000 }
  );
  assert.ok(plan.daysLeft > 0);
  assert.ok(plan.examHint.length > 0);
});

check("推荐模式来自偏好", () => {
  const plan = buildPlan({ goal: "interest", minutes: 10, level: "some", prefs: ["root"] });
  assert.strictEqual(plan.mix[0], "词根拆解");
});

check("非法画像回落到默认值", () => {
  const profile = normalizeProfile({ goal: "not-exist", minutes: 7, level: "x", prefs: [] });
  assert.strictEqual(profile.goal, "interest");
  assert.strictEqual(profile.minutes, 10);
  assert.deepStrictEqual(profile.prefs, ["listen", "example"]);
});

check("目标表覆盖 7 类", () => {
  assert.strictEqual(Object.keys(GOALS).length, 7);
});

console.log("\n通过", passed, "项");
if (process.exitCode) console.log("存在失败用例");
