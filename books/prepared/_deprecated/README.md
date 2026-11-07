# _deprecated 归档说明

## toefl-core-5000-0106.json

**归档时间**：2026-11-06

**归档原因**

1. 顶层结构为字典（`{"0": {...}, "1": {...}, ...}`，共 15 条），与本目录其余批次统一采用的数组格式不一致，导入脚本按数组解析会漏读。
2. 文件内 15 个词与 `toefl-core-5000-0111.json` 完全重复：fertility、infertile、soil erosion、alluvial、astronomy、astronomical、astronomer、astrophysics、astrophysical、astrophysicist、universe、universal、cosmos、cosmic、galaxy。
3. 0111 为该组词的数组格式版本，且已通过 22 键结构、义项、语义链、分支引用、词源、词缀、空值等全量校验，故保留 0111，将 0106 移入本目录留存。

**处理方式**：仅移动文件、保持原文件名，未做任何内容修改；归档后 `books/prepared/toefl-core-5000-*.json`（排除元数据文件与 `_deprecated`）重复词组数为 0。

## toefl-core-5000-0241.json

**归档时间**：2026-11-06

**归档原因**

1. 该文件误填了本应属于 0235 的 15 个词（heat wave、paleoclimate、climate reconstruction、prevail、proliferate、stimulate、analogous、consecutive、discrete、account for、adapt to、attribute to、be associated with、be characterized by、be composed of），与 `toefl-core-5000-0235.json` 完全重复。
2. 按队列编号对应关系，0241 应使用 chunk-0038，而 chunk-0038 尚未就绪；本文件属于误编号产物。
3. 0235 已按原规范重建并通过全量校验，故保留 0235，将 0241 移入本目录留存。

**处理方式**：仅移动文件、保持原文件名，未做任何内容修改；归档后 `books/prepared/toefl-core-5000-*.json`（排除元数据文件与 `_deprecated`）重复词组数为 0。

