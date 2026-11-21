# 八本新词书批次质量抽查报告

- 审计时间快照：2026-11-08 18:06（Asia/Shanghai）
- 审计方式：只读。未修改任何批次/词库/页面文件，未执行 git 操作；本报告为唯一新增文件。
- 校验命令：`node tools/check-entry.js <文件>`（全模式，含跨库重名）与 `node tools/check-entry.js <文件> --existing`（跳过跨库重名）。
- 结构检查脚本：一次性内联 Python（未落盘），逐词遍历 22 顶层键、`senses` 9 键、`examples`、`etymology`、`similar`、音标与空值。

> 重要前提：审计期间 `books/prepared/` 仍在被并发写入。`sat-0005.json` 从 30 条增长到 36 条，`gaokao-0002.json`、`shanghai-0010.json` 在审计过程中出现。因此下文所有「文件数 / 词条数」均为 18:06 快照值，实际数量可能更大。

---

## 一、总览

| 词书 | 文件数 | 词条数 | 全模式通过 | 全模式失败原因 | `--existing` 结果 | 主要问题等级 |
|------|-------:|-------:|-----------:|----------------|-------------------|--------------|
| sat | 5 | 172 | 172 / 172（全部 exit 0） | 无 | 0 错 0 警 | 中 |
| shanghai | 10 | 160 | 151 / 160 | 9 个跨库重名（允许口径） | 0 错 0 警 | 高 |
| cet4 | 2 | 60 | 37 / 60 | 23 个跨库重名 | 0 错 0 警 | 高（仅 cet4-0002 内容） |
| cet6 | 2 | 40 | 5 / 40 | 35 个跨库重名 | 0 错 0 警 | 低 |
| daily | 1 | 40 | 8 / 40 | 32 个跨库重名 | 0 错 0 警 | 中 |
| gaokao | 2 | 60 | 9 / 60 | 51 个跨库重名 | 0 错 0 警 | 低 |
| ielts | 1 | 40 | 39 / 40 | 1 个跨库重名 | 0 错 0 警 | 中 |
| middle | 2 | 40 | 14 / 40 | 26 个跨库重名 | 0 错 0 警 | 高 |
| **合计** | **25** | **612** | **435 / 612** | 失败全部为「与已有 3534 词库/其他批次重名」 | **全部 0 错 0 警** | — |

结论先行：

1. **结构层面全部合格**。612 条词条无一例外满足 22 键与固定顺序、`senses` 恰好 8 组 × 9 键、`similar.groups` 恰好 2 组且 heading 只用 `LOOK-ALIKE` / `NEAR MEANING`、`etymology` 5–6 段、`examples` 固定 3 条、英式/美式音标分别给出。
2. **全模式失败不计质量问题**。按既定口径「不剔除与现有 3534 词库重叠的词」，重名是预期行为，`--existing` 全部 0 错 0 警。
3. **真正的问题在语义内容层**：`cet4-0002` 混入专名与屈折形式并编造义项/变形；`shanghai` 与 `middle` 的 8 组义项 100% 由 8 句轮换模板生成；`sat` 用「与 X 之别」充当义项凑数。

---

## 二、逐本明细

### 1. sat（5 文件 / 172 词）

- 文件：`sat-0001`(16)、`sat-0002`(40)、`sat-0003`(40)、`sat-0004`(40)、`sat-0005`(36，审计中仍在增长)
- 校验：5 个文件全部 `exit 0`，0 错 0 警，0 跨库重名（这批词不在原 3534 词库内）。
- 结构：22 键与顺序 0 异常；`senses` 全为 8×9；`similar` 全为 2 组、heading 合规；音标全部 `/…/` 格式。

问题（中等）：

1. **用「与 X 之别」充当义项凑 8 组**：77 / 172 词、共 131 条义项属于此类，占该批义项总数的 9.6%。例：
   - `polemic` 第 6 义项「与批评之别」
   - `proscribe` 第 6 义项「与 prescribe 之别」
   - `puerile`「与 childlike 之别」、`puncture`「与 pierce 之别」、`punitive`「与 corrective 之别」、`purvey`「与 provide 之别」
   - `repairable`（sat-0005）8 组义项中第 6–8 组分别是 fixable / restorable / mendable 的对比，且这三条例句里根本不出现 repairable，实质只有 2 个真义项。
2. **义项例句不含目标词或为元描述**（3 处）：
   - `ranch` 例句 1「His family had ranched the valley…」（`ranched` 未列入 `forms`）
   - `rattlesnake` 例句 3「The sound on the sand was the only warning they had.」
   - `pamphleteer` 例句 3「He pamphleteered for the cause…」（动词形式未列入 `forms`）
3. **词源首段过短**（< 25 英文词或 < 10 汉字）：7 词 — `redemptive`、`reissue`、`rejectionist`、`remorseful`、`renegade`、`reportable` 等首段均为一句话带过。
4. `nefarious`（sat-0002）存在两组义项共用同一条例句。

### 2. shanghai（10 文件 / 160 词）

- 文件：`shanghai-0001`(40)、`0002`(40)、`0003`–`0010`（各 10 词，0003 起每批只有 10 词，与「每批 40 词」的约定不一致）
- 校验：全模式 151 / 160 通过，9 条失败全部是跨库重名（`afternoon`、`above`、`between` 等基础词与现有词库重叠），`--existing` 0 错 0 警。
- 结构：22 键、8×9、2 组 heading、5–6 段词源均合格。

问题（高）：

1. **8 组义项的 `whyCN` 全部是同一套 8 句轮换模板**，160 / 160 词、1280 / 1280 条命中。模板顺序固定为：
   - 「核心画面是「…」；这一义项取它最字面的一层：X。」
   - 「同一幅画面转向「X」，具体的形象于是又命名了另一类用法。」
   - 「这里这个词不再指单独一件东西，而指一种反复出现的模式：X。」
   - 「从总体画面里取出单独一例，给它一个自己的名字：X。」
   - 「画面形状不变而材质改变，从实物变成一种性质：X。」
   - 「形象被带进更大的框架，『X』借用了旧的画面作类比。」
   - 「在固定短语里，这个词沉淀为一种社交惯例：X。」
   - 「最后这幅画面被整理成一个可排定、可制度化的单位：X。」
   
   这属于「只用模板句」的典型凑数，`whyCN` 没有解释该义项为什么从这个核心意象长出来。
2. **后几组义项不是真义项**。例：
   - `computer` 第 7 义项「电脑程序」、第 8 义项「计算机课」，其实是搭配，不是词义。
   - `camp` 第 6 义项「营地生活」、第 8 义项「难民营」同属第 1 义项的下位场景。
   - `a` 第 8 义项「字母名称」、`do` 第 4/5 义项「助动词疑问/否定」勉强成立，但 8 组里有 4 组是语法位置差异而非词义差异。
3. **基础功能词与屈折形式入表**：`am`、`are`、`is`、`it`、`in`、`do`、`a`、`best`（good 的比较级）、`boating`、`building` 等。这些词来自上海清单本身，不算生成错误，但作为深度词条价值很低，且 `am`/`are` 的 `forms` 直接列 `be/was/been`，义项互相高度重叠。
4. **专名被小写化**：`american`、`canada`、`april`、`august`。`august` 同时塞入「八月」与「威严的」，`definition_zh` 写成「八月；威严的；令人敬畏的」，两个不同来源的义项被合并。
5. **元描述式例句**（4 处）：`august`「The name honours the first Roman emperor.」、`ball`「The word appears in informal body talk.」、`come`「The word comes from Latin.」、`american`「The word is spelled the American way.」
6. **义项例句过短**：84 / 160 词存在 < 5 词的义项例句（如 `am` 全 8 组都是 “I am ready.” 这类 3 词句）。
7. **词源短段**：16 词共 17 段过短，集中在 `breakfast`[3]、`bridge`[1]、`it`[3,5]、`basket`[4]、`before`[3]、`by`[1] 等。

### 3. cet4（2 文件 / 60 词）

- 文件：`cet4-0001`(20)、`cet4-0002`(40)
- 校验：`cet4-0001` 0/20 通过（20 个词全部与现有词库重名），`cet4-0002` 37/40（3 个重名）。`--existing` 两文件均 0 错 0 警。
- 结构：22 键、8×9、heading、词源段数均合格；`cet4-0001` 的多音音标写作 `/ˈæbsənt/ (adj.); /æbˈsent/ (verb)`，符合规范允许的「带标签」写法，`check-entry.js` 也判定通过。

问题（高，集中在 `cet4-0002`）：

1. **38 / 40 个词不在 `books/import/filtered/cet4.json` 清单内**，即该批次基本没有按源清单生成。缺失清单的词包括 `alaric`、`albee`、`ales`、`algebra`、`alienating`、`alleluia`、`allergenic`、`allographs`……
2. **专名混入**：
   - `alaric`（西哥特国王人名）：`forms` 编造为 `Alaricus`；8 组义项包含「隐墓传说」「时代终结的代称」这类无从查证的杜撰内容。
   - `albee`（美国剧作家姓氏）：`forms` 编造为 `Alby`、`Albee's`；义项包含「南达科他州小社区」「旧地图上的地名」。
3. **屈折形式混入**（用户重点检查项，本批最严重）：`ales`（ale 复数）、`alienating`（alienate 现在分词）、`allographs`、`allowed`、`altering`、`altimeters`、`analogies`、`angerous`→`angered`、`angrier`、`annoyed`、`answering`、`apologizes`、`appalls`、`appetizing`、`amis`（法语 ami 复数）。
4. **为凑义项而编造**：`amis` 第 7/8 义项写成「医学缩写 AMI」「计算机缩写 AMI」，与词条本身无关；`ales` 第 7/8 义项「姜汁汽水类」「酒馆招牌上的艾尔」也属硬凑。
5. 其余 `cet4-0001` 的 20 条（abandon / ability / able …）质量正常，`examples` 3 条均含目标词，词源 5–6 段有实质内容。

### 4. cet6（2 文件 / 40 词）

- 文件：`cet6-0001`(20)、`cet6-0002`(20)
- 校验：全模式 5 / 40 通过，35 条失败全部是跨库重名（`abandon`、`able`、`abnormal`、`academic` 等）；`--existing` 0 错 0 警。
- 结构：全部合格，词源 5 段、含实质内容（如 `abandon` 的 a bandon → abandoner → 15 世纪 → 现代义六段清楚）。

问题（低）：

1. `absolute` 第 7 义项「语法的独立结构」例句是 “Weather permitting, the match will go ahead.”——语法上正确演示了独立结构，但句中不出现 absolute，学习者无法从例句对应到词条。
2. `absolute` 的 `forms` 只有 `["absolute"]`（形容词/名词无屈折），符合规则但信息量偏低。

### 5. daily（1 文件 / 40 词）

- 文件：`daily-0001`(40)
- 校验：全模式 8 / 40 通过，32 条失败全部跨库重名；`--existing` 0 错 0 警。
- 结构：合格；`abuse` 双音标带 `(noun)/(verb)` 标签，合规。

问题（中）：

1. **10 / 40 词不在 `books/import/filtered/daily.json` 清单**：`abandoned`、`abductor`、`abhorrence`、`abnegation`、`abort`、`abreast`、`abundant`、`acetate` 等。
2. **屈折形式词条**：`abandoned` 被单独出条（释义为「被遗弃的；荒废的」形容词义）。它作为形容词有独立地位，但源清单没有这个词，属越出清单的自选词，且与 `abandon` 语义高度重叠。
3. `able` 第 7 义项例句「The old label was barely readable after years in the sun.」实际演示 readable，不含 able（同类问题还有 `readable` 与 `able` 混用）。

### 6. gaokao（2 文件 / 60 词）

- 文件：`gaokao-0001`(40)、`gaokao-0002`(20，审计过程中新增)
- 校验：全模式 9 / 60 通过，其余为跨库重名；`--existing` 两文件 0 错 0 警。
- 结构：合格，词源 5–6 段，`examples` 3 条。

问题（低）：

1. 5 / 40 词不在 `books/import/filtered/gaokao.json` 清单：`abnormality`、`abridge`、`abstinence`、`accrue`、`accustomed`。
2. 元描述式例句：`able` 第 7 义项「The ending turns read into readable.」、`accent` 第 6 义项「The word cafe carries an acute accent on its final letter.」
3. `absurd` 第 8 义项例句「She collected the small absurdities of daily office life.」用的是派生词 absurdities，可接受但需与 `forms` 对应。

### 7. ielts（1 文件 / 40 词）

- 文件：`ielts-0001`(40)
- 校验：全模式 39 / 40 通过（1 个跨库重名）；`--existing` 0 错 0 警。
- 结构：合格，词源 6 段、`similar` 两组各 5 条、`examples` 3 条全部含目标词。

问题（中）：

1. **34 / 40 词不在当前 `books/import/filtered/ielts.json` 清单内**。该文件在本轮已被重新导出为 6000 词版本，而本批次仍按早前 2200 词左右的版本生成（`abdicate`、`ablate`、`abortionist`、`absolve`、`abusive` 等均不在新清单中）。数据源已被覆盖，本批与现有清单无法对齐。
2. `adverb` 作为语法术语出条，第 2–5 义项的例句（“She spoke quietly…” / “They arrived early…” / “The children played outside…” / “The water was almost boiling…”）全部不含 adverb，只能靠释义反推，实用价值低。
3. `animate` 双音标带 `(adj.)/(v.)` 标签，合规但 UK 与 US 写法完全相同。

### 8. middle（2 文件 / 40 词）

- 文件：`middle-0001`(20)、`middle-0002`(20)
- 校验：全模式 14 / 40 通过，26 条跨库重名（`a`、`ability`、`able`、`about`、`above`、`add`、`address`…）；`--existing` 两文件 0 错 0 警（`middle-0002` 早前出现的 7 条 `derivatives` 错误已被写入方修复）。
- 结构：合格。

问题（高）：

1. **模板化 `whyCN`**：40 / 40 词、320 / 320 条命中同一套模板，句式与 shanghai 完全一致，仅前缀换成「古英语中表示「一」的词弱化…」之类的单句然后接「在这一义项里，这一想法表现为：X。」
2. **义项凑数明显**：39 / 40 词的 `definition_zh` 列出的义项数比 `senses` 少 4 条以上（例如 `camp` 只写「营地；露营」却给出 8 组义项；`computer` 只写「计算机；电脑」也给出 8 组）。
3. **义项例句过短**：14 / 40 词存在 < 5 词的义项例句（`a` 全 8 组均为 “I have a new bag.” 这类三词句）。
4. `a`、`address`、`air` 等词的 8 组义项中，第 7/8 组常为派生搭配（「用于数量短语」「网络地址」「航空」），并非该词独立义项。

---

## 三、跨词书共性问题

| 问题 | 影响范围 | 说明 |
|------|----------|------|
| `whyCN` 8 句轮换模板 | shanghai 160 词 + middle 40 词（100% 义项） | 最需要重写的一类；`whyCN` 应解释义项从核心意象「为什么」长出来，而不是套句式。 |
| 「与 X 之别」填义项 | sat 77 词 / 131 义项 | 辨析有价值，但不应占用 8 组义项名额；建议并入 `similar.groups` 或 `mnemonics`。 |
| 屈折形式 / 专名入表 | cet4-0002（最严重）、daily-0001、shanghai | `ales`、`alienating`、`allographs`、`angerous`、`amis`、`alaric`、`albee`；`american`、`canada`、`april`、`august`。 |
| 元描述充当例句 | 9 处：cet4 `able`、cet6 `accent`、gaokao `able`/`accent`、middle `a`、shanghai `august`/`ball`/`come`/`american` | 例句应是真实语用句，不是「The word comes from Latin.」。 |
| 义项例句不含目标词 | sat 1.7%、shanghai 1.6%、ielts 2.5%、gaokao 1.6%、cet6 1.2%、cet4 0.6%、daily 0.3% | 少数是合理派生（absolutely / abundantly / readable），少数是真错（`adverb` 第 2–5 条、`range` 类）。 |
| 义项例句过短 | shanghai 84 词、middle 14 词、cet4/gaokao 各 1 词 | 基础词集中出现，教学价值偏低。 |
| 词源段落过短 | sat 7 词、shanghai 16 词 | 未违反 5–6 段硬性要求，但个别段落只有一句话，信息密度不足。 |
| 跨批次重复词 | 45 个 | 按既定口径「各词书独立、跨词书重复无需去重」属预期，不视为缺陷（如 `abandon` 出现在 cet4/cet6/daily/gaokao）。 |
| 批次规模不一 | sat 16/40/40/40/36+、shanghai 40/40/10×8、cet4 20/40 | 与「每批 40 词」约定不符；不影响校验，但会拖慢后续合并。 |

---

## 四、整改优先级（仅建议，本次未改动任何文件）

1. **P0 — `cet4-0002` 建议整体重做**：按 `books/import/filtered/cet4.json` 清单重新选词，删除专名与屈折形式词条（`alaric`、`albee`、`ales`、`alienating`、`allographs`、`amis` 等），删除为凑数编造的义项与变形。
2. **P0 — `shanghai` + `middle` 的 `whyCN` 批量重写**：240 个词 × 8 条 = 1920 条模板句需要替换为针对该义项的真实解释；同时压缩凑数义项（`computer`、`camp`、`do`、`a` 等）。
3. **P1 — `sat` 的「与 X 之别」义项迁移**：把 131 条辨析从 `senses` 挪到 `similar` 或 `mnemonics`，补回真实义项；`repairable` 这类只有 2 个真义项的词应改为 2 组而非硬凑 8 组。
4. **P1 — 数据源对齐**：`ielts-0001`（34/40 不在清单）、`cet4-0002`（38/40）、`daily-0001`（10/40）、`gaokao-0001`（5/40）需在清单稳定后确认增减，避免批次与源清单脱节。
5. **P2 — 例句治理**：替换 9 处元描述例句；为 `adverb`、`able` 等义项补含目标词的例句；把 < 5 词的义项例句补到可读长度。
6. **P2 — 批次规模统一**：shanghai 0003 起每批 10 词，建议后续合并成 40 词/批，便于统一验收。

---

## 五、方法与口径说明

- 「22 键顺序」按 `books/BOOK-SCHEMA.md` §1 的固定序列逐词比对，612 条全部一致，无多余键、无缺键。
- 「senses 8 组」按实际长度统计：612 条全部为 8，无 7 组或 9 组的情况；每组 9 键及顺序全部一致。
- 「examples 至少 3 条且每条含目标词」按 `word` + `forms[].form` 做全词边界匹配；派生词句（如 absurdities、abundantly）未计入缺失，但已单列说明。
- 「音标英式/美式分别给出」按 `ipa_uk`、`ipa_us` 均非空且符合 `/…/` 判定；多音条目带 `(noun)`/`(v.)` 标签属规范允许写法。
- 跨库重名统计会随 `books/prepared/` 新增文件实时变化，本报告数字为 18:06 快照。
