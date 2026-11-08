# TOEFL 深度词条字段规范（BOOK-SCHEMA）

本规范从 `books/prepared/toefl-core-5000-*.json`（238 个批次、3534 条现有词条）与
`books/deep/toefl-core-5000-*.js` 分片中提取，用于后续新词条的生成与验收。

- **权威数据源**：`books/prepared/*.json`（数组，元素为词条对象）。
  `books/deep/*.js` 是同一批数据的运行时分片（`window.__LIZZWORD_DEEP_SHARD("0001", [...])`），
  字段与 prepared 完全一致，仅用于页面加载，不单独作为校验输入。
- **词书总表**：`books/toefl-core-5000.json` 的 `entries`（3534 个去重词，仅含 `word`、`index`、`tier`），
  用于「是否与已有词重名」的检查。
- **示例词条**：[sample-entry-remedy.json](schema/sample-entry-remedy.json)。
- **校验脚本**：[check-entry.js](../tools/check-entry.js)。

---

## 1. 顶层结构

每条词条是对象，**固定 22 个键，顺序不可变**：

```
word, ipa_uk, ipa_us, definition_zh, definition_en, core_image, scene, sceneCN,
pos, collocations, forms, derivatives, senses, etymology, similar, mnemonics,
examples, dict_mnemonic, root, sensesIntro, semanticMap, affixes
```

| # | 字段 | 类型 | 必填 | 格式 / 取值约定 | 示例 |
|---|------|------|------|----------------|------|
| 1 | `word` | string | 是 | 英文词或短语；允许字母、空格、连字符、撇号；无首尾空白、无连续空格 | `"abandon"` |
| 2 | `ipa_uk` | string | 是 | 一对或多对 `/…/`；多音可用 `;`、`,`、`·` 分隔，可带 `(noun)` 等标签 | `"/əˈbændən/"` |
| 3 | `ipa_us` | string | 是 | 同上 | `"/əˈbændən/"` |
| 4 | `definition_zh` | string | 是 | 简体中文核心释义，多个义项用分号分隔；不得整段英文 | `"放弃；抛弃；遗弃；离弃；放任"` |
| 5 | `definition_en` | string | 是 | 一句英文释义；不得含中文字符 | `"to leave someone or something behind..."` |
| 6 | `core_image` | string | 是 | 简体中文核心意象，短句，通常不超过 30 字 | `"松开的手：原本握住的东西被放开了"` |
| 7 | `scene` | string | 是 | **中文情境铺垫（不含拉丁字母、阿拉伯数字）+ 一个完整英文场景句**；英文句中目标词（或其变形）只出现 1 次 | `"地震后…。After the earthquake, the residents had to abandon their cracked houses."` |
| 8 | `sceneCN` | string | 是 | 简体中文场景解释；必须含 `第 N 个义项`，N 为真实义项编号 | `"这里 abandon 是「弃置、离开」（第 3 个义项：离开一个地方）；句意…"` |
| 9 | `pos` | array | 是 | 至少 1 条 `{tag, zh}`；`tag` 用 `n.` / `v.` / `vt.` / `vi.` / `adj.` / `adv.` 等缩写 | `[{"tag":"vt.","zh":"放弃；抛弃"},{"tag":"n.","zh":"放任"}]` |
| 10 | `collocations` | array | 是 | 4-7 条（历史数据最多 8 条）`{phrase, zh}`；`phrase` 应含目标词或其变形 | `{"phrase":"abandon oneself to","zh":"沉溺于"}` |
| 11 | `forms` | array | 是 | 按词性写全：动词给三单/过去式/过去分词/现在分词，名词给复数，形容词给比较级；`{label, form}` | `{"label":"过去式","form":"abandoned"}` |
| 12 | `derivatives` | array | 是 | 2-8 条 `{word, pos, zh}`；不得把目标词本身列为派生词 | `{"word":"abandonment","pos":"n.","zh":"…"}` |
| 13 | `senses` | array | 是 | 标准 8-10 组，**每组恰好 9 个键**，编号从 `01` 连续递增 | 见 §2.5 |
| 14 | `etymology` | object | 是 | `intro{en,cn}` + `items` 5-6 段；每段 `{era,en,cn}`，`era` 全大写 | 见 §2.6 |
| 15 | `similar` | object | 是 | `note{en,cn}` + `groups` 至少 2 组；每组 `{heading, entries}`；`entries` 每条 ≥2 个 | 见 §2.7 / §3 |
| 16 | `mnemonics` | object | 是 | `normalIntro{en,cn}` + `normal` 固定 5 条 + `abstract` 固定 3 条；每条 `{en,cn}` | 见 §2.8 |
| 17 | `examples` | array | 是 | 固定 3 条 `{en,cn}`；至少 1 条（建议 ≥2 条）英文含目标词或其变形 | `{"en":"...","cn":"..."}` |
| 18 | `dict_mnemonic` | object | 是 | `{note, text, word}`；`note` 固定为 `"谐音记忆 · 非词源"`，`word` 与目标词一致 | 见 §2.10 |
| 19 | `root` | string | 是 | 简体中文词根说明；可引用拉丁/希腊词形；存疑须标注 | `"拉丁语 ab-（离开）+ bandon（控制）…"` |
| 20 | `sensesIntro` | object | 是 | `{en,cn}`，概括义项分布 | 见 §2.11 |
| 21 | `semanticMap` | object | 是 | `core{en,cn}` + `chain` 固定 6 环 + `branches` 固定 5 条；分支 `{senses,en,cn}` | 见 §2.12 |
| 22 | `affixes` | object | 是 | `intro{en,cn}` + `latinIntro{en,cn}` + `items` 8-12 条 + `latinEntries`（可为空数组）；可选 `derivatives` | 见 §2.13 |

> 空值约定：任何字符串不得为空串/纯空白；任何数组不得为空，**唯一例外是 `affixes.latinEntries`**
> （无拉丁同族词时允许 `[]`，规范中已说明）。

---

## 2. 嵌套结构

### 2.1 `pos[]`

```json
{ "tag": "vt.", "zh": "放弃；抛弃；遗弃；离弃" }
```

- 恰好 2 个键：`tag`、`zh`。
- `tag` 为词性缩写；`zh` 为简体中文词性说明。

### 2.2 `collocations[]`

```json
{ "phrase": "abandon oneself to", "zh": "沉溺于；纵情于" }
```

- 恰好 2 个键：`phrase`、`zh`。
- 标准 4-7 条；`phrase` 为英文搭配，`zh` 为中文释义。

### 2.3 `forms[]`

```json
{ "label": "过去分词", "form": "abandoned" }
```

- 恰好 2 个键：`label`、`form`。
- `label` 用中文说明形式（如「复数」「三单」「过去式」「现在分词」）。
- 只写真实存在的形式，不编造。

### 2.4 `derivatives[]`

```json
{ "word": "abandonment", "pos": "n.", "zh": "由动词加名词后缀构成，义为「遗弃；放弃」" }
```

- 恰好 3 个键：`word`、`pos`、`zh`。
- 派生词必须真实存在；`zh` 建议写明「基础词 + 后缀来源 + 语义偏移」。
- **不得把目标词本身列为派生词**。

### 2.5 `senses[]`

每组义项固定 9 个键，顺序固定：

```
no, title, titleCN, definition, definitionCN, example, exampleCN, why, whyCN
```

```json
{
  "no": "01",
  "title": "To leave someone or something behind",
  "titleCN": "丢下；遗弃",
  "definition": "to leave a person, place, or thing behind, especially when you should stay",
  "definitionCN": "丢下某人、某地或某物，尤指在本该留下时离开",
  "example": "The crew abandoned the sinking ship.",
  "exampleCN": "船员们弃船而走。",
  "why": "The Latin prefix ab- means away, and the core image is letting go of what was held.",
  "whyCN": "拉丁语前缀 ab- 表示「离开」，核心意象是放开原本握住的东西。"
}
```

- `no`：两位数字字符串，从 `01` 开始连续递增；不得重复，不得用 `S1`、`1`、`①`。
- 标准 8-10 组；**结构上的硬性下限是 2 组**，低于 2 组直接报错。
- `title` / `titleCN` / `definition` 不得重复。
- `title`、`definition`、`example`、`why` 为英文，不得混入中文；
  `titleCN`、`definitionCN`、`exampleCN`、`whyCN` 为简体中文。
- `whyCN` 要解释「为什么这个义项会从这个核心意象长出来」，不能只翻译 `why`。

### 2.6 `etymology`

```json
{
  "intro": { "en": "...", "cn": "..." },
  "items": [
    { "era": "LATIN", "en": "...", "cn": "..." },
    { "era": "OLD FRENCH", "en": "...", "cn": "..." }
  ]
}
```

- 恰好 2 个键：`intro`、`items`。
- `items` 固定 5-6 段，每段恰好 3 个键：`era`、`en`、`cn`。
- `era` 为历史阶段标签，**全大写**（如 `PROTO-INDO-EUROPEAN`、`LATIN`、`OLD FRENCH`、`ENGLISH, 13TH–15TH C.`、`MODERN ENGLISH`）。
- 词源必须查证，不得编造词根：
  - 无可靠结论时写 `来源不确定` / `一般认为` / `重构形式`；
  - 多种假说并列时不要强行选定论；
  - 区分「词根存疑」与「仅首见年代存疑」；
  - 纯外语来源且无拉丁同族时，`affixes.latinEntries` 留空数组。

### 2.7 `similar`

```json
{
  "note": { "en": "...", "cn": "..." },
  "groups": [
    {
      "heading": "LOOK-ALIKE",
      "entries": [
        { "word": "abandonment", "ipa": "/əˈbændənmənt/", "tag": "same root", "definition": "...", "definitionCN": "..." }
      ]
    }
  ]
}
```

- 恰好 2 个键：`note`、`groups`。
- `note` 恰好 2 个键：`en`、`cn`。
- `groups` 至少 2 组；标准为 2 组：
  - 第 1 组：`LOOK-ALIKE`（形近 / 同根 / 词族 / 拼写相近）
  - 第 2 组：`NEAR MEANING`（近义 / 同类概念 / 相关义场）
- 每组恰好 2 个键：`heading`、`entries`；
  `entries` 每条至少 2 个，标准 3-7 个；同一组内不得重复。
- 每条 entry 恰好 5 个键：`word`、`ipa`、`tag`、`definition`、`definitionCN`。
  - `word` 不得等于目标词（**禁止自我引用**）；
  - `ipa` 必须符合 `/…/` 格式；
  - `tag` 必须非空，风格见 §4；
  - 形近但非同源的词，必须在 `definitionCN` 里明确说明「只是拼写相近，词源不同」。

### 2.8 `mnemonics`

```json
{
  "normalIntro": { "en": "...", "cn": "..." },
  "normal": [ { "en": "...", "cn": "..." } ],
  "abstract": [ { "en": "...", "cn": "..." } ]
}
```

- 恰好 3 个键：`normalIntro`、`normal`、`abstract`。
- `normalIntro` 恰好 2 个键：`en`、`cn`。
- `normal` **固定 5 条**，基于真实词根、词族、搭配、构词；不得编造词源。
- `abstract` **固定 3 条**，用画面、动作、抽象联想帮助记忆。
- 每条恰好 2 个键：`en`、`cn`，中英成对。

### 2.9 `examples[]`

```json
{ "en": "The crew abandoned the sinking ship.", "cn": "船员们弃船而走。" }
```

- 固定 3 条，每条恰好 2 个键：`en`、`cn`。
- 至少 1 条（建议 ≥2 条）英文例句包含目标词或其 `forms` 中的变形。
- 中文为简体中文，英文不得混入中文。

### 2.10 `dict_mnemonic`

```json
{ "note": "谐音记忆 · 非词源", "text": "「阿班蹲」——…", "word": "abandon" }
```

- 恰好 3 个键：`note`、`text`、`word`。
- `note` 固定为 `"谐音记忆 · 非词源"`。
- `text` 为简体中文谐音联想，不得把谐音当成词源。
- `word` 与目标词拼写一致。

### 2.11 `sensesIntro`

```json
{ "en": "...", "cn": "..." }
```

- 恰好 2 个键：`en`、`cn`；概括义项如何从核心意象展开。

### 2.12 `semanticMap`

```json
{
  "core": { "en": "CORE IMAGE: ...", "cn": "核心意象：..." },
  "chain": ["RELEASE", "DEPARTURE", "DESERTION", "FREEDOM", "NEGLECT", "SURRENDER"],
  "branches": [
    { "senses": "01 · 03", "en": "...", "cn": "..." }
  ]
}
```

- 恰好 3 个键：`core`、`chain`、`branches`。
- `core` 恰好 2 个键：`en`、`cn`。
- `chain` **固定 6 环**，大写英文短语。
- `branches` **固定 5 条**，每条恰好 3 个键：`senses`、`en`、`cn`。
- `senses` 必须回指真实存在的两位义项编号（如 `"01"`、`"02 · 05 · 06"`），
  **不得使用 `S0` / `S1` 式编号**，也不得指向不存在的编号。

### 2.13 `affixes`

```json
{
  "intro": { "en": "...", "cn": "..." },
  "latinIntro": { "en": "...", "cn": "..." },
  "items": [
    {
      "word": "ab-",
      "structure": "Latin prefix",
      "meaning": "away, from",
      "meaningCN": "离开；脱离",
      "example": "...",
      "exampleCN": "..."
    }
  ],
  "latinEntries": [
    { "word": "abandonner", "structure": "Old French verb", "meaning": "...", "meaningCN": "..." }
  ],
  "derivatives": [
    { "word": "abandonment", "pos": "n.", "zh": "..." }
  ]
}
```

- 必填 4 个键：`intro`、`latinIntro`、`items`、`latinEntries`；
  `derivatives` 为**可选**字段（多数新批次有，旧批次可能没有）。
- `intro` / `latinIntro` 各恰好 2 个键：`en`、`cn`。
- `items` **8-12 条**，每条恰好 6 个键：
  `word`、`structure`、`meaning`、`meaningCN`、`example`、`exampleCN`。
- `latinEntries` 可以为空数组；每条至少含
  `word`、`structure`、`meaning`、`meaningCN`，可选 `example`、`exampleCN`。
- 可选 `derivatives` 每条 3 个键：`word`、`pos`、`zh`。
- 不得把 `latinEntries`、`derivatives`、`collocations` 等字段名当作正文叙述，
  改用「同源词」「派生词」「搭配」等自然说法。

---

## 3. `similar.groups[].heading` 统一写法

历史数据共出现 **31 种**组标题写法。**新词条只允许两种：**

| 规范值 | 用途 |
|--------|------|
| `LOOK-ALIKE` | 形近、同根、同词族、拼写/发音相近、同前缀 |
| `NEAR MEANING` | 近义、同类概念、相关义场、反义对照 |

历史写法与规范值的映射：

| 历史写法 | 统一为 |
|----------|--------|
| `LOOK-ALIKE` | `LOOK-ALIKE`（已是规范值） |
| `NEAR MEANING` | `NEAR MEANING`（已是规范值） |
| `NEAR-SYNONYMS` | `NEAR MEANING` |
| `NEAR-MEANING` | `NEAR MEANING` |
| `NEAR SYNONYMS` | `NEAR MEANING` |
| `COSMOS NEAR-SYNONYMS` | `NEAR MEANING` |
| `WORD FAMILY` | `LOOK-ALIKE` |
| `SAME ROOT` | `LOOK-ALIKE` |
| `SAME ROOT FAMILY` | `LOOK-ALIKE` |
| `SAME ROOT ADJECTIVES` | `LOOK-ALIKE` |
| `SAME ROOT -ER / -IST PROFESSIONS` | `LOOK-ALIKE` |
| `SAME ROOT, DIFFERENT PREFIX` | `LOOK-ALIKE` |
| `SAME cosm- ROOT` | `LOOK-ALIKE` |
| `SAME astro- PREFIX` | `LOOK-ALIKE` |
| `SOUND-ALIKE` | `LOOK-ALIKE` |
| `SOUND-ALIKE / FORM-ALIKE` | `LOOK-ALIKE` |
| `FORM-ALIKE` | `LOOK-ALIKE` |
| `NEGATED FERTILE FAMILY` | `LOOK-ALIKE` |
| `SCALE ADJECTIVES` | `NEAR MEANING` |
| `RELATED PROCESSES` | `NEAR MEANING` |
| `RELATED SEDIMENT TERMS` | `NEAR MEANING` |
| `RELATED FIELDS` | `NEAR MEANING` |
| `RELATED SENSES` | `NEAR MEANING` |
| `RELATED PROFESSIONS` | `NEAR MEANING` |
| `RELATED -IST PROFESSIONS` | `NEAR MEANING` |
| `RELATED COSMIC TERMS` | `NEAR MEANING` |
| `RELATED SKY OBJECTS` | `NEAR MEANING` |
| `PARENT / SIBLING FIELDS` | `NEAR MEANING` |
| `astro- / astron- PROFESSIONS` | `NEAR MEANING` |
| `FIGURATIVE 'WORLD' SENSE` | `NEAR MEANING` |

判断原则：**看标题强调的是「形式/词根/词族」还是「意义/义场」**。
前者用 `LOOK-ALIKE`，后者用 `NEAR MEANING`。

---

## 4. `tag` 规范

`similar.groups[].entries[].tag` 与其它字段一样必须非空，推荐写法：

- 1-3 个英文小写词，必要时用逗号分隔限定语（如 `"formal, legal"`）；
- 不使用中文、不大写、不超过 35 个字符；
- 常用值：`spelling`、`same root`、`derived form`、`different root`、
  `near meaning`、`opposite`、`formal`、`informal`、`literary`、`technical`、
  `legal`、`person`、`action`、`adjective`、`noun`、`verb`、`British spelling`、
  `American spelling`、`compound`、`phrase`。

`tag` 是对「这个条目和目标词是什么关系」的简短标注，不是完整解释；
完整解释写进 `definition` / `definitionCN`。

---

## 5. 语言与内容规范

### 5.1 语言

- 中文一律**简体**；不得出现繁體字。
- 英文字段（`definition_en`、`title`、`definition`、`example`、`why`、`en`、
  `tag`、`pos`、`phrase`、`form`、`structure`、`meaning`、`era` 等）不得混入中文字符。
- 中文字段必须含中文，不得整段英文。
- 中文字段允许引用英文单词、拉丁/希腊词形、专有名词，但**不得出现未加引号的连续英文 ≥6 词**
  （校验脚本按此启发式判定「疑似中英混杂」）。
- 不得出现 `undefined`、`null`、空串、占位串、零宽字符。

### 5.2 义项与场景

- 义项标准 8-10 组，每组 9 键；编号 `01` 起连续。
- `scene`：中文铺垫不得含拉丁字母和阿拉伯数字；英文句只出现 1 次目标词（或其变形）。
- `sceneCN`：必须写「第 N 个义项」，N 与真实编号对应。
- `core_image` 用中文写出可想象的画面，不写抽象定义。

### 5.3 词源

- 必须查证；存疑处标注 `来源不确定` / `一般认为` / `重构形式`。
- 不得编造词根或假词。
- 区分「词根存疑」与「仅首见年代存疑」；多种假说并列，不强行选定论。
- 纯外语来源、无拉丁同族时，`affixes.latinEntries` 留空。

### 5.4 数量速查

| 字段 | 标准数量 | 校验器处理 |
|------|----------|-----------|
| `senses` | 8-10 | <2 报错；2-7 或 >10 警告 |
| `collocations` | 4-7 | <4 报错；>7 警告（历史有 8 条） |
| `forms` | 按词性写全 | 至少 1 条 |
| `derivatives` | 2-8 | 至少 1 条 |
| `etymology.items` | 5-6 | 超出报错 |
| `similar.groups` | 2 | <2 报错；>2 警告 |
| `similar.groups[].entries` | 3-7 | <2 报错 |
| `mnemonics.normal` | 5 | 不等于 5 报错 |
| `mnemonics.abstract` | 3 | 不等于 3 报错 |
| `examples` | 3 | 不等于 3 报错 |
| `semanticMap.chain` | 6 | 不等于 6 报错 |
| `semanticMap.branches` | 5 | 不等于 5 报错 |
| `affixes.items` | 8-12 | 超出报错 |
| `affixes.latinEntries` | 0-7 | 允许空数组 |

---

## 6. 校验脚本

### 6.1 位置

`tools/check-entry.js`（Node.js，无第三方依赖）。

### 6.2 用法

```bash
# 校验单个新批次（默认包含「与已有 3534 词重名」检查）
node tools/check-entry.js books/prepared/toefl-core-5000-0241.json

# 一次校验多个文件 / 整个目录
node tools/check-entry.js books/prepared/toefl-core-5000-0241.json books/prepared/toefl-core-5000-0242.json
node tools/check-entry.js books/prepared

# 机器可读输出
node tools/check-entry.js books/prepared/toefl-core-5000-0241.json --json

# 重新验收已经并入词库的历史词条（跳过跨库重名检查，其余规则照常）
node tools/check-entry.js books/prepared/toefl-core-5000-0200.json --existing
```

### 6.3 检查项

- 顶层 22 键是否存在、是否有多余键、顺序是否正确、类型是否正确；
- 空串、纯空白、空数组（`affixes.latinEntries` 除外）；
- 嵌套键集合与顺序（`senses` 9 键、`pos` 2 键、`collocations` 2 键、
  `forms` 2 键、`derivatives` 3 键、`etymology` 3 键、`similar.groups` 2 键、
  `similar.entries` 5 键、`semanticMap.branches` 3 键、`affixes.items` 6 键等）；
- `senses` 至少 2 组、编号连续、标题/定义不重复；
- `similar.groups` 至少 2 组、每组条目 ≥2、不自我引用、组内不重复、标题统一；
- 例句至少 1 条包含目标词或其变形；
- 音标格式（支持一对或多对 `/…/`）；
- 繁體字、中英混杂（未加引号连续英文 ≥6 词）、英文字段混入中文；
- `scene` / `sceneCN` 专项检查（目标词出现次数、`第 N 个义项` 引用）；
- 批次内重名、与 `books/toefl-core-5000.json` + `books/prepared/*.json` 跨库重名。

### 6.4 输出与退出码

- 输出逐条 `ERROR` / `WARN`，末尾给出：词条总数、通过、失败、错误数、警告数、
  批次内重名、跨库重名、文件解析失败数。
- 退出码：`0` 全部通过；`1` 存在错误或解析失败；`2` 未提供输入。
- `WARN` 不影响退出码，但建议在新批次中清零。

### 6.5 已知边界

- 中英混杂采用「未加引号的连续英文 ≥6 词」启发式，合法的英文短语引用不会误报。
- 繁體字使用「简体不会用到的繁体专用字」清单检测；`首`、`骨`、`餐`、`香` 等共用字不误判。
- 跨库重名默认把 `books/toefl-core-5000.json` 与所有 `books/prepared/*.json` 作为已有语料；
  `--existing` 只跳过这一步，其余检查不变。

---

## 7. 示例词条

完整示例见 [sample-entry-remedy.json](schema/sample-entry-remedy.json)（`word: "remedy"`）：

- 22 键、顺序固定；
- 8 组义项（`01`-`08`），每组 9 键；
- `LOOK-ALIKE` / `NEAR MEANING` 两组，各 5 个条目，无自我引用；
- 6 段词源，清楚区分「一般认为」与「来源不确定」；
- 6 环语义链 + 5 条回指分支（引用 `01`、`02 · 05 · 06`、`03`、`04`、`07 · 08`）；
- 8 条构词条目 + 4 条拉丁同源词 + 5 条可选派生词；
- 3 条例句、5 条正常联想 + 3 条抽象联想、4-7 条搭配。

校验结果：

```bash
$ node tools/check-entry.js books/schema/sample-entry-remedy.json
=== 汇总 ===
词条总数：1
通过：1
失败：0
错误：0 条
警告：0 条
```
