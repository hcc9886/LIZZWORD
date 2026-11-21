# LIZZWORD 交接文档（2026-11-21 重写）

> 面向对象：接手继续完善词书的 AI（workbuddy / deepseek）。
> 读完本文即可独立运行：生产词条 → 校验 → 装片 → 更新主表与注册 → 提交。
> 本文数字均为 2026-11-21 用 node 实扫的结果；**接手后请重新实扫确认，不要照抄数字**。
> 旧版交接文档（2026-11-15）里的 IELTS / CET4 进度已经过期，以本文为准。

---

## 0. 一分钟上手

```bash
cd /Users/hcc/Desktop/LIZZWORD          # 仓库根目录必须用这个（不是 /Users/hcc/LIZZWORD）
node tools/next-words.js ielts 20       # 雅思下一批要写哪些词
node tools/check-entry.js books/prepared/ielts-0099.json --existing   # 校验（唯一验收标准）
git log --oneline -5
git rev-list --count origin/main..HEAD  # 本地积压未推送提交数（今天为 10）
```

铁律：
1. **每批 20 词，一片一个文件**：`books/prepared/<书>-NNNN.json`。
2. **断点只能实扫求差集**（`tools/next-words.js`），绝不用「上批末词」推断——历史上因此重复产出过 14 个分片。
3. **验收 = `node tools/check-entry.js <文件> --existing` 输出 0 错 0 警**，不达标不许提交。
4. `tools/check-entry.js` 禁止修改。
5. 每批流程：写片 → 校验 → 装片 → 重建主表 → 更新 `index.html` 注册 → commit。
6. 不许 force push、不许 `--no-verify`、不许改历史、不许 `git add -A`（只按名字 add 本次产物）。push 见第 7 节。

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
| `ielts` | IELTS 雅思核心词汇 | 6000 | 2020 | 2020 | 99 | **进行中：剩 3980 词 ≈ 199 批** |

主表列出的每个词都能在本书分片里取到深度词条（已核：主表与分片双向一致，空白释义 0）。

### 2.2 有分片但尚未上架的书

| 书 | 分片 | 深度词条 | 源词 | 未覆盖 | 备注 |
|---|---|---|---|---|---|
| `sat` | 339 | 756 | 3500 | 2836 | **其中 159 片是单对象不是数组**，前端会静默丢弃；上架前必须包装 |
| `cet6` | 7 | 140 | 5500 | 5360 | 无主表 `books/cet6.json` |
| `gaokao` | 12 | 259 | 3500 | 3245 | 无主表 `books/gaokao.json` |

复用潜力（缺口词里别的书已有深度词条、可整条搬过来改写的数量）：ielts 1846、sat 1727、cet6 1194、gaokao 392。
全库带义项深度词共 8377 个。

### 2.3 建议的任务顺序

1. IELTS 从批次 0100 继续生产（下一批首词 `enrich`），每批 20 词，直到 6000 词补完。
2. IELTS 补完后：SAT 分片数组化 + 生成主表 + 上架，再补 2836 词；然后 CET6、高考。
3. 语音待办见 3.2（朗读队列、语速口音持久化、失败分级提示、真机回归）。
4. 历史存量词条的风格清洗不做要求（校验器已接受，别为了清零去改老批次）。

---

## 3. 用户报的三个问题：根因与现状

### 3.1 「漏了很多词条」/「有些单词加载不出释义」——已修（提交 db3c850）

根因不是内容缺失，而是**注册漏了**：前端只加载 `BOOKS[].preparedFiles` 里逐个列出的分片文件。
- TOEFL 主表 3534 词，但 `preparedFiles` 只写了 1 片 → 3519 词点不出释义。现已补齐 238 片。
- IELTS 已产出 99 片 / 2020 条深度词条，但整本书没注册、也没有主表 → 主页看不到这本书。现已新增 `books/ielts.json`、BOOKS 条目、B2/C1 推荐、`sw.js` 预缓存。

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
# 控制台：LIZZWORD_DEBUG.switchBook("ielts") 之后看 LIZZWORD_DEBUG.words.length 是否为 2020
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

待办（按性价比排序）：
1. **朗读队列**：现在每次 `speak()` 开头都会 `cancel()`，「例句 + 中文释义」连读会被打断。建议在 LZSpeech 加 `speakSequence([{text, lang}])`，按钮状态只在开始 / 全部结束时变更。
2. **语速与口音偏好持久化**：`index.html:6684` 的 `data-rate` 是写死的；存 localStorage，设置页给 0.7 / 0.9 / 1.1 三档 + 英音美音切换（用 `LZSpeech.voiceFor`）。
3. **失败原因分级提示**：`onFail` 已能给出 `unsupported / timeout / exception / interrupted`，但 `index.html:10799` 只弹一句通用文案；`interrupted` 不该提示，`unsupported` 应提示更换浏览器。
4. **iOS / Safari 真机回归**：解锁依赖首次手势里的 `resume()`（已挂 pointerdown），需真机验证一次。
5. **中文语音缺失降级**：`voiceFor("zh-CN")` 返回 null 时提示用户安装系统语音包。

### 3.3 未跟踪的历史 scratch 文件

`git status` 里这些未跟踪项是历史遗留，**默认不提交也不删除**：
`.trae-html-share-packages/`、`books/import/english-vocab-8/`、`books/import/filtered/_quality-audit.md`、`books/lizz/DESIGN-shop-and-study.md`、`books/lizz/INTEGRATION.md`、`books/lizz/account-mock.js`、`books/lizz/account-preview.html`、`books/lizz/shop-preview.html`、`books/lizz/sql/`、`books/prepared/entry-*.json`、`tools/build-0117c.js`、`tools/data-0117c-*.js`、`tools/gen-daily-0121.js`。
`books/prepared/_tmp_*.json` 是老流水线中间产物，扫描时必须过滤。

---

## 4. 每批 20 词的完整流程（以 IELTS 为例）

### 4.1 取下一批词

```bash
node tools/next-words.js ielts 20
# 今天输出：enrich, enroll, enrolment, enslave, ensue, ensure, entail, enteritis,
# enterprise, entertain, entertainment, enthusiasm, enthusiast, enthusiastic,
# entice, entire, entirely, entitle, entitlement, entity
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

结构照最近上线的成片抄，例如 `books/prepared/ielts-0099.json`。硬约束（详见 `books/BOOK-SCHEMA.md`）：
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
node tools/check-entry.js books/prepared/ielts-0100.json --existing   # 必须 0 错 0 警
node tools/make-book-master.js ielts                                  # 重建 books/ielts.json
# 再手工改 index.html：IELTS 那条的 Array.from({length: 99}) 改成 100
git add books/prepared/ielts-0100.json books/ielts.json index.html
git commit -m "ielts: add entries (batch 0100) enrich 起 20 词"
```

提交信息沿用现有风格：`ielts: add entries (batch 00NN) <首词> 起 20 词`。
`tools/make-book-master.js` 会保留主表原有的 name / intro；要改文案用 `--name/--intro`。

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
5. 当前优先级：**IELTS 继续推完**（剩 3980 词）；之后再补 sat / cet6 / gaokao 并上架。
6. 每批都要存到 GitHub：「还有记得放到 github」「然后都存到 github」。

---

## 7. 推送与线上验证

- 本地 main 领先 origin/main **10 个提交**，其中今天新增 3 个：`db3c850`（词条注册 + 语音兜底）、`bbce0aa`（朗读时长）、`889f4c9`（流水线工具 + 雅思主表）。
- Agent 侧 push 被主机权限分类拦下，**不要反复重试、不要换姿势绕开**。做法：明确告诉用户在真实终端执行
  ```bash
  cd /Users/hcc/Desktop/LIZZWORD && git push origin main
  ```
- 推送后验证线上（Pages 有缓存，可能要等几十秒到几分钟，且可能短暂回吐旧字节）：
  ```bash
  curl -sI https://hcc9886.github.io/LIZZWORD/books/ielts.json | head -1
  curl -s  https://hcc9886.github.io/LIZZWORD/books/ielts.json | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).entries.length))'
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
