/* ============================================================
   LIZZWORD · 云端账号配置（唯一允许放密钥的文件）
   ------------------------------------------------------------
   这里只放两个“公开密钥”，可以安全地随仓库发布：
     url      ＝ Supabase 控制台 → Project Settings → API → Project URL
     anonKey  ＝ 同一页面的 anon public key（新版叫 publishable key，同样是公开的）
   绝对不要、永远不要把 service_role key 写进任何前端文件。

   填好之后无需改代码，account.js 会自动走真实 Supabase。
    url 仍为空时，account.js 不发起任何真实网络请求；
    url 填好后即走真实 Supabase，建表脚本见 books/lizz/sql/init.sql。
   ============================================================ */
(function () {
  "use strict";

  window.LIZZWORD_ACCOUNT_CONFIG = {
    // Supabase 项目地址（LIZZWORD 云端账号专用）
    url: "https://yvnfjvzhjxwfzmyqtcyn.supabase.co",

    // 新版 Supabase publishable key（公开密钥，可随仓库发布）
    anonKey: "sb_publishable_YDet4ytaAntlFscPwAwcdg_SZCZgj2S",

    // 可选：邮箱确认后回跳地址。留空时线上固定回 https://hcc9886.github.io/LIZZWORD/，
    // 本地调试回当前页面（location.origin + location.pathname）。填值可强制覆盖上述规则。
    emailRedirectTo: "",

    // true：允许账号界面出现；false 可整体关闭（用于临时隐藏入口）
    enabled: true,

    // 同步相关（一般不需要改）
    syncIntervalMs: 60000,   // 登录后后台轮询间隔
    pushDebounceMs: 1500,    // 本地写入后合并推送的防抖
    requestTimeoutMs: 15000, // 单次请求超时（Supabase 跨境链路偏慢时留余量）
    syncBudgetMs: 30000      // 一轮同步的总预算：超时即中止并提示「同步失败，请重试」
  };
})();
