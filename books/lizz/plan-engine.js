/* ============================================================
   LIZZWORD · 学习计划引擎（纯规则，无后端）
   输入：用户画像 + 学习统计
   输出：今日任务（新词数 / 复习数 / 推荐模式 / 预计分钟 / 主词书）
   只做计算，不碰 DOM，方便单测与以后搬到服务端。
   ============================================================ */
(function (global) {
  "use strict";

  const GOALS = {
    exam_middle: { label: "中高考", book: "middle", alt: "zhonggaozhi" },
    exam_cet: { label: "四六级", book: "cet4", alt: "cet6" },
    exam_postgrad: { label: "考研", book: "kaoyan", alt: "cet4" },
    exam_ielts: { label: "雅思托福", book: "ielts", alt: "toefl-core-5000" },
    work: { label: "职场", book: "bec", alt: "business-law" },
    interest: { label: "兴趣", book: "daily", alt: "coca" },
    zero: { label: "零基础", book: "zero-basic", alt: "ket-pet" }
  };

  const MINUTE_PLANS = {
    5: { words: 5, review: 10 },
    10: { words: 10, review: 20 },
    20: { words: 15, review: 30 },
    30: { words: 20, review: 40 }
  };

  const MODE_BY_PREF = {
    picture: ["看图认词", "听音选词", "拼写"],
    listen: ["听音选词", "跟读", "拼写"],
    spell: ["拼写", "例句填空", "复习"],
    example: ["例句填空", "词块造句", "阅读"],
    root: ["词根拆解", "形近辨析", "例句填空"],
    game: ["小游戏", "认词", "拼写"]
  };

  const MODES = ["看图认词", "听音选词", "跟读", "拼写", "例句填空", "词根拆解", "形近辨析", "小游戏", "认词", "复习"];

  function normalizeProfile(raw) {
    const profile = raw && typeof raw === "object" ? raw : {};
    const goal = GOALS[profile.goal] ? profile.goal : "interest";
    const minutes = MINUTE_PLANS[profile.minutes] ? Number(profile.minutes) : 10;
    const level = ["zero", "some", "sentence", "cet4", "cet6"].indexOf(profile.level) >= 0 ? profile.level : "some";
    const prefs = Array.isArray(profile.prefs) && profile.prefs.length ? profile.prefs : ["listen", "example"];
    return {
      goal,
      minutes,
      level,
      prefs,
      examDate: typeof profile.examDate === "string" ? profile.examDate : "",
      reminder: profile.reminder !== false
    };
  }

  function buildPlan(rawProfile, stats, today) {
    const profile = normalizeProfile(rawProfile);
    const base = MINUTE_PLANS[profile.minutes];
    const goal = GOALS[profile.goal];
    const s = stats || {};
    const now = today ? new Date(today) : new Date();

    // 每日新词：零基础减半，考试临近不变，复习积压多时略减
    let newWords = base.words;
    if (profile.level === "zero") newWords = Math.max(3, Math.round(base.words * 0.6));
    const due = Number(s.due) || 0;
    if (due > base.review * 1.5) newWords = Math.max(3, Math.round(newWords * 0.7));

    // 考试倒计时：给出预计完成日期所需的每日词量
    let examHint = "";
    let daysLeft = 0;
    if (profile.examDate) {
      const target = new Date(profile.examDate + "T00:00:00");
      daysLeft = Math.max(0, Math.ceil((target - now) / 86400000));
      if (daysLeft > 0) {
        const learned = Number(s.learned) || 0;
        const total = Number(s.total) || 0;
        const remain = Math.max(0, total - learned);
        const need = Math.ceil(remain / daysLeft);
        examHint = need > newWords
          ? `距考试 ${daysLeft} 天，按当前速度学不完，建议每天 ${need} 词`
          : `距考试 ${daysLeft} 天，按当前速度来得及`;
      }
    }

    // 推荐模式：取偏好里的第一项；若某类正确率明显偏低，优先补那类
    const weak = s.weakestMode && MODES.indexOf(s.weakestMode) >= 0 ? s.weakestMode : "";
    const prefModes = [];
    for (const key of profile.prefs) {
      for (const mode of (MODE_BY_PREF[key] || [])) {
        if (prefModes.indexOf(mode) < 0) prefModes.push(mode);
      }
    }
    const recommended = weak || prefModes[0] || "认词";
    const mix = (weak ? [weak].concat(prefModes) : prefModes).filter((mode, i, arr) => arr.indexOf(mode) === i).slice(0, 3);

    return {
      profile,
      bookId: goal.book,
      altBookId: goal.alt,
      goalLabel: goal.label,
      newWords,
      reviewTarget: base.review,
      minutes: profile.minutes,
      recommended,
      mix,
      examHint,
      daysLeft
    };
  }

  function describe(plan) {
    const lines = [];
    lines.push(`目标：${plan.goalLabel} · 每天 ${plan.minutes} 分钟`);
    lines.push(`今日：新词 ${plan.newWords} 个 + 复习 ${plan.reviewTarget} 个`);
    lines.push(`推荐模式：${plan.mix.join(" → ")}`);
    if (plan.examHint) lines.push(plan.examHint);
    return lines;
  }

  global.LZPlan = {
    GOALS,
    MINUTE_PLANS,
    MODE_BY_PREF,
    normalizeProfile,
    buildPlan,
    describe
  };
})(typeof window !== "undefined" ? window : globalThis);
