# LIZZWORD 交接文档（2026-11-21 会话收尾版）

> 面向对象：接手继续完善词书的 AI（workbuddy / deepseek）。
> 读完本文即可独立运行：生产词条 → 校验 → 装片 → 更新主表与注册 → 提交。
> 本文数字均为 2026-11-21 **本会话最后一次实扫**的结果；**接手后请重新实扫确认，不要照抄数字**。
> 旧版（2026-11-15 / 2026-11-21 早间）里的 IELTS 进度已过期，以本文为准。
> 本次交接时用户已明确要求：**暂停继续推词条**，先交接。所以下面第 10 节「交接清单」是首要阅读对象。

---

## 2026-11-22 · 全站体检与本轮更新

- **全站健康检查**：新增 `tools/health-check.js`，一次跑完内联脚本语法、32 个外部模块语法、SW 预缓存、31 本书主表/分片、22 字段校验、函数引用、存储键，结论「全部通过」。
- **22 字段全库清零**：用 `tools/fix-entry-defects.js` 机械修复 1,640 条历史词条（S1→01、词形去中文、场景补中文铺垫、近义标签小写、自引用删除、语义链大写），残留 14 条手工修完；现在 **8,480 条深度词条 0 错误**（814 条风格警告按既定政策不返工）。
- **内测码**：`wansuiwansuiwanwansui1313113`（永久）、`nulixuexiya2027`（一年）、`lizzzhaohaoyon!!!`（一月），大小写不敏感、一机一码一次。
- **教师端**：建班 → 布置词书 → 看完成率 → 导出 CSV（Team/内测版可用）。
- **我的词书**：错词成书 + 手动加词 / 删除 / 改名 / 清空（Plus）。
- **DIY 二期**：每行卡片数（2/3/4）、字号（标准/大/特大）。
- **拼装联动**：错句按拼写/语序/介词搭配/词形归类，一键跳到同类专项练习。
- **Supabase**：`books/lizz/sql/events.sql`（learning_events + profiles + event_funnel 视图），前端 `LZEvents.setRemote` 已接 REST。
- **拼装自测 8 项**全过（有句/缓存复用/无句回退/LLM 生成/判定分流/队列隔离/粒度自适应）。

## 2026-11-21 晚 · 最新进度（覆盖下文旧数字）

本节比正文新；与正文冲突时以本节为准。

- IELTS 批次 **0103–0108 已完成并提交**（0106 首词 exclusive）：`ielts-0103` error 起、`0104` ethical 起、`0105` exacerbation 起、`0106` exclusive 起，各 20/20。
- 主表 `books/ielts.json` 已到 **2200 词 / 108 片**；注册表 **31 本书、56,900+ 词**（自建书每本约 1900–2000 词，全部 22 字段）；`node tools/audit-books.js` 全绿。词书改用共享分片 + `books/manifest.js`，新增 `tools/build-library.js` 与 `tools/sync-registry.js`。
- 下一批 **0109**，首词见 `node tools/next-words.js ielts 20`（`node tools/next-words.js ielts 20` 实测）。
- 新增 `tools/audit-books.js`（词书加载自检，可 `--all` 扫未注册分片），新增 `docs/TRAE-BRIEF.md`（交给 Trae 的产品意见条款：学习模式、入门问卷、付费/免费、词书可行性、零基础书）。
- 产品功能：免费/Plus 分层（零基础整本 + 任选一本完整；免费每日 50 词、Plus 不限；7 天试用；22 字段全部可见）、付费墙、每周复盘、事件埋点（`lizzword_events_v1`）、零基础词卡（emoji 图 + 短句 + 跟读）、入门问卷 + 今日计划卡（`books/lizz/plan-engine.js` / `onboarding.js`）、专项练习（例句填空 / 形近辨析 / 词根拆解）、错词本（`lizzword_wrong_v1`）。
- 拼装模块（`books/lizz/assembly.js`）：写阶段有语境句走意群拼装，无句回退整词拼写；IndexedDB 存 sentence_cache / sentence_index / assembly_queue；拼装错误独立队列，不写单词卡 FSRS；免费每日 50 词、Plus 100 词。
- 本轮新增：同根词族 500 专书（`word-family`）、计划引擎自适应、近义干扰项、周报分享图（邀请码）、计划引擎 11 条单测、分片懒加载（前 20 片立即可学）。
- 语音已加：`LZSpeech.speakSequence` 连读队列、语速/口音偏好持久化（`lizzword_speech_v1`）、失败分级提示、中文语音缺失降级；词卡「连读（词 → 例句 → 释义）」按钮。
- **24 本自建词书已生成并上架（2026-11-21 晚）**：17 本考试书 + `zero-basic` / `affix-roots` / `collocation` 三本配套书：english-major / kaoyan / study-abroad / pte / fce / bec / medical / business-law / coca / pets / zhuanshengben / zikao / self-study / new-concept / zhonggaozhi / ab / ket-pet，合计 7,155 条深度词条（17 本 6,159 + 配套 996）；17 本之间严格不重复；生成工具 `tools/build-exam-books.js`（--write 重跑）。`index.html` 现注册 **30 本书、33,417 词**；`sw.js` SHELL 已补 20 个主表；CEFR 推荐位已接入新书。
- 新书分片由「已有深度词条整条复用 + 机械修整」生成（S1→01、词形去中文、场景补中文铺垫、近义标签小写、语义链大写），修不好的一律不进分片；`check-entry.js` 对 6,159 条实测 **0 错**（280 条历史风格警告继承自老批次，按既定政策不返工）。
- 本地 main 领先 origin/main 的提交数继续增加（以 `git rev-list --count origin/main..HEAD` 实测为准），**push 仍被 Agent 侧权限拦住，必须用户在真实终端执行**。
- 批次 0103 / 0104 的 `/tmp` 在制品已消化完毕，第 10 节不再适用；后续批次按第 4 节流程正常生产即可。

---

## 0. 一分钟上手

```bash
cd /Users/hcc/Desktop/LIZZWORD          # 仓库根目录必须用这个（不是 /Users/hcc/LIZZWORD）
node tools/next-words.js ielts 20       # 雅思下一批要写哪些词
node tools/check-entry.js books/prepared/ielts-0102.json --existing   # 校验（唯一验收标准）
git log --oneline -5
git rev-list --count origin/main..HEAD  # 本地积压未推送提交数（本文件提交后为 15；接手时以本命令实测为准）
```

铁律：
1. **每批 20 词，一片一个文件**：`books/prepared/<书>-NNNN.json`。
2. **断点只能实扫求差集**（`tools/next-words.js`），绝不用「上批末词」推断——历史上因此重复产出过 14 个分片。
3. **验收 = `node tools/check-entry.js <文件> --existing` 输出 0 错 0 警**，不达标不许提交。
4. `tools/check-entry.js` 禁止修改。
5. 每批流程：写片 → 校验 → 装片 → 重建主表 → 更新 `index.html` 注册 → commit。
6. 不许 force push、不许 `--no-verify`、不许改历史、不许 `git add -A`（只按名字 add 本次产物）。push 见第 7 节。

---

## 0.5 交接快照：本会话做完了什么、什么没做

用户在本会话末尾明确要求「不要再推词条，先出一份交接」，所以以下内容按「已完成 / 未完成」分列。接手前请先跑 `git log --oneline -8` 和 `node tools/next-words.js ielts 20` 复核。

### 已完成（已 commit，在工作树里可直接用）

1. IELTS 批次 **0100 / 0101 / 0102** 三批共 60 词全部产出并入库：
   - `books/prepared/ielts-0100.json`（enrich 起）、`ielts-0101.json`（entomologist 起）、`ielts-0102.json`（episodic 起）
   - 三批各自 `check-entry.js --existing` **0 错 0 警**
   - `books/ielts.json` 重建到 **2080 词**，主表与分片双向一致
   - `index.html` 注册数已推到 `Array.from({length: 102})`
2. 上架验收脚本（第 3.1 节）当前全绿：6 本已注册词书 **404 风险 0、空白释义 0**。
3. 「漏词条 / 加载不出释义」根因修复（注册漏项）已在 `db3c850` 落地，本次未再引入新问题。
4. 语音基础层修复（同前缀语音兜底、按文本估算时长、长句续读 `resume()`、导出 `voiceFor/estimateMs`）已在 `speech.js` 里。

### 未完成（按优先级）

1. **IELTS 还差 3920 词（196 批）**——这是最大的未做完的事。下一批是 **0103，首词 `error`**。
2. **批次 0103 已有半成品，但只存在于 `/tmp`，不在 git 里**（详见第 9 节）。接手方要么接着做完，要么直接丢弃重做，**不要以为仓库里有它**。
3. **积压提交没推送**（本交接文档这次提交之后是 15 个）——线上 GitHub Pages 目前仍是旧版，用户报的「加载不出释义」在线上看不到修复。必须由用户在真实终端 `git push origin main`（Agent 侧 push 被主机权限拦下，重试无意义）。
4. **sat / cet6 / gaokao 三本书仍未上架**（第 2.2 节）：无主表、未注册，sat 还有 159 个单对象分片的坑。
5. **AI 语音 5 项待办一项没动**（第 3.2 节）：朗读队列、语速/口音持久化、失败分级提示、iOS 真机回归、中文语音缺失降级。已核实 `speech.js` 与 `index.html` 里均无 `speakSequence`，`data-rate` 仍是写死的。

### 接手方的第一步（按这个顺序做）

1. 让用户在真实终端执行 `git push origin main`（14 个积压提交），线上修好才算交付。
2. 跑第 3.1 节验收脚本确认 6 本书仍是「0 缺失 / 0 空白释义」。
3. 跑 `node tools/next-words.js ielts 20`，从批次 **0103（首词 error）** 继续，每批走第 4 节完整流程；批次内先 `find-word.js` 判复用，能搬就搬，搬来的词条必修第 4.2 节列的历史缺陷。
4. IELTS 补完前不要动 sat / cet6 / gaokao；补完后再按第 4.5 节上架这三本。
5. 语音待办（3.2）独立于词书进度，可以在任何批次之间穿插做，但改 `index.html` 后必须跑内联语法检查。

---

## 1. 项目结构

```
/Users/hcc/Desktop/LIZZWORD
├── index.html                     # 单文件前端（约 12000 行，CSS/JS 全内联）；词书注册表 BOOKS 在 6562 行起
├── sw.js                          # Service Worker：离线外壳预缓存 + 分片缓存；BUILD 常量在 11 行
├── manifest.webmanifest           # 支持安装为应用
├── books/
│   ├── BOOK-SCHEMA.md             # 词条字段规范（动手前必读）
│   ├── schema/sample-entry-remedy.json
│   ├── <id>.json                  # 词书主表：entries[{word,index,tier}]，即前端 bookFile
│   ├── prepared/<id>-NNNN.json    # 深度词条分片（生产目标；必须是 JSON 数组）
│   ├── import/filtered/<id>.json  # 源词表（冻结只读）
│   ├── distractors.json           # 干扰项（全书共用）
│   ├── deep/*.js                  # 旧版 TOEFL 运行时分片，一般不动
│   └── lizz/                      # 宠物/店铺/小游戏/语音模块；朗读封装在 lizz/speech.js
└── tools/
    ├── check-entry.js             # 词条校验器（唯一验收标准）
    ├── next-words.js              # 差集求下一批待撰词
    ├── find-word.js               # 全库检索某词是否已有可复用深度词条
    └── make-book-master.js        # 由分片重建 books/<id>.json 主表
```

线上站点：GitHub Pages `https://hcc9886.github.io/LIZZWORD/`（部署 = push 到 main）。
兜底镜像：jsDelivr `https://cdn.jsdelivr.net/gh/hcc9886/LIZZWORD@main/`、raw.githubusercontent、Netlify。

---

## 2. 进度实况（2026-11-21 实扫）

### 2.1 已上架的 6 本词书（`index.html` BOOKS）

| 书 id | 名称 | 源词 | 主表词数 | 本书深度词条 | 分片数 | 状态 |
|---|---|---|---|---|---|---|
| `toefl-core-5000` | TOEFL 核心词汇 3534 | 3534 | 3534 | 3534 | 238 | 完成 |
| `cet4` | CET4 四级 | 4500 | 4509 | 4509 | 221（`cet4-` 110 + `cet4b-` 111） | 完成 |
| `middle` | 初中核心词汇 | 1600 | 1600 | 1600 | 80 | 完成 |
| `daily` | 日常核心词汇 | 3000 | 3000 | 3000 | 150 | 完成 |
| `shanghai-primary` | 上海小学一年级 | 500 | 569 | 569 | 33 | 完成 |
| `ielts` | IELTS 雅思核心词汇 | 6000 | 2080 | 2080 | 102 | **进行中：剩 3920 词 ≈ 196 批，下一批 0103 首词 `error`** |

主表列出的每个词都能在本书分片里取到深度词条（已核：主表与分片双向一致，空白释义 0）。
IELTS 主表首词 `abandon`、末词 `erroneously`，索引 1..2080 连续无重复。

### 2.2 有分片但尚未上架的书

| 书 | 分片 | 深度词条 | 源词 | 未覆盖 | 备注 |
|---|---|---|---|---|---|
| `sat` | 339 | 756 | 3500 | 2836 | **其中 159 片是单对象不是数组**，前端会静默丢弃；上架前必须包装 |
| `cet6` | 7 | 140 | 5500 | 5360 | 无主表 `books/cet6.json` |
| `gaokao` | 12 | 259 | 3500 | 3245 | 无主表 `books/gaokao.json` |

复用潜力（缺口词里别的书已有深度词条、可整条搬过来改写的数量，本会话实测）：ielts **2103**（缺口 3920）、cet6 **4176**（缺口 5360）、gaokao **2853**（缺口 3245）、sat **1112**（缺口 2836）。
全库去重后有深度词条的词共 **8406** 个。

>IELTS 缺口里一半以上能直接从别的书搬，所以后面 196 批的主要工作量在「修历史缺陷 + 改结构」，不是从零撰写。每批先跑 `find-word.js`，能搬就搬。

### 2.3 建议的任务顺序

1. IELTS 从批次 **0103** 继续生产（下一批首词 `error`），每批 20 词，直到 6000 词补完。
2. IELTS 补完后：SAT 分片数组化 + 生成主表 + 上架，再补 2836 词；然后 CET6、高考。
3. 语音待办见 3.2（朗读队列、语速口音持久化、失败分级提示、真机回归）。
4. 历史存量词条的风格清洗不做要求（校验器已接受，别为了清零去改老批次）。

---

## 3. 用户报的三个问题：根因与现状

### 3.1 「漏了很多词条」/「有些单词加载不出释义」——已修（提交 db3c850）

根因不是内容缺失，而是**注册漏了**：前端只加载 `BOOKS[].preparedFiles` 里逐个列出的分片文件。
- TOEFL 主表 3534 词，但 `preparedFiles` 只写了 1 片 → 3519 词点不出释义。现已补齐 238 片。
- IELTS 当时已产出 99 片 / 2020 条深度词条，但整本书没注册、也没有主表 → 主页看不到这本书。现已新增 `books/ielts.json`、BOOKS 条目、B2/C1 推荐、`sw.js` 预缓存。（本会话结束时为 102 片 / 2080 词。）

改完注册后必须跑的验收脚本：

```bash
node -e '
const fs=require("fs"),path=require("path");
const t=fs.readFileSync("index.html","utf8");
const i=t.indexOf("BOOKS = ["); const j=t.indexOf("\n    ];", i);
const src=t.slice(i+"BOOKS = ".length, j+6);
const BOOKS=eval("(function(){var BOOK_FALLBACK=null;var WORDS_FALLBACK={groups:[]};return "+src+";})()");
const disk=new Set(fs.readdirSync("books/prepared"));
for(const b of BOOKS){
  const files=(b.preparedFiles||[]).map(f=>path.basename(f));
  const absent=files.filter(f=>!disk.has(f));
  const master=JSON.parse(fs.readFileSync(b.bookFile.replace(/^\.\//,"books/"),"utf8"));
  const have=new Set();
  for(const f of files){let d;try{d=JSON.parse(fs.readFileSync("books/prepared/"+f,"utf8"))}catch(e){continue}
    (Array.isArray(d)?d:[d]).forEach(e=>e&&e.word&&have.add(String(e.word).toLowerCase()));}
  const shallow=(master.entries||[]).filter(e=>!have.has(String(e.word).toLowerCase()));
  console.log(b.id,"| 分片",files.length,"| 分片缺失",absent.length,"| 主表",master.entries.length,"| 无深度词条",shallow.length);
  if(absent.length)console.log("   404风险:",absent.slice(0,5).join(" "));
  if(shallow.length)console.log("   空白释义:",shallow.slice(0,5).map(x=>x.word).join(" "));
}'
```

浏览器实测办法（本地起服务，注意先清 Service Worker 缓存）：

```bash
nohup python3 -m http.server 8123 --bind 127.0.0.1 >/tmp/http.log 2>&1 &
# 打开 http://127.0.0.1:8123/index.html?bust=<随机数>
# 控制台：LIZZWORD_DEBUG.switchBook("ielts") 之后看 LIZZWORD_DEBUG.words.length 是否为 2080
```

三类残留风险要记住：
1. **分片必须是数组**——`loadBookBundle` 里 `if (Array.isArray(data)) preparedSlots[index] = data;`，单对象会被静默丢弃（sat 正踩在这上面）。
2. **主表词数 > 分片覆盖词数**就会出现空白释义；`tools/make-book-master.js` 故意只收录「已有深度词条」的词来防这一点。
3. **Service Worker 旧缓存**：用户（以及本地测试浏览器）可能仍在用旧版 `speech.js` / 分片——本次实测就命中过，清掉 caches 才拿到新文件。只有数据结构变更时才把 `sw.js` 的 `BUILD` 从 `v1` 升 `v2`；升 BUILD 会删除用户已下载的离线包，平时别动。

### 3.2 AI 语音——基础层已修，剩下这些归你们

已改（`books/lizz/speech.js`，提交 db3c850 + bbce0aa）：
- `pickVoice`：只有英文才允许兜底到 en-US/en-GB；中文等其它语言只用同前缀语音，避免用美音读中文。
- 朗读结束兜底改为**按文本长度估算**（`estimateMs`），并取「调用方上限与估算值的较大者」。原来固定 3 秒（调用方还传 2.5 秒），长句读一半就被判定结束、按钮提前复位。
- 朗读期间周期性 `resume()`，规避 Chrome 约 15 秒后静默停止长句。
- 导出 `voices / voiceFor / estimateMs`，便于做语音选择与自检。

待办（按性价比排序；2026-11-21 晚已落地 1/2/3/5，4 仍需真机）：
1. ✅ **朗读队列**：`LZSpeech.speakSequence([{text, lang, rate}])` 已加；单条失败继续下一条，用户主动取消才整体停；词卡新增「连读（词 → 例句 → 释义）」。
2. ✅ **语速与口音偏好持久化**：存 `lizzword_speech_v1`（rate 0.7/0.9/1.1，accent us/uk），词卡发音区有下拉设置；`speakBtn` 默认跟随偏好，英/美对照按钮固定口音。
3. ✅ **失败原因分级提示**：`index.html` 的 `onFail` 已按 `unsupported / timeout / interrupted` 分级；`interrupted` 静默。
4. ⬜ **iOS / Safari 真机回归**：解锁依赖首次手势里的 `resume()`（已挂 pointerdown），需真机验证一次。
5. ✅ **中文语音缺失降级**：连读时 `voiceFor("zh-CN")` 为空且语音列表非空，则跳过中文并提示安装中文语音包。

### 3.3 未跟踪的历史 scratch 文件

`git status` 里这些未跟踪项是历史遗留，**默认不提交也不删除**：
`.trae-html-share-packages/`、`books/import/english-vocab-8/`、`books/import/filtered/_quality-audit.md`、`books/lizz/DESIGN-shop-and-study.md`、`books/lizz/INTEGRATION.md`、`books/lizz/account-mock.js`、`books/lizz/account-preview.html`、`books/lizz/shop-preview.html`、`books/lizz/sql/`、`books/prepared/entry-*.json`、`tools/build-0117c.js`、`tools/data-0117c-*.js`、`tools/gen-daily-0121.js`。
`books/prepared/_tmp_*.json` 是老流水线中间产物，扫描时必须过滤。

---

## 4. 每批 20 词的完整流程（以 IELTS 为例）

### 4.1 取下一批词

```bash
node tools/next-words.js ielts 20
# 本次交接时的输出（批次 0103）：
# error, erupt, eruption, escalate, escalator, especially, essay, essence,
# essential, essentially, establish, establishment, estate, esteem, estimate,
# estivation, estrange, estuary, eternal, ethereal
```

### 4.2 判定复用还是新撰

```bash
node tools/find-word.js enrich enroll entity
# 或 node tools/find-word.js --file /tmp/wordsNN.json    （文件为单词数组或逗号分隔）
```

复用的词条要**整条搬进本书分片**再修结构问题（跨书重复允许，同书重复禁止）。历史片常见缺陷：
- `scene` 缺中文铺垫；英文句里目标词出现不止一次；含阿拉伯数字
- `forms[].form` 混入中文，或 form 等于原形
- `similar` 自引用目标词、同组内条目重复、tag 含大写字母
- `semanticMap.chain` 不等于 6 项、`branches` 不等于 5 条、分支没回指 senses 编号
- `etymology.items[].era` 不是全大写
- `derivatives` 把目标词本身或屈折形式列为派生词
- `mnemonics.abstract` 不等于 3 条（应与 senses 前 3 项的 why / whyCN 一一对应）

### 4.3 撰写

结构照最近上线的成片抄，例如 `books/prepared/ielts-0102.json`。硬约束（详见 `books/BOOK-SCHEMA.md`）：
- 顶层 **22 键、顺序固定**：`word, ipa_uk, ipa_us, definition_zh, definition_en, core_image, scene, sceneCN, pos, collocations, forms, derivatives, senses, etymology, similar, mnemonics, examples, dict_mnemonic, root, sensesIntro, semanticMap, affixes`
- 中文字段：必须含中文、只用简体、不能出现连续 6 个及以上英文单词（校验器直接判错）
- 英文字段：不能出现中文
- `senses` 2–10 组，每组键集合与顺序固定，编号从 `01` 连续
- `collocations` 4–7 条｜`examples` 恰好 3 条｜`etymology.items` 5–6 段｜`affixes.items` 8–12 条｜`affixes.latinEntries` 0–7 条
- `similar` 恰好 2 组，标题固定为 `LOOK-ALIKE` 与 `NEAR MEANING`，每组条目 ≥2（成片惯例 3 条）
- `mnemonics.normal` 恰好 5 条、`mnemonics.abstract` 恰好 3 条；`M(en, cn)` 参数顺序不能颠倒
- `sceneCN` 必须含「第 N 个义项」，且 N 在 senses 范围内
- 词条正文用 JS 单引号字符串书写，因此不要出现撇号（`does not` 而不是 `doesn't`）；不要全角空格 / 零宽字符

### 4.4 校验 → 装片 → 更新主表与注册

```bash
node tools/check-entry.js books/prepared/ielts-0103.json --existing   # 必须 0 错 0 警
node tools/make-book-master.js ielts                                  # 重建 books/ielts.json
# 再手工改 index.html:6615，IELTS 那条的 Array.from({length: 102}) 改成 103
git add books/prepared/ielts-0103.json books/ielts.json index.html
git commit -m "ielts: add entries (batch 0103) error 起 20 词"
```

提交信息沿用现有风格：`ielts: add entries (batch 00NN) <首词> 起 20 词`。
`tools/make-book-master.js` 会保留主表原有的 name / intro；要改文案用 `--name/--intro`。

**每次改完注册都要跑内联语法检查**（`index.html` 是一整块内联 JS，改坏就整站白屏）：

```bash
node -e 'const h=require("fs").readFileSync("index.html","utf8");(h.match(/<script>[\s\S]*?<\/script>/g)||[]).forEach((b,i)=>{try{new Function(b.replace(/<\/?script>/g,""))}catch(e){console.log("script",i,"FAIL",e.message)}});console.log("inline scripts OK")'
```

### 4.5 上架一本新书（sat / cet6 / gaokao 待做）

1. 把该书全部分片包装成数组：`{...}` → `[{...}]`，逐片过 `tools/check-entry.js`。
2. `node tools/make-book-master.js <id>` 生成 `books/<id>.json`。
3. `index.html` BOOKS 新增条目，照 IELTS 那段写（`bookFile` / `preparedFiles` / `distractorsFile` / `dailyOptions: [5,10,15,20]` / `fallback: null`）。分片跳号时用 IIFE + `missing` Set 过滤（见 TOEFL / CET4 写法），不要留 404。
4. `sw.js` 的 `SHELL_FILES` 加一行 `./books/<id>.json`（`/books/prepared/` 已在 DATA_PREFIXES 内）。
5. `vocabBookRecommendations(level)`（`index.html` 9784 行附近）把新书 id 加进对应 CEFR 档候选。
6. 跑 3.1 验收脚本 + 内联语法检查：

```bash
node -e 'const h=require("fs").readFileSync("index.html","utf8");(h.match(/<script>[\s\S]*?<\/script>/g)||[]).forEach((b,i)=>{try{new Function(b.replace(/<\/?script>/g,""))}catch(e){console.log("script",i,"FAIL",e.message)}});console.log("内联脚本检查完成")'
```

主表 `tiers` 历史上有两种写法（`[{id,name,count}]` 与 `[["核心",0,N]]`），前端都能读；新书照 `books/ielts.json` 即可。

---

## 5. 校验器要点（`tools/check-entry.js`，只读）

```bash
node tools/check-entry.js <文件或目录> [更多文件/目录] [--existing] [--json]
```

- `--existing`：跳过「与已有词库重名」检查。跨书复用场景必须带；**同书重名仍会报**。
- 常见 ERROR：中文段里连续英文单词、`chain` 不等于 6、`branches` 不等于 5、顶层键数或顺序不对、`M(en, cn)` 参数顺序颠倒、出现非简体中文字符。
- 常见 WARN：`collocations` 少于 4 或多于 7、`derivatives` 少于 2、`similar[].tag` 含大写或超 35 字符、`chain` 项不是全大写短词。
- 目标是 **0 错 0 警**。注意：把整个 `books/prepared` 目录一起扫会报出数千条跨书重名与风格警告，那属于存量（跨书重叠本就允许），**不要为了清零去改已上线的老批次**。

---

## 6. 用户明确诉求（原话归纳）

1. 每批 20 词，持续自主推进，**不要每轮都问**：「你目前自己推动，无需询问我」「推完了就接着下一本词书」。
2. 词条必须是**详细拓展词条**（22 键深度词条），不接受简版卡：「记住要详细的拓展单词」。
3. 不同书之间可以有重叠词，**同一本书内不允许重复**：「不同的书重叠的词汇没事，同一本不可以」。
4. CET4 四级、小学一年级优先补全 → 已完成。
5. 当前优先级：**IELTS 继续推完**（剩 3920 词）；之后再补 sat / cet6 / gaokao 并上架。
6. 每批都要存到 GitHub：「还有记得放到 github」「然后都存到 github」。

---

## 7. 推送与线上验证

- 本地 main 领先 origin/main **15 个提交**（含本交接文档这次提交；接手时请用 `git rev-list --count origin/main..HEAD` 实测）。最近的三个雅思批次是 `3106b74`（0100 enrich）、`a22c3e0`（0101 entomologist）、`94722c5`（0102 episodic）；更早还有 `db3c850`（词条注册 + 语音兜底）、`bbce0aa`（朗读时长）、`889f4c9`（流水线工具 + 雅思主表）。
- **线上 GitHub Pages 目前完全没有这些内容**：用户看到的仍是「加载不出释义」的旧版。这一步不完成，前面所有修复都等于没发生。
- Agent 侧 push 被主机权限分类拦下，**不要反复重试、不要换姿势绕开**。做法：明确告诉用户在真实终端执行
  ```bash
  cd /Users/hcc/Desktop/LIZZWORD && git push origin main
  ```
- 推送后验证线上（Pages 有缓存，可能要等几十秒到几分钟，且可能短暂回吐旧字节）：
  ```bash
  curl -sI https://hcc9886.github.io/LIZZWORD/books/ielts.json | head -1
  curl -s  https://hcc9886.github.io/LIZZWORD/books/ielts.json | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).entries.length))'
  # 期望 2080
  ```

---

## 8. 交付自检清单（每批一次）

- [ ] `node tools/next-words.js <书> 20` 与本批词表完全一致（无重复、无跳词）
- [ ] `node tools/check-entry.js books/prepared/<书>-NNNN.json --existing` → 0 错 0 警
- [ ] 本书分片内单词不重复（同书重名 = 0）
- [ ] `node tools/make-book-master.js <书>` 后主表词数 = 分片覆盖词数
- [ ] `index.html` 的 `preparedFiles` 数量已更新；3.1 验收脚本无 404 风险、无空白释义
- [ ] `git status --porcelain` 只有本次产物
- [ ] 已 commit（信息含批次号与首词）；需要上线时提醒用户 push
- [ ] `git rev-list --count origin/main..HEAD` 报出的积压数已同步告知用户（积压越多，线上与本地差得越远）

---

## 9. 踩过的坑（别重复）

1. 断点靠记忆推断 → 曾重复产出 14 个分片。**一律实扫**。
2. 分片可能是数组也可能是单对象，读取要 `Array.isArray(j) ? j : [j]`。
3. 分片编号 ≠ 进度：sat 339 个文件只覆盖 756 词；跳号、回填都是历史正常状态。
4. `books/prepared` 下还有 `_tmp_*`、`entry-*.json`、`dedup-removed.json`、`toefl-core-5000-duplicate-positions.json` 等非分片文件，扫描必须过滤（只认 `<书>-NNNN.json`）。
5. 删文件用 `node -e 'fs.unlinkSync("...")'`，别用会被沙箱回收桶干扰的方式。
6. Bash 工具的工作目录在两次调用之间会保留，别用 `cd` 串联；路径是 `/Users/hcc/Desktop/LIZZWORD`。
7. 浏览器测试时 Service Worker 会吐旧缓存：验前端改动前先清 caches 再刷新，否则会把「已经生效」误判成 bug。
8. `books/lizz/account-config.js` 里只有公开的 Supabase url / publishable key；**任何前端文件都不能出现 service_role key**。
9. 不要改：`books/toefl-core-5000.json`、`books/deep/*.js`、`books/import/filtered/*.json`（冻结源表）、已上线的旧批次分片、`tools/check-entry.js`。
10. `git fsck` 报 dangling object 是沙箱移动临时对象造成的，属正常，不要去「修复」。
11. 分片编号**不一定纯数字**：`books/prepared/gaokao-0000a.json` 就带字母后缀。用 `^<书>-\d{4}\.json$` 过滤会漏词，应该用 `^<书>-\d{4}[a-z]?\.json$`。
12. 验收脚本里的 `bookFile` 带 `./books/` 前缀，取路径时用 `path.basename`，别用 `replace(/^\.\//,"books/")`（会变成 `books/books/...`）。

---

## 10. 批次 0103 的在制品（只存在于 /tmp，不在 git 里）

上一个会话在写 IELTS 批次 0103 时被用户打断，产物全在 `/tmp` 下，**没有 commit、没有装片**。重启机器或清理 /tmp 就全没了。接手方要么接着做完，要么删掉从头做——先跑 `node tools/next-words.js ielts 20` 确认仓库仍是 2080 / 102 片。

`node tools/find-word.js` 对这一批的判定：**共 20 词，可复用 12、需新撰 8**。下表是本次交接前逐条跑 `check-entry.js` 实测出来的状态。

| 状态 | 词 | 说明 |
|---|---|---|
| 复用、**已合格**（9） | error, especially, essay, essential, essentially, establish, establishment, estate, estimate | `/tmp/r-<词>.json`，可直接进片 |
| 复用、**仍不合格**（3） | erupt, eruption, estuary | 三个都是 `semanticMap.branches[*].senses` 用了 `S1` 式写法（各 5 条 ERROR），要改成零分义务项号（`"01"`、`"01 · 03"`）；estuary 另有 4 条 WARN：`similar[].tag` 含大写或超 35 字符 |
| 新撰、**JSON 解析失败** | escalate | `/tmp/n-escalate.json` 第 104 行缺 `]`（`similar.groups` 闭合写成了 `}`），先修语法再校验 |
| **完全未撰写**（7） | escalator, essence, esteem, estivation, estrange, eternal, ethereal | 需从零写 |

接手时建议的复现步骤：

```bash
ls /tmp/r-*.json /tmp/n-*.json          # 看还在不在
node tools/next-words.js ielts 20       # 必须还是 error 起那 20 个词
node tools/find-word.js --file <本批词表>   # 重新判定复用/新撰，不要相信本表
node tools/check-entry.js /tmp/r-erupt.json /tmp/r-eruption.json /tmp/r-estuary.json --existing
```

装片脚本按源词表顺序拼接（顺序为 `error, erupt, eruption, escalate, escalator, especially, essay, essence, essential, essentially, establish, establishment, estate, esteem, estimate, estivation, estrange, estuary, eternal, ethereal`）：

```python
import io,json
order=["error","erupt","eruption","escalate","escalator","especially","essay","essence",
       "essential","essentially","establish","establishment","estate","esteem","estimate",
       "estivation","estrange","estuary","eternal","ethereal"]
out=[]
for w in order:
    for pat in ("/tmp/r-%s.json","/tmp/n-%s.json"):
        p=pat%w
        try: d=json.load(io.open(p,encoding="utf-8"))
        except FileNotFoundError: continue
        assert d["word"]==w,(p,d["word"]); out.append(d); break
    else: raise SystemExit("missing "+w)
with io.open("books/prepared/ielts-0103.json","w",encoding="utf-8") as f:
    json.dump(out,f,ensure_ascii=False,indent=2); f.write("\n")
```

### 本批次反复踩到的撰写 bug（务必避开）

1. **`similar.groups` 数组少一个 `]`**——手写时每批几乎必犯，报错形如「Expected ',' or ']' after array element」。写完 `similar` 先单独 `node -e 'JSON.parse(...)'` 一次。
2. `similar` 条目里误写 `"isa": ""` 代替 `"ipa"`，校验器会连报 4 条（缺 ipa、空字段、多余字段、子键顺序）。
3. `meaningCN` / `definitionCN` 里混进英文碎片（如「向内； onto 之上」），直接判中英混杂。
4. `derivatives` 把目标词自身写成派生词（epoch→epoch、equate→equation of）——必须换成真实派生词。
5. 场景句里目标词出现两次会计数重复（`countOccurrences` 按 `forms` 逐个统计，屈折形式互为子串会双计）。**场景句只用裸原形**。
6. 中文引用英文短语要用「」包起来，否则连续 ≥6 个英文单词判错。
