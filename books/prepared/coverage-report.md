# TOEFL 词书深度词条全库终检与覆盖报告

> 生成时间：2026-11-06 18:56（Asia/Shanghai）。本次为只读终检，未修改任何既有批次词条，唯一写出文件为本报告。
>
> 统计口径：批次来源为 `books/prepared/toefl-core-5000-*.json`，排除非数组元数据 `toefl-core-5000-duplicate-positions.json` 与 `books/prepared/_deprecated/` 归档；词书权威名单为 `books/toefl-core-5000.json` 的 `entries` 数组（3534 条，`declaredTotal` 为 5000，本报告一律以实际 entries 为分母）。词条比对统一采用「转小写 + 去首尾空白 + 连续空白压为一个空格」；不做词形还原、不做同义合并。结构校验对每条记录逐字段实跑；场景挖空按页面 `sceneSentence`（取首个拉丁字母起的英文句）与 `buildSpeakBlank`（大小写不敏感、长词形优先、整词边界替换、含不规则变形表）同款逻辑逐条实跑，非抽样。

## 一、总体数字

| 指标 | 数值 |
| --- | --- |
| 纳入批次文件数 | 238（glob 命中 239 个，其中 1 个为非数组元数据，已排除） |
| 解析失败文件数 | 0 |
| 词条总记录数 | 3534 |
| 规范化去重后唯一词数 | 3534 |
| 重复词（出现在多个批次） | 0 |
| 词书 entries 总数 | 3534 |
| 已覆盖词数 | 3534 |
| 覆盖率 | 100.00% |
| 仍未覆盖词数 | 0 |

批次文件与词书名单完全一一对应：两侧规范化集合的差集均为 0，且未发现仅大小写或空白不同的「近似命中」条目。

## 二、按 tier 的覆盖分布

| Tier | 词书条数 | 已覆盖 | 缺口 | 覆盖率 |
| --- | --- | --- | --- | --- |
| 基础高频词 | 500 | 500 | 0 | 100.00% |
| 学术阅读词汇 | 1326 | 1326 | 0 | 100.00% |
| 进阶学术词汇 | 1371 | 1371 | 0 | 100.00% |
| 高阶拓展词汇 | 337 | 337 | 0 | 100.00% |
| **合计** | **3534** | **3534** | **0** | **100.00%** |

**仍未覆盖词：0（无）。**

## 三、结构规范校验

### 3.1 逐项通过/失败计数

| 校验项 | 通过 | 失败 / 不可判定 |
| --- | --- | --- |
| 批次文件顶层为数组 | 238 | 0（1 个非数组元数据已按要求排除） |
| 每条记录 22 个顶层键且键序完全一致 | 3534 | 0 |
| senses 每条 9 键且键序一致 | 3519（全部可解析记录） | 15（0111 的 senses 为对象而非数组，不可按数组判定） |
| senses 义项数 8–10 | 3504 | 30（其中 15 条为 6 个义项、5 条为 7 个义项、15 条容器为对象） |
| senses 的 no 连续（1..n） | 3519 | 0（15 条容器为对象，不可判定） |
| semanticMap 主链恰好 6 环 | 3521 | 13（10 条 7 环、3 条 8 环） |
| semanticMap 分支恰好 5 条 | 3522 | 12（9 条 4 分支、3 条 3 分支） |
| 分支回指本词真实义项编号 | 3532 | 2（均写作 `ALL`，非具体义项编号） |
| etymology 5–6 段 | 3519 | 15（0111 的 items 为对象而非数组） |
| era 字段全大写（严格口径） | 2970 | 564（含小写字母；复核见 3.3） |
| 空串 / null / 字面 undefined、null / 占位串 | 3534 | 0 |
| 零宽字符 | 3533 | 1（`0232 carrying capacity` 的 similar 释义） |

**结构硬性结论（不含 era 严格大小写）**：通过 **3502** 条，失败 **32** 条。
**若把 era 严格全大写也计入失败**：通过 **2941** 条，失败 **593** 条（其中 561 条仅因 era 小写，见 3.3）。

### 3.2 结构失败清单（32 条）

| 批次文件 | 词 | 失败项 |
| --- | --- | --- |
| toefl-core-5000-0001.json | abandon | 义项 6 条；分支 4 条 |
| toefl-core-5000-0001.json | ability | 义项 7 条；主链 7 环；分支 4 条 |
| toefl-core-5000-0001.json | abnormal | 义项 6 条；主链 7 环；分支 4 条 |
| toefl-core-5000-0001.json | abolish | 义项 6 条；分支 4 条 |
| toefl-core-5000-0001.json | absence | 义项 7 条；主链 8 环 |
| toefl-core-5000-0001.json | absolute | 义项 7 条；主链 8 环；分支 4 条 |
| toefl-core-5000-0001.json | absorb | 义项 7 条；主链 7 环；分支 4 条 |
| toefl-core-5000-0001.json | abstract | 义项 7 条；主链 7 环 |
| toefl-core-5000-0001.json | abundant | 义项 6 条；主链 7 环；分支 4 条 |
| toefl-core-5000-0001.json | abuse | 义项 6 条；主链 7 环 |
| toefl-core-5000-0001.json | academic | 义项 6 条；主链 7 环；分支 4 条 |
| toefl-core-5000-0001.json | accelerate | 义项 6 条；主链 7 环；分支 3 条 |
| toefl-core-5000-0001.json | access | 义项 6 条；主链 7 环；分支 3 条 |
| toefl-core-5000-0001.json | accessible | 义项 6 条；主链 7 环；分支 3 条 |
| toefl-core-5000-0001.json | accident | 义项 6 条；主链 8 环；分支 4 条 |
| toefl-core-5000-0011.json | correspond | semanticMap 第 5 分支回指写作 `ALL` |
| toefl-core-5000-0011.json | currency | semanticMap 第 5 分支回指写作 `ALL` |
| toefl-core-5000-0111.json | fertility | 9 个本应为数组的容器写成以 `"0"`–`"n"` 为键的对象：collocations、forms、derivatives、senses、examples、etymology.items、mnemonics.normal、mnemonics.abstract、affixes.items |
| toefl-core-5000-0111.json | infertile | 同上 |
| toefl-core-5000-0111.json | soil erosion | 同上 |
| toefl-core-5000-0111.json | alluvial | 同上 |
| toefl-core-5000-0111.json | astronomy | 同上 |
| toefl-core-5000-0111.json | astronomical | 同上 |
| toefl-core-5000-0111.json | astronomer | 同上 |
| toefl-core-5000-0111.json | astrophysics | 同上 |
| toefl-core-5000-0111.json | astrophysical | 同上 |
| toefl-core-5000-0111.json | astrophysicist | 同上 |
| toefl-core-5000-0111.json | universe | 同上 |
| toefl-core-5000-0111.json | universal | 同上 |
| toefl-core-5000-0111.json | cosmos | 同上 |
| toefl-core-5000-0111.json | cosmic | 同上 |
| toefl-core-5000-0111.json | galaxy | 同上 |

注：0111 的 semanticMap.chain（6 环）与 branches（5 条）本身仍为数组且回指编号（01–08）有效；该文件的问题集中在 9 个嵌套容器被序列化为对象。`0001` 为早期批次，义项数与主链/分支数量沿用旧规格（6–8 义项、7–8 环、3–4 分支）。

### 3.3 关于 era 大小写的复核说明

严格按「era 字段不含任何小写字母」判定，有 564 条记录的 era 未通过；逐值复核 1297 种取值后确认：小写部分全部属于下列三类，**未发现小写的时代标签**（如小写的 `latin`、`old french`）：

1. 世纪记号：`c.`、`s`、`th`、`14c`、`1580s` 等；
2. 限定词/括注：`late`、`early`、`mid-`、`before`、`reconstructed`、`no written record`；
3. 引用的外文词形或词缀：`LATIN facere`、`GREEK lyein`、`ENGLISH -ly`、`PREFIX con-` 等。

因此，若按规范意图（时代标签大写、世纪与引文按惯例小写）判断，此 564 条应视为通过；仅在字面全大写口径下计为失败。

### 3.4 空值与零宽

未发现空串、JSON null、字面 `undefined`/`null`、占位串。零宽字符 1 处：

| 批次 | 词 | 位置 | 内容片段 |
| --- | --- | --- | --- |
| toefl-core-5000-0232.json | carrying capacity | similar.groups[1].entries[1].definitionCN | 「指物种能存活的条\u200b\u200b件范围…」含 2 个 U+200B |

## 四、场景可挖空性校验

全量 3534 条逐条实跑（非抽样）：**通过 3499 条，失败 35 条**。

失败原因分布：目标词在英文场景句中出现 2 次 25 条、3 次 7 条、目标词未出现（用了不规则变形）3 条。出现多次时页面只会挖掉第一处，句中仍残留目标词，无法形成唯一空位。

| 批次文件 | 词 | 原因 |
| --- | --- | --- |
| toefl-core-5000-0014.json | element | 目标词出现 2 次 |
| toefl-core-5000-0017.json | grant | 目标词出现 2 次 |
| toefl-core-5000-0017.json | guarantee | 目标词出现 2 次 |
| toefl-core-5000-0022.json | medical | 目标词出现 2 次 |
| toefl-core-5000-0027.json | prospect | 目标词出现 2 次 |
| toefl-core-5000-0027.json | protocol | 目标词出现 3 次 |
| toefl-core-5000-0027.json | publication | 目标词出现 2 次 |
| toefl-core-5000-0027.json | publish | 目标词出现 3 次 |
| toefl-core-5000-0027.json | purchase | 目标词出现 2 次 |
| toefl-core-5000-0027.json | quote | 目标词出现 2 次 |
| toefl-core-5000-0027.json | radical | 目标词出现 2 次 |
| toefl-core-5000-0027.json | range | 目标词出现 2 次 |
| toefl-core-5000-0027.json | ratio | 目标词出现 2 次 |
| toefl-core-5000-0030.json | sole | 目标词出现 2 次 |
| toefl-core-5000-0034.json | domestic | 目标词出现 2 次 |
| toefl-core-5000-0038.json | arrangement | 目标词出现 2 次 |
| toefl-core-5000-0038.json | artificial | 目标词出现 3 次 |
| toefl-core-5000-0038.json | artificially | 目标词出现 3 次 |
| toefl-core-5000-0038.json | ascertain | 目标词出现 3 次 |
| toefl-core-5000-0038.json | assessment | 目标词出现 3 次 |
| toefl-core-5000-0039.json | botanical | 目标词出现 2 次 |
| toefl-core-5000-0055.json | inference | 目标词出现 2 次 |
| toefl-core-5000-0055.json | influential | 目标词出现 2 次 |
| toefl-core-5000-0055.json | information | 目标词出现 2 次 |
| toefl-core-5000-0055.json | informative | 目标词出现 2 次 |
| toefl-core-5000-0055.json | infrastructure | 目标词出现 2 次 |
| toefl-core-5000-0055.json | innovative | 目标词出现 2 次 |
| toefl-core-5000-0055.json | institutional | 目标词出现 2 次 |
| toefl-core-5000-0055.json | institution | 目标词出现 2 次 |
| toefl-core-5000-0055.json | instructional | 目标词出现 2 次 |
| toefl-core-5000-0055.json | integration | 目标词出现 3 次 |
| toefl-core-5000-0055.json | integrity | 目标词出现 2 次 |
| toefl-core-5000-0080.json | phylum | 目标词未出现（句中用复数 `phyla`，不在变形表） |
| toefl-core-5000-0165.json | choose | 目标词未出现（句中用 `chose`，不在变形表） |
| toefl-core-5000-0195.json | testify | 目标词未出现（句中用 `testified`，`testify+ed` 不匹配） |

按文件聚集：0027 共 9 条、0038 共 5 条、0055 共 11 条，三者合计 25 条，占失败总数 71%。

## 五、中英文混杂与繁体字抽查

### 5.1 中文字段夹拉丁字母

共 **2811 条记录、9727 处字段命中**。分布如下：

| 字段 | 命中记录/次数 | 性质判定 |
| --- | --- | --- |
| sceneCN | 2539 | 目标词引用（「这里 X 是…」），属设计内例外 |
| senses.whyCN | 6104 | 词源/词根引文（如 `bandon`、`habilis`），属规则的「引文类」 |
| senses.definitionCN | 535 | 用法短语引用（如 `abandon oneself to`） |
| senses.exampleCN | 288 | 目标词/术语引用 |
| senses.titleCN | 209 | 词族或后缀标签（如 `-ability`、`commencement`） |
| definition_zh | 30 | 词性/复数来源/化学式等标签（如 `n.`、`datum 的复数`、`RNA`、`pH`） |
| core_image | 22 | 词根引文或场景图英文标注（如 `bene + facere`、`Big Bang`、`paid back`） |

抽查结论：以上均属目标词、语法标签、词源引文或图内短标注，**未发现成句的未翻译英文**。`definition_zh` 与 `core_image` 无真正「英文句子」级混杂。

### 5.2 英文字段夹中文

共 **160 条记录、约 190 处**，集中在早期批次（0027 有 15 条、0011 有 14 条、0007 有 13 条、0038 有 12 条、0021 有 11 条、0002 有 10 条）。主要形态是把中文标注写进英文叙述，例如：

- `etymology.items[].en` 中写「…so the root is 来源不确定.」「…is 一般认为是…」（171 处）；
- `senses.why` 中写 `the metaphor of the追踪`、`the first筛选 election`、`its 质`；
- `definition_en` / `title` / `example` / `mnemonics.en` 中夹入「记忆」「五官」等中文词（个别条目讨论汉语量词时引用「本」「张」，属说明性例外）。

规则要求英文字段只能使用 `source uncertain`，以上中文标注应改为英文或移除。`forms[].label`（如「三单」「过去式」）、`pos[].tag`（如「名词」）与 `similar` 的 `tag` 本身即中文元数据，不计入本条。

### 5.3 繁体字

共 **16 条记录、16 处**，均为中文行文中夹入个别繁体字形（非整段繁体）：

| 批次 | 词 | 位置 | 繁体字 |
| --- | --- | --- | --- |
| 0021 | margin | mnemonics.normal[4].cn | 條 |
| 0023 | odd | etymology.intro.cn | 該 |
| 0030 | simulate | sensesIntro.cn | 來 |
| 0035 | achievement | senses[1].definitionCN | 體 |
| 0046 | correspondence | senses[5].exampleCN | 來 |
| 0064 | significance | senses[2].whyCN | 麼 |
| 0109 | photon | senses[5].definitionCN | 個 |
| 0119 | acidification | affixes.items[8].meaningCN | 質 |
| 0142 | tribute system | senses[2].definitionCN | 體 |
| 0144 | asymmetry | etymology.items[3].cn | 於 |
| 0147 | cross-cultural | senses[7].whyCN | 會 |
| 0154 | unconscious | mnemonics.normal[4].cn | 層 |
| 0163 | university | similar.groups[1].entries[2].definitionCN | 記憶 |
| 0179 | diversification | etymology.items[0].cn | 層 |
| 0227 | coherence | senses[7].whyCN | 個 |
| 0231 | ecological balance | scene | 來 |

### 5.4 引文类（单独计）

`etymology` 全量 3534 条均含拉丁/希腊/古英语引文；`root` 有 3406 条含拉丁字母。按规则这两类作为「引文类」单列，不计入上述混杂统计。

## 六、终检结论与待修项

1. **覆盖完成**：238 个批次文件、3534 条记录、3534 个唯一词，与词书 3534 条一一对应，覆盖率 100%，重复词 0，未覆盖词 0。
2. **结构硬性失败 32 条**：集中于 `0001`（15 条旧规格义项/主链/分支）、`0011`（2 条 `ALL` 回指）、`0111`（15 条 9 个嵌套容器被写成对象）。`0111` 的问题会直接影响按数组渲染的页面逻辑，应优先修复。
3. **场景挖空失败 35 条**：25 条目标词出现 2 次、7 条出现 3 次、3 条使用了变形表未覆盖的不规则变形（`phyla`、`chose`、`testified`）。需改写场景句或扩充变形表，使每条恰好一个空位。
4. **语言混杂**：中文字段夹拉丁字母基本为设计内引用；英文字段夹中文约 190 处（多为「来源不确定」「一般认为是」等标注），需按规则改为 `source uncertain`；繁体字 16 处，需改为简体。
5. **其他**：零宽字符 1 处（0232 `carrying capacity`），空值/占位串 0。
