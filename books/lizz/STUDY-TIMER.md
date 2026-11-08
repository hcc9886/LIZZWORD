# STUDY-TIMER 接入说明

目标：把「开始时间戳 + 完成时 `Date.now()` 相减」的学习/复习计时，换成「只累计可见且在学/复习视图内的活跃段」，让切后台、锁屏、回首页、关标签、刷新期间的时间不再计入。

模块：[study-timer.js](file:///Users/hcc/Desktop/LIZZWORD/books/lizz/study-timer.js)（`window.LZStudyTimer`，纯前端、无依赖、无 fetch、不直接读写 localStorage）。

> 行号基于当前版本（`index.html` 11315 行、`index-clean.html` 11028 行）。按顺序修改会让后续行号偏移，请优先按函数名 + 改动前代码片段定位。

---

## 0. 前置：引入模块脚本

主逻辑是内联脚本，模块必须在它执行前加载（`start()` 在脚本末尾调用，`boot()` 里会 `attach`）。

`index.html` 第 1376 行 `<script>` 之前新增：

```html
<script src="books/lizz/study-timer.js"></script>
```

`index-clean.html` 第 1311 行 `<script>` 之前新增同一行：

```html
<script src="books/lizz/study-timer.js"></script>
```

两份文件都使用相对路径，`file://` 双击与本地 HTTP 均可加载。

---

## 1. `initState()` 增加已结算时长字段

### index.html：6967-6970

改动前：

```js
        stageWrong: { s1: 0, s2: 0, s2b: 0, s3: 0, s4: 0 },
        learnStartedMs: 0,
        learnDebug: false,
        learnSummary: null,
```

改动后：

```js
        stageWrong: { s1: 0, s2: 0, s2b: 0, s3: 0, s4: 0 },
        learnStartedMs: 0,
        learnElapsedMs: 0,
        learnDebug: false,
        learnSummary: null,
```

### index-clean.html：6901-6903

改动前：

```js
        stageWrong: { s1: 0, s2: 0, s2b: 0, s3: 0, s4: 0 },
        learnStartedMs: 0,
        learnSummary: null,
```

改动后：

```js
        stageWrong: { s1: 0, s2: 0, s2b: 0, s3: 0, s4: 0 },
        learnStartedMs: 0,
        learnElapsedMs: 0,
        learnSummary: null,
```

---

## 2. `loadState()` 读回已结算时长；刷新后不沿用旧活跃段

### index.html：7160-7163

改动前：

```js
              stageWrong: normalizeWrongCounts(parsed.stageWrong),
              learnStartedMs: Number(parsed.learnStartedMs) || 0,
              learnDebug: Boolean(parsed.learnDebug),
```

改动后：

```js
              stageWrong: normalizeWrongCounts(parsed.stageWrong),
              learnElapsedMs: Number(parsed.learnElapsedMs) || 0,
              // 刷新/重开不沿用旧活跃段：关闭或隐藏期间的时间绝不补进来
              learnStartedMs: 0,
              learnDebug: Boolean(parsed.learnDebug),
```

### index-clean.html：7090-7092

改动前：

```js
              stageWrong: normalizeWrongCounts(parsed.stageWrong),
              learnStartedMs: Number(parsed.learnStartedMs) || 0,
              learnSummary: parsed.learnSummary && typeof parsed.learnSummary === "object" ? parsed.learnSummary : null,
```

改动后：

```js
              stageWrong: normalizeWrongCounts(parsed.stageWrong),
              learnElapsedMs: Number(parsed.learnElapsedMs) || 0,
              // 刷新/重开不沿用旧活跃段：关闭或隐藏期间的时间绝不补进来
              learnStartedMs: 0,
              learnSummary: parsed.learnSummary && typeof parsed.learnSummary === "object" ? parsed.learnSummary : null,
```

---

## 3. `ensureLearnSession()` 新组开始时清零计时

### index.html：7553-7555

改动前：

```js
      state.stageWrong = { s1: 0, s2: 0, s2b: 0, s3: 0, s4: 0 };
      state.learnStartedMs = Date.now();
      state.learnDebug = false;
```

改动后：

```js
      state.stageWrong = { s1: 0, s2: 0, s2b: 0, s3: 0, s4: 0 };
      state.learnElapsedMs = 0;
      // 起点交给 LZStudyTimer：进入学习视图且页面可见时才真正开始
      state.learnStartedMs = 0;
      state.learnDebug = false;
```

### index-clean.html：7480-7482

改动前：

```js
      state.stageWrong = { s1: 0, s2: 0, s2b: 0, s3: 0, s4: 0 };
      state.learnStartedMs = Date.now();
      state.todayDoneAt = "";
```

改动后：

```js
      state.stageWrong = { s1: 0, s2: 0, s2b: 0, s3: 0, s4: 0 };
      state.learnElapsedMs = 0;
      // 起点交给 LZStudyTimer：进入学习视图且页面可见时才真正开始
      state.learnStartedMs = 0;
      state.todayDoneAt = "";
```

---

## 4. `resetLearnSession()` 同时清零计时

### index.html：7579-7582

改动前：

```js
      state.stageWrong = { s1: 0, s2: 0, s2b: 0, s3: 0, s4: 0 };
      state.learnSummary = null;
      state.learnStartedMs = 0;
      state.learnDebug = false;
```

改动后：

```js
      state.stageWrong = { s1: 0, s2: 0, s2b: 0, s3: 0, s4: 0 };
      state.learnSummary = null;
      state.learnStartedMs = 0;
      state.learnElapsedMs = 0;
      state.learnDebug = false;
```

### index-clean.html：7505-7508

改动前：

```js
      state.stageWrong = { s1: 0, s2: 0, s2b: 0, s3: 0, s4: 0 };
      state.learnSummary = null;
      state.learnStartedMs = 0;
      state.todayDoneAt = "";
```

改动后：

```js
      state.stageWrong = { s1: 0, s2: 0, s2b: 0, s3: 0, s4: 0 };
      state.learnSummary = null;
      state.learnStartedMs = 0;
      state.learnElapsedMs = 0;
      state.todayDoneAt = "";
```

---

## 5. `showView()` 离开时暂停、进入后恢复

### index.html：9921-9939

改动前（函数开头）：

```js
    function showView(mode) {
      viewMode = mode;
      current = null;
      writeCurrent = null;
      speakCurrent = null;
      if (mode !== "library") debugArmed = false;
```

改动后：

```js
    function showView(mode) {
      // 离开学习/复习视图先结算：首页、词库、预习的停留不计入
      if (viewMode === "study") window.LZStudyTimer.pauseLearn();
      if (viewMode === "review") window.LZStudyTimer.pauseReview();
      viewMode = mode;
      current = null;
      writeCurrent = null;
      speakCurrent = null;
      if (mode !== "library") debugArmed = false;
```

改动前（函数末尾）：

```js
      // 只有真实进入新学才启动计时；调试跳转由 learnDebug 排除
      if (mode === "study" && state.stage !== "done" && state.learnStartedMs === 0 && !state.learnDebug) {
        state.learnStartedMs = Date.now();
        saveState();
      }

      renderView();
      renderStats();
```

改动后：

```js
      renderView();
      renderStats();

      // 只在可见且处于对应视图时恢复；阶段未完成、调试会话等条件由模块内部校验
      if (mode === "study") window.LZStudyTimer.resumeLearn();
      else if (mode === "review") window.LZStudyTimer.resumeReview();
```

### index-clean.html：9797-9813

改动前（函数开头）：

```js
    function showView(mode) {
      viewMode = mode;
      current = null;
      writeCurrent = null;
      speakCurrent = null;

      // 进入新学前按每日目标锁定今日队列；只抽一次，不再补词
```

改动后：

```js
    function showView(mode) {
      // 离开学习/复习视图先结算：首页、词库、预习的停留不计入
      if (viewMode === "study") window.LZStudyTimer.pauseLearn();
      if (viewMode === "review") window.LZStudyTimer.pauseReview();
      viewMode = mode;
      current = null;
      writeCurrent = null;
      speakCurrent = null;

      // 进入新学前按每日目标锁定今日队列；只抽一次，不再补词
```

改动前（函数末尾）：

```js
      // 只有真实进入新学才启动计时
      if (mode === "study" && state.stage !== "done" && state.learnStartedMs === 0) {
        state.learnStartedMs = Date.now();
        saveState();
      }

      renderView();
      renderStats();
```

改动后：

```js
      renderView();
      renderStats();

      // 只在可见且处于对应视图时恢复；阶段未完成、调试会话等条件由模块内部校验
      if (mode === "study") window.LZStudyTimer.resumeLearn();
      else if (mode === "review") window.LZStudyTimer.resumeReview();
```

---

## 6. `buildLearnSummary()` 改用有效学习时长

### index.html：7411-7415

改动前：

```js
    function buildLearnSummary() {
      const wrong = normalizeWrongCounts(state.stageWrong);
      const durationMs = state.learnDebug || !state.learnStartedMs
        ? null
        : Math.max(0, Date.now() - state.learnStartedMs);
```

改动后：

```js
    function buildLearnSummary() {
      const wrong = normalizeWrongCounts(state.stageWrong);
      const durationMs = window.LZStudyTimer ? window.LZStudyTimer.learnDurationNow() : null;
```

### index-clean.html：7340-7344

改动前：

```js
    function buildLearnSummary() {
      const wrong = normalizeWrongCounts(state.stageWrong);
      const durationMs = !state.learnStartedMs
        ? null
        : Math.max(0, Date.now() - state.learnStartedMs);
```

改动后：

```js
    function buildLearnSummary() {
      const wrong = normalizeWrongCounts(state.stageWrong);
      const durationMs = window.LZStudyTimer ? window.LZStudyTimer.learnDurationNow() : null;
```

---

## 7. `finishToday()` 先结算最后一段再生成 summary

### index.html：7456-7458

改动前：

```js
      enterReviewPool();
      state.learnSummary = buildLearnSummary();
      saveState();
```

改动后：

```js
      enterReviewPool();
      // 先把最后一个活跃段结算进 learnElapsedMs，再生成耗时
      window.LZStudyTimer.pauseLearn();
      state.learnSummary = buildLearnSummary();
      saveState();
```

### index-clean.html：7383-7385

改动前：

```js
      enterReviewPool();
      state.learnSummary = buildLearnSummary();
      saveState();
```

改动后：

```js
      enterReviewPool();
      // 先把最后一个活跃段结算进 learnElapsedMs，再生成耗时
      window.LZStudyTimer.pauseLearn();
      state.learnSummary = buildLearnSummary();
      saveState();
```

---

## 8. `ensureReviewSession()` 新会话初始化复习计时

### index.html：8616-8619

改动前：

```js
      const session = {
        date: today,
        startMs: Date.now(),
        debug: false,
```

改动后：

```js
      const session = {
        date: today,
        startMs: 0,
        elapsedMs: 0,   // 已结算的复习有效时长
        debug: false,
```

### index-clean.html：8543-8546

改动前：

```js
      const session = {
        date: today,
        startMs: Date.now(),
        due: due.slice(),
```

改动后：

```js
      const session = {
        date: today,
        startMs: 0,
        elapsedMs: 0,   // 已结算的复习有效时长
        due: due.slice(),
```

---

## 9. `normalizeReviewSession()` 读回 elapsedMs，旧活跃段清零

### index.html：7007-7010

改动前：

```js
      const normalized = {
        date: str(value.date),
        startMs: Number(value.startMs) || 0,
        debug: Boolean(value.debug),
```

改动后：

```js
      const normalized = {
        date: str(value.date),
        // 刷新/重开不沿用旧活跃段；旧存档的墙上起点直接丢弃
        startMs: 0,
        elapsedMs: Number(value.elapsedMs) || 0,
        debug: Boolean(value.debug),
```

### index-clean.html：6939-6942

改动前：

```js
      const normalized = {
        date: str(value.date),
        startMs: Number(value.startMs) || 0,
        due: list(value.due),
```

改动后：

```js
      const normalized = {
        date: str(value.date),
        // 刷新/重开不沿用旧活跃段；旧存档的墙上起点直接丢弃
        startMs: 0,
        elapsedMs: Number(value.elapsedMs) || 0,
        due: list(value.due),
```

---

## 10. `buildReviewSummary()` 改用有效复习时长

### index.html：8727

改动前：

```js
      const durationMs = session.debug || !session.startMs ? null : Math.max(0, Date.now() - session.startMs);
```

改动后：

```js
      const durationMs = session.debug || !window.LZStudyTimer
        ? null
        : window.LZStudyTimer.reviewDurationNow();
```

### index-clean.html：8653

改动前：

```js
      const durationMs = !session.startMs ? null : Math.max(0, Date.now() - session.startMs);
```

改动后：

```js
      const durationMs = !window.LZStudyTimer ? null : window.LZStudyTimer.reviewDurationNow();
```

---

## 11. `finishReview()` 先结算最后一段再生成 summary

### index.html：8747-8749

改动前：

```js
      const session = state.reviewSession;
      if (!session || session.summary) return;
      session.summary = buildReviewSummary(session);
```

改动后：

```js
      const session = state.reviewSession;
      if (!session || session.summary) return;
      window.LZStudyTimer.pauseReview();
      session.summary = buildReviewSummary(session);
```

### index-clean.html：8670-8672

改动前：

```js
      const session = state.reviewSession;
      if (!session || session.summary) return;
      session.summary = buildReviewSummary(session);
```

改动后：

```js
      const session = state.reviewSession;
      if (!session || session.summary) return;
      window.LZStudyTimer.pauseReview();
      session.summary = buildReviewSummary(session);
```

---

## 12. `boot()` 里挂载模块（必须在 `loadState()` 之后）

### index.html：10572-10574

改动前：

```js
      appStarted = true;
      viewMode = "home";
      renderAll();
```

改动后：

```js
      appStarted = true;
      viewMode = "home";

      // 学习计时：状态读写全部走主页面已有实现，模块只负责暂停/恢复/结算
      window.LZStudyTimer.attach({
        getState: () => state,
        save: saveState,
        isStudyView: () => viewMode === "study",
        isReviewView: () => viewMode === "review"
      });

      renderAll();
```

### index-clean.html：10319-10321

改动前：

```js
      appStarted = true;
      viewMode = "home";
      renderAll();
```

改动后：

```js
      appStarted = true;
      viewMode = "home";

      // 学习计时：状态读写全部走主页面已有实现，模块只负责暂停/恢复/结算
      window.LZStudyTimer.attach({
        getState: () => state,
        save: saveState,
        isStudyView: () => viewMode === "study",
        isReviewView: () => viewMode === "review"
      });

      renderAll();
```

---

## 旧存档兼容与首次上线显示口径变化

### 状态结构

只在 `state` 新增 `learnElapsedMs`，在 `state.reviewSession` 新增 `elapsedMs`；不改动 `stage`、`queue`、各 `*Done`、`reviewPool`、`srsHistory`、`groupsToday`、`wordsToday` 等任何进度字段。仍是同一个 `lizzword_state_v1`，不需要版本迁移代码。

- `learnStartedMs` / `reviewSession.startMs` 保留字段名，但语义从「开始时间戳」改为「当前活跃段标记（非 0 表示正在计时）」。时长计算不再使用它们。
- 旧存档（只有 `learnStartedMs` / `startMs`、没有 `elapsedMs`）：第 2、9 点会在读取时直接归零旧起点，`elapsedMs` 从 0 开始。
- 新存档刷新/重开：第 2、9 点同样把活跃段归零；已结算的 `learnElapsedMs` / `elapsedMs` 保留。模块 `attach()` 里还有一层兜底（没有 `performance.now()` 起点的活跃标记会被清零），即使某处漏改也不会把关闭时间补进来。

### 首次上线的显示口径

- 升级前已经生成并保存在 `state.learnSummary` / `reviewSession.summary` 的完成页耗时不会重算，按历史值展示。
- 升级瞬间正在进行中的那一组/那一次复习：旧的墙上计时被丢弃，耗时从 0 重新开始累计。这是预期行为，避免带着历史的虚高时长完成。
- 完成后「耗时」的含义从「页面开着多久」变为「可见且在学/复习视图内的有效时长」。调试会话（`learnDebug`）仍显示「不计时」。
- 未完成的一组跨天：`rolloverLearnDay()` 的产品行为不变（未完成组仍会继续），但跨夜时间不再计入耗时。

### 不补时

恢复可见、从 bfcache 回到页面、刷新后重新进入学习，都从当前时刻重新起算，不补隐藏/关闭期间的任何时间。正常关闭会通过 `pagehide` 结算最后一段；进程被杀等极端情况最多丢失「最后一次暂停之后」的一小段（不会多算）。

---

## 接入后自检

1. 学习中切后台 10 分钟再回来完成 → 耗时不应包含这 10 分钟。
2. 返回首页停 5 分钟再回学习 → 首页时间不计入。
3. 关标签 1 小时后重开并完成 → 关闭期间不计入。
4. 刷新、手机锁屏同第 1/3 条。
5. 复习中途离开/刷新/锁屏 → 复习耗时只算活跃段。
6. 调试面板「快进 / 一键完成」→ 仍显示「不计时」。
7. 旧 localStorage 首次启动 → 完成页耗时不再虚高。
8. `file://` 双击与本地 HTTP 均验证一次，控制台无报错、`window.LZStudyTimer` 存在。

---

## 最容易出错的两处

1. **只加了模块，没替换两处完成页口径。** `buildLearnSummary()` 与 `buildReviewSummary()` 必须改用 `learnDurationNow()` / `reviewDurationNow()`，并且 `finishToday()` / `finishReview()` 要**先 pause 再构建 summary**；顺序反了会少算最后一段，漏改则仍然按墙上时间虚高。
2. **`showView()` 里 pause/resume 的位置。** `pauseLearn/pauseReview` 必须在 `viewMode = mode` **之前**调用（否则已经切到首页，判断不到旧视图）；`resumeLearn/resumeReview` 必须在 `renderView()` **之后**调用（复习路径要先让 `ensureReviewSession()` 建好/替换当天会话）。另外 `attach()` 必须在 `loadState()` 之后、`renderAll()` 之前，否则模块拿到的是空 `state`。
