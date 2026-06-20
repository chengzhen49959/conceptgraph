# 概念抽取 Pipeline 说明（含提示词）

一份文档怎么变成图谱里的概念节点 + 关系边。所有代码在 `backend/`。

---

## 一、整条流水线

一个文档上传 → 一个 arq 后台任务 `ingest_document`（`app/worker.py:41`）跑完全程：

| 步骤 | 干啥 | 代码 |
|---|---|---|
| 1. 取文件 | 从 S3 拉原始字节 | `worker.py:66` |
| 2. parse 解析 | PDF→PyMuPDF 取文字；md/txt→ UTF-8 解码 | `services/parse.py` |
| 3. chunk 切块 | 按段落打包成块，每块 ≤512 token、重叠 64 token，sha256 去重 | `services/chunk.py:25` |
| 4. embed 向量化 | 每块文本算 embedding（`text-embedding-3-small`，1536 维） | `ai/embeddings.py` |
| 5. **extract 抽概念** | **每块**并发调 LLM，吐出概念 + 关系（本次重点） | `ai/extract.py:115` |
| 6. 预向量化概念 | 把每个不同概念按 `"name: description"` 算 embedding，供下一步合并 | `worker.py:98-109` |
| 7. **dedup 去重/合并** | 跨块、跨文档把"同一个概念"并成一个节点 | `services/concepts.py:resolve_concept` |
| 8. 落库 | 写概念、别名、mention（概念↔chunk）、关系边 | `services/concepts.py` |
| 9. cluster + label | Leiden 社区发现分簇 → 每簇 LLM 起个主题标签 | `services/clustering.py` |

**抽概念 = 第 5 步（一次 LLM 调用/块）+ 第 7 步（合并去重，也用 LLM 判）。**

本次测试实际数字（见 `.pipeline.json`）：
`3286 字 → 9 块 → 54 个原始概念（45 个不同名）→ 合并掉 4 个 → 41 个最终概念`，30 条关系。

---

## 二、抽概念用的提示词（系统 prompt，当前版本）

模型 `gpt-5.4-mini`，OpenAI Responses API 结构化输出（`client.responses.parse`，`ai/extract.py:115-127`）：
- `instructions=` 喂下面这段系统 prompt；
- `input=` 就是**那一块的原文**；
- `text_format=ChunkExtraction` 强制吐出 `{concepts:[{name,description,aliases}], relations:[{source,target,relation}]}`。

提示词全文（`ai/extract.py` `_INSTRUCTIONS`，★ 标的是这次为修麦基 bug 新加的）：

```
You extract knowledge from ONE passage of a document for a knowledge graph.

CONCEPTS — every concept that passes the inclusion test below. Do NOT cap the
count; return as many as the passage substantively covers (a dense passage has
several, a thin one may have none). A core concept is a specific, nameable idea:
a method, mechanism, structure, principle, phenomenon, framework, or result
the passage introduces, explains, or builds on directly.

Include a concept only if ALL hold:
- An encyclopedia could have a focused article under exactly this name.
- It is NOT a whole field or umbrella term (wrong: "Machine Learning", "经济学").
- It is NOT a generic activity, property, or artifact (wrong: "Training",
  "Evaluation", "Dataset", "动态", "原因").
- It is NOT a person. Never extract someone's name — the document's author, a      ★
  cited theorist or researcher, a historical figure — as a concept; extract the    ★
  idea, method, or framework they introduced instead, under its standard name      ★
  (a passage by 麦基/McKee on story structure yields "三幕结构", never "麦基").       ★
  The same applies to an organization cited only as a source.                      ★
- The passage substantively explains or uses it — not a passing mention.
- It is NOT a sentence, clause, claim, or question — only a noun-phrase term.

Prefer the most specific name the passage treats. Use the standard community
term as `name` (short noun phrase, singular, standard casing; spelled-out form
when an acronym also exists); put variants/abbreviations in `aliases`.

Language: write `name` and `description` in the SAME language as the passage;
never translate.

`description` (REQUIRED): 2-3 sentences defining the concept in general,
self-contained terms — what it is, how it works, what it is for. Write it like a
standalone glossary entry: never reference "this passage", "the document", or
"the author". The same concept seen in a different document must yield a nearly
identical description — this is what lets duplicates across documents merge.

RELATIONS — short verb-phrase predicates between two concepts, BOTH present in
`concepts` by their exact `name` (e.g. "is a kind of", "depends on", "is used
for"). Skip any relation whose endpoints aren't both in the concept list.
```

提示词在教模型四件事：
1. **什么算概念** —— 具体、可命名的想法（方法/机制/结构/原理/现象/框架/结果），能当百科词条。
2. **什么不算** —— 领域/伞形词、通用活动/属性、**人名/作者/组织**（★ 新增）、整句/疑问句。
3. **怎么命名** —— 用社区标准名当 `name`，变体/缩写丢 `aliases`；语言跟原文，不翻译。
4. **描述要自包含** —— 像词典词条，不提"本文/作者"。这条是关键：同一概念在不同文档要得到**几乎相同**的描述，才能在第 7 步被认出是同一个、合并掉。

### 代码兜底（不是 LLM）

LLM 偶尔漏网的，`_clean_name`（`extract.py` 内）再滤一道：去括号注释、丢斜杠后的举例、单字符、超 60 字的（基本是整句）、含句末标点的；并去重、单块封顶 40 个概念。注意：**人名靠 prompt 排，不靠代码**——中文 2 字名（"麦基"）和真概念没法用正则区分，硬滤必误伤。

---

## 三、抽完怎么去重/合并（第 7 步 dedup）

同一个概念会在多块、多文档里被重复抽出。把它们并成一个节点，靠 **embedding 召回 + LLM 判定**两段：

1. **exact 快路**：名字完全相同 → 直接当同一个。
2. **embedding 分块（block）**：拿新概念的向量，在已收录节点里找余弦最近的，只保留距离 ≤ `0.40`、最多 `5` 个作候选。没候选 → 直接当新概念。
3. **LLM 终判** `match_concept`（`ai/merge.py`，模型 `gpt-5.4-mini`）：把新概念 + 候选列表丢给模型，它选"哪个是同一个，或 -1 都不是"。提示词：

```
You canonicalize concepts in a knowledge base. Given one INCOMING concept and a
numbered list of EXISTING candidate concepts already in the base, pick the ONE
candidate that denotes the SAME concept, or -1 if none does.

Same concept (return its index): synonyms, acronym vs spelled-out form,
translations, or rewordings of one idea — a reader would keep a single entry.
Different (return -1): merely related or sibling concepts — a general technique vs
a specific variant, a method vs a component it uses, a problem vs its solution, and
especially OPPOSITES / contrasting pairs (e.g. top-down vs bottom-up, 自上而下 vs
自下而上). When unsure, return -1.

Judge by what the concepts DENOTE, not by how similar their wording is. Give one
short reason.
```

判为同一个 → 新名字进老节点的 `aliases`，mention +1，并用 `merge_descriptions` 把两段描述揉成一条规范描述（模型 `gpt-5.4-nano`）。判为 -1 → 新建节点。

> 本次：45 个不同名 → 18 个有 embedding 候选触发 LLM 判（`match_call=18`）→ 其中 4 个合并、14 个判为不同 → 最终 41 个。例：`五步分析法` 被并进 `场景分析五步法`（别名），`叙事节拍` 并进 `节拍`。

---

## 四、其它两个 prompt（顺带）

**合并描述** `merge_descriptions`（`ai/merge.py`，`gpt-5.4-nano`）—— 两条描述揉一条，不靠拼接、不超 4 句、同语言：

```
You maintain the canonical description of a concept in a knowledge base. You
receive the concept's name, its current canonical description, and a new
description of the same concept extracted from a different source.

Return the single best canonical description: 2-4 sentences, general and
self-contained, written like a glossary entry, with no reference to any specific
source or document.

Rules:
- Write in the SAME language as the input descriptions; never translate.
- If the new description adds material information (a mechanism, purpose,
  distinction, or precision the current one lacks), integrate it.
- If it adds nothing material, return the current description verbatim.
- Never grow the description by concatenation; rewrite so it stays tight.
```

**聚类标签** `label_cluster`（`ai/labels.py`，`gpt-5.4-mini`）—— 给一簇概念名起个 2-4 词主题标签：

```
Given concept names that form one topic cluster, return a short human-readable
label (2-4 words) that names the shared topic.

Write the label in the SAME language as the concept names; never translate.
Use Title Case only for Latin-script languages (e.g. English); for languages
without letter case (e.g. Chinese, Japanese), write the natural term as-is.
Name the shared topic — do not just concatenate two of the concept names.
No surrounding quotes and no trailing punctuation.
```

---

## 五、一句话总结

> **抽概念 = 切块 → 每块让 `gpt-5.4-mini` 按上面那段提示词吐出"概念名 + 词典式描述 + 关系" → 用 embedding 召回近似的、再让 LLM 判是不是同一个来去重合并 → 落库 → 分簇起标签。** 人名/作者的排除写在第 5 步的提示词里（★），不在代码。
