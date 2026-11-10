# LIZZWORD 词书工程 · AI 交接文档

> 交接时间：2026-11-10（Asia/Shanghai）
> 交接对象：下一位接手词条生产的 AI 会话
> 本文件所有数字均为 2026-11-10 实地统计结果，命令可复现。
> 本次交接未改动任何词条数据、未提交、未推送。工作区干净（除下文列出的 10 个无关未跟踪项）。

---

## 0. 30 秒速读（先看这一段）

| 项目 | 现状 |
|---|---|
| 当前提交 | `906275c`（CET4 前段 cet4-0098，hungry 起 20 词） |
| 远端 main | `906275c`，与本地一致；**全部 258 个正式批次都已推送** |
| CET4 总进度 | **3705 / 4500**，尚缺 **795**（前段缺 235，后段缺 560） |
| CET4 前段 | 98 个文件、2015 词，覆盖源清单第 1–2015 个（0 基索引 0–2014） |
| CET4 后段 | 83 个文件、1690 词，覆盖 0 基索引 2250–3939 |
| 上海（小学一年级） | **已收官**：500/500 清单词 + 69 个补充词（33 个文件、569 条） |
| 下一个要做的批次 | **`cet4b-0084`**，源索引 3940 起 20 词：`sweater → table` |
| 再下一个 | `cet4-0099`，源索引 2015 起 20 词：`illegal → imply` |
| 生产节奏 | 每批 20 词，拆 4 个 5 词分片，每片校验通过后合并；一批一提交一推送 |
| 验收标准 | 分片 5/5、0 错误 0 警告；整批 20/20、`batchDuplicates:0`、`warnings:0`；同书重名 0 |
| GitHub | 每次推送后用远端 SHA-256 与本地比对，必须 MATCH |

**第一条指令模板**（直接复制执行）：

```text
请继续 LIZZWORD 词条生产，严格一回合一批：
1. 读 books/import/filtered/cet4.json，取数组下标 3940–3959 共 20 个词
   （sweater, sweep, sweet, swell, swift, swim, swing, switch, swollen, sword,
    symbol, sympathetic, sympathize, sympathy, symptom, synthetic, system,
    systematic, systematical, table），写入 books/prepared/cet4b-0084.json。
2. 字段严格按 books/BOOK-SCHEMA.md：22 键固定顺序；senses 按真实义项 2–10 组、每组 9 键；
   whyCN 每条单独撰写禁模板；etymology.items 必须 5–6 段；affixes.items 8–12 条且
   latinEntries 必须存在（可为 []）；examples 固定 3 条且至少 2 条含目标词或其 forms。
3. 每 5 词一个分片，先跑 node tools/check-entry.js <分片> --existing，必须 5/5、0 错误 0 警告。
4. 合并成整批后跑整批校验与同书重名扫描，全部为 0 再提交推送。
5. 回报：批次号、词数、起止词、校验摘要、远端 SHA-256 比对结果。然后结束回合。
```

---

## 1. 项目定位与用户目标

LIZZWORD 是一个纯静态背单词站点：单文件 `index.html`（内联 CSS/JS）+ 本地 JSON 词库，线上只通过 **GitHub Pages（main 分支根目录）** 发布。

用户长期目标（原话）：

- 「请把词库四级和小学一年级优先补全，其他的先暂停，记住要详细的拓展单词」
  → **CET4 与上海小学一年级优先**；每个词必须是完整深度词条，不许精简版。
- 「你目前自己推动，无需询问我」
  → 生产过程中**不需要每轮确认**，自行推进。
- 「不同的书重叠的词汇没事，同一本不可以」
  → 跨词书重复允许；**同一本书内重复禁止**（CET4 前段 + 后段视为同一本书）。
- 「还有记得放到github」「记得github也要上传」
  → 每批完成后必须提交并推送，不能只留在本机。
- 「好的接下来你自行推 推完了就接着下一本词书」
  → CET4 推完后，按同样标准继续下一本未完成的词书。

当前阶段结论：上海已完成 → **CET4 是唯一在产的书**（前段/后段双路并行）；其余书暂停。

---

## 2. 当前实测状态

### 2.1 Git

```bash
git rev-parse --short HEAD      # 906275c
git status --short
```

工作区唯一未跟踪项（**与本任务无关，不要提交**）：

```
.trae-html-share-packages/
HANDOVER.md                     ← 本文件
books/import/english-vocab-8/
books/import/filtered/_quality-audit.md
books/lizz/DESIGN-shop-and-study.md
books/lizz/INTEGRATION.md
books/lizz/account-mock.js
books/lizz/account-preview.html
books/lizz/shop-preview.html
books/lizz/sql/
```

无已修改未提交文件。`books/import/filtered/*.json`（八本冻结清单）**已入库**，新 clone 不会缺。

### 2.2 各书文件与词条数（实测）

| 词书 | 前缀 | 文件数 | 词条数 | 冻结清单 | 覆盖率 | 状态 |
|---|---|---:|---:|---:|---:|---|
| CET4 前段 | `cet4-*` | 98 | 2015 | 4500 | 44.8% | 在产 |
| CET4 后段 | `cet4b-*` | 83 | 1690 | （同上） | 37.6% | 在产 |
| CET4 合计 | — | 181 | **3705** | 4500 | **82.3%** | 在产 |
| 上海 | `shanghai-*` | 33 | 569 | 500 | **100%** + 69 补充 | 已收官 |
| CET6 | `cet6-*` | 7 | 140 | 5500 | 2.5% | 暂停 |
| 初中 | `middle-*` | 10 | 200 | 1600 | 12.5% | 暂停 |
| 高考 | `gaokao-*` | 8 | 179 | 3500 | 5.0% | 暂停 |
| IELTS | `ielts-*` | 5 | 140 | 6000 | 2.3% | 暂停 |
| 日常高频 | `daily-*` | 9 | 180 | 3000 | 6.0% | 暂停 |
| SAT | `sat-*` | 5 | 156 | 3500 | 1.9% | 暂停（方案待定） |
| TOEFL（线上主库） | `toefl-core-5000-*` | 238 | 3534 | — | — | 已上线 |

合计新书正式批次 **258 个文件 / 5269 条词条**（另有 TOEFL 238 / 3534）。全部已推送。

复现命令：

```bash
cd /Users/hcc/Desktop/LIZZWORD
node -e '
const fs=require("fs");
for(const b of ["cet4","cet4b","cet6","middle","gaokao","ielts","daily","sat","shanghai"]){
  const files=fs.readdirSync("books/prepared").filter(f=>new RegExp("^"+b+"-[0-9]+\\.json$").test(f));
  let n=0; for(const f of files) n+=JSON.parse(fs.readFileSync("books/prepared/"+f,"utf8")).length;
  console.log(b, files.length, n);
}'
```

### 2.3 精确断点（本次实测）

| 词书 | 最后已做 | 下一批文件 | 下一批源索引（0 基） | 下一批首词 |
|---|---|---|---|---|
| CET4 前段 | `cet4-0098`（hungry→ill） | `cet4-0099.json` | 2015–2034 | `illegal` |
| CET4 后段 | `cet4b-0083`（surname→sweat） | `cet4b-0084.json` | 3940–3959 | `sweater` |
| CET6 | `cet6-0007` | `cet6-0008.json` | 141–160 | `airline` |
| 初中 | `middle-0010` | `middle-0011.json` | 200–219 | `candle` |
| 高考 | `gaokao-0008` | `gaokao-0009.json` | 175–194 | `antique` |
| IELTS | `ielts-0005` | `ielts-0006.json` | 133–152 | `advisable` |
| 日常 | `daily-0009` | `daily-0010.json` | 180–199 | `assistant` |
| SAT | `sat-0001..0005` | 先对账 | — | 见 §11，需用户拍板 |
| 上海 | `shanghai-0033` | — | — | 已完成 |

**重要：源索引是 0 基，批次号与源索引没有线性关系**。永远以上一批的末词为锚点，取紧随其后的 20 个词，不要用「批次号 × 20」去推算。

CET4 分段约定：前段负责索引 0–2249，后段负责 2250–4499，互不重叠。

---

## 3. 目录地图

| 路径 | 作用 | 可写？ |
|---|---|---|
| `index.html` / `index-clean.html` | 主站（含/不含调试面板） | **禁止改动** |
| `books/toefl-core-5000.json` | 线上 TOEFL 词表（3534，`entries` 数组） | **禁止改动** |
| `books/deep/*.js` | 线上 TOEFL 深度分片（运行时） | **禁止改动** |
| `books/prepared/toefl-core-5000-*.json` | TOEFL 深度词条权威源（238 个） | 只读；可复制旧词条复用 |
| `books/prepared/{cet4,cet4b,...}-NNNN.json` | 八本新书批次 | **只写本批新文件** |
| `books/import/filtered/<book>.json` | **冻结清单，唯一选词依据** | **禁止改动** |
| `books/BOOK-SCHEMA.md` | 22 字段规范全文 | 只读 |
| `books/schema/sample-entry-remedy.json` | 标准样例词条 | 只读 |
| `tools/check-entry.js` | 词条校验器 | 只读（除非明确要修校验器） |
| `books/import/filtered/_quality-audit.md` | 历史质量问题记录 | 只读 |
| `words.json` | 10 条早期示例，**不是**线上词库 | 禁止误用 |
| `books/lizz/` | 宠物/商店/账号/游戏 | 与本次任务无关 |

---

## 4. 选词与批次规则

1. **唯一选词依据**：`books/import/filtered/<book>.json` 的 `word` 字段，按数组顺序，不得自选、不得跳词、不得增删。
2. **每批 20 词**（历史上有 20–40，现统一 20）。顶层必须是**数组**。
3. **文件命名**：`<prefix>-NNNN.json`，四位补零递增（`cet4b-0084.json`）。
4. **一回合只做一批**：写完 → 校验 → 提交 → 推送 → 回报 → 结束回合。不要连写多批。
5. **同名去重**：同一本书内不得重复（CET4 前后段合并视为同一本）；跨书重复允许。
6. **与 TOEFL 3534 词重叠不剔除**：可以复用旧词条，但必须按新规范补齐（尤其义项数、`whyCN`、`similar.heading`）。
7. **唯一允许的跳过**：CET6 的 `a`（索引 0）已跳过；IELTS 有 7 个「提前预支」词已覆盖，续跑遇到时跳过不重复生成。

---

## 5. BOOK-SCHEMA 硬性清单（校验器实际检查项）

### 5.1 顶层 22 键，顺序不可变

```
word, ipa_uk, ipa_us, definition_zh, definition_en, core_image, scene, sceneCN,
pos, collocations, forms, derivatives, senses, etymology, similar, mnemonics,
examples, dict_mnemonic, root, sensesIntro, semanticMap, affixes
```

### 5.2 各字段数量要求

| 字段 | 要求 |
|---|---|
| `pos` | 数组，`{tag, zh}`；`tag` 形如 `adj.` `n.` `v.` `adv.` |
| `collocations` | **4–7** 条，`{phrase, zh}`，短语必须含目标词或其变形 |
| `forms` | ≥1 条，`{label, form}`；`label` 必须含中文（复数/过去式/比较级/无变化…），`form` 纯英文 |
| `derivatives` | **2–8** 条，仅 `{word, pos, zh}`；`zh` 必须含中文；不得等于本词 |
| `senses` | **2–10** 组，每组**恰好 9 键**：`no,title,titleCN,definition,definitionCN,example,exampleCN,why,whyCN`；`no` 从 `01` 连续；`title`/`titleCN`/`definition` 组内不得重复 |
| `etymology` | `intro{en,cn}` + `items` **5–6** 段，每段 `{era,en,cn}`；`era` 全大写且在允许表内 |
| `similar` | `note{en,cn}` + **恰好 2 组**，heading 只能是 `LOOK-ALIKE` / `NEAR MEANING`；每组 **3 条**，5 键 `word,ipa,tag,definition,definitionCN`；不得引用本词 |
| `mnemonics` | `normalIntro{en,cn}` + `normal` **恰好 5** 条 + `abstract` **恰好 3** 条，均 `{en,cn}` |
| `examples` | **恰好 3** 条，仅 `{en,cn}`；至少 1 条（建议 2 条）含目标词或其 `forms`；禁元描述句（如 “The word comes from Latin.”） |
| `dict_mnemonic` | `{note, text, word}` |
| `semanticMap` | `core{en,cn}` + `chain` **恰好 6** 项（全大写，`/^[A-Z][A-Z0-9 /-]*$/`）+ `branches` **恰好 5** 条，分支 `{senses,en,cn}`，`senses` 必须回指真实义项号（如 `"02 · 03"`） |
| `affixes` | `intro{en,cn}` + `latinIntro{en,cn}` + `items` **8–12** 条（6 键：`word,structure,meaning,meaningCN,example,exampleCN`）+ **`latinEntries` 必须存在**（可为 `[]`，≤7 条，键 `word,structure,meaning,meaningCN`，不可有 `latin` 键） |

`etymology.items[].era` 允许值：
`OLD ENGLISH, MIDDLE ENGLISH, MODERN ENGLISH, LATIN, MEDIEVAL LATIN, OLD FRENCH, FRENCH, GREEK, LOW GERMAN, DUTCH, OLD NORSE, SCANDINAVIAN, GERMANIC, ITALIAN, ORIGIN UNCERTAIN`

### 5.3 `scene` / `sceneCN`

- `scene`：先中文情境铺垫（**不得含阿拉伯数字**），再一个完整英文句；英文句里目标词（含 forms）**只出现 1 次**。
- `sceneCN`：必须含「第 N 个义项」，N 必须在义项总数范围内。

### 5.4 语言规则

- 中文一律**简体**，出现繁體字（個/這/為/說…）直接报错。
- 中文字段不得出现**未加引号的连续英文 ≥6 词**；引用英文请加引号。
- 英文字段不得混入中文。
- 禁止 `undefined`、`null`、空串、占位串、零宽字符。
- JSON 必须严格可解析（解析失败校验器会静默报 `entries: 0`，极易误判为通过）。

---

## 6. 单批生产流程（可直接复制）

以 `cet4b-0084` 为例。

### 6.1 取词

```bash
cd /Users/hcc/Desktop/LIZZWORD
node -e '
const s=JSON.parse(require("fs").readFileSync("books/import/filtered/cet4.json","utf8"));
console.log(s.slice(3940,3960).map((o,i)=>(3940+i)+" "+o.word+" ["+o.pos+"] "+o.meaning_zh).join("\n"));
'
```

### 6.2 预查重叠（决定哪些词可直接复用 TOEFL 旧词条）

```bash
node -e '
const fs=require("fs");
const src=JSON.parse(fs.readFileSync("books/import/filtered/cet4.json","utf8"));
const words=src.slice(3940,3960).map(o=>o.word.toLowerCase());
const live=JSON.parse(fs.readFileSync("books/toefl-core-5000.json","utf8")).entries.map(e=>String(e.word).toLowerCase());
console.log("TOEFL overlap:", words.filter(w=>live.includes(w)).join(", ")||"none");
'
```

### 6.3 写分片（每片 5 词）

历史做法：在 `/tmp/build<批次号><片号>.js` 里用统一 helper 生成对象数组，写 `_tmp_<批次>-p<N>.json`。helper 模板：

```js
const S = (no, title, titleCN, definition, definitionCN, example, exampleCN, why, whyCN) =>
  ({ no, title, titleCN, definition, definitionCN, example, exampleCN, why, whyCN });
const L = (word, ipa, tag, definition, definitionCN) => ({ word, ipa, tag, definition, definitionCN });
const D = (word, pos, zh) => ({ word, pos, zh });
const M = (en, cn) => ({ en, cn });
const E = (era, en, cn) => ({ era, en, cn });
const C = (phrase, zh) => ({ phrase, zh });
const A = (word, structure, meaning, meaningCN, example, exampleCN) =>
  ({ word, structure, meaning, meaningCN, example, exampleCN });
function build(o){ return {
  word:o.word, ipa_uk:o.ipa_uk, ipa_us:o.ipa_us, definition_zh:o.definition_zh,
  definition_en:o.definition_en, core_image:o.core_image, scene:o.scene, sceneCN:o.sceneCN,
  pos:o.pos, collocations:o.collocations, forms:o.forms, derivatives:o.derivatives,
  senses:o.senses, etymology:o.etymology, similar:o.similar, mnemonics:o.mnemonics,
  examples:o.examples, dict_mnemonic:o.dict_mnemonic, root:o.root,
  sensesIntro:o.sensesIntro, semanticMap:o.semanticMap, affixes:o.affixes }; }
```

> 注意：`super` 是 JS 保留字，不能当 `const` 变量名（用 `superWord`）。

### 6.4 分片校验

```bash
node tools/check-entry.js /tmp/_tmp_cet4b-0084-p1.json --existing
```

必须：`通过 5/5`、`错误 0`、`警告 0`、`批次内重名 0`。

### 6.5 合并成整批（保持源顺序）

```bash
node -e '
const fs=require("fs");
const parts=[1,2,3,4].map(i=>JSON.parse(fs.readFileSync("/tmp/_tmp_cet4b-0084-p"+i+".json","utf8")));
const all=[].concat(...parts);
if(all.length!==20) throw new Error("词数不是 20: "+all.length);
fs.writeFileSync("books/prepared/cet4b-0084.json", JSON.stringify(all,null,2)+"\n");
console.log("written", all.length, all[0].word, "->", all[19].word);
'
```

### 6.6 整批校验

```bash
# 结构验收（跳过跨书重名）
node tools/check-entry.js books/prepared/cet4b-0084.json --existing

# 全模式：确认跨书重名来源里没有同前缀文件
node tools/check-entry.js books/prepared/cet4b-0084.json
```

接受标准：`entries 20`、`batchDuplicates 0`、`warnings 0`；`failed` 若存在，必须每条都是跨书重复（来源为其他词书或 TOEFL）。

### 6.7 同书重名扫描（前后段一起扫）

```bash
node -e '
const fs=require("fs");
const seen=new Map(); let dup=0, total=0;
for(const p of ["cet4","cet4b"]){
  const files=fs.readdirSync("books/prepared").filter(f=>new RegExp("^"+p+"-[0-9]+\\.json$").test(f)).sort();
  for(const f of files) for(const e of JSON.parse(fs.readFileSync("books/prepared/"+f,"utf8"))){
    total++; const k=String(e.word).toLowerCase();
    if(seen.has(k)){ dup++; console.log("DUP", k, seen.get(k), f); } else seen.set(k,f);
  }
}
console.log("entries", total, "unique", seen.size, "dups", dup);
'
```

必须 `dups 0`。当前基线：181 个文件 / 3705 条 / 0 重名（做完 cet4b-0084 后为 182 / 3725）。

### 6.8 清理与提交（只加本批文件）

```bash
rm -f /tmp/_tmp_cet4b-0084-p*.json /tmp/build84*.js
git status --short
git add books/prepared/cet4b-0084.json
git commit -m "CET4 后段新增 cet4b-0084 共 20 词（sweater 起）"
```

提交信息格式沿用：`CET4 前段新增 cet4-00NN 共 20 词（<首词> 起）` / `CET4 后段新增 cet4b-00NN 共 20 词（<首词> 起）`。

### 6.9 推送与线上比对

```bash
ALL_PROXY=socks5h://127.0.0.1:10808 git -c http.version=HTTP/1.1 push origin main
ALL_PROXY=socks5h://127.0.0.1:10808 git -c http.version=HTTP/1.1 ls-remote --heads origin main
```

推送后验证线上字节一致：

```bash
curl -s -o /tmp/remote-cet4b-0084.json -w "%{http_code} %{size_download}\n" \
  https://hcc9886.github.io/LIZZWORD/books/prepared/cet4b-0084.json
shasum -a 256 /tmp/remote-cet4b-0084.json books/prepared/cet4b-0084.json
```

两个哈希必须相同（Pages 生效需等 1–2 分钟，404 时先重试再判断）。

---

## 7. 校验器行为要点（`tools/check-entry.js`）

- `--existing`：跳过「与 `books/toefl-core-5000.json` + 全部 `books/prepared/*.json`」的跨库重名检查，其余检查全开。**日常验收用这个**。
- 不加 `--existing`：会做跨库重名检查，跨书重复会被记为 ERROR。本项目**允许跨书重复**，所以这类 failed 可接受，但要确认来源不含同前缀文件。
- 命中判定用**字母边界**正则：`hunter` 不算 `hunt` 的出现，`honeycomb` 不算 `honey` 的出现。
- JSON 解析失败时 `entries` 会显示 0 且不报文件路径错误——看到 `entries: 0` 先怀疑 JSON 语法。
- `warnings` 必须为 0；`senses` 组数已放宽为只在 >10 组时告警。
- 把一本书的全部文件一次性传入会被当成「一个批次」，跨书重名会变成几百组「批次内重名」——这是统计口径问题，验收请按单批进行。

---

## 8. 真实踩过的坑与修法

| 现象 | 原因 | 修法 |
|---|---|---|
| `数组长度不足（至少 5，实际 4）` | `etymology.items` 只写了 4 段 | 补第 5 段（常用 `MODERN ENGLISH`），**这是最高频错误** |
| `titleCN` 重复 | 多个义项中文标签一样 | 每个义项标题单独命名 |
| `zh 需包含中文` | `derivatives.zh` 写成英文 | 一律写中文释义 |
| `A()` 参数缺失导致 `undefined` | helper 少传 example/exampleCN | 6 个参数写全 |
| scene 中文铺垫含阿拉伯数字 | 写了「2020 年」 | 改成汉字或去掉数字 |
| 目标词在 scene 英文句出现 2 次 | 句子重复使用本词 | 只出现 1 次 |
| `sceneCN` 义项号越界 | 写了「第 3 个义项」但只有 2 组 | 与实际 `senses` 数量对齐 |
| `latinEntries` 缺失 / 用了 `latin` 键 | 记错结构 | 必须存在数组 `latinEntries`，元素键为 `word/structure/meaning/meaningCN` |
| 繁體字报错 | 输入法带入 | 全文简体 |
| 中文字段连续英文 ≥6 词 | 长英文短语没加引号 | 加引号或改中文 |
| `const super = ...` 报语法错 | 保留字 | 改名 `superWord` |
| `exceeded output window` | 一次输出整批 20 条 | 拆 4–5 词一次写，写完立即校验 |
| 同书重名漏检 | 只扫了当前前缀 | 扫 `cet4-*` + `cet4b-*` 两套 |
| 把跨书重复当错误 | 用全模式验收 | 日常用 `--existing`，跨书重复单列说明 |
| `git ls-remote` 卡住 | 未走代理 | `ALL_PROXY=socks5h://127.0.0.1:10808` + `http.version=HTTP/1.1` |

---

## 9. GitHub 发布

| 项 | 值 |
|---|---|
| 仓库 | `https://github.com/hcc9886/LIZZWORD.git` |
| 分支 | `main`（Pages 只服务 main 根目录） |
| 站点 | `https://hcc9886.github.io/LIZZWORD/` |
| 批次 URL | `https://hcc9886.github.io/LIZZWORD/books/prepared/<file>.json` |
| 网络 | 需代理 `socks5h://127.0.0.1:10808`；出现 SSL/HTTP2 断连先重试，不要改远端、不要强推 |
| 认证 | `gh auth status` 未登录；历史推送用一次性 PAT，token 未写入任何配置文件 |

规则：**不强推、不 `--no-verify`、不跳 hook、不改历史**；只 `git add` 本批文件，绝不用 `git add -A`。

---

## 10. 下一批精确内容

### 10.1 `cet4b-0084`（后段，源索引 3940–3959）

```
sweater, sweep, sweet, swell, swift, swim, swing, switch, swollen, sword,
symbol, sympathetic, sympathize, sympathy, symptom, synthetic, system,
systematic, systematical, table
```

分片建议：

| 分片 | 词 |
|---|---|
| p1 | sweater, sweep, sweet, swell, swift |
| p2 | swim, swing, switch, swollen, sword |
| p3 | symbol, sympathetic, sympathize, sympathy, symptom |
| p4 | synthetic, system, systematic, systematical, table |

（p1 已有一份草稿脚本在 `/tmp/build84a.js`，尚未运行；接手可直接复用或重写。）

### 10.2 `cet4-0099`（前段，源索引 2015–2034）

```
illegal, illegally, illness, illustrate, illustration, image, imaginary,
imagination, imagine, imitate, immediate, immediately, immense, immigrant,
immoral, impact, impatient, implement, implication, imply
```

### 10.3 之后的交替顺序

`cet4b-0084` → `cet4-0099` → `cet4b-0085` → `cet4-0100` → … 直到 CET4 4500 全部完成。
每次续跑前用 §6.1 的命令重新取词，不要凭记忆推算索引。

CET4 剩余量：前段 2015→2250 共 **235 词**（12 批），后段 3940→4499 共 **560 词**（28 批），合计 795 词 / 40 批。

---

## 11. 其他词书断点（CET4 完成后再动）

| 词书 | 下一批 | 首词 | 备注 |
|---|---|---|---|
| CET6 | `cet6-0008.json` | `airline`（索引 141） | `a`（索引 0）跳过，勿补 |
| 初中 | `middle-0011.json` | `candle`（索引 200） | 连续无缺口 |
| 高考 | `gaokao-0009.json` | `antique`（索引 175） | 已含 4 个清单外词：abnormality / abridge / abstinence / accrue |
| IELTS | `ielts-0006.json` | `advisable`（索引 133） | 已有 7 个「提前预支」词在 ielts-0001，遇到跳过 |
| 日常 | `daily-0010.json` | `assistant`（索引 180） | 连续无缺口 |
| SAT | 需用户拍板 | `abandon`（索引 0） | 现有 156 词中 90 词不在清单；方案 A 保留+登记补充，方案 B 整批重建。**未确认前不要动** |
| 上海 | — | — | 500/500 完成；69 个补充词（25 个约定基础词 + 44 个一年级补缺） |

---

## 12. 接手第一天清单

1. 读本文件 → 读 `books/BOOK-SCHEMA.md` → 看 `books/schema/sample-entry-remedy.json`。
2. 跑 `git rev-parse --short HEAD` 与 `git status --short`，确认 HEAD 为 `906275c` 或更新、工作区只有那 10 个无关未跟踪项。
3. 跑 §2.2 统计脚本，确认 258 个批次、CET4 3705 词，与本文件一致；不一致先查原因再生产。
4. 跑一次 `node tools/check-entry.js books/prepared/cet4b-0083.json --existing`，确认校验器可用（预期 0 错误 0 警告）。
5. 从 §10.1 的 `cet4b-0084` 开始，一次一批，按 §6 流程执行。
6. 每批完成后回报：批次号 / 词数 / 起止词 / 校验摘要 / 推送与哈希比对结果，然后结束回合。
7. CET4 完成后按 §11 顺序继续下一本书（SAT 先问用户方案）。

---

## 13. 明确禁止事项

1. 不要修改 `index.html`、`index-clean.html`、`books/toefl-core-5000.json`、`books/deep/*.js`。
2. 不要修改 `books/import/filtered/*.json` 冻结清单。
3. 不要修改其他已完成批次文件；只写本批新文件。
4. 不要跨批连写；一回合一批。
5. 不要在同一本书内产生重复词；跨书重复允许。
6. 不要用 `git add -A`；只按文件名添加本批。
7. 不要强推、不要 `--no-verify`、不要改写历史。
8. 不要把 `words.json` 当作线上词库。
9. 不要在 SAT 方案未定时继续生成 SAT 批次。
10. 不要提交 §2.1 列出的 10 个无关未跟踪项（除非用户明确要求）。

---

## 14. 健康状态结论

- 数据一致：本地 `HEAD` 与 `origin/main` 同为 `906275c`；258 个正式批次全部已推送，无「只在本机」的数据风险。
- 质量一致：最近批次 `cet4-0098`、`cet4b-0083` 均 20/20、0 警告、同书重名 0，线上字节哈希 MATCH。
- 连续性清晰：下一批 `cet4b-0084` 的首词与索引已锁定，CET4 剩余 795 词 / 40 批有明确边界。
- 本文件未提交；如需入库，请用户确认后再 `git add HANDOVER.md`。
