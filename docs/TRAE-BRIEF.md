# LIZZWORD · 产品意见条款与 Trae 交接书

> 版本：2026-11-21 v1
> 读者：接手前端/产品/商业化改造的 Trae（或任何后续 AI/工程师）
> 词条生产侧另有 `HANDOFF.md`（每批 20 词流水线），本文只谈**产品、体验、词书矩阵、学习模式、个性化、付费模式**。
> 本文所有数字均为 2026-11-21 本地实扫；接手后请用第 12 节的命令复测，不要照抄。

---

## 0. 一句话结论

站点「漏词条 / 点开没有释义」**不是内容丢了，而是线上版本旧 + 历史注册表漏项**：

- 本地 6 本已注册词书**全量审计 0 缺失、0 空释义、0 重复、0 解析错误**（6.1 节命令可复现）。
- 线上 GitHub Pages 落后本地 **16 个提交**，且线上 `books/ielts.json` 目前是 **404**——雅思整本书在线上根本不存在；TOEFL 历史上也因注册表只写 1 片导致 3519 词点不出释义（已在 `db3c850` 修复，但没推上去）。
- 因此第一优先级永远是：**用户在真实终端执行 `git push origin main`**。不推送，下面所有改造线上都看不见。

产品侧真正缺的是：**入门问卷 / 个性化学习计划 / 多学习模式 / 免费-付费分层 / 其余词书的源词表**。这四件事是本文的主体。

---

## 1. 现状盘点（接手前必须知道）

### 1.1 技术形态

| 项 | 现状 |
|---|---|
| 形态 | 纯静态站，单文件 `index.html`（约 12000 行，CSS/JS 全内联，582 KB）+ 本地 JSON 词库 |
| 发布 | GitHub Pages `main` 分支根目录；备用 jsDelivr / raw / Netlify |
| 后端 | 仅 Supabase（`books/lizz/account-config.js` 公开 url + publishable key），账号目前是**本地 mock + 云端可选**，无付费、无权益表 |
| 离线 | `sw.js`（SHELL 预缓存 + 分片缓存，BUILD 常量在 11 行）+ `manifest.webmanifest` + `books/lizz/pwa.js` |
| 入口 | `index.html`（主站）、`games.html`（4 个小游戏） |
| 词库 | `books/<id>.json` 主表 + `books/prepared/<id>-NNNN.json` 深度词条分片（数组，22 键） |
| 注册表 | `index.html` 里 `BOOKS = [...]`（约 6562 行起），前端只加载 `preparedFiles` 列出的分片 |
| 校验 | `tools/check-entry.js`（只读，唯一验收标准）、`tools/next-words.js`、`tools/find-word.js`、`tools/make-book-master.js` |

### 1.2 已有功能（别重复造）

- 首页：今日统计、推荐词书、继续学习、Lizz 宠物入口、账号入口（`index.html:9498`）、商店入口。
- 词书库：6 本已上架 + 词书切换（`switchBook`，`index.html:12079`）。
- 学习：预习 → 认词 → 回想 → 拼写 → 例句（`view-study` / `view-preview`，状态机在 10200–10700 行附近）。
- 复习：SRS 四轮复习、到期池、完成页（`renderReviewView` 9081、`renderReviewDone` 9407）。
- 词汇量测试：CEFR 估算 + 推荐词书（`vocabBookRecommendations`，9772 行）。
- 词卡：7 个标签页（释义/义项/语义地图/词源/词缀/近反义/记忆法），发音按钮 6679–6684。
- 小游戏：翻牌配对、快闪辨义、字母重组、听音选词（`games.html` + `books/lizz/games/`）。
- 宠物/商店/喂食/评级：`books/lizz/lizz*.js`（积分体系见 `DESIGN-shop-and-study.md`）。
- 记忆卡、学习计时、新手引导：`flashcard.js`、`study-timer.js`、`tutorial-flow.js`。
- 语音：`books/lizz/speech.js`，已修 getVoices 延迟、iOS resume、长句时长估算、voiceFor 兜底；仍缺朗读队列/语速口音持久化/失败分级（见第 9 节）。

### 1.3 数据现状（2026-11-21 实扫）

| 书 id | 名称 | 源词 | 主表词数 | 深度词条 | 分片 | 状态 |
|---|---|---|---|---|---|---|
| `toefl-core-5000` | TOEFL 核心词汇 3534 | 3534 | 3534 | 3534 | 238 | 完成 |
| `cet4` | CET4 四级 | 4500 | 4509 | 4509 | 221 | 完成 |
| `middle` | 初中核心词汇 | 1600 | 1600 | 1600 | 80 | 完成 |
| `daily` | 日常核心词汇 | 3000 | 3000 | 3000 | 150 | 完成 |
| `shanghai-primary` | 上海小学一年级 | 500 | 569 | 569 | 33 | 完成 |
| `ielts` | IELTS 雅思核心 | 6000 | 2080 | 2080 | 102 | 进行中，剩 3920 词（196 批），下一批 0103 `error` 起 |
| `sat` | SAT | 3500 | 无 | 756 | 339 | 未上架；**159 片是单对象不是数组**，前端会静默丢弃 |
| `cet6` | CET6 | 5500 | 无 | 140 | 7 | 未上架，无主表 |
| `gaokao` | 高考 | 3500 | 无 | 259 | 12 | 未上架，无主表 |

源词表只有 8 份：`books/import/filtered/{cet4,cet6,daily,gaokao,ielts,middle,sat,shanghai}.json`。
用户点名但**仓库里没有源词表**的书：中考、专升本、自考、中高职、医护英语、PETS、FCE、考研考博、BEC、AB 级、留学、英专、新概念、COCA、KET/PET、商业法律、PTE、自学考试英语、词缀/词组类。处理办法见 3.2。

---

## 2. 用户原话与真实诉求（2026-11-21）

1. 「目前漏了很多词条，你需要快速排查补缺，有一些单词加载不出来释义」→ 先修加载链路（已定位为推送 + 注册表，见第 0/6 节）。
2. 「AI 语音功能也要完善」→ 第 9 节的 5 项待办。
3. 「为每一个词按照原有的逻辑加上每个生成单词 + 释义，每个词有 22 个字段（音标、词性、英文释义、中英双解、义项分组、近义/形近组、例句、词源）」→ 词条标准不动，继续按 `BOOK-SCHEMA.md` 生产。
4. 「已经完成的就不用再动了」→ 已上架 6 本不返工；老批次风格警告不清零。
5. 「没完成的词书有这些：中考常用英文词汇、雅思、日常生活、四级、六级、专升本、自考、中高职、医护英语、日常英语、PETS、FCE、考研考博、BEC、AB 级、留学、英专、新概念、COCA、KET/PET、商业法律、PTE、自学考试英语，还有词缀词组词书」→ 词书矩阵见第 3 节。
6. 「提出各种改善和加强的意见，和各种不同的学习模式」→ 第 7、8 节。
7. 「按照开始时的问答来分辨用户适合什么方式，把它变成私人定制版」→ 第 8 节入门问卷 + 计划引擎。
8. 「为零基础准备的最简单基础和容易学的词书」→ 第 4 节。
9. 「先做一本意见条款放在里面交给 Trae」→ 本文。
10. 「先推词书，我提的所有词书和你能做到的先做，不能做的做一个可以交接的让我交接给 Trae」→ 第 3 节可行性矩阵 + 第 11 节任务单。
11. 「还有付费模式和免费模式」→ 第 10 节。

---

## 3. 词书矩阵与可行性

### 3.1 现在就能做（有源词表，只差生产）

| 书 | 缺口 | 说明 | 优先级 |
|---|---|---|---|
| IELTS | 3920 | 下一批 0103 `error` 起；缺口一半可从其他书复用（实测 2103 词可搬） | P0（用户第一优先） |
| SAT | 2836 | 先把 339 片单对象包装成数组、生成主表、注册、加 `sw.js`，再补词 | P1 |
| CET6 | 5360 | 7 片/140 词；复用潜力 4176 | P1 |
| 高考 | 3245 | 12 片/259 词；复用潜力 2853；另需确认「中考」与 `middle` 的关系 | P1 |

### 3.2 自建词书（2026-11-21 晚已生成并上架）

用户要求「没有词表你也生成，不要重复，确保是常用标准词汇」。处理方式：`tools/build-exam-books.js`
用「现有 8,426 条深度词条池 + 自建领域词」生成源词表，17 本书之间**严格分区、零重复**，
与已上架 6 本的重叠按既有规则允许。生成时对复用词条做机械修整（S1→01、词形去中文、
场景补中文铺垫、近义标签小写），修不好的一律不进分片，所以新书 0 错误。

| 书 id | 名称 | 上架词数 | 源表词数 | 说明 |
|---|---|---|---|---|
| `english-major` | 英专英语核心词汇 | 398 | 400 | C1–C2 高阶 |
| `kaoyan` | 考研英语核心词汇 | 398 | 400 | 阅读写作高频 |
| `study-abroad` | 留学英语核心词汇 | 347 | 350 | 申请 + 校园 + 学术写作 |
| `pte` | PTE 学术英语核心词汇 | 350 | 350 | 学术同义替换 |
| `fce` | FCE 剑桥第一证书核心词汇 | 399 | 400 | B2 搭配 |
| `bec` | BEC 商务英语核心词汇 | 341 | 350 | 会议/谈判/财务/物流 |
| `medical` | 医护英语核心词汇 | 282 | 320 | 临床/解剖/用药/公卫 |
| `business-law` | 商业法律英语核心词汇 | 295 | 320 | 合同/诉讼/公司/贸易 |
| `coca` | COCA 高频词 | 550 | 550 | 语料高频 |
| `pets` | PETS 核心词汇 | 400 | 400 | 2–4 级 |
| `zhuanshengben` | 专升本英语核心词汇 | 350 | 350 | 四级难度 |
| `zikao` | 自考英语核心词汇 | 320 | 320 | 自考（二） |
| `self-study` | 自学考试英语核心词汇 | 280 | 280 | 自考（一） |
| `new-concept` | 新概念英语核心词汇 | 400 | 400 | 自建，非教材官方 |
| `zhonggaozhi` | 中高职英语核心词汇 | 350 | 350 | 初中～四级之间 |
| `ab` | AB 级英语应用能力核心词汇 | 219 | 219 | 日常 + 职场基础 |
| `ket-pet` | KET/PET 剑桥通用五级核心词汇 | 480 | 480 | A2–B1 |

词书已扩容到 **30 本、33,417 词**（24 本自建书 + 6 本原有），全部通过 `node tools/audit-books.js`。

**必须说明的边界**：这些是「自建整理版」，不是官方考纲原表；书名与简介都写了「自建整理」。
领域词（医护 80、商业法律 80、BEC 36、留学 32）排在源表最前，还没写深度词条的词只进源表，
后续批次优先补写，补上后主表自动收录。

重新生成：`node tools/build-exam-books.js`（预览）/ `--write`（写源表 + 分片 + 主表）。

### 3.3 仍需用户提供官方词表的情况

| 书 | 缺口 | 阻塞点 | 建议 |
|---|---|---|---|
| 中考常用英文词汇 | 待定 | 与 `middle`（初中核心 1600）高度重叠，需确认是"中考大纲"还是"初中核心" | 可先用 `middle` 改名/扩词；要精确大纲需一份官方词表 |
| 专升本 / 自考 / 自学考试英语 / 中高职 | 各 2000–4000 | 无源词表；各省大纲不同 | 用户提供目标省份/院校大纲；否则做"通用版" |
| 医护英语 / 商业法律 / 留学 / 英专 | 各 2000–5000 | 无词表；专业词需领域审校 | 先做 300–500 词"高频精选版"，标注非官方 |
| PETS / FCE / KET/PET / BEC / AB 级 / PTE | 各 1500–5000 | 考试官方词表有版权/授权问题 | 用公开大纲词 + 自建近似版；正式版需授权 |
| 新概念 / COCA | — | 明确版权（教材/语料库） | **不建议**直接复刻；可做"按词频分级的通用版" |
| 考研考博 | 5500 | 无词表 | 可用公开大纲（如考研英语大纲）由用户提供一份 |
| 词缀/词组词书 | 300–800 条 | 词缀数据已在每词 `affixes` 字段里，可反向聚合生成 | 可自动生成：从 8406 条深度词条的 `affixes.items` 去重聚合 |

**给 Trae 的处理原则**：没有源词表就不硬造"官方词书"，改成「XX 高频精选（自建）」并在书名/简介里标注来源与规模；把缺表清单列进后台/文档，等用户补表。

### 3.3 跨书复用规则

- 跨书重复允许，同书重复禁止（用户原话）。
- 复用词条必须整条搬进目标书分片，再修历史缺陷（`HANDOFF.md` 4.2 节 8 类）。
- 全库去重后已有 8406 个词的深度词条可用；新书优先复用，再补写。
- 同一词在不同书的 `index`/`tier` 可以不同，不要为了复用改老书。

---

## 4. 零基础词书（用户点名要的第一本新书）

### 4.1 定位

- 面向完全零基础/启蒙（儿童或成人扫盲），**不追求词量大，追求"看得懂、读得出、用得上"**。
- 建议 id：`zero-basic`，名称「零基础启蒙 300 词」，先做 300 词（可扩到 500）。
- 选词标准：具体名词（家庭/身体/食物/颜色/数字/动物/天气/学校/时间）、高频动词（be/go/get/make/come/take...）、高频形容词（big/small/hot/cold...）；**避开抽象词、低频词、长难词**。
- 来源：优先从 `shanghai-primary`（569）+ `middle`（1600）+ `daily`（3000）里挑最简单的词复用词条；缺口再新撰。

### 4.2 与普通词书不同的呈现

- 词卡首屏只显示：图（emoji/SVG 均可）+ 单词 + 音标 + 一句中文 + 发音按钮；22 字段仍保留，但默认折叠"进阶"区。
- 每个词配 1 张图/emoji（新字段或复用 `core_image`），1 条例句（≤6 词），1 个中文记忆钩子。
- 学习模式：听音选图、看图选词、跟读、字母拖拽；不做拼写长词、不做词源。
- 每日 5–10 词，强反馈（星星/连击/宠物喂食），弱化"考试"。

### 4.3 上架步骤（沿用现有流程）

1. 生成 `books/import/filtered/zero-basic.json`（300 词，去重、按主题分组）。
2. 生产 `books/prepared/zero-basic-0001.json` …（每片 20 词，22 键，`check-entry.js --existing` 0 错 0 警）。
3. `node tools/make-book-master.js zero-basic` → `books/zero-basic.json`。
4. `index.html` BOOKS 加条目（`bookFile`/`preparedFiles`/`distractorsFile`/`dailyOptions`/`fallback: null`），`sw.js` SHELL 加一行。
5. 推荐函数 `vocabBookRecommendations` 把 `zero-basic` 放进 A1/入门档首位。

---

## 5. 给 Trae 的总体改造路线（按依赖排序）

```
P0 修线上 → P0 语音 5 项 → P1 入门问卷 + 学习计划 → P1 学习模式扩展
→ P1 SAT/CET6/高考上架 → P2 免费/付费分层 → P2 跨端同步/运营后台
```

**顺序理由**：线上不修，用户看到的永远是旧站；问卷和计划是"私人定制"的地基；模式扩展依赖问卷产出的偏好；付费必须建立在"有明确价值差异"之后，否则先收费会劝退。

---

## 6. 加载链路：根因、验收与防回归

### 6.1 本地全量审计（2026-11-21 实测：6 本全绿）

```bash
cd /Users/hcc/Desktop/LIZZWORD
node -e '
const fs=require("fs"),path=require("path");
const t=fs.readFileSync("index.html","utf8");
const i=t.indexOf("BOOKS = ["); const j=t.indexOf("\n    ];", i);
const src=t.slice(i+"BOOKS = ".length, j+6);
const BOOKS=eval("(function(){var BOOK_FALLBACK=null;var WORDS_FALLBACK={groups:[]};return "+src+";})()");
let bad=0;
for(const b of BOOKS){
  const files=(b.preparedFiles||[]).map(f=>path.basename(f));
  const seen=new Map(); let dup=0,err=[],notArr=[],empty=0;
  for(const f of files){
    let d;try{d=JSON.parse(fs.readFileSync("books/prepared/"+f,"utf8"))}catch(e){err.push(f);continue}
    if(!Array.isArray(d))notArr.push(f);
    for(const e of (Array.isArray(d)?d:[d])){
      const w=String(e.word).toLowerCase();
      if(seen.has(w))dup++; else seen.set(w,f);
      if(!e.definition_zh||!String(e.definition_zh).trim())empty++;
    }
  }
  const master=JSON.parse(fs.readFileSync("books/"+path.basename(b.bookFile),"utf8"));
  const mw=(master.entries||[]).map(e=>String(e.word).toLowerCase());
  const missing=mw.filter(w=>!seen.has(w));
  bad+=err.length+notArr.length+dup+empty+missing.length;
  console.log(b.id,"| 分片",files.length,"| 词",seen.size,"| 主表",mw.length,"| 重复",dup,"| 解析错",err.length,"| 非数组",notArr.length,"| 空释义",empty,"| 主表缺词条",missing.length);
}
console.log("TOTAL",bad);'
```

预期：每本重复/解析错/非数组/空释义/主表缺词条全为 0，`TOTAL 0`。

### 6.2 线上状态（必须让用户推送）

```bash
cd /Users/hcc/Desktop/LIZZWORD
git log --oneline -5
git rev-list --count origin/main..HEAD   # 2026-11-21 实测 16
curl -sI https://hcc9886.github.io/LIZZWORD/books/ielts.json | head -1   # 实测 404
```

- Agent 侧 push 被主机权限拦下，**不要重试、不要绕**；明确让用户在真实终端：
  ```bash
  cd /Users/hcc/Desktop/LIZZWORD && git push origin main
  ```
- 推送后 Pages 有缓存，验证：
  ```bash
  curl -s https://hcc9886.github.io/LIZZWORD/books/ielts.json | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).entries.length))'
  # 期望 ≥2080
  ```

### 6.3 防回归（Trae 必须做）

1. **单一数据源**：`preparedFiles` 由脚本生成，不手写。给 `tools/` 加 `sync-registry.js`：扫描 `books/prepared/<id>-NNNN.json`，重写 BOOKS 里该书的 `preparedFiles` 与 `Array.from({length:N})`，并校验每片可解析、是数组。
2. **单对象分片自动包装**：生成主表/注册前统一 `Array.isArray(d) ? d : [d]`，并在 CI 脚本里报错。
3. **主表只收录有深度词条的词**（`make-book-master.js` 已如此），避免空白释义。
4. **加载失败可见**：`loadErrorBanner` 已存在（`index.html`），确保任何分片 404/解析失败都进列表并可重试。
5. **Service Worker**：数据结构变更才升 `sw.js` 的 `BUILD`（v1→v2）；平时别动，升版会清用户离线包。测试前先清 caches，避免旧缓存误判。

---

## 7. 学习模式矩阵（要做的"各种学习模式"）

> 数据都来自 22 字段词条：`senses`、`examples`、`similar`、`semanticMap`、`etymology`、`affixes`、`forms`、`collocations`、`mnemonics`。不要新增前端私有数据格式。

| # | 模式 | 用户价值 | 依赖字段 | 实现要点 | 优先级 |
|---|---|---|---|---|---|
| 1 | 卡片速览 | 认识 | 全部 | 已存在（词卡 7 标签） | 已有 |
| 2 | 回想关（看词想义） | 主动回忆 | `definition_zh`/`senses` | SRS 第一轮已有 | 已有 |
| 3 | 拼写关 | 会写 | `word`/`forms` | 已有写词输入 | 已有 |
| 4 | 听音选词/辨义 | 听力 | `word` + `distractors.json` | 游戏已有，可并入主流程 | P1 |
| 5 | 例句填空 | 语境 | `examples[].en` + `word` | 挖空目标词，干扰项取同长度/同词性 | P1 |
| 6 | 词根词缀拆解 | 记长词 | `root`/`affixes.items` | 拆分高亮 + "同根词"聚合 | P1 |
| 7 | 语义地图 | 一词多义 | `senses`/`semanticMap.chain` | 已展示，可加"选分支"小测 | P2 |
| 8 | 形近/近义辨析 | 防混 | `similar.groups` | 选"哪个是 XX 的意思" | P1 |
| 9 | 跟读评分 | 发音 | `ipa_uk/us` + ASR | Web Speech Recognition（iOS 支持差，需降级为"听-跟读-再听"） | P2 |
| 10 | 造句/写作 | 产出 | `collocations` + LLM | 静态站无 LLM 时用模板+词块拼接；有 Supabase Edge Function 时接模型 | P2 |
| 11 | 考试冲刺 | 应试 | 词书 tier + 倒计时 | 选考试日期 → 每日配额 = 剩余词/剩余天 | P1 |
| 12 | 每日打卡/连击 | 习惯 | 现有统计 | 已有 `wordsToday`，加日历/连击 | P2 |
| 13 | 错词本 | 查漏 | SRS 错误记录 | 记录拼写/选择错误，单独复习池 | P1 |
| 14 | 词书混学 | 跨书 | 多书词池 | 按 CEFR/词频合并，去重 | P2 |
| 15 | 零基础启蒙 | 入门 | 图/音/短句 | 第 4 节专用皮肤 | P1 |
| 16 | 3 分钟快刷 | 碎片 | 已学词 | 限时快闪 + 计分 | P2 |

**统一要求**：每个模式都要有"开始-进行-结算"三态，结算写同一个学习事件流（词、模式、对错、耗时、日期），供第 8 节的计划引擎和付费价值展示使用。

---

## 8. 入门问卷 + 私人定制（用户核心诉求）

### 8.1 问卷（首次进入，30 秒，可跳过）

1. 目标：中高考 / 四六级 / 考研 / 雅思托福 / 职场 / 兴趣 / 零基础。
2. 考试日期（可选）：用于倒计时与每日配额。
3. 每天可投入：5 / 10 / 20 / 30 分钟。
4. 自评基础：完全零基础 / 认识少量词 / 能读简单句 / 四级水平 / 六级以上。
5. 偏好方式（多选）：看图 / 听音 / 拼写 / 例句 / 词根 / 游戏。
6. 记忆习惯：早上 / 晚上 / 碎片时间。
7. 是否愿意每天收到提醒（本地通知，需权限）。

### 8.2 计划引擎（纯前端可先做）

输入：问卷 + 词汇量测试结果（`vocabBookRecommendations` 已有 CEFR 估算）+ 已有学习记录。

输出：

- 主词书 1 本 + 辅词书 0–1 本（跨书混学）。
- 每日任务卡：新词 N（按剩余天数与每天时长估算）+ 复习 M（SRS 到期数）+ 1 个推荐模式。
- 模式配比：零基础 → 看图/听音/跟读；应试 → 填空/辨析/冲刺；兴趣 → 例句/词源/游戏。
- 每周复盘：正确率、留存率、连击、建议调整。

**算法建议**：先用规则引擎（if-else 表），不要一上来做模型；把规则写在独立文件 `books/lizz/plan-engine.js`，输入输出可单测。问卷结果存 `localStorage`（`lizzword_profile_v1`），登录后同步到 Supabase `profiles`。

### 8.3 "私人定制"的边界

- 不承诺"AI 一对一家教"这种需要大模型实时生成的能力（静态站+无后端时做不到）。
- 可承诺：词书选择、每日计划、模式配比、复习节奏、界面密度、提醒时间——这些都能规则化。
- 真正的自适应（根据答题动态调难度）可以后置，先把事件流和统计打点做对。

---

## 9. AI 语音：现状与 5 项待办

现状（`books/lizz/speech.js`，已修 `db3c850` + `bbce0aa`）：

- `pickVoice` 只对英文做 en-US/en-GB 兜底，中文不会拿美音读。
- 朗读结束按文本长度估算（`estimateMs`），取调用方上限与估算值较大者。
- 长句周期性 `resume()`，规避 Chrome 约 15 秒静默停止。
- 导出 `voices / voiceFor / estimateMs`。

待办（按性价比）：**2026-11-21 晚已落地 1–3 与 5，4 待真机。**

1. ✅ **朗读队列 `speakSequence([{text, lang, rate}])`**：单条失败继续，用户取消才整体停；词卡已有「连读」按钮。
2. ✅ **语速与口音持久化**：`lizzword_speech_v1`（0.7/0.9/1.1，us/uk），词卡发音区下拉设置。
3. ✅ **失败分级提示**：`interrupted` 静默、`unsupported` 提示换浏览器、`timeout` 提示装语音包。
4. ⬜ **iOS/Safari 真机回归**：解锁依赖首次手势 `resume()`（已挂 pointerdown），需真机验证。
5. ✅ **中文语音缺失降级**：`voiceFor("zh-CN")` 为空且语音列表非空时跳过中文并提示。

验收：Chrome/Safari/Edge 各测「单词 → 例句 → 中文释义」连读 3 遍不中断；切后台再回来能续读；无语音包时提示明确。

---

## 10. 免费与付费（2026-11-21 决策版）

### 10.1 已定调的三件事（用户拍板）

1. **直接做 App**（iOS/Android 壳 + 现有静态内核），不做独立 Web 会员系统。
2. **免费能完整学完一本**（默认 `zero-basic`，也可以让用户从基础 6 本里任选 1 本），其余书可试学但受每日额度限制。
3. **完整版付费**：全部词书 + 完整深度的词条 + 计划与同步。

### 10.2 词条深度分两档（生产侧的减负）

用户明确「深度词条可以减少一点」，因此词条分两档，**键仍为 22 个、顺序不变**，只压缩篇幅：

| 档位 | 用途 | senses | mnemonics | etymology | affixes | 单条体积 |
|---|---|---|---|---|---|---|
| 标准版（免费可见） | 全部词书的速览 + 核心义项 + 例句 | 2–3 | normal 5 / abstract 3（短句） | 5 段 | 8 条 | ~8–12 KB |
| 完整版（付费） | 词源、词族、近义辨析、语义地图全展开 | 3–6 | 同上但每条 2–3 句 | 5–6 段 | 9–12 条 | ~18–25 KB |

- 生产规则不变：`tools/check-entry.js --existing` 必须 0 错；免费可见部分必须完整可读，不能出现「付费才能看释义」。
- 前端按 `plan` 决定展示深度：免费只展开速览 + 义项 + 例句；词源/词缀/相似词折叠并标「完整版」。

### 10.3 免费版到底给什么（要好用）

| 能力 | 免费 | Plus |
|---|---|---|
| 零基础 300 词 | ✅ 完整（图 + 短句 + 跟读） | ✅ |
| 任选一本基础书完整学完 | ✅ | ✅ |
| 其他书 | 每天 20 个新词，可试读 | 不限 |
| 复习 / 拼写 / 听力 / 错词本 | ✅ | ✅ |
| 专项练习（例句填空/形近/词根） | ✅ 每天 10 题 | 不限 |
| 深度内容（词源/词缀/近义/语义地图，22 字段） | ✅ 全部可见 | ✅ 全部可见 |
| 跟读评分 | 每天 5 次 | 不限 |
| 学习计划与每日任务卡 | 基础版 | 完整版（考试倒计时、自动调量） |
| 每周复盘 | 简版 | 完整报告 + 趋势 |
| 离线整书包 / 跨设备同步 | ❌ | ✅ |

### 10.4 付费增值功能（让人觉得值）

1. **全部 30 本词书 + 每天 40 新词**：广度与额度是最直接的付费理由；词条本身的 22 个字段对所有人可见。
2. **考试冲刺计划**：填考试日期，自动算每日配额、薄弱项补课、倒计时任务卡。
3. **跟读评分 + 发音报告**：逐词评分、常见错音归类（th / v-w / 长短元音）。
4. **离线整书包**：通勤/地铁无网可用，App 内一键下载。
5. **跨设备同步**：手机 + 平板 + 网页进度一致。
6. **每周学习报告**：正确率趋势、掌握曲线、下周建议，可导出图片分享。
7. **自定义词书**：从收藏/错词/教材生词自建一本书，Plus 专属。
8. **AI 造句批改**（后续接服务端模型）：用目标词造句，给语法与搭配反馈。
9. **早鸟/学生价**：年付 ¥98、早鸟 ¥68、学生 5 折。

### 10.5 定价（App 内购）

| 档位 | 价格 | 说明 |
|---|---|---|
| 月付 | ¥12 | 首月 ¥1 试用 7 天 |
| 季付 | ¥30 | 备考周期 |
| 年付 | ¥98（早鸟 ¥68） | 主力，学生 5 折 |
| 买断 | ¥198（早鸟 ¥128） | 含当前全部词书 + 1 年新书 |

App 内购注意：iOS 必须走 IAP（抽成 15–30%），Android 走 Play Billing；Web 只做展示与引导下载，不在 Web 收款可绕开抽成但苹果审核敏感，不建议。

### 10.6 埋点（先做，不然定价靠猜）

事件：`paywall_view`、`checkout_start`、`purchase_success`、`trial_start`、`book_switch`、`drill_start`、`drill_finish`、`weekly_review_open`。
字段：`plan`、`bookId`、`source`、`ts`。本地先写 `lizzword_events_v1`，登录后批量同步 Supabase。

### 10.7 合规

- 大陆上架需备案与主体资质；App 内购按平台规则。
- 自动续费必须提前显著提示、可随时取消；未成年人需监护人同意。
- 隐私政策、用户协议、退款条款缺一不可。

## 11. 产品改善清单（按优先级）

### P0（本周）

1. 用户在真实终端 `git push origin main`，线上验证 `books/ielts.json` 与 `books/manifest.js` 都能取到。
2. 词条深度两档落地：标准版/完整版，前端按 `plan` 展开深度区。
3. 注释埋点：`paywall_view / checkout_start / purchase_success / trial_start / drill_finish`。
4. 分片懒加载：每本书先加载前 15 片（约 200 词）立即可学，其余空闲补齐。

### P1（两周）

5. 每周复盘页：正确率趋势、掌握曲线、下周建议（数据来自事件流）。
6. 免费版「完整学完一本」流程：选书 → 计划 → 结业徽章。
7. 领域词补写：医护 117、商业法律 105、BEC 117、留学 34（源表已有、词条待写）。
8. 考试冲刺计划：考试日期 → 每日配额 → 倒计时任务卡。
9. App 壳（Capacitor/WebView）+ IAP 接入 + 离线整书包。

### P2（一个月）

10. 自定义词书（收藏/错词/生词本）。
11. 跟读评分报告（错音归类）。
12. AI 造句批改（服务端模型）。
13. 学习报告分享图 + 邀请码。
14. 首屏性能：样式与词库注册表拆包、图片/图标压缩、Lighthouse ≥90。
15. 班级/教师端（B2B）。

## 12. 给 Trae 的交接任务单（可直接开工）

### 任务 T1：注册表与加载自检（P0，1 天）

- 新增 `tools/sync-registry.js`：扫描 `books/prepared`，按书过滤 `<id>-NNNN[a-z]?.json`，校验 JSON 数组、词条 `word` 非空、同书去重；输出每书分片清单；可选 `--write` 重写 `index.html` 的 `preparedFiles` 与 `Array.from({length:N})`。
- 新增 `tools/audit-books.js`：实现 6.1 审计，输出机器可读结果，退出码非 0 表示有缺失。
- 验收：`node tools/audit-books.js` 输出 `TOTAL 0`；`git diff` 只动预期行；`index.html` 内联脚本语法检查通过。

### 任务 T2：语音增强（P0，1–2 天）

- `speech.js` 增加 `speakSequence(items, opts)`，返回 Promise；支持 `onItemStart/onItemEnd/onAllEnd/onFail`；`cancel()` 只取消当前队列。
- `index.html` 发音按钮改读 `lizzword_speech_v1`（rate 0.7/0.9/1.1，accent uk/us）；设置面板加控件。
- 失败分级文案；`unsupported` 引导换 Chrome/Edge；`interrupted` 静默。
- 验收：三连读不中断；切后台恢复；无语音包提示；内联语法检查通过。

### 任务 T3：入门问卷与计划引擎（P1，3–5 天）

- 新增 `books/lizz/plan-engine.js`（纯函数 + 单测）、`books/lizz/onboarding.js`（问卷 UI + 存储）。
- 首次进入弹问卷；首页显示"今日任务卡"（新词/复习/推荐模式/预计分钟）。
- 验收：零基础/雅思/考研三种答案组合产出合理计划；跳过问卷走默认；刷新后保留。

### 任务 T4：三个新模式（P1，5 天）

- 例句填空（`examples[].en` 挖空，干扰项同词性同长度）。
- 形近辨析（`similar.groups[0]`）。
- 词根拆解（`affixes.items` + `root` 高亮）。
- 统一事件流 `lizzword_events_v1`（word, mode, correct, ms, at）。
- 验收：每个模式 10 题可完成结算；事件落盘；移动端可点。

### 任务 T5：SAT/CET6/高考上架（P1，2 天）

- SAT：339 片单对象 → 数组（脚本批量），逐片 `check-entry.js`；`make-book-master.js sat`；注册；`sw.js` 加 `./books/sat.json`；推荐位加。
- CET6/高考同理；高考注意分片名可能是 `gaokao-0000a.json`（带字母后缀）。
- 验收：6.1 审计 0；浏览器切换书本词数正确、无空白释义。

### 任务 T6：free/paid 分层（P2，需产品确认定价与资质）

- Supabase `profiles.plan` + RLS + Edge Function webhook；前端 paywall 组件；免费额度（每日 20 新词、每本试读 50 词）。
- 验收：免费账号看不到付费书全文；升级后立即可见；退出登录回落免费。

### 任务 T7：零基础书（P1，内容侧配合）

- 见第 4 节；内容生产可由词条流水线做，Trae 负责注册、皮肤、模式。

---

## 13. 不要做的事（红线）

1. 不要改 `tools/check-entry.js`、`books/import/filtered/*.json`（冻结源表）、`books/toefl-core-5000.json`、`books/deep/*.js`、已上线老批次分片。
2. 不要 `git add -A`、不要 `--no-verify`、不要 force push、不要改历史。
3. 不要在词条正文用撇号（JS 单引号字符串）、全角空格、零宽字符；中文字段不要出现连续 6+ 英文单词。
4. 不要把 `service_role` key 写进前端；`account-config.js` 只放公开 url + publishable key。
5. 不要为了"清零警告"去改已上线老批次（跨书重名是允许的）。
6. 不要手写注册表分片列表（用 T1 脚本）。
7. 不要在静态站前端硬编码"已付费"开关；权益必须服务端校验。

---

## 14. 快速命令卡

```bash
cd /Users/hcc/Desktop/LIZZWORD

# 下一批词
node tools/next-words.js ielts 20

# 校验（唯一验收标准）
node tools/check-entry.js books/prepared/ielts-0103.json --existing

# 重建主表
node tools/make-book-master.js ielts

# 内联脚本语法检查
node -e 'const h=require("fs").readFileSync("index.html","utf8");(h.match(/<script>[\s\S]*?<\/script>/g)||[]).forEach((b,i)=>{try{new Function(b.replace(/<\/?script>/g,""))}catch(e){console.log("script",i,"FAIL",e.message)}});console.log("inline scripts OK")'

# 本地起服务（测前端）
nohup python3 -m http.server 8123 --bind 127.0.0.1 >/tmp/http.log 2>&1 &
# http://127.0.0.1:8123/index.html?bust=<随机数>，先清 Service Worker 缓存

# 推送（必须用户在真实终端做）
git push origin main
```

---

## 15. 交接验收清单

- [ ] 线上 `books/ielts.json` 返回 200，词数 ≥2080。
- [ ] 6.1 审计 `TOTAL 0`。
- [ ] 语音三连读通过，设置项持久化。
- [ ] 问卷 → 计划 → 今日任务卡闭环可用。
- [ ] 至少一个新模式（例句填空）可玩可结算。
- [ ] SAT/CET6/高考至少一本上架且审计 0。
- [ ] 免费/付费分层方案经产品确认后再动支付代码。

---

（本文由 2026-11-21 词条生产会话产出；词条生产进度与批次流程见仓库根目录 `HANDOFF.md`。）
