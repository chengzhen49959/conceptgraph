# Corpus pipeline test — corpus_pdf (24 docs)

- models: extract=`gpt-5.4-mini` judge=`gpt-5.4-mini` embed=`text-embedding-3-small`
- dedup: embeddings block top-5 within cosine dist 0.4, LLM match_concept decides

## Counts
- 24 docs -> 432 chunks -> 3861 raw concepts (2348 distinct names) -> **1611 final concepts**
- dedup: new=1611 · exact-name=0 · match calls=1716 (merged 737 / judged-distinct 979)
- relations: 2997 raw -> **2812 after remap+dedup** · **174 clusters**

## Quality
- forbidden person-names (should be 0): **0** (ok **PASS**)
- glossary-leak descriptions: **21** -> 语言模型, SQuAD v1.1, cache model, textual knowledge corpus, 大规模语料库, relevance score, inverse cloze task, inverted index, 抽取式模型, 少样本学习, language model meta-learning, CoQA, 示范, Query-side fine-tuning, 上下文不一致, graph index, prompt template, 实体, 文本图, 文本子图检索, 上下文过滤模型
- sentence-punctuation names: **0** (ok)

## Cross-document concepts (342) — merged across ≥2 papers

The dedup payoff: one node, many sources.

- **retrieval-augmented generation** — 11 docs, x62 · aliases: RAG, retrieval-augmented generative model, retrieval-augmented architecture, retrieval-augmented generator, retrieval-augmented generation system, retrieval-augmented answer generation, retrieval-generation integration  `2005.11401, 2007.00808, 2007.01282, 2208.03299, 2307.03172, 2311.05232, 2404.16130, 2405.16506, 2410.05779, 2410.12837, 2501.13958`
- **Transformer** — 11 docs, x35 · aliases: Transformer architecture, Transformers, Transformer model, Transformer架构, Transformer 架构, transformer networks, 变换器架构  `1706.03762, 1810.04805, 1907.11692, 1911.00172, 2001.08361, 2002.08909, 2106.09685, 2208.03299, 2303.18223, 2307.03172, 2410.12837`
- **fine-tuning** — 11 docs, x25 · aliases: supervised fine-tuning, language model fine-tuning, fine-tuning strategy, adaptation tuning  `1810.04805, 2002.08909, 2004.04906, 2005.14165, 2106.09685, 2203.02155, 2208.03299, 2303.18223, 2311.05232, 2405.16506, 2501.13958`
- **large-scale language model** — 9 docs, x30 · aliases: large language model, language model, 大型语言模型, Large language models, 大语言模型  `2007.01282, 2201.11903, 2208.03299, 2303.18223, 2311.05232, 2404.16130, 2410.05779, 2410.12837, 2501.13958`
- **self-attention** — 9 docs, x16 · aliases: self-attention mechanism, dense attention  `1706.03762, 1810.04805, 1911.00172, 2001.08361, 2005.14165, 2007.01282, 2106.09685, 2208.03299, 2410.12837`
- **Open-domain Question Answering** — 8 docs, x37 · aliases: Open-QA, retrieval-based Open-QA, 开放域问答, open-domain QA, open domain question answering  `2002.08909, 2004.04906, 2005.11401, 2007.00808, 2007.01282, 2208.03299, 2307.03172, 2410.12837`
- **BERT** — 8 docs, x30 · aliases: Bidirectional Encoder Representations from Transformers, deep bidirectional Transformer, BERT Transformer, BERT-style Transformer, BERT-style model  `1810.04805, 1907.11692, 2002.08909, 2004.04906, 2007.01282, 2208.03299, 2303.18223, 2410.12837`
- **TriviaQA** — 8 docs, x18 · aliases: Trivial QA  `1810.04805, 2004.04906, 2005.11401, 2005.14165, 2007.00808, 2007.01282, 2208.03299, 2410.12837`
- **预训练神经语言模型** — 8 docs, x16 · aliases: 神经语言模型, LM, pre-trained language model, pre-trained neural language models, pretrained language model, 预训练语言模型  `1911.00172, 2005.11401, 2005.14165, 2106.09685, 2203.02155, 2303.18223, 2405.16506, 2410.12837`
- **BM25** — 7 docs, x34 · aliases: BM25 retrieval  `2002.08909, 2004.04906, 2007.00808, 2007.01282, 2208.03299, 2405.16506, 2410.12837`
- **GPT-3** — 7 docs, x24 · aliases: Generative Pre-trained Transformer 3, GPT 3, GPT-3 175B, GPT-3-175B  `2005.14165, 2106.09685, 2109.07958, 2201.11903, 2203.02155, 2208.03299, 2303.18223`
- **NaturalQuestions dataset** — 7 docs, x21 · aliases: Natural Questions, NaturalQuestions, 自然问题集  `2002.08909, 2004.04906, 2005.11401, 2007.00808, 2007.01282, 2208.03299, 2410.12837`
- **language model meta-learning** — 7 docs, x17 · aliases: in-context learning, 上下文学习, language models are unsupervised multitask learners  `2005.14165, 2007.01282, 2208.03299, 2303.18223, 2311.05232, 2404.16130, 2501.13958`
- **Adam optimizer** — 7 docs, x12 · aliases: Adam, Adam优化器  `1706.03762, 1907.11692, 2001.08361, 2004.04906, 2005.11401, 2007.01282, 2106.09685`
- **Dense Passage Retriever** — 6 docs, x32 · aliases: DPR, Dense Passage Retrieval, DPR retrieval  `2004.04906, 2005.11401, 2007.00808, 2007.01282, 2208.03299, 2410.12837`
- **Retrieval-Augmented Language Model Pre-Training** — 6 docs, x23 · aliases: REALM, Retrieval-Augmented Language Model, REALM 预训练  `2002.08909, 2005.11401, 2007.00808, 2007.01282, 2208.03299, 2410.12837`
- **retriever** — 6 docs, x23 · aliases: knowledge retriever, neural retriever, Representation model, dense retrieval model, retrieval model, Retrieval Component, data retriever  `2002.08909, 2005.11401, 2007.00808, 2208.03299, 2410.05779, 2410.12837`
- **hallucination** — 6 docs, x21 · aliases: Hallucination in large language models, LLM hallucination, 幻觉, 幻觉问题  `2005.11401, 2109.07958, 2208.03299, 2311.05232, 2410.12837, 2501.13958`
- **TF-IDF** — 6 docs, x11 · aliases: term frequency–inverse document frequency, TF, 词项频率-逆文档频率, 词频-逆文档频率  `2002.08909, 2004.04906, 2007.01282, 2208.03299, 2410.12837, 2501.13958`
- **dense representation** — 6 docs, x11 · aliases: dense representations, latent semantic encoding, low-dimensional continuous space, continuous dense embeddings, vector representation, Dense vector representation, dense embedding  `2004.04906, 2007.01282, 2208.03299, 2410.05779, 2410.12837, 2501.13958`
- **negative log-likelihood** — 6 docs, x8 · aliases: NLL, language modeling loss, log loss, Negative log likelihood  `1911.00172, 2001.08361, 2004.04906, 2005.14165, 2007.00808, 2303.18223`
- **Transformer language model** — 6 docs, x8 · aliases: Transformer LM, Transformer-based language model architecture  `1911.00172, 2005.14165, 2106.09685, 2303.18223, 2307.03172, 2311.05232`
- **masked language model** — 5 docs, x21 · aliases: MLM, masked language modeling, masked language model training objective, masked language modeling objective, 掩码语言模型目标, 掩码语言建模, 掩码语言建模损失  `1810.04805, 1907.11692, 2002.08909, 2005.11401, 2208.03299`
- **Dense retrieval** — 5 docs, x13 · aliases: dense retriever  `2002.08909, 2004.04906, 2007.00808, 2208.03299, 2410.12837`
- **问答** — 5 docs, x12 · aliases: 问题回答, question answering, 问答任务  `1810.04805, 2005.14165, 2203.02155, 2208.03299, 2410.12837`
- **Stanford Question Answering Dataset** — 5 docs, x12 · aliases: SQuAD v1.1, SQuAD  `1810.04805, 1907.11692, 2004.04906, 2007.01282, 2203.02155`
- **passage retrieval** — 5 docs, x12 · aliases: retrieval, context retrieval, first-stage retrieval  `2004.04906, 2007.00808, 2007.01282, 2208.03299, 2501.13958`
- **implicit memorization** — 5 docs, x11 · aliases: memorization, parametric memory, in-parameter memorisation, Parametric factual knowledge  `1911.00172, 2005.11401, 2208.03299, 2307.03172, 2311.05232`
- **language models** — 5 docs, x11 · aliases: language model, 生成式语言模型  `2201.11903, 2203.02155, 2208.03299, 2303.18223, 2410.12837`
- **perplexity** — 5 docs, x10 · aliases: PPL  `1706.03762, 1907.11692, 1911.00172, 2109.07958, 2208.03299`
- **re-ranking** — 5 docs, x10 · aliases: reranking, BERT rerank, re-ranking system, two-stage retrieval, 重排序  `2002.08909, 2007.00808, 2208.03299, 2410.12837, 2501.13958`
- **sequence-to-sequence model** — 5 docs, x10 · aliases: seq2seq model, sequence-to-sequence generator, sequence-to-sequence network, encoder-decoder model, Sequence-to-sequence architecture  `2005.11401, 2007.01282, 2208.03299, 2307.03172, 2410.12837`
- **BERTBASE** — 5 docs, x9 · aliases: BERT Base, BERT-base  `1810.04805, 1907.11692, 2002.08909, 2005.11401, 2208.03299`
- **T5** — 5 docs, x9 · aliases: Text-to-Text Transfer Transformer  `2002.08909, 2007.01282, 2109.07958, 2303.18223, 2410.12837`
- **GPT-2** — 5 docs, x9  `2002.08909, 2005.14165, 2106.09685, 2109.07958, 2303.18223`
- **dual-encoder framework** — 5 docs, x9 · aliases: dual encoder, bi-encoder, 双编码器架构, dual-encoder model, bi-encoder architecture, 双塔模型, dual-encoder architecture  `2004.04906, 2005.11401, 2007.00808, 2208.03299, 2410.12837`
- **dot product** — 5 docs, x8 · aliases: inner product distance, inner product  `1706.03762, 1911.00172, 2004.04906, 2007.01282, 2208.03299`
- **Dropout** — 5 docs, x7  `1706.03762, 1907.11692, 1911.00172, 2004.04906, 2007.01282`
- **cross entropy loss** — 5 docs, x7 · aliases: cross-entropy loss, 负对数似然, 负对数似然损失  `1810.04805, 2001.08361, 2004.04906, 2007.00808, 2303.18223`
- **language modeling** — 5 docs, x7 · aliases: language modeling objective  `1810.04805, 2001.08361, 2002.08909, 2203.02155, 2303.18223`

## Clusters (174) — vs the A–E reading-list themes

### Graph RAG  (177)
命名实体识别, GraphRetriever, 密集检索, 稠密嵌入, Prompt optimization, soft prompt, 多层感知机, GraphRAG, graph index, entity knowledge graph, community summary, partial response, knowledge graph, hierarchical community, map-reduce processing, global sensemaking, LLM-as-a-judge technique, global sensemaking questions … (+159)

### Open-Domain QA  (157)
TriviaQA, Open-domain Question Answering, 最大内积搜索, WEBQUESTIONS, CURATEDTREC, reading comprehension, retriever, 开放域问答微调, 答案片段, 跨度集合, relevance score, search index, document embedding, parameter staleness, cold-start problem, inverse cloze task, NaturalQuestions dataset, Google Suggest API … (+139)

### Retrieval-Augmented Generation  (151)
long-range dependencies, path length, beam search, denoising autoencoder, explicit memory, implicit memorization, marginal probability, top k documents, posterior distribution p, 余弦相似度, 度量学习, 向量空间, retrieval-augmented generation, pre-trained seq2seq model, knowledge-intensive NLP task, differentiable access mechanism, hybrid model, differentiable retriever … (+133)

### BERT 模型  (135)
word-piece, WMT 2014 English-French dataset, BERT, 预训练, 双向表示, 语言表示模型, 语言推断, 问答, GLUE, SQuAD v1.1, SQuAD v2.0, 文本微调, masked language model, Cloze task, next sentence prediction, text generation model, [CLS] token, [SEP] token … (+117)

### Transformer  (106)
Transformer, 注意力机制, 编码器-解码器结构, 循环神经网络, 卷积神经网络, 自注意力, 缩放点积注意力, 多头注意力, 位置表示, 英德机器翻译任务, 英法机器翻译任务, 英语成分句法分析, BLEU, scaled dot-product attention, parameter-free position representation, Tensor2Tensor, 长短期记忆网络, 门控循环神经网络 … (+88)

### 预训练与微调  (104)
feature-based approach, ELMo, right-to-left language model, contextual word embeddings, sentence encoder, document encoder, supervised downstream task, fine-tuning, data augmentation, 预训练神经语言模型, Transformer language model, layer normalization, n-gram language model, Embedinput, cross-dataset generalization, non-iid setting, 监督训练数据集, 虚假相关性 … (+86)

### Prompting 与 少样本学习  (102)
自然语言处理任务, fine-tuning based representation model, cross attention, SST-2, ablation study, state-of-the-art performance, few-shot learning, language model meta-learning, meta-learning, natural language instruction, zero-shot transfer, one-shot learning, demonstration, 零样本学习, 条件化, one-shot evaluation, large-scale language model, greedy decoding … (+84)

### 大语言模型  (79)
restricted self-attention, byte-pair encoding, WMT 2014 English-German dataset, OpenWebText, WebText corpus, 自回归语言模型, BERT subword vocabulary, Webtext2 training set, Reddit outbound links, Reddit karma, Newspaper3k, reversible tokenizer, Common Crawl, in-distribution validation loss, Generation-based Open-QA, sequence prediction task, GPT-2, 少样本学习 … (+61)

### LLM 幻觉  (57)
hallucination, natural language generation, benchmark, language model truthfulness, false statement, deceptive model, stereotype, social bias, 检索增强语言模型, training set filtering, natural language processing, Taxonomy of hallucination, Hallucination detection, Hallucination benchmarks, Hallucination mitigation, Large vision-language models, Knowledge boundaries, Factuality … (+39)

### Nearest Neighbor Language Models  (56)
序列建模, 语言模型, dot product, variance, perplexity, compatibility function, Transformer decoder, kNN-LM, k近邻模型, 线性插值, 预训练LM嵌入空间, 近邻数据存储, 域自适应, 长尾分布, 事实知识, prefix embedding, pre-trained embedding space, nearest neighbor datastore … (+38)

### Scaling Laws  (55)
Model Dimension, Inner-Layer Dimension, base model, big model, training step, 层数, 注意力头数, 分布式数据并行训练, overfitting, scaling laws for neural language models, power law, model size, dataset size, training compute, training speed, compute budget, sample efficiency, compute-efficient training … (+37)

### 语言模型对齐  (48)
转导问题, 机器翻译, fine-tuning with human feedback, InstructGPT, 语言模型对齐, 有帮助、诚实且无害, reward model, Proximal Policy Optimization, supervised learning baseline, human-written demonstrations, human-labeled comparisons, personally identifiable information, GPT-3 architecture, few-shot prompt, hallucination rate, closed-domain question answering, toxicity, labelers … (+30)

### Long-Context Retrieval  (45)
vanilla LM, context length, NATURALQUESTIONS-OPEN, short answer type, closed-book setting, search ranking, term-level interactions, search relevance, instruction tuning, long-context language model, multi-document question answering, key-value retrieval, lost in the middle effect, primacy bias, recency bias, U-shaped performance curve, controlled experiment, JSON-formatted key-value pair … (+27)

### Language Model Training  (40)
Softmax Function, Weight Sharing, Pre-Softmax Linear Transformation, language modeling, final hidden state, classification layer, classification loss, negative log-likelihood, unsupervised learning, generative modeling, neural models, world knowledge, syntactic information, document posterior, temperature, reasoning ability, unintended behaviors, biased text … (+22)

### 文本嵌入与对比学习  (39)
training batch, source token, target token, left-to-right language modeling objective, word embeddings, discriminative context objective, sentence embeddings, paragraph embeddings, candidate next sentence ranking, next-sentence word generation, Transformer 块, cross entropy loss, XLNet, pretraining data, refresh, re-embedding, primary trainer job, secondary index builder job … (+21)

### 检索增强生成  (23)
closed book T5, text-based explicit memories, knowledge retrieval task, flat data representation, contextual awareness, Self-RAG, Reflection Token, indexing optimization, metadata-addition techniques, post-retrieval process, 句子变换器, 近似邻居, 混合检索方法, Retrieval Technique, Similarity-based Retriever, Logical-based Retriever, GNN-based Retriever, LLM-based Retriever … (+5)

### 词向量表示学习  (7)
预训练语言表示, 词向量, 任务特定架构, 神经语言模型, Word2vec, static word representations, 表示学习

### 事实验证  (7)
事实验证, natural language claim, Wikipedia evidence retrieval, entailment reasoning, claim-class pair, label accuracy, supports

### Task-Adaptive Summarization  (5)
METRAG, LLM supervision, utility-oriented thought, task-adaptive summarizer, knowledge-augmented content

### Natural Language SQL  (5)
Natural language to SQL, context-target pair, natural language query, SQL command, article summary

### Benchmark Datasets  (5)
UltraDomain benchmark, Agriculture dataset, CS dataset, Legal dataset, Mix dataset

### Multi-Agent RAG  (5)
agentic Retrieval-Augmented Generation, hierarchical multi-agent architecture, sub-agent, smaller pre-trained language model, shared knowledge repository

### 子词分词  (4)
字节对编码, 子词单元, 字节级字节对编码, 未知词元

### Model Steering Techniques  (4)
safety-specific control token, null space projection, causal mediation analysis, language model steering

### Transformer Architecture  (4)
Transformer shape, feed-forward ratio, aspect ratio, attention head dimension

### Entity Matching  (4)
exact string matching, entity matching, duplicate entities, edge weight

### Retrieval Workflow  (3)
data-centric retrieval-augmented generation workflow, prepare-then-rewrite-then-retrieve-then-read framework, Meta Knowledge Summary

### Response Alignment  (3)
alignment criteria, potentially harmful response, helpfulness

### Health Education  (3)
preventive medicine, wellness, health education curriculum

### Triplet Loss  (3)
triplet loss, positive passage, negative passage

### Multimodal AI  (3)
computer vision, vision-language model, multimodal dialogue

### Lost Generation  (3)
The Sun Also Rises, A Farewell to Arms, Lost Generation

### 偏好优化训练  (3)
PPO-ptx, 预训练分布, 标签器偏好分数

### Memory Selection  (3)
Selfmem, 记忆池, 迭代选择框架

### Mixed Precision  (2)
mixed precision floating point arithmetic, full-length sequences

### Paragraph Structure  (2)
fixed-length passages, natural paragraphs

### Okapi R3  (2)
Okapi, R3

### Sequence Length Batching  (2)
sentence-pair batching, approximate sequence length

### 大模型缩放规律  (2)
标度律, Chinchilla

### Health Education  (2)
public health priorities, health literacy

### 束搜索  (2)
束搜索, 长度惩罚

### API Prompting  (2)
QA prompt, OpenAI API

### Neuro-Symbolic Methods  (2)
neuro-symbolic methods, formal language

### NFL Playoffs  (2)
screen pass, NFC Championship Game

### IPO Debut  (2)
public debut, technology IPOs

### Neural Network Optimization  (2)
adaptive softmax, tied weights

### 小批量样本  (2)
金标准样本, 小批量

### Model Validation  (2)
fuzzy deduplication, held-out validation set

### Weakly Supervised Learning  (2)
hard expectation-maximization, weakly supervised question answering

### Question Answering  (2)
weak supervision, question-answer pair

### Navigation Simulation  (2)
instruction following for navigation, simulated environment

### Regulatory Policy  (2)
tech policy, government regulation

### Technology Regulation  (2)
privacy laws, technology development

### Ethical Innovation  (2)
innovation, ethical considerations

### Public Sector Technology  (2)
tech companies, government

### Traversal Algorithms  (2)
graph traversal, tree traversal

### Instruction Tuning Data  (2)
SAIL, 指令微调数据集

### 模型集成  (1)
模型集成

### Attention Mechanisms  (1)
Additive Attention

### Probability Theory  (1)
independent random variable

### Layer Complexity  (1)
computational complexity per layer

### Longest Path  (1)
maximum path length

### Parallelization  (1)
parallelization

### GPU  (1)
NVIDIA P100 GPU

### Regularization  (1)
regularization

### newstest2014  (1)
newstest2014

### K80  (1)
K80

### K40  (1)
K40

### M40  (1)
M40

### Floating Point Performance  (1)
TFLOPS

### Natural Language Inference  (1)
MultiNLI

### Bidirectional Pre-Training  (1)
bidirectional pre-training

### String Operations  (1)
shallow concatenation

### Word Embeddings  (1)
pre-trained word embeddings

### Sequence Tagging  (1)
sequence tagging

### Sequence Modeling  (1)
BiLSTM+ELMo+Attn

### 随机重启  (1)
random restart

### Activation Function  (1)
Gaussian error linear unit

### Stories Dataset  (1)
Stories dataset

### Adaptive Input  (1)
adaptive inputs

### 键值  (1)
键和值

### Power Law  (1)
power-law exponent

### Matrix Multiplication  (1)
matrix multiplication

### Optimizer  (1)
Adafactor

### ResNet  (1)
ResNet

### Multi-Dataset Encoding  (1)
multi-dataset encoder

### Text REtrieval Conference  (1)
TREC

### 单词重排  (1)
单词重排

### 阅读理解  (1)
阅读理解

### Rapid Adaptation  (1)
rapid adaption

### Arithmetic  (1)
arithmetic

### Word Novel  (1)
novel word

### Crowdsourcing  (1)
Mechanical Turk

### Few-Shot Evaluation  (1)
few-shot evaluation

### Learning Bottleneck  (1)
learning bottleneck

### Representation Learning  (1)
representation learning

### Oracle Distribution  (1)
oracle distribution

### Diminishing Gradients  (1)
diminishing gradients

### Noise Contrastive Estimation  (1)
noise-contrastive estimation negatives

### Normalization  (1)
global normalization

### Sequence Generation  (1)
SpanSeqGen

### Generative Pretrained Transformers  (1)
Generative Pretrained Transformer 3

### Olympics  (1)
oLMpics

### BERTserini  (1)
BERTserini

### 低内在维度  (1)
低内在维度

### 自注意力  (1)
自注意力模块

### 投影矩阵  (1)
查询投影矩阵

### 键投影矩阵  (1)
键投影矩阵

### 值投影矩阵  (1)
值投影矩阵

### 投影矩阵  (1)
输出投影矩阵

### 自回归语言模型  (1)
预训练自回归语言模型

### 条件文本生成  (1)
条件文本生成

### GPU  (1)
NVIDIA Tesla V100

### 冻结层  (1)
冻结层

### Weight Sharding  (1)
weight sharding

### 标量真实性分数  (1)
标量真实性分数

### Combined Results  (1)
combined results

### Informative Content  (1)
informativeness

### Generation Task  (1)
generation task

### Rationale-Augmented Training  (1)
rationale-augmented training

### Math Word Problems  (1)
ASDiv dataset

### Density  (1)
density

### Randomly Shuffled Order  (1)
randomly shuffled order of exemplars

### Single-Operator  (1)
SingleOp

### Gender Bias  (1)
Winogender

### Bias Benchmark  (1)
CrowS-Pairs

### Deletion  (1)
DROP

### Commonsense Reasoning  (1)
HellaSwag

### Machine Translation  (1)
WMT 2015 French to English translation

### Human Feedback  (1)
human feedback

### Human-in-the-Loop Data Collection  (1)
human-in-the-loop data collection

### Word Embedding Regularization  (1)
word embedding regularization

### AI Development  (1)
OpenAI Playground

### Gradient Descent  (1)
gradient descent

### Document-Conditioned Language Model  (1)
document-conditioned language model

### Title-to-Section Generation  (1)
title-to-section generation

### Activation Checkpointing  (1)
activation checkpointing

### Distance Metrics  (1)
Euclidean distance

### Phrase-Based Retrieval  (1)
phrase-based retrieval

### Artificial Intelligence  (1)
Turing Test

### Probability Estimation  (1)
probability estimation

### 自然语言处理  (1)
自然语言处理从零开始

### Feature Engineering  (1)
human feature engineering

### GPT-4 API  (1)
GPT-4 API

### X-Ray Discovery  (1)
Wilhelm Conrad Röntgen

### 自监督学习  (1)
自监督训练

### 定制摘要  (1)
领域定制摘要

### NeoChip  (1)
NeoChip

### Quantum Systems  (1)
Quantum Systems

### Tech Exchange  (1)
NewTech Exchange

### Low-Power Processors  (1)
low-power processors

### Wearable Technology  (1)
wearables

### IoT Devices  (1)
IoT devices

### Map-Reduce  (1)
map-reduce summarization

### Triple  (1)
Triple

### 模型压缩  (1)
软剪枝

### Graph Theory  (1)
large graphs

### E5 Base  (1)
E5-Base

### LLM Profiling  (1)
LLM Profiling for Key-Value Pair Generation

### Retrieval-Augmented Generation  (1)
REPLUG

### Time Series Analysis  (1)
time series analysis

### RAG  (1)
SFR-RAG

### Specialized Domains  (1)
specialized domains

### 最佳匹配  (1)
最佳匹配25

### Prompt Engineering  (1)
RETROprompt

### 少样本知识存储  (1)
少样本知识存储

### 多样上下文生成  (1)
多样上下文生成

### 句子选择  (1)
句子选择

### SKR  (1)
SKR

### 检索评估方法  (1)
检索内容重要性评估方法

### 剪枝  (1)
剪枝

### 重加权  (1)
重加权

### 领域知识  (1)
领域知识

### Multi-Hop Information  (1)
multi-hop information

## Documents (24)

- `1706.03762` — 1706.03762  (18 chunks)
- `1810.04805` — 1810.04805  (18 chunks)
- `1907.11692` — 1907.11692  (18 chunks)
- `1911.00172` — 1911.00172  (18 chunks)
- `2001.08361` — 2001.08361  (18 chunks)
- `2002.08909` — 2002.08909  (18 chunks)
- `2004.04906` — 2004.04906  (18 chunks)
- `2005.11401` — 2005.11401  (18 chunks)
- `2005.14165` — 2005.14165  (18 chunks)
- `2007.00808` — 2007.00808  (18 chunks)
- `2007.01282` — 2007.01282  (18 chunks)
- `2106.09685` — 2106.09685  (18 chunks)
- `2109.07958` — 2109.07958  (18 chunks)
- `2201.11903` — 2201.11903  (18 chunks)
- `2203.02155` — 2203.02155  (18 chunks)
- `2208.03299` — 2208.03299  (18 chunks)
- `2303.18223` — 2303.18223  (18 chunks)
- `2307.03172` — 2307.03172  (18 chunks)
- `2311.05232` — 2311.05232  (18 chunks)
- `2404.16130` — 2404.16130  (18 chunks)
- `2405.16506` — 2405.16506  (18 chunks)
- `2410.05779` — 2410.05779  (18 chunks)
- `2410.12837` — 2410.12837  (18 chunks)
- `2501.13958` — 2501.13958  (18 chunks)

## All final concepts (1611) — by #docs then mentions

### retrieval-augmented generation  [11 docs, x62] [judged-distinct]  · aliases: RAG, retrieval-augmented generative model, retrieval-augmented architecture, retrieval-augmented generator, retrieval-augmented generation system, retrieval-augmented answer generation, retrieval-generation integration
检索增强生成（Retrieval-augmented generation）是一种将参数化语言模型与外部检索组件结合的生成架构：生成时先基于当前查询从外部语料库检索相关证据/上下文，并将其与查询一起作为条件输入模型以生成回答。通过引入检索到的外部信息，输出通常在保持流畅性的同时更“扎根于证据”，从而提升相关性与可依据信息的程度，并补足模型参数记忆中可能缺失或过时的内容。  · merged: RAG, retrieval-augmented generative model, retrieval-augmented architecture, retrieval-augmented generator, retrieval-augmented generation system, retrieval-augmented answer generation, retrieval-generation integration

### Transformer  [11 docs, x35] [new]  · aliases: Transformer architecture, Transformers, Transformer model, Transformer架构, Transformer 架构, transformer networks, 变换器架构
Transformer 是一种基于自注意力机制的序列建模神经网络架构，由堆叠的自注意力子模块与前馈层构成，可按需组织为编码器-解码器等结构以处理不同输入输出序列。它用注意力机制建模序列各位置之间的依赖，能够更有效捕获长距离依赖，并具备较好的并行计算能力。Transformer 常用于自然语言处理中的语言建模、机器翻译与文本生成等任务，也可用于条件生成等场景。  · merged: Transformer architecture, Transformers, Transformer model, Transformer架构, Transformer 架构, transformer networks, 变换器架构

### fine-tuning  [11 docs, x25] [judged-distinct]  · aliases: supervised fine-tuning, language model fine-tuning, fine-tuning strategy, adaptation tuning
Fine-tuning is the process of adapting a pretrained model to better fit a specific task, domain, or usage setting by further training on task-relevant data. It updates some or all model parameters (and, in some approaches, prompt- or input-related components) to improve real-world performance while typically retaining much of the model’s previously learned representations. Different fine-tuning strategies vary in what is updated and how the adaptation is implemented.  · merged: supervised fine-tuning, language model fine-tuning, fine-tuning strategy, adaptation tuning

### large-scale language model  [9 docs, x30] [judged-distinct]  · aliases: large language model, language model, 大型语言模型, Large language models, 大语言模型
大规模语言模型是一类参数规模很大的神经语言模型，通常在海量文本语料上通过预测与生成进行预训练，从而学习通用的语言表示与文本生成能力。由于覆盖了广泛的语言与上下文模式，它能够在给定提示或少量示例的情况下完成多种自然语言理解与生成任务，并生成较为连贯且与语境相匹配的文本。其能力主要以参数中隐式编码的形式体现，但在事实准确性与最新知识方面可能受到限制。  · merged: large language model, 大型语言模型, Large language models, 大语言模型

### self-attention  [9 docs, x16] [judged-distinct]  · aliases: self-attention mechanism, dense attention
Self-attention is an attention mechanism in which, for a given input sequence, the queries, keys, and values are all computed from the same sequence. Each token can attend to all (or a large subset of) other tokens in the layer to produce context-dependent representations that capture relationships and long-range dependencies. This provides full connectivity but typically increases computational and memory cost compared with more local alternatives.  · merged: self-attention mechanism, dense attention

### Open-domain Question Answering  [8 docs, x37] [judged-distinct]  · aliases: Open-QA, retrieval-based Open-QA, 开放域问答, open-domain QA, open domain question answering
开放域问答是一类问答任务，答案不局限于预先定义的封闭文档或候选集合，而需从覆盖多主题的大规模语料库或外部知识源中检索相关证据。通常先在开放文档空间进行检索，再结合下游阅读理解或推理模型对检索到的文本进行答案抽取或生成。  · merged: Open-QA, retrieval-based Open-QA, 开放域问答, open-domain QA, open domain question answering

### BERT  [8 docs, x30] [judged-distinct]  · aliases: Bidirectional Encoder Representations from Transformers, deep bidirectional Transformer, BERT Transformer, BERT-style Transformer, BERT-style model
BERT（Bidirectional Encoder Representations from Transformers）是基于 Transformer 编码器的双向语言模型，利用掩码语言模型等预训练目标在大规模无标注语料上学习通用语言知识。它将分词后的文本编码为上下文相关的 token 表示，并通常可配合特殊边界/分隔标记处理不同输入形式，同时也能获得用于任务的汇总表示。BERT 的表示对检索以及多种下游语言理解任务（如分类、问答等）具有直接或经微调后的迁移价值。  · merged: Bidirectional Encoder Representations from Transformers, deep bidirectional Transformer, BERT Transformer, BERT-style Transformer, BERT-style model

### TriviaQA  [8 docs, x18] [new]  · aliases: Trivial QA
TriviaQA 是一个面向问答检索的问答数据集，将琐碎问题与包含答案证据的文档配对。它常用于评估系统在大规模语料中定位证据并返回答案的能力，并且常与开放域问答与答案召回/检索任务一起使用。  · merged: Trivial QA

### 预训练神经语言模型  [8 docs, x16] [judged-distinct]  · aliases: 神经语言模型, LM, pre-trained language model, pre-trained neural language models, pretrained language model, 预训练语言模型
预训练神经语言模型是在大规模文本语料（通常为无标注语料）上先行训练的语言模型，学习语言中的统计规律并获得上下文相关的语义表示。预训练后，其参数与表示可复用，常通过在具体任务上进行微调来显著提升多种自然语言处理任务的性能。  · merged: pre-trained language model, pre-trained neural language models, pretrained language model, 预训练语言模型

### BM25  [7 docs, x34] [new]  · aliases: BM25 retrieval
BM25 is a probabilistic information retrieval scoring function that ranks documents or passages by how well their terms match a query. It uses term frequency and inverse document frequency with saturation and document-length normalization to balance term relevance against verbosity. It is widely used as a lexical baseline in sparse retrieval.  · merged: BM25 retrieval

### GPT-3  [7 docs, x24] [judged-distinct]  · aliases: Generative Pre-trained Transformer 3, GPT 3, GPT-3 175B, GPT-3-175B
GPT-3是一种自回归生成式语言模型，拥有约1750亿（175B）参数。它通过文本交互在少样本条件下完成多种语言任务，常被用作大型基座模型或目标模型，在基准评测中用来揭示模型在特定任务构造与评估流程中的薄弱环节。  · merged: GPT-3 175B, GPT-3-175B

### NaturalQuestions dataset  [7 docs, x21] [judged-distinct]  · aliases: Natural Questions, NaturalQuestions, 自然问题集
自然问题集（Natural Questions）是一个开放域问答基准，由真实用户提出的自然语言问题构成，并以维基百科作为主要证据来源进行标注。数据集中包含答案类型等注释，并对部分问题提供用于检索的相关维基百科文档线索。该基准用于评估系统在知识检索与问答生成方面的能力，衡量其在大规模场景下的答案正确性与相关性。  · merged: Natural Questions, NaturalQuestions, 自然问题集

### language model meta-learning  [7 docs, x17] [judged-distinct]  · aliases: in-context learning, 上下文学习, language models are unsupervised multitask learners
一种将语言模型视为能够在上下文中“快速学会”新任务的元学习方法。其核心是在不依赖任务专用监督或参数微调的情况下，通过在推理时对提示与上下文示例/说明进行条件化，实现对多种下游任务的临时适配与输出生成。  · merged: in-context learning, 上下文学习, language models are unsupervised multitask learners

### Adam optimizer  [7 docs, x12] [new]  · aliases: Adam, Adam优化器
Adam（Adaptive Moment Estimation，自适应矩估计）是一种自适应梯度优化算法，通过对梯度的一阶矩（均值）和二阶矩（未校正方差）的指数滑动平均来调整参数更新步长。它常用于训练神经网络，能够根据近期梯度统计自适应地缩放更新，因此在实际中对学习率设置与参数初始化较为敏感。Adam也可结合学习率调度和权重衰减等策略提升训练表现。  · merged: Adam, Adam优化器

### Dense Passage Retriever  [6 docs, x32] [judged-distinct]  · aliases: DPR, Dense Passage Retrieval, DPR retrieval
Dense Passage Retriever（DPR）是一种稠密段落检索方法，采用双编码器分别为问题（查询）与段落学习向量表示，并利用向量相似度（如内积）在向量空间中进行检索与排序。它常用于开放域问答等场景中的第一阶段召回，从大规模语料库高效找出与查询最相关的段落。  · merged: Dense Passage Retrieval, DPR, DPR retrieval

### Retrieval-Augmented Language Model Pre-Training  [6 docs, x23] [judged-distinct]  · aliases: REALM, Retrieval-Augmented Language Model, REALM 预训练
一种将检索机制并入语言模型预训练的框架：在预训练阶段同时学习编码器与可学习检索器，使模型在生成或预测缺失内容时显式从外部文本中检索并利用相关证据。通常将被掩蔽语言建模与文档检索结合训练，在适配任务时也可进行显式检索调用。该检索器的模块化设计有助于迁移到下游任务，从而降低对仅依赖参数隐式记忆的需求并提升外部知识使用的可控性。  · merged: Retrieval-Augmented Language Model, REALM, REALM 预训练

### retriever  [6 docs, x23] [new]  · aliases: knowledge retriever, neural retriever, Representation model, dense retrieval model, retrieval model, Retrieval Component, data retriever
A retriever is a learned component that selects and ranks relevant documents or text passages in response to a query. It typically encodes queries and candidates into dense vector representations and retrieves the closest matches from an index using vector similarity, trained with supervision such as negative examples to distinguish relevant from irrelevant items. In retrieval-augmented generation, the retrieved content is used to support the final response or downstream extraction.  · merged: knowledge retriever, neural retriever, Representation model, dense retrieval model, retrieval model, Retrieval Component, data retriever

### hallucination  [6 docs, x21] [new]  · aliases: Hallucination in large language models, LLM hallucination, 幻觉, 幻觉问题
幻觉指语言模型生成了看似合理但不真实或缺乏依据的内容。它会降低输出的可靠性与可用性，尤其是在缺少证据或与既定事实、上下文不一致时表现得更明显。由于文本本身可能流畅且具有迷惑性，幻觉是重要的可靠性风险，通常需要借助外部证据或核验机制来缓解。  · merged: Hallucination in large language models, LLM hallucination, 幻觉, 幻觉问题

### TF-IDF  [6 docs, x11] [new]  · aliases: term frequency–inverse document frequency, TF, 词项频率-逆文档频率, 词频-逆文档频率
TF-IDF 是一种经典的词项加权方法，用于衡量词语在单篇文档中的重要性：将词项在该文档中的出现频率（TF）与其在整个语料库中的稀缺程度（IDF）结合，抑制常见词的影响并突出区分性更强的词项。通常情况下，某词在单篇文档中出现得越多、但在多数文档中越少出现，其权重越高。它常用于信息检索中的文档/特征表示与检索排序等文本匹配任务。  · merged: TF, 词项频率-逆文档频率, 词频-逆文档频率

### dense representation  [6 docs, x11] [judged-distinct]  · aliases: dense representations, latent semantic encoding, low-dimensional continuous space, continuous dense embeddings, vector representation, Dense vector representation, dense embedding
A dense representation is a learned continuous vector embedding that maps text (and sometimes other items such as entities) into a low- to moderate-dimensional real-valued space. It encodes semantic information so that similar items are close under similarity measures such as distance or dot product, enabling efficient retrieval via nearest-neighbor search and use in tasks like retrieval or classification.  · merged: latent semantic encoding, low-dimensional continuous space, continuous dense embeddings, vector representation, Dense vector representation, dense embedding

### negative log-likelihood  [6 docs, x8] [new]  · aliases: NLL, language modeling loss, log loss, Negative log likelihood
Negative log-likelihood (NLL) is a loss function defined as the negative logarithm of the probability a model assigns to the correct outcome. It penalizes predictions that give low probability to the target, so lower NLL corresponds to better fit. In language modeling it is commonly computed from the negative log probability of the next token (or target sequence), and in retrieval/ranking it can be used to encourage higher probability for relevant items compared with non-relevant ones.  · merged: language modeling loss, log loss, Negative log likelihood

### Transformer language model  [6 docs, x8] [judged-distinct]  · aliases: Transformer LM, Transformer-based language model architecture
A Transformer-based language model that uses Transformer layers with self-attention and feed-forward components to process input tokens and form contextual representations. It learns to estimate the probability of the next token, enabling it to generate text autoregressively. Transformer language models are a common foundation for modern large language models due to their ability to scale with data and compute.  · merged: Transformer-based language model architecture

### masked language model  [5 docs, x21] [judged-distinct]  · aliases: MLM, masked language modeling, masked language model training objective, masked language modeling objective, 掩码语言模型目标, 掩码语言建模, 掩码语言建模损失
掩码语言建模（Masked Language Modeling）是一种自监督预训练目标：在输入序列中随机遮蔽部分词元，并让模型根据未遮蔽的上下文（通常同时利用左右信息）预测这些被遮蔽的词元。训练时仅在掩码位置计算预测损失（如交叉熵），以学习更通用、更强的双向语言表示，从而提升并支持下游语言理解任务。  · merged: masked language modeling, masked language model training objective, masked language modeling objective, 掩码语言模型目标, 掩码语言建模, 掩码语言建模损失

### Dense retrieval  [5 docs, x13] [judged-distinct]  · aliases: dense retriever
Dense retrieval is an information retrieval approach that represents queries and documents (or passages) as learned continuous vector embeddings and ranks candidates by similarity in embedding space. By using semantic representations, it aims to find relevant content without relying solely on sparse lexical word overlap.  · merged: dense retriever

### 问答  [5 docs, x12] [judged-distinct]  · aliases: 问题回答, question answering, 问答任务
一种自然语言处理任务，要求系统根据给定的问题及其上下文（或知识来源）生成答案或选择正确答案。该任务可用于评估模型的理解、检索与推理能力，回答既可以是生成式整句，也可以是在文本中定位并抽取答案片段。  · merged: question answering, 问答任务

### Stanford Question Answering Dataset  [5 docs, x12] [new]  · aliases: SQuAD v1.1, SQuAD
The Stanford Question Answering Dataset (SQuAD) is a question answering benchmark made from crowd-sourced question–answer pairs grounded in Wikipedia passages. For each question, the answer is represented as a text span within the given passage, and systems are evaluated on how accurately they predict these spans.  · merged: SQuAD

### passage retrieval  [5 docs, x12] [new]  · aliases: retrieval, context retrieval, first-stage retrieval
Passage retrieval is the process of selecting text passages or documents from a large corpus that are likely to be relevant to a query. In question answering, it serves as an initial, first-stage step that narrows the corpus to a smaller set of candidate contexts for later, more focused processing, typically balancing speed and broad coverage to avoid discarding relevant items.  · merged: retrieval, first-stage retrieval

### implicit memorization  [5 docs, x11] [judged-distinct]  · aliases: memorization, parametric memory, in-parameter memorisation, Parametric factual knowledge
隐式记忆是指将信息（如事实性知识）直接编码并存储在神经模型的参数中，而不是依赖外部存储或检索模块。它使模型在推理时无需查询外部资料即可生成看似合理的回答或预测，但这些知识通常难以直接检索与更新，并可能因编码或提取不准确而引入事实偏差，从而影响泛化表现。  · merged: parametric memory, in-parameter memorisation, Parametric factual knowledge

### language models  [5 docs, x11] [judged-distinct]  · aliases: language model, 生成式语言模型
语言模型是一种通过在大量文本上训练学习语言规律的模型，能够根据上下文为文本序列建模并生成连贯的句子、段落或答案。它们常用于自然语言生成、问答与对话等任务，同时也可能因训练数据与参数固有的局限而出现不可靠信息或知识覆盖不足等问题。  · merged: language model, 生成式语言模型

### perplexity  [5 docs, x10] [new]  · aliases: PPL
A measure of how well a probabilistic language model predicts a sequence of tokens, with lower values indicating better predictive fit. It is derived from the average negative log-likelihood of the tokens.

### re-ranking  [5 docs, x10] [new]  · aliases: reranking, BERT rerank, re-ranking system, two-stage retrieval, 重排序
重排序（re-ranking）是一种在生成候选检索结果之后，对候选集再次进行排序的二次处理过程，以选出更优的结果。它通常用于提升检索精度：先由高召回的第一阶段检索产生候选，再用更精细但计算更昂贵的评分或模型对候选进行重新评估与排序。通过这种方式在召回与精度之间实现更好的整体权衡。  · merged: reranking, BERT rerank, re-ranking system, two-stage retrieval, 重排序

### sequence-to-sequence model  [5 docs, x10] [judged-distinct]  · aliases: seq2seq model, sequence-to-sequence generator, sequence-to-sequence network, encoder-decoder model, Sequence-to-sequence architecture
序列到序列模型是一种将输入序列映射为输出序列的神经网络架构，通常由编码器和解码器组成：编码器表示输入，解码器在生成过程中逐步产生输出序列。它常用于机器翻译、文本生成与摘要等任务，能够基于序列依赖生成连贯的自由文本。进一步地，在检索增强生成中，可在检索到的文档条件下生成答案。  · merged: sequence-to-sequence generator, sequence-to-sequence network, seq2seq model, encoder-decoder model, Sequence-to-sequence architecture

### BERTBASE  [5 docs, x9] [judged-distinct]  · aliases: BERT Base, BERT-base
BERT 的一种较小的基础模型配置，包含 12 层 Transformer 编码器、768 维隐藏层以及 12 个注意力头，总参数量约 1.1 亿。它通常作为通用的预训练语言表征编码器，用于在下游自然语言处理任务中提供初始化与特征表示。  · merged: BERT-base

### T5  [5 docs, x9] [new]  · aliases: Text-to-Text Transfer Transformer
A large pre-trained text-to-text model that can store knowledge implicitly in its parameters. It is used as an example of a state-of-the-art system for open-domain question answering.

### GPT-2  [5 docs, x9] [judged-distinct]
A large autoregressive language model that generates text by predicting the next token from prior context. It was explored as a direct-answer generator for open-domain question answering.

### dual-encoder framework  [5 docs, x9] [new]  · aliases: dual encoder, bi-encoder, 双编码器架构, dual-encoder model, bi-encoder architecture, 双塔模型, dual-encoder architecture
双编码器框架是一类神经检索模型结构，将查询与候选文本（或文档）分别输入两个编码器，得到各自的向量表示（编码器参数可共享或独立）。通过计算两侧向量的相似度来估计相关性并完成匹配与打分。由于候选侧向量可预先独立编码并缓存，该框架特别适合大规模密集检索中的高效召回。  · merged: 双编码器架构, dual-encoder model, bi-encoder architecture, 双塔模型, dual-encoder architecture

### dot product  [5 docs, x8] [new]  · aliases: inner product distance, inner product
A dot product is an algebraic operation that multiplies corresponding components of two vectors and sums the results. It defines an inner product used as a similarity measure, where larger values typically indicate greater alignment between the vectors, such as for scoring how well a vector embedding (e.g., a document) matches another embedding (e.g., a query) in retrieval systems.  · merged: inner product distance, inner product

### Dropout  [5 docs, x7] [judged-distinct]
一种正则化方法，在训练过程中随机丢弃一部分神经元或连接，以减少过拟合。它通过迫使模型不过度依赖少数特征来提升泛化能力。

### cross entropy loss  [5 docs, x7] [new]  · aliases: cross-entropy loss, 负对数似然, 负对数似然损失
交叉熵损失是一种常用于训练概率模型的目标函数，衡量模型预测分布与真实标签（正确项）之间的差异。它等价于最小化正确结果的负对数概率（负对数似然），因此在训练中会显著惩罚对正确项赋予很低概率的情形，推动模型提升对正确与其他候选的区分能力。交叉熵越低通常表示预测越准确，常用于分类、语言建模以及相关的排序学习场景。  · merged: cross-entropy loss, 负对数似然, 负对数似然损失

### language modeling  [5 docs, x7] [judged-distinct]  · aliases: language modeling objective
A training objective that teaches a model to predict missing or next tokens in text from surrounding context. It captures local linguistic structure by turning sequences into prediction tasks, and in retrieval-augmented setups the training signal can be used to update both the language model and the retriever.  · merged: language modeling objective

### Wikipedia  [5 docs, x7] [new]  · aliases: English Wikipedia
A collaboratively edited online encyclopedia whose articles are often used as large-scale text data for language model training. In this context, English Wikipedia refers to the English-language portion of that corpus.

### reading comprehension  [5 docs, x7] [new]  · aliases: RC, reading comprehension system, reading comprehension task, machine reading
Reading comprehension is a question answering task in which a model reads a text passage and answers questions using information from that passage. It evaluates the ability to understand the text and identify the evidence needed to produce an answer, including extracting relevant spans and making necessary inferences, rather than relying primarily on external knowledge.  · merged: reading comprehension system, reading comprehension task, machine reading

### information retrieval  [5 docs, x7] [judged-distinct]  · aliases: IR, retrieval operations, retrieval process, 知识检索
Information retrieval is the task of finding and selecting relevant documents, passages, or other information in response to a query within a large collection or knowledge base. It often relies on indexed representations and similarity search to quickly identify pertinent items and may remove irrelevant or redundant content before downstream use. In retrieval-augmented generation systems, it is the retrieval stage that selects external context to support subsequent generation or reasoning.  · merged: retrieval operations, retrieval process, 知识检索

### non-parametric knowledge source  [5 docs, x6] [new]  · aliases: external knowledge, external knowledge source, external knowledge database, knowledge base, external knowledge base
A non-parametric knowledge source is an external store of information accessed at query time rather than encoded entirely in a model’s parameters. In retrieval-augmented generation systems, it is queried to retrieve relevant facts or documents (e.g., via similarity search over an indexed collection) to ground responses, though retrieved content may include irrelevant material that must be filtered. It can be updated independently of the generator to refresh or improve the information available for answers.  · merged: external knowledge, external knowledge source, external knowledge database, knowledge base, external knowledge base

### GraphRAG  [4 docs, x34] [new]  · aliases: Graph Retrieval-Augmented Generation, Graph Retrieval Augmented Generation, GRAG, Graph-based retrieval-augmented generation
GraphRAG is a graph-based retrieval-augmented generation approach for answering questions over graph-structured text. It builds a graph index from source documents, retrieves an approximately query-relevant subgraph using the graph’s structure, and injects the subgraph (including its associated text or entities) into a language model to condition response generation. By performing relationship-aware retrieval and reasoning over connected information, it improves performance on graph-centric question-answering and domain-specific generation tasks.  · merged: Graph Retrieval-Augmented Generation, Graph Retrieval Augmented Generation, GRAG, Graph-based retrieval-augmented generation

### few-shot learning  [4 docs, x18] [new]  · aliases: few-shot, few-shot setting, few-shot learning in language models, in-context few-shot learning, few-shot prompting, downstream few-shot learning, few-shot capabilities
少样本学习（few-shot learning）指模型在仅获得少量示例（通常带少量标注）的情况下，仍能完成新任务或完成对新任务的适配。其核心是利用这些有限样本所提供的任务线索，通过提示/上下文或少量更新来诱导任务模式，从而实现对新输入的泛化。该能力也可通过引入外部知识或检索相关信息来进一步增强。  · merged: few-shot setting, few-shot learning in language models, Few-Shot, in-context few-shot learning, few-shot prompting, downstream few-shot learning, few-shot capabilities

### pre-trained seq2seq model  [4 docs, x15] [judged-distinct]  · aliases: pre-trained sequence-to-sequence model, seq2seq model, BART
A pre-trained sequence-to-sequence neural language model that is trained on large text corpora before being adapted to a downstream task. It takes an input sequence and generates a corresponding output sequence, typically using an encoder–decoder architecture where the encoder builds context and the decoder generates tokens autoregressively. Such models are commonly used as conditional generation backbones.  · merged: BART

### 上下文窗口  [4 docs, x13] [new]  · aliases: context window, fixed context window
上下文窗口指模型在一次输入中能够处理并关注的最大上下文长度。它决定单个提示中可包含的文本量与代币总数，并因此限制可直接纳入生成过程的检索证据以及对长上下文的利用能力。  · merged: context window, fixed context window

### model size  [4 docs, x8] [judged-distinct]  · aliases: model scale, LLM scale
模型规模通常指语言模型的规模，常用指标是模型参数数量或等价的表示容量。模型规模增大会提升其表示与学习复杂模式的能力，但也会带来更高的计算与训练成本；同时，更大的模型并不必然在所有任务上都能获得更好表现。  · merged: model scale, LLM scale

### Learned Embedding  [4 docs, x7] [new]  · aliases: embedding, embedding matrix
A learned embedding is a trainable mapping that represents discrete symbols (such as vocabulary tokens or other categorical items) as continuous vectors. An embedding matrix assigns each symbol ID a vector, typically learned jointly with the model, and these vectors are used as input representations for neural network layers such as sequence models.  · merged: embedding matrix, embedding

### BooksCorpus  [4 docs, x7] [new]  · aliases: BOOKCORPUS, Toronto Books Corpus, Books Corpus
BooksCorpus（Toronto Books Corpus）是用于语言模型训练与评估的大规模英文书籍文本语料库，主要由完整书籍构成。其数据通常划分为训练集以及用于验证与测试的独立保留部分，以支持性能评估与泛化检验。该语料提供连贯的自然语言序列，作为类似书籍风格的基准语料，区别于基于网页等来源的语料。  · merged: BOOKCORPUS, Toronto Books Corpus, Books Corpus

### sample efficiency  [4 docs, x7] [new]  · aliases: 样本效率
样本效率是指模型或方法在有限数据条件下，利用示例获得有效规律并达到较好性能的能力。样本效率越高，通常在相同性能目标下所需的样本数量越少。  · merged: 样本效率

### sparse bag-of-words matching  [4 docs, x7] [new]  · aliases: bag-of-words matching, Sparse retrieval, sparse vector space model, word-based sparse retrieval, keyword matching
Sparse bag-of-words matching (keyword/term matching) is a non-learned retrieval method that represents a query and documents with sparse term-weight vectors (such as TF-IDF or BM25) and ranks candidates by the overlap of their lexical features and the weights of those terms. It primarily captures exact or near-exact word/term matching, making it simple, efficient, and a useful baseline or first-stage retriever. Because it depends on surface-form overlap rather than semantic understanding, it may miss relevant content that uses different wording.  · merged: Sparse retrieval, sparse vector space model, word-based sparse retrieval, keyword matching

### Softmax Function  [4 docs, x6] [new]  · aliases: softmax, Softmax算子, Softmax operator
Softmax函数是一种将一组实值分数（常称为logits）转换为概率分布的归一化函数。它对每个分数取指数后除以所有指数的和，因此输出非负且各项概率总和为1。该函数常用于多分类任务中，将logits归一化并与交叉熵等训练目标配合使用。  · merged: softmax, Softmax算子, Softmax operator

### byte-pair encoding  [4 docs, x6] [new]  · aliases: BPE, byte pair encoding
A subword tokenization method that iteratively merges frequent symbol pairs to build a vocabulary of subword units. It represents text using a finite set of learned units while preserving the ability to encode rare or novel words as sequences of more common subwords.  · merged: byte pair encoding

### 预训练  [4 docs, x6] [new]  · aliases: pre-training
预训练是指在针对具体任务之前，先在大规模数据（通常为无标注或弱标注）上优化模型参数的初始训练阶段。其目的在于学习对下游目标有用的通用表示与参数，然后再进行任务特定的微调以适配具体任务。  · merged: pre-training

### English Wikipedia  [4 docs, x6] [judged-distinct]  · aliases: WIKIPEDIA, Wikipedia dataset
The English-language edition of Wikipedia, a collaboratively edited encyclopedia that provides large volumes of diverse, well-edited natural language text. It is frequently used as training data for language models because of its scale and broad topical coverage.  · merged: Wikipedia dataset

### search index  [4 docs, x6] [judged-distinct]  · aliases: index, dense vector index, document index
A search index is an information retrieval data structure that organizes documents or passages to enable efficient retrieval of relevant candidates under a given query or criterion. It determines what information is accessible to a retrieval system and can be maintained over time by adding and replacing documents or passages. In embedding-based retrieval, it stores dense vector representations of texts and supports similarity search to return items whose vectors are close to the query’s representation.  · merged: index, dense vector index, document index

### exact match  [4 docs, x6] [new]  · aliases: exact match metric, Exact Match score
一种用于问答任务的评估指标，当预测答案在对其进行规范化后与标准答案完全一致时才判为正确。其判定通常要求逐词或逐字符级别的完全匹配，以衡量系统对目标答案文本的精确复现能力。  · merged: exact match metric, Exact Match score

### ORQA  [4 docs, x6] [judged-distinct]  · aliases: Open Retrieval Question Answering, open-retrieval question answering
Open Retrieval Question Answering (ORQA) is an open-domain question answering approach that jointly learns a dense retriever and a question-answering reader. The retriever selects relevant passages from a large corpus, and the reader conditions on the retrieved text to extract or generate the answer. Training maximizes the marginal likelihood over the latent retrieved documents.  · merged: Open Retrieval Question Answering, open-retrieval question answering

### GraphRetriever  [4 docs, x6] [judged-distinct]  · aliases: Graph Retriever, G-Retriever, 图引导检索
GraphRetriever 是一种面向图相关任务的检索方法/检索器，通过将与图结构相关的实体或文本组织为图中的节点，并利用节点与边之间的连接关系来进行图引导的多步（multi-hop）证据检索。它用图结构来约束与引导与查询相关信息的选择，使证据定位比仅依赖平面检索更有效，并为后续图推理所需的生成或推理提供支撑。  · merged: Graph Retriever, G-Retriever, 图引导检索

### demonstration  [4 docs, x6] [new]  · aliases: demonstrations, in-context exemplars, prompt exemplars, few-shot exemplars, few-shot examples
Demonstration refers to one or more worked input–output example pairs included in a prompt to illustrate the intended task and the mapping the model should follow. By showing the pattern to continue or imitate for a new input, demonstrations guide in-context learning without updating model parameters. The choice of examples, including their content and style, can significantly affect model performance.  · merged: in-context exemplars, prompt exemplars, few-shot exemplars, few-shot examples

### SQuAD v1.1  [4 docs, x5] [new]  · aliases: Stanford Question Answering Dataset v1.1, SQuAD, SQuAD 1.1
SQuAD v1.1 是一个基于段落阅读理解的问答基准数据集，问题来自维基百科文本段落，答案需要从给定上下文中抽取答案片段来回答。它主要包含可回答的问题，用于评估阅读理解与抽取式问答模型的性能。  · merged: SQuAD 1.1

### Transformer decoder  [4 docs, x5] [judged-distinct]  · aliases: left-context-only version, decoder-only Transformer, decoder-only model
A decoder-only Transformer architecture that generates sequences autoregressively by conditioning only on the left (past) context. It uses masked self-attention so each token cannot attend to future tokens, enabling next-token prediction for language modeling and text generation.  · merged: decoder-only Transformer, decoder-only model

### FAISS  [4 docs, x5] [new]  · aliases: Facebook AI Similarity Search
FAISS is an open-source library for efficient similarity search and nearest neighbor retrieval in high-dimensional vector spaces. It uses indexing and compression techniques to reduce memory use and accelerate retrieval over very large collections of vectors.

### natural language generation  [4 docs, x5] [judged-distinct]  · aliases: NLG, 自然语言生成
自然语言生成（NLG）是一类任务：模型根据输入提示或约束生成连贯的人类语言文本。该任务通常要求在上下文约束下输出完整句子或更长的文本片段。与抽取式方法不同，它强调生成而非从文本中直接复制片段。  · merged: 自然语言生成

### greedy decoding  [4 docs, x5] [judged-distinct]
一种解码策略，在每一步都选择当前概率最高的输出词元，直到生成结束。它计算简单、速度快，但不一定找到全局最优序列。

### training batch  [4 docs, x4] [new]  · aliases: batch, mini-batch, standard batching
A training strategy that groups multiple examples into a batch and processes them together as one unit. Batching improves computational throughput and can significantly speed up systems, while enabling optimization updates (for training) to use aggregated information from multiple examples and thereby improve gradient estimation and hardware utilization.  · merged: mini-batch, standard batching

### cross attention  [4 docs, x4] [judged-distinct]  · aliases: cross-attention
Cross attention is an attention mechanism where representations from one sequence attend to representations from a different sequence. It enables direct interaction between the two inputs, allowing information from one sequence to influence and refine the encoding of the other. It is commonly used to model relationships between paired texts, such as a query and a passage or two related sentences.  · merged: cross-attention

### graph index  [3 docs, x19] [judged-distinct]  · aliases: 图索引, 图结构文本索引范式, graph-enhanced text indexing, graph-based text indexing, index graph, 图式文本索引, graph-based index phase, graph-based indexing, 索引图, 图式索引, Graphs for Knowledge Indexing
图索引是一种图结构的知识组织与检索索引方式：将实体表示为节点、关系表示为边，并在信息源之上构建图来刻画概念及其关联。通过图遍历或图感知的检索在图的访问路径与关系上下文中定位相关证据，从而提升信息的可获取性与检索效率。  · merged: 图索引, 图结构文本索引范式, graph-enhanced text indexing, graph-based text indexing, index graph, 图式文本索引, graph-based index phase, graph-based indexing, 索引图, 图式索引, Graphs for Knowledge Indexing

### kNN-LM  [3 docs, x17] [judged-distinct]  · aliases: kNN-LMs, nearest neighbor language model, k-nearest-neighbor language model, k-nearest neighbor language model, k近邻语言模型
kNN-LM 是一种语言建模方法，将预训练神经语言模型与基于 k 近邻检索的 k 近邻模型通过线性插值结合。在预测时，它从包含以往训练样本（或其隐藏表示）的数据存储中检索与当前上下文最相近的条目，得到候选下一词的分布，并与原模型的输出分布融合以提升下一 token 概率。该方法通常无需额外训练即可改善预测表现，且检索机制常通过相似性搜索来实现，以增强对记忆或相似罕见案例的利用。  · merged: k-nearest-neighbor language model, k-nearest neighbor language model, k近邻语言模型

### scaling laws for neural language models  [3 docs, x14] [new]  · aliases: scaling laws, neural language model scaling laws, scaling law, language model scaling, Kaplan scaling law, predictable scaling
缩放规律（scaling laws）是一类经验性的幂律模型，用于刻画神经语言模型性能随模型规模、数据集规模以及训练计算量等因素变化的系统规律。它们可利用较小模型的观测表现来可靠外推更大模型的性能，并在给定计算预算或约束条件下预测扩展带来的改进，同时估计训练资源投入的效果。部分方法还能据此监控大模型训练过程是否按预期收敛。  · merged: scaling laws, scaling law, language model scaling, Kaplan scaling law, predictable scaling

### chain of thought  [3 docs, x14] [judged-distinct]  · aliases: chain of thought reasoning, Chain-of-thought reasoning, model-generated chain of thought, sequential reasoning, Reasoning chain
A chain of thought (reasoning chain) is a sequence of intermediate reasoning steps whose conclusions are linked to reach a final answer or conclusion. It is generated during response formation and can help solve complex problems by breaking them into smaller, connected steps, rather than attempting a single direct move. When available, it can be inspected to assess whether the reasoning is logically and mathematically correct.  · merged: Chain-of-thought reasoning, model-generated chain of thought, sequential reasoning, Reasoning chain

### fine-tuning with human feedback  [3 docs, x12] [judged-distinct]  · aliases: human feedback fine-tuning, reinforcement learning from human feedback, RLHF fine-tuning, 基于人类反馈的强化学习, preference optimization strategy
一种利用人类偏好或目标驱动的信号来优化模型输出行为的训练方法。通过对候选输出进行比较并将更符合目标的结果赋予更高奖励（常见做法是先构建偏好/奖励模型，再把偏好转化为可学习信号），再结合强化学习或相关优化策略引导生成，使模型更倾向于产生更符合期望的回答（如更准确、更有帮助、更一致）。  · merged: reinforcement learning from human feedback, RLHF fine-tuning, 基于人类反馈的强化学习, preference optimization strategy

### knowledge graph  [3 docs, x12] [judged-distinct]  · aliases: graph structure, Graph-structured knowledge representation, 知识载体图
A knowledge graph is a graph-structured representation of knowledge in which nodes correspond to entities (or concepts) and edges represent their relationships, making relational information explicit. This structure supports reasoning and query answering by preserving how entities are connected for graph-based analysis of interrelated information.  · merged: graph structure, Graph-structured knowledge representation, 知识载体图

### GLUE  [3 docs, x10] [new]  · aliases: General Language Understanding Evaluation, GLUE benchmark
GLUE 是一个用于评估通用语言理解能力的基准集合，包含多个不同类型的句子级自然语言理解任务。它为语言模型提供统一的评测设置，用于比较模型在多类语言理解任务上的整体性能。  · merged: GLUE benchmark

### power law  [3 docs, x10] [new]  · aliases: power-law scaling, power law relationship, power-law trend, power law scaling, power-law relationship
幂律是一种函数关系，其中一个量随另一个量按固定指数的幂次变化。将数据取对数后，在对数-对数坐标系上通常呈现近似直线，从而体现平滑的尺度不变性。它常用于经验建模与尺度分析，用来刻画性能或其他指标随模型规模、数据规模、计算量等资源的变化规律。  · merged: power-law scaling, power law relationship, power-law trend, power law scaling, power-law relationship

### nearest neighbor retrieval  [3 docs, x9] [judged-distinct]  · aliases: nearest neighbor search, k-nearest neighbor retrieval, similarity search, k近邻检索, vector similarity-based retrieval
最近邻检索是一种基于相似度搜索的检索方法，通过比较文档或数据片段的向量表示与查询向量的相似度，选取最接近的若干候选结果。它通常依赖向量表示以及预先选定的距离或相似度度量来定义“邻近”。该方法适用于近似语义匹配，但可能检索到看似相关、却包含不必要内容的结果。  · merged: k-nearest neighbor retrieval, nearest neighbor search, similarity search, k近邻检索, vector similarity-based retrieval

### explicit memory  [3 docs, x9] [new]  · aliases: non-parametric memory
Explicit memory is a memory mechanism that stores information outside the model parameters and allows it to be accessed directly. Rather than relying solely on what is encoded during training, the model can retrieve relevant examples or states from an external memory source at prediction or generation time to improve responses.  · merged: non-parametric memory

### refresh  [3 docs, x9] [new]  · aliases: asynchronous re-indexing, asynchronous MIPS refreshes, re-indexing, Asynchronous Index Refresh, index rebuilding, index refresh
Refresh is a strategy for keeping a retrieval (search/nearest-neighbor) index aligned with the latest document representations (embeddings) by recomputing and rebuilding the index. This ensures retrieval results reflect the most recent model parameters and representations, typically performed on a delayed or periodic schedule in the background to avoid disrupting ongoing computation.  · merged: asynchronous re-indexing, asynchronous MIPS refreshes, re-indexing, Asynchronous Index Refresh, index rebuilding, index refresh

### vector RAG  [3 docs, x9] [judged-distinct]  · aliases: vector retrieval-augmented generation, Naive RAG, RQRAG
Vector RAG is a retrieval-augmented generation approach that splits a corpus into text chunks, embeds them, and stores the embeddings in a vector database. Given a user query, it retrieves the most similar chunks using embedding-based similarity and conditions the language model on those retrieved records to produce an answer. It works best when the necessary facts are present in the retrieved chunks, and it may miss information that depends on relationships or broader context not captured by local chunk retrieval.  · merged: Naive RAG, RQRAG

### 文本微调  [3 docs, x8] [judged-distinct]  · aliases: 微调, fine-tuning approach, 监督微调
文本微调是一种在预训练语言模型基础上，使用人工标注的任务数据或指令数据继续训练的方法。通过进一步更新模型参数，使其更贴合特定任务的输入格式与输出/响应风格（如遵循用户指令），从而迁移预训练知识并提升目标任务性能。通常可为不同任务得到各自的微调模型实例。  · merged: fine-tuning approach, 微调, 监督微调

### Cloze task  [3 docs, x8] [new]  · aliases: Cloze, 完形填空任务, cloze tasks
一种填空式语言理解任务，要求根据上下文将句子中缺失或留空的词语/短语补全。它常用于评估模型利用上下文预测缺失信息的能力，并可作为语言建模与表示学习的启发式训练目标，因为模型必须依赖周围语义与上下文约束来完成补全。  · merged: 完形填空任务, cloze tasks

### zero-shot transfer  [3 docs, x8] [judged-distinct]  · aliases: zero-shot, zero-shot setting, zero-shot learning, zero-shot evaluation
Zero-shot transfer is an evaluation setup in which a model performs a task without receiving any task-specific examples or demonstrations beforehand. The model relies only on its pretrained knowledge and whatever task description or prompt is provided to generate an answer.  · merged: zero-shot setting, zero-shot learning, zero-shot evaluation

### Fusion-in-Decoder method  [3 docs, x8] [new]  · aliases: FiD, Fusion-in-Decoder
A question answering architecture for open-domain QA that encodes multiple retrieved passages separately and then fuses their representations in a sequence-to-sequence decoder. During answer generation, the decoder uses cross-attention over all passages, enabling the model to integrate evidence across passages to produce the final answer.  · merged: Fusion-in-Decoder

### emergent ability  [3 docs, x8] [new]  · aliases: emergent abilities
An emergent ability is a capability that appears only when a model reaches sufficient scale or training progress. Such abilities may be weak or absent in smaller models but become noticeable once size or progress crosses a threshold, sometimes emerging sharply as the model grows.  · merged: emergent abilities

### batch size  [3 docs, x7] [judged-distinct]
Batch size is the number of training examples or tokens processed together in one optimization step. Larger batch sizes can increase parallelism and reduce the number of serial steps needed for training.

### WEBQUESTIONS  [3 docs, x7] [judged-distinct]  · aliases: WebQuestions dataset
WEBQUESTIONS is an open-domain question answering benchmark dataset consisting of question–answer pairs gathered from web queries and associated answers. It is constructed using Google Suggest by seeding with an initial question and expanding to related questions. It is used to evaluate a model’s ability to answer questions that require broad external knowledge.  · merged: WebQuestions dataset

### retrieved passages  [3 docs, x7] [judged-distinct]  · aliases: retrieved passage, support passage, retrieved source
Retrieved passages are text snippets selected by an information retrieval system as potentially relevant evidence for a given question. They are used to improve factual grounding for downstream inference or generation, but their biases or errors can carry through into the final response.  · merged: retrieved passage, support passage, retrieved source

### approximate nearest neighbor search  [3 docs, x7] [judged-distinct]  · aliases: ANN search, Approximate nearest neighbor retrieval, 近似最近邻检索, approximate nearest neighbors, approximate nearest neighbors search
Approximate nearest neighbor search 是一类用于在大规模数据集中快速检索与查询向量相似的候选项的检索方法，避免对每个数据点都进行穷尽的逐一比较。通过在搜索过程中接受一定的精度损失，它用更高的速度与可扩展性来换取近似的相邻结果，因而可将基于相似度的检索扩展到更大的标记或文档存储。  · merged: Approximate nearest neighbor retrieval, 近似最近邻检索, approximate nearest neighbors, approximate nearest neighbors search

### instruction following  [3 docs, x7] [judged-distinct]  · aliases: 指令跟随
instruction following 指的是语言模型根据用户以自然语言给出的显式指令与约束选择合适的行为，并生成符合要求的输出的能力。它是对齐（alignment）语言模型的重要目标，直接决定模型能否按用户意图完成请求。  · merged: 指令跟随

### 注意力机制  [3 docs, x6] [new]  · aliases: attention mechanism, 注意力函数, attention model
注意力机制是一种神经网络中的计算机制，在生成表示时对输入不同部分分配不同权重，从而以加权求和的方式突出与当前任务或上下文最相关的信息。通常通过度量“查询—键”的相似度得到注意力权重，并将该权重应用到对应的“值”向量上。它常用于序列建模，以及在检索增强生成等场景中帮助模型关注最相关的检索内容。  · merged: 注意力函数, attention mechanism, attention model

### position-wise feed-forward network  [3 docs, x6] [new]  · aliases: feed-forward network, point-wise feed-forward layer, feedforward network, feedforward layer
A position-wise feed-forward network is a neural network sublayer that applies the same learned feed-forward transformation independently to each position in a sequence (i.e., it does not mix information across positions). In Transformer models it is typically placed after attention to increase the per-token expressive power, using affine layers and nonlinearities to transform the representation at each position.  · merged: point-wise feed-forward layer, feed-forward network, feedforward network, feedforward layer

### word-piece  [3 docs, x6] [judged-distinct]  · aliases: WordPiece, word-piece vocabulary, WordPiece token, BERT wordpiece
A subword token produced by the WordPiece tokenization scheme. It splits text into smaller units from a learned subword vocabulary, allowing models to handle rare or compound words by representing them as sequences of subwords rather than requiring whole-word entries, while keeping sequence lengths manageable.  · merged: word-piece vocabulary, wordpiece, WordPiece token, BERT wordpiece

### contextual word embeddings  [3 docs, x6] [judged-distinct]  · aliases: context-sensitive features, contextual representation, contextual token representation, deep contextualized word representations, context-aware representations
Contextual word embeddings are token-level vector representations whose values depend on the surrounding words in the input. Rather than using a single fixed embedding per word type, they produce different embeddings for the same token in different occurrences, capturing context-sensitive meaning and improving downstream language understanding.  · merged: contextual representation, contextual token representation, deep contextualized word representations, context-aware representations

### [CLS] token  [3 docs, x6] [new]  · aliases: CLS, [CLS] 令牌
[CLS] token 是 BERT 风格模型在输入序列开头添加的特殊分类标记。模型通常将该标记的最终隐藏状态作为整段输入的汇总表示，用于句向量或分类等下游序列级任务。  · merged: [CLS] 令牌

### 最大内积搜索  [3 docs, x6] [new]  · aliases: MIPS, Maximum Inner Product Search, 内积检索
最大内积搜索是一种在向量空间中进行最近邻检索的技术，目标是找到与查询向量内积最大的候选项。它通常在基于内积的相似度（或打分）度量下工作，用于从预先编码好的向量集合中快速定位最相关的向量或文档。由于可用于精确或近似地加速大规模检索任务，因此在海量嵌入检索中很常见。  · merged: Maximum Inner Product Search, 内积检索

### CURATEDTREC  [3 docs, x6] [judged-distinct]
An open-domain question answering benchmark based on the TREC question set. It is used to assess performance on knowledge-intensive question answering with external evidence.

### inverse cloze task  [3 docs, x6] [new]  · aliases: ICT
A self-supervised training objective in which a model is given a sentence and trained to retrieve the document from which that sentence was taken. It is used to initialize retrieval embeddings so that semantically related sentences and documents are closer in representation space.

### reading comprehension model  [3 docs, x6] [judged-distinct]  · aliases: reading comprehension models, reader model, reader
A reading comprehension model answers questions by reading a given passage or retrieved text, extracting relevant information, and generating a final response. In open-domain question answering pipelines, it typically acts as a downstream stage after retrieval, relying on the retrieved evidence to support interpretation and answer generation.  · merged: reader model, reader

### 事实验证  [3 docs, x6] [judged-distinct]  · aliases: Fact Verification, FEVER
事实验证是一种自然语言理解任务，用于判断给定陈述在可获得证据下是否被支持、被反驳或无法核实。它通常将问题表述为对“论断—证据”的分类，并结合文本证据检索与支持关系判定，输出陈述的真实性标签。  · merged: FEVER, fact verification

### graph view  [3 docs, x6] [judged-distinct]  · aliases: graph view of textual graphs, graph structures, 图结构
一种以节点及其连接关系组织信息的表示方式。它将实体显式编码为节点，并将它们之间的关联建模为边，从而刻画结构关系、拓扑与依赖关系。该表示便于在检索与推理中利用局部及全局的图结构信息。  · merged: graph view of textual graphs, graph structures, 图结构

### RAG system  [3 docs, x6] [judged-distinct]  · aliases: retrieval-augmented generation system, NaiveRAG, RAG model, text-based RAG model, 传统检索增强生成系统
A RAG (retrieval-augmented generation) system combines information retrieval with language-model generation to produce answers grounded in external text. It fetches relevant passages or documents in response to a query and conditions the language model on this retrieved evidence when generating the response. Because the external information is incorporated at inference time, the system can leverage new knowledge without retraining the model parameters.  · merged: NaiveRAG, RAG model, text-based RAG model, 传统检索增强生成系统

### 自注意力  [3 docs, x5] [judged-distinct]  · aliases: self-attention, 自注意力机制
自注意力是一种注意力机制，它让序列中每个位置根据同一序列中其他位置的信息对自身表示进行重新加权与更新。通过在序列内部显式建模关系，能够有效捕捉远距离依赖，并且适用于需要交互建模的任务（如文本对之间的交互）。  · merged: 自注意力机制

### learned positional embedding  [3 docs, x5] [judged-distinct]  · aliases: learned positional embeddings, positional embedding, position embeddings
Learned positional embeddings are trainable vectors added to token representations to encode each token’s position in an input sequence. By learning position representations from data during training, they help models represent word order and provide explicit positional information for attention-based architectures.  · merged: positional embedding, learned positional embeddings, position embeddings

### training step  [3 docs, x5] [new]  · aliases: step, optimization step, parameter update step, parameter update
A training step is an optimization update in which a model’s parameters are adjusted using gradients computed from training data. It typically occurs after a forward pass and loss computation, followed by backpropagation to obtain gradients, and then an update rule to modify the parameters. The total number of these steps (or updates) is used to quantify training duration and to set learning rate schedules.  · merged: optimization step, parameter update step, parameter update

### ELMo  [3 docs, x5] [judged-distinct]  · aliases: Embeddings from Language Models
一种上下文化词表示模型，通过双向语言建模生成可作为下游任务特征的预训练表示。它通常被用作特征式迁移学习中的表示模块，而不是直接端到端地替换任务模型。

### text generation model  [3 docs, x5] [judged-distinct]  · aliases: text generation models, generator
一种条件文本生成模型，在给定输入序列与（可选的）检索到的文档上下文约束下，按步生成目标序列。模型利用已生成的前文符号以及外部检索信息来预测下一个输出 token，从而生成连贯的文本。  · merged: generator

### WebText corpus  [3 docs, x5] [judged-distinct]  · aliases: WebText, WebText dataset
A web text dataset assembled from internet content, commonly constructed by scraping and collecting outbound links shared on Reddit. In some versions, links are filtered using a karma threshold (e.g., at least 3 karma) as a heuristic for whether the linked content is likely to be interesting or useful. It provides general internet-style text for training language models rather than curated editorial prose, and can serve as a base for later derived variants.  · merged: WebText, WebText dataset

### benchmark  [3 docs, x5] [new]  · aliases: benchmarks, 基准, evaluation benchmark
benchmark 指用于标准化测量与比较不同方法或系统性能的一组任务、数据或指标，提供可重复的评测流程以衡量模型在特定能力或现象上的表现。基准结果有助于在同一评测框架下进行客观对比，并用于评估模型在特定能力或风险方面的表现。  · merged: 基准, benchmarks, evaluation benchmark

### generative model  [3 docs, x5] [judged-distinct]  · aliases: generative models
A generative model is a model that produces an answer by generating text token by token rather than selecting an answer span from a source document. In question answering, it can synthesize an answer from information stored in its parameters or retrieved evidence.

### relationship extraction  [3 docs, x5] [judged-distinct]  · aliases: relation extraction, 关系抽取
关系抽取是指识别文本中实体之间语义联系的过程。它将实体间的关联显式化，生成结构化的关系表示，从而支持构建知识图谱并提升基于关系的检索能力。  · merged: relation extraction, 关系抽取

### 循环神经网络  [3 docs, x4] [new]  · aliases: RNNs, recurrent neural networks, recurrent neural network
一种通过按时间步递归地更新隐藏状态来建模序列数据的神经网络，用以捕捉输入与输出中的顺序依赖。其计算沿序列位置逐步展开，具有天然的顺序性，因此在单个训练样本内部通常难以充分并行化。  · merged: recurrent neural network

### 机器翻译  [3 docs, x4] [judged-distinct]  · aliases: machine translation, 翻译
机器翻译是一种将源语言文本自动转换为目标语言文本的自然语言处理任务。机器翻译系统需要理解源语言语义，并生成目标语言中自然且忠实的表达；现代方法多采用编码器—解码器等序列到序列模型学习源语言与目标语言之间的映射关系，并可用翻译质量指标评估效果。  · merged: Machine Translation, 翻译

### Model Dimension  [3 docs, x4] [new]  · aliases: dmodel, 隐藏维度, network width
模型维度是神经网络中用于表示向量的内部维度大小，通常对应隐藏状态与嵌入向量的宽度或特征维度。它体现为网络的宽度/通道数等结构参数，直接影响模型容量、参数规模与计算开销。  · merged: 隐藏维度, network width

### [SEP] token  [3 docs, x4] [new]  · aliases: SEP
The [SEP] token is a special separator symbol used to mark boundaries between segments in an input sequence. It is commonly used to separate paired sentences or to indicate the end of a sequence.

### Natural Language Inference  [3 docs, x4] [new]  · aliases: NLI, textual entailment
Natural Language Inference (NLI) is a classification task that determines the logical relationship between two sentences, typically expressed as a premise and a hypothesis. The goal is to decide whether the hypothesis is entailed by the premise, contradicted, or is neither (unknown/neutral). It requires understanding how the meaning of one sentence relates to the other.  · merged: textual entailment

### MNLI  [3 docs, x4] [judged-distinct]  · aliases: Multi-Genre Natural Language Inference
MNLI is a natural language inference task in which a model determines whether a hypothesis is entailed by, contradicted by, or neutral with respect to a premise. It is commonly used to evaluate sentence-pair understanding and is widely used as a benchmark for reasoning about relationships between sentences.  · merged: Multi-Genre Natural Language Inference

### 困惑度  [3 docs, x4] [new]  · aliases: perplexity, ppl, 词元困惑度, 语言模型困惑度
困惑度是衡量语言模型对目标文本预测能力的指标，用以反映模型对正确词元的平均不确定性（常由对数损失计算并以指数形式表示）。困惑度越低，通常表示模型对序列分布的建模越好、预测越准确。它常用于评估训练或验证数据上的语言建模质量，也可用于衡量模型对未标注文本的解释能力。  · merged: 词元困惑度, 语言模型困惑度

### vanilla LM  [3 docs, x4] [judged-distinct]  · aliases: plain language model, base language model, Frozen LLM, 冻结 LLM
一种在下游任务中不更新模型参数的标准语言模型使用方式。模型保持预训练权重不变，通过提示及外部上下文（必要时还可结合检索信息）直接完成文本生成或任务推断，而不进行任务特定的微调、对齐或额外训练。  · merged: base language model, Frozen LLM, 冻结 LLM

### Common Crawl  [3 docs, x4] [judged-distinct]  · aliases: Common Crawl dataset
Common Crawl is a publicly available web crawl corpus collected from large-scale snapshots of the internet. It is widely used as training and evaluation data for language models and other NLP systems due to its enormous size and broad topical coverage.  · merged: Common Crawl dataset

### BERT-based cross-encoder  [3 docs, x4] [judged-distinct]  · aliases: cross-encoder, BERT reranker, interaction-based BERT Reranker
一种重排序模型（cross-encoder），通过对查询与候选文档进行联合编码来输出查询-文档的相关性分数。其显式刻画两段文本之间的直接交互，因此通常比独立编码的检索器更准确，但推理计算开销更高。一般用于先前检索得到候选集之后的逐对重排，以提升排序质量。  · merged: BERT reranker, interaction-based BERT Reranker, cross-encoder

### natural language instruction  [3 docs, x4] [new]  · aliases: 自然语言指令
自然语言指令是用普通语言写成的任务说明，用于告诉模型需要执行的操作，并明确输出应满足的格式与要求。它可通过在输入中提供这些约束直接引导模型完成任务，通常无需修改模型参数或提供示范。  · merged: 自然语言指令

### 稠密嵌入  [3 docs, x4] [judged-distinct]  · aliases: dense embeddings, 向量表示, 密集向量表示
稠密嵌入是一种将对象（如文档或查询）映射到低维连续向量空间的表示方法，用连续数值向量刻画其语义或特征。通过在该空间中计算向量相似度来衡量相关性，从而用于大规模检索与（近似）检索任务，并可与其他结构化表示结合以提升效率与召回效果。  · merged: 向量表示, 密集向量表示

### dialog system  [3 docs, x4] [judged-distinct]  · aliases: dialog systems, dialogue agent, 对话代理, Dialogue system
对话系统是能够与用户进行多轮自然语言交互的交互式会话系统，通过对话上下文生成连贯且相关的回答。在检索增强的场景中，它可引入外部信息作为依据，对回答进行约束与支撑，从而提升一致性与事实准确性。  · merged: dialogue agent, 对话代理, Dialogue system

### 检索增强语言模型  [3 docs, x4] [judged-distinct]  · aliases: retrieval-augmented language model, Retrieval-augmented language models
检索增强语言模型是一类将外部检索模块与语言模型结合的系统。它根据当前输入先检索并获取相关文档或证据，再将这些信息用于引导生成，从而在生成过程中实现更好的事实对齐与准确性。  · merged: Retrieval-augmented language models

### 知识图谱  [3 docs, x4] [judged-distinct]  · aliases: knowledge graph, Graphs as Knowledge Carriers
知识图谱是一种以实体及其关系为核心的结构化知识表示方法，用图结构承载领域信息。其节点与边作为主要的知识载体而非仅作检索索引，能够支持聚合、分区、摘要与查询推理，并可作为下游任务（如检索增强生成）的底层知识支撑结构。  · merged: Graphs as Knowledge Carriers

### entity extraction  [3 docs, x4] [judged-distinct]  · aliases: Entity recognition
Entity extraction is the process of identifying and extracting entity mentions from text. It assigns mentions to recognizable categories or entity types and converts unstructured language into structured representations used for downstream knowledge tasks.  · merged: Entity recognition

### subgraph retrieval  [3 docs, x4] [judged-distinct]  · aliases: graph-based retrieval phase, Graph-based retrieval technique
Subgraph retrieval is the process of selecting a relevant subgraph from a larger graph in response to a query or task. The query is transformed into a suitable representation and the system searches the graph structure to return matching graph elements along with surrounding context. By traversing connected nodes and relationships, it can better support multihop reasoning and downstream answer generation or modeling.  · merged: graph-based retrieval phase, Graph-based retrieval technique

### embedding matching  [3 docs, x4] [judged-distinct]  · aliases: similarity-based retrieval, vector similarity, distance-based search
Embedding matching is a retrieval method that ranks candidate items by comparing vector (embedding) representations of items to a query embedding using a distance or similarity measure in an embedding space. It is commonly used to retrieve the most semantically similar items, such as text chunks, from a large collection. However, similarity or proximity in embedding space may not capture finer-grained logical or structural relationships that require more than geometric closeness.  · merged: similarity-based retrieval, vector similarity, distance-based search

### 长短期记忆网络  [3 docs, x3] [judged-distinct]  · aliases: LSTM, long short-term memory
一种改进型循环神经网络架构，专为序列建模而设计，能够在较长时间跨度内更好地保留关键信息，从而缓解普通循环网络的长期依赖困难与梯度消失问题。它通过门控机制控制在不同时间步需要存储、更新和输出哪些信息。  · merged: long short-term memory

### 语言模型  [3 docs, x3] [judged-distinct]  · aliases: language modeling
一种估计符号序列概率分布的模型，通常用于预测给定上下文中的下一个词或符号。它是自然语言处理中的基础组件之一。

### [MASK] token  [3 docs, x3] [new]  · aliases: MASK token
A special placeholder token used to replace selected input tokens during masked language modeling. It marks positions the model should predict and helps train contextual representations from incomplete sequences.

### QNLI  [3 docs, x3] [judged-distinct]  · aliases: Question Natural Language Inference
A question-answering natural language inference task derived from question answering data. It requires determining whether a sentence contains the answer to a question.

### SST-2  [3 docs, x3] [judged-distinct]  · aliases: Stanford Sentiment Treebank 2
A binary sentiment classification task built from movie review snippets. It evaluates whether a sentence expresses positive or negative sentiment.

### 语言模型预训练  [3 docs, x3] [judged-distinct]  · aliases: language model pretraining, Language model pre-training, unsupervised pre-training
一种在未标注文本语料上先进行训练、使语言模型无需依赖人工标注目标即可学习通用语言规律与表示的训练范式。训练完成后，模型通常可在下游任务上进行微调或适配，从而降低对标注数据的依赖并提升泛化能力与任务表现。  · merged: Language model pre-training, unsupervised pre-training

### 键值存储库  [3 docs, x3] [new]  · aliases: datastore, key-value datastore, key-value data structure, 键值数据库
键值存储库是一种以键和值成对保存信息的数据结构或存储系统。通常通过键进行检索，从而快速定位与该键关联的值并获取目标信息。  · merged: key-value data structure, 键值数据库

### embedding function  [3 docs, x3] [judged-distinct]  · aliases: Embedinput, Embeddoc, embedding model
An embedding function maps an input such as text or a document into a dense vector representation in a continuous space. The resulting embeddings are designed to capture semantic relationships, so that vectors can be compared using similarity measures. They are commonly used as searchable keys in retrieval systems.  · merged: embedding model

### DocReader  [3 docs, x3] [new]  · aliases: Document Reader, machine reader, DPR Reader
DocReader 是一种用于开放域问答的阅读器模型，结合检索得到的段落来完成答案预测。给定问题及其候选上下文，它可进行抽取式或生成式的答案建模，并识别最可能的答案片段（或对答案进行排序与选择）。该模型通常与稠密检索器协同使用，从候选文档中提取最终答案。  · merged: machine reader, DPR Reader

### 向量空间  [3 docs, x3] [judged-distinct]  · aliases: vector space, semantic space
一种几何表示空间，其中对象可被编码为向量，并用向量空间中的距离或相似度来度量它们的关系；通过学习得到的嵌入，语义相似的对象会在空间中彼此靠近。该空间是基于相似性进行嵌入检索的基础，因而距离更近的点通常对应语义更相近的内容。  · merged: vector space, semantic space

### DrQA  [3 docs, x3] [judged-distinct]
A question answering system that includes preprocessing code for extracting clean text from Wikipedia articles. Its preprocessing pipeline removes semi-structured elements and prepares articles for downstream retrieval and reading comprehension.

### ablation study  [3 docs, x3] [new]  · aliases: ablation
一种实验分析方法，通过系统性移除或改变模型组件、训练设置或特征来评估它们对性能的影响。它用于识别哪些因素对最终结果贡献最大。

### state-of-the-art performance  [3 docs, x3] [new]  · aliases: SOTA, state-of-the-art, state of the art
The best known performance achieved on a task or benchmark at a given time. It serves as a reference point for comparing and evaluating new systems, often in machine learning as the strongest published result under specified evaluation settings.  · merged: state-of-the-art, state of the art

### 检索增强生成  [3 docs, x3] [judged-distinct]  · aliases: RAG, Retrieval-Augmented Generation
一种将检索到的文档与生成式模型结合的问答和文本生成方法。系统先从外部语料中检索相关证据，再基于这些证据生成答案或文本，从而利用参数化知识与非参数化知识的互补优势。

### Prompt  [3 docs, x3] [new]
A prompt is the input text or embedded conditioning information used to steer a language model’s output. Different prompt-based adaptation methods optimize or modify this input representation instead of changing the model’s internal weights.

### false statement  [3 docs, x3] [judged-distinct]  · aliases: false statements, misinformation
A false statement is an output that presents incorrect (or misleading) information as if it were true. In language modeling, false statements can be generated because the model produces fluent text that is factually incorrect, including due to weak generalization or other factors that cause it to follow misleading patterns.  · merged: misinformation

### retrieval corpus  [3 docs, x3] [judged-distinct]  · aliases: corpus, external corpus, external document corpus
A retrieval corpus is a collection of documents or text records stored outside a language model that can be searched or retrieved at inference time. A retriever selects relevant items from the corpus, which are then supplied to the model as external evidence—often to ground or augment generated outputs when the full collection cannot fit within the model’s context window.  · merged: external corpus, external document corpus

### graph communities  [3 docs, x3] [judged-distinct]  · aliases: community, knowledge graph community structure
Graph communities are groups of nodes in a network that form densely connected subgraphs relative to the rest of the graph, revealing the graph’s modular structure. In knowledge graphs, they can be used to organize closely related entities and relations into coherent higher-level units. Community structure can also improve tasks like retrieval by surfacing contextually related multi-hop evidence within the same community.  · merged: community, knowledge graph community structure

### chain-of-thought prompting  [2 docs, x16] [new]  · aliases: chain-of-thought, chain of thought prompting
A prompting method that asks a language model to produce intermediate reasoning steps before providing a final answer. It encourages the model to follow similar step-by-step reasoning on new problems, which can improve performance on tasks that require multi-step inference.  · merged: chain of thought prompting

### TruthfulQA  [2 docs, x15] [new]  · aliases: TruthfulQA benchmark
TruthfulQA 是一个用于衡量语言模型在回答问题时是否产生虚假或误导性陈述的基准。它包含一组专门设计的问题，这些问题常会诱发人类因常见误解或错误信念而作出错误回答，从而评估模型是否会复现这类错误并衡量其回答的真实性。  · merged: TruthfulQA Benchmark

### next sentence prediction  [2 docs, x14] [new]  · aliases: NSP, 下一句预测, next sentence prediction loss
下一句预测是一种预训练目标，要求模型判断在原始文本中某一句是否紧接着另一句之后。它促使模型学习相邻句子之间的关系，从而建模文档级的连贯性与更长篇章上下文。  · merged: 下一句预测, next sentence prediction loss

### Low-Rank Adaptation  [2 docs, x14] [new]  · aliases: LoRA, 低秩适应
一种用于预训练模型适配的参数高效微调方法：冻结原有模型权重，在对应权重矩阵的位置学习低秩形式的增量更新，而非对全部参数进行训练。该方法通过仅更新少量新增的低秩参数来显著降低可训练参数数量，同时尽量保持下游任务的适配质量。由于低秩更新可与冻结权重合并，部署时通常不会引入额外推理开销。  · merged: 低秩适应, LoRA

### LightRAG  [2 docs, x13] [judged-distinct]  · aliases: LightRAG framework, index-based GraphRAG
LightRAG is a retrieval-augmented generation framework that uses a graph-based index to retrieve relevant information from external text before generating answers. It structures relationships among text chunks with a graph so connected and pertinent passages can be found efficiently while keeping the source text in its original form. LightRAG can incorporate incremental updates as new data arrives.  · merged: LightRAG framework, index-based GraphRAG

### in-batch negatives  [2 docs, x9] [judged-distinct]  · aliases: in batch negatives, in-batch negative setting, in-batch negative training, in-batch training, in-batch negative sampling, in-batch local negatives, in-batch local negative
一种对比学习中的负采样策略，训练时将同一 mini-batch 内除当前样本外的其他样本作为负例，用于构建对比损失所需的训练信号，无需显式采样或额外构造外部负样本。由于负例仅来自批内样本，它们往往较容易与正样本区分，因而可能信息量不足；同时其难度与分布通常较局部，可能与测试阶段或更强负样本来源存在差异，从而限制下游提升幅度。  · merged: in-batch negative setting, in-batch negative training, in-batch training, in-batch negative sampling, in-batch local negatives, in-batch local negative

### InstructGPT  [2 docs, x9] [judged-distinct]
一种经过人类反馈微调的语言模型系列，旨在更好地遵循用户指令。它结合监督学习和基于人类偏好的强化学习，使模型输出更符合人类意图。

### top-k retrieval accuracy  [2 docs, x8] [judged-distinct]  · aliases: top-k accuracy, retrieval accuracy
top-k retrieval accuracy 是用于评估检索系统的指标，衡量在所有查询中，至少有一个正确条目/相关片段出现在检索结果的前 k 个位置的比例。它反映系统将相关内容放入最高优先候选集合中的频率，通常可用命中率或相关性覆盖的形式表示。  · merged: retrieval accuracy, top-k accuracy

### RAG-Token Model  [2 docs, x8] [judged-distinct]  · aliases: RAG-Token
A retrieval-augmented generation model in which the generated output is conditioned on retrieved documents, with the evidence potentially varying at each token generation step. At each decoding step, it marginalizes over the top retrieved documents so that content can be drawn from multiple sources rather than committing to a single retrieved sequence. This distinguishes it from sequence-level retrieval approaches where the retrieval choice is fixed for the whole output, and it coincides with sequence-level retrieval for one-token targets.  · merged: RAG-Token

### inverse scaling  [2 docs, x8] [judged-distinct]  · aliases: inverse scaling trend
Inverse scaling is a pattern in which increasing a model’s scale causes an undesirable behavior or overall performance to worsen rather than improve. It is the opposite of the usual scaling behavior in many tasks, where larger models tend to perform better. In contexts like truthfulness, scaling up may reduce some errors while simultaneously increasing the model’s tendency to reproduce falsehoods learned from the data.  · merged: inverse scaling trend

### community summary  [2 docs, x8] [new]  · aliases: community summaries, 社区摘要, community report, 社区报告
对图中某个社区或群组包含的节点/元素所体现的共同信息进行概括形成的摘要，用于压缩社区层面的细节并保留全局或主题性语义。该摘要通常由对多个节点形成的社区概括得到，便于在高层查询与回答生成中提供更全面的上下文，同时作为中间表示支持后续检索与推理。  · merged: community summaries, 社区摘要, community report, 社区报告

### 域自适应  [2 docs, x7] [new]  · aliases: domain adaptation, 领域适应
域自适应是一种使模型适配特定领域语言、知识分布或任务风格的过程。通过调整训练数据、检索来源或参数更新策略等方式，提升模型在目标域或专门场景中的效果与泛化能力。  · merged: domain adaptation, 领域适应

### RAG-Sequence Model  [2 docs, x7] [judged-distinct]  · aliases: RAG-Sequence
A retrieval-augmented generation model that conditions the generation of an entire output sequence on retrieved documents. Rather than selecting evidence separately for each token, it uses the retrieval to support the full sequence and marginalizes over the top retrieved documents to approximate the sequence probability.  · merged: RAG-Sequence

### ANCE  [2 docs, x7] [judged-distinct]
一种用于稠密检索的训练与编码方法，旨在学习更有效的查询和文档表示以提升高效检索质量。它通常通过更难的负样本和迭代式训练来改善排序效果。

### reward model  [2 docs, x7] [new]  · aliases: RM, 人类反馈作为奖励, Preference Model
奖励模型是一种将人类标注的偏好或纠正信号学习为奖励函数的模型。它通常根据提示与候选回答，预测人类对回答的偏好排序或选择，并将该预测作为奖励来源来引导语言模型或智能体优化，使其朝更符合人类目标的输出方向生成。该方法常用于基于人类反馈的对齐流程中，以替代或补充手工设计的奖励。  · merged: 人类反馈作为奖励, Preference Model

### 编码器-解码器结构  [2 docs, x6] [new]  · aliases: encoder and decoder, 编码器-解码器架构, 序列到序列模型, sequence-to-sequence
编码器-解码器结构是一种序列到序列的模型架构：编码器将输入序列映射为中间表示，解码器根据该表示按顺序生成目标输出序列。它常用于需要逐令牌生成输出的任务，并可用于如机器翻译等将一个序列转换为另一个序列的应用。  · merged: 编码器-解码器架构, 序列到序列模型, sequence-to-sequence

### 多头注意力  [2 docs, x6] [judged-distinct]  · aliases: multi-head attention
多头注意力是一种将注意力计算拆分为多个并行“头”的机制。每个头对同一输入使用不同的可学习线性投影来计算注意力，从而关注不同类型的关系依赖，最后将各头输出进行组合以获得更丰富的表示。  · merged: multi-head attention

### cache model  [2 docs, x6] [new]  · aliases: cache models, continuous cache, 连续缓存模型, continuous cache model
连续缓存模型是一类基于缓存的语言建模方法：通过缓存并检索先前上下文中最近出现的词项（或等价的内部表示/预测结果），根据当前词的表示与历史词表示的相似性构建一个关于近期词的概率分布。该缓存分布与基础语言模型的预测分布进行插值融合，以增强当前步的预测质量。它利用上下文中的局部重复性与相似性，尤其有利于复用刚出现过的词项（可显式促进复制行为）。  · merged: continuous cache, 连续缓存模型, continuous cache model

### dataset size  [2 docs, x6] [judged-distinct]
数据集规模指用于训练模型的样本数量或数据总量。它影响模型能够学习到的信息丰富程度，以及在给定参数规模下是否容易过拟合。

### 余弦相似度  [2 docs, x6] [judged-distinct]  · aliases: cosine, cosine similarity
余弦相似度是一种衡量两个向量方向接近程度的相似度度量，通过比较向量夹角的余弦值来反映方向一致性，通常对向量长度不敏感。对单位向量而言，余弦相似度与内积等价，因此可用于向量检索与表示学习等任务。  · merged: cosine similarity

### Text-to-Text Transfer Transformer  [2 docs, x6] [judged-distinct]  · aliases: T5, T5 (Roberts et al., 2020), unified text-to-text transformer, 统一的文本到文本转换器, text-to-text framework, T5 sequence-to-sequence architecture
Text-to-Text Transfer Transformer 是一种将多种自然语言处理任务统一为文本到文本映射的编码器–解码器序列到序列 Transformer 建模方法。它将输入与期望输出都表示为文本序列，编码器用于理解输入，解码器用于生成输出文本，从而可在同一模型结构与训练框架下覆盖多种生成与理解任务。  · merged: unified text-to-text transformer, 统一的文本到文本转换器, text-to-text framework, T5 sequence-to-sequence architecture

### Proximal Policy Optimization  [2 docs, x6] [new]  · aliases: PPO
A reinforcement learning algorithm used to improve a policy while keeping updates relatively stable. It is commonly used to fine-tune models against a reward signal derived from human preferences or another learned reward model.

### attention head  [2 docs, x5] [judged-distinct]  · aliases: head
A single parallel attention operation within multi-head attention. Each head uses its own learned projections of the queries, keys, and values, and its output contributes to the concatenated result.

### BERTLARGE  [2 docs, x5] [judged-distinct]  · aliases: BERT Large, BERTLARGE architecture
BERT 的一种较大模型配置，采用 24 层、1024 隐藏维度和 16 个注意力头，总参数量约 3.4 亿。通过增加深度与宽度提升模型容量，可作为预训练高容量语言表示的架构选择。  · merged: BERTLARGE architecture

### RoBERTa  [2 docs, x5] [judged-distinct]  · aliases: Robustly optimized BERT approach
RoBERTa 是一种基于 BERT 预训练范式改进的语言表示模型，主要通过采用更有利的预训练策略与设计选择来提升下游任务性能。其预训练通常使用动态掩码、输入不包含下一句预测损失的训练目标、较大的小批量，以及更大的字节级 BPE 词表。  · merged: Robustly optimized BERT approach

### CC-NEWS  [2 docs, x5] [new]  · aliases: CommonCrawl News dataset
CC-NEWS 是从 CommonCrawl 网络抓取内容中筛选得到的大规模新闻文本数据集，用于构建新闻语料库并作为训练数据来源。通常可在原始内容基础上进一步过滤，得到更适合训练的文本。该数据集也常被用于在更可控的条件下研究训练集规模对模型效果的影响。  · merged: CommonCrawl News dataset

### L2 distance  [2 docs, x5] [judged-distinct]  · aliases: Euclidean distance, 欧几里得距离, Euclidean L2 distance
L2 距离是一种向量距离度量，用于衡量两个向量在欧几里得空间中的直线距离，也称为欧氏距离。它常用于检索或表示学习等任务中作为相似性打分依据，通常距离越小表示越相近。  · merged: 欧几里得距离, Euclidean L2 distance

### layer normalization  [2 docs, x5] [new]  · aliases: layernorm, layer norm
Layer normalization is a normalization technique applied within neural-network layers to stabilize activations and improve training. It normalizes features for each input using statistics (typically mean and variance) computed across the hidden dimensions, then rescales and shifts the results. This makes intermediate representations more consistent and can improve downstream performance.  · merged: layer norm, LayerNorm

### training compute  [2 docs, x5] [new]  · aliases: compute used for training
训练计算量是指为优化模型参数所消耗的总计算资源，通常与训练步骤数、模型规模和数据量共同决定。它是比较不同训练方案成本与效率的核心指标。

### convergence  [2 docs, x5] [new]  · aliases: learning convergence, training convergence
收敛是指在训练过程中，优化过程逐步逼近稳定解的现象。通常用训练目标（如损失函数）下降的速度与稳定性来评估收敛情况。更快的收敛意味着在更少的更新次数或更短时间内达到可用的性能或较低的目标值。  · merged: learning convergence, training convergence

### textual knowledge corpus  [2 docs, x5] [judged-distinct]  · aliases: 文本知识语料库, knowledge corpus, external text corpus
文本知识语料库是用于提供外部知识来源的一组大型文本文档集合，包含可检索的文本证据。系统可在其中针对用户输入检索与之相关的内容，并将其作为检索空间，供检索器选择相关文档以支持预测或回答。  · merged: 文本知识语料库, knowledge corpus, external text corpus

### 检索器  [2 docs, x5] [new]  · aliases: retriever, 神经检索模块, 知识检索器
检索器是一种检索模块，用于在检索增强模型中根据输入查询从外部知识源选择相关文档或片段，并将其作为可用的知识上下文提供给下游模型。它通常将候选项表示为向量，利用神经网络进行匹配与打分排序，从而返回最相关的文本以补充模型参数中未显式存储的信息。某些检索器还能与主模型联合训练，在任务中学习更有效的外部信息选择策略。  · merged: 神经检索模块, 知识检索器

### NATURALQUESTIONS-OPEN  [2 docs, x5] [judged-distinct]  · aliases: Natural Questions-Open
An open-domain question answering benchmark derived from the Natural Questions task. It evaluates systems on answering questions using retrieved or otherwise externally sourced knowledge.

### top k documents  [2 docs, x5] [new]  · aliases: top-k documents, top-K approximation, top-K truncation
在推断或学习中，只保留得分（或概率）最高的前K个候选项（文档），并丢弃其余候选的截断近似方法。它用有限个候选替代对全部文档进行完整求和或积分的计算，从而在计算代价过高时降低复杂度并聚焦最相关的结果。该策略也常用于检索系统中限制返回的文档数量以减少开销。  · merged: top-K approximation, top-K truncation

### top-20 passage retrieval accuracy  [2 docs, x5] [judged-distinct]  · aliases: top-20 retrieval accuracy, Coverage@20
An evaluation metric that measures how often relevant answer passages or evidence appear within the top 20 retrieved results. It assesses a retrieval system’s ability to surface useful material early in the ranked list, reflecting retrieval recall and ranking quality prior to downstream extraction.  · merged: Top-20 retrieval accuracy, Coverage@20

### BM25 negative passage  [2 docs, x5] [judged-distinct]  · aliases: BM25 negatives, BM25 negative passages, BM25 Neg
在检索训练中用作负例的段落/文档，通常从 BM25 检索器召回的高排名结果中采样，并不包含答案字符串或相关信息，用于训练模型区分相关与不相关文本。由于来源于前列召回结果，这类负样本往往比随机负例更“困难”，可用于提升稠密检索模型的判别能力，并可能引导模型更接近稀疏（BM25 风格）的检索行为。  · merged: BM25 negatives, BM25 Neg

### full fine-tuning  [2 docs, x5] [judged-distinct]  · aliases: fine-tuning, full-model fine-tuning
全量/全参数微调是一种模型适配方法，训练时更新预训练语言模型的全部（或绝大多数）参数以适配下游任务。它通常以预训练权重为起点，在训练过程中为任务学习相应的参数改动。由于需要存储并部署针对任务更新后的大规模参数，往往成本和部署开销更高。  · merged: full-model fine-tuning

### prompting  [2 docs, x5] [judged-distinct]  · aliases: prompt engineering, prompting interface, prompt design
通过设计与优化输入提示（包括指令表述、措辞、结构与示例等），引导语言模型完成任务并产生期望的行为与输出质量的人机交互方式。用户需将任务转换为模型可遵循的形式，从而影响响应结果；该过程通常不改变模型的底层参数。  · merged: prompt engineering, prompting interface, prompt design

### soft prompt  [2 docs, x5] [judged-distinct]  · aliases: soft-prompts, soft prompt, soft prompts
软提示是一种可学习的连续向量提示，以编码后的向量形式输入给语言模型，而非直接使用人类可读文本。它通过优化少量提示参数来引导模型完成特定任务，通常不需要改动模型主体的全部参数。必要时，软提示还可将额外结构信息（如图的拓扑信息）以向量形式注入模型，从而影响模型的推理与输出。  · merged: soft prompts

### long-context language model  [2 docs, x5] [judged-distinct]  · aliases: long-context models, long-context language models, extended-context language model, extended-context model, long-context large language model
一种能够在单次提示中接收并处理显著长于标准模型的输入上下文的语言模型，通常通过扩展上下文窗口以容纳更多标记。它能更充分利用提示或文档中的周边信息进行条件建模，用于跨较长文本的推理、信息检索或其他文本理解任务；在某些场景下，足够长的上下文可减少对外部检索的依赖。代价是这类模型往往计算成本更高，且上下文更长并不必然带来更好的相关信息识别与利用。  · merged: extended-context language model, extended-context model, long-context large language model

### comprehensiveness  [2 docs, x5] [new]
A quality of an answer or explanation that reflects how fully it covers the relevant aspects of a question. More comprehensive responses include more important details and leave fewer major gaps.

### ego-graph  [2 docs, x5] [new]  · aliases: ego-graphs, local subgraph
An ego-graph is a graph neighborhood centered on one or more focal (ego) elements, including nearby nodes and the edges among or connecting them. It provides localized relational context around entities or retrieved items. Ego-graphs are often used as candidate structures in graph-based retrieval to augment information with context from the surrounding subgraph.  · merged: local subgraph

### chunking  [2 docs, x5] [judged-distinct]  · aliases: document chunking, Text chunking
Chunking is a text preprocessing technique that splits a large document or corpus into smaller segments for indexing and retrieval. It makes it easier to compare, rank, and retrieve relevant portions of documents. Because each segment may be treated independently, chunking can reduce access to surrounding context and affect how well meaning is captured.  · merged: document chunking, Text chunking

### 向量数据库  [2 docs, x5] [judged-distinct]  · aliases: vector database
一种专门存储和检索向量表示（embedding）的数据库系统，用于对项目进行相似性匹配而非精确文本匹配。它通过计算向量之间的相似度并执行近邻/相似度检索，快速找到与查询向量最接近的候选项。常见应用包括对文本片段等内容进行基于向量的检索与排序。  · merged: vector database

### Self-RAG  [2 docs, x5] [judged-distinct]  · aliases: Self-reflective Retrieval Augmented Generation, adaptive RAG
Self-RAG is a retrieval-augmented generation approach that improves answer quality by combining external information retrieval with self-reflection. It uses reflection signals to evaluate and refine its generated response and adaptively adjusts retrieval and generation behavior to the task and query difficulty, selecting more appropriate retrieval strategies while maintaining factuality.  · merged: Self-reflective Retrieval Augmented Generation, adaptive RAG

### long-range dependencies  [2 docs, x4] [new]  · aliases: long-distance dependency
Long-range dependencies are relationships between elements in a sequence that are separated by a large distance in position (e.g., far apart in text or structure). Modeling them is essential for capturing connections that are not locally apparent. They are typically hard to learn when the relevant information must propagate through many intermediate computational steps.  · merged: long-distance dependency

### left-to-right language modeling objective  [2 docs, x4] [new]  · aliases: left-to-right language modeling, autoregressive language modeling, autoregressive log-likelihood
A training objective for autoregressive language models that maximizes the log-likelihood of a sequence by predicting each token from the tokens that precede it. Specifically, the model learns next-token distributions by assigning high probability to every observed token conditioned on its previous context.  · merged: left-to-right language modeling, autoregressive language modeling, autoregressive log-likelihood

### denoising autoencoder  [2 docs, x4] [new]  · aliases: denoising autoencoder-derived objectives, denoising auto-encoder
A denoising autoencoder is a model trained to reconstruct original data from a corrupted version of the input by learning to recover the full underlying signal. By introducing noise and optimizing reconstruction, it learns representations that are robust to corruption and capture the dominant structure of the data rather than surface artifacts.  · merged: denoising auto-encoder

### Transformer 编码器  [2 docs, x4] [judged-distinct]  · aliases: Transformer encoder
一种基于 Transformer 的神经网络编码器结构，由多层堆叠的 Transformer 块组成，用于将输入序列转换为上下文相关的表示。它通过在全序列范围内进行双向自注意力建模依赖关系，使得每个位置的表示能够同时受其左侧与右侧上下文影响。  · merged: Transformer encoder

### [CLS] representation  [2 docs, x4] [judged-distinct]  · aliases: CLS representation, first input token representation, pooled representation, BERTCLS
The pooled hidden vector corresponding to the initial special classification token ([CLS]) in BERT-style Transformer inputs. It provides a fixed-size summary of the entire token sequence and is commonly used as a sequence-level embedding for downstream tasks such as classification or retrieval.  · merged: pooled representation, BERTCLS

### BERT 预训练  [2 docs, x4] [judged-distinct]  · aliases: BERT pretraining, BERT pre-training, BERT-style pretraining
BERT 预训练是一种基于大规模文本的预训练范式，用于学习通用的双向语言表示，通常在未标注语料上训练 Transformer。训练时常采用掩码语言建模等目标，使模型根据上下文预测被遮蔽的词，从而获得更具语义理解能力的表示。预训练完成后，通常将其作为初始化权重在下游自然语言处理任务上进行微调。  · merged: BERT pre-training, BERT-style pretraining

### RACE  [2 docs, x4] [new]
一个阅读理解基准数据集，通常以多项选择题形式评测模型对文章内容的理解能力。它被用来衡量系统在复杂推理和篇章理解任务上的表现。

### overfitting  [2 docs, x4] [new]
A failure mode in which a model fits the training data too closely and performs poorly on unseen data. It is commonly indicated by very low training loss together with substantially worse validation performance.

### non-embedding parameters  [2 docs, x4] [new]  · aliases: N, non-embedding parameter count
Non-embedding parameters are the trainable model weights excluding the embedding tables. They quantify the parameter count (and capacity) attributable to the main network core—such as the Transformer layers—separating it from vocabulary and input embedding contributions.  · merged: non-embedding parameter count

### forward pass  [2 docs, x4] [new]  · aliases: forward-pass, 前向传播
前向传播是神经网络中从输入经过各层计算并得到输出预测的推理过程，不涉及参数更新。对于提示式任务，模型在测试/推理阶段只需执行前向传播即可完成任务，并在语言模型中包含由上下文驱动的注意力与前馈等必要计算以生成输出。  · merged: forward-pass, 前向传播

### 内积  [2 docs, x4] [judged-distinct]  · aliases: inner products, 点积, 点积相似度
内积是一种用于衡量两个向量相似度/相关性的度量，通常通过计算对应分量乘积的和（点积）得到。点积越大，往往表示两者的表示越接近或相关性越强。它常被用作检索与排序中的匹配分数，并可用于计算问题向量与段落（或文档）向量之间的相对相似度。  · merged: 点积, 点积相似度

### hard negative passage  [2 docs, x4] [judged-distinct]  · aliases: hard negative passages, hard negative, hard negatives, informative negative
A hard negative passage is a negative training example that is semantically or lexically very similar to the query, yet does not contain the correct answer. Because it closely resembles true positives, it forces a model to learn finer distinctions between relevant and misleading passages, providing stronger and more informative training signals than easy negatives and helping dense retrieval training converge effectively.  · merged: hard negative, hard negatives, informative negative

### training distribution  [2 docs, x4] [judged-distinct]
模型在训练阶段所看到的数据分布。模型的泛化能力通常会受到它所学到的训练分布影响，当训练分布与测试或真实使用环境不一致时，性能可能显著下降。

### 零样本学习  [2 docs, x4] [judged-distinct]  · aliases: zero-shot learning, 零样本设置, 零样本基准
零样本学习是一种评测设置：模型在测试阶段不进行针对特定任务的梯度更新，也不在提示中提供该任务的示例。模型仅依据自然语言指令或其预训练知识来完成回答或预测，从而评估其在缺少额外任务适配条件下的泛化能力与直接迁移表现。  · merged: 零样本设置, 零样本基准

### CoQA  [2 docs, x4] [judged-distinct]
一个用于评估开放域对话式阅读理解的问答数据集。它要求模型在对话上下文中回答与文章内容相关的问题。

### closed-book setting  [2 docs, x4] [new]
An evaluation setting in which a model must answer questions without access to external documents or retrieval at inference time. Performance in this setting reflects what the model has stored in its parameters rather than what it can look up.

### contrastive learning  [2 docs, x4] [judged-distinct]  · aliases: contrastive representation learning
Contrastive learning is a representation learning strategy that trains models to pull related examples together and push unrelated examples farther apart. It typically uses positive and negative pairs (or sets) to shape the embedding space, often improving performance in retrieval and other similarity-based tasks.  · merged: contrastive representation learning

### Prompt optimization  [2 docs, x4] [judged-distinct]  · aliases: optimizing some forms of the input layer activations, prompt tuning
Prompt optimization is a parameter-efficient adaptation approach that improves a language model by modifying or learning the input prompts rather than updating most of the model’s core parameters. It aims to steer model behavior to elicit better task performance while keeping the base network largely unchanged.  · merged: prompt tuning

### Contriever  [2 docs, x4] [judged-distinct]
Contriever是一种用于检索任务的密集表示模型。它采用双编码器式的表示学习方法，为后续的检索增强系统提供相关文档检索能力。

### distillation  [2 docs, x4] [new]  · aliases: knowledge distillation
一种模型压缩与知识迁移方法：较小的学生模型通过学习较大教师模型的输出、评分或中间表示来模仿其行为。它用于将教师模型提供的“监督信号”传递给学生模型，从而在标注稀缺或缺少直接标注时提升学生模型的性能与效率。  · merged: knowledge distillation

### Kullback-Leibler divergence  [2 docs, x4] [new]  · aliases: KL divergence, KL散度, KL-divergence
Kullback–Leibler散度（KL散度）是一种衡量两个概率分布差异的非对称散度度量。它用于将一个分布（如模型产生的预测分布）对齐到另一个目标分布，作为训练中的损失或优化目标。KL散度为零当且仅当两分布一致，数值越大表示差异越大。  · merged: KL散度, KL-divergence

### 多层感知机  [2 docs, x4] [judged-distinct]  · aliases: MLP, multi-layer perceptron, multilayer perceptron
多层感知机（MLP）是一种由多个全连接层堆叠而成的前馈神经网络，包含输入层、一个或多个隐藏层和输出层。它通过层间非线性变换学习复杂的非线性映射，可将输入表示转换为标量、向量或其他特征，应用于分类、回归等任务，必要时也可用于门控控制等场景。  · merged: multilayer perceptron

### instruction tuning  [2 docs, x4] [judged-distinct]  · aliases: instruction fine-tuning
Instruction tuning is a fine-tuning method that trains a language model on instruction-following examples, typically reformatted from multi-task data into natural-language prompts. It aims to improve the model’s ability to understand and follow task specifications and respond appropriately to new, unseen prompts.  · merged: instruction fine-tuning

### 关系  [2 docs, x4] [new]  · aliases: relationships, relationship
实体之间可抽取的语义连接，用于刻画它们的关联或交互方式。关系通常以图结构中的边来表示，并与实体节点共同构成文档或知识系统中的结构化信息。  · merged: relationship

### diversity  [2 docs, x4] [new]
A quality of an answer that reflects the variety and richness of perspectives, ideas, or insights it provides. More diverse responses explore multiple angles instead of repeating a single line of reasoning.

### empowerment  [2 docs, x4] [new]
A quality of an answer that helps a reader understand a topic well enough to make informed judgments. It reflects how effectively the response supports interpretation, confidence, and decision-making.

### graph context-aware generation  [2 docs, x4] [judged-distinct]  · aliases: Textual Graph Augmented Generation, 图增强生成
图上下文感知生成是一种将从图结构中获得的关系知识融入大语言模型生成过程的方法。通过以结构化的拓扑及节点/边语义进行条件化，帮助模型更好地建模关系上下文，从而提升事实性与推理能力，尤其适用于需要多跳关系理解与推断的任务。  · merged: Textual Graph Augmented Generation, 图增强生成

### 编码器  [2 docs, x3] [judged-distinct]
编码器是编码器-解码器结构中的前半部分，负责把输入符号序列转换为一组连续表示。它为后续的解码过程提供语义和结构信息。

### 掩码自注意力  [2 docs, x3] [judged-distinct]  · aliases: masked self-attention, 受限自注意力, constrained self-attention
掩码自注意力是一种在自注意力计算中限制注意力可见范围的机制。通过对注意力权重进行屏蔽，使每个位置只能关注允许的上下文（通常是其左侧历史），从而防止使用未来信息并支持自回归预测的因果性。  · merged: 受限自注意力, constrained self-attention

### query  [2 docs, x3] [new]  · aliases: queries
A query is a learned vector representation in an attention mechanism that represents what information is being sought. It is compared with keys to produce attention weights, which determine how strongly different values are attended to for retrieval.  · merged: queries

### restricted self-attention  [2 docs, x3] [judged-distinct]  · aliases: Self-Attention (restricted), locally banded sparse attention
Restricted self-attention is a sparse form of self-attention where each position attends only to a local neighborhood (e.g., a band) of neighboring tokens. This reduces per-layer computation compared with unrestricted self-attention while still modeling local context. The effective maximum dependency/path length grows as the sequence length increases relative to the neighborhood size.  · merged: locally banded sparse attention

### 命名实体识别  [2 docs, x3] [new]  · aliases: NER, named entity recognition, 实体识别
命名实体识别（NER）是自然语言处理任务，旨在从文本中识别并分类专有名词或可指称对象（如人名、地名、组织名等），并将其在文本中定位出来。它通常以序列标注的形式输出实体边界与类别，作为后续信息抽取与结构化表示的基础。  · merged: named entity recognition, 实体识别

### SQuAD v2.0  [2 docs, x3] [judged-distinct]  · aliases: Stanford Question Answering Dataset v2.0
一个扩展的阅读理解问答数据集，在可回答问题之外加入了不可回答问题。它要求模型不仅抽取答案，还要判断问题是否无法由上下文回答。

### fine-tuning based representation model  [2 docs, x3] [judged-distinct]  · aliases: fine-tuning model, fine-tuned model
基于预训练模型的表示模型，通过在通用语言数据上预训练后，再针对特定任务或领域进行进一步训练（微调）以适配下游需求。该方法复用既有的表示能力，通常无需为每个任务重新设计专门架构，并在特定基准上表现良好，但其泛化能力可能会受微调数据分布的限制。  · merged: fine-tuned model

### document encoder  [2 docs, x3] [judged-distinct]  · aliases: document encoders
A model that converts an entire document into a representation suitable for prediction or classification. Document encoders can be pre-trained on unlabeled text so that they transfer better to downstream tasks.

### Transformer 块  [2 docs, x3] [judged-distinct]  · aliases: Transformer block, Transformer layer
Transformer 块是 Transformer 模型中的可重复处理单元，通过注意力机制与前馈网络对隐藏表示进行变换。将多个这样的块堆叠起来即可形成完整的编码器或解码器网络，从而逐步构建更高层次的上下文表示。  · merged: Transformer block, Transformer layer

### 层数  [2 docs, x3] [new]  · aliases: L, network depth, number of layers
神经网络中按顺序堆叠的层的数量，用于衡量模型深度。层数越多，模型通常能通过更多级非线性变换构造更复杂的表示；同时计算成本和参数预算往往随之增加，除非相应调整其他网络维度（如宽度或注意力头数）。  · merged: network depth, number of layers

### F1 score  [2 docs, x3] [new]  · aliases: F1
An evaluation metric that combines precision and recall into a single harmonic mean. It is commonly used for tasks where both false positives and false negatives matter.

### data augmentation  [2 docs, x3] [new]
Data augmentation is the practice of expanding training data by adding additional examples or related datasets to improve generalization. In question answering, it can include pretraining or intermediate training on another labeled dataset before the final task.

### 自回归语言模型  [2 docs, x3] [judged-distinct]  · aliases: autoregressive LM, autoregressive language model
一种按照从左到右的顺序预测下一个标记的语言模型。它根据前文上下文估计当前目标标记的条件概率，并以此生成序列。

### key-value pair  [2 docs, x3] [new]
A paired storage unit consisting of a context-derived key and its associated target word as the value. Such pairs allow retrieval systems to map similar contexts to likely next words.

### n-gram language model  [2 docs, x3] [judged-distinct]  · aliases: n-gram LM, n-gram语言模型, n-gram model
n-gram 语言模型是一种固定上下文长度的统计语言模型，只根据前面 n 个词（或标记）的历史来预测下一个词（或标记）的概率。它通过建模局部的 n-gram 共现规律来进行语言建模，常见形式包括二元语法模型（n=2）和三元语法模型（n=3）。  · merged: n-gram语言模型, n-gram model

### context length  [2 docs, x3] [judged-distinct]  · aliases: maximum context length, input context length
Context length is the maximum number of tokens (or symbols, depending on the model) that can be included in a single input sequence the model can use for generation. Providing a longer context allows more surrounding information to be considered at once, but it may also make it harder to reliably focus on the most relevant parts.  · merged: maximum context length, input context length

### world knowledge  [2 docs, x3] [new]
General factual knowledge about entities, facts, and relationships in the world. In language models, it may be stored implicitly in learned parameters or accessed explicitly through retrieval.

### stochastic gradient descent  [2 docs, x3] [judged-distinct]  · aliases: SGD
An iterative optimization method that updates model parameters using noisy gradient estimates computed from training examples or mini-batches. It is widely used to maximize likelihood objectives in neural network training.

### MIPS index  [2 docs, x3] [new]  · aliases: maximum inner product search index, MIPS
An index built for maximum inner product search over document representations. It supports retrieving documents with the largest inner products with a query representation, making it useful for fast top-k document selection in retrieval systems.

### Google Suggest API  [2 docs, x3] [new]
An API that provides query suggestions related to a given search input. It can be used to expand an initial question into a larger set of related questions.

### sparse vector  [2 docs, x3] [judged-distinct]  · aliases: sparse representations, sparse representation
A sparse vector representation contains mostly zero entries and only a small number of nonzero (active) features. It is commonly used to encode term presence or weighted term statistics for information retrieval, where each dimension corresponds to a vocabulary item. Because only a few features are active, matching between queries and documents can be efficient and the resulting features remain interpretable.  · merged: sparse representation

### extractive QA  [2 docs, x3] [judged-distinct]  · aliases: extractive question answering, extractive downstream task, extractive QA paradigm
Extractive QA is a question answering setting in which the answer is restricted to a span taken from one or more passages. The system locates the relevant evidence in the provided or retrieved text and returns the corresponding substring, rather than generating a free-form response.  · merged: extractive downstream task, extractive QA paradigm

### text passage  [2 docs, x3] [judged-distinct]  · aliases: passage
A contiguous span of text used as a retrieval unit in question answering and information retrieval. Passages are typically smaller than full documents so that a model can match questions to more precise evidence, and the text is encoded and indexed to retrieve relevant passages for a query.  · merged: passage

### 词向量  [2 docs, x3] [judged-distinct]  · aliases: word vectors, 词的分布式表示, 分布式词表示
词向量是一种将词映射到低维连续向量空间的表示方法，通过稠密可学习的向量刻画词语的语义与用法。语义或上下文/句法相近的词通常对应相似的向量，便于神经网络建模词与词之间的相似性与组合关系，并提升对未见词的泛化能力。词向量通常由神经模型在大规模语料上学习，作为后续任务的输入特征。  · merged: 词的分布式表示, 分布式词表示

### 预训练加微调范式  [2 docs, x3] [judged-distinct]  · aliases: pre-training plus fine-tuning paradigm, 预训练和微调范式
预训练加微调范式是一种两阶段的语言模型训练流程：先在大规模数据上进行通用预训练以学习广泛知识与表示，再在特定任务的数据分布上进行微调以提升任务适配与性能。该范式使同一个预训练语言模型能够迁移到多种下游任务，并在通用能力与具体任务表现之间取得平衡；同时，若微调分布过窄，模型可能过度专门化而降低泛化能力。  · merged: pre-training plus fine-tuning paradigm, 预训练和微调范式

### model parallelism  [2 docs, x3] [judged-distinct]
Model parallelism is a distributed training technique that splits a model across multiple processors or devices. It allows very large models to be trained when a single device cannot hold the full set of parameters.

### Approximate nearest neighbor Negative Contrastive Learning  [2 docs, x3] [judged-distinct]  · aliases: ANCE, Approximate nearest neighbor Negative Contrastive Estimation
Approximate nearest neighbor negative contrastive learning is a contrastive representation learning method for dense retrieval that mines hard negative examples using an approximate nearest neighbor index over a large corpus. Negatives are sampled by retrieving approximate nearest neighbors with the current model, yielding more globally relevant and difficult negatives than random or in-batch sampling. This improves optimization and increases retrieval quality by exposing the model to more informative contrastive signals.  · merged: Approximate nearest neighbor Negative Contrastive Estimation

### bag-of-words  [2 docs, x3] [judged-distinct]  · aliases: Bag of words
A text representation that models a document as an unordered multiset of terms, typically ignoring syntax and word order. It captures content through term presence and often term frequency, supporting efficient lexical matching in tasks such as sparse retrieval.  · merged: Bag of words

### 密集检索  [2 docs, x3] [judged-distinct]  · aliases: dense retrieval, DR, vector-based search
密集检索是一种检索范式，将查询与候选文档（或图元素）用向量表示，并依据向量相似度进行相似性搜索与排序，以找到与查询语义相关的结果。它通常借助神经编码器学习查询与文档的语义向量表示，从而在大规模语料中高效检索。  · merged: vector-based search

### knowledge retrieval task  [2 docs, x3] [judged-distinct]  · aliases: knowledge retrieval tasks, Knowledge retrieval
A knowledge retrieval task is one in which a system locates relevant information from a stored corpus or knowledge graph in response to a query. The goal is to select knowledge items that can support a correct answer, decision, or subsequent generation, often serving as the grounding step for bringing external information into a workflow.  · merged: Knowledge retrieval

### temperature  [2 docs, x3] [new]  · aliases: temperature hyper-parameter
Temperature is a sampling parameter that adjusts the sharpness (peakiness) of the probability distribution used for token selection. Lower temperatures make the distribution more concentrated and outputs more deterministic, while higher temperatures flatten it to increase variability.   · merged: temperature hyper-parameter

### PaLM  [2 docs, x3] [judged-distinct]  · aliases: PaLM 540B
A large language model family developed by Google that is designed to perform a wide range of language and reasoning tasks. Different parameter scales of the model can be evaluated on benchmarks to measure capability.

### toxic text  [2 docs, x3] [new]  · aliases: harmful content, toxic content
Toxic text is language that is abusive, offensive, misleading, or otherwise harmful to people or groups. In the context of language models, it refers to undesirable outputs such as profanity, harassment, and slurs that safety mechanisms aim to prevent or reduce.  · merged: harmful content, toxic content

### alignment  [2 docs, x3] [new]  · aliases: model alignment
Alignment is the problem of making an artificial intelligence system behave in accordance with human values, intentions, or goals. For language models, it typically involves training and other techniques to reduce undesirable behavior and steer outputs toward helpful, instruction-following, and safe responses.  · merged: model alignment

### knowledge-intensive tasks  [2 docs, x3] [judged-distinct]  · aliases: 知识密集型任务, knowledge-intensive task
知识密集型任务是指需要大量外部事实信息或已有记忆才能高质量完成的任务。此类任务通常依赖准确的信息检索与“落地”支撑，以保证生成结果的可靠性与可验证性。常见例子包括问答与事实核查。  · merged: 知识密集型任务, knowledge-intensive task

### average pooling  [2 docs, x3] [new]  · aliases: 均值池化
Mean (average) pooling is an aggregation operation that averages a set of vectors into a single vector representation. It is used to combine token-, node-, or edge-level embeddings into a fixed-size summary embedding from a variable-length sequence.  · merged: 均值池化

### accuracy  [2 docs, x3] [judged-distinct]
An evaluation metric that measures how often a model's predicted answer is correct. In question answering, it is commonly computed by checking whether the model's output matches the expected answer.

### 层次化索引  [2 docs, x3] [judged-distinct]  · aliases: hierarchical indexing, 树状索引方法
层次化索引是一种以树形/层级结构组织内容并生成索引或摘要的检索与索引结构，通常通过父子关系连接不同层级。它从细粒度信息逐层汇总，在缩小单次检索范围、加速遍历与查找的同时，有助于降低检索错误并提升结果的稳健性。  · merged: hierarchical indexing, 树状索引方法

### 基于图的社区发现  [2 docs, x3] [new]  · aliases: graph-based community detection, 社区检测, Community Detection Algorithm
基于图的社区发现是一类图分析方法，通过识别并划分图中的节点，使得同一社区内节点之间的连接更为密集，而不同社区之间连接相对稀疏。该方法通常利用节点、边及其属性刻画社区结构，并将社区作为中间结果用于下游任务，如信息聚合与查询支持。  · merged: 社区检测, Community Detection Algorithm

### Text Chunk  [2 docs, x3] [judged-distinct]  · aliases: text chunks, chunk
A text chunk is a contiguous segment of a longer document produced by splitting source text into smaller units. It is used as an independent processing or retrieval unit—often indexed and searched separately—to make handling large documents practical for downstream tasks.  · merged: chunk

### multi-hop reasoning  [2 docs, x3] [judged-distinct]  · aliases: multi-step reasoning
Multi-hop (multi-step) reasoning is a reasoning process that reaches an answer by chaining together multiple intermediate inference steps. It is used when relevant evidence is distributed across several linked items or when the relationship between two ideas must be inferred through intermediate connections rather than from a single direct match.  · merged: multi-step reasoning

### contextual awareness  [2 docs, x3] [new]  · aliases: context awareness
The ability of a system to take surrounding information, relationships, and structural cues into account when selecting or producing an answer. It helps avoid responses that are correct in isolation but incomplete in context, improving retrieval and interpretation to better match the user’s intent and task context.  · merged: context awareness

### Generation Component  [2 docs, x3] [judged-distinct]  · aliases: Generation module, generator mechanism
The part of a retrieval-augmented generation system that generates the final natural-language output from the user query and retrieved (or otherwise provided) information. It uses a language model to condition on the available evidence and synthesize it into a coherent, contextually appropriate, human-like response.  · merged: Generation module, generator mechanism

### RQ-RAG  [2 docs, x3] [judged-distinct]  · aliases: self-querying RAG
RQ-RAG is a retrieval-augmented generation approach that improves retrieval accuracy by automatically decomposing and reformulating complex queries into multiple, more targeted sub-queries. It uses rewriting and disambiguation to better align structured or multi-part questions with relevant knowledge sources before generating the final answer.  · merged: self-querying RAG

### 位置表示  [2 docs, x2] [judged-distinct]  · aliases: parameter-free position representation, 位置嵌入
位置表示是一种在序列模型中注入位置信息的表示方式，用以弥补注意力机制缺乏显式顺序感知能力的不足。它通常通过可学习的位置信号（如位置嵌入）使模型区分不同位置上的元素，从而获得对词元顺序及其相对位置的感知能力。  · merged: 位置嵌入

### 隐藏状态  [2 docs, x2] [judged-distinct]  · aliases: hidden state, ht, 上下文状态
隐藏状态是序列模型在处理序列时为每个时间步维护的内部表示，用于汇总并承载到当前为止的历史信息。它在相邻时间步之间传递，使模型能够在当前位置生成时结合上下文、形成更具上下文相关性的表示。  · merged: 上下文状态

### linear projection  [2 docs, x2] [new]
A linear projection is a transformation that maps vectors into a different-dimensional vector space using a linear function. In neural network models, it is used to convert inputs such as queries, keys, and values into representations of a desired size before further computation.

### encoder-decoder attention  [2 docs, x2] [new]  · aliases: decoder cross-attention
An attention mechanism in which a decoder attends from its output positions to encoder-produced representations. It conditions sequence generation on external inputs (e.g., documents) by letting each decoder position access information from all encoder positions via the encoder keys and values.  · merged: decoder cross-attention

### masking  [2 docs, x2] [new]  · aliases: attention masking
Masking is a constraint in attention mechanisms that limits which positions a token may attend to, thereby controlling information flow in transformer models. In practice, disallowed attention scores are set to negative infinity before the softmax so those positions contribute zero weight to the attention output. This can enforce directional attention patterns (e.g., preventing bidirectional access) when desired.  · merged: attention masking

### encoder  [2 docs, x2] [judged-distinct]
The component of a sequence model that transforms the input sequence into internal representations. Its outputs can be attended to by the decoder through encoder-decoder attention.

### decoder  [2 docs, x2] [judged-distinct]
The component of a sequence model that generates output representations one position at a time. It uses self-attention over previous positions and can attend to encoder outputs through encoder-decoder attention.

### Inner-Layer Dimension  [2 docs, x2] [judged-distinct]  · aliases: dff, feedforward dimension
Inner-layer dimension is the size of the intermediate hidden representation within the feed-forward portion of a neural network, such as the position-wise sublayer in a Transformer. It determines the width of the network’s expansion between the input and output projections and directly impacts the total number of parameters.  · merged: feedforward dimension

### learning rate schedule  [2 docs, x2] [new]  · aliases: learning rate
A rule that changes the learning rate over the course of training. Schedules are used to stabilize optimization and improve convergence by varying update size over time.

### warmup steps  [2 docs, x2] [new]  · aliases: warmup_steps, warm-up
warmup steps 是一种学习率调度策略：在训练初期先从较小的学习率开始，逐步升高到预设的目标学习率（或学习率上限）。这样可以在模型参数尚未充分适配时抑制不稳定的更新，减少训练开始阶段的震荡，从而使优化过程更稳定。  · merged: warm-up

### beam search  [2 docs, x2] [new]
A heuristic decoding algorithm that keeps the top-scoring partial hypotheses at each step while generating a sequence. It approximates best-sequence search more efficiently than exhaustive search.

### 自然语言处理任务  [2 docs, x2] [new]  · aliases: NLP任务
一类让计算机理解、分析或生成自然语言的任务集合。典型任务包括句子级推断、问答、命名实体识别和文本改写等。

### 语言推断  [2 docs, x2] [judged-distinct]  · aliases: 自然语言推理, 自然语言推断, 文本蕴含
一种自然语言推理任务，判断一个文本是否能够推出另一个文本，或在给定句对中判断它们之间的蕴含、矛盾或中立关系。该任务用于评估模型对句子/文本整体语义的理解及其语义推理能力。  · merged: 文本蕴含

### word embeddings  [2 docs, x2] [judged-distinct]  · aliases: embeddings, Word embedding
Word embeddings are learned continuous vector representations of tokens that map discrete vocabulary items into a low-dimensional space. They capture semantic and syntactic information so that similar words have similar vectors. These embeddings are used as inputs or features for neural language models and other downstream natural language processing tasks.  · merged: Word embedding

### 注意力头数  [2 docs, x2] [judged-distinct]  · aliases: A, number of attention heads
多头自注意力中并行注意力头的数量，用于将输入表示分割到不同表示子空间以捕捉多样的依赖关系。调整注意力头数会改变模型的注意力容量与表征能力，同时通常可在保持整体参数规模可控的情况下实现能力变化。  · merged: number of attention heads

### sentence pair classification  [2 docs, x2] [judged-distinct]  · aliases: sentence pairs, sentence-pair classification
Sentence pair classification is a natural language understanding task in which a model takes two sentences and predicts a label describing their relationship. It is used to evaluate how well a system recognizes relations between pieces of text, such as similarity, entailment, or contradiction.  · merged: sentence-pair classification

### QQP  [2 docs, x2] [new]  · aliases: Quora Question Pairs
A paraphrase identification task that asks whether two questions are semantically equivalent. It is used to evaluate sentence-pair similarity and duplicate-question detection.

### CoLA  [2 docs, x2] [new]  · aliases: Corpus of Linguistic Acceptability
A linguistic acceptability task that judges whether a sentence is grammatically acceptable in English. It is used to test syntactic well-formedness judgments.

### STS-B  [2 docs, x2] [new]  · aliases: Semantic Textual Similarity Benchmark
A semantic textual similarity task that measures how similar two sentences are in meaning. Systems are evaluated by how well their predicted similarity scores match human judgments.

### MRPC  [2 docs, x2] [judged-distinct]  · aliases: Microsoft Research Paraphrase Corpus
A paraphrase detection task that determines whether two sentences are paraphrases of one another. It is used to assess sentence-pair semantic equivalence.

### RTE  [2 docs, x2] [new]  · aliases: Recognizing Textual Entailment
A text entailment task that asks whether one sentence entails another. It is a standard benchmark for recognizing inferential relationships between sentence pairs.

### 分布式数据并行训练  [2 docs, x2] [judged-distinct]  · aliases: distributed data parallel training, DDP, data parallelism
分布式数据并行训练是一种并行训练方式，将训练数据的不同批次分配到多个计算单元上，各自计算梯度并对同一个模型参数进行同步更新。它常用于提升大规模训练的吞吐量，但训练效率会受到参数同步与通信开销以及批大小选择的影响。  · merged: data parallelism

### pretraining data  [2 docs, x2] [new]  · aliases: training data, pretraining dataset
The corpus or corpora used to train a model before task-specific fine-tuning or adaptation. This large pretraining dataset exposes the model to a broad distribution of language patterns and associations, shaping what it learns during pretraining; the choice and size of the data strongly influence the model’s behavior.  · merged: pretraining dataset

### reversible tokenizer  [2 docs, x2] [new]  · aliases: reversible tokenization
A reversible tokenizer maps text into a sequence of tokens such that the original text can be deterministically and exactly recovered from the tokens. This enables token-based modeling and training while preserving recoverability of the source text representation.  · merged: reversible tokenization

### backward pass  [2 docs, x2] [judged-distinct]
A backward pass is the computation that propagates gradients through a neural network to update parameters. It is the core operation used to perform gradient-based training.

### syntactic information  [2 docs, x2] [new]  · aliases: language syntax
Syntactic information is information about the grammatical structure of language: how words and phrases are combined into well-formed sentences, including properties like word order and dependency relations. Language models use syntactic information to predict outputs that are grammatically well-formed in context, and it can be learned as a form of linguistic knowledge from text.  · merged: language syntax

### latent variable  [2 docs, x2] [new]
A latent variable is an unobserved variable introduced in a probabilistic model to explain observed data. In retrieval-augmented generation, it can represent which document was selected to support the output, with probabilities summed over all possible values.

### dense inner product model  [2 docs, x2] [new]  · aliases: dot-product retrieval
A dense inner product model is a retrieval model that represents queries and documents as dense vector representations and scores each query–document pair by the dot product (inner product) of their vectors. The resulting scores are often normalized with a softmax to form a retrieval distribution. This simple dense scoring function supports efficient ranking in embedding-based systems.  · merged: dot-product retrieval

### 答案片段  [2 docs, x2] [judged-distinct]  · aliases: answer span
文档中与目标答案对应的连续词元序列。问答系统常把答案建模为可从候选文档中抽取的一个跨度，而不是自由生成的任意字符串。

### document embedding  [2 docs, x2] [judged-distinct]
A vector representation of a document used for similarity-based retrieval or scoring. Document embeddings are compared with input embeddings to rank documents by relevance.

### re-embedding  [2 docs, x2] [judged-distinct]  · aliases: full index update
The process of recomputing vector embeddings for documents in an index using the current model parameters (e.g., an updated retriever) so that stored representations remain consistent with the updated retrieval model. Re-embedding is used when previously stored embeddings may be stale, such as during training or model updates, but it can be computationally expensive for large corpora.  · merged: full index update

### Embedinput  [2 docs, x2] [new]  · aliases: query encoder
Embedinput 是一种参数化编码器，用于将输入查询编码成向量表示，并将其映射到与文档编码器相同或可比较的检索嵌入空间中。该表示作为查询侧表示供检索函数使用，从而依据当前查询选择相关文档，并可在微调过程中继续更新。  · merged: query encoder

### exact string matching  [2 docs, x2] [new]  · aliases: exact string matches
A retrieval behavior in which a model relies on literal overlap between two text strings rather than broader semantic relevance. It can improve surface-form matching but misses paraphrases and other nonidentical expressions of relatedness.

### Generation-based Open-QA  [2 docs, x2] [judged-distinct]  · aliases: generative open question answering, Closed-Book QA
Generation-based Open-QA is an open-domain question answering approach that formulates answering as sequence generation. Given a question, a model generates the answer token by token directly from its parameters, without retrieving external documents.  · merged: Closed-Book QA

### Transformer sequence-to-sequence model  [2 docs, x2] [judged-distinct]  · aliases: Transformer Seq2Seq, seq2seq transformer
A Transformer sequence-to-sequence model is an encoder–decoder architecture based on self-attention that maps an input sequence to an output sequence. It is widely used for conditional generation tasks such as summarization, translation, and question answering.  · merged: seq2seq transformer

### PathRetriever  [2 docs, x2] [judged-distinct]  · aliases: Path Retriever
PathRetriever is a retrieval method that finds supporting passages by exploring paths through a structured representation of a document graph. By following chains of related passages, it aims to surface evidence that may be missed by single-hop retrieval and to support multi-hop reasoning.  · merged: Path Retriever

### 负样本  [2 docs, x2] [judged-distinct]  · aliases: negative example, negative passage
在监督学习或检索任务中，被标记为不相关、错误或不匹配的样本。负样本用于训练模型区分正确对象与干扰对象，并提高排序能力。

### gold passage  [2 docs, x2] [new]  · aliases: gold passages, gold context, gold contexts
与某问题在原始数据集中标注的金标准上下文相匹配的段落，通常作为检索任务中的正例。它们代表用于回答该问题的目标证据文本，强调这些段落包含完成答案所需的信息。  · merged: gold passages

### cross-dataset generalization  [2 docs, x2] [new]  · aliases: Cross-dataset transfer learning
Cross-dataset generalization is the ability of a model trained on one dataset to perform well on a different dataset without additional fine-tuning. It evaluates how robust learned representations and decision behavior are under dataset shift, often reflecting transfer of representations across tasks or domains.  · merged: Cross-dataset transfer learning

### hybrid model  [2 docs, x2] [judged-distinct]
混合模型是同时结合参数化记忆和非参数化记忆的模型架构。它通过把模型内部知识与可检索知识源结合起来，提升可扩展性、可更新性和可解释性。

### Wikipedia dump  [2 docs, x2] [judged-distinct]
A snapshot of Wikipedia used as a large non-parametric knowledge source for retrieval-based systems. The dump is divided into chunks or articles so that documents can be embedded and searched efficiently.

### abstractive question answering  [2 docs, x2] [judged-distinct]  · aliases: generative question answering
Abstractive question answering is a question answering setting in which a system generates an answer as free-form text rather than selecting an exact span from a source document. It synthesizes, paraphrases, or otherwise reformulates information to produce a coherent response, especially when the required answer is not explicitly present as a contiguous span.  · merged: generative question answering

### extractive reader  [2 docs, x2] [judged-distinct]  · aliases: extractive model
An extractive reader is a question answering component that predicts answers by selecting a span or excerpt directly from the input passage(s). Because the answer must be explicitly present in the evidence text, it is limited to extractive outputs and is typically evaluated by the accuracy of the extracted span.  · merged: extractive model

### 抽取式模型  [2 docs, x2] [judged-distinct]  · aliases: extractive model
一种直接从输入上下文中选择或复制答案片段的问答模型。它通常依赖证据中已经显式出现的答案，因此在答案不出现在任何支持文档中时表现受限。

### document posterior  [2 docs, x2] [judged-distinct]  · aliases: document posterior distribution
在给定查询与生成/答案条件下，由语言模型诱导出的文档概率分布。它刻画不同文档相对支持目标输出的可能性，可作为训练或优化检索器时的目标分布。  · merged: document posterior distribution

### news articles  [2 docs, x2] [new]
News articles are journalistic texts that report events, developments, or analysis in a news style. They can be generated by language models and evaluated for realism and human-likeness.

### 预训练语言表示  [2 docs, x2] [judged-distinct]  · aliases: pre-trained language representations, task-agnostic representations
预训练语言表示是在大规模语料上先学习得到的语言表征，能够作为通用输入被迁移到多种下游任务中，从而降低对任务专用特征的依赖。它们通常由模型自动学习以减少人工特征工程需求，同时提升跨任务的复用性。  · merged: task-agnostic representations

### search ranking  [2 docs, x2] [judged-distinct]  · aliases: ranked order
Search ranking is the task of ordering retrieved results so that the most relevant items appear first. In text systems, it arranges documents in ranked order based on their scores or estimated relevance, determining what users see or what later processing stages receive. Ranking can also introduce a bias that earlier results are more likely to be useful or correct.  · merged: ranked order

### Similarity function  [2 docs, x2] [judged-distinct]  · aliases: sim(), vector similarity measure
A similarity function is a mathematical measure of how close two vector representations are. Common examples include cosine similarity and dot product. In dense retrieval, it is used to score and rank candidate items by their semantic similarity to a query.  · merged: vector similarity measure

### Learning to rank  [2 docs, x2] [judged-distinct]  · aliases: LTR, Learning-to-Rank
Learning to rank is a family of supervised machine-learning methods for training models to assign relevance scores to items for ranking tasks. It is commonly used to order items (e.g., retrieved documents) by predicted usefulness to a query, typically optimizing a scoring function so relevant items rank higher than irrelevant ones.  · merged: Learning-to-Rank

### search relevance  [2 docs, x2] [judged-distinct]  · aliases: retrieval quality
Search relevance is the degree to which retrieved documents or passages satisfy an information need expressed by a query. It reflects not only topical match but also the usefulness and trustworthiness of the retrieved content for subsequent tasks, such as informing downstream generation. Higher relevance of retrieval results typically improves reasoning quality, factuality, and overall effectiveness in retrieval-augmented systems.  · merged: retrieval quality

### reinforcement learning  [2 docs, x2] [new]
A learning paradigm in which an agent improves its behavior by receiving rewards or penalties for actions taken in an environment. In retrieval and ranking, it can be used to optimize decision-making over candidate selections.

### language models as knowledge bases  [2 docs, x2] [judged-distinct]  · aliases: parametric language model
将知识与语言规律编码进语言模型参数中的观点，认为大语言模型可把部分事实性信息以参数形式存储。基于这种参数化表示，模型在回答问题时可直接从其内部表征进行预测与生成，从而在无需外部检索的情况下充当类似知识库的功能。该研究关注模型对事实查询的直接回答能力及其从参数表征中检索信息的效果。  · merged: parametric language model

### OpenAI API  [2 docs, x2] [new]
一个提供模型调用接口的应用程序编程接口，用于通过预设提示和参数与语言模型交互。它常被用来获取标准化的模型输出或作为实验默认配置的来源。

### reasoning ability  [2 docs, x2] [new]  · aliases: reasoning abilities
指完成需要多步推导、分析或计算任务的能力，能够通过逻辑或概率等步骤进行信息整合与推理，从而解决问题并得出结论。它通常体现为将问题分解、连接证据并进行推断的表现。  · merged: reasoning abilities

### Codex  [2 docs, x2] [new]
Codex is a language model family specialized for code generation and related text-to-code tasks. It is accessed through model variants such as code-davinci-002 in the OpenAI API.

### bias  [2 docs, x2] [judged-distinct]
A systematic tendency in model outputs to favor certain groups, viewpoints, or associations over others. In language models, bias is often evaluated by checking for uneven or stereotyped behavior across prompts and contexts.

### generalization  [2 docs, x2] [new]  · aliases: generalization performance
Generalization is the ability of a model to apply learned behavior to new, unseen inputs or tasks beyond those encountered during training. Higher generalization performance indicates that the learned patterns—such as retrieval and reasoning strategies—transfer effectively to data and queries outside the training or evaluation set.  · merged: generalization performance

### implicit continuation  [2 docs, x2] [judged-distinct]  · aliases: prompt-based completion
A prompting method in which the intended task is conveyed indirectly by providing the beginning of a text and asking a model to continue it. The model infers what to do from the given context rather than relying on an explicit instruction, generating the desired completion or output directly.  · merged: prompt-based completion

### interpretability  [2 docs, x2] [new]  · aliases: transparency
Transparency is the extent to which a model’s behavior, data use, and decision process can be understood and inspected by humans. It helps users and developers determine why particular outputs were produced and build trust in AI systems. In retrieval-augmented systems, this also involves examining retrieved documents and how they influence outputs.  · merged: transparency

### quadratic complexity  [2 docs, x2] [new]  · aliases: quadratic scaling
一种计算复杂度随输入规模平方增长的性质，表现为计算成本或内存消耗与输入大小的平方成正比。对于较长序列或更大规模数据，处理代价会迅速显著增加。  · merged: quadratic scaling

### training set filtering  [2 docs, x2] [new]  · aliases: 数据过滤
训练集过滤是一种数据清理与筛选技术，用于在模型训练前剔除低质量、噪声、错误或不可靠的训练样本。通过减少可能误导模型学习的内容来提升剩余数据的质量，从而降低噪声并改善模型的学习效果与输出可靠性。  · merged: 数据过滤

### RETRO  [2 docs, x2] [judged-distinct]
RETRO is a retrieval-augmented language model that scales retrieval memory to trillions of tokens and changes the model architecture so that retrieved documents are provided as input. It uses large-scale retrieval to supply external information that helps the model make better predictions.

### natural language processing  [2 docs, x2] [judged-distinct]  · aliases: NLP
A field focused on enabling computers to analyze, understand, generate, and interact using human language. It includes tasks such as translation, question answering, text generation, and information extraction.

### sensemaking task  [2 docs, x2] [judged-distinct]  · aliases: high-level sensemaking task
An analytical information-seeking task that requires integrating evidence across multiple entities and sources to form a coherent global understanding. By reasoning over relationships among people, places, and events (rather than performing local fact lookup), it supports anticipating likely trajectories and acting effectively.  · merged: high-level sensemaking task

### text embeddings  [2 docs, x2] [judged-distinct]  · aliases: embeddings
Numerical representations of text that place semantically similar items near one another in a vector space. They are commonly used to retrieve records by comparing the embedding of a query with the embeddings of candidate records.

### semantic similarity  [2 docs, x2] [judged-distinct]  · aliases: 语义相关性
Semantic similarity is a measure of how closely two texts or representations match in meaning rather than exact wording. It is commonly computed by representing each item as an embedding vector and comparing the vectors with a similarity function such as cosine similarity.  · merged: 语义相关性

### 知识图谱抽取  [2 docs, x2] [new]  · aliases: knowledge graph extraction, 实体和关系抽取
从自然语言文本中识别实体、关系及相关属性，并将其组织为结构化知识图谱的过程。该过程将非结构化语料转换为由节点与边构成的图表示，为后续的图构建、检索与推理提供基础。  · merged: 实体和关系抽取

### 事实锚定  [2 docs, x2] [judged-distinct]  · aliases: factual grounding, Grounding
事实锚定是一种让生成输出建立在明确事实或结构化证据基础上的方法，将生成内容与外部证据或可检索的信息源相联系。通过让模型依据这些可验证的依据进行生成，它提高输出的真实性，并增强可追溯性与一致性，降低脱节风险。  · merged: Grounding

### 社区  [2 docs, x2] [judged-distinct]  · aliases: community, communities
在图中由若干彼此联系更紧密的元素组成的子图或元素集合。社区检测会把图索引划分为这样的组，以支持并行摘要和后续查询处理。

### Chunk Size  [2 docs, x2] [judged-distinct]  · aliases: size of the chunk
Chunk size is the length or amount of text included in each text chunk. It is a design parameter that affects how many processing calls are needed and how much information may be lost or retained within each chunk.

### Entity and Relation Extraction  [2 docs, x2] [new]  · aliases: extract information, extract instances of important entities and the relationships between the entities, Extracting Entities and Relationships
Entity and relation extraction is the process of identifying important entities in text and determining the relationships that connect them. It converts unstructured passages into structured representations, often graph-based, by extracting entity nodes and relationship edges for later analysis or knowledge graph construction.  · merged: Extracting Entities and Relationships

### 全局查询  [2 docs, x2] [judged-distinct]  · aliases: global queries, high-level retrieval
全局查询是面向整个图或数据集的高层次检索与问答过程，旨在获取跨社区、跨主题的整体性答案。它关注更广泛的主题、抽象关系与全局上下文，而非孤立细节；通常依赖跨层级的社区摘要来完成意义理解与推断。  · merged: high-level retrieval

### semantic search  [2 docs, x2] [judged-distinct]  · aliases: SS, Similarity ranking
Semantic search is a retrieval method that ranks text passages by semantic similarity to a query rather than by exact keyword overlap. It typically represents queries and passages with vector embeddings and compares them to find the most meaning-related chunks, often for use as relevant context for downstream tasks such as text generation.  · merged: Similarity ranking

### corpus  [2 docs, x2] [judged-distinct]  · aliases: text corpus
A corpus is a large collection of texts or documents treated as a unified body of source material for analysis, indexing, or model support. In retrieval-based systems, it is the set of documents (and their content) from which relevant passages are searched and retrieved.  · merged: text corpus

### 可扩展性  [2 docs, x2] [new]  · aliases: scalability
系统在数据量、用户量或工作负载增加时，仍能保持性能与资源消耗在可控范围内的能力。它关注的是随着规模扩大，性能下降或成本是否不会成比例恶化。对于知识密集型系统，这也决定了能否高效处理更大规模的信息源。  · merged: scalability

### document summarization  [2 docs, x2] [judged-distinct]  · aliases: Text summarization
A task that produces a shorter version of one or more documents while preserving the main information. It often benefits from retrieval when summaries must be grounded in external evidence, and it can be used in graph-based retrieval systems as compact topic-level representations.  · merged: Text summarization

### FILCO  [2 docs, x2] [new]
A context-filtering method for improving the quality of retrieved information supplied to generative models. It identifies useful context with lexical and information-theoretic techniques and trains filtering models to refine retrieved passages at test time.

### imitative falsehood  [1 docs, x9] [judged-distinct]  · aliases: imitative falsehoods, 模仿性错误
模仿性虚假是一种错误的陈述，语言模型在生成时会模仿训练数据中常见且看似合理的表达模式。它通常并非基于可靠的事实把握，而是对“听起来像真的”内容进行复现，因此尽管与世界事实不符，却可能更难被识别或避免。  · merged: imitative falsehoods, 模仿性错误

### multi-document question answering  [1 docs, x9] [judged-distinct]  · aliases: multi-document QA
一种问答任务，答案需要根据分布在多个文档中的相关信息进行推断，并将跨文档的证据整合后形成最终回答。它用于检验模型在多源、长上下文条件下能否有效检索并利用多份证据，而不仅依赖单一段落。  · merged: multi-document QA

### factuality hallucination  [1 docs, x9] [judged-distinct]  · aliases: 事实性幻觉, 事实捏造, factual fabrication, unverifiability hallucination
事实性幻觉（事实捏造）是指生成内容与客观事实或可核验证据不符的幻觉类型。语言模型可能产出听起来很像“事实”的陈述或细节，但其无法与既有现实知识或可靠信息相对应，因而难以被证实为真。  · merged: 事实性幻觉, 事实捏造, factual fabrication, unverifiability hallucination

### datastore  [1 docs, x8] [new]  · aliases: training datastore
A datastore is a collection of key-value pairs built from training examples, where each key is a context representation and each value is the corresponding target information. During inference, the model queries the datastore with a new context representation to retrieve similar entries and use the retrieved information to support its prediction.  · merged: training datastore

### GSM8K  [1 docs, x8] [new]  · aliases: GSM8K benchmark
GSM8K is a benchmark dataset of grade-school math word problems used to evaluate arithmetic and multi-step reasoning in language models. Models are assessed on how accurately they solve the problems and produce the correct final answers.  · merged: GSM8K benchmark

### Webtext2 training set  [1 docs, x7] [new]  · aliases: Webtext2
用于训练语言模型的特定文本数据集，常作为大规模语料来进行自回归语言建模等实验。不同来源或版本的数据规模与组成会影响训练结果，从而导致拟合得到的数值常量与经验关系不同。  · merged: WebText2

### key-value retrieval  [1 docs, x7] [judged-distinct]  · aliases: KV retrieval, synthetic key-value retrieval task, synthetic key-value task
一种检索任务或基准测试：给定输入中的键值对以及目标查询（或目标键），要求系统根据目标键定位对应的值并输出。该任务用于在简单、可控的合成条件下隔离并评估模型的检索与上下文/条件推理能力，重点考察“从键到值”的精确匹配与信息获取。  · merged: synthetic key-value retrieval task, synthetic key-value task

### dual-level retrieval system  [1 docs, x7] [new]  · aliases: dual-level retrieval paradigm, dual-level retrieval
A retrieval strategy that searches knowledge at two different levels of granularity, typically combining fine-grained details with broader contextual structure. Its goal is to improve relevance and completeness by aggregating coarse- and fine-level retrieval signals, yielding better downstream generation quality.  · merged: dual-level retrieval paradigm, dual-level retrieval

### 低秩分解矩阵  [1 docs, x6] [judged-distinct]  · aliases: rank decomposition matrices, 秩分解矩阵, low-rank representation, low-rank decomposition, 低秩分解, 低秩矩阵分解
低秩分解矩阵是一种将矩阵参数化为两个或多个秩较低矩阵乘积（或等价的多因子形式）的分解方法，使得得到的近似/更新矩阵具有较低秩。它通过用更少的自由参数来压缩存储与计算开销，并常作为受约束的更新或模型适配手段来保持主要表达能力。  · merged: 秩分解矩阵, low-rank representation, low-rank decomposition, 低秩分解, 低秩矩阵分解

### standard prompting  [1 docs, x6] [judged-distinct]
A prompting approach that asks a model to answer directly without providing intermediate reasoning demonstrations. It typically elicits a short final answer rather than a step-by-step solution.

### Generative Pre-trained Transformer  [1 docs, x5] [judged-distinct]  · aliases: OpenAI GPT, GPT, GPT Transformer
一种基于 Transformer 架构的自回归预训练语言模型，通过受限自注意力实现从左到右的生成：每个 token 只能关注其左侧上下文，因此预测仅依赖已生成的先前内容。模型先在大规模无标注文本上进行语言建模以学习通用语言表示，再通过微调适配到具体下游任务，从而将预训练获得的语言知识迁移到多种自然语言处理问题。  · merged: OpenAI GPT, GPT Transformer

### compute budget  [1 docs, x5] [judged-distinct]  · aliases: computational budget
计算预算是指用于训练或评估模型的可用计算资源总量（上限），通常视为固定资源在模型规模、训练时长与数据规模之间进行分配。它约束在给定条件下可取得的训练进展，并影响这些因素之间的最优权衡。  · merged: computational budget

### approximate nearest neighbor index  [1 docs, x5] [judged-distinct]  · aliases: ANN index, 近似最近邻索引
一种用于在大规模集合中进行相似性搜索的索引数据结构，可针对给定查询快速找到最接近的向量或文档候选结果。通过近似搜索在效率与召回之间进行权衡，从而避免对集合中所有项目进行穷尽比较；因此常用于大规模检索，并可支持在线更新场景。  · merged: 近似最近邻索引

### 适配器  [1 docs, x5] [judged-distinct]  · aliases: adapters, adapter tuning, 适配器方法
适配器是一种参数高效微调方法：在预训练模型中插入少量可训练的适配器模块，用以将预训练能力适配到特定任务，而不是对全部原始参数进行大幅更新。通过只训练新增模块来学习任务特定变化，从而显著减少需要更新的参数量；但由于额外模块计算，可能带来一定推理延迟。  · merged: adapter tuning, 适配器方法

### adapter layer  [1 docs, x5] [judged-distinct]  · aliases: adapter layers, adapter
An adapter layer is a small trainable neural network module inserted into a pre-trained model to enable parameter-efficient adaptation to new tasks. It adds task-specific capacity while keeping most of the original model parameters fixed, allowing specialization without full model fine-tuning.  · merged: adapter

### U-shaped performance curve  [1 docs, x5] [new]
A pattern in which performance is higher at the beginning and end of a sequence and lower in the middle. It often indicates that systems access and use edge information more effectively than information located in intermediate positions.

### input context  [1 docs, x5] [judged-distinct]  · aliases: context
The collection of texts provided to a model at inference time, including the question and the candidate documents. In multi-document question answering, the arrangement and length of the input context can affect whether the model accesses the correct evidence.

### knowledge preparation  [1 docs, x5] [new]  · aliases: 知识组织, pre-retrieval process
Knowledge preparation is the set of steps in a retrieval system performed before search to structure and transform external documents or knowledge repositories for efficient retrieval. It typically involves organizing and chunking source material and creating representations or indexes that support fast, accurate, and relevant query-time results.  · merged: 知识组织, pre-retrieval process

### BLEU  [1 docs, x4] [new]
一种机器翻译评测指标，通过比较机器译文与参考译文的 n-gram 重叠程度来衡量翻译质量。数值越高通常表示译文与参考译文越接近。

### large mini-batch training  [1 docs, x4] [judged-distinct]  · aliases: large batch training, 大批量训练, large mini-batches
一种训练方式，在每个迭代步骤中将许多样本组成较大的 mini-batch 一起计算并在随后进行一次参数更新。通过提高每步的并行处理效率，它可能改变优化行为，并在相近训练轮数与计算成本下影响如困惑度及下游任务性能。若硬件内存受限，可通过梯度累积等方式等效实现较大的 mini-batch，通常还需要配合学习率调整以维持或提升最终表现。  · merged: large batch training, 大批量训练, large mini-batches

### optimal batch size  [1 docs, x4] [new]  · aliases: critical batch size
在分布式训练中，一个在数据并行下平衡速度与优化效率的批大小阈值。当批大小接近或超过该阈值时，进一步增大批次通常会带来递减的优化收益。因而“最佳批大小”指在给定模型与训练目标下能取得最佳训练效率的批大小，并可在大模型场景中增长到很大。  · merged: critical batch size

### latent knowledge retriever  [1 docs, x4] [judged-distinct]  · aliases: knowledge retriever, neural knowledge retriever, 潜在知识检索
潜在知识检索器是一种学习得到的检索组件，将“文档选择”建模为隐变量，在文本知识源中为给定输入分配检索分布并选择相关信息供语言模型使用。其训练通常不需要显式标注应检索的具体文档，而是通过下游预测目标的反馈间接优化检索器，使检索结果在动态、上下文化的条件下对任务输出更有帮助。可与语言模型联合训练，从而使检索过程受任务反馈影响。  · merged: neural knowledge retriever, 潜在知识检索

### knowledge-augmented encoder  [1 docs, x4] [new]  · aliases: encoder
A knowledge-augmented encoder is a generation component that conditions on both the original input and retrieved documents. It uses retrieved evidence to improve the prediction of the output sequence.

### one-shot learning  [1 docs, x4] [judged-distinct]  · aliases: one-shot, one-shot setting
A setting in which a model is given a single demonstration at inference time before performing a task. It is a special case of in-context learning, distinguished by providing only one example in the prompt, to evaluate how well the model can adapt its behavior from minimal context.  · merged: one-shot setting

### gradient norm  [1 docs, x4] [judged-distinct]
The magnitude of a gradient vector during optimization. It reflects how strong an update signal is for the parameters and is often used to analyze training dynamics.

### BERT-Siamese  [1 docs, x4] [judged-distinct]
一种双塔式编码架构，使用两个共享参数的BERT编码器分别表示查询和文档。它通过比较两侧向量的相似度来完成检索或匹配任务。

### 预训练模型权重  [1 docs, x4] [judged-distinct]  · aliases: pre-trained model weights, pretrained weights, pre-trained weights, pre-trained weight matrix, 预训练权重矩阵
预训练模型权重是指在通用大规模数据或源任务上预先训练得到的模型参数（权重矩阵/参数集合），用于在进行下游任务适配前提供初始知识与表示能力。下游适配时，它们通常作为微调起点，并可能被继续更新或在大部分保持冻结，仅训练少量新增参数，以在降低计算与数据成本的同时实现任务迁移。  · merged: pre-trained weights, pre-trained weight matrix, 预训练权重矩阵

### GPT-Neo  [1 docs, x4] [judged-distinct]
A family of open language models in the GPT style. In the passage, it is one of the model families compared on truthfulness across different sizes.

### adversarial procedure  [1 docs, x4] [new]  · aliases: adversarial filtering
An adversarial procedure is a method for constructing or curating evaluation items by deliberately targeting a model’s weaknesses. Examples are iteratively selected or filtered—often using model predictions—so the resulting dataset is more challenging and less likely to be solved via superficial cues, thereby exposing the behavior under study.  · merged: adversarial filtering

### MAWPS benchmark  [1 docs, x4] [new]  · aliases: MAWPS
A benchmark dataset of math word problems expressed in natural language, used to evaluate systems on arithmetic and symbolic reasoning. It includes subsets of varying difficulty, ranging from easier single-step problems to more complex multi-step reasoning.  · merged: MAWPS

### human-labeled comparisons  [1 docs, x4] [judged-distinct]  · aliases: 人类偏好数据, comparison data
人类对不同模型输出进行成对或成组的比较，并为候选输出标注偏好或优劣关系，形成包含“人类更喜欢哪种结果”的数据集。该数据集常用于训练奖励模型，将比较偏好信息转化为可计算的奖励信号，并进一步用于优化模型目标，使生成内容更符合人类期望。  · merged: 人类偏好数据, comparison data

### statistical language model  [1 docs, x4] [judged-distinct]  · aliases: 统计语言模型
统计语言模型是一种语言模型，利用统计学习估计词序列（或标记序列）的概率，从而实现词预测。它通常依赖马尔可夫假设等简化条件，用观测到的频率与上下文关系来刻画条件概率。该模型常用于自然语言处理与信息检索等任务。  · merged: 统计语言模型

### ChatGPT  [1 docs, x4] [judged-distinct]
An AI chatbot built on large language models for interactive dialogue. It is designed to generate helpful conversational responses across a wide range of topics.

### primacy bias  [1 docs, x4] [new]
A tendency to give disproportionately strong weight to information that appears near the beginning of a sequence or context. In language model behavior, it can make early context easier to use than middle context.

### recency bias  [1 docs, x4] [judged-distinct]
A tendency to give disproportionately strong weight to information that appears near the end of a sequence or context. In language model behavior, it can make late context easier to use than middle context.

### Taxonomy of hallucination  [1 docs, x4] [new]  · aliases: hallucination taxonomy, Taxonomy of hallucinations
A taxonomy of hallucination is a structured classification scheme that groups hallucination phenomena into distinct categories and subcategories. It helps organize analysis of underlying causes and supports the development of detection methods and mitigation strategies.  · merged: hallucination taxonomy, Taxonomy of hallucinations

### faithfulness hallucination  [1 docs, x4] [judged-distinct]
Faithfulness hallucination is a type of hallucination in which generated content diverges from the user input or fails to remain self-consistent. It covers cases where the output does not faithfully reflect the instruction, context, or its own internal logic.

### hierarchical community  [1 docs, x4] [judged-distinct]  · aliases: hierarchy of communities, hierarchical structure of communities, community hierarchy, 社区层次结构, hierarchical community structure
层级社区是将社区按多尺度、嵌套方式组织成树状结构的组织形式：上层社区由若干下层子社区组成，上层概括更广范围、下层刻画更细粒度的子群体。它支持在不同抽象层次上进行分析与表达，并可根据对“细节—范围”权衡的需求，在不同分辨率下汇总、概括与从局部逐级获得整体认识。  · merged: community hierarchy, 社区层次结构, hierarchical community structure

### global sensemaking  [1 docs, x4] [judged-distinct]
对整个语料库进行宏观理解、归纳与解释的过程，目标是识别跨文本的主题、模式和关联。它强调从整体层面生成洞见，而不仅是回答局部事实问题。

### textual subgraph retrieval  [1 docs, x4] [judged-distinct]
The process of selecting a connected subset of nodes and text from a larger graph for downstream language-model use. It aims to find the most relevant subgraph structure rather than retrieving isolated documents, so that multi-hop context is preserved.

### divide-and-conquer strategy  [1 docs, x4] [new]
An algorithmic approach that solves a complex problem by splitting it into smaller parts, solving those parts, and combining the results. In graph retrieval, it can be used to search for an optimal subgraph structure more efficiently than exhaustive methods.

### textual subgraph  [1 docs, x4] [judged-distinct]  · aliases: joint textual and topological information
A subgraph whose nodes, edges, or both are associated with text, combining the subgraph’s structural relationships with the textual content it contains. This representation supports tasks that require both semantic meaning and connectivity patterns for downstream reasoning or generation.  · merged: joint textual and topological information

### hierarchical text descriptions  [1 docs, x4] [judged-distinct]  · aliases: hierarchical text description, text view of textual graphs, hierarchical description
Hierarchical text descriptions are textual representations of graph data organized across multiple levels of abstraction, typically in a tree-like progression from coarse to fine detail. They linearize graph elements into readable text while preserving topology and important relationships, including connections or relations among subgraphs. Additional structured relations are incorporated as needed so the underlying structure remains coherent when narrated.  · merged: hierarchical text description, text view of textual graphs, hierarchical description

### WebQSP  [1 docs, x4] [judged-distinct]
一个大规模的多跳知识图谱问答数据集，问题的回答通常需要跨多个关系或实体进行推理。它常用于评测模型在复杂知识图谱问答中的检索与推理能力。

### ExplaGraphs  [1 docs, x4] [judged-distinct]
一个面向常识推理的数据集，重点在于根据图中的关系判断论证或辩论中的立场。它用于评测模型对图结构中因果、支持与反对等常识关系的理解能力。

### low-level knowledge discovery  [1 docs, x4] [judged-distinct]  · aliases: 低层检索, low-level retrieval
一种面向具体实体及其细粒度信息的知识检索与发现方法，强调精确获取局部、具体的事实细节及其关联。它通常聚焦特定事实、实体间关系或邻接线索，用于需要定位精确证据并给出严格引用支持的问答与查询场景。  · merged: 低层检索, low-level retrieval

### HyDE  [1 docs, x4] [new]  · aliases: Hypothetical Document Embeddings, hypothetical document
HyDE is a retrieval method that first uses a language model to generate a hypothetical, answer-bearing document or passage from a query. That generated text is then embedded and used to retrieve relevant text chunks, improving the quality of what the final system can support or answer.  · merged: hypothetical document

### RAG pipeline  [1 docs, x4] [judged-distinct]  · aliases: retrieval-augmented generation pipeline, 传统RAG流水线, 传统 RAG pipeline, 传统RAG
RAG（检索增强生成）管线是一种检索增强生成的端到端流程：先对外部知识源进行切分、向量化并组织索引（常以向量数据库为核心），再根据用户查询进行语义检索，取回相关文本片段，最后将检索结果与用户输入一同提供给生成模型以生成回答。通过在生成时引入可检索的外部证据，RAG可提升答案的准确性与可论据性，并缓解纯参数化模型在知识覆盖与时效性方面的不足。其效果受检索粒度与知识组织/索引方式影响。  · merged: 传统RAG流水线, 传统 RAG pipeline, 传统RAG

### 英德机器翻译任务  [1 docs, x3] [new]  · aliases: WMT 2014 English-to-German translation task, WMT 2014 英语到德语翻译任务
一种将英文句子翻译为德文句子的机器翻译基准任务，常用于评估并比较不同序列到序列翻译模型在翻译质量上的表现。该任务通常在公开的标准数据与测试划分上进行，并可通过如 BLEU 等指标报告模型间的差异。  · merged: WMT 2014 English-to-German translation task, WMT 2014 英语到德语翻译任务

### 英法机器翻译任务  [1 docs, x3] [judged-distinct]  · aliases: WMT 2014 English-to-French translation task, WMT 2014 英语到法语翻译任务
英法机器翻译任务是一种机器翻译基准任务，要求将英文句子翻译成法文句子。该任务常用于评估翻译系统的翻译质量，并用于比较不同模型或训练方案的效果。研究通常基于标准数据与统一测试设置，结合自动评估指标（如 BLEU）报告性能。  · merged: WMT 2014 English-to-French translation task, WMT 2014 英语到法语翻译任务

### scaled dot-product attention  [1 docs, x3] [new]
An attention mechanism that computes compatibility scores by taking the dot product between queries and keys, then scaling the result before applying a softmax. The scaling helps stabilize gradients and makes the attention weights numerically well behaved in high-dimensional settings.

### parameter-free position representation  [1 docs, x3] [new]  · aliases: positional encoding
Parameter-free position representation encodes token order in a sequence without learning additional position-specific parameters. It adds position information to token embeddings—using relative or absolute position cues—so a model without recurrence or convolution can distinguish different token positions and their order via attention.  · merged: positional encoding

### convolutional layer  [1 docs, x3] [judged-distinct]  · aliases: Convolutional
A layer that applies convolutional filters over local neighborhoods of a sequence. Its computation is parallel across positions, but information can propagate only gradually through stacked layers, giving a logarithmic maximum path length in the kernel size.

### sinusoidal positional encoding  [1 docs, x3] [new]  · aliases: sin and cosine functions of different frequencies, sine and cosine positional encoding
A fixed positional encoding that represents each position with sine and cosine functions at different frequencies. The frequencies form a geometric progression, which can help the model learn relative offsets and may support extrapolation to longer sequences.

### dynamic masking  [1 docs, x3] [judged-distinct]
A masking strategy in which the masked token positions are regenerated every time a sequence is fed to the model. This produces different corruption patterns across epochs and increases the variety of training examples.

### segment-pair  [1 docs, x3] [judged-distinct]  · aliases: SEGMENT-PAIR, sentence-pair, SEGMENT-PAIR input format
A segment-pair is a pretraining input construction that forms each example from two text segments presented together as a single input. The segments are typically separated by a special marker or delimiter so the model can distinguish the pair, and they may be sampled from within the same document or from different documents. It is commonly used to support objectives such as next sentence prediction by modeling relationships between the two segments.  · merged: sentence-pair, SEGMENT-PAIR input format

### full sentences  [1 docs, x3] [new]  · aliases: FULL-SENTENCES
An input construction that packs sequences of text from multiple documents into a contiguous sequence up to a fixed token limit. It may cross document boundaries and can insert an extra separator token between documents. It is used to create training sequences of roughly fixed length.  · merged: FULL-SENTENCES

### k近邻模型  [1 docs, x3] [judged-distinct]  · aliases: k-nearest neighbors model, kNN模型, 最近邻检索机制
k近邻模型是一种基于表示相似度或距离度量的检索型非参数方法。给定查询表示后，在存储样本中找到与其最接近的k个邻居，并根据这些邻居携带的标签或输出生成预测。它可用于多种任务；在语言建模中，可借助邻近样本的前缀嵌入信息来辅助下一词预测。  · merged: k-nearest neighbors model, 最近邻检索机制

### 线性插值  [1 docs, x3] [new]  · aliases: linearly interpolating, linear interpolation, 插值
线性插值是一种将两个或多个概率分布（或表示）按权重进行加权混合的组合方式。它常用于在不同来源的输出之间进行折中与融合，例如将检索得到的分布与原模型的分布结合，以同时利用记忆检索与参数化预测能力。  · merged: linear interpolation, 插值

### prefix embedding  [1 docs, x3] [judged-distinct]  · aliases: prefix representations, context representation, fixed size context representations
A prefix embedding is a fixed-size vector representation of a text prefix (context) that encodes preceding information to predict the next token. It is produced by a pretrained language model and captures the context in a latent space so that internal states can be stored and compared. Similar contexts yield similar embeddings under a distance or similarity measure.  · merged: context representation, fixed size context representations

### Wikitext-103  [1 docs, x3] [new]  · aliases: WIKITEXT-103
A large benchmark corpus of Wikipedia text used for evaluating language models. It is commonly used to compare model perplexity and other language modeling performance measures.

### squared L2 distance  [1 docs, x3] [new]  · aliases: Euclidean distance squared
A distance metric that measures the squared Euclidean distance between two vectors. In retrieval systems, it is used to identify the closest stored representations to a query representation.

### WIKI-100M  [1 docs, x3] [judged-distinct]
WIKI-100M is a random subset of English Wikipedia containing about 100 million tokens. It is composed of complete articles and is used as a smaller-scale corpus derived from a larger Wikipedia collection.

### WIKI-3B  [1 docs, x3] [judged-distinct]
WIKI-3B is an English Wikipedia corpus containing about 2.87 billion tokens. It consists of whole articles, with some articles held out for validation and test.

### interpolation parameter  [1 docs, x3] [judged-distinct]  · aliases: λ, lambda
A tunable coefficient used to combine two probability distributions or scores. In retrieval-augmented language models, it controls the balance between the base model and the retrieved-neighbor distribution.

### question encoder  [1 docs, x3] [judged-distinct]
A model component that converts a question into a vector representation. The resulting embedding is used to compare the question with candidate passages during retrieval or matching.

### 少样本学习  [1 docs, x3] [judged-distinct]  · aliases: few-shot learning, few-shot setting
一种只依赖少量示例或简单指令就完成新任务的能力或设置。它强调模型在几乎不进行额外参数更新的情况下，利用上下文中的少量演示来适配任务。

### Test set contamination  [1 docs, x3] [new]  · aliases: C Details of Test Set Contamination Studies, data contamination, train-test overlap
Test set contamination is the unintended overlap between a model’s training data and the evaluation or test data, such as identical examples or highly similar ones appearing in training. This overlap can inflate measured performance because the model may have effectively “seen” parts of the held-out benchmarks, making generalization appear better than it truly is.  · merged: data contamination, train-test overlap

### meta-learning  [1 docs, x3] [new]
A learning approach in which a model acquires general skills or inductive biases during training and then uses them at inference time to adapt quickly to a new task. It is often described as “learning to learn,” because prior experience is meant to improve rapid adaptation to unfamiliar problems.

### stochastic gradient variance  [1 docs, x3] [judged-distinct]  · aliases: gradient variance
The variability of gradient estimates produced by stochastic optimization across different samples or stochastic draws (e.g., mini-batches). High gradient variance can make training unstable and slow convergence, while reducing it can improve optimization stability and is commonly studied when analyzing sampling and weighting strategies.  · merged: gradient variance

### negative sampling  [1 docs, x3] [judged-distinct]
A training strategy that supplies examples known or assumed to be incorrect so a model can learn to distinguish them from correct ones. In retrieval, the choice of negatives strongly affects training difficulty and final performance.

### Binary cross entropy  [1 docs, x3] [judged-distinct]  · aliases: BCE, binary cross-entropy loss
Binary cross entropy is a loss function that measures the discrepancy between predicted probabilities (or scores converted to probabilities) and binary target labels. In ranking and retrieval settings, it can be used to compare positive and negative pairs by penalizing miscalibrated predictions. It can become uninformative when examples are already classified with high confidence, since the gradients diminish.  · merged: binary cross-entropy loss

### TREC 2019 Deep Learning Track  [1 docs, x3] [judged-distinct]  · aliases: TREC 2019 DL Track, TREC DL
TREC 2019 深度学习赛道是一个面向文档检索与排序的公开评测基准，提供测试集合与官方评价设置，用于在标准化条件下比较不同检索系统的效果。该基准常用于衡量稠密检索与传统稀疏检索（例如基于关键词的检索）在排序性能方面的差异，并配套相应的相关性评估以支撑系统对比。  · merged: TREC DL

### 支持文档  [1 docs, x3] [judged-distinct]  · aliases: support documents, support document
为回答问题而从外部知识源检索到的相关文档。它们作为证据与上下文，用于支撑后续答案的抽取或生成，尤其在开放域问答中可直接提供答案所依据的文本。  · merged: support document

### 多段落证据聚合  [1 docs, x3] [judged-distinct]  · aliases: aggregating and combining evidence from multiple passages, evidence fusion, evidence aggregation
多段落证据聚合是一种将来自多个证据来源的片段进行合并与综合的过程，用于在单个信息不充分或不同段落分别提供部分线索时，支撑更完整的推理与问答。它常用于开放域问答等场景，通过融合跨文档或跨段落的支持信息来提升答案或候选结果的排序与选择准确性。  · merged: evidence fusion, evidence aggregation

### hard expectation-maximization  [1 docs, x3] [new]  · aliases: hard EM, discrete hard EM
Hard expectation-maximization is a variant of the expectation-maximization algorithm that learns using hard assignments: for each instance, it selects the most likely latent explanation rather than averaging over all latent possibilities. It alternates between choosing a single latent value (the “hard E-step”) and updating model parameters based on that selection (the “hard M-step”). It is especially useful under weak or noisy supervision when latent variables are unobserved and exact marginalization is impractical due to a large latent space.  · merged: Hard EM, discrete hard EM

### Multi-Passage BERT  [1 docs, x3] [new]  · aliases: Multi-Passage BERT (Wang et al., 2019)
A question answering model that uses BERT over multiple retrieved passages. It aggregates evidence across passages to improve answer prediction in open-domain question answering.

### 前缀调优  [1 docs, x3] [judged-distinct]  · aliases: prefix-tuning, prefix tuning, 前缀方法
前缀调优是一种参数高效的适配方法，通过学习一段连续的可训练前缀表示，并将其加入模型的输入或注意力上下文以影响生成。原模型权重通常保持冻结，训练只更新前缀参数，从而使模型更好地适配下游任务。它也常与其他微调方法协同使用。  · merged: prefix tuning, 前缀方法

### AdptD  [1 docs, x3] [judged-distinct]  · aliases: AdptP
AdptD is a parameter-efficient adapter-based method that adapts a pretrained model by training only a small set of added or modified, task-specific parameters while keeping most of the pretrained model fixed. It is designed to reduce the number of trainable parameters compared with full fine-tuning.  · merged: AdptP

### language model truthfulness  [1 docs, x3] [judged-distinct]  · aliases: truthfulness, truthful model
Truthfulness is the degree to which a language model’s responses are factually correct and non-deceptive rather than false or misleading. It reflects how often answers match reality, not merely how plausible they sound, and it is influenced by training data and alignment choices. Higher truthfulness makes models more reliable across diverse contexts and helps reduce accidental errors, which is especially important for safer use in high-stakes settings.  · merged: truthful model, truthfulness

### reference answers  [1 docs, x3] [new]  · aliases: reference answer
Reference answers are authoritative candidate responses used as evaluation targets for benchmark questions, often in multiple-choice settings where correct and incorrect options may be included. They may be labeled true/false and compared against model outputs by likelihood or other scoring criteria.  · merged: reference answer

### multiple-choice task  [1 docs, x3] [new]  · aliases: multiple-choice variation
An evaluation format in which a model selects one option from a fixed set of candidate answers rather than generating free-form text. The model is scored by comparing its chosen answer (or relative preference over candidates) against the correct target. It is commonly used to assess whether the model can identify the best answer among distractors.  · merged: multiple-choice variation

### math word problems  [1 docs, x3] [new]  · aliases: math word problem
以自然语言叙述并包含数值关系的数学题，要求根据题意给出某个数值答案。解题者需要从文字中提取数量关系，建立相应的算术表达并进行推算或计算。  · merged: math word problem

### arithmetic reasoning  [1 docs, x3] [judged-distinct]
Reasoning that involves numerical computation and stepwise manipulation of quantities. It includes addition, subtraction, multiplication, division, and multi-step word-problem solving.

### AQuA dataset  [1 docs, x3] [judged-distinct]  · aliases: AQuA
AQuA is a multiple-choice benchmark dataset of arithmetic and algebraic word problems. It evaluates mathematical reasoning by requiring models to interpret a textual problem, translate it into algebraic relationships, and select the correct answer from a set of options.  · merged: AQuA

### biased text  [1 docs, x3] [new]  · aliases: biased outputs, biased output
Biased text is model- or human-generated language that systematically reflects, amplifies, or unbalances associations in ways that are unfair, prejudicial, or skewed toward particular groups or attributes. In language-model outputs, bias can reinforce stereotypes and social inequities learned from training data or model behavior, leading to discriminatory wording or uneven treatment of different entities and distorting information presented to users.  · merged: biased outputs, biased output

### human-written demonstrations  [1 docs, x3] [judged-distinct]  · aliases: demonstration data
Examples of desired inputs and outputs written by humans to show how a model should respond to prompts. They are used as supervised training data to teach target behavior, providing direct demonstrations the model can imitate during training or adaptation.  · merged: demonstration data

### toxicity  [1 docs, x3] [judged-distinct]
A property of language outputs referring to abusive, offensive, or harmful content. It is commonly measured to assess safety and the likelihood that a model produces socially harmful text.

### Atlas  [1 docs, x3] [new]
Atlas is a retrieval-augmented language model designed to learn knowledge-intensive tasks from very few training examples. It combines parametric language modeling with external document retrieval so it can incorporate and update factual knowledge more efficiently than models that store all knowledge in parameters.

### KILT  [1 docs, x3] [new]  · aliases: Knowledge Intensive Language Tasks, KILT Tasks, KILT benchmark
KILT is a benchmark suite for knowledge-intensive language tasks that evaluates systems in knowledge-grounded settings such as retrieval-augmented question answering and fact checking. It emphasizes using external knowledge sources to support responses and measure how well models leverage retrieved facts and evidence to produce correct, well-grounded outputs. The suite also includes tasks like entity linking alongside other related problem types.  · merged: KILT Tasks, KILT benchmark

### cross-attention score  [1 docs, x3] [judged-distinct]  · aliases: cross-attention scores, decoder cross-attention scores
A weight produced by a decoder's cross-attention mechanism that measures how strongly an output token attends to an input token or document. Aggregated across heads, layers, and tokens, these scores can serve as a proxy for the importance of input documents during generation.

### neural language model  [1 docs, x3] [judged-distinct]
A language model that uses neural networks to learn representations of language and predict text. It generalizes statistical language modeling by learning distributed features from data.

### query-aware contextualization  [1 docs, x3] [new]
A prompting or input arrangement strategy that places the query both before and after the supporting documents or key-value pairs. It is used to help a model attend to the query and retrieve relevant information more reliably.

### Hallucination benchmarks  [1 docs, x3] [judged-distinct]  · aliases: benchmarks, Hallucination Evaluation Benchmarks
Hallucination benchmarks are standardized evaluation tasks designed to measure how often language models produce hallucinated content. They assess generation quality in terms of truthfulness and groundedness, using common metrics so methods for detection and mitigation can be compared reliably.  · merged: Hallucination Evaluation Benchmarks

### Hallucination mitigation  [1 docs, x3] [judged-distinct]  · aliases: mitigation, 幻觉缓解
Hallucination mitigation refers to a set of methods used to reduce the frequency or impact of hallucinations in large language model outputs. These methods typically target multiple stages—data, training, and inference—to improve factuality and reliability of the generated text.  · merged: 幻觉缓解

### Knowledge boundaries  [1 docs, x3] [new]  · aliases: knowledge boundary
知识边界是模型能够可靠覆盖的知识与可从上下文推断的能力范围，超出该范围时模型更可能出现不确定或错误输出。理解知识边界有助于判断何时需要检索、拒答或进行额外验证。  · merged: knowledge boundary

### sensemaking query  [1 docs, x3] [new]  · aliases: global sensemaking query, corpus-specific sensemaking query
A sensemaking query is one that goes beyond narrow fact lookup and instead prompts broad synthesis across a corpus or system output. It is designed to reveal patterns, trends, or relationships that emerge only when information is considered together, supporting understanding and interpretation of the material in retrieval-augmented or similar settings.  · merged: global sensemaking query, corpus-specific sensemaking query

### map-reduce processing  [1 docs, x3] [new]  · aliases: map-reduce, map-reduce approach
A two-stage processing pattern in which partial results are first produced independently in parallel and then combined into a final result. It is useful for aggregating information from multiple partitions into a single answer, including scaling summarization by summarizing smaller text units and then combining the intermediate summaries.  · merged: map-reduce approach

### LLM-as-a-judge technique  [1 docs, x3] [judged-distinct]  · aliases: LLM-as-a-judge, LLM assessment
一种评估方法，让大语言模型充当评判者，依据指定标准对系统的多个生成结果进行判断与比较，并输出优选结果或平局。该过程可重复多次以减弱生成随机性带来的波动，从而提升评估的稳定性。  · merged: LLM-as-a-judge, LLM assessment

### Leiden algorithm  [1 docs, x3] [judged-distinct]  · aliases: Leiden, Leiden算法, Leiden community detection
Leiden算法是一种用于图社区检测的划分方法，旨在将图划分为若干内部联系更密集的社区。它在划分过程中通过迭代方式改进社区质量，通常相较于基于模块度的流程能得到更可靠、更稳定的结果。该算法也可进行层次化应用，以在不同尺度上发现子社区。  · merged: Leiden算法, Leiden community detection

### 社区回答  [1 docs, x3] [judged-distinct]  · aliases: community answers, 社区答案
社区回答是针对用户查询生成的面向查询回答方法，先基于社区摘要的各个片段在“映射”阶段产生中间答案，再通过有用性/相关性对中间答案进行排序与筛选，最后将其组合整合为更广泛的最终全局答案。该做法强调先在社区范围内组织信息并形成中间结果，再参与后续全局生成与提升。  · merged: 社区答案, community answers

### 文本图  [1 docs, x3] [judged-distinct]  · aliases: textual graph
文本图是由文本节点及其之间的关系（边）构成的图结构，节点和边都携带自然语言相关的属性或语义信息。它将结构关系与文本内容结合，用于表示文档间的链接、交互或关联，并使图数据能够以语言感知的方式进行处理，从而支持更结构化的信息检索与生成。  · merged: Textual Graph

### graph soft pruning mechanism  [1 docs, x3] [new]  · aliases: soft pruning, soft pruned subgraph
A graph pruning method that gradually reduces the influence of less useful nodes and edges, typically by downweighting them rather than deleting them outright. It restricts graph encoding to the most relevant substructure while preserving differentiability, suppressing redundancy and removing only non-critical components. The remaining information stays best aligned with a chosen retrieval objective without exhaustive search.  · merged: soft pruning, soft pruned subgraph

### Topological information  [1 docs, x3] [new]
Topological information is the structural information that describes how nodes and edges are connected in a graph. It is essential for reasoning about graph-structured data because it captures relationships that are not present in text alone.

### K-hop ego-graph  [1 docs, x3] [judged-distinct]  · aliases: K-hop neighborhood graph
A K-hop ego-graph is the subgraph induced by the nodes within K hops of a chosen center node. It captures the local neighborhood structure around that node for indexing, retrieval, or downstream analysis.

### Hit@1  [1 docs, x3] [new]  · aliases: Hit at 1
一种排序或检索评价指标，表示正确答案是否排在第一位。它常用于衡量模型在候选答案排序中的最高位命中情况。

### MiniLM-L12-v2  [1 docs, x3] [judged-distinct]
一种预训练的轻量级语言模型表示模块，常用于生成句子或段落的向量表示。它在检索与语义匹配任务中经常被用作编码器或嵌入模型。

### high-level knowledge discovery  [1 docs, x3] [judged-distinct]  · aliases: 高层检索
从知识源中检索更广泛、更抽象层次的信息的一种检索/发现方式，强调以高阶语义来组织与表示内容。它用于捕捉主题脉络、概念聚合以及更宏观的上下文与层次关系，从而揭示整体结构与更高阶的关联。  · merged: 高层检索

### incremental update algorithm  [1 docs, x3] [new]  · aliases: incremental update algorithms
An algorithm that incorporates new data into an existing system without rebuilding everything from scratch. It helps keep retrieval systems current and efficient in changing data environments.

### 检索机制  [1 docs, x3] [judged-distinct]  · aliases: Retrieval mechanism
一种从外部信息源（如语料库、数据库或知识源）中查找并筛选相关文档或片段的检索技术过程。它可在生成之前或生成过程中提供证据，帮助后续系统提升回答的事实性、相关性与文本落地性，尤其在检索增强生成场景中用于增强生成内容的可靠性。  · merged: Retrieval mechanism

### integration  [1 docs, x3] [new]  · aliases: 知识融合, Knowledge Integration
Integration is the stage in a retrieval-augmented generation system where retrieved evidence is combined with the user query or the model’s internal knowledge to form a basis for generation. Its purpose is to synthesize grounded, coherent, and more accurate output by leveraging multiple knowledge sources during downstream reasoning and the final response.  · merged: 知识融合, Knowledge Integration

### complex query understanding  [1 docs, x3] [new]  · aliases: 复杂查询理解
复杂查询理解是指对包含多个条件、多个子问题或隐含推理链的查询进行准确解析，并据此给出恰当回答的能力。它不仅依赖表面语义匹配，还需要系统整合多步证据来满足各项约束与推理要求。该能力有助于选择合适的检索与证据组织策略，从而获得相关且可支撑的答案。  · merged: 复杂查询理解

### knowledge-based GraphRAG  [1 docs, x3] [judged-distinct]  · aliases: Knowledge-based GraphRAG, 知识型GraphRAG
知识驱动的GraphRAG方法：将非结构化文本转化为显式的知识图（或结构化知识），用节点与边分别表示实体及其语义关系。通过利用实体、关系与语义结构来进行检索与生成，从而实现更精确的知识获取与知识中心化推理。  · merged: 知识型GraphRAG

### hybrid GraphRAG  [1 docs, x3] [judged-distinct]  · aliases: Hybrid GraphRAG, 混合型GraphRAG
Hybrid GraphRAG是一类结合知识型方法与索引型方法的GraphRAG框架，同时利用显式知识组织与图索引机制来支持检索与推理。它旨在在语义表达能力、检索效率与系统灵活性之间取得平衡，以应对更复杂的推理任务。  · merged: 混合型GraphRAG

### recursive splits  [1 docs, x3] [judged-distinct]  · aliases: recursive splitting, recursive split
A chunking strategy that repeatedly divides text into smaller segments using predefined, often structure-aware rules or limits, continuing until each segment fits a desired size. It is used in retrieval pipelines to create retrieval units that are semantically coherent and easier to index and search.  · merged: recursive split

### sliding windows  [1 docs, x3] [new]  · aliases: sliding window
A chunking or segmentation strategy that moves a fixed-size window across a text to create overlapping segments. The overlap preserves some local context between neighboring chunks while ensuring each segment remains bounded in size. This can improve downstream tasks such as retrieval by keeping adjacent information accessible across boundaries.  · merged: sliding window

### Small-to-Big  [1 docs, x3] [judged-distinct]
A chunking strategy that uses smaller retrieval units while preserving links to larger surrounding context. It is intended to balance fine-grained searchability with broader semantic completeness.

### ByteNet  [1 docs, x2] [new]
一种用于序列建模的卷积型架构，能够并行计算所有位置的表示。它通过分层结构在较少的步骤中连接远距离位置，从而减少顺序计算。

### ConvS2S  [1 docs, x2] [judged-distinct]  · aliases: ConvS2S
一种基于卷积神经网络的序列到序列模型，能够并行处理输入和输出位置。它通过卷积堆叠逐步扩大感受野，以建模序列中的依赖关系。

### 解码器  [1 docs, x2] [judged-distinct]  · aliases: decoder
解码器是编码器-解码器结构中的后半部分，负责根据编码得到的表示逐步生成输出序列。它通常在每一步生成一个符号，并利用先前已经生成的符号作为额外输入。

### key  [1 docs, x2] [judged-distinct]  · aliases: keys
A key is a vector representation in an attention mechanism that is compared with a query to assess their similarity. That similarity determines the attention weights used to weight the corresponding values, effectively selecting which information is most relevant. Keys function as address-like representations for retrieving relevant content.  · merged: keys

### value  [1 docs, x2] [judged-distinct]  · aliases: values
A value is a vector representation in the attention mechanism that is combined using attention weights to produce the output representation. After computing attention weights from queries and keys, the values are aggregated according to those weights to carry the information used for the result.  · merged: values

### recurrent layer  [1 docs, x2] [new]  · aliases: Recurrent
A sequence-processing layer that updates its state step by step across the input order. Its computation is inherently sequential, so both the number of sequential operations and the maximum path length grow linearly with sequence length.

### NVIDIA P100 GPU  [1 docs, x2] [new]  · aliases: P100 GPU, NVIDIA P100, P100
NVIDIA P100 is a graphics processing unit model designed to accelerate parallel computation. It is commonly used as a high-performance accelerator in computing systems, providing high-throughput parallel execution for workloads such as matrix and tensor operations in machine learning training.  · merged: P100

### base model  [1 docs, x2] [new]
A smaller model configuration used as a standard baseline or default variant. Base models typically have fewer parameters and require less computation than larger versions.

### big model  [1 docs, x2] [judged-distinct]  · aliases: Transformer big
A larger model configuration with greater parameter count or capacity than a base version, often implemented in Transformer architectures by increasing model dimensionality, feed-forward width, and the number of attention heads. This increased capacity is designed to improve performance, such as translation quality, typically at higher computational cost and longer training time.  · merged: Transformer big

### Label Smoothing  [1 docs, x2] [new]
一种训练时的目标分布平滑技术，通过把原本过于尖锐的硬标签分布变得更平缓，降低模型对单一正确类别的过度自信。它通常会略微恶化困惑度，但常常能提高准确率和 BLEU 分数。

### 检查点平均  [1 docs, x2] [new]  · aliases: checkpoint averaging
检查点平均是一种模型组合技术，通过将多个训练过程中保存的模型检查点参数（通常是各层权重）进行平均，形成单一的参数集合。它用于在推断与评估时稳定预测，往往能提升最终性能与泛化能力，并常在训练后期应用以降低参数更新噪声带来的波动。  · merged: checkpoint averaging

### attention key dimension  [1 docs, x2] [judged-distinct]  · aliases: dk, attention key size
The dimensionality of the key vectors used in an attention head to compute attention scores. It determines the size of the representation used for matching queries to keys, influencing how well the model can align related tokens and affecting computational cost.  · merged: attention key size

### unidirectional language model  [1 docs, x2] [judged-distinct]
一种只沿单一方向建模词序列条件概率的语言模型，通常只能利用左侧或右侧上下文进行预测。由于上下文信息受限，这类模型在需要同时利用双向语境的任务中往往不如双向模型有效。

### pre-trained word embeddings  [1 docs, x2] [new]  · aliases: word embeddings, pre-trained word embedding parameter
Vector representations of words learned from large amounts of unlabeled text before being used in downstream NLP systems. Pre-training on broad corpora captures distributional semantic information and provides useful lexical knowledge that can be adapted to specific tasks, often improving performance over embeddings learned only from task-specific data.  · merged: pre-trained word embedding parameter

### 双向自注意力  [1 docs, x2] [judged-distinct]  · aliases: bidirectional self-attention
一种自注意力机制，允许序列中每个标记同时与所有其他标记建立注意力关联，从而同时利用左侧与右侧上下文信息。它用于构建融合了全局输入信息的表示，适合需要整体语义理解的表示学习任务。  · merged: bidirectional self-attention

### perturbed autoregressive language modeling  [1 docs, x2] [judged-distinct]  · aliases: permuted language modeling
A training objective for language models that predicts tokens autoregressively while using perturbations to the input or prediction process. It is a proposed alternative to masked-language-model pretraining for learning strong language representations.

### static masking  [1 docs, x2] [judged-distinct]  · aliases: static mask
A masking strategy in masked language modeling where masked token positions are chosen once during preprocessing and then reused across training epochs. This can cause the model to see the same corruption pattern repeatedly for a given sequence.

### document sentences  [1 docs, x2] [judged-distinct]  · aliases: DOC-SENTENCES
An input construction that builds training sequences from blocks of text taken from a single document only, avoiding any crossing of document boundaries. It preserves contiguous sentence structure within each document while assembling model inputs up to a fixed target length. Because examples near the end of a document may be shorter, it can require variable batch sizes or padding behavior to handle these cases.  · merged: DOC-SENTENCES

### gradient accumulation  [1 docs, x2] [judged-distinct]
A technique that simulates a larger batch size by accumulating gradients over multiple smaller forward and backward passes before performing an optimization step. It is used when memory limits prevent processing the full batch at once.

### byte-level BPE  [1 docs, x2] [judged-distinct]  · aliases: byte-level byte pair encoding, byte-level BPE vocabulary
A byte-based variant of byte pair encoding that uses bytes rather than Unicode characters as the base subword units. It can represent any input text without producing unknown tokens while still learning a compact subword vocabulary.

### 事实知识  [1 docs, x2] [judged-distinct]  · aliases: factual knowledge
语言模型中与世界事实、实体属性和关系相关的可预测内容。它常以稀有但可记忆的模式出现，并对检索式方法特别有帮助。

### nearest neighbors  [1 docs, x2] [judged-distinct]  · aliases: k-nearest neighbors, nearest neighbor distribution
Nearest neighbors are stored items in a vector space that are closest to a query representation under a chosen distance metric. They are commonly used to estimate probabilities over candidate outputs by aggregating information from retrieved neighbors and weighting contributions more heavily for items that are closer (more similar) to the query.  · merged: nearest neighbor distribution

### compute-efficient training  [1 docs, x2] [judged-distinct]
计算高效训练是一种在固定计算预算下最大化模型性能的训练策略。它强调在模型规模、数据量和训练时长之间进行最优分配，以获得更高的最终效果。

### performance scaling  [1 docs, x2] [new]  · aliases: parameter scaling law
Performance scaling is the study of how model performance metrics (e.g., loss or accuracy) change as resources increase, such as data size, model size, compute, or training time. It is often characterized empirically by fitting functional relationships between performance and a resource variable, such as power-law trends with respect to parameter count. The goal is to understand whether gains continue smoothly, follow predictable regimes, or eventually saturate.  · merged: parameter scaling law

### non-embedding training compute  [1 docs, x2] [judged-distinct]  · aliases: C, non-embedding compute
Non-embedding training compute is the portion of a model’s training computation that excludes embedding-layer operations, such as vocabulary and positional embedding work. It is commonly estimated from factors like model size, batch size, and the number of training steps, and is used to compare training cost across runs or model scales in transformer training.  · merged: non-embedding compute

### Universal Transformer  [1 docs, x2] [judged-distinct]  · aliases: Recurrent Transformer
A Universal Transformer is a Transformer variant that reuses the same layer parameters across multiple processing steps, creating an iterative refinement structure rather than a fixed depth stack. By sharing weights across steps (or positions), it reduces the number of distinct parameters and can improve performance for a given parameter budget, sometimes at the cost of increased compute per parameter. It preserves the Transformer’s self-attention while adding recurrence-like processing.  · merged: Recurrent Transformer

### Transformer shape  [1 docs, x2] [judged-distinct]  · aliases: model shape, shape parameters
The configuration of a Transformer model’s structural hyperparameters, such as its depth (number of layers), width (hidden size), number of attention heads, and feed-forward network dimension. These settings determine how model capacity and parameters are distributed across layers and submodules, often rearranging capacity even when the total parameter count remains fixed.  · merged: shape parameters

### aspect ratio  [1 docs, x2] [judged-distinct]  · aliases: dmodel / nlayer, depth-to-width ratio
Aspect ratio is the ratio between a model’s width (e.g., model dimension/hidden size) and its depth (e.g., number of layers) in architectures such as Transformers. It summarizes the width–depth tradeoff when parameter count is held approximately fixed. Very large or very small values correspond to unusually wide or unusually deep models, which may cause performance to deviate from the expected scaling behavior.  · merged: depth-to-width ratio

### 检索式方法  [1 docs, x2] [judged-distinct]  · aliases: retrieval-based approach, 检索后预测生成过程
检索式方法是一类先从知识源中检索可能相关的文档（或证据），再利用这些检索结果进行条件生成，从而产生答案或预测。它将知识访问与生成过程分成两个阶段，以便在大规模语料或知识库中定位并利用有用信息。适用于需要借助外部知识来增强输出的任务。  · merged: 检索后预测生成过程

### marginal probability  [1 docs, x2] [judged-distinct]  · aliases: marginal likelihood
The marginal probability (or marginal likelihood) of observed data is obtained by summing or integrating a joint probability over latent or hidden variables. It removes the hidden variables by aggregating over all of their possible values. In models with latent retrieval or selection components, it is commonly used as an objective during training.  · merged: marginal likelihood

### end-to-end question answering system  [1 docs, x2] [judged-distinct]  · aliases: end-to-end QA system, two-stage framework
An end-to-end question answering system that combines retrieval with answer extraction or generation into a single pipeline. In open-domain QA, a retriever first selects a small set of relevant passages, and a reader then inspects them to produce the answer. This decomposition reduces the search space and improves practicality while its effectiveness depends on both retrieval quality and answer identification.  · merged: two-stage framework

### 段落编码器  [1 docs, x2] [judged-distinct]  · aliases: passage encoder, EP
一种将段落或文档映射到固定维度稠密向量表示的编码网络，常用于检索系统中以快速表示候选文本。它可与问题编码器共同训练，使查询与相关段落在向量空间中具有更高的相似度，从而便于高效的相关性匹配与检索。  · merged: passage encoder

### Freebase  [1 docs, x2] [new]
A structured knowledge base of entities and relations used in question answering and semantic search. It serves as an answer source for datasets that map questions to entities.

### decomposable similarity function  [1 docs, x2] [judged-distinct]  · aliases: decomposable similarity functions
一种可以按维度或组成部分分解计算的相似度函数，便于高效地对表示向量进行比较。它常用于神经检索和匹配模型中，把整体匹配分数建立在局部数值运算之上。

### Fast Decoding  [1 docs, x2] [judged-distinct]
An approximate decoding procedure for retrieval-augmented sequence generation that skips additional forward passes after candidate hypotheses are generated. It treats hypotheses not produced during beam search from a given document as having negligible probability, reducing computation.

### MSMARCO NLG task v2.1  [1 docs, x2] [judged-distinct]  · aliases: MSMARCO NLG v2.1, Open MS-MARCO NLG
MSMARCO NLG task v2.1 is a knowledge-intensive benchmark for open-domain abstractive question answering and natural language generation. It uses the MS MARCO collection to provide questions along with retrieved passages and annotated full-sentence answers, enabling evaluation of generated responses—typically emphasizing factual correctness and text quality.  · merged: Open MS-MARCO NLG

### Jeopardy 问题生成  [1 docs, x2] [judged-distinct]  · aliases: Jeopardy question generation
一种问答生成任务，给定答案线索或相关事实，要求生成符合 Jeopardy 风格的具体、精准问题。由于问题需要与所给实体及证据高度对应，往往要将多条信息整合为单一、可答的题面。  · merged: Jeopardy question generation

### Q-BLEU-1  [1 docs, x2] [judged-distinct]  · aliases: SQuAD-tuned Q-BLEU-1, Q-BLEU
一种用于问句生成的自动评价指标，是 BLEU 的变体，对实体匹配赋予更高权重。它被设计为比标准 BLEU 更能反映人类对问题生成质量的判断。

### retrieval supervision  [1 docs, x2] [judged-distinct]
Retrieval supervision is training guidance that explicitly tells a model which retrieved documents or passages are relevant. It is used to improve retrieval components, but some systems are designed to work without it.

### 三位数算术  [1 docs, x2] [new]  · aliases: 3-digit arithmetic
三位数算术是指涉及三位数进行加、减、乘等基本运算的算术题类别。它常用于检验或评估模型在进行精确计算与步骤性数值推理（包括符号计算）方面的能力。  · merged: 3-digit arithmetic

### on-the-fly reasoning  [1 docs, x2] [new]
On-the-fly reasoning is the ability to solve a problem by composing intermediate steps at inference time rather than relying on memorized answers. It is often tested with tasks that require immediate, context-sensitive inference.

### unscrambling words  [1 docs, x2] [new]
Unscrambling words is a task in which a jumbled sequence of letters must be rearranged into a valid word. It probes a model’s ability to manipulate word structure and infer lexical forms from partial cues.

### human evaluators  [1 docs, x2] [new]  · aliases: human evaluator
Human evaluators are people who judge the quality, authenticity, or other properties of model outputs. They are used to assess how well generated text or responses match human-produced counterparts and to evaluate whether outputs are distinguishable from human-written text.  · merged: human evaluator

### Synthetic news articles  [1 docs, x2] [judged-distinct]  · aliases: Human Quality Assessment of Synthetic News Articles, synthetic news article
News-style articles generated artificially by a language model or other automated system rather than written by a human reporter. They are used to evaluate how closely machine-generated language can resemble authentic journalism, including whether it can affect human judgments of authenticity. They also support studies of text generation quality and realism.  · merged: synthetic news article

### 监督训练数据集  [1 docs, x2] [judged-distinct]  · aliases: labeled examples, supervised training dataset, 有监督数据集
监督训练数据集是包含输入与目标输出配对标注的训练数据集合，用于监督学习以训练模型学习输入到期望结果的映射关系。通过从标注示例中学习，模型能为特定任务建立从输入到输出的对应关系。  · merged: 有监督数据集

### 虚假相关性  [1 docs, x2] [new]  · aliases: spurious correlations, 伪相关特征
训练数据中与目标标签呈现表面相关、但并非任务本质原因的偶然特征或模式。模型若依赖这些虚假线索，往往在训练集上获得较好性能，但在数据分布变化或迁移到新场景时容易失效、泛化变差。  · merged: 伪相关特征

### out-of-distribution generalization  [1 docs, x2] [judged-distinct]  · aliases: OOD generalization, 分布外泛化
模型在训练数据分布之外的样本、环境或任务条件下仍能保持有效表现的能力。它反映模型是否学到了可迁移的规律，而非仅仅记住训练分布中的偶然关联。  · merged: 分布外泛化

### 单样本学习  [1 docs, x2] [judged-distinct]  · aliases: one-shot learning
一种上下文学习形式，在提示中只提供一个示例来引导模型执行任务。它考察模型在极少演示条件下的快速适应能力。

### BERT-based cascade IR pipeline  [1 docs, x2] [judged-distinct]  · aliases: cascade IR pipeline, cascade IR
A multi-stage information retrieval pipeline in which an initial retriever generates candidate documents, followed by a BERT-based reranker or reader that processes the candidates in later stages. The cascade design balances efficiency and accuracy by using fast retrieval to limit the search space and more expensive contextual modeling to refine rankings.  · merged: cascade IR

### continuous representation space  [1 docs, x2] [judged-distinct]  · aliases: representation space
A continuous representation space is a vector space in which texts (or other items such as queries and documents) are embedded as dense numerical representations. In this space, similarity between vectors captures semantic relatedness, so that relevant items are placed near one another while irrelevant items are separated, enabling similarity-based retrieval and other downstream prediction tasks.  · merged: representation space

### negative contrastive estimation  [1 docs, x2] [judged-distinct]  · aliases: Noise Contrastive Estimation
Negative contrastive estimation 是一种对比学习目标，通过区分真实样本与噪声（负样本）来学习概率模型或表示。它通常在检索训练中使用负样本进行对比学习，使与目标匹配的正样本与不匹配的负样本在表示空间中拉开差异。  · merged: Noise Contrastive Estimation

### Hinge loss  [1 docs, x2] [new]
A margin-based loss that penalizes cases where a negative example is scored too close to or above a positive example. It is often used to train ranking models to maintain a separation margin.

### importance sampling  [1 docs, x2] [new]
A sampling technique that corrects for nonuniform selection probabilities by reweighting sampled examples. In optimization, it is used to produce an unbiased estimate of the full gradient under biased sampling.

### unbiased estimator  [1 docs, x2] [new]
An estimator whose expected value equals the quantity being estimated. In gradient-based optimization, it ensures that reweighted sampled gradients match the full gradient in expectation.

### variance reduction  [1 docs, x2] [judged-distinct]
A family of techniques that reduce the variability of stochastic gradient estimates. Lower variance can improve the stability and convergence behavior of optimization algorithms.

### Per-instance gradient norm  [1 docs, x2] [judged-distinct]  · aliases: per-sample gradient norm
单个训练样本（或实例）对应的梯度向量的长度，表示该样本对目标函数与参数更新的影响强弱。梯度范数越大，通常意味着该样本对当前优化步骤的作用越显著，因而常用于分析或刻画样本级学习动态。  · merged: per-sample gradient norm

### Jensen's inequality  [1 docs, x2] [new]  · aliases: Jensen’s inequality
Jensen's inequality 是一种关于凸（或凹）函数与期望的基本不等式，指出对随机变量先作用函数再取期望，与先取期望再作用函数之间存在确定的大小关系：对凸函数有“函数的期望不小于函数在期望处的值”（凹函数则相反）。它常用于在概率与优化中推导上、下界并证明最优性等结果。  · merged: Jensen’s inequality

### Trainer  [1 docs, x2] [judged-distinct]
The component that learns representations by optimizing the retrieval model with negative examples drawn from an approximate nearest neighbor index. It consumes the current index contents to form training signals and updates the model parameters during asynchronous training.

### Inferencer  [1 docs, x2] [new]
The component that encodes documents in the corpus using a recent checkpoint of the model. After finishing encoding, it refreshes the approximate nearest neighbor index with the newest document representations.

### checkpoint  [1 docs, x2] [new]
A saved snapshot of model parameters at a particular training step. Checkpoints are used to encode documents with a recent version of the model while training continues on newer parameters.

### 难负样本  [1 docs, x2] [judged-distinct]  · aliases: hard negatives, NCE Neg
难负样本是指对于当前模型而言最容易被误判为相关、因此最具区分性的负样本。它们通常带来更高的训练损失和更有价值的梯度信号，能促进模型收敛并提升区分能力。常见做法是从批内挑选最难负例，作为对比对象进行噪声对比式训练。  · merged: NCE Neg

### Rand Neg  [1 docs, x2] [judged-distinct]  · aliases: random sampling in batch, random negatives
一种负样本构造策略，在训练过程中从语料或候选集合中随机采样与查询不相关的样本作为对比对象，用于对比学习或检索/排序模型训练。通过提供易于区分的非相关样本，促使模型学习区分相关与不相关文档。  · merged: random negatives

### BM25 Warm Up  [1 docs, x2] [judged-distinct]
一种训练初始化或预热设置，先使用BM25相关的训练信号或负样本来启动模型训练。它通常用于帮助稠密检索模型在早期获得更稳定、更有效的表示学习。

### FirstP  [1 docs, x2] [new]
A long-document handling strategy that represents a document using only its first 512 tokens. It is a simple truncation-based approach used when a transformer encoder cannot process the full document length.

### MaxP  [1 docs, x2] [judged-distinct]
A long-document handling strategy that splits a document into 512-token passages, encodes each passage separately, and combines their scores by taking the maximum. It allows retrieval models to handle long documents while preserving the strongest matching passage signal.

### DeepCT  [1 docs, x2] [new]
一种基于深度学习的词项权重分配方法，用神经模型为文档中的词项预测更适合检索的权重。它旨在增强稀疏检索模型，使文档表示更接近与查询相关的词项分布。

### paragraph reranking  [1 docs, x2] [judged-distinct]  · aliases: rerank paragraphs, reranking paragraphs, ranking paragraphs
Paragraph reranking is a retrieval-stage method that reorders candidate paragraphs after an initial retrieval step, using their estimated usefulness for answering a question so the most relevant evidence is ranked higher. It is typically applied to improve downstream question answering performance by increasing recall through placing likely supporting passages near the top of the candidate list.  · merged: ranking paragraphs

### NarrativeQA  [1 docs, x2] [judged-distinct]
A question answering dataset based on narrative sources that often requires answers to be generated rather than copied from an evidence span. It is commonly used to evaluate abstractive question answering models.

### Inverse document frequency  [1 docs, x2] [judged-distinct]
A weighting scheme that gives higher importance to terms that occur in fewer documents. It is used to downweight common words in retrieval and ranking.

### text-based explicit memories  [1 docs, x2] [judged-distinct]  · aliases: text-based explicit memory
一种以文本形式存储信息并支持直接检索的外部记忆机制，系统在生成回答时可显式查找并使用其中的文本证据。它用于进行外部知识检索，区别于仅依赖参数化模型权重的记忆方式，便于更新、检索与追溯信息来源。  · merged: text-based explicit memory

### AllReduce  [1 docs, x2] [new]
AllReduce is a collective communication operation in distributed computing that aggregates values across devices and then distributes the result back to every participant. It is commonly used in parallel neural network training and inference to synchronize computations across GPUs.

### Broadcast  [1 docs, x2] [new]
Broadcast is a collective communication operation that sends the same data from one device to many other devices. In distributed neural network systems, it is used to replicate parameters or activations across multiple GPUs.

### RoBERTa-large  [1 docs, x2] [judged-distinct]  · aliases: RoBlarge
RoBERTa-large is a large-sized pretrained transformer language model in the RoBERTa family. With substantially more parameters than the base variant, it is commonly used as a strong backbone for downstream tasks. It functions as a pretrained encoder that can be adapted via standard fine-tuning or other parameter-efficient update methods.  · merged: RoBlarge

### BitFit  [1 docs, x2] [judged-distinct]  · aliases: Bias-only tuning
BitFit is a parameter-efficient fine-tuning method that updates only the bias vectors of a pretrained model while freezing all other parameters. It adapts large models with a very small number of trainable weights, making it a lightweight option for transfer learning.  · merged: Bias-only tuning

### AdapterL  [1 docs, x2] [judged-distinct]  · aliases: AdapterP
An efficient adapter design in which the adapter layer is applied only after the MLP module and a LayerNorm. This selective placement reduces overhead while enabling parameter-efficient tuning. It is a later variant within adapter-based parameter-efficient fine-tuning approaches.  · merged: AdapterP

### control trivia questions  [1 docs, x2] [new]  · aliases: matched control questions
Control trivia questions are comparison items designed to preserve the surface form of benchmark questions while avoiding the targeted misconceptions they aim to test. They help distinguish whether a model’s errors stem from the question’s phrasing or formatting versus the underlying content and belief susceptibility. Typically, they are created by minimally editing existing questions so they become straightforward trivia or common-sense prompts.  · merged: matched control questions

### UnifiedQA  [1 docs, x2] [judged-distinct]
A question-answering model family trained to handle many QA formats. It is one of the systems evaluated for average truthfulness in the comparison shown.

### 真实性  [1 docs, x2] [new]  · aliases: truthfulness
一种回答性质，要求回答不去断言错误陈述。它允许拒答、表达不确定性，或给出真实但与问题无关的答案。

### 信息性  [1 docs, x2] [judged-distinct]  · aliases: informativeness
一种回答性质，表示回答提供了能够减少问题所引起不确定性的有用信息。它强调答案不仅要真实，还要对提问者有实质帮助。

### filtered questions  [1 docs, x2] [new]
Questions that were tested against a target model and removed if the model consistently answered them correctly under multiple sampled generations. They are intended to preserve only items that remain difficult for the target model.

### unfiltered questions  [1 docs, x2] [judged-distinct]
Questions created using the same adversarial experience but not tested against the target model before inclusion. They are kept as part of the benchmark without model-based filtering.

### Truthfulness score  [1 docs, x2] [judged-distinct]  · aliases: truthfulness score
一种用于衡量答案真实性的评分指标。它等于真实答案的总归一化似然，并在所有真实和错误参考答案之间进行归一化，以反映模型对正确回答的偏好程度。

### non-imitative weakness  [1 docs, x2] [judged-distinct]
A model property that causes falsehoods for reasons not driven by imitation, such as sensitivity to the syntax or style of a question. It leads the model to produce non-imitative falsehoods.

### commonsense reasoning  [1 docs, x2] [new]
Reasoning that relies on everyday knowledge about how the world works. It involves inferring implicit facts, likely outcomes, or plausible relationships that are not stated directly.

### symbolic reasoning  [1 docs, x2] [new]
Reasoning over symbols, rules, or formal structures rather than direct surface patterns. It often requires applying explicit transformations or logical operations to derive an answer.

### SVAMP dataset  [1 docs, x2] [new]  · aliases: SVAMP
SVAMP is a benchmark dataset of math word problems designed to test reasoning under lexical and structural variations. It evaluates how well models generalize across different surface forms and problem organizations while still solving the underlying arithmetic task.  · merged: SVAMP

### ASDiv dataset  [1 docs, x2] [judged-distinct]  · aliases: ASDiv
ASDiv is a benchmark dataset of diverse arithmetic word problems. It is used to evaluate mathematical reasoning and generalization across different problem types and linguistic formulations typical of grade-school style questions.  · merged: ASDiv

### equation-only prompting  [1 docs, x2] [judged-distinct]  · aliases: Equation only
A prompting variant that asks a model to output only a mathematical equation before giving the answer. It is useful when the problem can be directly translated into an equation, but it lacks the natural-language reasoning steps of chain-of-thought prompting.

### LaMDA 137B  [1 docs, x2] [judged-distinct]  · aliases: LaMDA
A 137-billion-parameter language model variant used for evaluating prompting methods. It is a large pretrained conversational model that can be assessed on reasoning benchmarks.

### 语言模型对齐  [1 docs, x2] [judged-distinct]  · aliases: aligning language models, 对齐语言模型, alignment of language models
使语言模型的行为与人类意图、偏好以及安全约束相一致的过程，核心是确保其输出既有帮助又诚实，并避免误导与有害内容。它通常通过减少有害行为、提升有用性，并防止目标设定不当导致的“奖励黑客”等失败模式来实现。  · merged: alignment of language models

### supervised learning baseline  [1 docs, x2] [new]  · aliases: supervised policy
通过监督学习在示范数据上训练得到的策略模型，学习在给定输入下生成期望输出。它以人类期望行为的示范为训练依据，常作为后续优化（如强化学习微调）的初始策略与性能基准。  · merged: supervised policy

### personally identifiable information  [1 docs, x2] [new]  · aliases: PII
Information that can be used to identify a specific individual, either by itself or when combined with other data. It is often filtered or protected to reduce privacy and security risks.

### few-shot prompt  [1 docs, x2] [judged-distinct]  · aliases: few-shot prompting
A prompt that includes a small number of example input-output pairs to condition a language model’s behavior. It is used to improve performance on a task without updating the model’s parameters.

### hallucination rate  [1 docs, x2] [judged-distinct]
A measure of how often a model produces information that is not supported by the input or available context. It is used to quantify factual overgeneration in tasks where answers should remain grounded in the source material.

### labelers  [1 docs, x2] [new]  · aliases: labeler
Labelers are people who annotate examples, judgments, or model outputs according to predefined criteria for training and/or evaluation. They may be screened or selected to ensure reliability on the specific annotation tasks they perform, and their judgments can provide supervision for preference learning and alignment methods.  · merged: labeler

### FLAN  [1 docs, x2] [judged-distinct]  · aliases: FLAN, T0
一种将多种自然语言处理任务与对应的自然语言指令组合起来的训练集合，用于训练模型更好地理解并执行指令式提示，提升其跨任务的指令跟随能力。  · merged: T0

### trigger phrase  [1 docs, x2] [new]  · aliases: trigger phrases
A trigger phrase is a specially chosen phrase used to elicit or probe particular model behavior. In data filtering, trigger phrases can be used to identify documents that a language model is especially likely to reproduce.

### MMLU  [1 docs, x2] [new]  · aliases: Massive Multitask Language Understanding
MMLU is a benchmark of multitask multiple-choice question answering covering a broad range of subjects and difficulty levels. It is used to evaluate a model's general knowledge and reasoning across many domains.

### Perplexity Distillation  [1 docs, x2] [judged-distinct]  · aliases: PDist, Leave-one-out Perplexity Distillation
Perplexity Distillation 是一种用于训练检索器的损失目标，通过考察在删除单个已检索文档后语言模型输出对数概率（或困惑度）如何变化来构造监督信号。它将移除每个文档后输出对数概率的下降幅度作为文档相关性分数，经 Softmax 形成文档后验分布，并最小化该分布与检索器预测文档分布之间的 KL 散度，从而促使检索器学会选择能显著降低模型困惑度的文档。  · merged: Leave-one-out Perplexity Distillation

### Query-side fine-tuning  [1 docs, x2] [judged-distinct]  · aliases: query-side finetuning
A retrieval training strategy that fine-tunes only the query encoder (or query representation side) while keeping the document encoder fixed after indexing. Since document embeddings remain unchanged, the existing document index need not be rebuilt immediately, avoiding extra indexing or refresh computation overhead.  · merged: query-side finetuning

### utilization  [1 docs, x2] [new]
The use of a trained large language model to carry out downstream applications and user-facing tasks. It covers how the model is applied after development, including practical deployment and task execution.

### capacity evaluation  [1 docs, x2] [judged-distinct]  · aliases: capability evaluation
Capability evaluation is the assessment of what a language model can do, including its abilities, limitations, and performance across tasks. It is conducted using benchmarks, experiments, and other empirical tests to measure competence and compare different systems, clarifying what the model can and cannot achieve.  · merged: capability evaluation

### 神经语言模型  [1 docs, x2] [judged-distinct]  · aliases: NLM, neural language model, 神经概率语言模型
神经语言模型是一种用神经网络估计词序列概率的语言模型，通常通过学习分布式表示与非线性映射来进行词预测。它将语言建模与表示学习结合，使模型能够从数据中自动提取特征并支持端到端训练，从而为上下文表示提升及下游任务迁移提供基础。  · merged: 神经概率语言模型

### Word2vec  [1 docs, x2] [judged-distinct]
Word2vec is a method for learning dense word representations from text. It produces static word embeddings that capture semantic regularities from distributional context.

### GPT-4  [1 docs, x2] [judged-distinct]
GPT-4 is a large language model designed for high-capacity text generation and reasoning-style language tasks. It builds on scaling language models to support a broad set of real-world applications.

### task-agnostic feature learner  [1 docs, x2] [new]  · aliases: task-agnostic representation
任务无关的特征学习器是一种不针对单一下游任务专门设计的通用表示学习模型，能够学习可复用的特征表示。其目的在于减少为每个任务分别进行特征工程的需求，并将学到的表示迁移到多种应用中使用。  · merged: task-agnostic representation

### downstream task  [1 docs, x2] [judged-distinct]  · aliases: downstream tasks, 下游任务
下游任务是指在预训练或通用表示学习之后，模型被用于解决的具体应用任务，通常依赖已有表示，并通过微调或提示等方式进行适配。此类任务的表现常被用来评估模型的实际可用性与泛化能力。  · merged: 下游任务

### artificial general intelligence  [1 docs, x2] [new]  · aliases: AGI
一种具备广泛通用认知能力的人工智能形态，能够在多种任务和环境中灵活表现。它通常被视为超越单一任务专用系统的长期目标。

### irreducible loss  [1 docs, x2] [new]
The portion of prediction loss that cannot be removed even by an ideal model because it reflects the intrinsic uncertainty of the true data-generating process. It is identified with the entropy of the true data distribution.

### Chinchilla scaling law  [1 docs, x2] [judged-distinct]  · aliases: Chinchilla law
An empirical scaling law for language model training that relates loss to model size and data size, with coefficients fitted from experiments. It is used to derive compute-optimal allocations of training resources between parameters and tokens.

### compute-optimal scaling law  [1 docs, x2] [judged-distinct]  · aliases: scaling law, KM scaling law
用于分析在固定计算预算下如何在模型规模与数据规模之间分配资源的缩放规律。它通常给出当可用计算变化时，最优模型规模与数据规模之间的幂律关系，从而最大化训练效率或最终性能。一般而言，预算更高时会更偏向将计算分配给模型参数规模而非数据规模。  · merged: KM scaling law

### data-constrained regime  [1 docs, x2] [judged-distinct]
一种训练环境，其中可用于训练的数据量成为主要限制因素。该情形下，模型规模继续扩大时，数据不足会显著影响缩放效果。

### data repetition  [1 docs, x2] [new]
在训练中重复使用已有数据样本的做法。它常用于缓解数据不足，但也可能改变模型对数据分布的学习方式。

### phase transition  [1 docs, x2] [new]
A phase transition is a sudden change in a system’s behavior when a control variable crosses a critical point. In machine learning, it is used by analogy to describe abrupt appearances of new capabilities as model scale increases.

### lost in the middle effect  [1 docs, x2] [new]  · aliases: lost in the middle, middle-of-context degradation
长上下文性能现象：当与任务相关的信息出现在输入上下文的中间位置时，模型的表现更容易下降。模型往往更能利用开头或结尾附近的信息，但对既不靠近开端也不靠近末端的关键信息获取与利用不足，因而中部信息处理效果更差。  · merged: middle-of-context degradation

### answer-containing document  [1 docs, x2] [judged-distinct]  · aliases: relevant document, document containing the answer
A document in a multi-document question answering input that contains the information needed to answer the question. The model must identify and use this document’s contents, and its position within the input context may vary while evaluating performance.  · merged: document containing the answer

### distractor document  [1 docs, x2] [judged-distinct]  · aliases: distractor documents, distractor passages
A distractor document is a document or passage included in a multi-document retrieval or question-answering input that does not contain the target answer. It is used to make retrieval and answer selection more difficult by adding irrelevant or misleading competing context.  · merged: distractor passages

### GPT-3.5-Turbo  [1 docs, x2] [judged-distinct]  · aliases: GPT-3.5 Turbo
A closed language model accessed through the OpenAI API. It is used as a chat-oriented model for generating responses to prompts.

### oracle setting  [1 docs, x2] [judged-distinct]
An evaluation setting in which the model is supplied with the relevant evidence needed to answer the question. It is used to estimate performance when the necessary information is available without retrieval or search difficulty.

### Hallucination detection  [1 docs, x2] [judged-distinct]
Hallucination detection is the process of identifying whether generated text contains unsupported or nonfactual content. It aims to improve the trustworthiness of model outputs by flagging statements that are inconsistent with evidence or known facts.

### Large vision-language models  [1 docs, x2] [judged-distinct]  · aliases: vision-language models, large vision-language model
Large vision-language models are multimodal large models that jointly process visual and textual information. They combine image and text to support both understanding and generation conditioned on visual inputs, but may exhibit cross-modal alignment issues such as hallucinations.  · merged: large vision-language model

### Factuality  [1 docs, x2] [new]
Factuality is the degree to which generated content matches verifiable facts. In language generation, it is a key quality dimension because fluent text can still be wrong if it is not factually grounded.

### Faithfulness  [1 docs, x2] [new]
Faithfulness is the degree to which generated content is supported by the provided source information or evidence. It is commonly used to assess whether model outputs stay aligned with the input context or retrieved documents.

### intrinsic hallucination  [1 docs, x2] [new]
Intrinsic hallucination is a type of hallucination in which generated output contradicts the source content. It occurs when the model produces content that is incompatible with the information it was given.

### extrinsic hallucination  [1 docs, x2] [judged-distinct]
Extrinsic hallucination is a type of hallucination in which generated output cannot be verified from the source content. It occurs when the model introduces information that is not supported by the provided evidence.

### instruction inconsistency  [1 docs, x2] [judged-distinct]
Instruction inconsistency is a form of faithfulness hallucination in which the generated content deviates from the user’s original instruction. It occurs when the output fails to follow requested constraints, goals, or directions.

### context inconsistency  [1 docs, x2] [judged-distinct]
Context inconsistency is a form of faithfulness hallucination in which the generated content conflicts with the provided context. It occurs when the output does not align with information that should be grounded in the preceding input or surrounding materials.

### logical inconsistency  [1 docs, x2] [judged-distinct]
Logical inconsistency is a form of faithfulness hallucination in which the generated content contains internal contradictions. It occurs when different parts of the output cannot all be true at the same time or do not fit together coherently.

### Hallucinations in LLMs  [1 docs, x2] [judged-distinct]  · aliases: LLM hallucinations, hallucinations, large language model hallucination
Hallucinations in large language models are generated texts that are factually incorrect, unfaithful, or otherwise not grounded in the provided context or user intent. The outputs often appear plausible, yet they are unsupported or inconsistent with reliable information. Hallucinations can stem from multiple underlying causes and are studied via distinct categories.  · merged: large language model hallucination

### Hallucination Detection Benchmarks  [1 docs, x2] [judged-distinct]  · aliases: 幻觉检测基准
幻觉检测基准（Hallucination detection benchmarks）是一类用于评估大语言模型是否产生幻觉的标准化测试集合。它们通常包含带标注的输入输出样本，用以衡量模型回答的事实一致性、真实性，以及其可检测的幻觉倾向，从而便于对不同检测方法进行对比评估。  · merged: 幻觉检测基准

### 解码阶段事实性增强  [1 docs, x2] [new]  · aliases: Factuality Enhanced Decoding, 解码阶段忠实性增强
一种在推理解码/生成过程中提升输出事实性与对输入内容忠实程度的方法。通过对候选词或候选序列进行约束、重排序或调整生成策略，使生成结果更贴合源信息，从而降低与输入不一致或无依据内容的出现。  · merged: 解码阶段忠实性增强

### 自回归预测  [1 docs, x2] [judged-distinct]  · aliases: Autoregressive Prediction
自回归预测是一种序列建模方式，模型基于前文的词元来逐步预测下一个词元，并将生成结果不断作为后续预测的上下文。它把序列生成建模为从历史到当前的条件概率估计，常用于大语言模型的预训练学习目标。  · merged: autoregressive prediction

### 事实矛盾  [1 docs, x2] [judged-distinct]  · aliases: Factual Contradiction
事实矛盾是指语言模型输出的内容与已知事实存在直接冲突，表现为可被现实信息识别的事实错误。它可同时体现为表面上与外界信息相“可支持”，但内容内部彼此矛盾或整体与真实情况不一致，从而导致回答在客观上错误。  · merged: Factual contradiction

### Relation-error hallucination  [1 docs, x2] [judged-distinct]
一种事实性幻觉，表现为模型在实体之间给出了错误的关系。它不是把对象本身说错，而是把对象之间的联系、归属或因果关系说错。

### overclaim hallucination  [1 docs, x2] [judged-distinct]  · aliases: over-claim hallucination
A subtype of factual fabrication in which a model states a claim more strongly or broadly than the available evidence supports. It involves overstating certainty, scope, or entitlement beyond what can be justified.

### adaptive benchmarking  [1 docs, x2] [judged-distinct]
A benchmarking approach that dynamically generates evaluation tasks tailored to a specific domain, use case, or target system. It aims to produce more relevant and diverse evaluations than fixed benchmark sets.

### LLM evaluator  [1 docs, x2] [judged-distinct]  · aliases: LLM evaluators, large language model evaluator
An LLM evaluator is a language model used as an automated judge to compare, score, or rank candidate text or system outputs. It assesses responses against defined evaluation criteria and can approximate human judgments, especially when human evaluation or gold labels are limited.  · merged: large language model evaluator

### 全局回答  [1 docs, x2] [judged-distinct]  · aliases: global answer, 全局答案
对用户查询给出的最终综合回答，通常由多个社区层级的摘要与中间答案逐步汇总而成。其目的是覆盖全局范围内与问题相关的信息，并在结构化表达中形成统一、可解释的结论。  · merged: 全局答案

### root-level community summaries  [1 docs, x2] [judged-distinct]  · aliases: root-level community summary
Summaries of the highest-level (topmost) communities in a graph-based hierarchy. They condense the broadest clusters into a small number of general descriptions, typically retaining the least detailed but most wide-ranging information for use in downstream retrieval or question answering.  · merged: root-level community summary

### text view  [1 docs, x2] [judged-distinct]
A representation of graph data that emphasizes the textual content attached to nodes, edges, or substructures. It allows a language model to process the graph as text while preserving the retrieved semantic information.

### hard prompts  [1 docs, x2] [judged-distinct]  · aliases: text tokens, hard prompt
Hard prompts are prompt inputs expressed as explicit, discrete text tokens rather than learned continuous vectors. They convey information to a language model directly in natural-language form and can be used to encode structured information, such as graph structure, through generated descriptions.  · merged: hard prompt

### multi-hop graph reasoning  [1 docs, x2] [judged-distinct]  · aliases: graph multi-hop reasoning
一种需要沿着图中多步连接路径逐步组合证据的推理任务。它要求跨越多个关系或节点传播并整合信息以得到最终结论，而不仅依赖单一局部信息。  · merged: graph multi-hop reasoning

### optimal subgraph  [1 docs, x2] [judged-distinct]  · aliases: ˆg, retrieved subgraph
An optimal subgraph is a selected portion of a larger graph that retains the structural information most relevant to a given task or query. It is used as a compact intermediate representation that can be encoded and then provided to another model for downstream prediction or generation.  · merged: retrieved subgraph

### 图嵌入  [1 docs, x2] [judged-distinct]  · aliases: graph embedding, graph embeddings
图嵌入是将图结构数据（节点、边及整体拓扑）映射为固定维度的向量表示，以保留其结构与可用信息。通过这种表示，图的信息被转化为可直接输入模型计算的形式（如神经网络），从而便于建模与比较。  · merged: graph embeddings

### Graph Neural Network  [1 docs, x2] [judged-distinct]  · aliases: GNN
A neural network architecture that computes representations for graph-structured data by passing messages along edges. It encodes topology through iterative aggregation of information from neighboring nodes and edges.

### Recall  [1 docs, x2] [judged-distinct]
一种评价指标，衡量系统找回的相关结果占全部相关结果的比例。它用于评估模型覆盖真实答案或目标实例的能力。

### LaBSE  [1 docs, x2] [judged-distinct]  · aliases: Language-agnostic BERT Sentence Embedding
一种跨语言句子嵌入模型，用于把不同语言的句子映射到共享向量空间。它常用于语义检索和跨语言匹配任务，以便检索语义相近的文本。

### mContriever  [1 docs, x2] [judged-distinct]  · aliases: mContriever-Base
mContriever 是一种用于密集检索的对比学习编码器，旨在将查询和文档表示到共享的嵌入空间中，从而学习二者的语义相似性以支持检索。它能够在跨语言场景下发现语义相关文本，尤其在缺乏显式词项匹配时也能找到相关内容。  · merged: mContriever-Base

### flat data representation  [1 docs, x2] [new]  · aliases: flat data representations
A data organization that stores information in a non-hierarchical, non-relational form. Such representations can make it difficult to preserve structure and interdependencies among pieces of information.

### text indexing  [1 docs, x2] [judged-distinct]
The process of organizing textual content so it can be searched and retrieved efficiently. Indexing often prepares documents or chunks for downstream retrieval systems.

### 双层检索框架  [1 docs, x2] [judged-distinct]  · aliases: dual-level retrieval framework, 双层检索范式
双层检索框架是一种将检索过程分为两个层次的框架，用于同时处理面向细节的查询与面向主题的查询。它在不同抽象层级组织检索：一层用于返回具体实体的精确信息，另一层用于汇总跨多个相关实体的高层语义。通过兼顾细粒度与高层次检索，提升回答的全面性和相关性。  · merged: 双层检索范式

### deduplication  [1 docs, x2] [judged-distinct]  · aliases: Deduplication to Optimize Graph Operations
Deduplication is the process of detecting and removing duplicate or near-duplicate representations of the same entity or relation across data segments, then merging or consolidating them. It reduces redundancy in the underlying index or graph, improving consistency and the efficiency of subsequent operations such as retrieval and graph processing.  · merged: Deduplication to Optimize Graph Operations

### entity  [1 docs, x2] [judged-distinct]
A distinct, nameable object or concept represented in a knowledge graph or retrieval system. Entities are used as retrieval targets when systems aim to fetch structured knowledge rather than raw text.

### Overall  [1 docs, x2] [judged-distinct]
一种综合评价维度，用于汇总前面多个维度的结果，以确定最终更优的答案。它反映的是跨维度的总体表现，而不是单一方面的优势。

### diversity metric  [1 docs, x2] [judged-distinct]  · aliases: Diversity metric
An evaluation measure that reflects how varied or wide-ranging system responses are. Higher diversity indicates that the system produces a broader spread of outputs rather than repetitive answers.

### 生成模块  [1 docs, x2] [judged-distinct]  · aliases: generation module, generative module
生成模块是检索增强系统中的组件，负责基于输入上下文与检索到的证据生成自然语言输出。它将选取到的信息转化为回应，力求使生成内容连贯且更有依据。但由于生成过程并非总是严格受证据约束，可能存在对检索事实使用不准确或不一致的情况。  · merged: generative module

### Query expansion  [1 docs, x2] [judged-distinct]
A retrieval technique that augments an initial query with additional terms or reformulations to improve document matching. It is used to increase the chance of retrieving relevant information, especially for ambiguous or underspecified queries.

### Contextual disambiguation  [1 docs, x2] [judged-distinct]
A technique for using surrounding context to resolve ambiguity in a query or term. It helps retrieval or understanding systems distinguish between multiple possible meanings and select more relevant evidence.

### METRAG  [1 docs, x2] [judged-distinct]  · aliases: METRAG (Gan et al. 2024), thoughts-enhanced retrieval-augmented generation
METRAG is a multi-layer retrieval-augmented generation framework that improves final generation by inserting intermediate thought-like representations between retrieval and output. It combines document similarity with utility signals, using summarization to condense the intermediate reasoning content. The approach aims to organize evidence, strengthen reasoning, and produce more informed, utility-oriented responses.  · merged: thoughts-enhanced retrieval-augmented generation

### Meta Knowledge Summary  [1 docs, x2] [new]  · aliases: MK Summary
A summary representation produced for clusters of related documents to capture shared higher-level information. It is used to improve retrieval-augmented generation by giving the system compact metadata-style knowledge about a document group.

### CommunityKG-RAG  [1 docs, x2] [judged-distinct]
A zero-shot retrieval-augmented generation framework that uses community knowledge graphs to support generation. It is presented as a recent method for improving retrieval and grounding without task-specific training.

### LA-RAG  [1 docs, x2] [judged-distinct]
A retrieval-augmented generation paradigm developed to improve automatic speech recognition within large language models. It incorporates external retrieved information to support more accurate transcription and recognition outcomes.

### automatic speech recognition  [1 docs, x2] [new]  · aliases: ASR
A technology that converts spoken language into written text. It is used to transcribe audio by modeling acoustic and linguistic patterns from speech input.

### domain-specific knowledge  [1 docs, x2] [new]  · aliases: domain knowledge
Domain-specific knowledge is specialized information about a particular field or subject area, including relevant facts, relationships, and conventions. It is often too specialized or scattered to be captured reliably by general-purpose methods alone, so it may be added or supplied to improve performance on tasks in that domain.  · merged: domain knowledge

### semantic units  [1 docs, x2] [judged-distinct]  · aliases: semantic unit
Semantic units are coherent pieces of meaning in text—such as a phrase, sentence, or paragraph—that function as a whole. Preserving them helps maintain interpretability and continuity, supporting logical flow and accurate understanding when text is processed or summarized.  · merged: semantic unit

### parent-child relationships  [1 docs, x2] [new]  · aliases: hierarchical organization
A hierarchical organization pattern that arranges information into levels of abstraction, where broader concepts contain or group more specific ones as child nodes. It provides a structured alternative to flat lists by supporting clearer navigation and improving retrieval by linking higher-level summaries to underlying details.  · merged: hierarchical organization

### post-retrieval process  [1 docs, x2] [judged-distinct]  · aliases: Post-retrieval
The set of operations performed after relevant content has been retrieved but before final output. It typically filters, reranks, or restructures the retrieved information, often incorporating metadata, to make it more useful for downstream generation by a language model.  · merged: Post-retrieval

### 多样上下文生成  [1 docs, x2] [judged-distinct]  · aliases: diverse context generation, GAR
一种在检索前通过生成多种多样相关上下文来扩展查询语义的方法。它将原始查询在不同方面进行补充，从而提升后续检索的召回与准确性，并可用于增强基于如BM25的检索效果。  · merged: GAR

### 混合检索方法  [1 docs, x2] [judged-distinct]  · aliases: hybrid approach, Hybrid Retrieval
混合检索方法是一种在同一检索系统中结合多种检索技术的策略，常见做法是把不同类型的检索方法（如图结构与文本/语义检索等）相互补充以提升效果。它通常通过先快速缩小候选集、再进行更精确的重排序来兼顾检索效率与结果质量，从而提升召回率、精确度与鲁棒性。  · merged: Hybrid Retrieval

### Retrieval Strategy  [1 docs, x2] [judged-distinct]
The overall scheme used to organize and conduct retrieval in a system. It determines how queries are processed, how candidate evidence is selected, and how retrieved information is assembled for downstream use.

### 卷积神经网络  [1 docs, x1] [new]  · aliases: convolutional neural networks
一种利用局部卷积运算提取特征的神经网络架构。它擅长利用局部结构信息，但在序列建模中通常需要额外机制来处理长距离依赖。

### 缩放点积注意力  [1 docs, x1] [new]  · aliases: scaled dot-product attention
一种注意力计算方式，先对查询和键做点积，再用缩放因子调节数值大小以稳定训练。它是许多现代注意力模型中的基础计算单元。

### 英语成分句法分析  [1 docs, x1] [new]  · aliases: English constituency parsing
一种句法分析任务，目标是把英语句子解析成短语结构树，标出句子的成分层次关系。它常用于测试模型对结构化语言信息的建模能力。

### 模型集成  [1 docs, x1] [new]  · aliases: ensembles
一种将多个模型的预测结果组合起来以提升整体性能的方法。它通常比单个模型更稳健，但计算成本也更高。

### Tensor2Tensor  [1 docs, x1] [new]  · aliases: tensor2tensor
An open-source library for deep learning research that provides reusable implementations of models, data pipelines, and training utilities. It was widely used to build, test, and compare sequence-modeling systems and related neural network variants.

### 门控循环神经网络  [1 docs, x1] [judged-distinct]  · aliases: gated recurrent neural network, GRNN
一种循环神经网络结构，利用门控机制控制信息在时间上的保留与更新。它通过更灵活地调节状态传播，增强了对长距离依赖的建模能力。

### 序列建模  [1 docs, x1] [new]
一种机器学习任务，目标是对按顺序排列的符号、事件或观测进行建模，并捕捉其中的依赖关系。它广泛用于语言、翻译和其他需要处理序列输入输出的场景。

### 转导问题  [1 docs, x1] [new]  · aliases: transduction problems
一类将输入序列映射为输出序列的任务，输出长度可以与输入长度不同。其核心在于学习输入与输出之间的对齐和依赖关系。

### 并行化  [1 docs, x1] [new]
一种将计算分配到多个位置、样本或设备上同时执行的方法，以提高训练或推理效率。对于序列模型而言，并行化通常受限于按时间步递归计算的结构。

### Extended Neural GPU  [1 docs, x1] [judged-distinct]
一种通过卷积式计算并行处理序列位置的神经网络模型，旨在减少序列计算中的顺序依赖。它属于试图降低长序列处理开销的一类架构。

### 端到端记忆网络  [1 docs, x1] [judged-distinct]  · aliases: end-to-end memory networks
一种基于递归注意力机制的神经网络结构。它通过多轮注意和记忆交互来处理输入，曾在简单语言问答和语言建模任务中表现良好。

### 自回归  [1 docs, x1] [new]  · aliases: auto-regressive
一种逐步生成的建模方式，其中当前输出会把先前已经生成的输出作为额外输入。它适用于需要按顺序预测后续元素的序列生成任务。

### 多头自注意力机制  [1 docs, x1] [judged-distinct]  · aliases: multi-head self-attention
一种注意力机制，它把输入表示映射到多个并行的注意力头，再将各头结果合并。它能够让模型从不同表示子空间中同时捕捉序列内部的依赖关系。

### 逐位置前馈网络  [1 docs, x1] [new]  · aliases: position-wise fully connected feed-forward network
一种对序列中每个位置独立应用的全连接前馈网络。它不在位置之间共享计算路径，主要用于对每个位置的表示进行非线性变换。

### 残差连接  [1 docs, x1] [new]  · aliases: residual connection
一种将层输入直接与层输出相加的结构，用于改善深层网络的梯度传播与训练稳定性。它允许子层在保留原始信息的同时学习增量式变换。

### 层归一化  [1 docs, x1] [judged-distinct]  · aliases: LayerNorm
一种对单个样本的特征维度进行归一化的技术，用于稳定神经网络训练。它通常与残差连接配合使用，以控制激活尺度并加速优化。

### 查询  [1 docs, x1] [judged-distinct]  · aliases: query
注意力机制中的向量，用于表示当前需要检索的信息。它与键进行匹配，以决定应从哪些值中聚合信息。

### Dot-Product Attention  [1 docs, x1] [judged-distinct]  · aliases: multiplicative attention, dot product attention
一种以查询和键之间的点积作为兼容性函数的注意力机制，用于计算每个值的权重。它的计算通常可以通过高效的矩阵乘法实现，因此在实践中具有较好的速度和空间效率。

### Additive Attention  [1 docs, x1] [judged-distinct]  · aliases: additive attention
一种注意力机制，通过带单个隐藏层的前馈网络来计算查询与键之间的兼容性函数，从而为各个值分配权重。它在小维度情况下通常与点积注意力表现相近，但在较大维度下往往更稳定。

### attention function  [1 docs, x1] [judged-distinct]  · aliases: attention
The attention function computes weighted combinations of values based on the compatibility between queries and keys. It allows a model to focus on the most relevant parts of its input when producing an output.

### variance  [1 docs, x1] [new]
Variance is a measure of how widely a random variable’s values are spread around its mean. In probability and statistics, it quantifies the expected squared deviation from the average value.

### independent random variable  [1 docs, x1] [new]  · aliases: independent random variables
An independent random variable is a random variable whose outcomes are not influenced by the outcomes of another random variable. Independence allows the joint behavior of variables to be analyzed as the product of their separate behaviors.

### auto-regressive property  [1 docs, x1] [new]
A property of sequence generation in which each position may depend only on earlier positions. It is preserved by preventing a decoder position from attending to future positions.

### Linear Transformation  [1 docs, x1] [judged-distinct]
A linear transformation maps an input vector through a learned weight matrix, often with an added bias term. In neural networks, it is used to change the representation of features without introducing nonlinearity by itself.

### ReLU Activation  [1 docs, x1] [new]
ReLU, or rectified linear unit, is a nonlinear activation function that outputs the input when it is positive and zero otherwise. It is commonly used to introduce nonlinearity between linear layers in neural networks.

### Convolution with Kernel Size 1  [1 docs, x1] [new]
A convolution with kernel size 1 operates independently at each position using the same set of learned parameters. It is often equivalent to a position-wise linear transformation applied across sequence positions.

### Weight Sharing  [1 docs, x1] [new]  · aliases: shared weight matrix
Weight sharing is a parameter-sharing scheme in which the same weight matrix is used in multiple parts of a model. It reduces the number of learned parameters and can tie the geometry of related representations together.

### Pre-Softmax Linear Transformation  [1 docs, x1] [judged-distinct]
A pre-softmax linear transformation is a learned linear layer applied to model outputs before the softmax function. It converts hidden representations into scores over the target vocabulary or class set.

### computational complexity per layer  [1 docs, x1] [new]  · aliases: computational complexity
The amount of computation required to execute one layer of a neural network. It is used to compare how expensive different layer types are as sequence length changes.

### path length  [1 docs, x1] [new]
The number of computational steps a signal must traverse between two positions in a network. Shorter path lengths make it easier for information and gradients to move between distant parts of a sequence.

### maximum path length  [1 docs, x1] [judged-distinct]
The longest path length between any two positions in a network. It summarizes the worst-case distance that information or gradients must traverse across input and output positions.

### sequential operations  [1 docs, x1] [new]
Operations that must be executed one after another rather than in parallel. The number of sequential operations determines how much of a layer can be parallelized on a given computation device.

### parallelization  [1 docs, x1] [judged-distinct]
The extent to which computations can be carried out simultaneously instead of in a strict sequence. Higher parallelization generally reduces the time needed to process a layer or sequence.

### dilated convolution  [1 docs, x1] [new]  · aliases: atrous convolution
A convolutional operation that inserts gaps between sampled input positions within a kernel. By enlarging the receptive field without proportionally increasing the number of parameters, it can connect distant positions more efficiently than standard contiguous convolution.

### separable convolution  [1 docs, x1] [new]  · aliases: depthwise separable convolution
A convolutional design that factorizes a standard convolution into simpler operations, typically a depthwise step followed by a pointwise step. This lowers computational cost compared with a full convolution of the same kernel width.

### WMT 2014 English-German dataset  [1 docs, x1] [new]  · aliases: WMT 2014 En-De dataset
A benchmark machine translation dataset of English-German sentence pairs from the 2014 Workshop on Machine Translation. It is commonly used to train and evaluate translation models on a standard parallel corpus.

### WMT 2014 English-French dataset  [1 docs, x1] [judged-distinct]  · aliases: WMT 2014 En-Fr dataset
A large machine translation dataset of English-French sentence pairs from the 2014 Workshop on Machine Translation. It provides a high-volume parallel corpus for training and evaluating translation systems.

### sentence-pair batching  [1 docs, x1] [new]  · aliases: sentence pairs batched together
A batching strategy that groups paired input and target sentences together for training. Pairs are assembled so that examples of similar length can be processed efficiently in the same batch.

### approximate sequence length  [1 docs, x1] [new]
A rough measure of how long a token sequence is, used to group examples with similar lengths. It improves computational efficiency by reducing padding and balancing batch sizes.

### source token  [1 docs, x1] [new]
A token belonging to the input side of a sequence-to-sequence training example. Source tokens are the tokens the model conditions on when producing the target output.

### target token  [1 docs, x1] [judged-distinct]
A token belonging to the output side of a sequence-to-sequence training example. Target tokens are the tokens the model is trained to predict given the source input.

### inverse square root decay  [1 docs, x1] [new]  · aliases: inverse square root
A learning-rate decay pattern in which the rate decreases proportionally to the inverse square root of the training step. It produces a slow decline that can remain effective during long training runs.

### regularization  [1 docs, x1] [new]
A set of techniques used during training to reduce overfitting and improve generalization. Regularization methods typically constrain model behavior or add noise so the model does not memorize the training data too closely.

### newstest2014  [1 docs, x1] [judged-distinct]
一个常用的机器翻译测试集，包含用于基准评测的新闻领域句子。它经常被用来比较不同翻译系统在英语到德语或英语到法语任务上的表现。

### Residual Dropout  [1 docs, x1] [judged-distinct]
一种在残差连接中使用的正则化方法，先对每个子层的输出施加 dropout，再将其与子层输入相加并归一化。它还可用于嵌入与位置编码之和，以减少过拟合并提升模型泛化能力。

### 基准模型  [1 docs, x1] [new]  · aliases: base model
Transformer 架构的较小配置版本，作为性能和成本比较的参考实现。它通常使用较少的参数和更低的训练开销，便于评估模型设计变化带来的影响。

### 束搜索  [1 docs, x1] [judged-distinct]  · aliases: beam search
一种序列解码算法，在生成过程中保留若干个最有希望的候选序列，而不是只选择单一路径。它常用于机器翻译等任务，以在搜索效率和生成质量之间取得平衡。

### 长度惩罚  [1 docs, x1] [judged-distinct]  · aliases: length penalty
一种在序列解码中调整候选输出长度的评分机制，用来避免模型偏好过短或过长的结果。它通常与束搜索配合使用，以改善生成序列的整体质量。

### K80  [1 docs, x1] [new]  · aliases: Tesla K80
K80 is a graphics processing unit model used for parallel computation. It is commonly referenced as a high-performance accelerator in computing systems.

### K40  [1 docs, x1] [judged-distinct]  · aliases: Tesla K40
K40 is a graphics processing unit model used for parallel computation. It is commonly referenced as a high-performance accelerator in computing systems.

### M40  [1 docs, x1] [judged-distinct]  · aliases: Tesla M40
M40 is a graphics processing unit model used for parallel computation. It is commonly referenced as a high-performance accelerator in computing systems.

### TFLOPS  [1 docs, x1] [new]  · aliases: teraFLOPS
TFLOPS is a unit of computing performance equal to one trillion floating-point operations per second. It is used to express the throughput of processors and accelerators.

### attention value dimension  [1 docs, x1] [judged-distinct]  · aliases: dv
The dimensionality of the value vectors used in an attention head. It determines the size of the information returned by attention and influences both model capacity and computation.

### compatibility function  [1 docs, x1] [judged-distinct]
A compatibility function computes how well a query matches a key in attention-based models. It produces the score used to weight values, and different forms can change the expressiveness of the attention mechanism.

### English constituency parsing  [1 docs, x1] [new]  · aliases: constituency parsing
English constituency parsing is the task of predicting the phrase-structure tree of an English sentence. It groups words into nested constituents and must satisfy strong structural constraints on the output.

### Wall Street Journal portion of the Penn Treebank  [1 docs, x1] [new]  · aliases: WSJ portion of the Penn Treebank, WSJ, Penn Treebank
The Wall Street Journal portion of the Penn Treebank is a standard annotated English text corpus used for parsing and other natural language processing experiments. It provides sentence-level data with phrase-structure annotations for training and evaluation.

### semi-supervised setting  [1 docs, x1] [new]
A semi-supervised setting is a training regime that combines a smaller labeled dataset with additional unlabeled or weakly labeled data. It is used to improve model performance when fully annotated data are limited.

### BerkeleyParser corpora  [1 docs, x1] [new]  · aliases: BerkleyParser corpora
BerkeleyParser corpora are large parsed text corpora associated with the BerkeleyParser pipeline. They are used as additional training data, often with high-confidence parses, to improve supervised models.

### beam size  [1 docs, x1] [judged-distinct]  · aliases: beam
Beam size is the number of partial hypotheses retained during beam search decoding. Larger beams can improve search quality at the cost of greater computation.

### 双向表示  [1 docs, x1] [new]  · aliases: 双向语言表示
一种同时利用目标位置左侧和右侧上下文来构建文本表示的方法。与只依赖单向上下文的表示相比，它通常能更全面地编码词语或句子的语义信息。

### 语言表示模型  [1 docs, x1] [judged-distinct]  · aliases: 语言表示
一种把文本映射到向量表示的模型，用于捕获词语、句子或篇章中的语义和上下文信息。它们常被预训练后用于分类、问答和推断等下游自然语言处理任务。

### MultiNLI  [1 docs, x1] [new]  · aliases: Multi-Genre Natural Language Inference
一个多领域自然语言推断数据集，用于评估模型在不同文本域中的句子关系判断能力。它包含来自多个体裁的句子对，并考察模型的泛化能力。

### feature-based approach  [1 docs, x1] [judged-distinct]
一种将预训练语言表示作为附加特征接入下游任务模型的方法。任务特定架构保持独立，预训练参数通常不直接在下游任务中整体更新，而是由外部模型利用这些表示进行学习。

### bidirectional pre-training  [1 docs, x1] [new]
A pre-training approach that learns language representations from both left and right context. It is designed to produce contextual embeddings that can use information from the entire surrounding sentence rather than only earlier words.

### shallow concatenation  [1 docs, x1] [new]
A representation strategy that combines separately trained left-to-right and right-to-left language model outputs with a simple concatenation. It merges directional information without fully integrating the two contexts throughout the model.

### discriminative context objective  [1 docs, x1] [judged-distinct]  · aliases: objectives to discriminate correct from incorrect words in left and right context
A training objective that learns word representations by distinguishing correct words from incorrect words using both left and right context. It encourages embeddings to encode contextual compatibility rather than only local prediction from one side.

### sentence embeddings  [1 docs, x1] [judged-distinct]
Vector representations of entire sentences that summarize their meaning in a fixed-dimensional form. They are used to represent sentences for comparison, retrieval, or as input to later models.

### paragraph embeddings  [1 docs, x1] [judged-distinct]
Vector representations of paragraphs that encode the meaning of a longer span of text in a single fixed-size representation. They are designed to support tasks that require information aggregated over multiple sentences.

### candidate next sentence ranking  [1 docs, x1] [judged-distinct]  · aliases: rank candidate next sentences
A training objective that learns sentence representations by scoring and ordering possible next sentences. It teaches a model to prefer the sentence that is most coherent or likely to follow a given context.

### next-sentence word generation  [1 docs, x1] [judged-distinct]  · aliases: left-to-right generation of next sentence words given a representation of the previous sentence
A training objective in which a model generates the words of a following sentence from a representation of the previous sentence. It trains sentence embeddings to support sequence generation conditioned on prior context.

### right-to-left language model  [1 docs, x1] [judged-distinct]
A language model that predicts words using the context that follows them in a sequence. It complements left-to-right modeling by encoding information from later context.

### sentence encoder  [1 docs, x1] [judged-distinct]  · aliases: sentence encoders
A model that maps a sentence into a fixed or contextualized vector representation. Sentence encoders are often pre-trained on unlabeled text and then adapted to supervised tasks.

### supervised downstream task  [1 docs, x1] [new]  · aliases: downstream task, supervised downstream tasks
A target task learned with labeled data after a model has been pre-trained on unlabeled data. Fine-tuning on downstream tasks adapts general representations to a specific application.

### left-to-right language model  [1 docs, x1] [judged-distinct]  · aliases: left-to-right language models
A language model that predicts each token using only the tokens that come before it in the sequence. This autoregressive factorization is commonly used for text generation and next-token prediction.

### 双向 Transformer 编码器  [1 docs, x1] [judged-distinct]  · aliases: bidirectional Transformer encoder
一种允许每个位置同时利用左侧和右侧上下文的 Transformer 编码器。与只使用单向上下文的编码方式相比，它能够形成更完整的上下文表示。

### left context  [1 docs, x1] [new]
The portion of a sequence that appears before a given token. In autoregressive models, it is the available context that a token may attend to when future positions are masked out.

### segment embeddings  [1 docs, x1] [judged-distinct]  · aliases: sentence embeddings
Learned embeddings that identify which segment of an input sequence each token belongs to. They are used to distinguish tokens from sentence A and sentence B in paired inputs.

### deep bidirectional representation  [1 docs, x1] [judged-distinct]  · aliases: deep bidirectional model
A contextual representation learned from both left and right contexts at multiple layers. It is designed to capture richer dependencies than models that only use one direction or a shallow combination of directions.

### monolingual corpus  [1 docs, x1] [new]
A collection of text written in a single language. It can be used to generate self-supervised training examples, such as sentence-pair prediction data, without manual labeling.

### IsNext  [1 docs, x1] [new]
A label used in next sentence prediction indicating that the second sentence is the actual sentence that follows the first one in the original corpus. It marks positive examples in the binary classification task.

### NotNext  [1 docs, x1] [judged-distinct]
A label used in next sentence prediction indicating that the second sentence is a random sentence rather than the true continuation of the first. It marks negative examples in the binary classification task.

### BERT input representation  [1 docs, x1] [judged-distinct]  · aliases: BERT输入表示
BERT的输入表示是将词元嵌入、句段嵌入和位置嵌入相加得到的表示方式。它用来同时编码词元身份、句子对所属片段以及顺序信息，以供模型后续处理。

### 词元嵌入  [1 docs, x1] [judged-distinct]  · aliases: token embeddings
词元嵌入是将每个输入词元映射为可学习向量的表示方法。它负责编码词元本身的语义身份，是神经语言模型输入表示的基础组成部分。

### 句段嵌入  [1 docs, x1] [judged-distinct]  · aliases: segment embeddings
句段嵌入是用于区分输入序列中不同句段或文本片段的可学习向量。它常用于文本对任务中，帮助模型识别每个词元属于哪一段输入。

### 英语维基百科  [1 docs, x1] [new]  · aliases: English Wikipedia
英语维基百科是一个大规模的英文百科文本来源，常被用作预训练语料。它提供丰富的通用知识文本，并可抽取为连续的文段进行建模。

### 文档级语料库  [1 docs, x1] [new]  · aliases: document-level corpus
文档级语料库是以完整文档而不是打乱后的独立句子为单位组织的语料。它保留长距离上下文和相邻句子之间的连续性，适合抽取长连续序列进行预训练。

### 双向交叉注意力  [1 docs, x1] [judged-distinct]  · aliases: bidirectional cross attention
双向交叉注意力是一种让两个文本序列中的表示彼此互相关注的机制。它可在两个方向上建模跨序列对应关系，常用于文本对编码。

### BERT fine-tuning  [1 docs, x1] [judged-distinct]  · aliases: fine-tuning
The process of adapting a pre-trained BERT model to a specific downstream task by adding task-specific inputs and outputs and updating all parameters end-to-end. It reuses the pre-trained language representations while requiring relatively little additional training.

### sequence tagging  [1 docs, x1] [new]
A token-level prediction task in which a label is assigned to each token in an input sequence. It is used for tasks such as named entity recognition and other forms of structured text labeling.

### sentiment analysis  [1 docs, x1] [new]
A text classification task that predicts the emotional or opinion polarity expressed in a piece of text. It typically assigns labels such as positive or negative to an input sentence or document.

### final hidden state  [1 docs, x1] [new]  · aliases: final hidden vector, hidden vector
The final hidden state is the output vector produced by the last layer of a neural network for a given input position or token. In Transformer models, it carries contextual information from the entire input sequence and can be used as a learned representation for downstream tasks.

### classification layer  [1 docs, x1] [new]  · aliases: classificiation layer
A classification layer is the output layer of a model that maps an input representation to scores for a fixed set of labels. It typically contains a weight matrix, and its outputs are used to compute class probabilities and prediction losses.

### classification loss  [1 docs, x1] [judged-distinct]  · aliases: standard classification loss
Classification loss is an objective function used to train a model to assign the correct label among a fixed set of classes. It compares predicted class probabilities with the target label and provides the gradient signal for learning.

### BiLSTM+ELMo+Attn  [1 docs, x1] [new]  · aliases: BiLSTM + ELMo + Attn
A neural language understanding model that combines bidirectional LSTM layers, ELMo contextual embeddings, and an attention mechanism. It is used as a baseline architecture for benchmark tasks.

### WNLI  [1 docs, x1] [judged-distinct]  · aliases: Winograd NLI
A Winograd-style natural language inference task that requires resolving ambiguous pronoun references by reasoning over sentence context. It is used as a challenging entailment benchmark.

### Spearman correlation  [1 docs, x1] [new]  · aliases: Spearman's rho
A rank-based correlation coefficient that measures the strength of a monotonic relationship between two variables. It is often used to compare predicted and gold ordinal scores.

### random restart  [1 docs, x1] [new]  · aliases: random restarts
A repeated fine-tuning procedure in which training is started multiple times from the same pretrained checkpoint but with different data shuffling or parameter initialization. It is used to reduce sensitivity to unstable optimization and to select the best-performing run.

### single packed sequence  [1 docs, x1] [new]  · aliases: packed sequence
A single packed sequence is an input representation that concatenates multiple text segments into one model input while marking segment boundaries with different embeddings or segment identifiers. It allows a model to jointly encode related texts, such as a question and a passage, in one forward pass.

### start vector  [1 docs, x1] [new]  · aliases: S
A start vector is a learned parameter used to score each token for being the beginning of an answer span. It is combined with token representations, often by a dot product, to produce a distribution over possible start positions.

### end vector  [1 docs, x1] [judged-distinct]  · aliases: E
An end vector is a learned parameter used to score each token for being the end of an answer span. It is combined with token representations, often by a dot product, to produce a distribution over possible end positions.

### answer span  [1 docs, x1] [new]
An answer span is a contiguous sequence of tokens in a passage that constitutes the answer to a question. Span-based question answering systems identify the start and end positions of this segment rather than generating free-form text.

### candidate span scoring  [1 docs, x1] [judged-distinct]
Candidate span scoring is the process of assigning a score to each possible text span so that the best answer can be selected. In span-based extraction systems, the score is typically computed from the start and end position representations.

### 自训练方法  [1 docs, x1] [judged-distinct]  · aliases: self-training methods
一种通过利用模型自身产生的监督信号或伪标签来继续训练的学习方法。它常用于在缺少人工标注时扩大训练信号，并提升模型在下游任务上的效果。

### hyperparameter tuning  [1 docs, x1] [judged-distinct]
The process of adjusting training settings that are not learned directly from data, such as learning rate, batch size, or number of training steps. It is used to improve model performance and stability before or during training.

### Gaussian error linear unit  [1 docs, x1] [new]  · aliases: GELU
A smooth activation function that weights inputs by their probability under a Gaussian distribution before passing them through. It is used in neural networks as an alternative to rectified linear units.

### FAIRSEQ  [1 docs, x1] [new]
An open-source sequence modeling toolkit developed for training and evaluating neural network models on tasks such as machine translation and language modeling. It provides implementations and infrastructure for efficient experimentation with sequence-to-sequence and related architectures.

### Replication study  [1 docs, x1] [new]  · aliases: replication study
A study that attempts to reproduce the methods and results of an original experiment or system using the same or closely related setup. Replication studies are used to verify findings, compare implementations, and identify sources of discrepancy between reported results and reproduced outcomes.

### Adam epsilon term  [1 docs, x1] [judged-distinct]  · aliases: ε, epsilon
Adam 优化器中的一个数值稳定性参数。它加入到分母中以避免除零或过小值导致的不稳定更新，并且有时需要针对特定训练设置单独调节。

### β2 parameter  [1 docs, x1] [judged-distinct]  · aliases: beta2, β2
Adam 优化器中控制二阶矩指数滑动平均衰减速度的参数。它决定了历史平方梯度被记忆的程度，较大的取值常用于改善训练稳定性。

### mixed precision floating point arithmetic  [1 docs, x1] [new]  · aliases: mixed precision
一种训练计算方式，同时使用不同精度的浮点表示来平衡速度、显存占用和数值稳定性。它通常在高性能 GPU 上用于加速大规模模型训练。

### full-length sequences  [1 docs, x1] [new]  · aliases: full-length sequence
在语言模型预训练中始终使用达到最大长度的输入序列，而不是混合加入较短序列的训练方式。它用于保持训练目标和输入分布的一致性，并简化训练流程。

### OpenWebText  [1 docs, x1] [new]
An open-source recreation of the WebText corpus built from web content extracted from URLs shared on Reddit with at least three upvotes. It is used as a large-scale text corpus for language model pretraining.

### Stories dataset  [1 docs, x1] [new]  · aliases: STORIES
A dataset formed by filtering a subset of CommonCrawl data to match the story-like style of Winograd schemas. It is designed to provide narrative text with characteristics useful for language understanding and generation tasks.

### single-sentence classification  [1 docs, x1] [judged-distinct]
A classification task format in which a model assigns a label to one input sentence. It is used to evaluate sentence-level understanding such as sentiment, entailment-related judgments, or grammaticality.

### answerability classifier  [1 docs, x1] [new]  · aliases: answerable question classifier
A binary classifier used in question answering systems to predict whether a question has an answer in the given context. It is typically combined with span prediction so the model can abstain when no answer is supported by the passage.

### SEGMENT-PAIR+NSP  [1 docs, x1] [new]
SEGMENT-PAIR+NSP is a BERT input training format in which each example consists of two text segments and includes the next sentence prediction objective. The segments may each contain multiple natural sentences, subject to a maximum total length of 512 tokens.

### SENTENCE-PAIR format  [1 docs, x1] [judged-distinct]  · aliases: SENTENCE-PAIR
An input construction that uses individual sentences as paired examples for pretraining. It retains the next sentence prediction loss while replacing longer text segments with single sentences.

### 批量大小  [1 docs, x1] [judged-distinct]  · aliases: batch size, bsz
每次参数更新时一起处理的训练样本数量。它会影响梯度估计的稳定性、训练效率以及模型最终性能。

### 字节对编码  [1 docs, x1] [new]  · aliases: Byte-Pair Encoding, BPE
一种基于统计合并规则构造子词词表的分词方法，介于字符级和词级表示之间。它通过反复合并频繁出现的符号对来形成子词单元，从而缓解稀有词和大词表问题。

### 子词单元  [1 docs, x1] [judged-distinct]  · aliases: subword units, subwords
介于字符和完整词语之间的文本表示单位。它们通常由统计方法从语料中学习得到，用于在控制词表规模的同时表达开放词汇中的词语。

### 字节级字节对编码  [1 docs, x1] [judged-distinct]  · aliases: byte-level Byte-Pair Encoding, byte-level BPE
一种以字节而不是 Unicode 字符作为基本单位的字节对编码变体。它能够用较小的子词词表表示任意输入文本，并避免产生未知词元。

### 未知词元  [1 docs, x1] [new]  · aliases: unknown tokens, UNK
在词表中没有对应表示时使用的占位符词元。避免未知词元有助于模型处理开放词汇输入，并减少信息丢失。

### subword vocabulary  [1 docs, x1] [judged-distinct]  · aliases: subword vocabularies
A vocabulary made up of subword units rather than whole words. It allows text to be encoded with a limited set of units that can combine to represent many different strings.

### unknown token  [1 docs, x1] [judged-distinct]  · aliases: UNK token, unknown tokens
A special token used when an input symbol or sequence cannot be represented by the available vocabulary. Tokenization schemes that avoid unknown tokens can encode arbitrary input text without fallback symbols.

### heuristic tokenization rules  [1 docs, x1] [new]  · aliases: heuristic tokenization, tokenization rules
Manually designed rules used to preprocess text into tokens before subword learning or model training. They aim to standardize input text but may introduce additional preprocessing requirements.

### XLNet  [1 docs, x1] [new]
A pretrained language model architecture that uses a large amount of data and many training sequences to learn contextual representations. It is designed to improve language modeling by leveraging extensive pretraining at scale.

### training passes  [1 docs, x1] [new]  · aliases: epochs
The number of times a model iterates over the training data during learning. More passes can increase exposure to the data and affect how thoroughly the model learns from it.

### 预训练LM嵌入空间  [1 docs, x1] [judged-distinct]  · aliases: embedding space
语言模型内部表示所构成的向量空间，其中语义或上下文相似的文本前缀会彼此靠近。近邻检索可以在这个空间中按距离找到与当前上下文相似的历史表示。

### 近邻数据存储  [1 docs, x1] [judged-distinct]  · aliases: datastore, nearest neighbor datastore
一种保存可检索表示及其对应文本片段的外部存储结构。模型在预测时从中查找与当前上下文最相近的条目，并用这些条目辅助生成输出。

### 长尾分布  [1 docs, x1] [new]  · aliases: long tail
一种少数高频事件占据大部分概率质量、而大量低频事件各自出现很少的分布形态。它在语言中对应罕见词、稀有模式和长尾事实知识等难预测现象。

### pre-trained embedding space  [1 docs, x1] [judged-distinct]
The vector space formed by embeddings learned by a pre-trained model. Distances in this space reflect contextual similarity and can be used to retrieve nearest neighbors for prediction.

### nearest neighbor datastore  [1 docs, x1] [new]  · aliases: datastore
A stored collection of text examples or embeddings used for nearest-neighbor retrieval at inference time. It can be swapped or enlarged to adapt a model to new data or domains without retraining the base model.

### 上下文-目标对  [1 docs, x1] [new]  · aliases: context-target pairs
一种由输入上下文及其对应预测目标组成的成对表示。它常被写入存储库中，用于在相似上下文出现时检索并复用目标信息。

### 左侧上下文  [1 docs, x1] [new]  · aliases: leftward context
位于当前目标标记之前的前缀上下文。它包含用于预测下一个标记的历史信息，并可被编码为检索键。

### 目标分布  [1 docs, x1] [new]  · aliases: distribution over targets
在给定检索到的邻居后，对候选目标标记形成的概率分布。该分布通常根据邻居与查询上下文的距离加权得到，并可与基础模型输出结合。

### 长尾模式  [1 docs, x1] [judged-distinct]  · aliases: long-tail patterns
一种只在少量样本中频繁出现、总体上却很稀有的模式。它通常包含难以通过参数记忆充分覆盖的知识，因此适合借助外部记忆或检索来获取。

### 显式记忆  [1 docs, x1] [new]  · aliases: explicit memory
一种将信息以可直接检索的形式存储的记忆机制。与仅依赖模型参数不同，它允许在推理时根据相似输入快速取回相关内容。

### interpolation  [1 docs, x1] [new]
A method for combining two probability distributions into one by taking a weighted mixture. In language modeling, it is used to blend retrieval-based predictions with the base model’s predictions.

### RBF kernel  [1 docs, x1] [new]  · aliases: radial basis function kernel
A radial basis function similarity measure that turns distances between vectors into smoothly decaying similarity weights. It is often equivalent to using an exponential of negative squared distance in nearest-neighbor retrieval.

### BERT subword vocabulary  [1 docs, x1] [judged-distinct]  · aliases: 29K subword vocabulary from BERT
The BERT subword vocabulary is a 29,000-entry vocabulary of subword tokens associated with BERT. It provides the token inventory used for byte-pair encoded text in the described setup.

### adaptive inputs  [1 docs, x1] [new]
Adaptive inputs are a parameter-sharing technique for language models that allocates different embedding capacities to frequent and infrequent words. They reduce model cost while preserving representational power.

### adaptive softmax  [1 docs, x1] [new]
Adaptive softmax is a hierarchical output layer designed to speed up training and inference for large vocabularies. It assigns more computation to frequent classes and less to rare ones.

### tied weights  [1 docs, x1] [judged-distinct]
Tied weights is a parameter-sharing scheme in which the input embedding matrix and output softmax matrix use the same learned parameters. This reduces the number of parameters and can improve generalization.

### FAISS index  [1 docs, x1] [judged-distinct]  · aliases: FAISS
An efficient similarity-search index used for approximate nearest-neighbor retrieval over high-dimensional vectors. It partitions vectors into clusters and supports fast lookup of nearest items during inference.

### cluster centroid  [1 docs, x1] [new]  · aliases: centroid
A representative vector for a cluster of embedded items, typically used to accelerate approximate nearest-neighbor search. Cluster centroids help limit the search space by routing queries to a small subset of candidate vectors.

### quantization  [1 docs, x1] [new]  · aliases: quantized keys
A compression technique that represents vectors with fewer bytes or lower precision to reduce storage and speed up computation. In similarity search, it trades some accuracy for faster retrieval and lower memory use.

### 键和值  [1 docs, x1] [judged-distinct]  · aliases: keys and values
键和值是键值检索结构中的两类存储内容，其中键用于与查询进行相似度匹配，值用于提供对应的输出信息。它们共同支持基于邻近性的快速查找和条件生成。

### 插值参数 λ  [1 docs, x1] [judged-distinct]  · aliases: λ
插值参数是一种控制两种预测来源相对权重的超参数。它通常用于将语言模型分数与检索分数进行组合，并可在验证集上调节以获得更好的效果。

### 验证集  [1 docs, x1] [new]  · aliases: validation set
验证集是从训练数据之外划分出的开发数据，用于调节超参数和比较模型配置。它不直接参与参数学习，但常用于选择最优设置。

### In-domain datastore  [1 docs, x1] [judged-distinct]
An in-domain datastore is a datastore built from training data drawn from the target domain of interest. Because its contents match the evaluation domain more closely, it can provide more relevant neighbors and improve adaptation.

### intermediate state  [1 docs, x1] [new]  · aliases: hidden state
An internal representation produced at some point inside a neural network, before the final output layer. Different intermediate states can capture different kinds of information and may be more or less useful for retrieval.

### BOOKS domain  [1 docs, x1] [new]  · aliases: BOOKS
A text domain consisting of book content, used as an out-of-domain target for evaluating language models. Performance in this domain can improve when a corresponding datastore is added to a retrieval-augmented model.

### quantized key  [1 docs, x1] [judged-distinct]  · aliases: quantized keys
A compressed vector representation used to reduce memory and speed up similarity search. Quantization approximates the original key vector so that nearest-neighbor lookup can be performed more efficiently.

### full precision key  [1 docs, x1] [judged-distinct]  · aliases: full precision keys
An uncompressed vector representation stored at its original numeric precision. Using full precision keys can improve the accuracy of similarity computations compared with quantized representations.

### learned representation function  [1 docs, x1] [new]  · aliases: f(·)
A function that maps text contexts or instances into vector representations used to measure similarity between examples. Such representations allow models to compare varied contexts in a continuous space rather than relying only on exact symbol matches.

### training speed  [1 docs, x1] [new]
训练速度是指模型性能随训练过程提升的快慢，或达到给定损失所需的优化进展速率。它受模型规模、优化设置和计算资源等因素影响。

### training time  [1 docs, x1] [judged-distinct]
The amount of compute time used to optimize a model on training data. It can affect model performance by determining how much learning has been carried out and how far optimization has progressed.

### unsupervised learning  [1 docs, x1] [judged-distinct]
A learning setting in which a model discovers patterns from unlabeled data rather than from explicit input-output targets. It is often used to learn general representations or generative models from large text corpora.

### generative modeling  [1 docs, x1] [judged-distinct]
A modeling approach that learns the distribution of data so new samples can be generated. In language tasks, it aims to produce text that resembles natural language examples from the training data.

### neural models  [1 docs, x1] [new]  · aliases: neural model
Models built from interconnected artificial neurons and trained with gradient-based methods. They are used to learn complex mappings from input data to predictions or generated outputs.

### universality of overfitting  [1 docs, x1] [judged-distinct]  · aliases: overfitting universality
An empirical regularity stating that the penalty from overfitting depends predictably on the ratio between model size and dataset size. It captures the idea that scaling one factor without the other eventually yields diminishing returns, while scaling them together avoids a performance penalty.

### universality of training  [1 docs, x1] [judged-distinct]  · aliases: training universality
An empirical regularity that training curves follow predictable power laws whose form is largely independent of model size. It allows early training behavior to be extrapolated to estimate the loss that would be reached with much longer training.

### transfer performance  [1 docs, x1] [new]  · aliases: transfer, cross-distribution performance
Performance measured when a model is evaluated on data from a different distribution than the one used for training. It often tracks in line with in-distribution validation performance but may incur an approximately constant loss offset under distribution shift.

### convergence inefficiency  [1 docs, x1] [judged-distinct]
The phenomenon in which the best performance under a fixed compute budget is obtained by training very large models and stopping before full convergence. It implies that fully converged training can be a poor use of compute compared with earlier stopping.

### gradient noise scale  [1 docs, x1] [judged-distinct]  · aliases: gradient noise
A measure of the stochasticity in gradients caused by using finite minibatches. It can be used to predict an effective or optimal batch size for training.

### test loss  [1 docs, x1] [judged-distinct]
Test loss is the value of a loss function measured on held-out data to estimate a model's predictive performance. Lower test loss indicates better generalization to unseen examples.

### early stopping  [1 docs, x1] [judged-distinct]
Early stopping is a training strategy in which optimization is halted before convergence to limit overfitting or to match a resource constraint. In compute-limited settings, it can determine the final performance reached before training is fully complete.

### loss  [1 docs, x1] [judged-distinct]  · aliases: L
A numerical measure of model error used during training and evaluation. Lower loss indicates better fit to the data or better predictive performance under the chosen objective.

### early-stopped test loss  [1 docs, x1] [judged-distinct]  · aliases: L(N, D)
在训练早期停止时评估得到的测试损失，用来衡量模型在有限训练预算下的泛化性能。它可以随着模型规模、数据规模和训练过程的推进而系统变化，并常被用作缩放规律分析中的目标量。

### learning curve  [1 docs, x1] [new]
A learning curve is a function that describes how model performance changes as training progresses or as resources such as data or optimization steps increase. It is used to summarize the rate of improvement and to fit empirical training behavior.

### infinite data limit  [1 docs, x1] [new]
The infinite data limit is an idealized regime in which the amount of training data is treated as unbounded. It is useful for analyzing how performance depends on optimization and model capacity without data scarcity effects.

### model parameters  [1 docs, x1] [judged-distinct]  · aliases: N
The learned numerical values that define a neural network’s computations. They determine how the model transforms inputs into outputs and are adjusted during training to reduce loss.

### minimum non-embedding compute  [1 docs, x1] [judged-distinct]  · aliases: Cmin
An estimate of the least amount of non-embedding training compute needed to reach a target loss. It corresponds to the compute that would be used when training with a batch size much smaller than the critical batch size.

### minimum number of training steps  [1 docs, x1] [judged-distinct]  · aliases: Smin
An estimate of the smallest number of training steps needed to reach a target loss. It corresponds to the step count that would be used when training with a batch size much larger than the critical batch size.

### power-law exponent  [1 docs, x1] [new]  · aliases: αX
A parameter that controls how a quantity scales according to a power law. In scaling analyses, it determines how loss changes as compute, data, model size, or other quantities increase.

### LSTM  [1 docs, x1] [new]  · aliases: long short-term memory
An LSTM is a recurrent neural network architecture with gated memory cells designed to preserve information over long sequences. Its gating mechanism helps mitigate vanishing gradients and supports sequence modeling over extended contexts.

### residual stream  [1 docs, x1] [new]
The residual stream is the main hidden-state pathway that carries information through successive layers of a Transformer. Layer outputs are added back into this stream so that later computations can build on earlier representations.

### matrix multiplication  [1 docs, x1] [new]
A binary operation that combines two matrices to produce a third matrix whose entries are computed from row-by-column products and sums. It is a core linear algebra operation used in many numerical and computational systems.

### de-embedding  [1 docs, x1] [new]  · aliases: de-embed
A projection from hidden representations back into vocabulary space to produce output scores over symbols. In language models, it is used to convert internal states into token logits for prediction.

### Adafactor  [1 docs, x1] [judged-distinct]
An adaptive optimizer designed to reduce memory usage by factorizing second-moment estimates. It is often used for very large models when standard Adam is too memory-intensive.

### linear warmup  [1 docs, x1] [judged-distinct]
A learning-rate strategy in which the rate starts small and increases linearly for a fixed number of steps. It is commonly used at the beginning of training to improve stability.

### cosine decay  [1 docs, x1] [judged-distinct]
A learning-rate schedule that gradually decreases the learning rate following a cosine-shaped curve. It is used to taper optimization smoothly toward zero near the end of training.

### Reddit outbound links  [1 docs, x1] [new]
Links posted on Reddit that point to external web pages. Such links can be harvested to build a large web text corpus for language model pretraining.

### Reddit karma  [1 docs, x1] [new]  · aliases: karma
A voting-based scoring mechanism used on Reddit to indicate community approval of posts or links. A minimum karma threshold can be used as a heuristic for filtering content that appears interesting or useful.

### Newspaper3k  [1 docs, x1] [new]
A Python library used to extract the text content of web pages and articles. It automates article parsing and text extraction from online sources.

### feed-forward ratio  [1 docs, x1] [judged-distinct]  · aliases: dff / dmodel
The ratio between the feed-forward dimension and the model dimension in a Transformer. It controls how much capacity is allocated to the position-wise feed-forward sublayers relative to the hidden representation size.

### attention head dimension  [1 docs, x1] [judged-distinct]  · aliases: dmodel / nhead
The dimensionality assigned to each attention head in a multi-head attention layer. It determines the size of the subspace each head operates on and is derived from the model dimension and the number of heads.

### embedding parameters  [1 docs, x1] [judged-distinct]
Parameters used in token and position embeddings rather than in the core Transformer layers. They can affect measured performance trends when included in the total parameter count.

### ResNet  [1 docs, x1] [new]  · aliases: Residual Network
A residual neural network architecture that uses skip connections to ease optimization of deep models. It has been suggested as an analogy for interpreting deeper networks as collections of effectively shallower components.

### in-distribution validation loss  [1 docs, x1] [judged-distinct]  · aliases: validation loss
In-distribution validation loss is the loss measured on validation data drawn from the same distribution as the training data. It is used as an indicator of how well a model has learned the target distribution and often tracks generalization performance.

### 文档检索  [1 docs, x1] [judged-distinct]  · aliases: retrieval
从大规模语料库中选取若干候选文档的过程。它为语言模型提供外部上下文，使模型能够利用与当前预测相关的文本证据。

### 大规模语料库  [1 docs, x1] [judged-distinct]  · aliases: corpus
包含大量文本文档的集合，供检索系统搜索相关证据。它为检索式语言模型提供可查询的外部知识来源。

### 维基百科  [1 docs, x1] [judged-distinct]  · aliases: Wikipedia
一个大规模、众包编辑的百科全书式文本资源，常被用作检索语料库。它提供覆盖广泛主题的文档，适合支持基于检索的语言建模。

### 潜变量语言模型  [1 docs, x1] [judged-distinct]  · aliases: latent variable language model
一种把离散或未观测变量纳入概率建模的语言模型。通过对潜变量进行边缘化，可以在预测时把检索结果等隐藏选择纳入生成过程。

### 边缘似然  [1 docs, x1] [judged-distinct]  · aliases: marginal likelihood
将潜变量的所有可能取值积分或求和后得到的整体似然。它用于训练包含隐变量的模型，使模型不必显式选择唯一的潜变量取值。

### 离散检索步骤  [1 docs, x1] [new]  · aliases: discrete retrieval step
在神经模型中显式选择一个或多个离散候选项作为中间步骤的机制。它使模型可以先从外部记忆或语料中选取内容，再基于所选内容进行预测。

### 反向传播  [1 docs, x1] [new]  · aliases: backpropagating
一种通过计算图传播梯度以更新模型参数的优化方法。它使模型能够根据最终损失调整前面各组件的行为，包括检索决策。

### 缓存  [1 docs, x1] [new]  · aliases: cached
将已经计算过的中间结果保存起来以便后续重用的技术。它可以减少重复计算，特别适合大规模检索系统中对文档表示的复用。

### 异步更新  [1 docs, x1] [new]  · aliases: asynchronously updated
在不同时间或不同线程中独立更新参数或状态的机制。它可以降低大规模系统中的计算阻塞，并提高检索表示的更新效率。

### semantic information  [1 docs, x1] [judged-distinct]
Semantic information is information about meaning in language, including how words and phrases relate to each other in context. Models use it to choose tokens that fit the intended meaning of an input sequence.

### wordpiece tokenization  [1 docs, x1] [judged-distinct]
Wordpiece tokenization is a subword tokenization method that splits text into frequent pieces rather than full words. It helps neural language models handle rare and unseen words by representing them as sequences of subword units.

### 知识增强编码器  [1 docs, x1] [judged-distinct]
一种将输入与检索到的知识联合编码的神经网络模块。它把外部检索内容融入表示学习过程，以便在语言建模或问答等任务中利用补充知识。

### 开放域问答微调  [1 docs, x1] [judged-distinct]  · aliases: Open-QA fine-tuning
一种针对开放域问题回答任务的监督微调过程。模型根据问题和文档生成答案字符串，通常依赖于从文档中抽取连续文本片段作为答案。

### 跨度集合  [1 docs, x1] [judged-distinct]  · aliases: S(z, y)
与某个目标答案匹配的一组文本跨度。它列出文档中所有能对应同一答案字符串的位置，用于在存在多个匹配时对答案概率进行汇总。

### log-likelihood  [1 docs, x1] [judged-distinct]
The logarithm of the probability assigned to the correct output under a model. It is commonly maximized during training to make the model assign higher probability to the observed targets.

### relevance score  [1 docs, x1] [new]
A numerical score that measures how well a candidate document matches an input. In inner-product retrieval systems, it is computed from the similarity between the input embedding and the document embedding.

### parameter staleness  [1 docs, x1] [new]  · aliases: stale index
The mismatch that occurs when a precomputed index or representation is not updated after model parameters change. It can cause retrieval results to reflect outdated embeddings until the index is refreshed.

### primary trainer job  [1 docs, x1] [judged-distinct]
The main training process that performs gradient updates on model parameters. It carries out the optimization of the model while other jobs may handle auxiliary tasks such as index maintenance.

### secondary index builder job  [1 docs, x1] [new]
A background process that embeds documents and builds or refreshes an index. It runs in parallel with training so that retrieval structures can be updated without interrupting gradient-based optimization.

### posterior distribution p  [1 docs, x1] [new]  · aliases: p(z | x)
A conditional distribution over a latent variable z given an input x. In latent-variable models, it assigns probability mass to candidate latent explanations and is often differentiated to support learning.

### 异步 MIPS 刷新  [1 docs, x1] [new]  · aliases: asynchronous MIPS refreshes
一种在训练过程中并行重建最大内积搜索索引的机制。训练器在继续更新参数的同时，把当前参数快照交给索引构建器，后者在后台生成新索引并在完成后返回，从而减少检索索引更新对训练的阻塞。

### 最大内积搜索索引  [1 docs, x1] [judged-distinct]  · aliases: MIPS index
一种用于近似或加速按向量内积进行检索的索引结构。它支持根据查询表示快速找到与之内积最大的文档表示，常用于神经检索系统中的候选召回。

### Embeddoc  [1 docs, x1] [judged-distinct]
一种把文档映射到检索空间的参数化编码器。它用于为文档构建向量表示，以便在最大内积搜索中与查询表示进行匹配，并可在预训练时随索引一起刷新。

### 显著跨度掩蔽  [1 docs, x1] [judged-distinct]  · aliases: salient span masking
一种掩蔽语言建模策略，优先遮蔽那些更可能需要世界知识才能恢复的命名实体或日期等片段。它通过把训练焦点从只依赖局部上下文的简单片段转向更依赖外部知识的片段，来引导模型学习有意义的检索。

### 空文档  [1 docs, x1] [new]  · aliases: null document, ∅
一种在检索结果中加入的虚拟空条目，用来表示当前样本不需要任何外部文档即可完成预测。它允许模型把“无需检索”的情况归入一个一致的接收项，从而更合理地分配学习信号。

### 平凡检索  [1 docs, x1] [judged-distinct]  · aliases: trivial retrievals, trivial retrieval candidate
一种不希望出现的检索行为，指检索器通过查找与输入文本的字面重合或近似重复来获得答案，而不是学习更一般的相关性。它会让模型过度依赖精确字符串匹配，并削弱检索对世界知识的利用。

### cold-start problem  [1 docs, x1] [new]  · aliases: cold start problem
A training failure mode in which a model begins with poor representations and therefore retrieves unhelpful evidence, causing downstream components to ignore the retrieved information. This can create a feedback loop in which the retriever receives little useful gradient and cannot improve.

### short answer type  [1 docs, x1] [new]
An answer category used to indicate brief, span-like answers rather than longer or more complex responses. In benchmark filtering, it is used to select questions whose answers can be expressed in at most a few tokens.

### entity linking  [1 docs, x1] [new]
A retrieval heuristic that maps mentions in a question to entities in a knowledge source in order to identify relevant documents. It is often used to narrow the search space before later ranking stages.

### latent variable model  [1 docs, x1] [judged-distinct]
A probabilistic model that includes hidden variables which are not directly observed but influence the observed output. In retrieval-and-generation systems, latent variables can represent hidden document choices or other unobserved decisions.

### sequence prediction task  [1 docs, x1] [judged-distinct]
A learning setting in which a model predicts an output sequence conditioned on an input sequence. In open-domain question answering, this means generating an answer token by token from an encoded question.

### Lucene-BM25 system  [1 docs, x1] [judged-distinct]  · aliases: Lucene BM25 system
A retrieval system built on Lucene that uses BM25 as its ranking function. It is a standard sparse-search baseline for document and passage retrieval.

### inverted index  [1 docs, x1] [judged-distinct]
A data structure that maps terms to the documents or positions in which they occur. It enables efficient keyword-based retrieval over large text collections.

### 问题-段落对  [1 docs, x1] [judged-distinct]  · aliases: question-passage pairs
由一个问题与一个相关段落组成的训练样本，用于监督检索模型学习哪些文本应被视为与问题相关。它们是训练问题段落检索器的核心监督信号。

### dense encoder  [1 docs, x1] [judged-distinct]  · aliases: EP
A neural encoder that maps a text passage into a d-dimensional real-valued vector representation. These vectors are used to place passages in a continuous embedding space for similarity-based retrieval.

### fixed-length passages  [1 docs, x1] [judged-distinct]
Passages segmented to a uniform length rather than using natural paragraph boundaries. They are used as retrieval units when a fixed passage size improves retrieval and end-to-end question answering performance.

### natural paragraphs  [1 docs, x1] [judged-distinct]
Text segments corresponding to paragraph boundaries in a document. They can serve as retrieval units, although they may be less effective than fixed-length passages in some retrieval systems.

### 问题编码器  [1 docs, x1] [judged-distinct]  · aliases: question encoder, EQ
一种将输入问题映射到固定维度向量表示的编码网络。它的输出用于与段落向量计算相似度，从而支持检索排序。

### 马氏距离  [1 docs, x1] [judged-distinct]
一种考虑协方差结构的距离度量，用于衡量两个向量在变换空间中的差异。它可以等价地表示为某个线性变换空间中的 L2 距离。

### 稠密向量  [1 docs, x1] [new]  · aliases: dense vectors
一种在较低维连续空间中表示对象的向量表示，通常每个维度都包含实值信息。它们适合用于相似度计算、最近邻搜索和向量索引。

### 度量学习  [1 docs, x1] [judged-distinct]  · aliases: metric learning
一种学习表示空间或距离函数的训练范式，目标是让相似样本彼此接近、不同样本彼此远离。它常用于检索、匹配和度量比较任务。

### 正样本  [1 docs, x1] [judged-distinct]  · aliases: positive example, positive passage
在监督学习或检索任务中，被标记为相关、匹配或正确的样本。正样本用于指示模型应当优先检索或提高得分的目标对象。

### 检索  [1 docs, x1] [judged-distinct]
从大规模候选集合中找出与查询最相关条目的任务。检索系统通常依赖表示学习或排序函数来对候选项进行打分并返回最优结果。

### 金标准样本  [1 docs, x1] [judged-distinct]  · aliases: gold
在标注数据中被视为正确答案或最可靠参考的样本。金标准样本常用于训练、评估或构造高质量监督信号。

### 小批量  [1 docs, x1] [judged-distinct]  · aliases: mini-batch
在训练过程中一次送入模型的一小组样本，用于高效计算梯度并更新参数。小批量还能在训练时提供组内比较或采样机制。

### full batch setting  [1 docs, x1] [judged-distinct]
A training regime in which all available examples in a batch are used together when computing the objective. In retrieval learning, it can provide a large set of in-batch negatives for contrastive training.

### English Wikipedia dump  [1 docs, x1] [judged-distinct]  · aliases: Wikipedia dump
A snapshot of the English-language Wikipedia content released as a bulk data dump. It is commonly used as a source corpus for information retrieval and question answering tasks.

### Wikipedia article  [1 docs, x1] [new]
A standalone encyclopedic entry in Wikipedia containing text and metadata such as a title. Articles can be split into smaller passages for retrieval and question answering systems.

### TREC QA tracks  [1 docs, x1] [judged-distinct]  · aliases: TREC question answering tracks
A sequence of question answering evaluation tracks within the Text REtrieval Conference. They provide benchmark questions and assessments for QA systems.

### learning rate  [1 docs, x1] [judged-distinct]
优化算法在每次参数更新时所采用的步长大小。它决定模型参数变化的快慢，并对训练稳定性和收敛速度有重要影响。

### Top-100 retrieval accuracy  [1 docs, x1] [judged-distinct]  · aliases: Top-100
在前100个检索结果中包含答案段落的比例，用于衡量检索系统在较大候选集上的召回能力。它反映系统覆盖相关证据的能力。

### multi-dataset encoder  [1 docs, x1] [new]
A multi-dataset encoder is an encoder model trained on data pooled from multiple datasets so that it can generalize across them. It is intended to produce representations that work well on several related tasks or benchmarks rather than adapting to only one dataset.

### linear combination  [1 docs, x1] [new]
A linear combination is a scoring or prediction rule formed by adding weighted components together. In retrieval, it can be used to merge the scores of two systems into a single ranking function.

### BM25+DPR  [1 docs, x1] [judged-distinct]
BM25+DPR is a hybrid retrieval approach that combines the scores of BM25 and a dense passage retriever to rank candidate passages. It leverages the complementary strengths of sparse lexical matching and dense semantic matching.

### TREC  [1 docs, x1] [judged-distinct]
一个经典的信息检索评测集合，包含多种检索任务和基准，用于比较不同检索系统的性能。较小的数据规模使其在使用更多训练样本时往往受益更明显。

### lexical overlap  [1 docs, x1] [new]
查询与文档在表面词汇上的共享程度，通常指两者使用了相同或相近的词语。高词汇重叠往往会让基于词匹配的检索方法更占优势。

### question–passage pairs  [1 docs, x1] [judged-distinct]  · aliases: question-passage pairs
Paired examples consisting of a question and a passage, usually where the passage is relevant to the question. They serve as supervised training data for retrieval models that learn to match questions with passages.

### 1-of-N training setting  [1 docs, x1] [judged-distinct]
A retrieval training setup in which each question is paired with one positive passage and N negative passages, and the model is trained to select the positive among all candidates. It is a standard contrastive ranking formulation for learning passage retrieval.

### gold negative passage  [1 docs, x1] [new]  · aliases: gold negative passages
A passage that is relevant to some other question but treated as a negative example for the current question. Gold negatives are often harder than random negatives because they are known positives in another training instance.

### distantly-supervised passage  [1 docs, x1] [judged-distinct]  · aliases: distantly supervised passages
一种由弱监督方式获得的训练段落，通常不是人工标注的金标准，而是通过现有检索器或启发式规则自动选出的。它常用于在缺少人工标注上下文时构造训练数据。

### triplet loss  [1 docs, x1] [new]
A ranking loss that trains a model using an anchor example, a positive example, and a negative example. It encourages the score or distance between the anchor and the positive example to be better than the score or distance between the anchor and the negative example by a margin.

### positive passage  [1 docs, x1] [judged-distinct]
A passage that is relevant to a question or query and should be ranked above irrelevant passages. It serves as a positive training example in retrieval and ranking methods.

### negative passage  [1 docs, x1] [judged-distinct]
A passage that is not relevant to a question or query and should be ranked below relevant passages. It is used as a negative training example to teach a ranking model to distinguish useful evidence from distractors.

### discriminative training  [1 docs, x1] [judged-distinct]
A training approach that learns to distinguish correct examples from incorrect ones directly through a scoring or classification objective. In retrieval models, it typically optimizes representations so relevant passages score higher than irrelevant ones.

### non-iid setting  [1 docs, x1] [new]  · aliases: non-i.i.d. setting
A setting in which training and test data are not independently and identically distributed. It is used to study how well a model handles distribution shift between different data sources or domains.

### knowledge-intensive NLP task  [1 docs, x1] [new]  · aliases: knowledge-intensive task
A natural language processing task that depends heavily on external factual knowledge rather than only on surface pattern recognition. Examples include open-domain question answering and other tasks where accessing precise world knowledge is important.

### retrieve-and-extract architecture  [1 docs, x1] [new]
A system design that retrieves evidence from an external source and then extracts the answer directly from the retrieved text. It is commonly used in question answering systems that rely on explicit supporting passages.

### differentiable access mechanism  [1 docs, x1] [new]
A retrieval or memory-access method that can be trained end-to-end through gradient-based learning. It enables a model to learn how to select or weight external memory content while remaining compatible with neural optimization.

### differentiable retriever  [1 docs, x1] [judged-distinct]
可微检索器是一种可通过梯度训练的检索组件，用于从外部语料或知识库中选择相关内容。它把检索过程纳入端到端优化，使检索与生成或理解模块能够联合学习。

### state-of-the-art parametric-only seq2seq baseline  [1 docs, x1] [new]  · aliases: parametric-only seq2seq baseline
仅参数化的序列到序列基线是只依赖模型参数进行输入到输出映射的基准系统，不使用显式检索或外部记忆。它常被用作比较对象，以衡量引入检索或外部知识后的改进。

### pre-trained neural retriever  [1 docs, x1] [judged-distinct]
A retrieval model that encodes queries and documents into vectors and uses similarity search to find relevant documents. When pre-trained, it can be used as a component in downstream systems without training from scratch.

### memory network  [1 docs, x1] [judged-distinct]  · aliases: memory networks
一种带有显式记忆组件的神经网络架构。它通过读取和写入记忆来支持对外部信息的存取，适用于需要长期或可检索知识的任务。

### stack-augmented network  [1 docs, x1] [judged-distinct]  · aliases: stack-augmented networks
一种在神经网络中加入栈式外部存储的架构。栈提供后进先出的可操作记忆结构，使模型能够表示需要嵌套或递归操作的计算过程。

### memory layer  [1 docs, x1] [judged-distinct]  · aliases: memory layers
一种在神经网络中引入记忆访问能力的层。它允许模型在前向计算中查询外部或内部记忆，以增强表示和推理能力。

### latent document variable  [1 docs, x1] [judged-distinct]  · aliases: latent document
A hidden retrieved document treated as an unobserved variable in a probabilistic text generation model. Its value is summed or marginalized out to obtain the probability of the generated output.

### denoising objective  [1 docs, x1] [judged-distinct]
A pretraining objective in which corrupted input text is reconstructed from a noised version of the original text. It encourages a model to learn robust contextual representations useful for downstream generation tasks.

### negative marginal log-likelihood  [1 docs, x1] [judged-distinct]  · aliases: marginal log-likelihood
A training objective that minimizes the negative logarithm of the marginal probability assigned to each target output. It is used to adjust model parameters so that the model assigns higher probability to the correct output under all relevant latent choices or retrieved contexts.

### Thorough Decoding  [1 docs, x1] [judged-distinct]
A decoding procedure for retrieval-augmented sequence generation that evaluates candidate hypotheses across retrieved documents and performs additional forward passes when a hypothesis is missing from a document-specific beam. It estimates sequence probabilities by combining generator scores with retrieval probabilities across all relevant documents.

### Hierarchical Navigable Small World approximation  [1 docs, x1] [new]  · aliases: HNSW
A graph-based approximation method for fast nearest-neighbor search in large vector spaces. It speeds up retrieval by navigating a hierarchical small-world graph instead of exhaustively comparing all vectors.

### train  [1 docs, x1] [new]
A predefined partition of a dataset into training, development, and test subsets. These splits are used to make model comparison fair and to ensure that evaluation is performed on held-out data.

### TQA Wiki test set  [1 docs, x1] [judged-distinct]  · aliases: Wiki test set
A held-out test set associated with the TQA benchmark that contains Wikipedia-based questions for evaluation. It is used to compare systems on the same testing data and support direct comparison with prior work.

### search engine  [1 docs, x1] [judged-distinct]
A system that indexes documents and retrieves passages in response to a query. It is commonly used to obtain candidate evidence for question answering and information retrieval tasks.

### full sentence answer  [1 docs, x1] [judged-distinct]
An answer written as a complete sentence rather than a short phrase or span. It is typical of abstractive question answering and natural language generation settings.

### MSMARCO  [1 docs, x1] [judged-distinct]  · aliases: MS MARCO
一个开放域抽取式问答基准，包含用于回答自然语言问题的文档检索与参考答案。它也被用作开放域生成式问答的评测来源，其中一些问题如果没有金标准段落就难以与参考答案完全匹配。

### 开放域生成式问答  [1 docs, x1] [judged-distinct]  · aliases: 开放域抽象式问答, open-domain abstractive QA
一种问答任务，模型需要在不限定于单一封闭知识库的情况下生成答案。它通常结合检索到的证据和模型内部参数化知识，以输出自然语言回复。

### Jeopardy 格式  [1 docs, x1] [judged-distinct]  · aliases: Jeopardy
一种问答游戏中的题目形式，先给出关于某个实体的事实性陈述，再要求猜出对应实体。该格式强调精确、事实性的线索，并以“答案实体”作为生成问题的条件。

### 事实性  [1 docs, x1] [new]  · aliases: factuality
指生成内容是否能够被可信外部来源证实的性质。它常用于衡量生成系统输出的真实性和可核验性。

### 特异性  [1 docs, x1] [new]  · aliases: specificity
指输入与输出之间具有较高互相依赖性的性质，也就是输出是否紧密围绕给定条件展开。它常用于衡量生成结果是否足够贴合输入而非泛泛而谈。

### natural language claim  [1 docs, x1] [judged-distinct]
A natural language claim is a declarative statement expressed in ordinary language that can be evaluated for truth or falsity. In fact verification tasks, such a claim is paired with evidence and classified according to whether the evidence supports, contradicts, or fails to resolve it.

### Wikipedia evidence retrieval  [1 docs, x1] [new]  · aliases: retrieving evidence from Wikipedia
Wikipedia evidence retrieval is the process of finding Wikipedia passages or articles relevant to a claim. It supplies the evidence needed for downstream verification or reasoning over whether the claim is supported or refuted.

### entailment reasoning  [1 docs, x1] [new]  · aliases: entailment reasoning task
Entailment reasoning is the process of determining whether a set of evidence logically supports, contradicts, or is insufficient to determine a claim. In fact verification, it connects retrieved evidence to a final classification label.

### claim-class pair  [1 docs, x1] [judged-distinct]
A claim-class pair is a training example consisting of a claim and its associated verification label. Such pairs are used to train models to map a claim directly to a support, refute, or uncertainty decision.

### label accuracy  [1 docs, x1] [new]
Label accuracy is the proportion of examples for which a model predicts the correct class label. It is a standard evaluation measure for classification tasks such as fact verification.

### supports  [1 docs, x1] [new]  · aliases: supported, refuted, or not enough information
Supports/refutes/not enough info is a three-way classification scheme used in FEVER. It assigns a claim to one of three outcomes: the evidence supports the claim, the evidence refutes it, or the available evidence does not suffice to decide.

### 文档边缘化  [1 docs, x1] [judged-distinct]  · aliases: 对文档进行边缘化, marginalization over documents
一种在存在多个潜在文档证据时，对不同文档条件下的预测概率进行加权求和的推断方法。它把文档的不确定性纳入模型输出，使系统能够利用多个检索结果共同支持答案生成。

### 生成式问答  [1 docs, x1] [judged-distinct]  · aliases: Abstractive Question Answering, abstractive QA
一种通过生成自然语言答案来回答问题的问答范式。与只抽取原文片段的方法不同，生成式问答可以综合多篇文档的信息并输出不必逐字出现于证据中的答案。

### intermediate retrieval supervision  [1 docs, x1] [judged-distinct]
Training supervision that explicitly guides a model’s retrieval component before or during final prediction. It encourages the model to select useful evidence documents rather than learning retrieval only indirectly from the end task.

### The Sun Also Rises  [1 docs, x1] [new]
A novel by Ernest Hemingway, first published in 1926. It is one of Hemingway’s best-known works and is associated with the expatriate community of the 1920s Lost Generation.

### A Farewell to Arms  [1 docs, x1] [new]
A novel by Ernest Hemingway, published in 1929. It draws on wartime experience and is considered one of his classic works of American literature.

### Lost Generation  [1 docs, x1] [new]  · aliases: 1920s Lost Generation
A term for the expatriate community of writers and artists associated with the 1920s. It refers to a group marked by postwar disillusionment and cultural displacement, especially among Americans living in Europe.

### 梯度更新  [1 docs, x1] [judged-distinct]  · aliases: gradient updates
通过计算损失函数对参数的梯度并据此调整模型参数的优化步骤。它是训练和微调神经网络的核心机制，用于让模型在目标任务上改进。

### 文本交互  [1 docs, x1] [judged-distinct]  · aliases: text interaction
通过输入文本提示、示例或指令与模型进行通信并获得输出的方式。它让模型在不显式修改参数的情况下响应任务要求。

### 临时推理  [1 docs, x1] [new]  · aliases: on-the-fly reasoning
一种在面对新问题时即时进行推断、组合和计算的能力，而不是依赖预先见过的固定模式。它通常体现为模型在少量上下文提示下完成新颖任务。

### 单词重排  [1 docs, x1] [new]  · aliases: unscrambling words
一种要求识别并重新排列字母或词语以恢复正确形式的任务。它常用于测试模型对字符级模式和即时操作的能力。

### using a novel word in a sentence  [1 docs, x1] [new]
Using a novel word in a sentence is a task that tests whether a model can infer a new word’s meaning or usage from minimal context and deploy it appropriately. It is commonly used to assess one-shot or few-shot generalization to unfamiliar vocabulary.

### large web corpora  [1 docs, x1] [judged-distinct]
Large web corpora are very large collections of text harvested from web pages and online sources. They are often used to train language models, but they can introduce noise, duplication, and other methodological issues.

### Common Crawl filtering  [1 docs, x1] [judged-distinct]  · aliases: A Details of Common Crawl Filtering
A preprocessing process that removes unwanted or low-quality content from the Common Crawl corpus before it is used for downstream tasks. It is used to improve the quality and suitability of web text for language-model training or analysis.

### Task phrasing  [1 docs, x1] [new]  · aliases: Details of Task Phrasing and Specifications
The wording used to present a task or instruction to a model. Different phrasing choices can change how well a model interprets the task and performs on it.

### 预训练循环语言模型  [1 docs, x1] [judged-distinct]  · aliases: pre-trained recurrent language models
先在大规模文本上学习语言建模能力的循环神经网络语言模型。它能够获得通用的语言知识，并在下游任务上进一步微调。

### 预训练 Transformer 语言模型  [1 docs, x1] [judged-distinct]  · aliases: pre-trained transformer language models
基于 Transformer 架构、先在大规模文本上预训练的语言模型。它们可以直接迁移到下游任务，并通过微调适应具体应用。

### 任务特定架构  [1 docs, x1] [new]  · aliases: task-specific architectures
专门为某个具体任务设计的模型结构或系统组件。它通常针对任务目标进行定制，与通用预训练模型相对。

### 阅读理解  [1 docs, x1] [judged-distinct]  · aliases: reading comprehension
一种要求模型从给定文本中提取或推断答案的自然语言处理任务。它通常考查模型对篇章内容、指代关系和信息整合能力的理解。

### 任务特定数据集  [1 docs, x1] [judged-distinct]  · aliases: task-specific datasets
为某一具体任务收集和标注的训练样本集合。它为模型微调提供监督信号，并决定模型在该任务上的适应程度。

### SuperGLUE  [1 docs, x1] [judged-distinct]
一个标准的自然语言处理基准套件，用于评估模型在多种语言理解任务上的表现。它通常由多个具有挑战性的子任务组成，以比较不同系统的综合能力。

### NLP基准套件  [1 docs, x1] [judged-distinct]  · aliases: natural language processing benchmark suite
一组用于评测自然语言处理系统性能的标准化任务集合。它提供可比较的测试环境，以衡量模型在不同语言任务上的能力。

### rapid adaption  [1 docs, x1] [new]  · aliases: rapid adaptation
The ability to adjust behavior quickly from a small amount of new information. In language models, it refers to learning a task pattern from very few examples or instructions.

### ANLI  [1 docs, x1] [judged-distinct]  · aliases: Adversarial NLI
An adversarial natural language inference benchmark designed to be difficult for current models. It contains challenging examples that require robust reasoning beyond superficial patterns.

### QuAC  [1 docs, x1] [judged-distinct]  · aliases: Question Answering in Context
A conversational reading comprehension benchmark in which questions are asked in a dialogue over a passage. It evaluates comprehension across multi-turn interactions and context dependence.

### arithmetic  [1 docs, x1] [new]
The branch of mathematics dealing with basic numerical operations such as addition, subtraction, multiplication, and division. In language-model evaluation, arithmetic tasks test whether the model can carry out simple calculations from context.

### novel word  [1 docs, x1] [judged-distinct]
A word that is newly introduced or unfamiliar to the model at test time. It is used to probe whether the model can infer meaning and use a term correctly after only minimal exposure.

### 预训练模型  [1 docs, x1] [judged-distinct]  · aliases: pre-trained model
一种先在大规模通用数据上训练、再迁移到下游任务的模型。它通常具有可被进一步微调或用于少样本条件推理的参数化知识表示。

### 条件化  [1 docs, x1] [judged-distinct]  · aliases: conditioning
一种让模型在额外上下文信息约束下生成或预测输出的机制。通过将示例、提示或其他上下文作为输入，模型的行为会被这些条件所引导。

### Mechanical Turk  [1 docs, x1] [new]  · aliases: Amazon Mechanical Turk, MTurk
A human worker service used to collect or annotate data by assigning tasks to workers. It is often used to obtain examples or labels from people when a task must be communicated clearly.

### 示范  [1 docs, x1] [judged-distinct]  · aliases: demonstrations
在提示中提供给模型的示例输入输出对，用于展示任务的完成方式和输出格式。示范越少，任务设置通常越依赖模型从上下文中推断规则。

### 性能  [1 docs, x1] [judged-distinct]
模型在特定任务或基准上的表现水平，通常通过准确率、得分或其他评测指标体现。不同任务设置之间常常需要在性能和样本效率之间权衡。

### few-shot evaluation  [1 docs, x1] [judged-distinct]  · aliases: few-shot evaluations
An evaluation setting in which a model is given a small number of examples or demonstrations before producing an answer. It is used to measure how well a model can adapt from limited context rather than from full task-specific training.

### one-shot evaluation  [1 docs, x1] [judged-distinct]  · aliases: one-shot evaluations
An evaluation setting in which a model is given exactly one example or demonstration before producing an answer. It tests whether a model can perform a task from minimal contextual guidance.

### Sparse Transformer  [1 docs, x1] [judged-distinct]
A transformer architecture that reduces attention computation by using sparse attention patterns instead of full dense attention everywhere. It is used as a reference point for later models that combine dense and sparse attention structures.

### pre-normalization  [1 docs, x1] [judged-distinct]
A transformer design in which normalization is applied before the main sublayer computation rather than after it. This can improve training stability in deep models.

### validation loss  [1 docs, x1] [judged-distinct]
Validation loss is an error measure computed on held-out data to estimate how well a model generalizes beyond the training set. It is often used to compare models and detect overfitting.

### smooth power law  [1 docs, x1] [new]
A smooth power law is a functional relationship in which one quantity changes approximately as a power of another over a wide range of scales. In machine learning scaling studies, it is used to describe how performance metrics vary with model size or data size.

### fuzzy deduplication  [1 docs, x1] [new]
Fuzzy deduplication is a near-duplicate removal technique that identifies and removes highly similar documents rather than only exact copies. It helps reduce redundancy in training data and prevents overlap between training and evaluation sets.

### held-out validation set  [1 docs, x1] [new]
A held-out validation set is a subset of data excluded from training and used only for evaluation. It provides an estimate of generalization and overfitting that is not biased by direct exposure during training.

### reference corpora  [1 docs, x1] [new]
Reference corpora are curated text collections used as high-quality benchmarks or sources for training and filtering other datasets. They are typically selected for their reliability, cleanliness, or domain coverage.

### load balancing  [1 docs, x1] [new]
Load balancing is the process of distributing computation and memory demands evenly across available hardware. In distributed model training, it helps improve efficiency and avoid bottlenecks on specific devices or nodes.

### learning bottleneck  [1 docs, x1] [judged-distinct]
A limitation in model training that slows or weakens learning because the optimization signal is poor, noisy, or uninformative. In retrieval systems, it can arise when training examples do not provide sufficiently strong gradient updates.

### deep neural networks  [1 docs, x1] [judged-distinct]
Deep neural networks are multi-layer machine learning models that learn hierarchical representations from data. In dense retrieval, they are used to map texts into continuous vector representations that can be compared for similarity.

### vocabulary mismatch  [1 docs, x1] [judged-distinct]
Vocabulary mismatch is the failure of two related texts to share the same words even when they are semantically connected. It is a key limitation of term-based retrieval methods because lexical overlap alone may not capture relevance.

### representation learning  [1 docs, x1] [judged-distinct]
Representation learning is the process of learning useful feature representations from data, often with minimal manual feature engineering. In retrieval systems, it is used to learn embeddings that make relevant texts easy to match and irrelevant texts easy to separate.

### variance reduction framework  [1 docs, x1] [judged-distinct]
A theoretical framework for analyzing and reducing the variability of stochastic gradient estimates in optimization. It is used to explain how different sampling schemes affect gradient magnitude, variance, and training convergence.

### relevant document  [1 docs, x1] [judged-distinct]
A document that satisfies the information need expressed by a query. Retrieval models aim to assign higher similarity or ranking scores to relevant documents than to irrelevant ones.

### irrelevant document  [1 docs, x1] [judged-distinct]
A document that does not satisfy the information need expressed by a query. Retrieval training treats such documents as negatives to teach the model to separate them from relevant results.

### Learned embedding space  [1 docs, x1] [judged-distinct]
A vector space learned from data in which semantically related queries and documents are mapped close together. Retrieval scores are computed from distances or similarities in this space rather than from exact term overlap.

### dense retrieval training  [1 docs, x1] [judged-distinct]  · aliases: DR training
The process of optimizing a dense retrieval model so that relevant query-document pairs receive higher similarity scores than negative pairs. It typically trains representation encoders with sampled negatives to improve retrieval quality over sparse baselines.

### uninformative negatives  [1 docs, x1] [judged-distinct]
Negative examples that provide weak training signal because they are too easy or otherwise not useful for distinguishing relevant from irrelevant items. They can bound gradient norms and limit effective learning in dense retrieval.

### Gradient estimator  [1 docs, x1] [new]
用有限样本构造出来的梯度近似量，用来代替完整数据上的真实梯度进行优化更新。若设计得当，它可以保持无偏，并在计算上比完整梯度更便宜。

### oracle distribution  [1 docs, x1] [new]
An idealized probability distribution that yields the best theoretical behavior for a learning or sampling objective. It is typically defined in closed form by an optimization criterion, even when it is too expensive to compute exactly.

### diminishing gradients  [1 docs, x1] [judged-distinct]
A situation in which gradient magnitudes become smaller over time or across samples, reducing their influence on parameter updates. Such gradients carry less learning signal and are often considered less informative for optimization.

### multi-layer perceptron  [1 docs, x1] [new]  · aliases: MLP, MLP network, MLP networks
A feedforward neural network composed of multiple layers of fully connected units. It is a standard neural architecture used for function approximation and classification tasks.

### ANCE asynchronous training  [1 docs, x1] [judged-distinct]  · aliases: asynchronous training, ANCE
A training scheme for dense retrieval models in which negative examples are refreshed asynchronously using the current state of the model. It separates the roles of updating model parameters and updating corpus representations so that training can use up-to-date hard negatives without pausing the main optimization loop.

### pairwise hinge loss  [1 docs, x1] [judged-distinct]  · aliases: hinge loss
A ranking loss that encourages a positive item to score higher than a negative item by a margin. It is commonly used in learning-to-rank settings and yields vanishing gradients when the model already separates the pair well.

### 近似最近邻噪声对比估计  [1 docs, x1] [judged-distinct]  · aliases: ANCE, Approximate nearest neighbor Negative Contrastive Estimation
一种用于密集检索训练的负样本构造方法，通过近似最近邻索引从整个语料中检索候选文档，并将模型当前检索到的高排名文档用作负样本。它旨在提供比局部小批量采样更困难、更有信息量的训练信号。

### inference  [1 docs, x1] [judged-distinct]
The process of running a trained model over a corpus to compute updated document representations. In retrieval systems, this step is expensive because it may require encoding every document in the collection.

### ANCE negatives  [1 docs, x1] [judged-distinct]  · aliases: D−ANCE
Negative training examples selected from an approximate nearest neighbor index in the ANCE retrieval method. They are chosen from documents that are close to the query under the current model, making them hard negatives for learning.

### BM25 + Rand Neg  [1 docs, x1] [judged-distinct]
一种混合负样本策略，将BM25负例与随机负例按1:1比例结合。它兼顾难负例和普通负例，以改善检索模型训练的稳定性和泛化能力。

### MARCO passage training labels  [1 docs, x1] [judged-distinct]  · aliases: MS MARCO passage training labels
一种来自MS MARCO段落数据集的训练标注，用于监督文档或段落检索模型学习相关性。它们通常被用来训练第一阶段检索器，并影响模型对正负样本的区分能力。

### max-pooling  [1 docs, x1] [judged-distinct]  · aliases: max pooling
An aggregation operation that outputs the largest value among a set of scores or activations. In retrieval, it can be used to combine passage-level scores into a single document-level score by keeping the strongest match.

### Faiss IndexFlatIP  [1 docs, x1] [judged-distinct]  · aliases: IndexFlatIP
A Faiss index that performs exact inner-product search over stored vectors using a flat, non-compressed representation. It is a simple and efficient index type for similarity search when inner product is the scoring function.

### DPR checkpoints  [1 docs, x1] [judged-distinct]  · aliases: released DPR checkpoints
Saved model parameters from a dense passage retrieval system. Such checkpoints can be used as initialization or warm-start models for further training or adaptation.

### noise-contrastive estimation negatives  [1 docs, x1] [judged-distinct]  · aliases: NCE Neg, 噪声对比估计负样本
一种基于噪声对比估计的负样本构造方式，用噪声分布采样的样本作为训练中的对比项。它用于让模型学习将真实相关样本与噪声样本分开，从而提高判别能力。

### MS MARCO Dev  [1 docs, x1] [judged-distinct]  · aliases: MARCO Dev
MS MARCO 数据集的开发集，用于评估问答和文档检索系统的排序性能。它通常以排名指标衡量模型在真实查询上的检索质量。

### TREC DL Passage  [1 docs, x1] [judged-distinct]
TREC 深度学习任务中的段落检索评测子集，面向段落级相关性排序。它用于比较不同检索和重排序方法在段落检索上的效果。

### TREC DL Document  [1 docs, x1] [judged-distinct]
TREC 深度学习任务中的文档检索评测子集，面向文档级相关性排序。它用于评估系统在较长文本单位上的召回与排序能力。

### sparse methods  [1 docs, x1] [judged-distinct]
Retrieval methods that represent text with sparse features such as terms or lexical weights. They are often efficient and competitive in document retrieval, but can be outperformed by strong dense retrieval approaches in some settings.

### document retrieval  [1 docs, x1] [judged-distinct]
The task of ranking whole documents by their relevance to a query. It is a standard information retrieval setting where dense and sparse retrieval methods are commonly compared.

### global negatives  [1 docs, x1] [judged-distinct]
Negative examples drawn from a large or global candidate pool rather than only local in-batch samples. They expose the model to harder distinctions during training and can improve retrieval quality.

### term-level interactions  [1 docs, x1] [new]
Direct interactions between individual query terms and document terms during matching. Such interactions can improve fine-grained relevance modeling in search systems.

### Siamese network  [1 docs, x1] [new]
A neural architecture that encodes two inputs with shared parameters into comparable representations. It is commonly used for matching tasks because it allows efficient similarity computation after separate encoding.

### pre-computable document encoding  [1 docs, x1] [new]
A retrieval property in which document representations can be computed ahead of time and stored for later search. This reduces online computation and makes large-scale retrieval faster.

### online latency  [1 docs, x1] [new]
The time required for a retrieval system to answer a query at serving time. Lower latency is important for practical deployment and real-time search performance.

### T5-11B  [1 docs, x1] [judged-distinct]  · aliases: Text-to-Text Transfer Transformer 11B
一种参数规模很大的文本到文本转换模型，基于统一的序列到序列框架处理多种自然语言任务。它常作为开放域问答等任务中的生成式基线模型。

### 支持性段落  [1 docs, x1] [judged-distinct]  · aliases: support passages, supporting passages
从外部知识源中检索出的、与问题相关的文本段落，用于为答案提供证据。系统通常先检索这些段落，再在其基础上进行答案预测。

### 生成式编码器-解码器模型  [1 docs, x1] [judged-distinct]  · aliases: generative encoder-decoder model, seq2seq model
一种条件生成模型，先将输入编码为内部表示，再由解码器逐步生成输出文本。它在问答中可以根据问题和检索到的证据直接生成答案。

### global normalization  [1 docs, x1] [new]
A training or inference strategy that normalizes scores over all candidate answer spans associated with the correct answer. It is used to handle cases where multiple spans can express the same answer and to improve learning from span-level supervision.

### BiLSTM  [1 docs, x1] [judged-distinct]  · aliases: bidirectional long short-term memory, bidirectional LSTM
A bidirectional long short-term memory network that processes a sequence in both forward and backward directions. It is often used to encode text for ranking, classification, and other sequence modeling tasks.

### Wikipedia graph  [1 docs, x1] [new]  · aliases: the Wikipedia graph
A graph structure derived from Wikipedia entities and links that encodes relationships among topics and pages. It can be used as auxiliary knowledge to support document retrieval and reasoning.

### Wikidata graph  [1 docs, x1] [judged-distinct]  · aliases: the Wikidata graph
A graph structure derived from Wikidata entities and relations that represents structured factual knowledge. It can be used to provide additional information for retrieval and question answering.

### weak supervision  [1 docs, x1] [judged-distinct]
A training regime that relies on indirect, noisy, or incomplete supervision rather than fully annotated labels. In retrieval models, it can use question-answer pairs to learn useful matching behavior.

### question-answer pair  [1 docs, x1] [judged-distinct]  · aliases: question-answer pairs
A paired example consisting of a question and its corresponding answer. Such pairs can serve as weak supervision for training retrieval and reading systems.

### ELI5  [1 docs, x1] [new]  · aliases: Explain Like I'm Five, ELI5 dataset
A question answering dataset containing long, explanatory answers to open-ended questions. It is designed to encourage abstractive generation rather than short span extraction.

### abstractive model  [1 docs, x1] [judged-distinct]  · aliases: abstractive models
A model that generates a natural-language answer by paraphrasing, synthesizing, or composing information rather than copying an exact span from the source. Abstractive models are useful when the answer is not directly present as a contiguous text segment.

### large pretrained generative model  [1 docs, x1] [judged-distinct]  · aliases: large pretrained generative models
A generative language model that has been pretrained on large amounts of text before being adapted to downstream tasks. Such models can generate fluent answers and often benefit from substantial prior linguistic and factual knowledge.

### SpanSeqGen  [1 docs, x1] [judged-distinct]  · aliases: SpanSeqGen (Min et al., 2020)
A sequence generation approach that operates over spans extracted from text. It is used to generate answers or text conditioned on selected span evidence.

### Generative Pretrained Transformer 3  [1 docs, x1] [judged-distinct]  · aliases: GPT-3, GPT-3 few shot (Brown et al., 2020)
A large autoregressive language model trained to predict the next token in text. It can perform tasks in a few-shot setting by conditioning on examples in the prompt.

### Term frequency  [1 docs, x1] [new]
The count of how often a term appears in a document or passage. It is a basic statistic used by many information retrieval ranking functions.

### Apache Lucene  [1 docs, x1] [new]  · aliases: Lucene
一个开源的信息检索软件库，提供索引、搜索和相关排序功能。它常被用作实现经典稀疏检索方法的底层工具。

### SpaCy  [1 docs, x1] [new]  · aliases: spaCy
一个用于自然语言处理的开源软件库，提供分词、词性标注、命名实体识别等功能。它常用于对文本进行快速的预处理和语言分析。

### normalization  [1 docs, x1] [judged-distinct]
Normalization is a text preprocessing step used during answer evaluation to make predicted and reference answers comparable. It typically lowercases text and removes articles, punctuation, and extra whitespace.

### closed book T5  [1 docs, x1] [judged-distinct]  · aliases: T5
一种不依赖外部检索上下文的T5问答设置或模型，用参数化知识直接回答问题。它主要依靠模型内部存储的信息，而不是显式检索到的文档证据。

### end-to-end learning  [1 docs, x1] [judged-distinct]  · aliases: learn the whole system end-to-end
A training approach in which all components of a system are optimized jointly with a single objective. In question answering systems, this allows retrieval and answer generation to adapt to each other during training.

### latent retrieval  [1 docs, x1] [judged-distinct]
Latent retrieval is a retrieval method in which the relevant evidence is selected through latent variables rather than explicit supervision at retrieval time. It is used in weakly supervised question answering to improve answer finding when direct retrieval labels are unavailable.

### weakly supervised question answering  [1 docs, x1] [judged-distinct]
A question answering setting in which training supervision is indirect or incomplete, such as answer labels without explicit supporting evidence or reasoning steps. Methods for this setting must learn to infer the latent evidence or reasoning needed to produce the answer.

### knowledge-guided text retrieval and reading  [1 docs, x1] [judged-distinct]
A question answering approach that uses external knowledge to guide both document retrieval and the subsequent reading of retrieved text. The goal is to improve open-domain question answering by selecting more relevant evidence before answer extraction or generation.

### AmbigQA  [1 docs, x1] [judged-distinct]
A dataset and benchmark for answering ambiguous open-domain questions. It evaluates whether a system can recognize that a question may have multiple valid interpretations and provide answers for the intended or possible meanings.

### Okapi  [1 docs, x1] [judged-distinct]
一种经典的信息检索系统，采用词项统计和相关性建模来对文档进行排序。它在检索评测中被广泛用作基线系统，并影响了后续检索模型的发展。

### oLMpics  [1 docs, x1] [judged-distinct]  · aliases: on what language model pre-training captures
一个用于评测语言模型预训练所捕获知识的基准集合。它通过设计不同类型的语言任务来检验预训练模型是否学到了可迁移的语言和常识信息。

### R3  [1 docs, x1] [judged-distinct]  · aliases: Reinforced ranker-reader
一种用于开放域问答的检索与阅读联合模型，结合排序器和阅读器来定位并抽取答案。它通过强化学习式的训练方式优化检索排序和答案生成或抽取的协同效果。

### globally normalized BERT model  [1 docs, x1] [judged-distinct]
A BERT-based question answering model that assigns probabilities over answers using a global normalization over competing candidates. This approach is intended to make prediction more coherent across multiple passages or answer options.

### BERTserini  [1 docs, x1] [judged-distinct]
An end-to-end question answering system that combines BERT with the Anserini retrieval framework. It is designed to support open-domain question answering by retrieving relevant passages and then extracting answers from them.

### 秩亏性  [1 docs, x1] [judged-distinct]  · aliases: rank-deficiency
矩阵或更新在有效秩上显著低于其维度的性质。在线性化或参数更新分析中，它常用于解释为什么低秩近似能够以较少参数捕获适配所需的主要变化。

### task-specific parameters  [1 docs, x1] [new]  · aliases: task-specific parameter
A small set of parameters learned for a particular downstream task and stored separately from the base model. They allow a pre-trained model to be adapted without keeping a full updated copy for every task.

### external modules  [1 docs, x1] [new]  · aliases: external module
Additional learned components attached to a pre-trained model to support a new task. They provide task adaptation without modifying all of the original model parameters.

### 低内在维度  [1 docs, x1] [new]  · aliases: low intrinsic dimension
一种表征复杂系统所需自由度很少的性质，即使外在表示空间很高维，实际可学习的变化也可能主要落在低维子空间中。它常用于解释为什么过参数化模型在适配或学习时只需要少量有效方向。

### 低内在秩  [1 docs, x1] [judged-distinct]  · aliases: low intrinsic rank
一种假设或性质，认为模型在适配过程中的参数变化可以用低秩结构近似表示。它意味着原本高维的权重更新可以压缩为少量基向量的组合，从而便于高效训练与部署。

### 密集层  [1 docs, x1] [judged-distinct]  · aliases: dense layer
一种神经网络层，其中每个输入单元通常与每个输出单元相连接。它是最常见的线性变换结构之一，广泛用于表示和转换特征。

### 自注意力模块  [1 docs, x1] [judged-distinct]  · aliases: self-attention module
Transformer 中用于让序列位置之间相互交互的一类核心子结构。它通过查询、键和值之间的匹配来计算上下文表示，并通常包含输出投影。

### 查询投影矩阵  [1 docs, x1] [judged-distinct]  · aliases: Wq, query projection matrix
自注意力模块中把输入映射到查询表示的线性变换矩阵。查询表示随后与键表示一起用于计算注意力权重。

### 键投影矩阵  [1 docs, x1] [judged-distinct]  · aliases: Wk, key projection matrix
自注意力模块中把输入映射到键表示的线性变换矩阵。键表示与查询表示配对，用于决定注意力分配给哪些位置。

### 值投影矩阵  [1 docs, x1] [judged-distinct]  · aliases: Wv, value projection matrix
自注意力模块中把输入映射到值表示的线性变换矩阵。值表示会按照注意力权重加权汇聚，形成上下文相关的输出。

### 输出投影矩阵  [1 docs, x1] [judged-distinct]  · aliases: Wo, output projection matrix
自注意力模块末端将注意力结果映射回模型表示空间的线性变换矩阵。它通常把多头注意力的拼接结果转换为后续层可使用的表示。

### 预训练自回归语言模型  [1 docs, x1] [judged-distinct]  · aliases: autoregressive language model
在大规模语料上预先训练的生成式语言模型，按从左到右的方式建模序列概率。它可以在下游任务上继续适配，用于条件文本生成等应用。

### 条件文本生成  [1 docs, x1] [judged-distinct]  · aliases: conditional text generation
一种生成任务，模型在给定输入条件或提示的情况下生成目标文本。它通过最大化条件概率来学习从上下文到输出序列的映射。

### Natural language to SQL  [1 docs, x1] [judged-distinct]  · aliases: NL2SQL
A task that maps a natural language question or request to an executable SQL statement. It is used to translate user intent expressed in ordinary language into database queries.

### context-target pair  [1 docs, x1] [judged-distinct]
A supervised learning example consisting of an input context and a corresponding target output. The pair represents one input-output training instance used to learn a mapping from inputs to outputs.

### natural language query  [1 docs, x1] [judged-distinct]
A question or request expressed in ordinary human language. In query translation tasks, it serves as the input that is mapped to a formal query language such as SQL.

### SQL command  [1 docs, x1] [new]  · aliases: SQL statement
A statement written in Structured Query Language for retrieving, modifying, or managing data in a relational database. In translation tasks, it is the formal output corresponding to a natural language query.

### article summary  [1 docs, x1] [new]  · aliases: summary
A shorter text that condenses the main content of an article. It is used as the target output in summarization tasks.

### conditional language modeling objective  [1 docs, x1] [judged-distinct]  · aliases: language modeling objective
A training objective that maximizes the log-likelihood of each target token conditioned on an input and the previously generated target tokens. It is used to fit a model so that it assigns high probability to the correct output sequence given the context.

### parameter-efficient adaptation  [1 docs, x1] [judged-distinct]  · aliases: parameter-efficient approach, efficient adaptation
A model adaptation strategy that learns only a small number of additional or task-specific parameters instead of updating the full model. It reduces the storage and computation needed to adapt large pre-trained models to many downstream tasks.

### task-specific parameter increment  [1 docs, x1] [judged-distinct]  · aliases: ∆Φ
The change applied to a pre-trained model’s parameters to specialize it for a particular task. It represents the adaptation offset added to the base weights and can be encoded by a smaller set of trainable parameters.

### Bottleneck dimension  [1 docs, x1] [new]  · aliases: bottleneck
A bottleneck dimension is the size of the narrow hidden layer in a bottleneck architecture. In adapter modules, a small bottleneck dimension reduces the number of parameters and floating-point operations, but does not eliminate the extra sequential computation they introduce.

### Online inference  [1 docs, x1] [new]
Online inference is the process of running a trained model in real time for individual requests or very small batches. It prioritizes low latency and responsiveness, so additional sequential computation can have a noticeable performance impact.

### inference latency  [1 docs, x1] [new]  · aliases: latency
The time required for a model to produce an output during inference. It depends on model architecture and computational overhead, and extra modules such as adapters can increase it.

### dense layer  [1 docs, x1] [new]  · aliases: fully connected layer
A neural network layer whose outputs are computed by matrix multiplication with a learned weight matrix. Dense layers are common in deep learning models and are a natural target for low-rank or other parameter-efficient adaptation methods.

### weight matrix  [1 docs, x1] [judged-distinct]  · aliases: weights
A matrix of learned parameters that determines the linear transformation performed by a neural network layer. During adaptation, such matrices can be updated directly or modified through constrained update forms.

### low-rank update  [1 docs, x1] [judged-distinct]  · aliases: low-rank updates
A weight update represented by factors of limited rank rather than by a full unconstrained matrix. This reduces the number of trainable parameters while allowing the model to adapt.

### intrinsic dimension  [1 docs, x1] [new]  · aliases: intrinsic “instrisic” dimension
The effective dimensionality of the subspace in which a model can adapt successfully. A low intrinsic dimension suggests that useful task adaptation may be possible in a much smaller parameter subspace than the full model space.

### intrinsic rank  [1 docs, x1] [judged-distinct]  · aliases: “intrinsic rank”
The effective rank of the update needed to adapt a model to a new task. A low intrinsic rank means that the adaptation can be expressed well with a low-rank matrix decomposition.

### 全量微调  [1 docs, x1] [judged-distinct]  · aliases: full fine-tuning
一种对预训练模型的大部分或全部参数进行训练的适配方式。它通常具有较强表达能力，但需要更新的参数更多，计算和存储成本也更高。

### 高斯初始化  [1 docs, x1] [new]  · aliases: random Gaussian initialization
一种参数初始化方法，按高斯分布随机采样初始值。它常用于让可训练参数在训练开始时具有受控的随机性。

### 零初始化  [1 docs, x1] [new]  · aliases: zero initialization
一种将参数初始值全部设为零的初始化方式。它常用于确保某些增量参数在训练开始时不改变原模型输出。

### 推理延迟  [1 docs, x1] [new]  · aliases: inference latency
模型在执行推理时产生的额外时间开销。它通常由额外计算步骤或更复杂的参数结构引起，降低推理吞吐或增加响应时间。

### 权重合并  [1 docs, x1] [judged-distinct]  · aliases: weight merging, merge weights
将额外学习到的参数增量直接加到模型原始权重中，得到一个可直接用于推理的完整权重矩阵。这样可以避免在推理过程中引入额外分支或额外延迟。

### DeBERTa  [1 docs, x1] [judged-distinct]
DeBERTa is a pre-trained transformer language model that improves language understanding through enhanced attention and disentangled representations. It is used as a backbone for downstream task evaluation and adaptation.

### WikiSQL  [1 docs, x1] [new]
WikiSQL is a dataset for natural language to SQL question answering. It is used to evaluate systems that generate SQL queries from natural language input.

### SAMSum  [1 docs, x1] [new]
SAMSum is a dataset of dialogue summaries used to evaluate conversation summarization systems. It provides paired conversations and human-written summaries for training and testing summarization models.

### NVIDIA Tesla V100  [1 docs, x1] [judged-distinct]  · aliases: Tesla V100
NVIDIA Tesla V100 is a GPU accelerator used for high-performance machine learning training and inference. It provides the compute and memory resources needed to run large neural models.

### 冻结层  [1 docs, x1] [judged-distinct]  · aliases: freezing others
一种部分微调策略，其中某些层保持参数不变而不参与更新。它常与只更新少数层配合使用，以减少训练开销并保留已有表示。

### FTTop2  [1 docs, x1] [new]
一种只调整模型最后两层、同时冻结其他层的微调基线方法。它属于部分微调的一种实现方式，常用于作为对比基线。

### weight sharding  [1 docs, x1] [judged-distinct]  · aliases: weight shards
一种把模型权重切分成多个分片并分布存放或计算的技术。它常与模型并行配合使用，以支持更大规模模型的训练和部署。

### RoBERTa-base  [1 docs, x1] [judged-distinct]  · aliases: RoBbase
RoBERTa-base is a base-sized pretrained transformer language model in the RoBERTa family. It is commonly used as a backbone for downstream natural language processing tasks and can be adapted with full fine-tuning or parameter-efficient methods.

### AdptH  [1 docs, x1] [judged-distinct]  · aliases: AdptH†
AdptH is a parameter-efficient adaptation method for tuning a pretrained model with a limited number of additional trainable parameters. It is evaluated as an alternative to other adaptation strategies under the same model backbone.

### DeBXXL  [1 docs, x1] [new]  · aliases: DeBXXL
DeBXXL is a very large pretrained model variant used in benchmark comparisons. It is evaluated both with full fine-tuning and with LoRA-based adaptation to compare performance and parameter cost.

### Prefix-embedding tuning  [1 docs, x1] [judged-distinct]  · aliases: PreEmbed
A parameter-efficient tuning method that adds special trainable tokens to the input sequence by learning only their word embeddings. These tokens are placed before or within the prompt so they can steer the model without updating the main network weights.

### Prefixing  [1 docs, x1] [judged-distinct]
A way of placing special trainable tokens at the beginning of the input prompt in prefix-embedding tuning. The location of these tokens can affect model performance.

### Infixing  [1 docs, x1] [judged-distinct]
A way of placing special trainable tokens after the prompt in prefix-embedding tuning rather than before it. Like prefixing, it changes how added tokens influence the model’s computation.

### Prefix-layer tuning  [1 docs, x1] [judged-distinct]  · aliases: PreLayer
An extension of prefix-embedding tuning that learns trainable activations after each Transformer layer for special tokens. Instead of updating only embeddings, it replaces the intermediate activations with learned values throughout the network.

### Activation  [1 docs, x1] [new]
The numerical output produced by a neural network unit or layer after applying its computations. Activations serve as the intermediate representations passed from one layer to the next.

### AdapterH  [1 docs, x1] [judged-distinct]
The original Houlsby-style adapter design in which adapter layers are inserted between the self-attention module or the MLP module and the following residual connection. It uses a small bottleneck network with two fully connected layers and a nonlinear activation.

### AdapterDrop  [1 docs, x1] [judged-distinct]  · aliases: AdapterD
An adapter variant that improves efficiency by dropping some adapter layers. It reduces the number of active adapter modules while retaining the adapter-based fine-tuning framework.

### training objective  [1 docs, x1] [judged-distinct]  · aliases: objective
A training objective is the learning target that a model is optimized to satisfy during training. It shapes which outputs the model is rewarded for producing, and in some cases it can incentivize false but statistically likely answers.

### deceptive model  [1 docs, x1] [judged-distinct]  · aliases: deceptive models
A deceptive model is a model that can generate plausible false statements in ways that are not easily identifiable. Such a model can be used for disinformation or fraud because its outputs may appear credible while being untrue.

### false and informative answers  [1 docs, x1] [new]
Answers that contain incorrect information while still appearing useful or detailed. Such responses can be especially deceptive because they combine plausibility with factual error.

### automated metric  [1 docs, x1] [new]  · aliases: metric
A computational measure used to estimate model quality without requiring manual scoring each time. Such a metric can be trained or calibrated on human judgments so that it predicts those judgments on new cases.

### 真实性目标  [1 docs, x1] [new]  · aliases: truthfulness objective
一种评估目标，要求陈述与现实世界的字面事实一致。只有在真实世界中可被公开可靠证据支持的事实才被视为真实，而仅在某种信仰体系或传统中成立的说法被视为虚假。

### 标量真实性分数  [1 docs, x1] [new]  · aliases: scalar truth score
一种将陈述的真实性表示为区间 [0, 1] 内数值的方法，可解释为该陈述为真的概率。它允许对含糊或不准确程度不同的生成内容进行连续评分，并可根据阈值转换为更易解释的判断。

### target model  [1 docs, x1] [judged-distinct]
A target model is the model being evaluated or attacked in an adversarial testing setup. Its behavior determines whether a generated question is considered effective at inducing incorrect answers.

### combined results  [1 docs, x1] [new]
Combined results are evaluation results reported by pooling multiple subsets of test items into a single aggregate. This approach gives an overall summary across categories that may also be analyzed separately.

### adversarial questions  [1 docs, x1] [judged-distinct]
Adversarial questions are questions constructed to provoke incorrect or unreliable answers from a model. They are used in evaluation to probe model weaknesses rather than to sample typical user queries.

### external validation  [1 docs, x1] [new]
External validation is the process of having independent reviewers assess the quality or correctness of an evaluation. It is used to estimate how often different judges might disagree with the original assessments.

### GPT-J  [1 docs, x1] [judged-distinct]
An open autoregressive language model in the GPT-Neo/J family. It follows the GPT-style transformer design and is trained on a different data mixture from GPT-3.

### 真零样本设置  [1 docs, x1] [judged-distinct]
一种更严格的零样本评测方式，不仅不使用目标任务示例，也不对提示和超参数进行任何基于目标任务示例的调优。它旨在确保比较对象完全没有利用该任务数据进行间接适配。

### 真少样本学习  [1 docs, x1] [judged-distinct]  · aliases: true few-shot learning
一种严格的少样本评测定义，要求模型在使用少量示例时不对这些示例进行额外的调参或间接利用。它强调对任务适应过程的控制，以避免评测结果受到数据泄漏或调优偏差影响。

### QA prompt  [1 docs, x1] [judged-distinct]  · aliases: question-answering prompt
一种用于问答任务的提示模板，通常包含与待测任务风格不同的琐事问题，用来引导模型生成答案。它可以作为通用的问答输入格式，并适用于多种模型家族和规模。

### Helpful prompt  [1 docs, x1] [judged-distinct]
一种倾向于鼓励模型给出更真实回答的提示。它通过提示措辞影响模型的输出行为，使模型更可能给出有帮助且诚实的回答。

### Harmful prompt  [1 docs, x1] [judged-distinct]
一种倾向于鼓励模型给出较不真实回答的提示。它通过提示措辞影响模型的输出行为，用于检验模型对不同指令风格的敏感性。

### few-shot benchmark  [1 docs, x1] [judged-distinct]  · aliases: few-shot
A benchmark evaluated using a small number of in-context examples before the test item. Performance on such benchmarks reflects how well a model generalizes from limited demonstrations.

### GPT-judge  [1 docs, x1] [judged-distinct]  · aliases: GPT judge
一种用于自动评估答案真伪的指标或判别器。它是经过微调的 GPT-3-6.7B 模型，用来将问题答案分类为真或假，从而作为人工评估的替代或近似。

### non-imitative falsehood  [1 docs, x1] [judged-distinct]
A false answer produced by a model for reasons other than imitation, such as the syntax or style of the question. These falsehoods are not incentivized by the model’s training objective and arise from non-imitative weaknesses.

### weakness  [1 docs, x1] [new]
A property of a model that leads it to perform poorly on a task. In this sense, a weakness is any model characteristic that causes falsehoods or other failures in task performance.

### imitative weakness  [1 docs, x1] [judged-distinct]
A model property that causes falsehoods through imitative behavior. It leads the model to produce imitative falsehoods, where incorrect answers arise from copying or reinforcing erroneous patterns.

### informativeness  [1 docs, x1] [new]
Informativeness is the degree to which a response contains useful, relevant content for answering a question. An informative answer may be valuable even if it is not fully correct, but it should not be empty or evasive.

### generation task  [1 docs, x1] [judged-distinct]
A generation task is an evaluation setting in which a model produces free-form text as an answer. It is used to assess qualities such as correctness, usefulness, and fluency in open-ended responses.

### paraphrase  [1 docs, x1] [new]
A reworded version of a question that preserves its meaning while changing its wording. Paraphrases are used to test whether a model’s behavior depends on exact surface form or on deeper semantic content.

### semantic weakness  [1 docs, x1] [judged-distinct]
A failure mode in which a model mishandles meaning-level content rather than surface form. These weaknesses are harder to rule out because they can persist across paraphrases and different question forms.

### natural language rationale  [1 docs, x1] [judged-distinct]  · aliases: rationale
A step-by-step explanation expressed in natural language that connects a problem statement to a final answer. It can help a model perform reasoning tasks by making intermediate deductions explicit.

### neuro-symbolic methods  [1 docs, x1] [new]
Approaches that combine neural network models with symbolic representations or algorithms. They are often used to improve reasoning by integrating learned language understanding with formal computation.

### formal language  [1 docs, x1] [new]
A precisely defined symbolic language with explicit syntax and semantics, used to represent structured information and reasoning steps. In reasoning systems, formal languages can provide unambiguous intermediate representations for computation.

### rationale-augmented training  [1 docs, x1] [new]  · aliases: rationale-augmented fine-tuning
一种在训练或微调中加入推理说明或理由的学习方式。它依赖高质量的 rationales 来帮助模型学习更可解释、也更适合推理的映射关系。

### intermediate steps  [1 docs, x1] [new]
推理或解决复杂问题时使用的中间阶段。它们把一个多步问题分解为若干更小的子步骤，以便逐步完成计算或推断。

### debugging  [1 docs, x1] [new]
对错误推理或错误输出进行检查、定位和修正的过程。它常借助可解释的中间过程来识别问题出现在何处。

### solution  [1 docs, x1] [new]  · aliases: solutions
为问题给出的完整解答或结果。它通常包含从条件到结论的最终推导或计算结果。

### density  [1 docs, x1] [new]
密度是单位体积内所含物质质量的物理量，常用于比较不同物体在相同体积下有多“重”。密度大小会影响物体在液体中的浮沉行为，密度小于液体时通常更容易漂浮。

### screen pass  [1 docs, x1] [new]
屏风式传球是一种美式足球战术传球，接球手通常先向外侧移动或利用掩护，再接到短传。它常用于通过跑动和掩护创造接球空间。

### NFC Championship Game  [1 docs, x1] [new]  · aliases: NFC championship
NFC冠军赛是美国国家橄榄球联合会季后赛中的冠军决定性比赛，用于决出代表NFC参加超级碗的球队。它是美国职业橄榄球赛季后期的重要赛事之一。

### CSQA  [1 docs, x1] [new]  · aliases: CommonsenseQA
A commonsense question answering benchmark that tests whether a system can answer questions requiring everyday world knowledge. It is used to measure commonsense reasoning rather than pure factual recall.

### StrategyQA  [1 docs, x1] [judged-distinct]
A question answering benchmark that requires implicit reasoning and multi-step inference to determine the answer. It is designed to test strategic commonsense reasoning over questions that are not answered by simple lookup.

### Date Understanding  [1 docs, x1] [new]
A benchmark that asks questions involving dates and calendar reasoning. It evaluates a system's ability to reason about temporal relationships, day counts, and date-based transformations.

### Sports Understanding  [1 docs, x1] [new]
A benchmark that requires reasoning about sports-related situations and rules. It evaluates whether a system can understand and infer outcomes from sports descriptions.

### Last Letter Concatenation  [1 docs, x1] [new]
A symbolic reasoning task in which the last letters of words are extracted and combined according to the problem instructions. It is used to test a model's ability to follow simple formal transformations rather than rely on world knowledge.

### Coin Flip  [1 docs, x1] [new]  · aliases: Coin Flip (state tracking)
A state-tracking reasoning task in which the orientation of a coin is updated after a sequence of flips. It tests whether a system can correctly track a changing state over multiple operations.

### SayCan  [1 docs, x1] [new]
A robot instruction-following framework that combines language understanding with action planning. It maps a user's natural-language request into a sequence of robot actions that can accomplish the goal.

### LaMDA  [1 docs, x1] [judged-distinct]
LaMDA is a large language model family designed for conversational and general language understanding tasks. It is available in multiple parameter scales, allowing performance to be compared across model sizes.

### UL2  [1 docs, x1] [new]  · aliases: UL2 20B
UL2 is a large language model architecture and model family used for evaluation on language tasks. A specific 20B-parameter version is referenced as one of the tested models.

### majority final answer  [1 docs, x1] [new]
Majority final answer is an aggregation strategy that chooses the answer appearing most often across many generated outputs. It can improve robustness by leveraging repeated sampled reasoning traces or candidate solutions.

### randomly shuffled order of exemplars  [1 docs, x1] [new]  · aliases: exemplar order
A randomly shuffled order of exemplars is a presentation order in which demonstration examples are rearranged randomly before being shown to a model. It is used to measure whether output depends on exemplar ordering.

### SingleOp  [1 docs, x1] [new]
An easy subset of MAWPS that requires only a single operation to solve. It is used to assess performance on simpler arithmetic problems with minimal multi-step reasoning.

### one-step problem  [1 docs, x1] [new]  · aliases: one-step or two-step problems
A problem that can be solved with a single reasoning step or direct calculation. Such problems often do not require extended intermediate reasoning to derive an equation from the question.

### two-step problem  [1 docs, x1] [judged-distinct]  · aliases: one-step or two-step problems
A problem that requires two reasoning steps to reach the answer. It is more complex than a one-step problem but still simpler than tasks requiring longer chains of reasoning.

### variable computation  [1 docs, x1] [new]  · aliases: variable compute
The use of different amounts of intermediate processing, often reflected in generating more or fewer tokens before an answer. In this context, it refers to the hypothesis that harder problems may benefit from spending more computation on intermediate outputs.

### intermediate tokens  [1 docs, x1] [judged-distinct]
Tokens generated between the input prompt and the final answer that represent intermediate computation or reasoning. They provide a way for a model to allocate additional processing to a problem before committing to an output.

### natural language  [1 docs, x1] [judged-distinct]
Human-readable linguistic form used to express meanings and reasoning in words and phrases. In chain-of-thought prompting, natural language is used to render intermediate steps explicitly instead of leaving them implicit.

### PaLM 540B  [1 docs, x1] [judged-distinct]  · aliases: PaLM
A 540-billion-parameter language model variant used for evaluating prompting methods. It is a large pretrained language model designed to perform a wide range of language tasks, including reasoning benchmarks.

### annotator  [1 docs, x1] [new]
A person who prepares or supplies examples, labels, or prompt demonstrations for an evaluation setup. Different annotators can introduce variation in the style and content of prompt exemplars.

### exemplar-based prompting  [1 docs, x1] [judged-distinct]
A prompting approach that relies on example demonstrations to steer a language model toward a desired task behavior. Its effectiveness can vary with the specific exemplars used, their order, and their wording.

### unintended behaviors  [1 docs, x1] [new]
Outputs from a language model that depart from the intended goal of the system or the user's request. These behaviors can include fabricating facts, producing biased or toxic text, or failing to follow instructions.

### user instructions  [1 docs, x1] [new]
Directives or requests given by a user to guide a system's behavior or output. In language-model applications, following user instructions means producing responses that satisfy the requested task, format, or constraints.

### 有帮助、诚实且无害  [1 docs, x1] [judged-distinct]  · aliases: helpful, honest, and harmless, HHH
一种用于评价或规范语言模型行为的三项准则。模型应帮助用户完成任务，避免捏造或误导信息，并且不应对人、社会或环境造成物理、心理或社会伤害。

### GPT-3 architecture  [1 docs, x1] [judged-distinct]  · aliases: GPT-3
A transformer-based autoregressive language-model architecture used by GPT-3 and related models. It defines the network structure and generation style while allowing different models to share the same underlying architecture but differ in training and alignment.

### closed-domain question answering  [1 docs, x1] [new]  · aliases: closed-domain QA
A question-answering setting in which the correct response must be grounded in the provided input or a restricted source of information. The model should avoid introducing extra facts that are not present in the context.

### human data  [1 docs, x1] [judged-distinct]
Data annotated or produced by people that reflects human preferences, judgments, or demonstrations. It is used to supervise or align models toward desired behavior.

### RealToxicityPrompts  [1 docs, x1] [judged-distinct]
A benchmark dataset of prompts designed to probe whether language models continue with toxic content. It is used to measure toxicity in generated outputs through automatic and human evaluation.

### Winogender  [1 docs, x1] [new]
A benchmark dataset for evaluating gender bias in language understanding and generation. It tests whether systems exhibit stereotypical or biased behavior when resolving pronouns in gendered contexts.

### CrowS-Pairs  [1 docs, x1] [new]  · aliases: CrowSPairs
A benchmark dataset for measuring social bias in language models. It contains paired examples that contrast stereotyped and anti-stereotyped sentences to assess whether a model prefers biased language.

### performance regression  [1 docs, x1] [new]  · aliases: performance regressions
A decrease in model performance on one set of tasks or benchmarks after changes intended to improve other behaviors. In language models, it often appears as worse scores on established public NLP datasets after alignment training.

### public NLP dataset  [1 docs, x1] [judged-distinct]  · aliases: public NLP datasets
A publicly available benchmark dataset used to evaluate natural language processing systems. Such datasets cover tasks like question answering, commonsense reasoning, and translation.

### DROP  [1 docs, x1] [new]
A reading comprehension benchmark that requires discrete reasoning over paragraphs, including arithmetic and counting. It is designed to test whether models can combine textual understanding with symbolic reasoning.

### HellaSwag  [1 docs, x1] [new]
A commonsense reasoning benchmark based on choosing plausible continuations for short contexts. It evaluates whether a model can predict the most sensible ending among several candidates.

### WMT 2015 French to English translation  [1 docs, x1] [judged-distinct]  · aliases: WMT 2015 French-English translation
A machine translation benchmark for translating French text into English. It is used to evaluate translation quality on standardized test data from the WMT 2015 shared task.

### alignment tax  [1 docs, x1] [new]
A reduction in performance on some tasks that occurs as a cost of making a model more aligned with human preferences or safety goals. The term emphasizes that improving behavior on one axis can sometimes degrade benchmark results on another.

### PPO-ptx  [1 docs, x1] [new]  · aliases: PPO-ptx
一种将PPO更新与增加预训练分布对数似然的更新混合在一起的训练方法。它用于在保持标签器偏好分数不变的同时，减少某些任务上的性能退化。

### 预训练分布  [1 docs, x1] [judged-distinct]  · aliases: pretraining distribution
模型在大规模预训练阶段所拟合的数据分布。对数似然朝向这一分布的优化可用于保留通用语言建模能力，并减轻后续对齐训练带来的性能回退。

### 标签器偏好分数  [1 docs, x1] [new]  · aliases: labeler preference scores
由人类标签器对模型输出进行偏好比较后得到的评分指标。它反映输出是否更符合人工偏好，常用于评估对齐训练后的模型质量。

### 留出标签器  [1 docs, x1] [judged-distinct]  · aliases: held-out labelers
未参与生成训练数据、但用于评估模型泛化能力的人类标注者群体。若模型对这些标注者的偏好判断表现与训练标注者相近，说明其偏好对齐具有一定泛化性。

### 监督微调基线  [1 docs, x1] [judged-distinct]  · aliases: SFT baseline
在监督学习阶段对语言模型进行微调后得到的基准模型。它通常作为后续对齐方法的比较对象，用来衡量额外训练是否带来改进。

### 代码总结  [1 docs, x1] [new]  · aliases: summarizing code
对程序代码的功能、结构或行为进行简洁自然语言概括的任务。它要求模型从源代码中提炼核心信息并用人类可读语言表达出来。

### 代码问答  [1 docs, x1] [judged-distinct]  · aliases: answer questions about code
围绕程序代码内容提出问题并生成答案的任务。它要求模型理解代码语义、变量关系和程序行为。

### human preferences  [1 docs, x1] [judged-distinct]
Human preferences are judgments expressed by people about which model outputs are better, more helpful, or more appropriate. They can be used as a training signal when explicit gold-standard answers are unavailable or insufficient.

### simple mistakes  [1 docs, x1] [new]
Simple mistakes are basic failures in model behavior such as ignoring an instruction, hallucinating facts, or mishandling straightforward questions. They indicate that a model may still be unreliable even after alignment-oriented training.

### false premises  [1 docs, x1] [new]
False premises are assumptions in a prompt that are incorrect or misleading. Detecting them requires the ability to recognize when a question contains an invalid presupposition rather than answering it directly.

### safety and reliability  [1 docs, x1] [new]
Safety and reliability are desirable properties of a model that reduce harmful behavior and make outputs consistently trustworthy. They are often treated as central goals in alignment work and model deployment.

### human feedback  [1 docs, x1] [judged-distinct]
Human feedback is information provided by people about model behavior, such as preferences, rankings, or corrections. It can be used to guide training toward outputs that better match human expectations.

### 强化学习  [1 docs, x1] [judged-distinct]  · aliases: RL, reinforcement learning
一种通过试错来学习决策策略的机器学习方法，学习过程依赖于奖励信号来逐步改进行为。它常用于控制、对齐和序列生成等任务。

### 对话  [1 docs, x1] [judged-distinct]
一种以多轮交流为核心的自然语言任务或应用场景，系统需要根据上下文生成合适的回应。它常用于评估和训练面向交互的语言模型。

### 语义解析  [1 docs, x1] [judged-distinct]
一种将自然语言句子映射为可执行的形式化表示的任务，常见于把用户意图转换为逻辑形式、查询或程序。它需要同时捕捉语言含义与结构化输出约束。

### 故事生成  [1 docs, x1] [judged-distinct]
一种根据给定条件自动生成叙事文本的生成任务，通常要求内容连贯、情节合理并具有一定的创造性。它常用于研究开放式文本生成能力。

### 评论生成  [1 docs, x1] [judged-distinct]  · aliases: review generation
一种自动生成产品、服务或内容评价文本的生成任务，通常需要表现出特定观点、语气和内容组织方式。它常用于研究可控文本生成和风格建模。

### 证据抽取  [1 docs, x1] [judged-distinct]  · aliases: evidence extraction
一种从文本中识别并提取与某个结论、答案或主张相关支持性片段的任务。它常用于可解释推理、信息检索和事实核查。

### 书面人类反馈  [1 docs, x1] [new]  · aliases: written human feedback
以书面形式记录的人类评价、建议或批注，可作为训练信号、提示补充或数据增强材料。它能够提供比单纯分数更细粒度的指导信息。

### 文本环境  [1 docs, x1] [judged-distinct]  · aliases: text-based environments
一种以文本作为状态、动作或观测形式的交互环境，智能体只能通过读写文本与环境交换信息。它常用于研究语言驱动的决策和推理。

### 智能体对齐  [1 docs, x1] [new]  · aliases: aligning agents
使智能体的行为、目标和输出与人类意图、规范或价值一致的过程或研究方向。它关注在复杂环境中控制行为偏差并提高可靠性。

### normative prior  [1 docs, x1] [new]
A prior assumption or preference structure that encodes normative judgments about desired behavior. It guides learning toward outputs considered better or more appropriate under those judgments.

### language assistants  [1 docs, x1] [judged-distinct]
Language-model-based systems designed to assist users through conversation and task completion. They are often used as a testbed for studying alignment and safety properties in realistic interactive settings.

### cross-task generalization  [1 docs, x1] [judged-distinct]
The ability of a language model trained on one set of tasks or datasets to perform well on different, unseen tasks. It is often evaluated by fine-tuning on multiple tasks and testing on held-out tasks.

### held-out tasks  [1 docs, x1] [judged-distinct]
Tasks that are excluded from training and used only for evaluation. They measure whether a model generalizes beyond the examples it has seen during training.

### instruction following for navigation  [1 docs, x1] [new]
A form of learning in which a model is trained to interpret natural-language directions and execute them to move through an environment. It is commonly studied in simulated navigation settings.

### simulated environment  [1 docs, x1] [new]
A computationally generated world used for training or evaluating agent behavior without acting in the physical world. It allows controlled experiments on tasks such as navigation.

### harms of language models  [1 docs, x1] [judged-distinct]
Negative real-world effects that can arise from deploying language models, including biased outputs, harmful content, and other unsafe or misleading behavior. Studying these harms motivates methods for safer model design and alignment.

### gaming misspecified objectives  [1 docs, x1] [new]
Behavior in which a model exploits flaws in an objective function or training signal to appear successful while failing the underlying intended goal. It is a common failure mode when the specified objective does not fully capture the desired behavior.

### private data leakage  [1 docs, x1] [new]  · aliases: leak private data
Private data leakage is the unintended release of sensitive information that was present in training data or internal model representations. In language models, this can occur when the model memorizes and later reproduces personal or confidential text.

### stereotype  [1 docs, x1] [new]  · aliases: stereotypes
A stereotype is an oversimplified and often socially biased generalization about a group of people. In language-model evaluation, stereotypes are used as a benchmark category for measuring whether generated text reproduces harmful associations.

### social bias  [1 docs, x1] [judged-distinct]
Social bias is systematic preferential or prejudicial treatment reflected in language or predictions about social groups. In language models, it is commonly evaluated by checking whether generated text encodes unequal associations or disparities.

### value-targeted dataset  [1 docs, x1] [new]
A value-targeted dataset is a curated training set built to express or reinforce specific human values or behavioral goals. It is used to steer a model toward preferred responses during fine-tuning or similar adaptation methods.

### conditional likelihood  [1 docs, x1] [judged-distinct]
Conditional likelihood is the probability a model assigns to text given a context or preceding input. It is used to score how likely a language model is to generate particular phrases or documents under specific conditions.

### safety-specific control token  [1 docs, x1] [new]  · aliases: control token, control tokens
A safety-specific control token is an added special token used to condition a language model’s generation toward safer or less harmful outputs. By providing the model with explicit control signals during training or decoding, it can bias generation toward a desired safety behavior.

### human-in-the-loop data collection  [1 docs, x1] [judged-distinct]
Human-in-the-loop data collection is a training strategy in which humans actively provide examples, labels, or feedback during the data-gathering process. It is used to improve model behavior on tasks where automatic data alone is insufficient, especially for safety-sensitive generation.

### word embedding regularization  [1 docs, x1] [judged-distinct]
Word embedding regularization is a technique that constrains or adjusts learned word representations to reduce unwanted associations in a model. It is used to mitigate biased or harmful generations by shaping the geometry of the embedding space.

### null space projection  [1 docs, x1] [new]
Null space projection is a representation-editing method that removes or suppresses information associated with sensitive attributes by projecting model representations onto a subspace that excludes those attributes. It is used to make token distributions more uniform or less biased with respect to protected concepts.

### causal mediation analysis  [1 docs, x1] [new]
Causal mediation analysis is a method for decomposing the effects of an input or intervention into indirect pathways that operate through intermediate variables. In language-model analysis, it can be used to identify how internal representations contribute to biased or harmful outputs.

### language model steering  [1 docs, x1] [judged-distinct]  · aliases: steering the generation
Language model steering is the process of guiding a model’s generated text toward a desired style, content, or safety property at inference time. It commonly uses an auxiliary model, prompts, or control signals to influence the generation without retraining the main model.

### OpenAI Playground  [1 docs, x1] [new]  · aliases: Playground interface
OpenAI Playground is an interface for directly interacting with models through the OpenAI API. It is used for submitting prompts and testing model behavior in an interactive setting.

### Plain prompt  [1 docs, x1] [judged-distinct]  · aliases: Plain
A prompt type in which a labeler invents an arbitrary task, with an emphasis on ensuring the set of tasks is diverse. It is used to gather varied instruction-like examples for training instruction-following models.

### User-based prompt  [1 docs, x1] [judged-distinct]  · aliases: User-based
A prompt type derived from stated use cases in API waitlist applications. It is designed to resemble real user needs and to supply training prompts that match practical application scenarios.

### SFT dataset  [1 docs, x1] [new]  · aliases: supervised fine-tuning dataset, SFT
A supervised fine-tuning dataset made of labeler demonstrations used to train supervised instruction-following models. It contains training prompts from both API sources and labeler-written prompts.

### RM dataset  [1 docs, x1] [new]  · aliases: reward model dataset, RM
A reward-model training dataset composed of prompts and labeler rankings of model outputs. It is used to train reward models that score or prefer candidate responses.

### PPO dataset  [1 docs, x1] [new]  · aliases: policy optimization dataset, PPO
A dataset of prompts without human labels that serves as input for policy optimization in reinforcement learning from human feedback. It is used to fine-tune models with PPO-based RLHF training.

### labeler intent  [1 docs, x1] [new]  · aliases: user intent
The inferred purpose or goal behind a user prompt as judged by human annotators. It captures what the user most likely wanted the model to do, especially when the prompt is indirect or ambiguous.

### biased or toxic language  [1 docs, x1] [judged-distinct]  · aliases: biased language, toxic language
Language that expresses unfair prejudice, discrimination, or harmful abuse toward people or groups. It is often treated as a form of undesirable output when evaluating model responses.

### screening test  [1 docs, x1] [new]
A screening test is a preselection assessment used to evaluate candidates against specific criteria before they are chosen for a task or role. It is designed to identify individuals who meet the desired performance standards on the relevant dimensions.

### alignment criteria  [1 docs, x1] [judged-distinct]
Alignment criteria are the standards used to judge whether an AI system's behavior matches desired goals such as usefulness, safety, or user preference. Different criteria can conflict with one another, requiring a choice about which objectives to prioritize in a given situation.

### potentially harmful response  [1 docs, x1] [new]
A potentially harmful response is an output that may cause harm, misinformation, or other negative consequences if given to a user. Such responses are often treated specially in safety-oriented evaluation and training because they can conflict with other goals like helpfulness.

### helpfulness  [1 docs, x1] [new]
Helpfulness is a quality of an assistant response that measures how well it satisfies the user's request and supports the user's goals. In alignment settings, it is one of the core objectives that may need to be balanced against safety-related criteria.

### fact checking  [1 docs, x1] [new]
Fact checking is the task of assessing whether a claim is supported or refuted by available evidence. It typically requires retrieving relevant information and comparing it against the claim to determine its truthfulness.

### generalisation  [1 docs, x1] [judged-distinct]  · aliases: generalization
模型将从训练中获得的能力迁移到未见任务或未见样本上的能力。它体现了模型在新情境下继续表现良好的程度，而不只是记忆训练数据。

### memorisation  [1 docs, x1] [judged-distinct]  · aliases: memorization
模型在参数中存储和复现训练数据或相关信息的能力。它使模型能够回忆细节，但不一定意味着能够对新任务做出良好的泛化。

### 稠密检索器  [1 docs, x1] [judged-distinct]  · aliases: dense retriever
稠密检索器是一种基于向量表示进行文档检索的检索系统。它通过学习查询和文档的嵌入来衡量语义相似性，从而找出与当前上下文最相关的资料。

### Wikipedia index  [1 docs, x1] [judged-distinct]  · aliases: Wikipedia
An index built over Wikipedia documents for retrieval-based systems. It supports searching and retrieving relevant Wikipedia passages as external evidence for a model.

### product quantisation  [1 docs, x1] [judged-distinct]  · aliases: product quantization
A vector compression technique that splits vectors into subspaces and quantizes each part separately. It reduces memory usage and speeds up approximate nearest-neighbor retrieval while aiming to preserve retrieval quality.

### compressed index  [1 docs, x1] [new]
A retrieval index stored in a compact representation to reduce memory consumption. It trades off some representation detail for lower storage cost and often faster retrieval.

### uncompressed index  [1 docs, x1] [judged-distinct]
A retrieval index stored in its full original representation without compression. It typically uses more memory but can preserve the exact stored vectors or embeddings more faithfully.

### updatability  [1 docs, x1] [new]
The ability of a model or retrieval system to incorporate new information over time without full retraining from scratch. It is important for keeping knowledge current and correcting outdated facts.

### full-dataset finetuning  [1 docs, x1] [judged-distinct]  · aliases: full-dataset fine-tuning
A training regime in which a pretrained model is adapted using the entire labeled dataset for a task. It aims to maximize task performance by exposing the model to all available supervision.

### MoCo contrastive loss  [1 docs, x1] [judged-distinct]  · aliases: MoCo
一种对比学习损失函数，用于拉近正样本表示、推远负样本表示。它通常结合动量编码器和队列机制来构造大量负样本，从而提升表示学习效果。

### unsupervised data  [1 docs, x1] [judged-distinct]
不依赖人工标注标签的数据。它常用于表示学习和预训练任务中，以降低对标注资源的需求。

### gradient descent  [1 docs, x1] [judged-distinct]
一种通过沿损失函数负梯度方向迭代更新参数的优化方法。它广泛用于训练机器学习模型以最小化目标函数。

### Attention Distillation  [1 docs, x1] [new]  · aliases: ADist
A training objective that transfers document-importance signals from a language model to a retriever. It uses attention-derived document scores as soft targets and updates the retriever so that it assigns higher probability to documents the language model relies on.

### retriever probability distribution  [1 docs, x1] [judged-distinct]  · aliases: pretr
A normalized distribution over candidate documents produced from retriever scores. It assigns higher probability to documents with larger query-document similarity scores, often restricted to the top-K retrieved documents.

### dot-product similarity  [1 docs, x1] [judged-distinct]  · aliases: dot-product between the query and documents vectors
A similarity function that scores a query-document pair by taking the dot product of their vector representations. It is widely used in retrieval models because higher values indicate greater alignment between the query and a document.

### pre-softmax score  [1 docs, x1] [judged-distinct]  · aliases: pre-softmax scores
A raw model score computed before applying the softmax normalization. These scores are often used as stable training signals because they preserve relative preference information before probabilities are formed.

### 值向量范数  [1 docs, x1] [new]  · aliases: norm of the value, value norm, ∥v∥2
向量长度的度量，用来反映向量本身的大小。在注意力加权中，它可以与注意力权重结合，用于衡量某个输入项对输出的实际贡献。

### 相关性分数  [1 docs, x1] [new]  · aliases: relevance score
用于衡量输入项或文档与查询相关程度的数值。它通常由模型中的多个信号组合得到，并可用于后续的排序或概率化处理。

### StopGradient算子  [1 docs, x1] [judged-distinct]  · aliases: StopGradient
一种自动微分中的控制操作，用于阻断梯度从某个张量向前传播。它常用来限制哪些参数会在训练中被更新。

### EMDR2  [1 docs, x1] [judged-distinct]  · aliases: End-to-end training of Multi-Document Reader and Retriever, Multi-Document Reader and Retriever
一种用于同时训练多文档阅读器和检索器的端到端方法。它把检索到的文档视为潜变量，并利用检索概率与语言模型似然共同构造训练目标。

### 期望最大化算法  [1 docs, x1] [new]  · aliases: EM algorithm, expectation-maximization algorithm
一种在存在潜变量时进行参数估计的迭代优化框架。它通过在隐变量的期望和参数更新之间交替进行，来最大化观测数据的似然。

### 潜变量  [1 docs, x1] [judged-distinct]  · aliases: latent variable
在模型中未被直接观测到、但会影响观测结果的变量。它们通常需要通过边缘化、近似推断或迭代优化来处理。

### 多文档阅读器  [1 docs, x1] [judged-distinct]  · aliases: multi-document reader
一种面向多篇检索文档进行阅读和答案生成的模型。它综合来自多个文档的信息，以支持更准确的答案预测。

### EMDR2 loss function  [1 docs, x1] [judged-distinct]  · aliases: EMDR2
一种用于训练检索器的损失函数，其目标是使文档概率分布成为与语言模型输出最高概率对应的文档的指示性分布。它在实践中按 token 级别应用，而不是按整个序列级别应用。

### prefix language modeling  [1 docs, x1] [judged-distinct]
A language modeling objective that predicts a continuation from an initial prefix of a text. The input is split into a prefix and a target continuation, and the model is trained to generate the continuation from the prefix.

### special sentinel mask token  [1 docs, x1] [judged-distinct]  · aliases: sentinel mask token, special mask token
A dedicated token inserted into an input sequence to mark the beginning of a masked span. It allows the model to identify and generate each missing span in a structured way.

### retriever vocabulary  [1 docs, x1] [judged-distinct]
The set of tokens supported by a retrieval component for representing and processing text. It constrains how queries or special symbols are encoded for document retrieval.

### document-conditioned language model  [1 docs, x1] [judged-distinct]  · aliases: LM
A language model that generates text while being conditioned on one or more retrieved documents. The retrieved documents provide external context that can influence the model’s predictions.

### title-to-section generation  [1 docs, x1] [new]  · aliases: section generation
A text generation task in which a model produces the content of a Wikipedia section from the article title together with the section title. The input is the pair of titles, and the output is the section text itself.

### T5-XL  [1 docs, x1] [judged-distinct]  · aliases: T5 XL
T5-XL is an extra-large configuration of the Text-to-Text Transfer Transformer model. It is a large sequence-to-sequence language model with many parameters, often used as a stronger but more expensive downstream model.

### activation checkpointing  [1 docs, x1] [new]  · aliases: activation recomputation, 梯度检查点, 激活检查点
一种节省训练内存的技术，在前向传播时只保留部分中间激活值，其余在反向传播时按需重新计算。它通常用来在计算开销增加的情况下降低显存占用。

### Euclidean distance  [1 docs, x1] [judged-distinct]
A geometric distance measure between two vectors, defined as the length of the straight line connecting them in vector space. In retrieval systems, it is used to score how close a document embedding is to a query embedding.

### hard negatives mining  [1 docs, x1] [judged-distinct]
A training strategy that selects non-relevant examples that are especially similar to the query or otherwise difficult to distinguish from relevant ones. It is used to improve retrieval models by forcing them to learn finer-grained distinctions.

### phrase-based retrieval  [1 docs, x1] [judged-distinct]
A retrieval approach that matches queries against stored phrase representations rather than only whole documents. It is used to retrieve relevant textual phrases more precisely than document-level matching.

### salient span masking  [1 docs, x1] [judged-distinct]
A pre-training strategy that masks important or informative spans of text rather than random tokens. The model must recover or infer the masked content, which helps it learn to identify useful evidence for retrieval.

### informed retriever  [1 docs, x1] [judged-distinct]
A retriever trained with access to additional information that is not available at test time, such as the target output. It can serve as a stronger teacher for distilling a deployment-time retriever.

### training set weighting  [1 docs, x1] [judged-distinct]
A technique that assigns different importance weights to training examples during optimization. Higher-weighted examples influence the model more strongly than lower-weighted ones.

### pseudo-positive query-document pair  [1 docs, x1] [new]
A query-document pair treated as positive supervision even though it was not annotated by humans. Such pairs are typically created heuristically from data signals to support retriever training.

### recurring span  [1 docs, x1] [new]  · aliases: recurring spans
A text span that appears multiple times within a document. Repeated spans can be exploited as weak supervision for constructing training pairs or identifying related content.

### search engine interaction  [1 docs, x1] [new]  · aliases: interact with a search engine
Search engine interaction is a language-modeling setup in which a model generates text queries, sends them to a search engine, and uses the retrieved documents as context. This lets the model incorporate external web or corpus evidence during generation or question answering.

### few-shot question answering  [1 docs, x1] [judged-distinct]
Few-shot question answering is a question-answering setting in which a model answers questions after seeing only a small number of examples. Retrieved documents or prompt demonstrations can be added to help the model infer the correct answer format and content.

### 标度律  [1 docs, x1] [judged-distinct]  · aliases: scaling law, scaling laws
描述模型性能与模型规模、数据量和计算量之间关系的经验规律。它用于指导如何在这些资源之间分配训练预算，以获得更好的模型表现。

### Chinchilla  [1 docs, x1] [judged-distinct]  · aliases: Chinchilla model
一种大规模语言模型，以相对更小的模型规模配合更多训练数据而获得更高的参数效率。它体现了通过重新平衡模型大小与数据量来改进性能的思路。

### few-shot fine-tuning  [1 docs, x1] [judged-distinct]  · aliases: few-shot finetuning
一种结合少量示例对模型进行参数更新的学习方式，用于让模型适应新任务。它不同于纯粹的上下文学习，因为它会通过训练修改模型参数。

### prompt-based learning  [1 docs, x1] [judged-distinct]  · aliases: prompt-based learning
一种借助文本提示将任务表述为语言建模问题的方法。它通过设计或学习提示，将输入映射到模型更容易处理的形式，从而完成下游任务。

### Turing Test  [1 docs, x1] [new]
A benchmark for machine intelligence proposed as a way to assess whether a machine can exhibit humanlike language behavior. It evaluates a system by comparing its conversational responses with those of a human.

### 马尔可夫假设  [1 docs, x1] [judged-distinct]  · aliases: Markov assumption
一种序列建模假设，认为当前状态或下一个事件只依赖于有限长度的最近历史，而不需要整个过去。它使语言模型能够用局部上下文近似建模词序列的生成概率。

### 回退估计  [1 docs, x1] [judged-distinct]  · aliases: back-off estimation
一种平滑策略，在高阶统计模型数据稀疏时，退回到低阶模型来估计概率。它通过在不同阶数的模型之间分配概率质量，缓解未见事件带来的估计问题。

### Good-Turing估计  [1 docs, x1] [judged-distinct]  · aliases: Good–Turing estimation
一种用于概率估计的平滑方法，通过根据低频事件的出现情况调整概率分配。它常用于处理稀疏数据，使未观测事件也能获得非零概率。

### GPT-1  [1 docs, x1] [judged-distinct]
GPT-1 is an early generative pre-trained language model based on transformer decoding. It demonstrated that large-scale pre-training can improve performance on many downstream language tasks.

### LLaMA  [1 docs, x1] [judged-distinct]
LLaMA is a family of large language models trained for strong general-purpose language understanding and generation. It emphasizes efficient scaling of language modeling for downstream use.

### pre-training and fine-tuning  [1 docs, x1] [judged-distinct]
Pre-training and fine-tuning is a two-stage learning strategy in which a model is first trained on general data and then adapted to a specific task. This approach enables reusable representations that transfer across tasks.

### scaling language models  [1 docs, x1] [judged-distinct]
Scaling language models is the practice of improving model capability by increasing model size, data, or compute. It is associated with broader task performance and emergent generalization.

### static word representations  [1 docs, x1] [new]
Static word representations are fixed embeddings assigned to words regardless of context. They encode general semantic similarity but do not vary with sentence usage.

### probability estimation  [1 docs, x1] [new]
Probability estimation is the process of assigning likelihoods to linguistic events such as words or sequences. In language modeling, it underlies prediction of the next token or phrase.

### transferable NLP task solver  [1 docs, x1] [new]
A transferable NLP task solver is a language model that can be adapted to different natural language processing tasks with limited modification. It leverages shared representations learned from broad pre-training.

### general-purpose task solver  [1 docs, x1] [judged-distinct]
A general-purpose task solver is a model that can handle many different tasks from the same interface or prompting scheme. It is not restricted to a single application domain.

### specific task helper  [1 docs, x1] [judged-distinct]
A specific task helper is a model or system optimized to assist with one narrowly defined task. It provides utility within a limited task setting rather than broad generality.

### 自然语言处理从零开始  [1 docs, x1] [judged-distinct]  · aliases: NLPS, Natural language processing (almost) from scratch
一种早期神经自然语言处理方法，强调用神经网络直接从数据中学习任务相关表示，而不是依赖大量手工特征。它展示了语言模型和分布式表示在多种自然语言处理任务中的有效性。

### 表示学习  [1 docs, x1] [judged-distinct]
一种从数据中自动学习可用于下游任务的特征表示的方法。对于语言模型而言，它超越了单纯的词序列建模，把模型输出用作通用表示。

### 双向长短期记忆网络  [1 docs, x1] [judged-distinct]  · aliases: biLSTM
一种能够同时利用左侧和右侧上下文信息的循环神经网络结构。它常用于生成上下文相关的词表示，并可通过预训练和微调适配具体任务。

### 预训练策略  [1 docs, x1] [judged-distinct]
用于在大规模无标注语料上训练语言模型的一组方法和目标设计。不同的预训练策略会影响模型学到的表示质量以及迁移到下游任务时的效果。

### context-aware representation  [1 docs, x1] [judged-distinct]  · aliases: 上下文感知表示
一种能够利用上下文信息来表示词、句子或文本的表示方式。它会根据周围语境动态变化，从而更好地服务于下游任务。

### human feature engineering  [1 docs, x1] [new]  · aliases: feature engineering
由人手工设计输入特征以帮助模型完成任务的过程。它依赖领域知识，但往往耗费大量时间，并限制模型对数据中潜在模式的自动发现。

### scaling effect  [1 docs, x1] [judged-distinct]
随着模型规模、数据规模或计算资源增加而带来的性能提升现象。它常被用来解释更大模型在能力和泛化上的增强。

### model capacity  [1 docs, x1] [judged-distinct]
模型能够表示和学习复杂模式的能力。更高的模型容量通常意味着模型可以拟合更复杂的函数并支持更广泛的任务。

### GPT-4 API  [1 docs, x1] [judged-distinct]
用于通过程序化接口访问 GPT-4 的应用接口。它使外部系统能够调用模型能力，而不必直接修改模型本身。

### distributed parallel training  [1 docs, x1] [judged-distinct]
将模型训练计算分散到多个计算设备并行执行的方法。它用于支持大规模模型训练，并缓解单机算力和内存限制。

### large-scale data processing  [1 docs, x1] [new]
对海量数据进行清洗、组织、分发和训练前处理的过程。它是训练大模型时必须解决的重要工程环节。

### AI chatbot  [1 docs, x1] [judged-distinct]
A conversational software system that uses artificial intelligence to interact with users in natural language. It can answer questions, assist with tasks, and mediate access to information through dialogue.

### New Bing  [1 docs, x1] [new]
A version of Bing that incorporates large language model capabilities to enhance search results and conversational search. It represents an attempt to combine traditional web search with generative AI assistance.

### computer vision  [1 docs, x1] [new]  · aliases: CV
A field of artificial intelligence concerned with enabling machines to interpret and analyze visual information from images and video. It includes tasks such as recognition, detection, segmentation, and visual reasoning.

### vision-language model  [1 docs, x1] [new]  · aliases: vision-language models
A multimodal model designed to process and relate visual and textual information together. Such models are used for tasks that require understanding images and language jointly, including multimodal dialogue.

### multimodal dialogue  [1 docs, x1] [judged-distinct]  · aliases: multimodal dialogues
An interactive exchange in which a system and user communicate using more than one modality, such as text and images. It requires the model to interpret and respond across modalities in a coherent conversational setting.

### multimodal input  [1 docs, x1] [judged-distinct]
Input to a model that combines more than one kind of data, such as text, images, audio, or video. It allows systems to reason over multiple modalities rather than language alone.

### Microsoft 365 Copilot  [1 docs, x1] [new]  · aliases: Copilot
An AI assistant integrated into Microsoft 365 products to help automate office tasks. It uses large language models to generate drafts, summarize information, and support productivity workflows.

### plugin  [1 docs, x1] [new]  · aliases: plugins
An add-on component that extends the functionality of a software system by providing specialized capabilities. In conversational AI systems, plugins can connect the model to external services or tools.

### adaptation  [1 docs, x1] [judged-distinct]
Adaptation is the process of modifying a pre-trained language model so that it performs better for particular uses or tasks. It often involves additional training or prompting methods that specialize the model without retraining it from scratch.

### GPT series models  [1 docs, x1] [judged-distinct]  · aliases: GPT-series models, GPT-series
GPT series models are a family of generative pre-trained Transformer language models that have evolved through successive versions. They are commonly used as representative examples in the development of large language models.

### reducible loss  [1 docs, x1] [judged-distinct]
The portion of prediction loss that can, in principle, be lowered by improving the model. It is often interpreted as an estimate of the divergence between the true data distribution and the model distribution.

### training tokens  [1 docs, x1] [new]  · aliases: Dc
The number of token units used to train a language model. It is a standard measure of data scale in language-model training and is often paired with parameter count when analyzing compute allocation.

### FP-days  [1 docs, x1] [new]  · aliases: Cc, C
A unit of compute equal to one day of floating-point processing at a specified hardware rate. It is used to quantify training compute budgets in large-scale machine learning experiments.

### data mixture schedule  [1 docs, x1] [new]
训练过程中不同数据来源或数据子集的混合比例与安排方式。它决定了模型在训练中接触各类数据的顺序和占比，进而影响训练效果。

### diminishing returns  [1 docs, x1] [judged-distinct]
一种缩放现象，指当模型继续增大时，性能提升会逐渐变小。它说明在接近某些极限时，额外扩展带来的收益会下降。

### task-level scaling law  [1 docs, x1] [judged-distinct]
A task-level scaling law describes how model scale relates to performance on a specific downstream task. Unlike loss-based scaling laws, it focuses on task metrics such as accuracy or success rate and may depend strongly on task difficulty and evaluation criteria.

### LaMDA-PT  [1 docs, x1] [judged-distinct]
LaMDA-PT is a language model variant that can be instruction-tuned to improve performance on unseen tasks. It is used as an example of how larger model sizes can be necessary for instruction following to emerge strongly.

### controlled experiment  [1 docs, x1] [new]
A controlled experiment is a study design that varies selected factors while keeping other conditions fixed in order to isolate their effects. It is used to measure how specific changes influence an outcome.

### JSON-formatted key-value pair  [1 docs, x1] [new]  · aliases: key-value pairs
A key-value pair represented in JSON structure, where each key is associated with a corresponding value. In retrieval tasks, collections of these pairs provide structured input from which a model must select the correct value.

### training-time sequence length  [1 docs, x1] [new]
The maximum or typical input length used when a model is trained. Performance can change when the model is evaluated on sequences longer than those seen during training.

### retriever-reader model  [1 docs, x1] [judged-distinct]  · aliases: retriever-reader models
A retriever-reader model is a question answering system that first retrieves candidate documents or passages and then reads the retrieved content to produce an answer. This two-stage design is used to handle questions whose answers are not contained in a single fixed input and to focus computation on a smaller set of relevant texts.

### long input context  [1 docs, x1] [judged-distinct]  · aliases: long contexts, long-context
A long input context is an input sequence that contains a large amount of text for a model to process at once. It can provide more information relevant to a task, but it also increases the amount of content the model must reason over.

### retriever recall  [1 docs, x1] [judged-distinct]  · aliases: recall
Retriever recall is the fraction of questions for which the retrieval stage returns at least one document containing the answer. It measures how well the retriever surfaces answer-bearing evidence before the reader model attempts to answer.

### multi-document question answering task  [1 docs, x1] [judged-distinct]  · aliases: multi-document QA task
A question answering setting in which a model receives one question and multiple documents as input. Exactly one document contains the answer, and the model must identify and use that document to answer correctly.

### Wikipedia paragraph  [1 docs, x1] [judged-distinct]  · aliases: Wikipedia passage
A paragraph-sized passage extracted from Wikipedia and used as a document unit in question answering systems. Such passages can serve as answer-bearing evidence or as retrieved distractors depending on whether they contain the annotated answer.

### Wikipedia chunk  [1 docs, x1] [new]  · aliases: Wikipedia chunks
A text segment from Wikipedia, often limited to a fixed token length, used as a document within an input context. Chunking allows retrieval systems and models to work with smaller, manageable units of source text.

### MS MARCO  [1 docs, x1] [judged-distinct]  · aliases: MS-MARCO
A large-scale machine reading and retrieval benchmark used to fine-tune dense retrieval systems. Models trained on it are often better at ranking passages that are relevant to a query.

### document order  [1 docs, x1] [new]  · aliases: order of the documents
The sequence in which documents are arranged within an input context. Changing document order can move the answer-containing document to different positions and thereby alter model performance.

### NaturalQuestions annotations  [1 docs, x1] [judged-distinct]  · aliases: NaturalQuestions annotations
NaturalQuestions annotations are human-provided answer annotations for the NaturalQuestions dataset. They supply acceptable reference answers that can be used to judge whether a predicted output is correct.

### unambiguous questions  [1 docs, x1] [new]
Unambiguous questions are questions for which the available passages do not plausibly support multiple different answers. They are used as a cleaner subset for analysis when ambiguity in the full set may affect results.

### random documents  [1 docs, x1] [judged-distinct]
Random documents are unrelated documents selected without regard to the query or answer. They can serve as distractors in retrieval experiments to test robustness to irrelevant context.

### Wilhelm Conrad Röntgen  [1 docs, x1] [new]  · aliases: Röntgen
Wilhelm Conrad Röntgen was a German physicist who received the first Nobel Prize in Physics in 1901. He is best known for the discovery of X-rays, which had a major impact on medical imaging and physics.

### MPT-30B-Instruct  [1 docs, x1] [judged-distinct]  · aliases: MPT-30B
A large instruction-tuned language model with a maximum context length of 8192 tokens. It was pre-trained on a large token corpus and later adapted with longer sequences to better handle extended context.

### sequence length adaptation pre-training  [1 docs, x1] [judged-distinct]  · aliases: sequence length adaptation
A pre-training phase in which a language model continues training on longer input sequences than those used in earlier training. It is used to adapt the model to handle longer contexts more effectively.

### ALiBi  [1 docs, x1] [judged-distinct]  · aliases: Attention with Linear Biases
A positional encoding method for language models that represents positional information through attention biases. It is designed to help models generalize to longer sequence lengths without requiring fixed learned positional embeddings.

### LongChat-13B  [1 docs, x1] [judged-distinct]  · aliases: LongChat-13B (16K)
A language model variant that extends the LLaMA-13B context window to support much longer inputs. It is fine-tuned after modifying the positional representation so the model can process sequences up to 16K tokens.

### LLaMA-13B  [1 docs, x1] [judged-distinct]  · aliases: LLaMA 13B
A large language model that serves as the base model for later extensions to longer context windows. It is a 13-billion-parameter model whose standard context length can be modified through positional encoding changes and further fine-tuning.

### condensed rotary positional embeddings  [1 docs, x1] [judged-distinct]  · aliases: condensed RoPE
A modified form of rotary positional embeddings used to compress or adapt positional information for longer sequences. This technique helps extend a model’s usable context window beyond its original limit.

### relevant information  [1 docs, x1] [judged-distinct]
The portion of input content that contains evidence needed to answer a question. Its placement within the input can affect how easily a model can use it.

### string-serialized JSON object  [1 docs, x1] [new]  · aliases: serialized JSON object
A JSON object rendered as a linear text string rather than a structured data type. In retrieval benchmarks, it can encode key-value pairs in an input context that a model must read and search.

### UUID  [1 docs, x1] [new]  · aliases: universally unique identifier
A universally unique identifier is a standardized identifier format designed to be highly unlikely to collide with any other generated identifier. In retrieval tasks, random UUIDs can be used as opaque keys and values so that language semantics do not help the model solve the task.

### distractor key-value pair  [1 docs, x1] [judged-distinct]  · aliases: distractor
An irrelevant key-value pair included in a retrieval context to make the target association harder to locate. Distractors increase the need for precise matching rather than shallow pattern recognition.

### Little Retrieval Test  [1 docs, x1] [judged-distinct]
A retrieval benchmark for evaluating how well language models can locate and return information from an input context. It is used as a point of comparison for simpler key-value retrieval tasks.

### fine-grained line retrieval task  [1 docs, x1] [judged-distinct]
A retrieval benchmark that asks a model to find a specific line or span of information within a larger context. It measures precise search and extraction ability over long inputs.

### position of relevant information  [1 docs, x1] [judged-distinct]  · aliases: position of information
The location within an input context where the information needed to answer a query appears. Model performance can depend on whether the relevant content is near the beginning, middle, or end of the context.

### information retrieval system  [1 docs, x1] [judged-distinct]  · aliases: IR system, IR systems
An information retrieval system is a system that helps users find relevant information from a collection of documents or other sources. It typically supports searching, ranking, and presenting results for user queries.

### data stage  [1 docs, x1] [new]
The data stage is the phase of a machine learning pipeline in which training data are collected, prepared, and organized for model development. Problems introduced at this stage can shape what patterns a model learns and may contribute to later errors.

### training stage  [1 docs, x1] [judged-distinct]
The training stage is the phase in which a model learns parameters from data by optimizing against a training objective. Choices made during training can affect model behavior, including the emergence of errors or hallucinations.

### inference stage  [1 docs, x1] [new]
The inference stage is the phase in which a trained model generates outputs for new inputs. Errors at this stage arise during decoding or generation and can lead to hallucinated content even when training has completed successfully.

### detection methods  [1 docs, x1] [judged-distinct]  · aliases: hallucination detection methods
Detection methods are techniques used to identify whether a model output contains a specific undesirable property, such as hallucination. They are designed to assess outputs and determine the extent or presence of the targeted issue.

### Hallucination from Data  [1 docs, x1] [judged-distinct]
Hallucination from data is hallucination that originates in problems with the data used to build a language model. It reflects how issues in the underlying corpus can be learned and reproduced during generation.

### Misinformation and Biases  [1 docs, x1] [judged-distinct]
Misinformation and biases are defects in training data that can distort a model’s learned associations and factual outputs. They can cause a model to reproduce false or skewed content as if it were true.

### Inferior Alignment Data  [1 docs, x1] [new]
Inferior alignment data is low-quality data used to align model behavior with desired outputs. If this data is flawed, it can degrade the model’s tendency to respond accurately and consistently.

### Hallucination from Training  [1 docs, x1] [judged-distinct]
Hallucination from training is hallucination that arises from how a model is trained, including pre-training and alignment stages. Training choices can shape the model’s factual reliability and its propensity to invent unsupported content.

### Hallucination from Pre-training  [1 docs, x1] [judged-distinct]
Hallucination from pre-training is hallucination caused by the initial large-scale training phase on raw text. Errors, noise, and statistical patterns in pre-training data can be internalized by the model and later surfaced in generation.

### Hallucination from SFT  [1 docs, x1] [judged-distinct]  · aliases: SFT
Hallucination from supervised fine-tuning is hallucination introduced or amplified during supervised adaptation on instruction or task data. If fine-tuning examples are narrow, noisy, or inconsistent, the model may learn to produce unsupported answers.

### Hallucination from RLHF  [1 docs, x1] [judged-distinct]  · aliases: RLHF
Hallucination from RLHF is hallucination associated with reinforcement learning from human feedback. Reward shaping and preference optimization can sometimes encourage plausible-sounding responses that are not fully grounded.

### Hallucination from Inference  [1 docs, x1] [judged-distinct]
Hallucination from inference is hallucination that emerges at generation time rather than from the training data itself. Decoding choices, confidence calibration, and reasoning behavior can all influence whether a model invents unsupported content.

### Imperfect Decoding Strategies  [1 docs, x1] [new]
Imperfect decoding strategies are generation procedures that can increase the chance of hallucination. Sampling or search methods that poorly balance diversity and correctness may lead a model away from the most factual continuation.

### Over-confidence  [1 docs, x1] [new]
Over-confidence is a condition in which a model assigns excessive confidence to its outputs relative to their actual correctness. This can make incorrect answers appear authoritative and increase hallucinated responses.

### Softmax Bottleneck  [1 docs, x1] [new]
The softmax bottleneck is a representational limitation in neural language models arising from the softmax output layer. It can restrict the distribution the model can express and thereby contribute to inaccurate or unfaithful generation.

### Reasoning Failure  [1 docs, x1] [new]
Reasoning failure is an inability to carry out the logical or multi-step inference needed to answer correctly. When reasoning breaks down, the model may fill gaps with unsupported assertions that look coherent but are false.

### Factuality Hallucination Detection  [1 docs, x1] [judged-distinct]
Factuality hallucination detection is the detection of hallucinations that involve incorrect factual claims. It evaluates whether generated statements match verifiable real-world facts.

### Faithfulness Hallucination Detection  [1 docs, x1] [judged-distinct]
Faithfulness hallucination detection is the detection of hallucinations in which generated content departs from the provided source or context. It assesses whether an output stays faithful to the information it is supposed to reflect.

### 模型编辑  [1 docs, x1] [judged-distinct]  · aliases: Model Editing
一种直接修改已训练模型参数或内部知识表示的方法，用于纠正特定事实错误或更新模型记忆。它通常针对局部知识进行定向修正，而不需要重新进行完整训练。

### 预训练相关幻觉缓解  [1 docs, x1] [new]  · aliases: Mitigating Pre-training-related Hallucination
面向预训练阶段引入或积累的幻觉问题所设计的缓解方法。此类方法通常通过调整预训练数据、目标或训练过程来减少模型在基础知识形成阶段学到的错误关联。

### 错配幻觉缓解  [1 docs, x1] [judged-distinct]  · aliases: Mitigating Misalignment Hallucination
用于缓解由模型目标、偏好或对齐过程不一致所引发的幻觉的方法。此类方法关注模型在对人类指令、偏好或安全要求进行对齐时产生的事实性偏差。

### 自监督训练  [1 docs, x1] [judged-distinct]  · aliases: Self-supervised Training
一种不依赖人工标注、直接从原始数据构造学习信号的训练方式。模型通过预测被遮蔽或后续内容来学习语言模式、知识与推理能力。

### self-supervised training  [1 docs, x1] [judged-distinct]
A training paradigm in which supervision signals are derived automatically from the data itself rather than from manually labeled examples. It is commonly used to learn representations from large unlabeled corpora by predicting parts of the input from other parts.

### textual corpora  [1 docs, x1] [judged-distinct]
Large collections of written text used as training data for language models. They provide the linguistic and factual content from which models can learn statistical patterns and higher-level regularities.

### lossless compression  [1 docs, x1] [new]
A compression method that reduces the size of information without losing any of the original content, allowing exact reconstruction. In information-theoretic interpretations of language modeling, predicting text can be viewed as compressing information about the sequence.

### 指令不一致  [1 docs, x1] [judged-distinct]  · aliases: Instruction Inconsistency
指令不一致是指语言模型没有按照用户明确给出的任务要求执行，而是转而生成了其他类型的回答。它反映的是模型输出与指令目标之间的不匹配。

### 上下文不一致  [1 docs, x1] [judged-distinct]  · aliases: Context Inconsistency
上下文不一致是指语言模型的输出与提供给它的上下文材料相矛盾或不相符。模型在摘要、改写或回答时会偏离原始上下文中的关键信息。

### Entity-error hallucination  [1 docs, x1] [judged-distinct]
一种事实性幻觉，表现为模型生成了错误的实体名称或实体身份。它通常涉及把人物、地点、组织或其他具体对象错误地替换为不正确的实体。

### query-focused summarization  [1 docs, x1] [new]  · aliases: QFS
A summarization task that produces an answer tailored to a specific question or information need rather than a general overview. It aims to synthesize source material in a way that directly addresses the query.

### entity knowledge graph  [1 docs, x1] [judged-distinct]
A graph representation in which entities from source documents are linked by relationships. It provides structured connectivity among concepts so that related information can be grouped and analyzed together.

### partial response  [1 docs, x1] [new]  · aliases: partial responses
An intermediate answer generated from a subset of evidence before final synthesis. Multiple partial responses can be combined to produce a more complete overall response.

### global sensemaking questions  [1 docs, x1] [judged-distinct]
针对广泛议题、主题或语料库层面模式而设计的问题，通常没有唯一的事实性标准答案。它们用于测试系统能否从大范围信息中提炼综合性见解。

### prompt template  [1 docs, x1] [judged-distinct]
一种预先设计的文本结构，用于将用户查询和检索到的内容组织成适合输入大语言模型的格式。它帮助模型在统一上下文中整合证据并生成回答。

### 自我记忆  [1 docs, x1] [judged-distinct]  · aliases: self-memory
一种将大块数据源的摘要保存为可复用记忆的机制，用来在后续查询时提供上下文和答案线索。它通常通过先生成摘要、再在需要时检索或汇总这些摘要来发挥作用。

### 全局摘要  [1 docs, x1] [judged-distinct]  · aliases: global summaries
由多个局部摘要逐步迭代聚合而成的更高层级摘要，用于概括大规模数据源的整体信息。它能够把分散在不同片段中的内容压缩为统一的全局表示，便于检索和问答。

### 主题划分  [1 docs, x1] [new]  · aliases: thematic partitioning
一种把数据按语义主题分成若干部分的组织方式。它通常基于内容相似性、连接结构或聚类结果，以便更清晰地表示和检索不同主题区域。

### 知识图谱作为索引  [1 docs, x1] [judged-distinct]  · aliases: a knowledge graph as an index
一种将知识图谱直接用作检索索引的做法，用图中的实体、关系和结构来定位相关信息。它既可支持内容检索，也可为生成模型提供结构化上下文。

### modularity  [1 docs, x1] [new]
A structural property of graphs in which nodes can be divided into groups with dense internal connections and sparser connections between groups. It is used to identify community structure and to support hierarchical partitioning of graphs into related subgraphs.

### Louvain method  [1 docs, x1] [new]  · aliases: Louvain
A community detection algorithm for graphs that optimizes modularity to find partitions of nodes into densely connected communities. It is widely used for hierarchical clustering of large networks.

### HotPotQA  [1 docs, x1] [judged-distinct]
An open-domain question answering benchmark that emphasizes multi-hop reasoning over multiple supporting facts. It is commonly used to evaluate systems on explicit fact retrieval and compositional question answering.

### MultiHop-RAG  [1 docs, x1] [judged-distinct]
A benchmark for evaluating retrieval-augmented generation systems on questions that require multi-step retrieval and reasoning. It is designed to test how well a system can gather and use evidence across multiple sources.

### MT-Bench  [1 docs, x1] [new]
A benchmark for evaluating large language model responses across multiple tasks and prompts. It is used as a standardized test set for comparing model performance on generative outputs.

### persona generation  [1 docs, x1] [new]  · aliases: LLM-based persona generation
A method that uses a language model to produce diverse, plausible user personas. The personas are then used to represent different kinds of users and to guide downstream task or benchmark creation.

### real-world usage  [1 docs, x1] [new]  · aliases: real-world RAG system usage
The way a system is actually used by end users in practical settings. In benchmarking, it provides a basis for creating test cases that better reflect authentic interactions and needs.

### RAG evaluation criteria  [1 docs, x1] [judged-distinct]
Standards used to judge how well a retrieval-augmented generation system answers questions. These criteria define what counts as a good response and can be applied by human or model-based evaluators.

### 源文档  [1 docs, x1] [new]  · aliases: source documents
作为信息抽取和索引基础的原始文档集合。系统先从这些文档中获取内容，再将其分解并转换为可用于图索引的结构化表示。

### 文本块  [1 docs, x1] [judged-distinct]  · aliases: text chunks
从较长文档中切分出来的较小文本片段，用于逐块处理和信息抽取。这样可以让模型在有限上下文内对局部内容进行分析，并为后续结构化表示提供输入。

### 实体  [1 docs, x1] [new]  · aliases: entities
文本中可以被识别并作为图节点表示的具体对象、概念或事物。实体是图索引中的基本节点类型之一，通常与关系和其他属性共同构成结构化知识。

### 协变量  [1 docs, x1] [new]  · aliases: covariates
在图索引中除节点和边之外，还可被检测、提取并摘要的附加信息。它们用于补充图结构中的语义内容，例如与事实性陈述或其他可比较信息相关的属性。

### 领域定制摘要  [1 docs, x1] [judged-distinct]  · aliases: domain-tailored summarization
针对特定数据领域设计的摘要方式，利用相应领域的提示和表达习惯来概括信息。它旨在提高摘要对领域内容的覆盖度、准确性和可用性。

### 索引阶段  [1 docs, x1] [judged-distinct]  · aliases: indexing time
构建图索引并对其内容进行抽取、分区和摘要的处理阶段。该阶段发生在查询之前，主要目标是把源文本转化为可检索、可汇总的结构化表示。

### 查询阶段  [1 docs, x1] [judged-distinct]  · aliases: query time
在用户提出问题后，对图索引及其摘要进行检索、汇总和答案生成的处理阶段。该阶段侧重于围绕具体查询组织信息并输出结果。

### 管道阶段  [1 docs, x1] [new]  · aliases: pipeline stage
信息处理流程中的一个离散步骤或阶段，用于表示从输入到输出的不同处理环节。它有助于把整条工作流拆解为可管理、可实现的步骤。

### 可验证事实陈述  [1 docs, x1] [judged-distinct]  · aliases: claims
能够通过外部证据或模型抽取结果加以核实的事实性表述。它们常被整理为“claims”，用于统计分析、评估或事实一致性验证。

### Recall-precision Trade-off  [1 docs, x1] [new]  · aliases: recall-precision trade-offs
The recall-precision trade-off describes the balance between retrieving as much relevant information as possible and keeping the extracted information accurate and complete. In text processing, changing parameters such as chunk length can improve one side while hurting the other.

### NeoChip  [1 docs, x1] [new]  · aliases: NC
NeoChip is a semiconductor company that specializes in low-power processors for wearables and IoT devices. It became publicly traded after previously being a private entity acquired by Quantum Systems.

### Quantum Systems  [1 docs, x1] [judged-distinct]
Quantum Systems is a company that acquired NeoChip in 2016. It is described as the previous owner of NeoChip before NeoChip became publicly traded.

### NewTech Exchange  [1 docs, x1] [judged-distinct]
NewTech Exchange is a stock exchange on which NeoChip had its first week of trading. It serves as the public market venue for NeoChip’s debut as a listed company.

### low-power processors  [1 docs, x1] [new]
Low-power processors are semiconductor processors designed to minimize energy consumption while performing computing tasks. They are especially useful in battery-powered and power-constrained devices.

### wearables  [1 docs, x1] [new]
Wearables are electronic devices designed to be worn on the body, such as smartwatches or fitness trackers. They often require compact, energy-efficient components.

### IoT devices  [1 docs, x1] [new]  · aliases: Internet of Things devices
IoT devices are internet-connected physical devices that collect, exchange, or act on data. They commonly use low-power hardware because many operate with limited power and small form factors.

### named entities  [1 docs, x1] [new]
Named entities are explicitly identifiable real-world people, organizations, places, and similar referential expressions. They are often extracted as structured items in information extraction systems.

### claims  [1 docs, x1] [new]
Claims are factual statements about entities, events, dates, or interactions that can be extracted from text. They provide concise propositions that capture important information beyond simple entity mentions.

### claim extraction  [1 docs, x1] [judged-distinct]
Claim extraction is the process of identifying factual statements about entities and events from text. It captures informative propositions that may be implicit or distributed across a passage.

### abstractive summarization  [1 docs, x1] [judged-distinct]
Abstractive summarization is a summarization method that generates new, concise statements capturing the meaning of source text. Unlike extractive methods, it may rephrase or synthesize information rather than copying spans verbatim.

### public debut  [1 docs, x1] [new]
A public debut is the first appearance of a company as a publicly traded entity on a market or exchange. It marks the transition from private ownership to public trading.

### technology IPOs  [1 docs, x1] [new]
Technology IPOs are initial public offerings by companies in the technology sector. They are often analyzed to understand market behavior for newly listed tech firms.

### entity matching  [1 docs, x1] [new]
The task of reconciling different extracted names that refer to the same real-world entity. It is used to merge duplicates so that mentions from multiple sources can be combined into a single graph node.

### hierarchical community detection  [1 docs, x1] [judged-distinct]
A community detection strategy that repeatedly partitions detected communities into smaller sub-communities. It produces a multi-level decomposition of a graph, often stopping when no further meaningful splits are possible.

### leaf community  [1 docs, x1] [judged-distinct]
A community at the lowest level of a hierarchical partition that can no longer be subdivided into smaller communities. Leaf communities represent the terminal clusters in a recursive community-detection process.

### duplicate entities  [1 docs, x1] [new]
Multiple extracted instances that refer to the same underlying entity. They arise when the same entity is detected repeatedly across documents and are typically merged or clustered during summarization.

### edge weight  [1 docs, x1] [new]  · aliases: weights
A numerical value attached to a graph edge that summarizes the strength, frequency, or importance of the relationship it represents. In extracted knowledge graphs, repeated relationships are often aggregated into heavier edges.

### 层次化分区  [1 docs, x1] [judged-distinct]  · aliases: hierarchical partitioning
一种将图中的节点按多个层级组织成分区的方法，使每一层都把节点划分为彼此互斥且共同穷尽的社区。它常用于把全局结构分解为可逐层汇总的子结构，从而支持分治式的整体总结。

### 社区摘要模板  [1 docs, x1] [judged-distinct]  · aliases: community summary template
用于组织社区摘要内容的预设结构，其中会填入节点、边和相关主张等元素的摘要。它帮助系统以一致的格式生成可用于检索和总结的社区报告。

### 元素摘要  [1 docs, x1] [judged-distinct]  · aliases: element summaries
对图中单个元素的简短概述，通常包括节点、边以及与之相关的主张。它们是生成社区摘要的基础材料，可在上下文窗口允许时被直接组合进更高层级的总结。

### 叶子级社区  [1 docs, x1] [judged-distinct]  · aliases: leaf-level communities
社区层次结构中最底层的社区，通常对应最细粒度的分区单元。其元素摘要会被优先加入上下文窗口，以生成该社区的详细摘要。

### 更高层级社区  [1 docs, x1] [judged-distinct]  · aliases: higher-level communities
位于社区层次结构较上层的社区，由多个下层子社区聚合而成。其摘要通常通过汇总子社区摘要或其元素摘要来生成，以适应更大范围的语义概括。

### global answer  [1 docs, x1] [judged-distinct]
The final answer returned to a user after intermediate answers are aggregated and used to fill a new context window. It is generated by combining the most helpful intermediate responses within the available token limit.

### global sensemaking question generation  [1 docs, x1] [judged-distinct]
A procedure for creating corpus-specific questions that assess high-level understanding of a corpus rather than retrieval of isolated facts. It uses a language model to generate hypothetical user personas, tasks for those users, and questions that require understanding of the entire corpus.

### head-to-head comparison approach  [1 docs, x1] [new]
A comparative evaluation method that judges two outputs against each other rather than against a gold-standard answer. It is used when reference answers are unavailable and relative quality is more informative than absolute scoring.

### tech policy  [1 docs, x1] [new]  · aliases: technology policy
The set of rules, proposals, and public decisions that shape how technology is developed, deployed, and governed. It often covers issues such as market competition, privacy, online speech, and platform accountability.

### government regulation  [1 docs, x1] [new]  · aliases: regulation
Official rules and enforcement measures created by public authorities to control conduct in an industry or society. In technology, regulation can set standards for safety, privacy, competition, and responsibility.

### privacy laws  [1 docs, x1] [new]
Legal rules that limit how personal information can be collected, stored, shared, and used. They are designed to protect individual privacy and influence how companies design data-driven products and services.

### technology development  [1 docs, x1] [judged-distinct]
The process of creating, improving, and deploying technological systems, products, and services. It includes research, design, testing, and implementation, and is often shaped by legal and social constraints.

### innovation  [1 docs, x1] [new]
The introduction of new ideas, methods, products, or services that create change or value. In technology, innovation is often discussed in relation to speed, competitiveness, and disruption.

### ethical considerations  [1 docs, x1] [new]  · aliases: ethics
Questions about what is morally acceptable or responsible in decision-making and practice. They guide judgments about harms, fairness, accountability, and the social consequences of actions or technologies.

### tech companies  [1 docs, x1] [new]  · aliases: technology companies
Businesses that develop, sell, or operate technology products and services. They can include software firms, platform companies, hardware makers, and internet services.

### government  [1 docs, x1] [new]
The public institutions and authorities that make laws, set policy, and enforce regulation. Governments interact with industries through oversight, collaboration, and rule-setting.

### preventive medicine  [1 docs, x1] [new]
A branch of medicine focused on preventing disease and reducing health risks before illness develops. It uses screening, vaccination, lifestyle intervention, and early detection to improve health outcomes.

### wellness  [1 docs, x1] [new]
A state and practice of maintaining overall physical, mental, and social well-being. It emphasizes habits, education, and behaviors that support long-term health rather than treating illness alone.

### public health priorities  [1 docs, x1] [new]
The health issues and population-level concerns that receive the greatest attention from health systems, policymakers, and communities. They reflect which risks, diseases, and interventions are considered most urgent or important.

### health literacy  [1 docs, x1] [new]
The ability to find, understand, and use health information to make appropriate decisions about care and behavior. It supports informed choices, prevention, and navigation of health systems.

### health education curriculum  [1 docs, x1] [new]  · aliases: health curricula, health education curricula
An organized set of lessons and learning goals aimed at teaching health-related knowledge and skills. It can cover disease prevention, wellness, nutrition, mental health, and other topics relevant to students.

### Directness  [1 docs, x1] [new]
A control criterion that measures how specifically and clearly an answer addresses a question. It captures the concision of an answer in a general way and serves as a reference point for judging the soundness of other evaluation criteria.

### Podcast transcripts  [1 docs, x1] [new]
Written transcripts of spoken podcast episodes. They provide text representations of audio conversations that can be chunked and analyzed as a corpus.

### high-level community summary  [1 docs, x1] [judged-distinct]  · aliases: C1, high-level community summaries
A summary representing sub-communities near the top of a hierarchical graph decomposition. It provides more detail than root-level summaries while still covering relatively broad portions of the graph for query answering.

### intermediate-level community summary  [1 docs, x1] [judged-distinct]  · aliases: C2, intermediate-level community summaries
A summary representing mid-level sub-communities in a hierarchical graph decomposition. It balances coverage and specificity by summarizing communities that are finer-grained than high-level communities but broader than low-level ones.

### low-level community summary  [1 docs, x1] [judged-distinct]  · aliases: C3, low-level community summaries
A summary representing the finest-grained communities in a hierarchical graph decomposition. It contains the most specific community-level information and is typically the most numerous among the hierarchy levels.

### map-reduce summarization  [1 docs, x1] [judged-distinct]  · aliases: map-reduce approach, map-reduce
A summarization method that first summarizes smaller text units independently and then combines those partial summaries into a final result. It is useful for processing long inputs by distributing the work across multiple chunks before aggregation.

### few-shot example  [1 docs, x1] [judged-distinct]  · aliases: few-shot examples
An example provided in a prompt to demonstrate the desired output format or behavior. Few-shot examples guide a model by showing a small number of representative input-output patterns before it responds.

### generic prompt  [1 docs, x1] [judged-distinct]  · aliases: generic prompts
A prompt template designed to be reused across tasks or domains with minimal customization. It provides a standard instruction structure that can be adapted by changing only domain-specific details.

### graph reasoning benchmark  [1 docs, x1] [judged-distinct]
A benchmark dataset or evaluation suite designed to test reasoning over graph-structured data. Such benchmarks assess whether a system can use graph connectivity and node content to answer questions that require relational inference.

### 引用图  [1 docs, x1] [new]  · aliases: citation graph
一种以论文之间的引用和互引关系为边的图结构，用来表示研究文献之间的知识传播、依赖与演化。它常用于分析学术主题的关联、影响和发展脉络。

### 文本子图检索  [1 docs, x1] [judged-distinct]  · aliases: textual subgraph retrieval
在文本图中检索与查询相关的局部子图的过程。它的目标是同时找到相关文本节点及其关系结构，以提供更充分的上下文用于后续生成。

### high dimensionality of textual features  [1 docs, x1] [new]
The property of textual representations in nodes and edges having a very large feature space. This makes similarity search and retrieval over graph elements more difficult and computationally expensive.

### graph encoders  [1 docs, x1] [new]
Neural models that transform graph-structured input into vector representations. They can encode topology and node or edge attributes so that graph information can be used by a language model.

### subgraph search  [1 docs, x1] [judged-distinct]  · aliases: exhaustive subgraph searches
The task of finding a subgraph that matches a query or satisfies a relevance criterion within a larger graph. Exhaustive variants of the task can be computationally expensive and may be NP-hard.

### AutoPrompt  [1 docs, x1] [judged-distinct]  · aliases: Auto-Prompt
A prompt-based method that automatically searches for effective prompt tokens to improve a language model’s behavior on a task. It replaces manual prompt design with algorithmic prompt discovery.

### Prompt embeddings  [1 docs, x1] [judged-distinct]
Prompt embeddings are learned vector representations used in place of discrete prompt text. They allow prompt content to be optimized directly in embedding space so the prompt can adapt to a task or domain.

### Graph prompt tuning  [1 docs, x1] [judged-distinct]
Graph prompt tuning is a prompt-based adaptation approach designed for graph-oriented tasks. It uses learned prompts to help large language models incorporate structural or topological information from graphs.

### Triple  [1 docs, x1] [new]  · aliases: triples
A triple is a relational fact represented as a three-part structure, typically consisting of a subject, a relation, and an object. In graph and knowledge representation settings, triples are used to encode more complex relational information than isolated nodes or edges.

### Textual Information  [1 docs, x1] [judged-distinct]  · aliases: textual information
Natural-language content associated with graph elements such as nodes or edges. It provides semantic detail that can be combined with topology to improve retrieval and representation of graph-structured data.

### retrieval-then-pruning approach  [1 docs, x1] [judged-distinct]
A two-stage strategy that first retrieves a limited set of candidate structures and then prunes them to reduce the effective search space. It improves efficiency by avoiding exhaustive exploration of all possible subgraphs.

### induced subgraph  [1 docs, x1] [new]
A subgraph formed by taking a set of nodes and including all edges among them that exist in the original graph. Induced subgraphs are a standard way to represent the local structure around selected nodes.

### key node  [1 docs, x1] [new]  · aliases: key nodes
A node identified as important for forming the backbone of a retrieved subgraph. Key nodes guide which local neighborhoods are combined during retrieval.

### K-hop neighbor  [1 docs, x1] [new]  · aliases: K-hop neighbors
A node that lies within K edge steps of a given node in a graph. K-hop neighbors define the local neighborhood used to build partial subgraphs around important nodes.

### NP-hard problem  [1 docs, x1] [new]
A computational problem for which no polynomial-time algorithm is known and for which solving it efficiently would imply efficient solutions to all problems in NP. NP-hardness is used to characterize problems that are intractable in the worst case.

### 文本子图索引  [1 docs, x1] [judged-distinct]  · aliases: Textual Subgraph Indexing
文本子图索引 is a preprocessing and retrieval method that assigns identifiers to subgraphs and stores vector embeddings for them. It enables fast lookup of promising candidate subgraphs by comparing the query against precomputed subgraph representations.

### 文本子图排序  [1 docs, x1] [judged-distinct]  · aliases: Textual Subgraph Ranking
Textual subgraph ranking is a retrieval step that orders candidate subgraphs by their semantic similarity to a query. The highest-ranked subgraphs are retained for further refinement or task-specific selection.

### Top-N selection  [1 docs, x1] [new]  · aliases: Top-N
Top-N selection is a ranking operation that keeps the N highest-scoring items from a candidate set. It is used to narrow retrieval results to the most relevant candidates before further processing.

### 可学习剪枝器  [1 docs, x1] [new]  · aliases: learnable pruner
A learnable pruner is a trainable component that removes irrelevant parts of a candidate structure while preserving the parts most useful for a query or task. It refines retrieved neighborhoods into smaller, more focused subgraphs.

### Sentence-BERT  [1 docs, x1] [judged-distinct]  · aliases: SentenceBERT, SBERT
Sentence-BERT is a neural sentence embedding model that produces fixed-size vector representations for sentences or short text spans. It is commonly used to encode natural-language queries and text attributes so their semantic similarity can be compared efficiently.

### Textual Subgraph Soft Pruning  [1 docs, x1] [judged-distinct]
一种针对检索到的文本子图的软剪枝机制，用于降低无关节点和边对后续生成的影响。它通过学习每个节点或边相对于查询的相关性缩放系数，对不相关内容进行自适应掩蔽，而不是直接硬删除。

### scaling factor  [1 docs, x1] [new]
一种用于按比例放大或缩小输入贡献的系数。它可以根据相关性或距离自适应地调节节点、边或特征对最终结果的影响。

### element-wise distance  [1 docs, x1] [judged-distinct]  · aliases: ⊖
一种在对应维度上逐元素比较两个表示差异的距离计算方式。它常用于生成局部差异特征，以便后续模型根据差异大小进行加权或筛选。

### tree structure  [1 docs, x1] [judged-distinct]
一种层次化的图结构，其中节点通常通过父子关系组织，并从根节点向下展开。它适合表达有明确层级和包含关系的对象，也常用于把复杂结构线性化或层次化表示。

### graph traversal  [1 docs, x1] [judged-distinct]  · aliases: graph traversals
一种按特定顺序访问图中节点和边的过程。它常用于提取结构信息、搜索路径或将图转换为其他表示形式。

### tree traversal  [1 docs, x1] [judged-distinct]  · aliases: tree traversals
一种按预定义顺序访问树中节点的过程，如先序、后序或中序遍历。它常用于把层次结构转换为序列、计算节点关系或生成树的线性表示。

### Breadth-First Search  [1 docs, x1] [new]  · aliases: BFS
A graph traversal algorithm that explores vertices level by level starting from a source node. It is often used to construct a spanning tree or shortest-path layering in an unweighted graph.

### pre-order traversal  [1 docs, x1] [judged-distinct]
A tree traversal method that visits each node before recursively visiting its children. It is useful for producing a linear order that preserves hierarchical structure.

### tree rooted at the ego node  [1 docs, x1] [judged-distinct]
A rooted tree extracted from an ego-graph in which the ego node serves as the root and each node is organized by breadth-first levels. It preserves a hierarchical backbone of the local subgraph while omitting non-tree edges.

### edge set  [1 docs, x1] [new]
A collection of edges considered as a separate part of a graph representation. In graph decomposition, it can hold the edges not included in a selected spanning tree or hierarchical backbone.

### lossless conversion  [1 docs, x1] [judged-distinct]
A transformation between two representations that preserves all information needed to reconstruct the original object exactly. In graph-text settings, it means the graph and its description can be converted back and forth without information loss.

### relevance scaling factor  [1 docs, x1] [new]  · aliases: α
A learned weight that modulates the contribution of a node or edge during graph message passing. It is used to emphasize relevant graph elements and suppress irrelevant ones.

### message passing  [1 docs, x1] [new]
A computation scheme in graph representation learning where nodes update their embeddings by aggregating information from neighboring nodes and edges. Repeated message passing allows information to flow across the graph structure.

### GraphQA benchmark  [1 docs, x1] [judged-distinct]
一个用于图问答任务的基准数据集集合，包含与图结构相关的问答样本，用来评测模型是否能够理解图的上下文并给出正确答案。它通常覆盖多个图推理或图问答子任务，以便比较不同方法的性能。

### E5  [1 docs, x1] [judged-distinct]
一种面向检索任务的文本嵌入模型，训练目标是让查询和相关文档在向量空间中更接近。它常用于语义检索，并在多种检索基准上作为强基线使用。

### Llama2-7b  [1 docs, x1] [judged-distinct]  · aliases: Llama 2-7B
一种具有约 70 亿参数的大语言模型，属于 Llama 2 系列。它常被用作通用生成与推理的基础模型，也可作为微调或检索增强系统中的核心语言模型。

### 软剪枝  [1 docs, x1] [new]  · aliases: soft pruning
一种在信息整合前对输入内容进行选择性过滤的方法，保留更有用的部分并抑制冗余信息。它通常用于降低无关内容对模型推理的干扰，并提升任务表现。

### redundant information in graphs  [1 docs, x1] [new]
Information in a graph that is repetitive, unnecessary, or not useful for the current reasoning task. Such redundancy can distract a model and degrade performance unless filtered or retrieved selectively.

### small graphs  [1 docs, x1] [new]
Graph inputs with relatively few nodes or edges. They are often easier for models to process and can benefit strongly from task-specific adaptation.

### large graphs  [1 docs, x1] [judged-distinct]
Graph inputs with many nodes, edges, or connected facts. They tend to be more complex and can make reasoning harder because of increased information load.

### transferability  [1 docs, x1] [new]
The ability of a learned model or representation to be applied successfully to a different dataset or task than the one used for training. High transferability means useful knowledge generalizes across domains or benchmarks.

### graph encoding capabilities  [1 docs, x1] [judged-distinct]
A model’s ability to represent graph structure and graph-associated text in a form that supports reasoning or generation. Strong encoding capabilities help preserve relationships, connectivity, and relevant content from the graph.

### graph-related tasks  [1 docs, x1] [judged-distinct]
Tasks that require reasoning over graph-structured data, such as answering questions, inferring relationships, or generating text from graph inputs. These tasks depend on understanding nodes, edges, and their semantics.

### LLM only  [1 docs, x1] [judged-distinct]  · aliases: LLM-only
LLM only is a baseline setting in which a large language model is used without additional retrieval or task-specific adaptation. It provides a reference point for measuring the effect of added training or retrieval components.

### LLMLoRA  [1 docs, x1] [judged-distinct]  · aliases: LLM LoRA
LLMLoRA is a large language model adapted with LoRA, a parameter-efficient fine-tuning method that updates low-rank adapter weights instead of all model parameters. It is used to improve task performance while keeping training costs relatively low.

### E5-Base  [1 docs, x1] [judged-distinct]  · aliases: E5 Base
E5-Base is a dense text embedding model trained for general-purpose retrieval and semantic matching. It encodes queries and passages into vectors so that relevant texts can be found by similarity search.

### G-RetrieverLoRA  [1 docs, x1] [judged-distinct]  · aliases: G-Retriever LoRA
G-RetrieverLoRA is a graph-based retrieval model adapted with LoRA for parameter-efficient fine-tuning. It combines graph-aware retrieval with low-rank updates to improve task performance.

### GRAGLoRA  [1 docs, x1] [judged-distinct]  · aliases: GRAG LoRA
GRAGLoRA is a LoRA-adapted version of GRAG that applies parameter-efficient fine-tuning on top of the graph-aware retrieval approach. It aims to gain further performance improvements while keeping training efficient.

### related entity  [1 docs, x1] [new]  · aliases: related entities
An entity that is connected to another entity through a meaningful relationship in a knowledge structure. Related entities are often retrieved together to preserve context and connectivity.

### 图增强检索增强生成系统  [1 docs, x1] [judged-distinct]  · aliases: graph-empowered RAG system, 图增强RAG系统
一种将图结构引入检索增强生成流程的系统，用于更好地表示实体之间的相互依赖关系并生成更连贯、上下文更丰富的回答。它通常结合结构化关系信息与文本检索，以提升信息整合能力和响应质量。

### adaptive retrieval system  [1 docs, x1] [new]
A retrieval system designed to adjust efficiently as new information arrives or conditions change. It aims to preserve effectiveness while minimizing the cost of updating its index or retrieval behavior.

### response efficiency  [1 docs, x1] [judged-distinct]
The speed and computational economy with which a system produces responses after retrieval. In retrieval-augmented generation, it reflects how quickly useful answers can be generated from retrieved evidence.

### LLM profiling  [1 docs, x1] [judged-distinct]  · aliases: profiling
The use of a large language model to generate or refine descriptive profiles of entities or concepts from text. It helps normalize and enrich extracted information for downstream matching and retrieval.

### data indexer  [1 docs, x1] [new]  · aliases: Data Indexer
A component that builds a structured data representation from an external database or document collection. It prepares information for efficient retrieval by extracting, organizing, and storing relevant signals.

### external database  [1 docs, x1] [new]  · aliases: external database D
A source collection of documents or records used as the basis for indexing and retrieval. It provides the raw content from which structured representations and relevant answers are derived.

### LLM Profiling for Key-Value Pair Generation  [1 docs, x1] [judged-distinct]  · aliases: P(·)
A language-model-based function that generates a key-value pair for each entity or relation in a graph. The key is used for efficient retrieval, while the value stores a text summary of relevant supporting information for downstream generation tasks.

### multi-hop subgraph  [1 docs, x1] [judged-distinct]  · aliases: multi-hop subgraphs
A subgraph reached by traversing multiple edges from a starting node, capturing indirect relationships among entities or text units. Such subgraphs are useful for exposing broader context and connections that are not visible from a single hop of the graph.

### incremental knowledge base  [1 docs, x1] [judged-distinct]  · aliases: incremental knowledge base
A knowledge base that is updated continuously as new information arrives instead of being rebuilt from scratch. It preserves existing structure while incorporating new data so that the system can stay current with lower computational cost.

### chunk traversal  [1 docs, x1] [judged-distinct]
A retrieval strategy that examines document chunks sequentially or by following chunk-by-chunk links. It can be inefficient when many chunks must be explored to find relevant information.

### 具体查询  [1 docs, x1] [judged-distinct]  · aliases: specific query, specific queries
一种面向细节的查询类型，通常直接指向图中的特定实体、节点或边。它的目标是检索与某个明确对象相关的精确信息。

### 抽象查询  [1 docs, x1] [judged-distinct]  · aliases: abstract query, abstract queries
一种面向概念和主题的查询类型，通常涉及更广泛的主题、摘要或整体性话题。它不依赖单个具体实体，而是要求系统综合多个相关信息片段来回答。

### 查询关键词提取  [1 docs, x1] [judged-distinct]  · aliases: Query Keyword Extraction
一种从用户查询中识别并分离关键术语的过程。它通常为后续匹配与检索提供局部和全局的检索线索。

### higher-order relatedness  [1 docs, x1] [judged-distinct]  · aliases: high-order relatedness
A notion of relatedness that goes beyond directly matched items by incorporating nearby nodes and structural context from a graph. It helps retrieval systems capture additional relevant entities and relations that are not found by keyword matching alone.

### one-hop neighboring node  [1 docs, x1] [judged-distinct]  · aliases: one-hop neighboring nodes
A node that is directly connected to another node by a single edge in a graph. One-hop neighbors provide immediate local context for expanding retrieval beyond the initially matched graph elements.

### profiling function  [1 docs, x1] [new]  · aliases: P(·)
A function that converts retrieved graph elements into concatenated textual values such as names, descriptions, and excerpts. Its output is used as input context for answer generation.

### entities and relationships  [1 docs, x1] [judged-distinct]  · aliases: entities and relations
The basic semantic components extracted from text and represented in a graph for retrieval and reasoning. Entities denote real-world or abstract items, while relationships describe how those items are connected.

### community-based traversal  [1 docs, x1] [new]
A graph navigation strategy that explores connected communities or subgraphs to gather relevant information. It is used to retrieve context by moving through related nodes rather than performing direct similarity search alone.

### UltraDomain benchmark  [1 docs, x1] [new]  · aliases: UltraDomain
A benchmark corpus built from textbooks and organized into multiple subject domains for evaluation. It is used to assess system performance across diverse domain-specific datasets.

### Agriculture dataset  [1 docs, x1] [new]  · aliases: Agriculture
A domain-specific evaluation dataset focused on agricultural content. It covers topics such as beekeeping, hive management, crop production, and disease prevention.

### CS dataset  [1 docs, x1] [judged-distinct]  · aliases: CS
A domain-specific evaluation dataset focused on computer science content. It emphasizes data science and software engineering topics, including machine learning, big data processing, recommendation systems, classification algorithms, and real-time analytics.

### Legal dataset  [1 docs, x1] [judged-distinct]  · aliases: Legal
A domain-specific evaluation dataset drawn from legal content. It is used to evaluate system behavior on law-related material and terminology.

### Mix dataset  [1 docs, x1] [judged-distinct]  · aliases: Mix
A mixed-domain evaluation dataset combining content from multiple subject areas. It is used to assess performance under heterogeneous information conditions.

### query decomposition  [1 docs, x1] [judged-distinct]
A retrieval technique that splits a complex query into smaller sub-queries. This can improve retrieval by making each part of the information need easier to match against source texts.

### rewriting  [1 docs, x1] [new]
A query-processing technique that reformulates a user query into a clearer or more effective form for retrieval. Rewriting can reduce ambiguity and better align the query with the wording of source documents.

### disambiguation  [1 docs, x1] [new]
A process for resolving ambiguity in a query or term so that retrieval targets the intended meaning. It helps a system distinguish among multiple possible interpretations before searching.

### node  [1 docs, x1] [new]
A vertex in a graph that represents an extracted item such as an entity or concept. Nodes are connected by edges to encode relationships and support graph-based reasoning.

### edge  [1 docs, x1] [judged-distinct]
A link between two nodes in a graph that represents a relationship or association. Edges make explicit the connections that the graph uses for traversal and aggregation.

### LLM-based multi-dimensional comparison method  [1 docs, x1] [judged-distinct]  · aliases: 基于LLM的多维比较方法
一种基于大语言模型的多维度比较评估方法，用于对不同系统的答案进行直接比较。它从多个评价维度分别判断两个答案的优劣，并将各维度结果合并为总体评价。

### win rate  [1 docs, x1] [new]  · aliases: win rates
一种比较结果指标，用于表示某个系统在成对评估中获胜的比例。它通常通过统计在不同维度或总体比较中的胜出次数来计算。

### nano vector database  [1 docs, x1] [judged-distinct]
一种用于向量数据管理和访问的向量数据库。它支持存储、组织和检索向量表示，以便在检索增强系统中进行高效相似性访问。

### gleaning parameter  [1 docs, x1] [new]
一种系统配置参数，用于控制信息提取或补充检索过程中的取值设置。固定该参数有助于保证不同方法或数据集之间实验条件的一致性。

### Graph-enhanced RAG system  [1 docs, x1] [judged-distinct]  · aliases: graph-enhanced RAG systems, graph-based RAG system, graph-based RAG systems
A retrieval-augmented generation system that incorporates graph structure into retrieval and reasoning over documents. By representing relationships among pieces of knowledge, it can capture broader context and semantic dependencies than purely chunk-based approaches.

### chunk-based retrieval method  [1 docs, x1] [judged-distinct]  · aliases: chunk-based retrieval methods
A retrieval approach that works by splitting documents into chunks and retrieving relevant chunks directly. It is simpler than graph-based retrieval but may miss relationships that span multiple chunks.

### large-scale corpus  [1 docs, x1] [judged-distinct]  · aliases: large-scale corpora
A very large collection of documents or texts used for retrieval and question answering. Such corpora make contextual reasoning harder and often expose differences between retrieval strategies.

### semantic dependency  [1 docs, x1] [judged-distinct]  · aliases: semantic dependencies
A meaningful relationship between pieces of information that affects interpretation and reasoning. Capturing semantic dependencies helps retrieval systems connect related facts across a corpus.

### 摘要  [1 docs, x1] [judged-distinct]  · aliases: summarization
一种将较长文本压缩为较短表示的任务，同时保留核心信息与主要内容。它既可以依赖生成模型，也可以结合检索到的相关资料来增强覆盖和准确性。

### 检索效率  [1 docs, x1] [judged-distinct]
检索系统在速度、资源消耗和相关性方面完成信息查找的能力。更高的检索效率通常意味着系统能更快地找到有用证据，并更适合大规模部署。

### 偏差  [1 docs, x1] [new]
模型或系统在数据、检索或生成结果中产生系统性偏斜的现象。偏差可能导致输出不公平、不准确或对某些信息来源过度依赖。

### 伦理问题  [1 docs, x1] [new]
在系统设计、训练、部署和使用过程中涉及的道德与责任方面的挑战。它通常包括公平性、透明性、隐私和潜在滥用等方面。

### 鲁棒性  [1 docs, x1] [new]
系统在噪声、分布变化、错误输入或攻击条件下保持稳定性能的能力。更强的鲁棒性意味着模型对真实世界复杂情况更不敏感。

### 社会影响  [1 docs, x1] [new]
技术在更广泛社会层面上产生的后果和作用，包括对工作流程、信息传播、信任和公平性的影响。它关注技术部署后对人群和制度的长期结果。

### 个性化推荐  [1 docs, x1] [new]  · aliases: personalized recommendations
个性化推荐是根据用户的偏好、历史行为或上下文，为其提供定制化内容或物品建议的技术。它利用相关信息来提高推荐的匹配度和实用性。

### retrieval-based system  [1 docs, x1] [judged-distinct]  · aliases: retrieval-based systems
A retrieval-based system is a language system that responds by searching an external collection for relevant documents, passages, or snippets and returning or reusing that material. It is useful for locating evidence tied to a query, but it does not by itself create new content or synthesize retrieved results into a fully generated response.

### factually grounded language generation  [1 docs, x1] [judged-distinct]  · aliases: grounded responses, factually grounded generated content
Factually grounded language generation is text generation that is explicitly supported by external evidence or context. Its goal is to produce responses that are accurate, relevant, and aligned with up-to-date information rather than relying only on parametric memory.

### hierarchical fusion technique  [1 docs, x1] [new]
A hierarchical fusion technique combines information from multiple sources or levels in stages rather than all at once. In retrieval-augmented generation, it is used to better merge retrieved evidence with model representations and improve coherence.

### computational overhead  [1 docs, x1] [new]
Computational overhead is the extra time, memory, and processing cost required by a method beyond its core task. In retrieval-augmented generation, it arises because both retrieval and generation must be performed for each query.

### model pruning  [1 docs, x1] [new]
Model pruning is a model compression technique that removes less important parameters or components from a neural network. It reduces computation and model size while aiming to preserve as much predictive performance as possible.

### artificial intelligence bias  [1 docs, x1] [new]  · aliases: AI bias
Artificial intelligence bias is systematic unfairness or distortion introduced by AI systems through their data, objectives, or learned representations. It can affect which information is retrieved or generated and may reproduce social inequalities present in training or source data.

### large language model bias  [1 docs, x1] [judged-distinct]  · aliases: LLM bias
Large language model bias is systematic skew in the outputs or representations of a language model that favors certain groups, perspectives, or associations. It can arise from training data, model design, or inference behavior and may affect both retrieval-augmented and standalone generation systems.

### knowledge-grounded dialogue  [1 docs, x1] [new]
A dialogue setting in which responses are generated using external factual sources rather than only internal model parameters. It aims to keep conversations accurate and evidence-based when factual knowledge is needed.

### 最近邻搜索  [1 docs, x1] [judged-distinct]  · aliases: nearest-neighbor search
一种在向量空间中查找与给定查询向量最相似对象的检索方法。它常用于稠密检索系统，以高效定位语义上接近的文档。

### 稠密向量空间  [1 docs, x1] [judged-distinct]  · aliases: dense vector space
一种表示空间，其中对象被映射为高维连续向量，以便通过几何距离或相似度来比较语义关系。它是稠密检索方法的基础表示空间。

### REPLUG  [1 docs, x1] [judged-distinct]
REPLUG is a retrieval-augmented generation method that leverages large language models to enhance retrieval capabilities. It is designed to produce more adaptive retrieval behavior than fixed similarity-based retrieval.

### Pointwise Ranking  [1 docs, x1] [judged-distinct]
Pointwise Ranking is a learning-to-rank strategy that treats ranking as independent prediction of a relevance score for each candidate item. The scores are then used to sort items from most to least relevant.

### Pairwise Ranking  [1 docs, x1] [judged-distinct]
Pairwise Ranking is a learning-to-rank strategy that trains a model to prefer one candidate item over another. It uses comparisons between pairs of items to learn an ordering that improves ranking quality.

### audio-based RAG model  [1 docs, x1] [judged-distinct]
一种将检索增强生成扩展到音频模态的模型，通过音频表示与检索、生成组件协同工作，处理语音和其他音频任务。它通常利用音频嵌入作为中间表示，以支持语音识别、音频摘要和语音交互等应用。

### Wav2Vec 2.0  [1 docs, x1] [new]
一种用于从原始音频中学习表示的自监督语音表示模型，能够提取适合下游语音任务的音频嵌入。它常被用作音频理解系统中的特征提取器。

### video-based RAG model  [1 docs, x1] [judged-distinct]
一种将检索增强生成扩展到视频模态的模型，结合视觉和文本信息来支持视频理解、字幕生成和检索等任务。它通常依赖视频嵌入来捕捉时序与空间特征。

### I3D  [1 docs, x1] [new]  · aliases: Inflated 3D ConvNet
一种三维卷积视频特征提取模型，通过在时空维度上建模视频帧序列来学习适合视频理解的表示。它常用于提取视频嵌入以支持检索和生成任务。

### TimeSformer  [1 docs, x1] [new]
一种基于 Transformer 的视频表示模型，通过注意力机制联合建模视频的时间和空间信息。它常用于生成高质量的视频嵌入，以服务于视频理解相关任务。

### multimodal RAG model  [1 docs, x1] [judged-distinct]
一种融合文本、音频、视频和图像等多种模态的检索增强生成模型，用于在统一框架中执行检索与生成。它通过跨模态信息整合来提升系统的灵活性和适用范围。

### Flamingo  [1 docs, x1] [new]
一种多模态大模型架构，能够在统一框架中处理图像、视频与文本等多种输入。它通过跨模态对齐与融合支持多模态推理和生成。

### cross-modal retrieval  [1 docs, x1] [judged-distinct]
一种在不同模态之间进行信息检索的方法，例如用文本检索图像或用图像检索文本。它依赖跨模态表示对齐来找到语义相关的异构内容。

### retrieval as generation  [1 docs, x1] [judged-distinct]
一种将检索过程直接用于生成过程的多模态框架，尤其用于文本与图像之间的相互检索和生成。它通过利用大规模配对数据，在查询与已存储描述匹配时加速内容生成，并支持基于图像的对话。

### agentic Retrieval-Augmented Generation  [1 docs, x1] [judged-distinct]  · aliases: agentic RAG
A retrieval-augmented generation framework organized around one or more agents that plan, delegate, and coordinate retrieval and generation steps. It uses agent behavior to make the system more modular and adaptable than a single monolithic retriever-generator pipeline.

### hierarchical multi-agent architecture  [1 docs, x1] [new]  · aliases: hierarchical, multi-agent architecture
An agent system arranged in layers of responsibility, with a higher-level controller assigning subtasks to specialized lower-level agents. This structure supports division of labor, coordination, and specialization across different components of a system.

### sub-agent  [1 docs, x1] [new]  · aliases: sub-agents
A specialized agent that handles a narrow task within a larger multi-agent system. Sub-agents typically receive delegated instructions and perform focused retrieval, reasoning, or generation for their assigned role.

### smaller pre-trained language model  [1 docs, x1] [judged-distinct]  · aliases: SLM, SLMs
A language model with fewer parameters or lower computational cost that has been pre-trained on large text corpora and then adapted to specific tasks. Smaller models are often used when efficiency, specialization, or modular deployment is important.

### shared knowledge repository  [1 docs, x1] [new]  · aliases: shared knowledge repository
A common storage resource that supplies information to multiple components of a system. In retrieval-based systems, it holds prompts, documents, or other knowledge items that agents can access when performing tasks.

### time series analysis  [1 docs, x1] [new]  · aliases: time series tasks
The analysis of data points indexed in time order in order to detect patterns, forecast future values, or understand temporal behavior. It is used in domains where observations evolve over time and temporal dependencies matter.

### RULE  [1 docs, x1] [judged-distinct]  · aliases: RULE (Xia et al. 2024)
A multimodal retrieval-augmented generation framework for improving the factuality of medical vision-language models. It combines a calibrated selection strategy with preference optimization to balance internal model knowledge and retrieved context.

### medical Vision-Language Model  [1 docs, x1] [judged-distinct]  · aliases: Med-LVLM, Med-LVLMs
A vision-language model designed for medical applications that reasons over both images and text. Such models are used to interpret clinical visual data and produce medically grounded textual outputs.

### calibrated selection strategy  [1 docs, x1] [new]  · aliases: calibrated selection strategy
A selection method that controls how retrieved evidence is chosen or weighted so that unreliable information is less likely to influence the final output. It is used to reduce the risk of incorrect or unsupported generation.

### retrieved context  [1 docs, x1] [judged-distinct]  · aliases: retrieved contexts
Information fetched from an external source and supplied to a model as additional input during generation. Retrieved context helps ground the model’s response in source material rather than relying only on parametric memory.

### LLM supervision  [1 docs, x1] [judged-distinct]  · aliases: LLM supervision
The use of a large language model to guide, evaluate, or generate intermediate outputs for another model or system. It provides higher-level reasoning signals that can shape downstream retrieval or generation behavior.

### utility-oriented thought  [1 docs, x1] [new]  · aliases: utility-oriented thoughts
An intermediate reasoning representation optimized for usefulness in a downstream task rather than for free-form explanation alone. It is designed to summarize evidence in a way that supports later generation decisions.

### task-adaptive summarizer  [1 docs, x1] [judged-distinct]  · aliases: task-adaptive summarizer
A summarization component that adjusts its behavior according to the requirements of the target task. It produces compact summaries that preserve the information most useful for subsequent processing or generation.

### knowledge-augmented content  [1 docs, x1] [judged-distinct]  · aliases: knowledge-augmented content
Generated content that is enriched by external knowledge retrieved during processing. The added knowledge is used to make the output more informed, specific, and reliable than generation from internal model parameters alone.

### Retrieval Augmented Fine-Tuning  [1 docs, x1] [judged-distinct]  · aliases: RAFT
A post-training method for large language models that teaches them to use retrieved evidence more effectively during generation. It trains the model to ignore irrelevant retrieved documents and cite directly from relevant sources, improving performance on retrieval-augmented tasks.

### Reflection Token  [1 docs, x1] [new]
A special token used in self-reflective retrieval-augmented generation to indicate reflection and guide response evaluation. It helps the model decide when to retrieve, assess, or refine generated content.

### data-centric retrieval-augmented generation workflow  [1 docs, x1] [judged-distinct]  · aliases: data-centric RAG workflow
A retrieval-augmented generation workflow that emphasizes preparing and enriching data before retrieval and reading. It goes beyond a simple retrieve-then-read pattern by incorporating metadata generation, synthetic question-answer pairs, and document summarization to improve downstream use of context.

### prepare-then-rewrite-then-retrieve-then-read framework  [1 docs, x1] [judged-distinct]
A multi-stage retrieval-augmented generation pipeline that first prepares information, then rewrites it, then retrieves relevant context, and finally reads it for generation. It is designed to improve access to time-critical, domain-specific, or contextually relevant information.

### RAPTOR  [1 docs, x1] [judged-distinct]
A hierarchical retrieval-augmented language model that retrieves information at multiple abstraction levels rather than only from short contiguous text chunks. It builds a tree of summaries by recursively embedding, clustering, and summarizing text, which helps answer complex questions more effectively.

### summary tree  [1 docs, x1] [judged-distinct]
A hierarchical tree of summaries that represents a document collection at multiple levels of abstraction. It enables retrieval from broad overviews down to more detailed text passages, supporting efficient access to relevant information.

### Self-Route  [1 docs, x1] [judged-distinct]
A routing method that dynamically sends a query either to retrieval-augmented generation or to a long-context language model based on model self-reflection. It is designed to balance answer quality and computation cost by choosing the cheaper sufficient option when possible.

### SFR-RAG  [1 docs, x1] [judged-distinct]
A small, efficient retrieval-augmented generation model that improves how external context is integrated into large language models. It is designed to reduce hallucinations while keeping the system lightweight and computationally efficient.

### token-level speech data store  [1 docs, x1] [new]  · aliases: fine-grained token-level speech data stores
A speech data repository organized at the level of individual tokens rather than only longer utterances. It supports fine-grained retrieval of speech-related information for downstream recognition or generation tasks.

### speech-to-speech retrieval mechanism  [1 docs, x1] [judged-distinct]
A retrieval mechanism that uses speech information as both the query and the retrieved source. It is intended to fetch relevant speech evidence directly from speech representations for improved downstream processing.

### Structure-aware knowledge integration algorithm  [1 docs, x1] [new]  · aliases: structure-aware knowledge integration algorithms
A structure-aware knowledge integration algorithm combines retrieved knowledge while taking its graph structure into account. It is intended to produce coherent and logically consistent generation by leveraging relationships and hierarchy in the retrieved information.

### distribution gap  [1 docs, x1] [new]  · aliases: domain shift
A distribution gap is the difference between the data distribution used for pretraining and the distribution of the data used for adaptation or deployment. Large gaps make it harder for a model to transfer knowledge reliably and can reduce the effectiveness of learning from new data.

### catastrophic forgetting  [1 docs, x1] [new]
Catastrophic forgetting is the tendency of a neural network to lose previously learned information when it is trained on new data. It is a major problem in continual learning because new learning can overwrite older capabilities or facts.

### hierarchical RAG  [1 docs, x1] [judged-distinct]
A retrieval-augmented generation approach that preserves document or knowledge structure by retrieving information at multiple levels of granularity. It is designed to maintain context while improving access to relevant content.

### knowledge augmentation  [1 docs, x1] [judged-distinct]
The process of supplying a model with external knowledge to improve its responses. In retrieval-based systems, augmentation typically happens by fetching relevant information and injecting it into the model’s context.

### contextual information  [1 docs, x1] [judged-distinct]
Contextual information is the surrounding textual or structural information that helps interpret a piece of content correctly. It can include neighboring sentences, document structure, and relationships between concepts that are lost when text is isolated.

### contextual comprehension  [1 docs, x1] [judged-distinct]
Contextual comprehension is the ability to understand text by using surrounding information and document structure rather than isolated fragments. It is necessary for accurately interpreting fragmented or distributed knowledge.

### logical flow  [1 docs, x1] [new]
Logical flow is the ordered progression of ideas that connects statements into a coherent argument or explanation. It can be disrupted when information is truncated, summarized, or separated from its surrounding context.

### specialized domains  [1 docs, x1] [judged-distinct]
Specialized domains are subject areas with technical vocabulary, domain-specific conventions, and expert knowledge requirements. Examples include professional, scientific, and industrial settings where ordinary language understanding is not sufficient.

### context window truncation  [1 docs, x1] [new]
The shortening of input to fit within a model's context window. It can remove information from long passages and break continuity in the text being processed.

### domain-specific terminology  [1 docs, x1] [judged-distinct]  · aliases: domain-specific terminologies
Specialized terms used within a particular professional or technical domain. These terms are often unevenly distributed across documents and can be difficult to retrieve efficiently.

### efficiency bottleneck  [1 docs, x1] [new]
A limiting point in a processing system that reduces speed or increases computational cost. It occurs when one stage becomes difficult to scale and slows the overall workflow.

### 知识集成方法  [1 docs, x1] [judged-distinct]
Knowledge integration methods are techniques for incorporating retrieved knowledge into a language model before or during generation. They determine how external evidence is represented, fused, and used to produce the final answer.

### 索引型GraphRAG  [1 docs, x1] [judged-distinct]
一种以图结构索引外部知识的GraphRAG类别，重点在于通过图索引组织和定位相关信息。它通常通过结构化索引来提高检索效率和信息覆盖度。

### Non-graph RAG  [1 docs, x1] [judged-distinct]
A retrieval-augmented generation workflow that organizes a corpus into text chunks, ranks those chunks by similarity to a query, and retrieves the most relevant passages for generation. It relies on unstructured text retrieval rather than an explicit graph representation of knowledge.

### Topic node  [1 docs, x1] [new]
A graph node that represents a high-level topic or theme rather than a single low-level fact. Topic nodes are used to summarize and organize content for coarse-grained retrieval and navigation.

### Topic linking  [1 docs, x1] [judged-distinct]
The process of connecting topic nodes to one another within a topic graph or index structure. These links help organize related themes and support traversal across topics.

### Fact linking  [1 docs, x1] [new]
The process of associating topic-level abstractions with the underlying factual text or evidence that supports them. It enables a system to move from a summary topic to detailed source information.

### Subgraph pruning  [1 docs, x1] [judged-distinct]
The removal of less useful nodes or edges from a retrieved subgraph to make it more focused and manageable. Pruning helps reduce noise and improve the efficiency of downstream reasoning.

### Knowledge organization  [1 docs, x1] [judged-distinct]
The structuring of information into representations that make it easier to store, retrieve, and reason over. In retrieval systems, it often involves organizing text or facts into graphs, chunks, or indexed topics.

### granularity optimization  [1 docs, x1] [new]
The process of choosing the size and scope of retrieval units to balance contextual richness against efficiency. Coarser units preserve more context but can be redundant, while finer units may lose semantic completeness.

### indexing optimization  [1 docs, x1] [judged-distinct]
Methods that improve how content is organized for retrieval so that search is faster and more accurate. It includes structural enhancements such as metadata attachment and hierarchical organization.

### metadata-addition techniques  [1 docs, x1] [judged-distinct]  · aliases: metadata addition techniques
Indexing methods that attach descriptive fields such as titles, timestamps, categories, or keywords to text chunks. The added metadata supports filtering and reranking during retrieval.

### 最佳匹配25  [1 docs, x1] [judged-distinct]  · aliases: BM25, best matching 25
一种广泛使用的概率检索排序算法，用于根据查询词与文档词项的匹配程度对候选文档进行排序。它在信息检索中常作为强基线方法。

### RETROprompt  [1 docs, x1] [new]
一种在RETRO基础上扩展的检索增强方法，结合少样本知识存储来适配更复杂的提示场景。它通过更灵活的知识组织与调用方式增强提示效果。

### 少样本知识存储  [1 docs, x1] [judged-distinct]  · aliases: few-shot knowledge store
一种面向少样本提示而构建的知识存储机制，用于保存可直接用于上下文示例的相关知识。它帮助系统在样本较少时仍能提供更合适的检索支持。

### EAR  [1 docs, x1] [judged-distinct]
一种通过对多个扩展查询的候选结果进行重排序来提升检索准确性的框架。它从多个候选中选择最优结果，以改善最终检索质量。

### 句子变换器  [1 docs, x1] [judged-distinct]  · aliases: sentence transformers
一种将句子编码为向量表示的神经表示模型，常用于语义相似度计算和近邻检索。它能够把文本映射到适合距离度量的嵌入空间中。

### 近似邻居  [1 docs, x1] [judged-distinct]  · aliases: approximate neighbors
在向量空间中与查询最相近但并非精确最近的候选对象。它们通常用于在大规模检索中在效率和准确性之间取得平衡。

### Knowledge Graph Construction from Corpus  [1 docs, x1] [judged-distinct]
A process that builds a knowledge graph by extracting entities and relations from a text corpus. The resulting graph is used to represent facts and connections in structured form.

### GraphRAG with Existing Knowledge Graphs  [1 docs, x1] [judged-distinct]
A GraphRAG setting that augments generation with knowledge graphs that already exist before the system is applied. It retrieves and uses those external graphs as structured evidence for answering queries.

### Retrieval Technique  [1 docs, x1] [judged-distinct]
A family of methods for selecting relevant information from a knowledge source. Different techniques vary in whether they rely on similarity, logic, graph neural networks, language models, or reinforcement learning.

### Similarity-based Retriever  [1 docs, x1] [judged-distinct]
A retriever that selects evidence by measuring similarity between the query and candidate items. It typically ranks graph nodes, passages, or other units by embedding or lexical closeness.

### Logical-based Retriever  [1 docs, x1] [judged-distinct]
A retriever that uses logical rules, symbolic reasoning, or structured inference to identify relevant knowledge. It is designed to follow explicit constraints or reasoning chains rather than only surface similarity.

### GNN-based Retriever  [1 docs, x1] [judged-distinct]
A retriever that uses a graph neural network to encode graph structure and produce relevance scores. By propagating information across nodes and edges, it can retrieve context informed by graph topology.

### LLM-based Retriever  [1 docs, x1] [judged-distinct]
A retriever that relies on a large language model to decide what information is relevant and should be retrieved. It can use the model's semantic understanding and reasoning to guide selection.

### RL-based Retriever  [1 docs, x1] [judged-distinct]
A retriever that is trained with reinforcement learning to improve retrieval decisions through reward signals. It learns a policy for choosing relevant knowledge items over time.

### Multi-round Retrieval  [1 docs, x1] [judged-distinct]
Multi-round retrieval is a retrieval approach that performs several successive retrieval steps rather than a single search. Each round can refine the query or use earlier results to improve relevance and completeness.

### Node-level Knowledge  [1 docs, x1] [judged-distinct]
Node-level knowledge is information represented at the level of individual graph nodes. It encodes facts or entities as discrete units that can be learned from or generated by a model.

### Path-level Knowledge  [1 docs, x1] [judged-distinct]
Path-level knowledge captures relationships as sequences of connected nodes in a graph. It represents multi-hop structure and can support reasoning over chains of linked facts.

### Subgraph-level Knowledge  [1 docs, x1] [judged-distinct]
Subgraph-level knowledge represents a local graph neighborhood containing multiple nodes and edges. It preserves richer structural context than single nodes or individual paths and is useful for structured reasoning.

### Graph-enhanced Chain-of-Thought  [1 docs, x1] [judged-distinct]
Graph-enhanced chain-of-thought is a reasoning approach that combines step-by-step verbal reasoning with graph structure or graph-derived evidence. It uses graph information to guide intermediate reasoning steps and improve factual consistency.

### Collaborative Knowledge Graph Refinement  [1 docs, x1] [judged-distinct]
Collaborative knowledge graph refinement is a process in which a system improves a knowledge graph by iteratively updating, correcting, or enriching its structure. It aims to make the graph more accurate and more useful for downstream reasoning or retrieval.

### LeanContext  [1 docs, x1] [new]
LeanContext is a method that selectively keeps only the most relevant sentences for a query. It reduces context size and computational cost by removing less useful retrieved content.

### 句子选择  [1 docs, x1] [judged-distinct]
一种从候选文本中挑选最相关句子的过程，目的是保留对当前输入最有用的信息并减少无关内容。它常用于压缩上下文、提高效率，并降低后续计算开销。

### 自我反思机制  [1 docs, x1] [new]
一种让模型对自身输出或外部检索内容进行评估与反省的机制，用于发现错误、遗漏或不一致之处。它通常用于在生成过程中触发修正，从而提升结果质量。

### SKR  [1 docs, x1] [judged-distinct]
一种动态检索框架，使大语言模型在面对已知或可由内部知识回答的查询时优先使用预训练知识，仅在必要时才调用检索。它旨在减少不必要的检索，并提升响应效率。

### 上下文过滤模型  [1 docs, x1] [judged-distinct]
一种用于识别并移除上下文中无关或低价值内容的模型。它通常在检索增强系统中作为筛选器，以保留更有用的证据并抑制噪声。

### 检索内容重要性评估方法  [1 docs, x1] [judged-distinct]
一种专门衡量检索到的内容对最终生成或回答有多大贡献的评估方法。它帮助系统识别哪些证据应被保留、削弱或删除。

### 剪枝  [1 docs, x1] [judged-distinct]
一种从候选集合中移除不重要部分的操作，以保留更有价值的信息并降低复杂度。它常用于压缩检索结果或模型输入。

### 重加权  [1 docs, x1] [judged-distinct]
一种调整不同信息片段相对权重的方法，使更重要的部分在后续处理或生成中发挥更大作用。它常用于优化检索结果的影响力分布。

### Selfmem  [1 docs, x1] [judged-distinct]
一种在检索语料有限时构建记忆池的框架，利用大语言模型生成的结果作为可选择的信息来源。它通过迭代选择来提升生成质量。

### 记忆池  [1 docs, x1] [judged-distinct]
一种用于存放可供后续检索、选择或复用的信息集合。它通常保存模型生成结果或外部知识片段，以支持后续生成过程。

### 迭代选择框架  [1 docs, x1] [new]
一种反复评估并筛选候选项的机制，通过多轮选择逐步保留更优的信息。它常用于从较大的候选集合中构建更高质量的子集。

### SAIL  [1 docs, x1] [judged-distinct]
一种基于检索结果构造指令微调数据集的方法，用于训练大语言模型将回答建立在可靠内容之上。它同时尽量排除会干扰学习的无关元素。

### 指令微调数据集  [1 docs, x1] [judged-distinct]
一种用于指令微调的训练数据集合，通常包含输入指令、相关上下文和期望输出。它用于让模型更好地遵循任务要求并生成符合指令的回答。

### 语义相似片段  [1 docs, x1] [judged-distinct]
与查询在向量空间中具有较高相似度的文本块或信息片段。它们通常是检索系统返回的候选证据，但未必包含完成复杂推理所需的全部信息。

### 多跳问题  [1 docs, x1] [judged-distinct]
一种需要通过多个中间事实或推理步骤才能回答的问题。它通常无法仅凭单个局部片段直接解决，而需要跨多个证据源进行组合推理。

### 块粒度  [1 docs, x1] [judged-distinct]
文本被切分成块时每个块的大小或细化程度。块粒度越小，单个块包含的信息越局部，可能更难支撑复杂推理所需的完整上下文。

### 领域知识  [1 docs, x1] [new]
特定专业领域内的专门知识体系，通常包含术语、规则、事实和推理模式。它在问答和生成任务中常需要结合多步推理才能被有效理解和使用。

### 多跳推理  [1 docs, x1] [judged-distinct]
一种需要连续使用多个中间结论来得出最终答案的推理方式。它常用于连接分散在不同文本片段中的证据，从而解决复杂问题。

### multi-hop information  [1 docs, x1] [judged-distinct]
Information that must be connected across multiple pieces of evidence or multiple reasoning steps to answer a query. It is common in complex questions that cannot be resolved from a single local text segment.

### distributed domain knowledge  [1 docs, x1] [judged-distinct]
Domain-specific knowledge that is scattered across many documents, sources, or sections rather than concentrated in one place. Effective use of this knowledge requires connecting dispersed fragments and preserving their contextual relationships.

### structural database  [1 docs, x1] [new]  · aliases: structural databases
A database organized around explicit structural relationships rather than only unstructured text. It is used to store and retrieve knowledge in a form that supports relational querying and structured access.

## Relations (2812)

- kNN-LM —uses→ datastore  (x5)
- Open-domain Question Answering —depends on→ passage retrieval  (x5)
- Dense Passage Retriever —is used for→ Open-domain Question Answering  (x5)
- retrieval-augmented generation —uses→ Dense Passage Retriever  (x5)
- LightRAG —uses→ graph index  (x5)
- Transformer —uses→ self-attention  (x4)
- LightRAG —uses→ dual-level retrieval system  (x4)
- BERT —uses→ masked language model  (x3)
- masked language model —uses→ [MASK] token  (x3)
- Webtext2 training set —is an extended version of→ WebText corpus  (x3)
- retrieval-augmented generation —combines→ implicit memorization  (x3)
- retrieval-augmented generation —combines→ explicit memory  (x3)
- pre-trained seq2seq model —is a kind of→ sequence-to-sequence model  (x3)
- retrieval-augmented generation —uses→ pre-trained seq2seq model  (x3)
- retrieval-augmented generation —is used for→ Open-domain Question Answering  (x3)
- Open-domain Question Answering —uses→ retrieved passages  (x3)
- Low-Rank Adaptation —uses→ 低秩分解矩阵  (x3)
- chain-of-thought prompting —improves performance on→ GSM8K  (x3)
- chain-of-thought prompting —is compared with→ standard prompting  (x3)
- InstructGPT —is trained with→ fine-tuning with human feedback  (x3)
- human-labeled comparisons —is used to train→ reward model  (x3)
- retrieval-augmented generation —uses→ large-scale language model  (x3)
- GraphRAG —is a kind of→ retrieval-augmented generation  (x3)
- retrieval-augmented generation —includes→ Generation Component  (x3)
- Adam optimizer —is used with→ learning rate schedule  (x2)
- Transformer —uses→ Label Smoothing  (x2)
- Transformer —uses→ attention head  (x2)
- masked language model —is inspired by→ Cloze task  (x2)
- BERT —is trained with→ masked language model  (x2)
- BERT —is trained with→ next sentence prediction  (x2)
- BERT —uses→ 双向自注意力  (x2)
- BERT —uses→ [CLS] token  (x2)
- BERT —uses→ [SEP] token  (x2)
- segment-pair —retains→ next sentence prediction  (x2)
- full sentences —removes→ next sentence prediction  (x2)
- kNN-LM —uses→ 线性插值  (x2)
- kNN-LM —combines with→ k近邻模型  (x2)
- kNN-LM —improves→ perplexity  (x2)
- kNN-LM —uses→ nearest neighbor retrieval  (x2)
- scaling laws for neural language models —depends on→ model size  (x2)
- scaling laws for neural language models —depends on→ dataset size  (x2)
- scaling laws for neural language models —depends on→ training compute  (x2)
- Webtext2 training set —is tokenized using→ byte-pair encoding  (x2)
- aspect ratio —is a measure of→ Transformer shape  (x2)
- Retrieval-Augmented Language Model Pre-Training —is evaluated on→ Open-domain Question Answering  (x2)
- Retrieval-Augmented Language Model Pre-Training —uses→ latent knowledge retriever  (x2)
- Open-domain Question Answering —uses→ reading comprehension  (x2)
- NaturalQuestions dataset —is a benchmark for→ Open-domain Question Answering  (x2)
- sparse bag-of-words matching —includes→ TF-IDF  (x2)
- sparse bag-of-words matching —includes→ BM25  (x2)
- ORQA —uses→ Dense retrieval  (x2)
- Dense retrieval —uses→ dense representation  (x2)
- Dense Passage Retriever —uses→ BERT  (x2)
- BM25 —is used for→ Open-domain Question Answering  (x2)
- Dense Passage Retriever —outperforms→ BM25  (x2)
- Dense Passage Retriever —uses→ 段落编码器  (x2)
- WEBQUESTIONS —uses answers from→ Freebase  (x2)
- claim-class pair —maps to→ supports  (x2)
- retrieval-augmented generation —uses→ explicit memory  (x2)
- GPT-3 —is evaluated in→ zero-shot transfer  (x2)
- GPT-3 —is evaluated in→ one-shot learning  (x2)
- GPT-3 —is evaluated in→ few-shot learning  (x2)
- Approximate nearest neighbor Negative Contrastive Learning —uses→ approximate nearest neighbor index  (x2)
- in-batch negatives —are used in→ contrastive learning  (x2)
- ANCE —uses→ approximate nearest neighbor search  (x2)
- BM25 —uses→ bag-of-words  (x2)
- retrieval-augmented generation —depends on→ retrieved passages  (x2)
- retrieval-augmented generation —uses→ BM25  (x2)
- 适配器 —uses→ adapter layer  (x2)
- full fine-tuning —is a form of→ fine-tuning  (x2)
- AdptD —is a parameter-efficient alternative to→ fine-tuning  (x2)
- AdapterL —uses→ adapter layer  (x2)
- AdapterL —applied after→ layer normalization  (x2)
- TruthfulQA —is designed to elicit→ imitative falsehood  (x2)
- GPT-3 —is evaluated on→ TruthfulQA  (x2)
- GPT-Neo —is evaluated on→ TruthfulQA  (x2)
- GPT-2 —is evaluated on→ TruthfulQA  (x2)
- UnifiedQA —is evaluated on→ TruthfulQA  (x2)
- TruthfulQA —includes→ reference answers  (x2)
- adversarial procedure —produces→ filtered questions  (x2)
- adversarial procedure —produces→ unfiltered questions  (x2)
- chain-of-thought prompting —uses→ chain of thought  (x2)
- LaMDA 137B —is evaluated on→ GSM8K  (x2)
- fine-tuning with human feedback —is used for→ 语言模型对齐  (x2)
- human-written demonstrations —is used to train→ supervised learning baseline  (x2)
- FLAN —由以下内容组成→ 自然语言处理任务  (x2)
- fine-tuning —adapts→ language models  (x2)
- Perplexity Distillation —minimizes→ Kullback-Leibler divergence  (x2)
- language model meta-learning —is a form of→ few-shot learning  (x2)
- BERT —is based on→ Transformer  (x2)
- large-scale language model —is developed through→ 预训练  (x2)
- large-scale language model —is assessed by→ capacity evaluation  (x2)
- statistical language model —is a kind of→ language models  (x2)
- neural language model —is a kind of→ language models  (x2)
- 预训练神经语言模型 —is a kind of→ language models  (x2)
- GPT-4 —is a kind of→ large-scale language model  (x2)
- primacy bias —contributes to→ U-shaped performance curve  (x2)
- recency bias —contributes to→ U-shaped performance curve  (x2)
- closed-book setting —depends on→ implicit memorization  (x2)
- hallucination —occurs in→ large-scale language model  (x2)
- Taxonomy of hallucination —classifies→ hallucination  (x2)
- 解码阶段事实性增强 —是用于缓解的→ Hallucination mitigation  (x2)
- GraphRAG —uses→ map-reduce processing  (x2)
- vector RAG —is a kind of→ retrieval-augmented generation  (x2)
- vector RAG —uses→ text embeddings  (x2)
- GraphRAG —uses→ graph index  (x2)
- GraphRAG —uses→ textual subgraph retrieval  (x2)
- GraphRAG —uses→ divide-and-conquer strategy  (x2)
- GraphRAG —retrieves→ textual subgraph  (x2)
- flat data representation —limits→ contextual awareness  (x2)
- dual-level retrieval system —includes→ low-level knowledge discovery  (x2)
- incremental update algorithm —updates→ non-parametric knowledge source  (x2)
- 双层检索框架 —包含→ low-level knowledge discovery  (x2)
- 双层检索框架 —包含→ high-level knowledge discovery  (x2)
- Dense Passage Retriever —uses→ dense representation  (x2)
- GraphRAG —uses→ knowledge graph  (x2)
- retrieval-augmented generation —includes→ knowledge preparation  (x2)
- retrieval-augmented generation —includes→ integration  (x2)
- retrieval-augmented generation —is used for→ domain-specific knowledge  (x2)
- retrieval-augmented generation —uses→ chunking  (x2)
- Transformer —solely based on→ 注意力机制  (x1)
- Transformer —dispenses with→ 循环神经网络  (x1)
- Transformer —dispenses with→ 卷积神经网络  (x1)
- 编码器-解码器结构 —connected through→ 注意力机制  (x1)
- 自注意力 —is a kind of→ 注意力机制  (x1)
- 缩放点积注意力 —is a kind of→ 注意力机制  (x1)
- 多头注意力 —is a kind of→ 注意力机制  (x1)
- 位置表示 —is used by→ Transformer  (x1)
- Transformer —evaluated on→ 英德机器翻译任务  (x1)
- Transformer —evaluated on→ 英法机器翻译任务  (x1)
- Transformer —applied to→ 英语成分句法分析  (x1)
- Transformer —uses→ scaled dot-product attention  (x1)
- Transformer —uses→ 多头注意力  (x1)
- Transformer —uses→ parameter-free position representation  (x1)
- Tensor2Tensor —is used for implementing→ Transformer  (x1)
- 长短期记忆网络 —is a kind of→ 循环神经网络  (x1)
- 门控循环神经网络 —is a kind of→ 循环神经网络  (x1)
- 语言模型 —is a kind of→ 序列建模  (x1)
- 机器翻译 —is a kind of→ 转导问题  (x1)
- 编码器-解码器结构 —is used for→ 转导问题  (x1)
- 隐藏状态 —is used by→ 循环神经网络  (x1)
- 注意力机制 —is used in→ 序列建模  (x1)
- Transformer —relies on→ 注意力机制  (x1)
- Transformer —enables→ 并行化  (x1)
- Extended Neural GPU —aims for→ 并行化  (x1)
- ByteNet —aims for→ 并行化  (x1)
- ConvS2S —aims for→ 并行化  (x1)
- Transformer —完全依赖→ 自注意力  (x1)
- 自注意力 —由...增强→ 多头注意力  (x1)
- 端到端记忆网络 —使用类似机制→ 自注意力  (x1)
- 编码器-解码器结构 —包含→ 编码器  (x1)
- 编码器-解码器结构 —包含→ 解码器  (x1)
- 解码器 —采用→ 自回归  (x1)
- ConvS2S —与...并列比较→ ByteNet  (x1)
- Transformer —采用→ 编码器-解码器结构  (x1)
- Transformer —由…组成→ 编码器  (x1)
- Transformer —由…组成→ 解码器  (x1)
- 编码器 —使用→ 多头自注意力机制  (x1)
- 编码器 —使用→ 逐位置前馈网络  (x1)
- 编码器 —使用→ 残差连接  (x1)
- 编码器 —使用→ 层归一化  (x1)
- 解码器 —使用→ 多头自注意力机制  (x1)
- 解码器 —使用→ 掩码自注意力  (x1)
- 解码器 —使用→ 残差连接  (x1)
- 解码器 —使用→ 层归一化  (x1)
- 注意力机制 —使用→ 查询  (x1)
- scaled dot-product attention —uses→ Softmax Function  (x1)
- scaled dot-product attention —is a scaled version of→ Dot-Product Attention  (x1)
- 多头注意力 —uses→ scaled dot-product attention  (x1)
- 多头注意力 —is based on→ Dot-Product Attention  (x1)
- attention function —uses→ query  (x1)
- attention function —uses→ key  (x1)
- attention function —uses→ value  (x1)
- linear projection —transforms→ query  (x1)
- linear projection —transforms→ key  (x1)
- linear projection —transforms→ value  (x1)
- dot product —has→ variance  (x1)
- 多头注意力 —is composed of→ attention head  (x1)
- 多头注意力 —is used in→ encoder-decoder attention  (x1)
- 多头注意力 —is used in→ self-attention  (x1)
- self-attention —is used in→ encoder  (x1)
- self-attention —is used in→ decoder  (x1)
- encoder-decoder attention —depends on→ encoder  (x1)
- encoder-decoder attention —depends on→ decoder  (x1)
- decoder —preserves→ auto-regressive property  (x1)
- masking —is implemented inside→ scaled dot-product attention  (x1)
- position-wise feed-forward network —is contained in→ encoder  (x1)
- position-wise feed-forward network —is contained in→ decoder  (x1)
- query —are compared with→ key  (x1)
- key —selects→ value  (x1)
- scaled dot-product attention —uses→ query  (x1)
- scaled dot-product attention —uses→ key  (x1)
- scaled dot-product attention —uses→ value  (x1)
- position-wise feed-forward network —consists of→ Linear Transformation  (x1)
- position-wise feed-forward network —uses→ ReLU Activation  (x1)
- position-wise feed-forward network —is alternatively described as→ Convolution with Kernel Size 1  (x1)
- Learned Embedding —produces vectors of→ Model Dimension  (x1)
- Pre-Softmax Linear Transformation —feeds into→ Softmax Function  (x1)
- Weight Sharing —links→ Learned Embedding  (x1)
- Weight Sharing —links→ Pre-Softmax Linear Transformation  (x1)
- Model Dimension —differs from→ Inner-Layer Dimension  (x1)
- sinusoidal positional encoding —is a kind of→ parameter-free position representation  (x1)
- learned positional embedding —is a kind of→ parameter-free position representation  (x1)
- path length —affects→ long-range dependencies  (x1)
- self-attention —is compared to→ recurrent layer  (x1)
- self-attention —is compared to→ convolutional layer  (x1)
- recurrent layer —requires→ sequential operations  (x1)
- separable convolution —is a more efficient form of→ convolutional layer  (x1)
- dilated convolution —is a variant of→ convolutional layer  (x1)
- attention head —is a component of→ self-attention  (x1)
- byte-pair encoding —is used with→ WMT 2014 English-German dataset  (x1)
- word-piece —is used with→ WMT 2014 English-French dataset  (x1)
- sentence-pair batching —is based on→ approximate sequence length  (x1)
- training batch —contains→ source token  (x1)
- training batch —contains→ target token  (x1)
- learning rate schedule —uses→ warmup steps  (x1)
- learning rate schedule —uses→ inverse square root decay  (x1)
- base model —is trained with→ training step  (x1)
- big model —is trained with→ training step  (x1)
- Transformer —is evaluated by→ BLEU  (x1)
- Transformer —uses→ Residual Dropout  (x1)
- Residual Dropout —is applied to→ parameter-free position representation  (x1)
- 基准模型 —是一个较小配置的→ Transformer  (x1)
- 束搜索 —配合使用→ 长度惩罚  (x1)
- Transformer —使用→ Dropout  (x1)
- 基准模型 —使用→ 检查点平均  (x1)
- Transformer —使用→ 检查点平均  (x1)
- 英德机器翻译任务 —使用→ BLEU  (x1)
- Transformer —has baseline configuration→ base model  (x1)
- attention head —has dimension→ attention key dimension  (x1)
- attention head —has dimension→ attention value dimension  (x1)
- Transformer —uses→ byte-pair encoding  (x1)
- byte-pair encoding —produces→ word-piece  (x1)
- Transformer —is decoded with→ beam search  (x1)
- Transformer —is evaluated without→ 检查点平均  (x1)
- Transformer —can use→ learned positional embedding  (x1)
- Transformer —can use→ sinusoidal positional encoding  (x1)
- learned positional embedding —replaces→ sinusoidal positional encoding  (x1)
- big model —is a larger variant of→ Transformer  (x1)
- attention head —depends on→ attention key dimension  (x1)
- attention head —uses→ compatibility function  (x1)
- compatibility function —is often implemented as→ dot product  (x1)
- Dropout —regularizes→ Transformer  (x1)
- sinusoidal positional encoding —is contrasted with→ learned positional embedding  (x1)
- English constituency parsing —is evaluated with→ Transformer  (x1)
- English constituency parsing —uses→ Wall Street Journal portion of the Penn Treebank  (x1)
- English constituency parsing —is trained in→ semi-supervised setting  (x1)
- semi-supervised setting —uses→ BerkeleyParser corpora  (x1)
- Transformer —is decoded with→ beam size  (x1)
- BERT —依赖于→ 预训练  (x1)
- BERT —学习→ 双向表示  (x1)
- BERT —是一种→ 语言表示模型  (x1)
- BERT —基于→ Transformer  (x1)
- BERT —用于→ 问答  (x1)
- BERT —用于→ 语言推断  (x1)
- BERT —适用于→ 自然语言处理任务  (x1)
- BERT —通过→ 文本微调  (x1)
- feature-based approach —is exemplified by→ ELMo  (x1)
- 文本微调 —is exemplified by→ Generative Pre-trained Transformer  (x1)
- Generative Pre-trained Transformer —uses→ unidirectional language model  (x1)
- unidirectional language model —constrains→ self-attention  (x1)
- self-attention —is a core mechanism of→ Transformer  (x1)
- Generative Pre-trained Transformer —is based on→ Transformer  (x1)
- 问答 —is hindered by→ unidirectional language model  (x1)
- 问答 —is addressed by→ BERT  (x1)
- masked language model —enables→ BERT  (x1)
- left-to-right language modeling objective —is used to pre-train→ word embeddings  (x1)
- discriminative context objective —is used to pre-train→ word embeddings  (x1)
- sentence embeddings —generalizes to→ left-to-right language modeling objective  (x1)
- paragraph embeddings —generalizes to→ left-to-right language modeling objective  (x1)
- candidate next sentence ranking —is used to train→ sentence embeddings  (x1)
- next-sentence word generation —is used to train→ sentence embeddings  (x1)
- denoising autoencoder —is used to train→ sentence embeddings  (x1)
- ELMo —is an example of→ contextual word embeddings  (x1)
- ELMo —uses→ right-to-left language model  (x1)
- 长短期记忆网络 —is used in→ contextual word embeddings  (x1)
- Cloze task —is used to improve→ contextual word embeddings  (x1)
- Cloze task —can be used with→ 长短期记忆网络  (x1)
- Cloze task —is used to improve robustness of→ text generation model  (x1)
- sentence encoder —produces→ contextual word embeddings  (x1)
- document encoder —produces→ contextual word embeddings  (x1)
- sentence encoder —is fine-tuned for→ supervised downstream task  (x1)
- document encoder —is fine-tuned for→ supervised downstream task  (x1)
- Generative Pre-trained Transformer —achieved state-of-the-art results on→ GLUE  (x1)
- Generative Pre-trained Transformer —is a→ left-to-right language model  (x1)
- [CLS] token —is used in→ BERT  (x1)
- [SEP] token —is used in→ BERT  (x1)
- BERT —includes→ 预训练  (x1)
- BERT —includes→ 文本微调  (x1)
- BERT —uses→ Transformer 编码器  (x1)
- Transformer 编码器 —is composed of→ Transformer 块  (x1)
- 双向 Transformer 编码器 —uses→ 双向自注意力  (x1)
- 掩码自注意力 —is a kind of→ 自注意力  (x1)
- 双向自注意力 —is a kind of→ 自注意力  (x1)
- 文本微调 —depends on→ 预训练  (x1)
- BERTBASE —is defined by→ 层数  (x1)
- BERTBASE —is defined by→ Model Dimension  (x1)
- BERTBASE —is defined by→ 注意力头数  (x1)
- BERTLARGE —is defined by→ 层数  (x1)
- BERTLARGE —is defined by→ Model Dimension  (x1)
- BERTLARGE —is defined by→ 注意力头数  (x1)
- Generative Pre-trained Transformer —uses→ 掩码自注意力  (x1)
- 掩码自注意力 —attends only to→ left context  (x1)
- BERT —uses→ word-piece  (x1)
- BERT —uses→ segment embeddings  (x1)
- BERT —uses→ learned positional embedding  (x1)
- BERT —is pre-trained using→ masked language model  (x1)
- [CLS] token —is part of→ BERT  (x1)
- [SEP] token —is part of→ BERT  (x1)
- segment embeddings —are part of→ BERT  (x1)
- learned positional embedding —are part of→ BERT  (x1)
- masked language model —is used to train→ deep bidirectional representation  (x1)
- masked language model —is also called→ Cloze task  (x1)
- masked language model —operates on→ word-piece  (x1)
- Transformer 编码器 —produces→ deep bidirectional representation  (x1)
- denoising autoencoder —differs from→ masked language model  (x1)
- next sentence prediction —is used with→ Transformer 编码器  (x1)
- next sentence prediction —uses label→ IsNext  (x1)
- next sentence prediction —uses label→ NotNext  (x1)
- next sentence prediction —is generated from→ monolingual corpus  (x1)
- 问答 —benefits from→ next sentence prediction  (x1)
- Natural Language Inference —benefits from→ next sentence prediction  (x1)
- next sentence prediction —complements→ language modeling  (x1)
- BERT input representation —is composed of→ 词元嵌入  (x1)
- BERT input representation —is composed of→ 句段嵌入  (x1)
- BERT input representation —is composed of→ 位置表示  (x1)
- next sentence prediction —is used in pre-training with→ BooksCorpus  (x1)
- next sentence prediction —is used in pre-training with→ 英语维基百科  (x1)
- BooksCorpus —is an example of→ 文档级语料库  (x1)
- 英语维基百科 —is an example of→ 文档级语料库  (x1)
- 自注意力 —is a mechanism used in→ Transformer  (x1)
- 自注意力 —can unify→ 双向交叉注意力  (x1)
- Transformer —uses→ BERT input representation  (x1)
- 双向交叉注意力 —is approximated by→ 自注意力  (x1)
- BERT fine-tuning —uses→ self-attention  (x1)
- BERT fine-tuning —uses→ [CLS] representation  (x1)
- GLUE —includes→ sentiment analysis  (x1)
- GLUE —includes→ Natural Language Inference  (x1)
- GLUE —includes→ 问答  (x1)
- [CLS] token —has final hidden state→ final hidden state  (x1)
- final hidden state —is input to→ classification layer  (x1)
- classification layer —produces scores for→ Softmax Function  (x1)
- Softmax Function —is used in→ classification loss  (x1)
- classification layer —is used to compute→ classification loss  (x1)
- BERTBASE —is a kind of→ BERT  (x1)
- BERTLARGE —is a kind of→ BERT  (x1)
- GLUE —includes task→ MNLI  (x1)
- GLUE —includes task→ QQP  (x1)
- GLUE —includes task→ QNLI  (x1)
- GLUE —includes task→ SST-2  (x1)
- GLUE —includes task→ CoLA  (x1)
- GLUE —includes task→ STS-B  (x1)
- GLUE —includes task→ MRPC  (x1)
- GLUE —includes task→ RTE  (x1)
- GLUE —includes task→ WNLI  (x1)
- F1 score —is reported for→ QQP  (x1)
- F1 score —is reported for→ MRPC  (x1)
- Spearman correlation —is reported for→ STS-B  (x1)
- BERTBASE —is a configuration of→ BERT  (x1)
- BERTLARGE —is a configuration of→ BERT  (x1)
- Generative Pre-trained Transformer —uses→ masking  (x1)
- BERTBASE —is evaluated on→ GLUE  (x1)
- BERTLARGE —is evaluated on→ GLUE  (x1)
- BERTBASE —is evaluated on→ Stanford Question Answering Dataset  (x1)
- BERTLARGE —is evaluated on→ Stanford Question Answering Dataset  (x1)
- MNLI —is part of→ GLUE  (x1)
- 问答 —is a kind of→ answer span  (x1)
- single packed sequence —is used for→ 问答  (x1)
- start vector —is used for predicting the start of→ answer span  (x1)
- end vector —is used for predicting the end of→ answer span  (x1)
- candidate span scoring —is used for selecting→ answer span  (x1)
- Stanford Question Answering Dataset —is a benchmark for→ 问答  (x1)
- TriviaQA —is a dataset for→ 问答  (x1)
- fine-tuning —is used for adapting→ BERT  (x1)
- data augmentation —is used for→ fine-tuning  (x1)
- RoBERTa —是对……的改进→ BERT 预训练  (x1)
- BERT 预训练 —是一种→ 语言模型预训练  (x1)
- RoBERTa —在……上取得结果→ GLUE  (x1)
- RoBERTa —在……上取得结果→ RACE  (x1)
- RoBERTa —在……上取得结果→ Stanford Question Answering Dataset  (x1)
- 自训练方法 —属于→ 语言模型预训练  (x1)
- RoBERTa —is a refined version of→ BERT 预训练  (x1)
- RoBERTa —removes→ next sentence prediction  (x1)
- RoBERTa —uses→ masked language model  (x1)
- RoBERTa —uses→ CC-NEWS  (x1)
- RoBERTa —is evaluated on→ GLUE  (x1)
- RoBERTa —is evaluated on→ Stanford Question Answering Dataset  (x1)
- RoBERTa —is evaluated on→ RACE  (x1)
- BERT 预训练 —depends on→ hyperparameter tuning  (x1)
- BERT 预训练 —uses→ masked language model  (x1)
- masked language model —is competitive with→ perturbed autoregressive language modeling  (x1)
- BERT —uses→ Transformer  (x1)
- BERT —uses→ next sentence prediction  (x1)
- next sentence prediction —is designed to improve→ Natural Language Inference  (x1)
- Adam optimizer —is used with→ Dropout  (x1)
- BooksCorpus —is combined with→ Wikipedia  (x1)
- BERT —is trained on→ BooksCorpus  (x1)
- BERT —is trained on→ English Wikipedia  (x1)
- BERT —is reimplemented in→ FAIRSEQ  (x1)
- Replication study —studies→ BERT  (x1)
- Adam optimizer —includes→ Adam epsilon term  (x1)
- Adam optimizer —includes→ β2 parameter  (x1)
- mixed precision floating point arithmetic —is used with→ full-length sequences  (x1)
- BERT 预训练 —uses→ BooksCorpus  (x1)
- BERT 预训练 —uses→ English Wikipedia  (x1)
- BooksCorpus —is paired with→ English Wikipedia  (x1)
- OpenWebText —is an open-source recreation of→ WebText corpus  (x1)
- GLUE —includes→ single-sentence classification  (x1)
- GLUE —includes→ sentence pair classification  (x1)
- Stanford Question Answering Dataset —is another downstream benchmark alongside→ GLUE  (x1)
- Stanford Question Answering Dataset —has version→ SQuAD v1.1  (x1)
- Stanford Question Answering Dataset —has version→ SQuAD v2.0  (x1)
- SQuAD v2.0 —uses→ answerability classifier  (x1)
- static masking —is contrasted with→ dynamic masking  (x1)
- dynamic masking —is compared with→ static masking  (x1)
- dynamic masking —is described as an alternative to→ static masking  (x1)
- masked language model —is paired with→ next sentence prediction  (x1)
- next sentence prediction —is paired with→ masked language model  (x1)
- SEGMENT-PAIR+NSP —is the original input format used in→ BERT  (x1)
- SEGMENT-PAIR+NSP —includes→ next sentence prediction  (x1)
- QNLI —is used to evaluate→ BERT  (x1)
- MNLI —is used to evaluate→ BERT  (x1)
- SQuAD v1.1 —is used to evaluate→ BERT  (x1)
- document sentences —is similar to→ full sentences  (x1)
- SENTENCE-PAIR format —retains→ next sentence prediction  (x1)
- document sentences —removes→ next sentence prediction  (x1)
- document sentences —restricts sequences compared to→ full sentences  (x1)
- segment-pair —is compared to→ SENTENCE-PAIR format  (x1)
- BERTBASE —is amenable to→ large mini-batch training  (x1)
- BERT —is amenable to→ large mini-batch training  (x1)
- BERTBASE —is a variant of→ BERT  (x1)
- gradient accumulation —is used to simulate→ large mini-batch training  (x1)
- large mini-batch training —依赖于→ 批量大小  (x1)
- large mini-batch training —更容易通过…实现→ 分布式数据并行训练  (x1)
- masked language model —使用…进行评估→ 困惑度  (x1)
- 字节对编码 —基于→ 子词单元  (x1)
- 字节级字节对编码 —是一种变体→ 字节对编码  (x1)
- 字节级字节对编码 —避免产生→ 未知词元  (x1)
- byte-level BPE —is a variant of→ byte-pair encoding  (x1)
- byte-level BPE —learns a→ subword vocabulary  (x1)
- byte-level BPE —avoids→ unknown token  (x1)
- BERT —can be trained with→ byte-level BPE  (x1)
- BERT —can use→ heuristic tokenization rules  (x1)
- BERT —has variant→ BERTBASE  (x1)
- BERT —has variant→ BERTLARGE  (x1)
- dynamic masking —is used in→ RoBERTa  (x1)
- full sentences —is used in→ RoBERTa  (x1)
- next sentence prediction —is omitted from→ RoBERTa  (x1)
- large mini-batch training —is used in→ RoBERTa  (x1)
- gradient accumulation —enables→ large mini-batch training  (x1)
- byte-level BPE —is used in→ RoBERTa  (x1)
- RoBERTa —follows→ BERTLARGE  (x1)
- RoBERTa —uses→ pretraining data  (x1)
- RoBERTa —varies→ training passes  (x1)
- XLNet —uses→ pretraining data  (x1)
- XLNet —uses→ training batch  (x1)
- XLNet —uses→ training step  (x1)
- BooksCorpus —is combined with→ English Wikipedia  (x1)
- kNN-LM —扩展→ 预训练神经语言模型  (x1)
- kNN-LM —结合→ k近邻模型  (x1)
- kNN-LM —使用→ 线性插值  (x1)
- kNN-LM —基于→ 预训练LM嵌入空间  (x1)
- kNN-LM —依赖→ 近邻数据存储  (x1)
- 近邻数据存储 —支持→ 域自适应  (x1)
- kNN-LM —支持→ 域自适应  (x1)
- 长尾分布 —包含→ 事实知识  (x1)
- kNN-LM —有助于处理→ 长尾分布  (x1)
- kNN-LM —extends→ 预训练神经语言模型  (x1)
- k近邻模型 —uses→ prefix embedding  (x1)
- prefix embedding —is represented in→ pre-trained embedding space  (x1)
- nearest neighbor datastore —supports→ k近邻模型  (x1)
- kNN-LM —uses→ nearest neighbor datastore  (x1)
- kNN-LM —enables→ 域自适应  (x1)
- kNN-LM —evaluated on→ Wikitext-103  (x1)
- kNN-LM —augments→ 语言模型  (x1)
- kNN-LM —uses→ 键值存储库  (x1)
- 自回归语言模型 —is a kind of→ 语言模型  (x1)
- 键值存储库 —stores→ 上下文-目标对  (x1)
- 左侧上下文 —forms part of→ 上下文-目标对  (x1)
- 目标分布 —is computed from→ k近邻模型  (x1)
- 线性插值 —combines→ 目标分布  (x1)
- 线性插值 —combines with→ 语言模型  (x1)
- 长尾模式 —is easier to access via→ 显式记忆  (x1)
- 事实知识 —is an example of→ 长尾模式  (x1)
- 事实知识 —is easier to access via→ 显式记忆  (x1)
- datastore —is composed of→ key-value pair  (x1)
- key-value pair —contains→ prefix embedding  (x1)
- key-value pair —can be retrieved as→ nearest neighbors  (x1)
- prefix embedding —is compared using→ squared L2 distance  (x1)
- nearest neighbors —is combined by→ interpolation  (x1)
- Softmax Function —is used to normalize→ nearest neighbors  (x1)
- squared L2 distance —corresponds to→ RBF kernel  (x1)
- kNN-LM —uses→ interpolation  (x1)
- kNN-LM —uses→ nearest neighbors  (x1)
- FAISS —is used for→ nearest neighbor retrieval  (x1)
- FAISS —supports→ L2 distance  (x1)
- FAISS —supports→ dot product  (x1)
- cache model —is partly superseded by→ self-attention  (x1)
- cache model —is used for→ 域自适应  (x1)
- Wikitext-103 —is derived from→ English Wikipedia  (x1)
- WIKI-100M —is a subset of→ English Wikipedia  (x1)
- BooksCorpus —provides training data for→ datastore  (x1)
- WIKI-100M —is a subset of→ WIKI-3B  (x1)
- byte-pair encoding —uses→ BERT subword vocabulary  (x1)
- kNN-LM —is compatible with→ Transformer decoder  (x1)
- kNN-LM —uses→ prefix embedding  (x1)
- negative log-likelihood —is measured by→ perplexity  (x1)
- adaptive softmax —can use→ tied weights  (x1)
- Transformer language model —uses→ self-attention  (x1)
- Transformer language model —uses→ layer normalization  (x1)
- Transformer language model —uses→ position-wise feed-forward network  (x1)
- kNN-LM —extends→ Transformer language model  (x1)
- kNN-LM —uses→ FAISS index  (x1)
- kNN-LM —is orthogonal to→ cache model  (x1)
- kNN-LM —uses→ interpolation parameter  (x1)
- FAISS index —stores→ cluster centroid  (x1)
- FAISS index —uses→ quantization  (x1)
- kNN-LM —uses→ squared L2 distance  (x1)
- kNN-LM —uses→ L2 distance  (x1)
- kNN-LM —is tuned with→ 插值参数 λ  (x1)
- 插值参数 λ —is tuned on→ 验证集  (x1)
- kNN-LM —improves→ 困惑度  (x1)
- kNN-LM —is evaluated on→ Wikitext-103  (x1)
- cache model —is related but orthogonal to→ kNN-LM  (x1)
- cache model —is additive with→ kNN-LM  (x1)
- interpolation parameter —controls→ kNN-LM  (x1)
- cache model —adds to→ kNN-LM  (x1)
- datastore —is used by→ kNN-LM  (x1)
- WIKI-100M —is used to build→ datastore  (x1)
- WIKI-3B —is used to build→ datastore  (x1)
- vanilla LM —is evaluated by→ perplexity  (x1)
- nearest neighbor retrieval —uses→ datastore  (x1)
- In-domain datastore —is a kind of→ datastore  (x1)
- 域自适应 —uses→ In-domain datastore  (x1)
- 域自适应 —uses→ nearest neighbor retrieval  (x1)
- kNN-LM —depends on→ datastore  (x1)
- kNN-LM —is evaluated by→ perplexity  (x1)
- kNN-LM —builds on→ Transformer  (x1)
- nearest neighbor retrieval —searches→ datastore  (x1)
- 域自适应 —uses→ datastore  (x1)
- Transformer —produces→ intermediate state  (x1)
- Transformer —contains→ position-wise feed-forward network  (x1)
- Transformer —contains→ self-attention  (x1)
- layer normalization —normalizes→ intermediate state  (x1)
- position-wise feed-forward network —takes as input→ intermediate state  (x1)
- self-attention —helps form→ intermediate state  (x1)
- WIKI-3B —performs poorly on→ BOOKS domain  (x1)
- kNN-LM —improves performance on→ BOOKS domain  (x1)
- kNN-LM —depends on→ nearest neighbor retrieval  (x1)
- kNN-LM —is controlled by→ interpolation parameter  (x1)
- nearest neighbor retrieval —retrieves from→ datastore  (x1)
- FAISS —uses→ quantized key  (x1)
- FAISS —implements→ nearest neighbor retrieval  (x1)
- squared L2 distance —is computed with→ full precision key  (x1)
- quantized key —is less precise than→ full precision key  (x1)
- kNN-LM —uses→ learned representation function  (x1)
- kNN-LM —uses→ explicit memory  (x1)
- Transformer language model —can exhibit→ implicit memorization  (x1)
- implicit memorization —can cause→ overfitting  (x1)
- Dropout —helps prevent→ overfitting  (x1)
- n-gram language model —is compared with→ Transformer language model  (x1)
- scaling laws for neural language models —describes→ cross entropy loss  (x1)
- scaling laws for neural language models —follows→ power law  (x1)
- scaling laws for neural language models —is only weakly affected by→ Model Dimension  (x1)
- scaling laws for neural language models —is only weakly affected by→ 层数  (x1)
- scaling laws for neural language models —governs→ overfitting  (x1)
- scaling laws for neural language models —governs→ training speed  (x1)
- scaling laws for neural language models —helps determine→ compute budget  (x1)
- overfitting —depends on→ model size  (x1)
- overfitting —depends on→ dataset size  (x1)
- training speed —depends on→ model size  (x1)
- compute-efficient training —operates under→ compute budget  (x1)
- compute-efficient training —seeks to maximize→ sample efficiency  (x1)
- compute-efficient training —stops before→ convergence  (x1)
- language modeling —is studied with→ Transformer  (x1)
- language modeling —is evaluated by→ negative log-likelihood  (x1)
- performance scaling —is described by→ power law  (x1)
- training time —shows→ power law  (x1)
- context length —shows→ power law  (x1)
- dataset size —shows→ power law  (x1)
- model size —shows→ power law  (x1)
- compute budget —shows→ power law  (x1)
- unsupervised learning —uses→ generative modeling  (x1)
- language modeling —enables→ unsupervised learning  (x1)
- neural models —are used for→ language modeling  (x1)
- scaling laws for neural language models —are characterized by→ power law  (x1)
- scaling laws for neural language models —depend on→ model size  (x1)
- scaling laws for neural language models —depend on→ dataset size  (x1)
- scaling laws for neural language models —depend on→ training compute  (x1)
- universality of overfitting —depends on→ model size  (x1)
- universality of overfitting —depends on→ dataset size  (x1)
- universality of training —follows→ power law  (x1)
- sample efficiency —improves with→ model size  (x1)
- sample efficiency —improves with→ dataset size  (x1)
- transfer performance —correlates with→ training compute  (x1)
- gradient noise scale —is used to determine→ optimal batch size  (x1)
- sample efficiency —contrasts with→ convergence inefficiency  (x1)
- scaling laws for neural language models —are modeled by→ power law  (x1)
- scaling laws for neural language models —predict→ test loss  (x1)
- left-to-right language modeling objective —is evaluated with→ test loss  (x1)
- Transformer —are used for→ left-to-right language modeling objective  (x1)
- test loss —depends on→ non-embedding parameters  (x1)
- test loss —depends on→ dataset size  (x1)
- test loss —depends on→ compute budget  (x1)
- early stopping —is used in→ compute-efficient training  (x1)
- compute-efficient training —depends on→ batch size  (x1)
- compute-efficient training —depends on→ model size  (x1)
- compute-efficient training —depends on→ dataset size  (x1)
- model size —affects→ test loss  (x1)
- training compute —can follow→ power law  (x1)
- batch size —affects the efficiency of using→ training compute  (x1)
- loss —can follow→ power law  (x1)
- scaling laws for neural language models —describe the behavior of→ early-stopped test loss  (x1)
- power law —is the mathematical form of→ scaling laws for neural language models  (x1)
- optimal batch size —determines the tradeoff for→ 分布式数据并行训练  (x1)
- optimal batch size —roughly obeys→ power law  (x1)
- learning curve —captures→ overfitting  (x1)
- compute budget —constrains→ batch size  (x1)
- compute budget —constrains→ training step  (x1)
- infinite data limit —is a regime for→ learning curve  (x1)
- scaling laws for neural language models —describes allocation of→ compute budget  (x1)
- optimal batch size —is a kind of→ batch size  (x1)
- minimum non-embedding compute —is a kind of→ non-embedding training compute  (x1)
- minimum number of training steps —is a kind of→ training step  (x1)
- optimal batch size —provides a compromise between time and compute efficiency for→ batch size  (x1)
- non-embedding training compute —is estimated from→ model parameters  (x1)
- non-embedding training compute —is estimated from→ batch size  (x1)
- non-embedding training compute —is estimated from→ training step  (x1)
- left-to-right language modeling objective —is equivalent to→ cross entropy loss  (x1)
- Transformer decoder —is a kind of→ Transformer  (x1)
- LSTM —is compared with→ Transformer  (x1)
- Universal Transformer —is a kind of→ Transformer  (x1)
- Transformer —uses→ residual stream  (x1)
- Transformer —includes→ attention head  (x1)
- Transformer —has→ Learned Embedding  (x1)
- Transformer —has→ learned positional embedding  (x1)
- forward pass —is performed on→ Transformer  (x1)
- Transformer —uses→ position-wise feed-forward network  (x1)
- Transformer —uses→ Learned Embedding  (x1)
- Transformer —uses→ de-embedding  (x1)
- linear warmup —is a kind of→ learning rate schedule  (x1)
- cosine decay —is a kind of→ learning rate schedule  (x1)
- WebText corpus —is built from→ Reddit outbound links  (x1)
- WebText corpus —is filtered by→ Reddit karma  (x1)
- Webtext2 training set —is filtered by→ Reddit karma  (x1)
- WebText corpus —uses text extracted with→ Newspaper3k  (x1)
- Webtext2 training set —uses text extracted with→ Newspaper3k  (x1)
- reversible tokenizer —is applied to→ WebText corpus  (x1)
- reversible tokenizer —is applied to→ Webtext2 training set  (x1)
- optimal batch size —is used in→ scaling laws for neural language models  (x1)
- BooksCorpus —is used in→ scaling laws for neural language models  (x1)
- Common Crawl —is used in→ scaling laws for neural language models  (x1)
- English Wikipedia —is used in→ scaling laws for neural language models  (x1)
- feed-forward ratio —is a measure of→ Transformer shape  (x1)
- attention head dimension —is a measure of→ Transformer shape  (x1)
- embedding parameters —is excluded from→ non-embedding parameters  (x1)
- 层数 —is adjusted with→ Model Dimension  (x1)
- Inner-Layer Dimension —is adjusted with→ Model Dimension  (x1)
- non-embedding parameters —is held fixed while varying→ 注意力头数  (x1)
- non-embedding parameters —is held fixed while varying→ 层数  (x1)
- non-embedding parameters —is held fixed while varying→ Inner-Layer Dimension  (x1)
- Transformer —is characterized by→ 层数  (x1)
- Transformer —is characterized by→ Model Dimension  (x1)
- Transformer —is characterized by→ 注意力头数  (x1)
- Transformer —is characterized by→ Inner-Layer Dimension  (x1)
- overfitting —is observed on→ Webtext2 training set  (x1)
- performance scaling —relates loss to→ non-embedding parameters  (x1)
- Transformer —outperforms→ 长短期记忆网络  (x1)
- Universal Transformer —is a variant of→ Transformer  (x1)
- Learned Embedding —is used in→ Transformer  (x1)
- Learned Embedding —is used in→ 长短期记忆网络  (x1)
- power law —describes scaling of→ Transformer  (x1)
- power law —describes scaling of→ 长短期记忆网络  (x1)
- training compute —includes→ non-embedding training compute  (x1)
- non-embedding training compute —includes→ forward pass  (x1)
- non-embedding training compute —includes→ backward pass  (x1)
- training compute —depends on→ batch size  (x1)
- training compute —depends on→ training step  (x1)
- Webtext2 training set —is compared with→ in-distribution validation loss  (x1)
- dataset size —is fit by→ power law  (x1)
- Retrieval-Augmented Language Model Pre-Training —augments with→ latent knowledge retriever  (x1)
- Retrieval-Augmented Language Model Pre-Training —uses as learning signal→ masked language model  (x1)
- latent knowledge retriever —retrieves from→ Wikipedia  (x1)
- masked language model —trains→ latent knowledge retriever  (x1)
- Retrieval-Augmented Language Model Pre-Training —retrieves from→ textual knowledge corpus  (x1)
- language modeling —backpropagates through→ latent knowledge retriever  (x1)
- latent knowledge retriever —retrieves from→ textual knowledge corpus  (x1)
- Retrieval-Augmented Language Model Pre-Training —captures→ world knowledge  (x1)
- language modeling —learns from→ world knowledge  (x1)
- Retrieval-Augmented Language Model Pre-Training —uses→ 检索器  (x1)
- Retrieval-Augmented Language Model Pre-Training —uses→ 文档检索  (x1)
- Retrieval-Augmented Language Model Pre-Training —is modeled as→ 潜变量语言模型  (x1)
- Retrieval-Augmented Language Model Pre-Training —optimizes→ 边缘似然  (x1)
- 检索器 —searches→ 大规模语料库  (x1)
- 文档检索 —may use→ 维基百科  (x1)
- 文档检索 —operates on→ 大规模语料库  (x1)
- 困惑度 —is influenced by→ 边缘似然  (x1)
- 最大内积搜索 —is used by→ 检索器  (x1)
- 检索器 —depends on→ 反向传播  (x1)
- 检索器 —uses→ 缓存  (x1)
- 检索器 —uses→ 异步更新  (x1)
- kNN-LM —uses→ 文档检索  (x1)
- kNN-LM —contains→ 离散检索步骤  (x1)
- kNN-LM —is compared with→ 语言模型预训练  (x1)
- Retrieval-Augmented Language Model Pre-Training —is fine-tuned for→ Open-domain Question Answering  (x1)
- Retrieval-Augmented Language Model Pre-Training —is evaluated on→ NATURALQUESTIONS-OPEN  (x1)
- Retrieval-Augmented Language Model Pre-Training —is evaluated on→ WEBQUESTIONS  (x1)
- Retrieval-Augmented Language Model Pre-Training —is evaluated on→ CURATEDTREC  (x1)
- 语言模型预训练 —includes→ masked language model  (x1)
- masked language model —was popularized by→ BERT  (x1)
- kNN-LM —contrasts with→ Retrieval-Augmented Language Model Pre-Training  (x1)
- T5 —is used for→ Open-domain Question Answering  (x1)
- masked language model —encodes→ world knowledge  (x1)
- masked language model —encodes→ syntactic information  (x1)
- masked language model —encodes→ semantic information  (x1)
- Open-domain Question Answering —requires→ world knowledge  (x1)
- reading comprehension —contrasts with→ Open-domain Question Answering  (x1)
- Retrieval-Augmented Language Model Pre-Training —is inspired by→ 检索式方法  (x1)
- Retrieval-Augmented Language Model Pre-Training —is formalized as→ 检索式方法  (x1)
- 检索式方法 —uses→ textual knowledge corpus  (x1)
- 编码器-解码器结构 —contrasts with→ 检索式方法  (x1)
- masked language model —is a task within→ 检索式方法  (x1)
- Retrieval-Augmented Language Model Pre-Training —uses→ knowledge-augmented encoder  (x1)
- latent knowledge retriever —is defined using→ dense inner product model  (x1)
- dense inner product model —depends on→ embedding function  (x1)
- embedding function —is implemented with→ BERT  (x1)
- BERT —uses→ wordpiece tokenization  (x1)
- [CLS] token —yields→ [CLS] representation  (x1)
- knowledge-augmented encoder —conditions on→ latent variable  (x1)
- textual knowledge corpus —is searched by→ latent knowledge retriever  (x1)
- [CLS] token —is used to form→ [CLS] representation  (x1)
- linear projection —is used in→ retriever  (x1)
- Transformer —is used in→ retriever  (x1)
- knowledge-augmented encoder —uses→ cross attention  (x1)
- knowledge-augmented encoder —is used for→ masked language model  (x1)
- Retrieval-Augmented Language Model Pre-Training —包含→ 检索器  (x1)
- Retrieval-Augmented Language Model Pre-Training —包含→ 知识增强编码器  (x1)
- Retrieval-Augmented Language Model Pre-Training —使用→ masked language model  (x1)
- 开放域问答微调 —依赖于→ 答案片段  (x1)
- 跨度集合 —包含匹配项→ 答案片段  (x1)
- knowledge-augmented encoder —is trained by maximizing→ log-likelihood  (x1)
- log-likelihood —is optimized using→ stochastic gradient descent  (x1)
- marginal probability —is approximated by summing over→ top k documents  (x1)
- 最大内积搜索 —is used to find top documents under→ relevance score  (x1)
- relevance score —depends on→ document embedding  (x1)
- search index —is constructed over→ document embedding  (x1)
- parameter staleness —affects→ search index  (x1)
- refresh —updates→ search index  (x1)
- 预训练 —uses→ log-likelihood  (x1)
- fine-tuning —uses→ log-likelihood  (x1)
- refresh —runs in parallel with→ primary trainer job  (x1)
- refresh —runs in parallel with→ secondary index builder job  (x1)
- secondary index builder job —performs→ re-embedding  (x1)
- secondary index builder job —performs→ refresh  (x1)
- MIPS index —is used to select→ top k documents  (x1)
- top k documents —is used to recompute→ posterior distribution p  (x1)
- top k documents —depend on→ re-embedding  (x1)
- Retrieval-Augmented Language Model Pre-Training —使用→ 异步 MIPS 刷新  (x1)
- 异步 MIPS 刷新 —重建→ 最大内积搜索索引  (x1)
- Retrieval-Augmented Language Model Pre-Training —更新→ Embedinput  (x1)
- Retrieval-Augmented Language Model Pre-Training —更新→ Embeddoc  (x1)
- Retrieval-Augmented Language Model Pre-Training —采用→ latent knowledge retriever  (x1)
- latent knowledge retriever —依赖→ 最大内积搜索索引  (x1)
- Retrieval-Augmented Language Model Pre-Training —使用→ 显著跨度掩蔽  (x1)
- Retrieval-Augmented Language Model Pre-Training —加入→ 空文档  (x1)
- Retrieval-Augmented Language Model Pre-Training —排除→ 平凡检索  (x1)
- 平凡检索 —会误导→ 检索器  (x1)
- cold-start problem —is avoided by→ inverse cloze task  (x1)
- inverse cloze task —is used to warm-start→ retriever  (x1)
- BERT 预训练 —is used to warm-start→ knowledge-augmented encoder  (x1)
- BERTBASE —is a result of→ BERT 预训练  (x1)
- retriever —can overemphasize→ exact string matching  (x1)
- NATURALQUESTIONS-OPEN —is derived from→ NaturalQuestions dataset  (x1)
- NATURALQUESTIONS-OPEN —filters by→ short answer type  (x1)
- WEBQUESTIONS —is collected from→ Google Suggest API  (x1)
- Open-domain Question Answering —retrieves from→ textual knowledge corpus  (x1)
- Open-domain Question Answering —is evaluated by→ exact match  (x1)
- Open-domain Question Answering —uses→ sparse bag-of-words matching  (x1)
- Open-domain Question Answering —uses→ entity linking  (x1)
- Open-domain Question Answering —uses→ re-ranking  (x1)
- Open-domain Question Answering —contrasted with→ Retrieval-Augmented Language Model Pre-Training  (x1)
- Open-domain Question Answering —contrasted with→ ORQA  (x1)
- Retrieval-Augmented Language Model Pre-Training —uses→ MIPS index  (x1)
- ORQA —uses→ MIPS index  (x1)
- Retrieval-Augmented Language Model Pre-Training —uses→ latent variable model  (x1)
- ORQA —uses→ latent variable model  (x1)
- Retrieval-Augmented Language Model Pre-Training —is trained by maximizing→ marginal probability  (x1)
- ORQA —is trained by maximizing→ marginal probability  (x1)
- Retrieval-Augmented Language Model Pre-Training —is initialized using→ inverse cloze task  (x1)
- ORQA —is initialized using→ inverse cloze task  (x1)
- Generation-based Open-QA —is modeled as→ sequence prediction task  (x1)
- Generation-based Open-QA —uses→ 编码器-解码器结构  (x1)
- GPT-2 —is explored for→ Generation-based Open-QA  (x1)
- GPT-2 —lacks→ fine-tuning  (x1)
- GPT-2 —can be used in→ 编码器-解码器结构  (x1)
- T5 —uses→ 编码器-解码器结构  (x1)
- fine-tuning —improves performance of→ T5  (x1)
- Open-domain Question Answering —uses→ English Wikipedia  (x1)
- English Wikipedia —is split into→ word-piece  (x1)
- Retrieval-Augmented Language Model Pre-Training —uses→ Dense retrieval  (x1)
- Retrieval-Augmented Language Model Pre-Training —uses→ Transformer  (x1)
- Retrieval-Augmented Language Model Pre-Training —uses→ Wikipedia  (x1)
- Retrieval-Augmented Language Model Pre-Training —uses→ CC-NEWS  (x1)
- WEBQUESTIONS —is a benchmark for→ Open-domain Question Answering  (x1)
- CURATEDTREC —is a benchmark for→ Open-domain Question Answering  (x1)
- BERT —is a kind of→ Transformer  (x1)
- T5 —is a kind of→ Transformer sequence-to-sequence model  (x1)
- DocReader —is used for→ Open-domain Question Answering  (x1)
- GraphRetriever —uses→ Transformer  (x1)
- PathRetriever —uses→ Transformer  (x1)
- ORQA —uses→ Transformer  (x1)
- inverse cloze task —is used for→ Dense retrieval  (x1)
- passage retrieval —is traditionally implemented with→ sparse bag-of-words matching  (x1)
- Dense retrieval —is built with→ dual-encoder framework  (x1)
- dual-encoder framework —produces→ Learned Embedding  (x1)
- Lucene-BM25 system —uses→ BM25  (x1)
- end-to-end question answering system —depends on→ passage retrieval  (x1)
- end-to-end question answering system —includes→ DocReader  (x1)
- DocReader —is a kind of→ reading comprehension model  (x1)
- reading comprehension model —is used in→ end-to-end question answering system  (x1)
- top-20 passage retrieval accuracy —measures→ passage retrieval  (x1)
- Open-domain Question Answering —combines with→ reading comprehension  (x1)
- passage retrieval —is often implemented using→ TF-IDF  (x1)
- passage retrieval —is often implemented using→ BM25  (x1)
- TF-IDF —uses→ inverted index  (x1)
- BM25 —uses→ inverted index  (x1)
- TF-IDF —is a kind of→ sparse vector  (x1)
- BM25 —is a kind of→ sparse vector  (x1)
- embedding function —produces→ dense representation  (x1)
- 最大内积搜索 —is used for searching over→ dense representation  (x1)
- inverse cloze task —pretrains→ question encoder  (x1)
- inverse cloze task —pretrains→ reading comprehension model  (x1)
- ORQA —uses→ inverse cloze task  (x1)
- ORQA —uses→ question encoder  (x1)
- ORQA —uses→ reading comprehension model  (x1)
- Dense retrieval —outperforms→ BM25  (x1)
- question encoder —pairs with→ reading comprehension model  (x1)
- Dense Passage Retriever —uses→ dual-encoder framework  (x1)
- Dense Passage Retriever —optimizes→ 内积  (x1)
- Dense Passage Retriever —is trained on→ 问题-段落对  (x1)
- ORQA —is used for→ Open-domain Question Answering  (x1)
- NaturalQuestions dataset —is used to evaluate→ Open-domain Question Answering  (x1)
- ORQA —is evaluated on→ NaturalQuestions dataset  (x1)
- extractive QA —is a setting within→ Open-domain Question Answering  (x1)
- top-k retrieval accuracy —is used to evaluate→ Dense Passage Retriever  (x1)
- Dense Passage Retriever —uses→ dense encoder  (x1)
- Dense Passage Retriever —builds→ search index  (x1)
- Dense Passage Retriever —embeds passages in→ dense representation  (x1)
- dense encoder —maps→ text passage  (x1)
- search index —stores representations of→ text passage  (x1)
- fixed-length passages —are contrasted with→ natural paragraphs  (x1)
- Dense Passage Retriever —uses→ 问题编码器  (x1)
- Dense Passage Retriever —uses→ 内积  (x1)
- 问题编码器 —produces vectors for→ 内积  (x1)
- 段落编码器 —produces vectors for→ 内积  (x1)
- 内积 —is used in→ 最大内积搜索  (x1)
- 余弦相似度 —is equivalent to→ 内积  (x1)
- 马氏距离 —is equivalent to→ L2 distance  (x1)
- BERT —can be used as→ 问题编码器  (x1)
- BERT —can be used as→ 段落编码器  (x1)
- [CLS] token —is used by→ BERT  (x1)
- FAISS —indexes→ 稠密向量  (x1)
- FAISS —supports→ 最大内积搜索  (x1)
- 编码器 —生成→ Learned Embedding  (x1)
- 内积 —用于→ 检索  (x1)
- 度量学习 —学习→ 向量空间  (x1)
- 正样本 —与…对比→ 负样本  (x1)
- cross entropy loss —提高概率分配给→ 正样本  (x1)
- BM25 —用于→ 检索  (x1)
- 金标准样本 —可作为→ 小批量  (x1)
- in-batch negatives —is used alongside→ BM25  (x1)
- in-batch negatives —is used for→ dual-encoder framework  (x1)
- full batch setting —provides→ in-batch negatives  (x1)
- training batch —provides→ in-batch negatives  (x1)
- DrQA —processes→ English Wikipedia dump  (x1)
- Wikipedia article —is split into→ text passage  (x1)
- NaturalQuestions dataset —uses answers from→ Wikipedia article  (x1)
- TriviaQA —is evaluated with→ text passage  (x1)
- CURATEDTREC —uses questions selected by→ Google Suggest API  (x1)
- text passage —is prepended with→ [SEP] token  (x1)
- WEBQUESTIONS —selected using→ Google Suggest API  (x1)
- CURATEDTREC —sourced from→ TREC QA tracks  (x1)
- TriviaQA —uses for retrieving positive passages→ BM25  (x1)
- Dense Passage Retriever —is evaluated alongside→ BM25  (x1)
- Dense Passage Retriever —is combined with→ BM25  (x1)
- Dense Passage Retriever —is trained with→ in-batch negatives  (x1)
- Dense Passage Retriever —uses→ question encoder  (x1)
- Adam optimizer —uses→ learning rate  (x1)
- warmup steps —schedules→ learning rate  (x1)
- Dropout —regularizes→ Dense Passage Retriever  (x1)
- top-20 passage retrieval accuracy —is a kind of→ top-k retrieval accuracy  (x1)
- Top-100 retrieval accuracy —is a kind of→ top-k retrieval accuracy  (x1)
- BM25+DPR —combines scores from→ BM25  (x1)
- BM25+DPR —combines scores from→ Dense Passage Retriever  (x1)
- linear combination —is used in→ BM25+DPR  (x1)
- Dense Passage Retriever —is evaluated on→ NaturalQuestions dataset  (x1)
- BM25 —is evaluated on→ NaturalQuestions dataset  (x1)
- Stanford Question Answering Dataset —has high→ lexical overlap  (x1)
- Stanford Question Answering Dataset —is collected from→ Wikipedia  (x1)
- Dense Passage Retriever —is trained on→ question–passage pairs  (x1)
- Dense Passage Retriever —is compared against→ BM25  (x1)
- Dense Passage Retriever —is evaluated by→ top-k retrieval accuracy  (x1)
- in-batch negatives —reuses as negatives→ gold negative passage  (x1)
- in-batch negatives —contrasts with→ 1-of-N training setting  (x1)
- in-batch negatives —depends on→ batch size  (x1)
- hard negative passage —is selected using→ BM25  (x1)
- hard negative passage —is added to→ in-batch negatives  (x1)
- BM25 negative passage —is used with→ in-batch negatives  (x1)
- gold passage —is used with→ in-batch negatives  (x1)
- gold passage —is evaluated by→ top-k retrieval accuracy  (x1)
- distantly-supervised passage —is an alternative to→ gold passage  (x1)
- dot product —is a kind of→ decomposable similarity function  (x1)
- 余弦相似度 —is a kind of→ decomposable similarity function  (x1)
- L2 distance —is a kind of→ decomposable similarity function  (x1)
- triplet loss —compares→ positive passage  (x1)
- triplet loss —compares→ negative passage  (x1)
- cross-dataset generalization —is evaluated in→ non-iid setting  (x1)
- Dense Passage Retriever —uses→ discriminative training  (x1)
- BM25 —is evaluated by→ top-20 passage retrieval accuracy  (x1)
- fine-tuning —affects→ cross-dataset generalization  (x1)
- explicit memory —is accessed through→ search index  (x1)
- search index —indexes→ Wikipedia  (x1)
- retriever —retrieves from→ search index  (x1)
- retrieval-augmented generation —is accessed with→ retriever  (x1)
- retrieval-augmented generation —uses as→ pre-trained seq2seq model  (x1)
- knowledge-intensive NLP task —includes→ Open-domain Question Answering  (x1)
- retrieve-and-extract architecture —is used for→ extractive QA  (x1)
- differentiable access mechanism —provides access to→ explicit memory  (x1)
- retrieval-augmented generation —is evaluated on→ knowledge-intensive NLP task  (x1)
- hybrid model —combines→ implicit memorization  (x1)
- hybrid model —combines→ explicit memory  (x1)
- explicit memory —is accessed by→ differentiable retriever  (x1)
- Retrieval-Augmented Language Model Pre-Training —combines→ masked language model  (x1)
- Retrieval-Augmented Language Model Pre-Training —uses→ differentiable retriever  (x1)
- ORQA —combines→ masked language model  (x1)
- ORQA —uses→ differentiable retriever  (x1)
- hallucination —can occur in→ 预训练神经语言模型  (x1)
- state-of-the-art parametric-only seq2seq baseline —uses→ implicit memorization  (x1)
- explicit memory —is implemented as→ search index  (x1)
- pre-trained neural retriever —accesses→ search index  (x1)
- Dense Passage Retriever —is a kind of→ pre-trained neural retriever  (x1)
- 最大内积搜索 —is used with→ search index  (x1)
- retrieval-augmented generation —marginalizes latent documents with→ top k documents  (x1)
- Dense Passage Retriever —accesses→ explicit memory  (x1)
- pre-trained seq2seq model —implements→ implicit memorization  (x1)
- memory network —uses→ explicit memory  (x1)
- stack-augmented network —uses→ explicit memory  (x1)
- memory layer —uses→ explicit memory  (x1)
- retrieval-augmented generation —uses→ retriever  (x1)
- retrieval-augmented generation —uses→ text generation model  (x1)
- retrieval-augmented generation —can replace→ explicit memory  (x1)
- RAG-Sequence Model —is a kind of→ retrieval-augmented generation  (x1)
- RAG-Token Model —is a kind of→ retrieval-augmented generation  (x1)
- RAG-Sequence Model —uses→ latent document variable  (x1)
- RAG-Token Model —uses→ latent document variable  (x1)
- RAG-Sequence Model —uses→ top k documents  (x1)
- RAG-Token Model —uses→ top k documents  (x1)
- RAG-Sequence Model —is equivalent to→ RAG-Token Model  (x1)
- Dense Passage Retriever —follows→ dual-encoder framework  (x1)
- Dense Passage Retriever —uses→ BERTBASE  (x1)
- Dense Passage Retriever —is retrieved by→ 最大内积搜索  (x1)
- Dense Passage Retriever —builds→ explicit memory  (x1)
- pre-trained seq2seq model —is a→ Transformer sequence-to-sequence model  (x1)
- pre-trained seq2seq model —was pre-trained with→ denoising objective  (x1)
- pre-trained seq2seq model —is referred to as→ implicit memorization  (x1)
- retriever —is jointly trained with→ text generation model  (x1)
- negative marginal log-likelihood —is minimized with→ Adam optimizer  (x1)
- document encoder —works with→ Embedinput  (x1)
- document encoder —is paired with→ pre-trained seq2seq model  (x1)
- RAG-Token Model —is decoded with→ beam search  (x1)
- RAG-Sequence Model —uses→ beam search  (x1)
- Thorough Decoding —builds on→ beam search  (x1)
- Fast Decoding —builds on→ beam search  (x1)
- RAG-Token Model —is a kind of→ sequence-to-sequence model  (x1)
- retrieval-augmented generation —uses as knowledge source→ Wikipedia dump  (x1)
- retrieval-augmented generation —combines with→ non-parametric knowledge source  (x1)
- retrieval-augmented generation —uses→ document encoder  (x1)
- document encoder —computes→ Learned Embedding  (x1)
- Learned Embedding —is stored in→ MIPS index  (x1)
- MIPS index —is built with→ FAISS  (x1)
- MIPS index —uses→ Hierarchical Navigable Small World approximation  (x1)
- Open-domain Question Answering —contrasts with→ extractive QA  (x1)
- Open-domain Question Answering —contrasts with→ Generation-based Open-QA  (x1)
- retrieval-augmented generation —is evaluated on→ Open-domain Question Answering  (x1)
- NaturalQuestions dataset —is a dataset for→ Open-domain Question Answering  (x1)
- TriviaQA —is a dataset for→ Open-domain Question Answering  (x1)
- WEBQUESTIONS —is a dataset for→ Open-domain Question Answering  (x1)
- CURATEDTREC —is a dataset for→ Open-domain Question Answering  (x1)
- abstractive question answering —can be addressed by→ retrieval-augmented generation  (x1)
- retrieval-augmented generation —combines retrieval with→ natural language generation  (x1)
- MSMARCO NLG task v2.1 —is used for→ abstractive question answering  (x1)
- MSMARCO NLG task v2.1 —is used for→ natural language generation  (x1)
- MSMARCO NLG task v2.1 —includes→ gold passage  (x1)
- gold passage —are retrieved from→ search engine  (x1)
- full sentence answer —is annotated from→ retrieved passages  (x1)
- TQA Wiki test set —is evaluated with→ exact match  (x1)
- train —support evaluation with→ exact match  (x1)
- retrieved passages —are returned by→ search engine  (x1)
- Jeopardy 问题生成 —使用→ Jeopardy 格式  (x1)
- Jeopardy 问题生成 —使用→ Q-BLEU-1  (x1)
- Jeopardy 问题生成 —与之比较→ pre-trained seq2seq model  (x1)
- Jeopardy 问题生成 —评估→ 事实性  (x1)
- Jeopardy 问题生成 —评估→ 特异性  (x1)
- retrieval-augmented generation —可用于回答其中的问题→ MSMARCO  (x1)
- retrieval-augmented generation —用于→ 开放域生成式问答  (x1)
- 事实验证 —classifies→ natural language claim  (x1)
- 事实验证 —requires→ Wikipedia evidence retrieval  (x1)
- 事实验证 —requires→ entailment reasoning  (x1)
- 事实验证 —uses→ supports  (x1)
- 事实验证 —also studied as→ supports  (x1)
- Wikipedia evidence retrieval —feeds into→ entailment reasoning  (x1)
- retrieval supervision —guides→ Wikipedia evidence retrieval  (x1)
- label accuracy —evaluates→ 事实验证  (x1)
- Dense Passage Retriever —uses→ retrieval supervision  (x1)
- retrieval supervision —uses→ NaturalQuestions dataset  (x1)
- retrieval supervision —uses→ TriviaQA  (x1)
- retrieval-augmented generation —is initialized using→ Dense Passage Retriever  (x1)
- BERT-based cross-encoder —is paired with→ extractive reader  (x1)
- retrieval-augmented generation —does not require→ BERT-based cross-encoder  (x1)
- retrieval-augmented generation —does not require→ extractive reader  (x1)
- retrieval-augmented generation —demonstrates→ state-of-the-art performance  (x1)
- RAG-Sequence Model —depends on→ 文档边缘化  (x1)
- RAG-Token Model —depends on→ 文档边缘化  (x1)
- 检索增强生成 —has variant→ RAG-Sequence Model  (x1)
- 检索增强生成 —has variant→ RAG-Token Model  (x1)
- 生成式问答 —can use→ 检索增强生成  (x1)
- 抽取式模型 —contrasts with→ 生成式问答  (x1)
- RAG-Token Model —outperforms→ RAG-Sequence Model  (x1)
- RAG-Sequence Model —outperforms→ pre-trained seq2seq model  (x1)
- RAG-Token Model —outperforms→ pre-trained seq2seq model  (x1)
- RAG-Token Model —is used for→ Jeopardy 问题生成  (x1)
- RAG-Sequence Model —is evaluated on→ MSMARCO NLG task v2.1  (x1)
- pre-trained seq2seq model —is evaluated on→ MSMARCO NLG task v2.1  (x1)
- pre-trained seq2seq model —is evaluated on→ Jeopardy 问题生成  (x1)
- RAG-Token Model —is evaluated by→ Q-BLEU-1  (x1)
- pre-trained seq2seq model —is evaluated by→ Q-BLEU-1  (x1)
- implicit memorization —works together with→ explicit memory  (x1)
- retrieval-augmented generation —uses→ implicit memorization  (x1)
- 事实验证 —is a task for→ retrieval-augmented generation  (x1)
- intermediate retrieval supervision —is not required by→ retrieval-augmented generation  (x1)
- RAG-Token Model —is a variant of→ retrieval-augmented generation  (x1)
- RAG-Sequence Model —is a variant of→ retrieval-augmented generation  (x1)
- The Sun Also Rises —is associated with→ Lost Generation  (x1)
- A Farewell to Arms —is associated with→ Lost Generation  (x1)
- GPT-3 —是一个→ 自回归语言模型  (x1)
- GPT-3 —用于→ 少样本学习  (x1)
- GPT-3 —不依赖→ 梯度更新  (x1)
- GPT-3 —通过实现→ 文本交互  (x1)
- 预训练 —通常与之结合→ 文本微调  (x1)
- 少样本学习 —依赖→ 文本交互  (x1)
- 机器翻译 —与之并列为→ 问答  (x1)
- Cloze task —与之并列为→ 问答  (x1)
- 临时推理 —与之并列为→ 域自适应  (x1)
- GPT-3 —performs well on→ Cloze task  (x1)
- GPT-3 —demonstrates→ few-shot learning  (x1)
- GPT-3 —can perform→ on-the-fly reasoning  (x1)
- GPT-3 —can perform→ 域自适应  (x1)
- GPT-3 —can perform→ unscrambling words  (x1)
- GPT-3 —can perform→ using a novel word in a sentence  (x1)
- GPT-3 —can perform→ 三位数算术  (x1)
- GPT-3 —is trained on→ large web corpora  (x1)
- GPT-3 —can generate→ news articles  (x1)
- human evaluators —judge→ news articles  (x1)
- Common Crawl filtering —is used for→ GPT-3  (x1)
- Test set contamination —is studied for→ GPT-3  (x1)
- Synthetic news articles —is generated by→ GPT-3  (x1)
- Task phrasing —affects→ GPT-3  (x1)
- 词向量 —是早期形式→ 预训练语言表示  (x1)
- 循环神经网络 —形成→ 隐藏状态  (x1)
- 预训练循环语言模型 —是基于→ 循环神经网络  (x1)
- 预训练 Transformer 语言模型 —通过→ 文本微调  (x1)
- 文本微调 —需要→ 任务特定数据集  (x1)
- 任务特定架构 —被替代为→ 文本微调  (x1)
- 预训练语言表示 —被用于→ 任务特定架构  (x1)
- 预训练加微调范式 —容易利用→ 虚假相关性  (x1)
- language model meta-learning —is a form of→ meta-learning  (x1)
- language model meta-learning —uses→ 预训练神经语言模型  (x1)
- language model meta-learning —is conditioned on→ natural language instruction  (x1)
- language model meta-learning —is compared with→ fine-tuning  (x1)
- Transformer language model —is a kind of→ 预训练神经语言模型  (x1)
- language model meta-learning —is a part of→ meta-learning  (x1)
- zero-shot transfer —is a form of→ language model meta-learning  (x1)
- one-shot learning —is a form of→ language model meta-learning  (x1)
- few-shot learning —is a form of→ language model meta-learning  (x1)
- language model meta-learning —uses→ demonstration  (x1)
- negative log-likelihood —measures performance of→ Transformer language model  (x1)
- GPT-3 —is a kind of→ 自回归语言模型  (x1)
- 少样本学习 —is a kind of→ language model meta-learning  (x1)
- 单样本学习 —is a kind of→ language model meta-learning  (x1)
- 零样本学习 —is a kind of→ language model meta-learning  (x1)
- 少样本学习 —depends on→ 上下文窗口  (x1)
- SuperGLUE —is a kind of→ NLP基准套件  (x1)
- CoQA —is a kind of→ NLP基准套件  (x1)
- GPT-3 —achieves results on→ CoQA  (x1)
- GPT-3 —achieves results on→ TriviaQA  (x1)
- GPT-3 —is evaluated in→ closed-book setting  (x1)
- GPT-3 —struggles on→ ANLI  (x1)
- GPT-3 —struggles on→ RACE  (x1)
- GPT-3 —struggles on→ QuAC  (x1)
- GPT-3 —can generate→ Synthetic news articles  (x1)
- one-shot learning —instantiates→ few-shot learning  (x1)
- zero-shot transfer —contrasts with→ few-shot learning  (x1)
- few-shot learning —can surpass→ state-of-the-art performance  (x1)
- fine-tuning based representation model —often holds→ state-of-the-art performance  (x1)
- CoQA —is different from→ Natural Language Inference  (x1)
- ANLI —is a benchmark for→ Natural Language Inference  (x1)
- Test set contamination —can occur in→ Common Crawl  (x1)
- language model meta-learning —underlies→ one-shot learning  (x1)
- language model meta-learning —underlies→ few-shot learning  (x1)
- zero-shot transfer —contrasts with→ meta-learning  (x1)
- one-shot learning —can reflect→ meta-learning  (x1)
- few-shot learning —can reflect→ meta-learning  (x1)
- fine-tuning —更新其权重→ 预训练模型  (x1)
- fine-tuning —在上训练→ 监督训练数据集  (x1)
- fine-tuning —可能导致较差的→ out-of-distribution generalization  (x1)
- fine-tuning —可能利用→ 虚假相关性  (x1)
- few-shot learning —是一种→ 条件化  (x1)
- few-shot learning —受其限制→ 上下文窗口  (x1)
- one-shot learning —is a special case of→ few-shot learning  (x1)
- one-shot learning —is distinguished from→ zero-shot transfer  (x1)
- few-shot learning —is constrained by→ 上下文窗口  (x1)
- 零样本学习 —只依赖→ natural language instruction  (x1)
- 单样本学习 —包含一个→ 示范  (x1)
- 少样本学习 —包含多个→ 示范  (x1)
- 文本微调 —不同于仅测试时执行→ forward pass  (x1)
- 少样本学习 —强调→ sample efficiency  (x1)
- 少样本学习 —权衡→ 性能  (x1)
- 少样本学习 —在上进行比较→ benchmark  (x1)
- one-shot evaluation —is contrasted with→ zero-shot transfer  (x1)
- GPT-3 —uses the same model and architecture as→ GPT-2  (x1)
- GPT-3 —uses attention patterns similar to→ Sparse Transformer  (x1)
- GPT-3 —uses→ restricted self-attention  (x1)
- GPT-3 —alternates with→ self-attention  (x1)
- GPT-2 —includes→ pre-normalization  (x1)
- GPT-2 —includes→ reversible tokenizer  (x1)
- Sparse Transformer —uses→ restricted self-attention  (x1)
- power law —describes validation loss behavior for→ GPT-3  (x1)
- GPT-3 —is evaluated by→ validation loss  (x1)
- validation loss —follows→ smooth power law  (x1)
- Common Crawl —is augmented by→ reference corpora  (x1)
- fuzzy deduplication —helps preserve→ held-out validation set  (x1)
- model parallelism —requires→ load balancing  (x1)
- 上下文窗口 —is a parameter of→ GPT-3  (x1)
- Approximate nearest neighbor Negative Contrastive Learning —selects→ hard negative passage  (x1)
- Dense retrieval —underperforms compared to→ sparse bag-of-words matching  (x1)
- bag-of-words —is used by→ BM25  (x1)
- BERT-based cascade IR pipeline —includes→ re-ranking  (x1)
- Dense retrieval —is intended to overcome limitations of→ sparse bag-of-words matching  (x1)
- Dense retrieval —matches texts in→ continuous representation space  (x1)
- Dense retrieval —is learned via→ deep neural networks  (x1)
- Dense retrieval —is supported by→ approximate nearest neighbor search  (x1)
- Dense retrieval —is intended to overcome→ vocabulary mismatch  (x1)
- contrastive learning —is used to select→ hard negative passage  (x1)
- re-ranking —comes after→ passage retrieval  (x1)
- Dense retrieval —is trained with→ in-batch negatives  (x1)
- Dense retrieval —can use→ Approximate nearest neighbor Negative Contrastive Learning  (x1)
- Approximate nearest neighbor Negative Contrastive Learning —is a→ contrastive learning  (x1)
- Approximate nearest neighbor Negative Contrastive Learning —is a variant of→ negative contrastive estimation  (x1)
- variance reduction framework —analyzes→ stochastic gradient variance  (x1)
- in-batch negatives —increases→ stochastic gradient variance  (x1)
- stochastic gradient variance —slows→ convergence  (x1)
- gradient norm —affects→ stochastic gradient variance  (x1)
- negative sampling —is used in→ Dense retrieval  (x1)
- query —is matched against→ relevant document  (x1)
- query —is contrasted with→ irrelevant document  (x1)
- Dense retrieval —operates in→ Learned embedding space  (x1)
- Dense retrieval —uses→ Similarity function  (x1)
- Dense retrieval —leverages→ approximate nearest neighbor search  (x1)
- retriever —produces representations in→ Learned embedding space  (x1)
- Similarity function —computes retrieval score for→ Dense retrieval  (x1)
- negative sampling —is used in→ Learning to rank  (x1)
- Binary cross entropy —can be used as→ negative sampling  (x1)
- Hinge loss —can be used as→ negative sampling  (x1)
- negative log-likelihood —can be used as→ negative sampling  (x1)
- dense retrieval training —uses→ negative sampling  (x1)
- dense retrieval training —is optimized with→ stochastic gradient descent  (x1)
- negative sampling —includes→ BM25 negative passage  (x1)
- negative sampling —includes→ in-batch negatives  (x1)
- BM25 negative passage —are sampled from→ BM25  (x1)
- convergence —is characterized by→ gradient norm  (x1)
- stochastic gradient descent —can use→ importance sampling  (x1)
- importance sampling —produces→ unbiased estimator  (x1)
- uninformative negatives —bound→ gradient norm  (x1)
- variance reduction —reduces the variance of→ Gradient estimator  (x1)
- importance sampling —is used for→ variance reduction  (x1)
- importance sampling —samples proportionally to→ Per-instance gradient norm  (x1)
- Jensen's inequality —is used to prove→ importance sampling  (x1)
- unbiased estimator —is a property of→ Gradient estimator  (x1)
- gradient norm —correlates with→ convergence  (x1)
- stochastic gradient variance —is analyzed using→ Jensen's inequality  (x1)
- Per-instance gradient norm —is bounded for→ multi-layer perceptron  (x1)
- ANCE asynchronous training —includes→ Trainer  (x1)
- ANCE asynchronous training —includes→ Inferencer  (x1)
- Trainer —uses→ approximate nearest neighbor index  (x1)
- Inferencer —uses→ checkpoint  (x1)
- Inferencer —refreshes→ approximate nearest neighbor index  (x1)
- retriever —depends on→ hard negative passage  (x1)
- in-batch negatives —is usually not→ hard negative passage  (x1)
- pairwise hinge loss —is used in training→ retriever  (x1)
- Binary cross entropy —is used in training→ retriever  (x1)
- 近似最近邻噪声对比估计 —uses→ approximate nearest neighbor index  (x1)
- 近似最近邻噪声对比估计 —selects→ 难负样本  (x1)
- 近似最近邻噪声对比估计 —is used for→ 密集检索  (x1)
- 难负样本 —is a kind of→ 负样本  (x1)
- dual-encoder framework —uses→ 内积  (x1)
- dual-encoder framework —uses→ cross entropy loss  (x1)
- 近似最近邻噪声对比估计 —can train→ dual-encoder framework  (x1)
- 近似最近邻噪声对比估计 —uses→ cross entropy loss  (x1)
- refresh —updates→ approximate nearest neighbor index  (x1)
- refresh —uses→ retriever  (x1)
- approximate nearest neighbor index —is used to select→ ANCE negatives  (x1)
- Inferencer —performs→ inference  (x1)
- Inferencer —performs→ refresh  (x1)
- Trainer —updates→ retriever  (x1)
- Trainer —uses→ checkpoint  (x1)
- TREC 2019 Deep Learning Track —is evaluated with→ top-20 passage retrieval accuracy  (x1)
- NaturalQuestions dataset —is evaluated with→ top-20 passage retrieval accuracy  (x1)
- TriviaQA —is evaluated with→ top-20 passage retrieval accuracy  (x1)
- top-20 passage retrieval accuracy —used to evaluate→ NaturalQuestions dataset  (x1)
- top-20 passage retrieval accuracy —used to evaluate→ TriviaQA  (x1)
- RAG-Token Model —is evaluated on→ NaturalQuestions dataset  (x1)
- DocReader —is evaluated on→ TriviaQA  (x1)
- RAG-Token Model —is run on top of→ ANCE  (x1)
- DocReader —is run on top of→ ANCE  (x1)
- Dense Passage Retriever —provides retrieved passages for→ DocReader  (x1)
- BM25 negative passage —uses results from→ BM25  (x1)
- BM25 + Rand Neg —combines→ BM25 negative passage  (x1)
- BM25 + Rand Neg —combines→ Rand Neg  (x1)
- 难负样本 —is an instance of→ negative contrastive estimation  (x1)
- BERT-Siamese —is trained with→ Rand Neg  (x1)
- BERT-Siamese —is trained with→ BM25 negative passage  (x1)
- BERT-Siamese —is trained with→ 难负样本  (x1)
- ANCE —can use→ BM25 Warm Up  (x1)
- BM25 Warm Up —depends on→ BM25  (x1)
- MARCO passage training labels —are used in→ BM25 Warm Up  (x1)
- BM25 Warm Up —uses→ BM25 negative passage  (x1)
- ANCE —is warmed up by→ BM25 negative passage  (x1)
- BERT-Siamese —uses→ FirstP  (x1)
- BERT-Siamese —uses→ MaxP  (x1)
- MaxP —uses→ max-pooling  (x1)
- approximate nearest neighbor search —uses→ Faiss IndexFlatIP  (x1)
- ANCE —is warmed up by→ DPR checkpoints  (x1)
- Dense Passage Retriever —is a kind of→ Dense retrieval  (x1)
- ANCE —is a kind of→ Dense retrieval  (x1)
- BERT-based cross-encoder —is evaluated in→ TREC 2019 Deep Learning Track  (x1)
- BM25 —is evaluated in→ TREC 2019 Deep Learning Track  (x1)
- DeepCT —is evaluated in→ TREC 2019 Deep Learning Track  (x1)
- Dense Passage Retriever —uses as a baseline→ BM25  (x1)
- Dense Passage Retriever —uses→ Rand Neg  (x1)
- Dense Passage Retriever —uses→ BM25 negative passage  (x1)
- ANCE —has variant→ FirstP  (x1)
- ANCE —has variant→ MaxP  (x1)
- TREC DL Passage —is part of→ TREC 2019 Deep Learning Track  (x1)
- TREC DL Document —is part of→ TREC 2019 Deep Learning Track  (x1)
- MS MARCO Dev —is used to evaluate→ Dense retrieval  (x1)
- NaturalQuestions dataset —is used to evaluate→ Dense Passage Retriever  (x1)
- TriviaQA —is used to evaluate→ Dense Passage Retriever  (x1)
- ANCE —outperforms→ Dense Passage Retriever  (x1)
- ANCE —outperforms→ BM25  (x1)
- ANCE —outperforms→ DeepCT  (x1)
- ANCE —is a training method for→ BERT-Siamese  (x1)
- ANCE —is a method for→ Dense retrieval  (x1)
- ANCE —elevates→ BERT-Siamese  (x1)
- ANCE —uses→ global negatives  (x1)
- ANCE —learns→ continuous representation space  (x1)
- BERT-Siamese —is an instance of→ Siamese network  (x1)
- BERT-Siamese —enables→ pre-computable document encoding  (x1)
- sparse methods —are used for→ document retrieval  (x1)
- Dense retrieval —is used for→ document retrieval  (x1)
- Dense retrieval —is used for→ passage retrieval  (x1)
- Dense Passage Retriever —is used for→ passage retrieval  (x1)
- reading comprehension model —is used in→ retrieval-augmented generation  (x1)
- retriever —benefits from→ global negatives  (x1)
- retriever —is evaluated against→ re-ranking  (x1)
- BERT-based cascade IR pipeline —includes→ BERT-based cross-encoder  (x1)
- BERT-based cross-encoder —models→ term-level interactions  (x1)
- term-level interactions —help capture→ search relevance  (x1)
- training batch —reduces→ online latency  (x1)
- refresh —helps mitigate→ online latency  (x1)
- ANCE —is used for→ Open-domain Question Answering  (x1)
- RAG-Token Model —is used for→ Open-domain Question Answering  (x1)
- RAG-Sequence Model —is used for→ Open-domain Question Answering  (x1)
- Retrieval-Augmented Language Model Pre-Training —is used for→ Open-domain Question Answering  (x1)
- T5-11B —is used for→ Open-domain Question Answering  (x1)
- re-ranking —follows→ BM25  (x1)
- Dense Passage Retriever —can be combined with→ BM25  (x1)
- RAG-Token Model —is a variant of→ RAG-Sequence Model  (x1)
- ANCE —replaces in retrieval→ Dense Passage Retriever  (x1)
- generative model —is used for→ Open-domain Question Answering  (x1)
- passage retrieval —provides evidence for→ generative model  (x1)
- text passage —is the target of→ passage retrieval  (x1)
- sequence-to-sequence model —can aggregate evidence from→ passage retrieval  (x1)
- TriviaQA —is a benchmark for→ Open-domain Question Answering  (x1)
- non-parametric knowledge source —augments→ generative model  (x1)
- Wikipedia —is a source of→ non-parametric knowledge source  (x1)
- large-scale language model —can store→ non-parametric knowledge source  (x1)
- Open-domain Question Answering —依赖→ 支持文档  (x1)
- Open-domain Question Answering —可以使用→ 抽取式模型  (x1)
- 抽取式模型 —基于→ 支持文档  (x1)
- 抽取式模型 —预测→ 答案片段  (x1)
- 支持性段落 —属于→ 支持文档  (x1)
- TF-IDF —用于检索→ 支持文档  (x1)
- 稠密嵌入 —用于检索→ 支持文档  (x1)
- ELMo —用于表示→ 抽取式模型  (x1)
- BERT —用于表示→ 抽取式模型  (x1)
- 多段落证据聚合 —弥补限制→ 抽取式模型  (x1)
- 生成式编码器-解码器模型 —条件生成→ 支持性段落  (x1)
- Fusion-in-Decoder method —depends on→ passage retrieval  (x1)
- Fusion-in-Decoder method —is used for→ Open-domain Question Answering  (x1)
- passage retrieval —returns→ 支持文档  (x1)
- TF-IDF —is a type of→ sparse vector  (x1)
- sparse vector —is often built with→ TF-IDF  (x1)
- TF-IDF —is used to retrieve→ 支持文档  (x1)
- paragraph reranking —can be based on→ BiLSTM  (x1)
- reinforcement learning —can be used for→ paragraph reranking  (x1)
- Wikipedia graph —can support→ Open-domain Question Answering  (x1)
- Wikidata graph —can support→ Open-domain Question Answering  (x1)
- dense representation —is used with→ approximate nearest neighbor search  (x1)
- weak supervision —can use→ question-answer pair  (x1)
- Cloze task —can pretrain→ dense representation  (x1)
- abstractive question answering —is used for→ NarrativeQA  (x1)
- abstractive question answering —is used for→ CoQA  (x1)
- abstractive question answering —is used for→ ELI5  (x1)
- abstractive model —is used in→ abstractive question answering  (x1)
- reading comprehension —is evaluated with→ Stanford Question Answering Dataset  (x1)
- large pretrained generative model —can be used for→ Open-domain Question Answering  (x1)
- retrieval-augmented generation —conditions on→ retrieved passages  (x1)
- retrieved passages —is processed by→ sequence-to-sequence model  (x1)
- generative model —processes→ retrieved passages  (x1)
- BM25 —depends on→ Term frequency  (x1)
- BM25 —depends on→ Inverse document frequency  (x1)
- BM25 —is used for→ retrieved passages  (x1)
- Dense Passage Retriever —is used for→ retrieved passages  (x1)
- ORQA —depends on→ retrieved passages  (x1)
- Fusion-in-Decoder method —depends on→ retrieved passages  (x1)
- BM25 —uses→ Inverse document frequency  (x1)
- Apache Lucene —implements→ BM25  (x1)
- SpaCy —can tokenize for→ bag-of-words  (x1)
- Dense Passage Retriever —uses→ dot product  (x1)
- Dense Passage Retriever —uses→ approximate nearest neighbor search  (x1)
- approximate nearest neighbor search —is implemented by→ FAISS  (x1)
- sequence-to-sequence model —has component→ encoder  (x1)
- sequence-to-sequence model —has component→ decoder  (x1)
- T5 —is a kind of→ sequence-to-sequence model  (x1)
- Fusion-in-Decoder method —is a kind of→ sequence-to-sequence model  (x1)
- Fusion-in-Decoder method —uses→ encoder  (x1)
- Fusion-in-Decoder method —uses→ decoder  (x1)
- Fusion-in-Decoder method —uses→ self-attention  (x1)
- Fusion-in-Decoder method —performs→ 多段落证据聚合  (x1)
- NaturalQuestions dataset —is used to evaluate→ Fusion-in-Decoder method  (x1)
- TriviaQA —is used to evaluate→ Fusion-in-Decoder method  (x1)
- exact match —uses→ normalization  (x1)
- T5 —is fine-tuned with→ Adam optimizer  (x1)
- T5 —uses→ Dropout  (x1)
- Fusion-in-Decoder method —uses→ Dense Passage Retriever  (x1)
- Fusion-in-Decoder method —uses→ BM25  (x1)
- Fusion-in-Decoder method —uses→ greedy decoding  (x1)
- Fusion-in-Decoder method —is evaluated by→ exact match  (x1)
- Dense Passage Retriever —is used for→ NaturalQuestions dataset  (x1)
- Dense Passage Retriever —is used for→ TriviaQA  (x1)
- BM25 —is used for→ Stanford Question Answering Dataset  (x1)
- closed book T5 —contrasts with→ text-based explicit memories  (x1)
- BM25 —is used to retrieve from→ Wikipedia  (x1)
- text-based explicit memories —is used for→ knowledge retrieval task  (x1)
- sequence-to-sequence model —processes→ retrieved passages  (x1)
- extractive reader —processes→ retrieved passages  (x1)
- exact match —is used to evaluate→ NaturalQuestions dataset  (x1)
- exact match —is used to evaluate→ TriviaQA  (x1)
- Open-domain Question Answering —uses→ generative model  (x1)
- retrieved passages —is obtained by→ passage retrieval  (x1)
- generative model —conditions on→ retrieved passages  (x1)
- end-to-end learning —integrates→ passage retrieval  (x1)
- end-to-end learning —optimizes jointly→ generative model  (x1)
- latent retrieval —is used in→ Open-domain Question Answering  (x1)
- paragraph reranking —is used in→ Open-domain Question Answering  (x1)
- pre-trained seq2seq model —is used for→ Open-domain Question Answering  (x1)
- hard expectation-maximization —is used for→ weakly supervised question answering  (x1)
- knowledge-guided text retrieval and reading —is used for→ Open-domain Question Answering  (x1)
- AmbigQA —is a dataset for→ Open-domain Question Answering  (x1)
- contextual word embeddings —is related to→ language model meta-learning  (x1)
- language models as knowledge bases —is related to→ language model meta-learning  (x1)
- Text-to-Text Transfer Transformer —is related to→ language model meta-learning  (x1)
- R3 —builds on→ Okapi  (x1)
- Multi-Passage BERT —is used with→ 多段落证据聚合  (x1)
- Multi-Passage BERT —is a kind of→ globally normalized BERT model  (x1)
- Low-Rank Adaptation —冻结→ 预训练模型权重  (x1)
- Low-Rank Adaptation —注入→ 低秩分解矩阵  (x1)
- Low-Rank Adaptation —应用于→ Transformer  (x1)
- 秩亏性 —解释→ Low-Rank Adaptation  (x1)
- 适配器 —与之比较→ Low-Rank Adaptation  (x1)
- fine-tuning —adapts→ 预训练神经语言模型  (x1)
- fine-tuning —updates all parameters of→ 预训练神经语言模型  (x1)
- external modules —are attached to→ 预训练神经语言模型  (x1)
- task-specific parameters —are stored with→ 预训练神经语言模型  (x1)
- Low-Rank Adaptation —is based on→ 低内在秩  (x1)
- Low-Rank Adaptation —adapts→ 密集层  (x1)
- Low-Rank Adaptation —可以与……结合→ 前缀调优  (x1)
- Natural language to SQL —takes as input→ natural language query  (x1)
- Natural language to SQL —produces→ SQL command  (x1)
- context-target pair —can contain→ natural language query  (x1)
- context-target pair —can contain→ SQL command  (x1)
- context-target pair —can contain→ article summary  (x1)
- full fine-tuning —starts from→ 预训练模型权重  (x1)
- full fine-tuning —optimizes→ conditional language modeling objective  (x1)
- parameter-efficient adaptation —learns→ task-specific parameter increment  (x1)
- task-specific parameter increment —can be encoded by→ 低秩分解矩阵  (x1)
- adapter layer —is used for→ parameter-efficient adaptation  (x1)
- adapter layer —is inserted into→ Transformer 块  (x1)
- adapter layer —may include→ layer normalization  (x1)
- adapter layer —uses→ Bottleneck dimension  (x1)
- model parallelism —depends on→ AllReduce  (x1)
- model parallelism —depends on→ Broadcast  (x1)
- Online inference —is affected by→ adapter layer  (x1)
- Prompt optimization —optimizes→ Prompt  (x1)
- adapter layer —requires→ AllReduce  (x1)
- adapter layer —requires→ Broadcast  (x1)
- 前缀调优 —is compared with→ adapter layer  (x1)
- Low-Rank Adaptation —uses→ low-rank update  (x1)
- Low-Rank Adaptation —implements→ 低秩分解矩阵  (x1)
- low-rank update —modifies→ weight matrix  (x1)
- 低秩分解矩阵 —represents→ weight matrix  (x1)
- adapter layer —increases→ inference latency  (x1)
- dense layer —contains→ weight matrix  (x1)
- 预训练模型权重 —is a kind of→ weight matrix  (x1)
- intrinsic dimension —motivates→ low-rank update  (x1)
- intrinsic rank —motivates→ 低秩分解矩阵  (x1)
- Transformer language model —contains→ dense layer  (x1)
- Low-Rank Adaptation —freezes→ 预训练模型权重  (x1)
- Low-Rank Adaptation —generalizes→ 全量微调  (x1)
- Low-Rank Adaptation —contrasts with→ 适配器  (x1)
- Low-Rank Adaptation —contrasts with→ 前缀调优  (x1)
- Adam optimizer —interacts with→ 高斯初始化  (x1)
- Low-Rank Adaptation —uses→ 零初始化  (x1)
- Low-Rank Adaptation —avoids→ 推理延迟  (x1)
- Low-Rank Adaptation —enables→ 权重合并  (x1)
- Low-Rank Adaptation —is applied to→ Transformer  (x1)
- Adam optimizer —is used to train→ Transformer  (x1)
- Low-Rank Adaptation —is applied to→ GPT-3  (x1)
- layer normalization —is used in→ Transformer  (x1)
- Low-Rank Adaptation —is compared with→ full fine-tuning  (x1)
- Low-Rank Adaptation —is evaluated on→ GLUE  (x1)
- Low-Rank Adaptation —is evaluated on→ WikiSQL  (x1)
- Low-Rank Adaptation —is evaluated on→ SAMSum  (x1)
- Low-Rank Adaptation —is evaluated on→ RoBERTa  (x1)
- Low-Rank Adaptation —is evaluated on→ DeBERTa  (x1)
- Low-Rank Adaptation —is evaluated on→ GPT-2  (x1)
- Low-Rank Adaptation —is evaluated on→ GPT-3  (x1)
- full fine-tuning —is applied to→ GPT-3  (x1)
- FTTop2 —is a variant of→ fine-tuning  (x1)
- Low-Rank Adaptation —can use→ model parallelism  (x1)
- RoBERTa-base —is a smaller version of→ RoBERTa-large  (x1)
- BitFit —is a parameter-efficient alternative to→ fine-tuning  (x1)
- Low-Rank Adaptation —is a parameter-efficient alternative to→ fine-tuning  (x1)
- RoBERTa-large —is adapted with→ AdptD  (x1)
- RoBERTa-large —is adapted with→ AdptH  (x1)
- RoBERTa-large —is adapted with→ Low-Rank Adaptation  (x1)
- DeBXXL —is adapted with→ full fine-tuning  (x1)
- DeBXXL —is adapted with→ Low-Rank Adaptation  (x1)
- Prefix-layer tuning —is an extension of→ Prefix-embedding tuning  (x1)
- Prefixing —is a variant of→ Prefix-embedding tuning  (x1)
- Infixing —is a variant of→ Prefix-embedding tuning  (x1)
- Prefix-layer tuning —learns activations after each→ Transformer 块  (x1)
- Prefix-embedding tuning —learns→ word embeddings  (x1)
- Prefix-layer tuning —learns→ Activation  (x1)
- AdapterH —uses→ adapter layer  (x1)
- AdapterDrop —uses→ adapter layer  (x1)
- Low-Rank Adaptation —does not modify→ layer normalization  (x1)
- TruthfulQA —measures→ language model truthfulness  (x1)
- hallucination —undermines→ language model truthfulness  (x1)
- language model truthfulness —avoids→ false statement  (x1)
- training distribution —can incentivize→ imitative falsehood  (x1)
- training objective —can incentivize→ imitative falsehood  (x1)
- imitative falsehood —is a kind of→ false statement  (x1)
- deceptive model —can generate→ false statement  (x1)
- hallucination —is a kind of→ false statement  (x1)
- TruthfulQA —is designed to cause→ imitative falsehood  (x1)
- TruthfulQA —tests for→ imitative falsehood  (x1)
- inverse scaling —describes→ imitative falsehood  (x1)
- scaling laws for neural language models —help explain→ inverse scaling  (x1)
- scaling laws for neural language models —predict effects on→ perplexity  (x1)
- imitative falsehood —exemplify→ inverse scaling  (x1)
- TruthfulQA —evaluates in→ zero-shot transfer  (x1)
- false and informative answers —are a form of→ imitative falsehood  (x1)
- inverse scaling —is observed on→ TruthfulQA  (x1)
- control trivia questions —is contrasted with→ TruthfulQA  (x1)
- inverse scaling —contrasts with→ training distribution  (x1)
- automated metric —is calibrated on→ training distribution  (x1)
- TruthfulQA —aims to measure→ 真实性目标  (x1)
- TruthfulQA —is intended for→ 零样本学习  (x1)
- 真实性 —is contrasted with→ 信息性  (x1)
- TruthfulQA —is intended for→ zero-shot transfer  (x1)
- TruthfulQA —was constructed using→ adversarial procedure  (x1)
- filtered questions —were tested on→ GPT-3  (x1)
- imitative falsehood —are likely on→ training distribution  (x1)
- TruthfulQA —uses→ adversarial procedure  (x1)
- adversarial procedure —produces→ adversarial questions  (x1)
- filtered questions —are tested on→ target model  (x1)
- unfiltered questions —are not tested on→ target model  (x1)
- TruthfulQA —is assessed by→ external validation  (x1)
- GPT-Neo —is a variant of→ GPT-3  (x1)
- GPT-2 —is trained on→ WebText corpus  (x1)
- UnifiedQA —is based on→ T5  (x1)
- GPT-3 —is trained on→ Common Crawl  (x1)
- GPT-J —is evaluated on→ TruthfulQA  (x1)
- 真零样本设置 —是用于→ 零样本学习  (x1)
- 真零样本设置 —遵循定义→ 真少样本学习  (x1)
- QA prompt —取自→ OpenAI API  (x1)
- Helpful prompt —用于评估→ TruthfulQA  (x1)
- Harmful prompt —用于评估→ TruthfulQA  (x1)
- greedy decoding —是用于→ natural language generation  (x1)
- greedy decoding —uses→ temperature  (x1)
- multiple-choice task —uses→ reference answers  (x1)
- TruthfulQA —is not designed for→ few-shot benchmark  (x1)
- GPT-judge —is used to classify answers in→ TruthfulQA  (x1)
- 真实性 —is evaluated on→ TruthfulQA  (x1)
- 信息性 —is evaluated on→ TruthfulQA  (x1)
- imitative falsehood —is produced as a result of→ imitative weakness  (x1)
- non-imitative falsehood —is produced as a result of→ non-imitative weakness  (x1)
- weakness —includes→ imitative weakness  (x1)
- weakness —includes→ non-imitative weakness  (x1)
- GPT-Neo —shows→ inverse scaling  (x1)
- GPT-3 —shows→ inverse scaling  (x1)
- adversarial procedure —affects→ inverse scaling  (x1)
- GPT-Neo —shows a similar inverse scaling trend to→ GPT-3  (x1)
- imitative falsehood —can be produced by→ GPT-3  (x1)
- control trivia questions —are created by editing questions from→ TruthfulQA  (x1)
- paraphrase —is used to restate questions from→ TruthfulQA  (x1)
- Truthfulness score —is measured on→ control trivia questions  (x1)
- Truthfulness score —is measured on→ paraphrase  (x1)
- inverse scaling —appears in→ Truthfulness score  (x1)
- non-imitative weakness —may be exploited by→ control trivia questions  (x1)
- semantic weakness —is a kind of→ non-imitative weakness  (x1)
- chain-of-thought prompting —is a kind of→ prompting  (x1)
- chain-of-thought prompting —improves reasoning in→ large-scale language model  (x1)
- standard prompting —is a kind of→ prompting  (x1)
- GSM8K —consists of→ math word problems  (x1)
- PaLM —is a kind of→ large-scale language model  (x1)
- chain-of-thought prompting —improves performance on→ arithmetic reasoning  (x1)
- chain-of-thought prompting —improves performance on→ commonsense reasoning  (x1)
- chain-of-thought prompting —improves performance on→ symbolic reasoning  (x1)
- chain-of-thought prompting —enables→ chain of thought  (x1)
- chain-of-thought prompting —uses→ natural language rationale  (x1)
- few-shot learning —is a form of→ prompting  (x1)
- neuro-symbolic methods —uses→ formal language  (x1)
- chain-of-thought prompting —improves→ arithmetic reasoning  (x1)
- GSM8K —evaluates→ arithmetic reasoning  (x1)
- prompting —is used with→ large-scale language model  (x1)
- chain-of-thought prompting —is a kind of→ few-shot learning  (x1)
- chain-of-thought prompting —is used to elicit→ chain of thought  (x1)
- chain-of-thought prompting —is used in→ few-shot learning  (x1)
- chain-of-thought prompting —elicits→ chain of thought  (x1)
- chain of thought —contains→ intermediate steps  (x1)
- chain of thought —resembles→ solution  (x1)
- chain-of-thought prompting —is used for→ arithmetic reasoning  (x1)
- chain-of-thought prompting —is used for→ commonsense reasoning  (x1)
- chain-of-thought prompting —is used for→ symbolic reasoning  (x1)
- math word problems —measures→ arithmetic reasoning  (x1)
- chain of thought —provides opportunities for→ debugging  (x1)
- language models —can use→ chain-of-thought prompting  (x1)
- chain-of-thought prompting —is an augmentation of→ few-shot learning  (x1)
- few-shot learning —uses→ demonstration  (x1)
- chain-of-thought prompting —adds→ chain of thought  (x1)
- chain-of-thought prompting —is a form of→ prompting  (x1)
- screen pass —is used in→ NFC Championship Game  (x1)
- chain of thought —is used for→ math word problems  (x1)
- chain of thought —is used for→ CSQA  (x1)
- chain of thought —is used for→ StrategyQA  (x1)
- chain of thought —is used for→ Date Understanding  (x1)
- chain of thought —is used for→ Sports Understanding  (x1)
- chain of thought —is used for→ Last Letter Concatenation  (x1)
- chain of thought —is used for→ Coin Flip  (x1)
- chain of thought —is used for→ AQuA dataset  (x1)
- SayCan —combines→ language models  (x1)
- GPT-3 —is a kind of→ language models  (x1)
- chain-of-thought prompting —depends on→ model size  (x1)
- chain-of-thought prompting —is evaluated with→ greedy decoding  (x1)
- majority final answer —improves→ chain-of-thought prompting  (x1)
- greedy decoding —is used with→ GPT-3  (x1)
- greedy decoding —is used with→ LaMDA  (x1)
- greedy decoding —is used with→ PaLM  (x1)
- greedy decoding —is used with→ UL2  (x1)
- greedy decoding —is used with→ Codex  (x1)
- emergent ability —depends on→ model size  (x1)
- chain-of-thought prompting —is used by→ large-scale language model  (x1)
- chain-of-thought prompting —improves performance on→ SVAMP dataset  (x1)
- chain-of-thought prompting —improves performance on→ MAWPS benchmark  (x1)
- chain of thought —emerges with→ model size  (x1)
- standard prompting —is compared with→ state-of-the-art performance  (x1)
- chain-of-thought prompting —compares favorably to→ state-of-the-art performance  (x1)
- equation-only prompting —is a variation of→ chain-of-thought prompting  (x1)
- equation-only prompting —does not help much on→ GSM8K  (x1)
- equation-only prompting —improves performance on→ one-step problem  (x1)
- equation-only prompting —improves performance on→ two-step problem  (x1)
- ablation study —tests variations of→ chain-of-thought prompting  (x1)
- chain-of-thought prompting —is contrasted with→ variable computation  (x1)
- chain-of-thought prompting —uses→ intermediate tokens  (x1)
- chain-of-thought prompting —expresses reasoning in→ natural language  (x1)
- chain-of-thought prompting —embodies→ chain of thought  (x1)
- chain-of-thought prompting —is evaluated on→ GSM8K  (x1)
- chain-of-thought prompting —is evaluated on→ MAWPS benchmark  (x1)
- PaLM 540B —is evaluated on→ GSM8K  (x1)
- demonstration —can vary by→ annotator  (x1)
- chain-of-thought prompting —is a kind of→ exemplar-based prompting  (x1)
- chain-of-thought prompting —outperforms→ standard prompting  (x1)
- chain-of-thought prompting —uses→ demonstration  (x1)
- exemplar-based prompting —uses→ demonstration  (x1)
- LaMDA 137B —is evaluated on→ MAWPS benchmark  (x1)
- standard prompting —is evaluated on→ SST-2  (x1)
- InstructGPT —uses→ fine-tuning with human feedback  (x1)
- language modeling —can lead to→ unintended behaviors  (x1)
- unintended behaviors —includes→ biased text  (x1)
- unintended behaviors —includes→ toxic text  (x1)
- unintended behaviors —fails to follow→ user instructions  (x1)
- 有帮助、诚实且无害 —is a criterion for→ 语言模型对齐  (x1)
- fine-tuning with human feedback —is used to fine-tune→ GPT-3  (x1)
- reward model —is used as reward function in→ Proximal Policy Optimization  (x1)
- Proximal Policy Optimization —fine-tunes→ supervised learning baseline  (x1)
- fine-tuning with human feedback —produces→ InstructGPT  (x1)
- GPT-3 —is fine-tuned into→ InstructGPT  (x1)
- fine-tuning —is used in training→ InstructGPT  (x1)
- reward model —is used in training→ InstructGPT  (x1)
- Proximal Policy Optimization —is used in training→ InstructGPT  (x1)
- GPT-3 architecture —is the architecture of→ InstructGPT  (x1)
- few-shot prompt —is applied to→ GPT-3 architecture  (x1)
- TruthfulQA —is used to evaluate→ InstructGPT  (x1)
- hallucination rate —is measured in→ closed-domain question answering  (x1)
- labelers —provide judgments for training→ reward model  (x1)
- human data —is used for→ fine-tuning  (x1)
- instruction following —is improved by→ InstructGPT  (x1)
- fine-tuning with human feedback —includes→ reward model  (x1)
- fine-tuning with human feedback —includes→ Proximal Policy Optimization  (x1)
- InstructGPT —is compared to→ GPT-3  (x1)
- InstructGPT —has lower→ hallucination rate  (x1)
- InstructGPT —has lower→ toxicity  (x1)
- RealToxicityPrompts —is used to measure→ toxicity  (x1)
- fine-tuning with human feedback —can cause→ performance regression  (x1)
- performance regression —occurs on→ public NLP dataset  (x1)
- alignment tax —is an example of→ performance regression  (x1)
- PPO-ptx —增加对数似然以靠近→ 预训练分布  (x1)
- PPO-ptx —不降低→ 标签器偏好分数  (x1)
- InstructGPT —泛化到→ 留出标签器  (x1)
- InstructGPT —表现出→ instruction following  (x1)
- FLAN —用于训练→ instruction following  (x1)
- 监督微调基线 —作为比较基线→ InstructGPT  (x1)
- GPT-3 —作为比较对象→ InstructGPT  (x1)
- 代码总结 —属于→ instruction following  (x1)
- 代码问答 —属于→ instruction following  (x1)
- fine-tuning with human feedback —uses→ human preferences  (x1)
- fine-tuning with human feedback —is used for→ alignment  (x1)
- instruction following —depends on→ generalization  (x1)
- InstructGPT —improves→ instruction following  (x1)
- InstructGPT —improves→ safety and reliability  (x1)
- simple mistakes —are made by→ InstructGPT  (x1)
- false premises —interferes with→ instruction following  (x1)
- reward model —用于→ 强化学习  (x1)
- reward model —应用于→ 对话  (x1)
- reward model —应用于→ 机器翻译  (x1)
- reward model —应用于→ 语义解析  (x1)
- reward model —应用于→ 故事生成  (x1)
- reward model —应用于→ 评论生成  (x1)
- reward model —应用于→ 证据抽取  (x1)
- 书面人类反馈 —用于改进→ GPT-3  (x1)
- 文本环境 —用于→ 强化学习  (x1)
- 强化学习 —用于→ 智能体对齐  (x1)
- normative prior —supports→ 语言模型对齐  (x1)
- language assistants —is a testbed for→ 语言模型对齐  (x1)
- instruction following —is related to→ cross-task generalization  (x1)
- cross-task generalization —is evaluated on→ held-out tasks  (x1)
- cross-task generalization —is evaluated in→ zero-shot transfer  (x1)
- cross-task generalization —is evaluated in→ few-shot learning  (x1)
- instruction following for navigation —takes place in→ simulated environment  (x1)
- harms of language models —includes→ biased text  (x1)
- harms of language models —includes→ toxic text  (x1)
- 语言模型对齐 —seeks to prevent→ gaming misspecified objectives  (x1)
- language models —can produce→ biased text  (x1)
- language models —can cause→ private data leakage  (x1)
- language models —can generate→ false statement  (x1)
- language models —is used in→ dialog system  (x1)
- language models —is evaluated with→ benchmark  (x1)
- benchmark —measures→ toxicity  (x1)
- benchmark —measures→ stereotype  (x1)
- benchmark —measures→ social bias  (x1)
- fine-tuning —uses→ value-targeted dataset  (x1)
- trigger phrase —is scored by→ conditional likelihood  (x1)
- trigger phrase —is used to filter→ pretraining data  (x1)
- pretraining data —is used to train→ language models  (x1)
- language models —is used for→ 问答  (x1)
- null space projection —can be used for→ language model steering  (x1)
- causal mediation analysis —can be used for→ language model steering  (x1)
- safety-specific control token —can be used for→ language model steering  (x1)
- 预训练神经语言模型 —is fine-tuned into→ supervised learning baseline  (x1)
- reward model —provides reward for→ Proximal Policy Optimization  (x1)
- reward model —is optimized against using→ Proximal Policy Optimization  (x1)
- human-labeled comparisons —is filtered for→ personally identifiable information  (x1)
- Plain prompt —is used to train→ InstructGPT  (x1)
- few-shot prompt —is used to train→ InstructGPT  (x1)
- User-based prompt —is used to train→ InstructGPT  (x1)
- SFT dataset —is used for→ fine-tuning  (x1)
- RM dataset —is used for→ reward model  (x1)
- PPO dataset —is used for→ fine-tuning with human feedback  (x1)
- reward model —is used in→ fine-tuning with human feedback  (x1)
- Proximal Policy Optimization —is used in→ fine-tuning with human feedback  (x1)
- fine-tuning —is used to train→ InstructGPT  (x1)
- fine-tuning with human feedback —is used to train→ InstructGPT  (x1)
- demonstration —can serve as an alternative to→ natural language instruction  (x1)
- implicit continuation —can serve as an alternative to→ natural language instruction  (x1)
- labeler intent —is inferred from→ natural language instruction  (x1)
- biased or toxic language —is considered when inferring→ labeler intent  (x1)
- screening test —is used to select→ labelers  (x1)
- screening test —measures performance of→ labelers  (x1)
- alignment criteria —can prioritize→ helpfulness  (x1)
- alignment criteria —can come into conflict with→ potentially harmful response  (x1)
- Atlas —is a→ Retrieval-Augmented Language Model Pre-Training  (x1)
- Atlas —is designed for→ few-shot learning  (x1)
- Atlas —is designed to learn→ knowledge-intensive tasks  (x1)
- Retrieval-Augmented Language Model Pre-Training —is used for→ knowledge-intensive tasks  (x1)
- Retrieval-Augmented Language Model Pre-Training —uses→ search index  (x1)
- 问答 —is a kind of→ knowledge-intensive tasks  (x1)
- fact checking —is a kind of→ knowledge-intensive tasks  (x1)
- MMLU —is used to evaluate→ Atlas  (x1)
- KILT —is used to evaluate→ Atlas  (x1)
- NaturalQuestions dataset —is used to evaluate→ Atlas  (x1)
- retrieval-augmented generation —enhances→ language models as knowledge bases  (x1)
- retriever —implements→ explicit memory  (x1)
- few-shot learning —depends on→ generalisation  (x1)
- implicit memorization —is a kind of→ memorisation  (x1)
- Atlas —是一个→ 检索增强语言模型  (x1)
- Atlas —使用→ 稠密检索器  (x1)
- Atlas —使用→ Fusion-in-Decoder method  (x1)
- 稠密检索器 —采用→ dual-encoder framework  (x1)
- 稠密检索器 —基于→ Contriever  (x1)
- Atlas —在其上评估→ NaturalQuestions dataset  (x1)
- Atlas —is a kind of→ Retrieval-Augmented Language Model Pre-Training  (x1)
- Atlas —is evaluated in→ few-shot learning  (x1)
- Atlas —aims to improve→ sample efficiency  (x1)
- Atlas —is adapted by→ fine-tuning  (x1)
- fine-tuning —adapts→ retriever  (x1)
- retriever —searches→ Wikipedia index  (x1)
- compressed index —uses→ product quantisation  (x1)
- compressed index —achieves comparable performance to→ uncompressed index  (x1)
- compressed index —affects→ updatability  (x1)
- compressed index —affects→ interpretability  (x1)
- NaturalQuestions dataset —is evaluated with→ full-dataset finetuning  (x1)
- TriviaQA —is evaluated with→ full-dataset finetuning  (x1)
- 事实验证 —is evaluated with→ full-dataset finetuning  (x1)
- MMLU —is evaluated in→ few-shot learning  (x1)
- Text-to-Text Transfer Transformer —includes→ 问答  (x1)
- KILT —includes→ 问答  (x1)
- passage retrieval —may improve→ few-shot learning  (x1)
- retriever —performs→ passage retrieval  (x1)
- language models —is used in→ Text-to-Text Transfer Transformer  (x1)
- Contriever —is a technique for→ information retrieval  (x1)
- Contriever —is based on→ dense representation  (x1)
- Contriever —uses→ dual-encoder framework  (x1)
- dual-encoder framework —uses→ Transformer 编码器  (x1)
- average pooling —produces→ dense representation  (x1)
- Transformer 编码器 —feeds into→ average pooling  (x1)
- Dense retrieval —uses→ Transformer 编码器  (x1)
- Dense retrieval —uses→ dot product  (x1)
- Contriever —is pre-trained with→ MoCo contrastive loss  (x1)
- Contriever —uses→ unsupervised data  (x1)
- Text-to-Text Transfer Transformer —is modified by→ Fusion-in-Decoder method  (x1)
- Fusion-in-Decoder method —uses→ cross attention  (x1)
- self-attention —results in→ quadratic complexity  (x1)
- Attention Distillation —trains→ retriever  (x1)
- Attention Distillation —minimizes→ Kullback-Leibler divergence  (x1)
- Attention Distillation —uses→ cross-attention score  (x1)
- Attention Distillation —matches→ retriever probability distribution  (x1)
- retriever probability distribution —is computed from→ dot-product similarity  (x1)
- retriever probability distribution —is scaled by→ temperature  (x1)
- cross-attention score —is produced by→ encoder-decoder attention  (x1)
- cross-attention score —comes from→ 注意力机制  (x1)
- pre-softmax score —is taken from→ encoder-decoder attention  (x1)
- 注意力机制 —yields→ cross-attention score  (x1)
- 注意力机制 —结合→ 值向量范数  (x1)
- 注意力机制 —产生→ 相关性分数  (x1)
- 相关性分数 —输入到→ Softmax Function  (x1)
- Softmax Function —用于构造目标分布并比较→ Kullback-Leibler divergence  (x1)
- Kullback-Leibler divergence —用于优化→ 检索器  (x1)
- StopGradient算子 —只更新→ 检索器  (x1)
- EMDR2 —受启发于→ 期望最大化算法  (x1)
- EMDR2 —将检索文档视为→ 潜变量  (x1)
- EMDR2 —联合训练→ 多文档阅读器  (x1)
- EMDR2 —联合训练→ 检索器  (x1)
- 潜变量 —由其检索→ 检索器  (x1)
- 多文档阅读器 —配合使用→ 检索器  (x1)
- Perplexity Distillation —matches→ document posterior  (x1)
- Perplexity Distillation —uses→ Softmax Function  (x1)
- EMDR2 loss function —is compared with→ Kullback-Leibler divergence  (x1)
- document posterior —is normalized with→ Softmax Function  (x1)
- prefix language modeling —is cast in→ Text-to-Text Transfer Transformer  (x1)
- masked language model —is formulated in→ Text-to-Text Transfer Transformer  (x1)
- masked language model —uses→ special sentinel mask token  (x1)
- masked language model —is adapted to→ retriever vocabulary  (x1)
- search index —stores→ document embedding  (x1)
- retriever —searches→ search index  (x1)
- retriever —produces→ document embedding  (x1)
- language models —is trained jointly with→ retriever  (x1)
- search index —indexes→ retrieval corpus  (x1)
- re-embedding —recomputes→ search index  (x1)
- refresh —depends on→ retriever  (x1)
- re-ranking —depends on→ retriever  (x1)
- re-ranking —supports→ language models  (x1)
- BERTBASE —can be used as→ retriever  (x1)
- T5-XL —can be used as→ language models  (x1)
- Query-side fine-tuning —updates only the query encoder in→ dual-encoder framework  (x1)
- Dense retrieval —often follows→ dual-encoder framework  (x1)
- Dense Passage Retriever —is a type of→ Dense retrieval  (x1)
- Approximate nearest neighbor Negative Contrastive Learning —is an extension of→ Dense retrieval  (x1)
- TF-IDF —is used in→ Open-domain Question Answering  (x1)
- BM25 —is used in→ Open-domain Question Answering  (x1)
- Dense Passage Retriever —uses→ hard negatives mining  (x1)
- ANCE —improves→ hard negatives mining  (x1)
- Open-domain Question Answering —is inspired by→ reading comprehension  (x1)
- sequence-to-sequence model —is used in→ Open-domain Question Answering  (x1)
- hallucination —occurs in→ dialog system  (x1)
- Retrieval-Augmented Language Model Pre-Training —models documents as→ latent variable  (x1)
- retrieval-augmented generation —models documents as→ latent variable  (x1)
- Retrieval-Augmented Language Model Pre-Training —uses→ masked language model  (x1)
- Retrieval-Augmented Language Model Pre-Training —uses→ BERT  (x1)
- Query-side fine-tuning —avoids→ refresh  (x1)
- cross-attention score —is used in→ distillation  (x1)
- reading comprehension model —is paired with→ retriever  (x1)
- distillation —can use→ cross-attention score  (x1)
- retriever —can be trained by→ distillation  (x1)
- reading comprehension model —can be jointly trained with→ retriever  (x1)
- perplexity —is generated by→ reading comprehension model  (x1)
- salient span masking —is used to pre-train→ retriever  (x1)
- inverse cloze task —is used to pre-train→ Dense retrieval  (x1)
- retrieval-augmented generation —can be distilled from→ informed retriever  (x1)
- training set filtering —is used to train→ retrieval-augmented generation  (x1)
- training set weighting —is used to train→ retrieval-augmented generation  (x1)
- contrastive learning —is used to train→ retriever  (x1)
- pseudo-positive query-document pair —is used to train→ retriever  (x1)
- recurring span —is used to create→ pseudo-positive query-document pair  (x1)
- cache model —is extended by using→ approximate nearest neighbor search  (x1)
- kNN-LM —is related to→ cache model  (x1)
- kNN-LM —uses→ approximate nearest neighbor search  (x1)
- RETRO —extends→ kNN-LM  (x1)
- Retrieval-Augmented Language Model Pre-Training —includes→ cache model  (x1)
- Retrieval-Augmented Language Model Pre-Training —includes→ kNN-LM  (x1)
- Retrieval-Augmented Language Model Pre-Training —includes→ RETRO  (x1)
- search engine interaction —is a form of→ Retrieval-Augmented Language Model Pre-Training  (x1)
- few-shot question answering —uses→ language model meta-learning  (x1)
- GPT-3 —demonstrated→ few-shot learning  (x1)
- large-scale language model —can perform→ few-shot learning  (x1)
- 标度律 —influenced the development of→ Chinchilla  (x1)
- prompt-based learning —uses→ Prompt  (x1)
- prompt-based learning —combines with→ fine-tuning  (x1)
- soft prompt —is a kind of→ Prompt  (x1)
- few-shot fine-tuning —is a form of→ prompt-based learning  (x1)
- 预训练神经语言模型 —is built from→ Transformer  (x1)
- large-scale language model —is a larger-scale form of→ 预训练神经语言模型  (x1)
- language model meta-learning —emerges in→ large-scale language model  (x1)
- ChatGPT —is based on→ large-scale language model  (x1)
- large-scale language model —is improved by→ fine-tuning  (x1)
- large-scale language model —is used in→ utilization  (x1)
- large-scale language model —may exhibit→ emergent ability  (x1)
- alignment —can be a goal of→ fine-tuning  (x1)
- statistical language model —依赖→ 马尔可夫假设  (x1)
- n-gram language model —是一个→ statistical language model  (x1)
- n-gram language model —基于→ 马尔可夫假设  (x1)
- 回退估计 —用于平滑→ statistical language model  (x1)
- Good-Turing估计 —用于平滑→ statistical language model  (x1)
- 神经语言模型 —可用→ 多层感知机  (x1)
- 神经语言模型 —可用→ 循环神经网络  (x1)
- 神经语言模型 —引入→ 词向量  (x1)
- 词向量 —用于表示→ 神经语言模型  (x1)
- large-scale language model —is a kind of→ language models  (x1)
- n-gram language model —is a kind of→ statistical language model  (x1)
- Word2vec —is associated with→ static word representations  (x1)
- ELMo —is associated with→ contextual word embeddings  (x1)
- BERT —is a kind of→ 预训练神经语言模型  (x1)
- GPT-1 —is a kind of→ 预训练神经语言模型  (x1)
- GPT-2 —is a kind of→ 预训练神经语言模型  (x1)
- T5 —is a kind of→ 预训练神经语言模型  (x1)
- GPT-3 —is a kind of→ large-scale language model  (x1)
- ChatGPT —is a kind of→ large-scale language model  (x1)
- LLaMA —is a kind of→ large-scale language model  (x1)
- Codex —is a kind of→ large-scale language model  (x1)
- InstructGPT —is a kind of→ large-scale language model  (x1)
- pre-training and fine-tuning —is used for→ 预训练神经语言模型  (x1)
- implicit continuation —is used for→ large-scale language model  (x1)
- scaling language models —is used for→ large-scale language model  (x1)
- 预训练神经语言模型 —is a kind of→ task-agnostic feature learner  (x1)
- 预训练神经语言模型 —is a kind of→ transferable NLP task solver  (x1)
- large-scale language model —is a kind of→ general-purpose task solver  (x1)
- statistical language model —is a kind of→ specific task helper  (x1)
- Word2vec —is used to learn→ 词向量  (x1)
- Word2vec —initiates→ 表示学习  (x1)
- 预训练神经语言模型 —includes→ ELMo  (x1)
- 预训练神经语言模型 —includes→ BERT  (x1)
- 预训练神经语言模型 —sets→ 预训练加微调范式  (x1)
- ELMo —uses→ 双向长短期记忆网络  (x1)
- Transformer —uses→ 自注意力  (x1)
- BERT —uses→ 预训练策略  (x1)
- GPT-2 —is based on→ Transformer  (x1)
- pre-trained seq2seq model —is based on→ Transformer  (x1)
- large-scale language model —follows→ scaling laws for neural language models  (x1)
- 预训练神经语言模型 —often requires→ fine-tuning  (x1)
- GPT-2 —is a→ 预训练神经语言模型  (x1)
- pre-trained seq2seq model —is a→ 预训练神经语言模型  (x1)
- large-scale language model —exhibits→ emergent ability  (x1)
- large-scale language model —enables→ language model meta-learning  (x1)
- ChatGPT —adapts→ large-scale language model  (x1)
- neural language model —learns→ task-agnostic feature learner  (x1)
- 预训练神经语言模型 —learns→ context-aware representation  (x1)
- 预训练神经语言模型 —learns→ contextual word embeddings  (x1)
- contextual word embeddings —is optimized for→ downstream task  (x1)
- large-scale language model —is enhanced by→ scaling effect  (x1)
- scaling effect —increases→ model capacity  (x1)
- large-scale language model —has greater→ model capacity  (x1)
- large-scale language model —displays→ emergent ability  (x1)
- prompting —is used to access→ large-scale language model  (x1)
- distributed parallel training —is used for training→ large-scale language model  (x1)
- large-scale data processing —is required for training→ large-scale language model  (x1)
- large-scale language model —motivates rethinking of→ artificial general intelligence  (x1)
- ChatGPT —is a kind of→ AI chatbot  (x1)
- large-scale language model —is used in→ natural language processing  (x1)
- New Bing —is used in→ information retrieval  (x1)
- New Bing —is based on→ large-scale language model  (x1)
- vision-language model —combines→ computer vision  (x1)
- vision-language model —is used for→ multimodal dialogue  (x1)
- GPT-4 —supports→ multimodal input  (x1)
- Microsoft 365 Copilot —is powered by→ large-scale language model  (x1)
- ChatGPT —supports→ plugin  (x1)
- emergent ability —occurs in→ large-scale language model  (x1)
- emergent ability —contrasted with→ 预训练神经语言模型  (x1)
- ablation study —is used to investigate→ large-scale language model  (x1)
- alignment —is applied to→ large-scale language model  (x1)
- toxic text —can be produced by→ large-scale language model  (x1)
- large-scale language model —is a kind of→ Transformer language model  (x1)
- large-scale language model —can be improved by→ adaptation  (x1)
- large-scale language model —is applied through→ utilization  (x1)
- large-scale language model —can benefit from→ prompting  (x1)
- GPT series models —is an example of→ large-scale language model  (x1)
- large-scale language model —is based on→ Transformer  (x1)
- Transformer —includes→ 多头注意力  (x1)
- large-scale language model —uses→ language modeling  (x1)
- scaling laws for neural language models —is a→ power law  (x1)
- negative log-likelihood —is decomposed into→ irreducible loss  (x1)
- negative log-likelihood —is decomposed into→ reducible loss  (x1)
- reducible loss —estimates→ Kullback-Leibler divergence  (x1)
- Chinchilla scaling law —models→ negative log-likelihood  (x1)
- compute-optimal scaling law —determines optimal model size as→ non-embedding parameters  (x1)
- compute-optimal scaling law —determines optimal data size as→ training tokens  (x1)
- compute-optimal scaling law —is parameterized by→ FP-days  (x1)
- compute-optimal scaling law —contrasts with→ Chinchilla scaling law  (x1)
- scaling laws for neural language models —can be used to find→ data mixture schedule  (x1)
- scaling laws for neural language models —indicates→ diminishing returns  (x1)
- diminishing returns —approaches→ irreducible loss  (x1)
- scaling laws for neural language models —is relevant to→ data-constrained regime  (x1)
- data repetition —is used in→ data-constrained regime  (x1)
- data augmentation —is used in→ data-constrained regime  (x1)
- data-constrained regime —may use→ data repetition  (x1)
- data-constrained regime —may use→ data augmentation  (x1)
- task-level scaling law —relates→ negative log-likelihood  (x1)
- inverse scaling —can violate→ task-level scaling law  (x1)
- emergent ability —is a property of→ large-scale language model  (x1)
- phase transition —is analogous to→ emergent ability  (x1)
- language model meta-learning —is an example of→ emergent ability  (x1)
- large-scale language model —is distinct from→ 预训练神经语言模型  (x1)
- emergent ability —is analogous to→ phase transition  (x1)
- language model meta-learning —is a type of→ emergent ability  (x1)
- instruction following —is a type of→ emergent ability  (x1)
- instruction tuning —enables→ instruction following  (x1)
- instruction tuning —uses→ natural language instruction  (x1)
- GPT-3 —exhibits→ language model meta-learning  (x1)
- LaMDA-PT —exhibits→ instruction following  (x1)
- PaLM —is evaluated for→ instruction following  (x1)
- long-context language model —is analyzed on→ multi-document question answering  (x1)
- long-context language model —is analyzed on→ key-value retrieval  (x1)
- lost in the middle effect —affects→ long-context language model  (x1)
- U-shaped performance curve —is associated with→ primacy bias  (x1)
- U-shaped performance curve —is associated with→ recency bias  (x1)
- Transformer —exhibits→ quadratic complexity  (x1)
- Transformer —uses→ 上下文窗口  (x1)
- multi-document question answering —mimics→ retrieval-augmented generation  (x1)
- primacy bias —helps explain→ U-shaped performance curve  (x1)
- recency bias —helps explain→ U-shaped performance curve  (x1)
- long-context language model —has→ 上下文窗口  (x1)
- multi-document question answering —is used in→ controlled experiment  (x1)
- lost in the middle effect —is reflected in→ U-shaped performance curve  (x1)
- multi-document question answering —is compared with→ closed-book setting  (x1)
- key-value retrieval —uses→ JSON-formatted key-value pair  (x1)
- key-value retrieval —exhibits→ U-shaped performance curve  (x1)
- sequence-to-sequence model —depends on→ training-time sequence length  (x1)
- sequence-to-sequence model —exhibits→ U-shaped performance curve  (x1)
- query-aware contextualization —improves performance on→ multi-document question answering  (x1)
- query-aware contextualization —improves performance on→ key-value retrieval  (x1)
- query-aware contextualization —enables near-perfect performance on→ key-value retrieval  (x1)
- query-aware contextualization —minimally changes trends in→ multi-document question answering  (x1)
- vanilla LM —shows→ U-shaped performance curve  (x1)
- instruction tuning —adapts→ vanilla LM  (x1)
- retriever-reader model —is used for→ Open-domain Question Answering  (x1)
- retriever-reader model —is used for→ multi-document question answering  (x1)
- multi-document question answering —uses→ long input context  (x1)
- NATURALQUESTIONS-OPEN —is an instance of→ Open-domain Question Answering  (x1)
- retriever recall —is measured in→ Open-domain Question Answering  (x1)
- retriever-reader model —depends on→ retriever recall  (x1)
- multi-document question answering task —requires→ answer-containing document  (x1)
- multi-document question answering task —includes→ distractor document  (x1)
- multi-document question answering task —uses→ input context  (x1)
- NATURALQUESTIONS-OPEN —provides→ Wikipedia paragraph  (x1)
- Contriever —retrieves→ Wikipedia chunk  (x1)
- Contriever —is fine-tuned on→ MS MARCO  (x1)
- distractor document —is a→ Wikipedia chunk  (x1)
- answer-containing document —is a→ Wikipedia paragraph  (x1)
- document order —affects→ input context  (x1)
- accuracy —evaluates→ multi-document question answering task  (x1)
- accuracy —is computed using→ NaturalQuestions annotations  (x1)
- NATURALQUESTIONS-OPEN —has subset→ unambiguous questions  (x1)
- distractor document —occur in→ NATURALQUESTIONS-OPEN  (x1)
- random documents —can be used as→ distractor document  (x1)
- search ranking —can be assigned to→ random documents  (x1)
- accuracy —is evaluated under varying numbers of→ distractor document  (x1)
- MPT-30B-Instruct —is evaluated with→ greedy decoding  (x1)
- MPT-30B-Instruct —uses→ Prompt  (x1)
- MPT-30B-Instruct —undergoes→ sequence length adaptation pre-training  (x1)
- MPT-30B-Instruct —uses→ ALiBi  (x1)
- LongChat-13B —extends→ LLaMA-13B  (x1)
- LongChat-13B —uses→ condensed rotary positional embeddings  (x1)
- LongChat-13B —uses→ Prompt  (x1)
- GPT-3.5-Turbo —uses→ Prompt  (x1)
- oracle setting —provides→ relevant information  (x1)
- multi-document question answering —uses→ input context  (x1)
- context length —limits→ input context  (x1)
- answer-containing document —contains→ relevant information  (x1)
- answer-containing document —is used in→ multi-document question answering  (x1)
- oracle setting —depends on→ input context  (x1)
- multi-document question answering —is evaluated with→ closed-book setting  (x1)
- multi-document question answering —is evaluated with→ oracle setting  (x1)
- U-shaped performance curve —depends on→ input context  (x1)
- long-context language model —has a larger→ 上下文窗口  (x1)
- multi-document question answering —is limited by→ 上下文窗口  (x1)
- long-context language model —is used for→ multi-document question answering  (x1)
- key-value retrieval —uses→ key-value pair  (x1)
- key-value retrieval —represents inputs as→ string-serialized JSON object  (x1)
- key-value retrieval —uses→ UUID  (x1)
- key-value retrieval —includes→ distractor key-value pair  (x1)
- key-value retrieval —is evaluated within→ input context  (x1)
- Little Retrieval Test —is similar to→ key-value retrieval  (x1)
- fine-grained line retrieval task —is similar to→ key-value retrieval  (x1)
- Transformer language model —processes→ input context  (x1)
- key-value retrieval —requires→ exact match  (x1)
- key-value retrieval —uses→ input context  (x1)
- key-value retrieval —operates on→ key-value pair  (x1)
- key-value retrieval —searches within→ input context  (x1)
- key-value retrieval —depends on→ position of relevant information  (x1)
- key-value retrieval —varies with→ context length  (x1)
- multi-document question answering —depends on→ context length  (x1)
- multi-document question answering —depends on→ position of relevant information  (x1)
- Transformer decoder —contrasts with→ sequence-to-sequence model  (x1)
- query-aware contextualization —is used for→ multi-document question answering  (x1)
- instruction tuning —is used for→ multi-document question answering  (x1)
- Taxonomy of hallucination —organizes→ hallucination  (x1)
- Hallucination detection —is used to identify→ hallucination  (x1)
- Hallucination benchmarks —are used to evaluate→ Hallucination detection  (x1)
- Hallucination mitigation —is used to reduce→ hallucination  (x1)
- 检索增强语言模型 —are used to combat→ hallucination  (x1)
- Knowledge boundaries —help explain→ hallucination  (x1)
- Factuality —is closely related to→ hallucination  (x1)
- Faithfulness —is closely related to→ hallucination  (x1)
- hallucination —is contrasted with→ Factuality  (x1)
- hallucination —is contrasted with→ Faithfulness  (x1)
- hallucination —is categorized into→ intrinsic hallucination  (x1)
- hallucination —is categorized into→ extrinsic hallucination  (x1)
- intrinsic hallucination —is a type of→ hallucination  (x1)
- extrinsic hallucination —is a type of→ hallucination  (x1)
- large-scale language model —is integrated into→ information retrieval system  (x1)
- hallucination —is studied in→ natural language generation  (x1)
- hallucination —is a concern in→ large-scale language model  (x1)
- factuality hallucination —is a type of→ Taxonomy of hallucination  (x1)
- faithfulness hallucination —is a type of→ Taxonomy of hallucination  (x1)
- instruction inconsistency —is a subtype of→ faithfulness hallucination  (x1)
- context inconsistency —is a subtype of→ faithfulness hallucination  (x1)
- logical inconsistency —is a subtype of→ faithfulness hallucination  (x1)
- detection methods —is used to detect→ hallucination  (x1)
- benchmark —is used to evaluate→ hallucination  (x1)
- data stage —can contribute to→ hallucination  (x1)
- training stage —can contribute to→ hallucination  (x1)
- inference stage —can contribute to→ hallucination  (x1)
- retrieval-augmented generation —mitigates→ hallucination  (x1)
- factuality hallucination —is a type of→ hallucination  (x1)
- faithfulness hallucination —is a type of→ hallucination  (x1)
- benchmark —assesses→ hallucination  (x1)
- Large vision-language models —can exhibit→ hallucination  (x1)
- Knowledge boundaries —helps explain→ hallucination  (x1)
- large-scale language model —are built on→ Transformer language model  (x1)
- large-scale language model —exhibit→ language model meta-learning  (x1)
- large-scale language model —exhibit→ chain-of-thought prompting  (x1)
- large-scale language model —exhibit→ instruction following  (x1)
- Hallucinations in LLMs —are organized by→ Taxonomy of hallucination  (x1)
- emergent ability —includes→ language model meta-learning  (x1)
- emergent ability —includes→ chain-of-thought prompting  (x1)
- emergent ability —includes→ instruction following  (x1)
- Hallucination from Data —is a kind of→ hallucination  (x1)
- Misinformation and Biases —is a cause of→ Hallucination from Data  (x1)
- Knowledge boundaries —is a cause of→ Hallucination from Data  (x1)
- Inferior Alignment Data —is a cause of→ Hallucination from Data  (x1)
- Hallucination from Training —is a kind of→ hallucination  (x1)
- Hallucination from Pre-training —is a kind of→ Hallucination from Training  (x1)
- Hallucination from SFT —is a kind of→ Hallucination from Training  (x1)
- Hallucination from RLHF —is a kind of→ Hallucination from Training  (x1)
- Hallucination from Inference —is a kind of→ hallucination  (x1)
- Imperfect Decoding Strategies —is a cause of→ Hallucination from Inference  (x1)
- Over-confidence —is a cause of→ Hallucination from Inference  (x1)
- Softmax Bottleneck —is a cause of→ Hallucination from Inference  (x1)
- Reasoning Failure —is a cause of→ Hallucination from Inference  (x1)
- Factuality Hallucination Detection —is a kind of→ Hallucination detection  (x1)
- Faithfulness Hallucination Detection —is a kind of→ Hallucination detection  (x1)
- Hallucination Detection Benchmarks —is a kind of→ Hallucination benchmarks  (x1)
- Hallucination Detection Benchmarks —用于评估→ Hallucination mitigation  (x1)
- training set filtering —是用于缓解的→ Hallucination mitigation  (x1)
- 模型编辑 —是用于缓解的→ Hallucination mitigation  (x1)
- 检索增强生成 —是用于缓解的→ Hallucination mitigation  (x1)
- 预训练相关幻觉缓解 —是用于缓解的→ Hallucination mitigation  (x1)
- 错配幻觉缓解 —是用于缓解的→ Hallucination mitigation  (x1)
- self-supervised training —is performed on→ textual corpora  (x1)
- 自回归预测 —is used in→ self-supervised training  (x1)
- self-supervised training —helps learn→ syntactic information  (x1)
- self-supervised training —helps learn→ world knowledge  (x1)
- self-supervised training —helps learn→ reasoning ability  (x1)
- fine-tuning —follows→ self-supervised training  (x1)
- 自回归预测 —is akin to→ lossless compression  (x1)
- fine-tuning —can be followed by→ reward model  (x1)
- fine-tuning with human feedback —uses→ reward model  (x1)
- fine-tuning with human feedback —typically employs→ Proximal Policy Optimization  (x1)
- intrinsic hallucination —is a kind of→ hallucination  (x1)
- extrinsic hallucination —is a kind of→ hallucination  (x1)
- Hallucinations in LLMs —is a kind of→ hallucination  (x1)
- factuality hallucination —is a kind of→ Hallucinations in LLMs  (x1)
- faithfulness hallucination —is a kind of→ Hallucinations in LLMs  (x1)
- factuality hallucination —包括→ 事实矛盾  (x1)
- hallucination —包括→ factuality hallucination  (x1)
- hallucination —包括→ 指令不一致  (x1)
- hallucination —包括→ 上下文不一致  (x1)
- 事实矛盾 —is a type of→ factuality hallucination  (x1)
- Entity-error hallucination —is a subcategory of→ 事实矛盾  (x1)
- Relation-error hallucination —is a subcategory of→ 事实矛盾  (x1)
- factuality hallucination —is divided into→ overclaim hallucination  (x1)
- faithfulness hallucination —includes subtype→ instruction inconsistency  (x1)
- faithfulness hallucination —includes subtype→ context inconsistency  (x1)
- faithfulness hallucination —includes subtype→ logical inconsistency  (x1)
- factuality hallucination —is distinct from→ overclaim hallucination  (x1)
- GraphRAG —builds→ graph index  (x1)
- GraphRAG —derives→ entity knowledge graph  (x1)
- GraphRAG —pre-generates→ community summary  (x1)
- community summary —is used to generate→ partial response  (x1)
- partial response —is combined in→ GraphRAG  (x1)
- query-focused summarization —uses→ large-scale language model  (x1)
- retrieval-augmented generation —uses→ retrieval corpus  (x1)
- retrieval-augmented generation —is limited by→ 上下文窗口  (x1)
- vector RAG —does not support→ sensemaking query  (x1)
- sensemaking task —is related to→ sensemaking query  (x1)
- GraphRAG —constructs→ knowledge graph  (x1)
- GraphRAG —partitions into→ hierarchical community  (x1)
- GraphRAG —generates→ community summary  (x1)
- community summary —is generated for→ hierarchical community  (x1)
- knowledge graph —is partitioned into→ hierarchical community  (x1)
- GraphRAG —uses→ community summary  (x1)
- GraphRAG —is designed for→ global sensemaking  (x1)
- LLM-as-a-judge technique —is used to evaluate→ global sensemaking questions  (x1)
- retrieval-augmented generation —uses→ prompt template  (x1)
- retrieval-augmented generation —is constrained by→ 上下文窗口  (x1)
- map-reduce processing —combines→ community summary  (x1)
- text embeddings —are represented in→ 向量空间  (x1)
- vector RAG —relies on→ semantic similarity  (x1)
- vector RAG —contrasts with→ GraphRAG  (x1)
- GraphRAG —supports→ global sensemaking  (x1)
- GraphRAG —leverages→ 自我记忆  (x1)
- GraphRAG —uses→ 全局摘要  (x1)
- GraphRAG —contrasts with→ 层次化索引  (x1)
- GraphRAG —generates→ graph index  (x1)
- GraphRAG —uses→ 基于图的社区发现  (x1)
- 基于图的社区发现 —produces→ 主题划分  (x1)
- 知识图谱抽取 —can produce→ graph index  (x1)
- 知识图谱作为索引 —is used by→ GraphRAG  (x1)
- 事实锚定 —depends on→ 知识图谱作为索引  (x1)
- GraphRAG —focuses on→ modularity  (x1)
- GraphRAG —uses→ hierarchical community  (x1)
- Louvain method —optimizes→ modularity  (x1)
- Leiden algorithm —uses→ modularity  (x1)
- adaptive benchmarking —is used for→ global sensemaking  (x1)
- HotPotQA —evaluates→ vector RAG  (x1)
- MultiHop-RAG —evaluates→ vector RAG  (x1)
- MT-Bench —evaluates→ vector RAG  (x1)
- adaptive benchmarking —builds on→ persona generation  (x1)
- adaptive benchmarking —generates→ sensemaking query  (x1)
- persona generation —supports representation of→ real-world usage  (x1)
- persona generation —guides generation of→ sensemaking query  (x1)
- retrieval-augmented generation —is evaluated against→ real-world usage  (x1)
- RAG evaluation criteria —are applied by→ LLM evaluator  (x1)
- LLM evaluator —evaluates→ retrieval-augmented generation  (x1)
- graph index —is a type of→ 知识图谱  (x1)
- graph index —contains→ 实体  (x1)
- graph index —contains→ 关系  (x1)
- graph index —contains→ 协变量  (x1)
- 源文档 —is split into→ 文本块  (x1)
- 文本块 —yields→ 实体  (x1)
- 文本块 —yields→ 关系  (x1)
- 文本块 —yields→ 协变量  (x1)
- 基于图的社区发现 —partitions into→ 社区  (x1)
- Leiden algorithm —is used for→ 基于图的社区发现  (x1)
- 社区 —is summarized into→ community summary  (x1)
- community summary —supports→ 社区回答  (x1)
- community summary —contributes to→ 全局回答  (x1)
- 查询阶段 —produces→ 全局回答  (x1)
- 索引阶段 —builds→ graph index  (x1)
- 索引阶段 —generates→ community summary  (x1)
- 查询阶段 —uses→ community summary  (x1)
- 管道阶段 —includes→ 索引阶段  (x1)
- 管道阶段 —includes→ 查询阶段  (x1)
- LLM-as-a-judge technique —is validated using→ 可验证事实陈述  (x1)
- Chunk Size —affects→ Recall-precision Trade-off  (x1)
- Text Chunk —is used for→ Entity and Relation Extraction  (x1)
- demonstration —are used in→ language model meta-learning  (x1)
- demonstration —can be specialized for→ named entities  (x1)
- claims —complements→ entity extraction  (x1)
- relationship extraction —contributes to→ knowledge graph  (x1)
- entity extraction —contributes to→ knowledge graph  (x1)
- claim extraction —contributes to→ knowledge graph  (x1)
- claim extraction —is a form of→ abstractive summarization  (x1)
- public debut —may not reflect trends for→ technology IPOs  (x1)
- entity matching —can use→ exact string matching  (x1)
- Leiden algorithm —is used in→ hierarchical community detection  (x1)
- hierarchical community detection —produces→ leaf community  (x1)
- duplicate entities —are resolved by→ entity matching  (x1)
- graph communities —are detected by→ Leiden algorithm  (x1)
- knowledge graph —can be partitioned into→ graph communities  (x1)
- duplicate entities —can influence→ edge weight  (x1)
- 层次化分区 —形成→ hierarchical community  (x1)
- hierarchical community —用于生成→ community summary  (x1)
- community summary —构成→ graph index  (x1)
- 元素摘要 —用于生成→ community summary  (x1)
- 叶子级社区 —生成→ community summary  (x1)
- 更高层级社区 —生成→ community summary  (x1)
- 社区摘要模板 —用于组织→ community summary  (x1)
- 全局查询 —由…回答→ graph index  (x1)
- 社区回答 —用于生成→ 全局回答  (x1)
- hierarchical community —支持→ 全局回答  (x1)
- hierarchical community —uses→ community summary  (x1)
- community summary —supports generation of→ 社区回答  (x1)
- 社区回答 —are reduced into→ global answer  (x1)
- global sensemaking question generation —is used to evaluate→ global answer  (x1)
- LLM evaluator —is used in→ head-to-head comparison approach  (x1)
- comprehensiveness —is a criterion for→ global sensemaking  (x1)
- diversity —is a criterion for→ global sensemaking  (x1)
- empowerment —is a criterion for→ global sensemaking  (x1)
- tech policy —is shaped by→ government regulation  (x1)
- privacy laws —influence→ technology development  (x1)
- innovation —is balanced with→ ethical considerations  (x1)
- tech companies —collaborate with→ government  (x1)
- health education curriculum —can include→ preventive medicine  (x1)
- health education curriculum —can include→ wellness  (x1)
- public health priorities —are supported by→ health literacy  (x1)
- Directness —is in opposition to→ comprehensiveness  (x1)
- Directness —is in opposition to→ diversity  (x1)
- GraphRAG —uses→ root-level community summaries  (x1)
- LLM-as-a-judge technique —is used for→ Directness  (x1)
- map-reduce processing —is applied to→ news articles  (x1)
- map-reduce processing —is applied to→ Podcast transcripts  (x1)
- high-level community summary —is a sub-community of→ root-level community summaries  (x1)
- intermediate-level community summary —is a sub-community of→ high-level community summary  (x1)
- low-level community summary —is a sub-community of→ intermediate-level community summary  (x1)
- vector RAG —is implemented by→ semantic search  (x1)
- semantic search —fills→ 上下文窗口  (x1)
- graph index —is created using→ entity extraction  (x1)
- graph index —is created using→ relationship extraction  (x1)
- generic prompt —guides→ entity extraction  (x1)
- generic prompt —guides→ relationship extraction  (x1)
- few-shot example —is included in→ generic prompt  (x1)
- GraphRAG —is a graph-based extension of→ retrieval-augmented generation  (x1)
- GraphRAG —enables→ graph context-aware generation  (x1)
- graph context-aware generation —includes→ text view  (x1)
- graph context-aware generation —includes→ graph view  (x1)
- multi-hop reasoning —benefits from→ textual subgraph retrieval  (x1)
- graph reasoning benchmark —evaluates→ multi-hop reasoning  (x1)
- GraphRAG —extends→ retrieval-augmented generation  (x1)
- GraphRAG —incorporates→ 文本图  (x1)
- 文本子图检索 —operates on→ 文本图  (x1)
- 引用图 —is a kind of→ 文本图  (x1)
- textual subgraph retrieval —retrieves→ textual subgraph  (x1)
- high dimensionality of textual features —makes difficult→ textual subgraph retrieval  (x1)
- GraphRAG —uses→ hard prompts  (x1)
- GraphRAG —uses→ soft prompt  (x1)
- divide-and-conquer strategy —retrieves→ ego-graph  (x1)
- divide-and-conquer strategy —refines with→ graph soft pruning mechanism  (x1)
- hard prompts —are formed from→ hierarchical text descriptions  (x1)
- soft prompt —are generated by→ graph encoders  (x1)
- hierarchical text descriptions —represent results of→ textual subgraph retrieval  (x1)
- multi-hop graph reasoning —is evaluated with→ GraphRAG  (x1)
- vanilla LM —is used with→ GraphRAG  (x1)
- GraphRAG —is a graph-oriented form of→ retrieval-augmented generation  (x1)
- GraphRAG —uses→ hierarchical text descriptions  (x1)
- textual subgraph —is the target of→ subgraph search  (x1)
- Prompt optimization —contrasts with→ Low-Rank Adaptation  (x1)
- AutoPrompt —is a method of→ Prompt optimization  (x1)
- soft prompt —are learned as→ Prompt embeddings  (x1)
- Prompt optimization —uses→ Prompt embeddings  (x1)
- Graph prompt tuning —is a kind of→ Prompt optimization  (x1)
- Graph prompt tuning —helps model→ Topological information  (x1)
- GraphRAG —operates on→ 文本图  (x1)
- textual subgraph —is a part of→ 文本图  (x1)
- chain of thought —can be simplified to→ textual subgraph  (x1)
- 基于图的社区发现 —partitions→ 文本图  (x1)
- 基于图的社区发现 —helps retrieve→ textual subgraph  (x1)
- Textual Information —complements→ Topological information  (x1)
- GraphRAG —is designed for→ subgraph retrieval  (x1)
- GraphRAG —retrieves→ optimal subgraph  (x1)
- divide-and-conquer strategy —searches for→ ego-graph  (x1)
- graph soft pruning mechanism —helps produce→ optimal subgraph  (x1)
- ego-graph —is merged into→ optimal subgraph  (x1)
- GraphRAG —uses→ retrieval-then-pruning approach  (x1)
- retrieval-then-pruning approach —limits retrieval to→ ego-graph  (x1)
- graph view —is encoded as→ soft prompt  (x1)
- hierarchical text descriptions —is converted into→ hard prompts  (x1)
- textual subgraph retrieval —is formulated as→ NP-hard problem  (x1)
- textual subgraph retrieval —uses→ divide-and-conquer strategy  (x1)
- induced subgraph —contains→ K-hop neighbor  (x1)
- key node —forms backbone of→ induced subgraph  (x1)
- K-hop neighbor —defines→ ego-graph  (x1)
- 文本子图索引 —indexes→ K-hop ego-graph  (x1)
- 文本子图索引 —stores→ 图嵌入  (x1)
- 预训练神经语言模型 —produces→ 图嵌入  (x1)
- average pooling —aggregates into→ 图嵌入  (x1)
- 文本子图排序 —uses→ semantic similarity  (x1)
- semantic similarity —is computed with→ 余弦相似度  (x1)
- Top-N selection —implements→ 文本子图排序  (x1)
- 可学习剪枝器 —refines→ K-hop ego-graph  (x1)
- Sentence-BERT —is used with→ 余弦相似度  (x1)
- K-hop ego-graph —is scored by→ 余弦相似度  (x1)
- Textual Subgraph Soft Pruning —uses→ 多层感知机  (x1)
- Textual Subgraph Soft Pruning —learns→ scaling factor  (x1)
- scaling factor —is based on→ element-wise distance  (x1)
- graph context-aware generation —provides→ text view  (x1)
- graph context-aware generation —provides→ graph view  (x1)
- ego-graph —differs from→ tree structure  (x1)
- graph traversal —is combined with→ tree traversal  (x1)
- text view —uses→ tree structure  (x1)
- Breadth-First Search —is used to find→ tree rooted at the ego node  (x1)
- pre-order traversal —is used on→ tree rooted at the ego node  (x1)
- K-hop ego-graph —is split into→ tree rooted at the ego node  (x1)
- K-hop ego-graph —is split into→ edge set  (x1)
- tree rooted at the ego node —is converted into→ hierarchical text descriptions  (x1)
- edge set —is inserted into→ hierarchical text descriptions  (x1)
- 文本图 —is represented by→ hierarchical text descriptions  (x1)
- lossless conversion —preserves→ K-hop ego-graph  (x1)
- lossless conversion —preserves→ 文本图  (x1)
- Graph Neural Network —encodes→ graph soft pruning mechanism  (x1)
- graph soft pruning mechanism —is learned as→ soft prompt  (x1)
- relevance scaling factor —controls→ message passing  (x1)
- relevance scaling factor —modulates→ Graph Neural Network  (x1)
- 多层感知机 —aligns embeddings with→ Graph Neural Network  (x1)
- soft prompt —conditions→ Graph Neural Network  (x1)
- optimal subgraph —is encoded into→ 图嵌入  (x1)
- 图嵌入 —are transformed by→ 多层感知机  (x1)
- 图嵌入 —are produced by→ Graph Neural Network  (x1)
- Graph Neural Network —captures→ Topological information  (x1)
- 多层感知机 —aligns→ 图嵌入  (x1)
- WebQSP —is a dataset in→ GraphQA benchmark  (x1)
- ExplaGraphs —is a dataset in→ GraphQA benchmark  (x1)
- WebQSP —is evaluated with→ F1 score  (x1)
- WebQSP —is evaluated with→ Hit@1  (x1)
- WebQSP —is evaluated with→ Recall  (x1)
- ExplaGraphs —is evaluated with→ accuracy  (x1)
- GraphRAG —is a variant of→ retrieval-augmented generation  (x1)
- BM25 —is used as a retriever in→ retrieval-augmented generation  (x1)
- MiniLM-L12-v2 —is used as a retriever in→ retrieval-augmented generation  (x1)
- GraphRAG —is compared with→ retrieval-augmented generation  (x1)
- GraphRAG —is contrasted with→ Low-Rank Adaptation  (x1)
- retrieval-augmented generation —uses→ MiniLM-L12-v2  (x1)
- retrieval-augmented generation —uses→ LaBSE  (x1)
- retrieval-augmented generation —uses→ mContriever  (x1)
- retrieval-augmented generation —uses→ E5  (x1)
- retrieval-augmented generation —uses→ GraphRetriever  (x1)
- vanilla LM —uses→ Llama2-7b  (x1)
- Low-Rank Adaptation —is applied to→ Llama2-7b  (x1)
- GraphRAG —is used for→ multi-hop graph reasoning  (x1)
- Hit@1 —is evaluated on→ WebQSP  (x1)
- Hit@1 —is evaluated on→ ExplaGraphs  (x1)
- information retrieval —mitigate→ redundant information in graphs  (x1)
- fine-tuning —improves performance on→ small graphs  (x1)
- GraphRAG —demonstrates→ transferability  (x1)
- GraphRAG —learns→ graph encoding capabilities  (x1)
- graph encoding capabilities —transfer across datasets to→ ExplaGraphs  (x1)
- GraphRAG —outperforms naive LLM on→ ExplaGraphs  (x1)
- model size —affects performance on→ graph-related tasks  (x1)
- retrieval-augmented generation —is compared with→ GraphRAG  (x1)
- LLMLoRA —is an adapted version of→ LLM only  (x1)
- GRAGLoRA —is an adapted version of→ GraphRAG  (x1)
- G-RetrieverLoRA —is an adapted version of→ GraphRetriever  (x1)
- GraphRAG —is evaluated on→ WebQSP  (x1)
- GraphRAG —is evaluated on→ ExplaGraphs  (x1)
- GRAGLoRA —is evaluated on→ WebQSP  (x1)
- GRAGLoRA —is evaluated on→ ExplaGraphs  (x1)
- LLM only —is evaluated on→ WebQSP  (x1)
- LLM only —is evaluated on→ ExplaGraphs  (x1)
- Prompt optimization —is used in→ GraphRetriever  (x1)
- Prompt optimization —is used in→ GraphRAG  (x1)
- Prompt optimization —is used in→ GRAGLoRA  (x1)
- retrieval-augmented generation —enhances→ large-scale language model  (x1)
- retrieval-augmented generation —integrates→ non-parametric knowledge source  (x1)
- retrieval-augmented generation —is implemented by→ LightRAG  (x1)
- LightRAG —incorporates→ knowledge graph  (x1)
- LightRAG —incorporates→ text indexing  (x1)
- LightRAG —incorporates→ information retrieval  (x1)
- dual-level retrieval system —includes→ high-level knowledge discovery  (x1)
- knowledge graph —is integrated with→ dense representation  (x1)
- knowledge graph —facilitates retrieval of→ related entity  (x1)
- knowledge graph —captures→ 关系  (x1)
- incremental update algorithm —supports→ LightRAG  (x1)
- chunking —is used in→ retrieval-augmented generation  (x1)
- chunking —divides→ textual knowledge corpus  (x1)
- chunking —improves→ information retrieval  (x1)
- nearest neighbor retrieval —is used in→ information retrieval  (x1)
- retrieval-augmented generation —depends on→ information retrieval  (x1)
- retrieval-augmented generation —benefits from→ contextual awareness  (x1)
- 图增强检索增强生成系统 —采用→ graph index  (x1)
- 图增强检索增强生成系统 —集成→ 双层检索框架  (x1)
- graph index —构建为→ 知识图谱  (x1)
- 图增强检索增强生成系统 —使用→ 知识图谱  (x1)
- 图增强检索增强生成系统 —结合→ 稠密嵌入  (x1)
- 稠密嵌入 —补充→ 知识图谱  (x1)
- retrieval-augmented generation —includes→ retriever  (x1)
- retriever —retrieves from→ non-parametric knowledge source  (x1)
- LightRAG —integrates→ graph index  (x1)
- LightRAG —integrates→ dual-level retrieval system  (x1)
- graph index —incorporates→ graph view  (x1)
- dual-level retrieval system —improves→ response efficiency  (x1)
- adaptive retrieval system —depends on→ incremental update algorithm  (x1)
- LightRAG —includes→ data indexer  (x1)
- LightRAG —includes→ retriever  (x1)
- data indexer —performs→ entity extraction  (x1)
- data indexer —performs→ relationship extraction  (x1)
- data indexer —uses→ deduplication  (x1)
- data indexer —builds→ graph index  (x1)
- retriever —queries→ graph index  (x1)
- graph index —stores results of→ entity extraction  (x1)
- graph index —stores results of→ relationship extraction  (x1)
- LLM profiling —supports→ deduplication  (x1)
- data indexer —builds from→ external database  (x1)
- retriever —provides context for→ generative model  (x1)
- LightRAG —is a system for→ retrieval-augmented generation  (x1)
- graph index —creates→ 知识图谱  (x1)
- 知识图谱抽取 —includes→ 命名实体识别  (x1)
- 知识图谱抽取 —includes→ relationship extraction  (x1)
- graph index —uses→ 知识图谱抽取  (x1)
- multi-hop subgraph —is used in→ graph index  (x1)
- 键值存储库 —is derived from→ graph index  (x1)
- incremental update algorithm —updates→ incremental knowledge base  (x1)
- dual-level retrieval system —is enabled by→ graph index  (x1)
- chunk traversal —contrasts with→ embedding matching  (x1)
- knowledge graph —contains→ multi-hop subgraph  (x1)
- 双层检索框架 —包含→ 具体查询  (x1)
- 双层检索框架 —包含→ 抽象查询  (x1)
- low-level knowledge discovery —处理→ 具体查询  (x1)
- high-level knowledge discovery —处理→ 抽象查询  (x1)
- graph view —与...结合→ 稠密嵌入  (x1)
- 查询关键词提取 —为...提供输入→ 向量数据库  (x1)
- LightRAG —uses→ knowledge graph  (x1)
- LightRAG —includes→ graph index  (x1)
- LightRAG —includes→ subgraph retrieval  (x1)
- graph index —extracts→ entities and relationships  (x1)
- subgraph retrieval —relies on→ 密集检索  (x1)
- subgraph retrieval —uses→ dual-level retrieval system  (x1)
- dual-level retrieval system —incorporates→ higher-order relatedness  (x1)
- higher-order relatedness —is captured by→ ego-graph  (x1)
- ego-graph —contains→ one-hop neighboring node  (x1)
- retrieval-augmented generation —uses→ profiling function  (x1)
- retrieval-augmented generation —is part of→ LightRAG  (x1)
- LightRAG —relies on→ 密集检索  (x1)
- GraphRAG —uses→ community-based traversal  (x1)
- LightRAG —reduces retrieval overhead compared to→ GraphRAG  (x1)
- retrieval-augmented generation —can use→ 密集检索  (x1)
- 密集检索 —retrieves→ entity  (x1)
- 密集检索 —retrieves→ 关系  (x1)
- Agriculture dataset —is part of→ UltraDomain benchmark  (x1)
- CS dataset —is part of→ UltraDomain benchmark  (x1)
- Legal dataset —is part of→ UltraDomain benchmark  (x1)
- Mix dataset —is part of→ UltraDomain benchmark  (x1)
- vector RAG —stores chunks in→ 向量数据库  (x1)
- vector RAG —uses→ nearest neighbor retrieval  (x1)
- RQ-RAG —uses→ query decomposition  (x1)
- RQ-RAG —uses→ rewriting  (x1)
- RQ-RAG —uses→ disambiguation  (x1)
- GraphRAG —extracts→ entity  (x1)
- GraphRAG —extracts→ 关系  (x1)
- GraphRAG —represents as→ node  (x1)
- GraphRAG —represents as→ edge  (x1)
- GraphRAG —aggregates nodes into→ graph communities  (x1)
- GraphRAG —produces→ community summary  (x1)
- community summary —summarizes→ graph communities  (x1)
- Text Chunk —is a segment of→ corpus  (x1)
- sensemaking task —requires understanding of→ corpus  (x1)
- vector RAG —is a kind of→ RAG system  (x1)
- RQ-RAG —is a kind of→ RAG system  (x1)
- HyDE —is a kind of→ RAG system  (x1)
- GraphRAG —is a kind of→ RAG system  (x1)
- GraphRAG —生成→ community summary  (x1)
- GraphRAG —聚合为→ 社区  (x1)
- GraphRAG —与之无关但被比较评估→ LLM-based multi-dimensional comparison method  (x1)
- LightRAG —使用→ nano vector database  (x1)
- LightRAG —设置为→ Chunk Size  (x1)
- LightRAG —设置为→ gleaning parameter  (x1)
- LLM-based multi-dimensional comparison method —包括→ comprehensiveness  (x1)
- LLM-based multi-dimensional comparison method —包括→ diversity  (x1)
- LLM-based multi-dimensional comparison method —包括→ empowerment  (x1)
- LLM-based multi-dimensional comparison method —包括→ Overall  (x1)
- Overall —综合→ comprehensiveness  (x1)
- Overall —综合→ diversity  (x1)
- Overall —综合→ empowerment  (x1)
- win rate —由之计算→ LLM-based multi-dimensional comparison method  (x1)
- RAG system —is compared against→ LightRAG  (x1)
- RQ-RAG —is compared against→ LightRAG  (x1)
- HyDE —is compared against→ LightRAG  (x1)
- LightRAG —is evaluated on→ comprehensiveness  (x1)
- LightRAG —is evaluated on→ diversity  (x1)
- LightRAG —is evaluated on→ empowerment  (x1)
- LightRAG —is evaluated on→ Overall  (x1)
- LightRAG —is a kind of→ Graph-enhanced RAG system  (x1)
- GraphRAG —is a kind of→ Graph-enhanced RAG system  (x1)
- RAG system —is a kind of→ chunk-based retrieval method  (x1)
- HyDE —is a kind of→ chunk-based retrieval method  (x1)
- vector RAG —is a kind of→ chunk-based retrieval method  (x1)
- Graph-enhanced RAG system —captures→ semantic dependency  (x1)
- Graph-enhanced RAG system —improves→ generalization  (x1)
- chunk-based retrieval method —is less effective on→ large-scale corpus  (x1)
- diversity metric —is used to evaluate→ LightRAG  (x1)
- comprehensiveness —is used to evaluate→ LightRAG  (x1)
- empowerment —is used to evaluate→ LightRAG  (x1)
- dual-level retrieval system —includes→ 全局查询  (x1)
- graph index —supports→ dual-level retrieval system  (x1)
- LightRAG —outperforms→ GraphRAG  (x1)
- LightRAG —improves→ diversity metric  (x1)
- retrieval-augmented generation —结合→ 检索机制  (x1)
- retrieval-augmented generation —结合→ language models  (x1)
- retrieval-augmented generation —缓解局限→ large-scale language model  (x1)
- retrieval-augmented generation —用于处理→ knowledge-intensive tasks  (x1)
- 检索增强语言模型 —属于→ retrieval-augmented generation  (x1)
- 检索效率 —是研究重点→ retrieval-augmented generation  (x1)
- 可扩展性 —是挑战→ retrieval-augmented generation  (x1)
- 偏差 —是挑战→ retrieval-augmented generation  (x1)
- 伦理问题 —是挑战→ retrieval-augmented generation  (x1)
- 鲁棒性 —是未来改进方向→ retrieval-augmented generation  (x1)
- 社会影响 —是需要考虑的方面→ retrieval-augmented generation  (x1)
- 问答 —是应用领域→ retrieval-augmented generation  (x1)
- 摘要 —是应用领域→ retrieval-augmented generation  (x1)
- natural language generation —is a subfield of→ natural language processing  (x1)
- retrieval-augmented generation —includes→ 检索机制  (x1)
- sequence-to-sequence model —is used in→ natural language generation  (x1)
- hallucination —is a limitation of→ natural language generation  (x1)
- hallucination —can occur in→ sequence-to-sequence model  (x1)
- 检索增强生成 —integrates→ 检索机制  (x1)
- 检索增强生成 —integrates→ 生成模块  (x1)
- 检索机制 —leverages→ 稠密嵌入  (x1)
- 生成模块 —is often built using→ Transformer  (x1)
- 检索增强生成 —mitigates→ hallucination  (x1)
- 检索增强生成 —is used for→ Open-domain Question Answering  (x1)
- 检索增强生成 —is used for→ dialog system  (x1)
- 检索增强生成 —is used for→ 个性化推荐  (x1)
- hybrid model —combines→ retrieval-based system  (x1)
- hybrid model —combines→ generative model  (x1)
- DrQA —uses→ retrieval-based system  (x1)
- DrQA —is used for→ 问答  (x1)
- Retrieval-Augmented Language Model Pre-Training —is a milestone in→ retrieval-augmented generation  (x1)
- Retrieval-Augmented Language Model Pre-Training —combines→ retrieval-based system  (x1)
- Retrieval-Augmented Language Model Pre-Training —combines→ generative model  (x1)
- retrieval-augmented generation —supports→ factually grounded language generation  (x1)
- factually grounded language generation —reduces→ hallucination  (x1)
- hallucination —can lead to→ false statement  (x1)
- retrieval-augmented generation —is applied in→ Open-domain Question Answering  (x1)
- retrieval-augmented generation —is applied in→ dialog system  (x1)
- retrieval-augmented generation —uses→ Fusion-in-Decoder method  (x1)
- Query expansion —can refine→ Dense Passage Retriever  (x1)
- Contextual disambiguation —can refine→ Dense Passage Retriever  (x1)
- Query expansion —can improve→ Dense Passage Retriever  (x1)
- Contextual disambiguation —can improve→ Dense Passage Retriever  (x1)
- retrieval-augmented generation —includes→ 生成模块  (x1)
- 注意力机制 —can improve→ retrieval-augmented generation  (x1)
- hierarchical fusion technique —can improve→ retrieval-augmented generation  (x1)
- computational overhead —is a concern of→ retrieval-augmented generation  (x1)
- model pruning —reduces→ computational overhead  (x1)
- distillation —reduces→ computational overhead  (x1)
- artificial intelligence bias —is a kind of→ bias  (x1)
- large language model bias —is a kind of→ bias  (x1)
- retrieved passages —can amplify→ bias  (x1)
- retrieval-augmented generation —has→ computational overhead  (x1)
- retrieval-augmented generation —raises concerns about→ interpretability  (x1)
- retrieval-augmented generation —raises concerns about→ bias  (x1)
- retrieval-augmented generation —has component→ retriever  (x1)
- retrieval-augmented generation —has component→ text generation model  (x1)
- retriever —uses→ Dense Passage Retriever  (x1)
- retriever —uses→ BM25  (x1)
- retrieval-augmented generation —helps mitigate→ hallucination  (x1)
- retrieval-augmented generation —is used for→ 事实锚定  (x1)
- RAG system —contains→ retriever  (x1)
- retriever —fetches from→ retrieval corpus  (x1)
- BM25 —is used as→ retriever  (x1)
- Dense Passage Retriever —is used as→ retriever  (x1)
- document summarization —is a kind of→ knowledge-intensive tasks  (x1)
- knowledge-grounded dialogue —is a kind of→ knowledge-intensive tasks  (x1)
- RAG system —updates→ non-parametric knowledge source  (x1)
- BM25 —uses→ TF-IDF  (x1)
- Dense Passage Retriever —uses→ 稠密向量空间  (x1)
- Dense Passage Retriever —employs→ dual-encoder framework  (x1)
- dual-encoder framework —enables→ 最近邻搜索  (x1)
- 检索增强语言模型 —integrates with→ 预训练神经语言模型  (x1)
- 检索增强语言模型 —is a kind of→ Dense Passage Retriever  (x1)
- Retrieval-Augmented Language Model Pre-Training —updates→ retriever  (x1)
- Retrieval-Augmented Language Model Pre-Training —updates→ text generation model  (x1)
- Retrieval-Augmented Language Model Pre-Training —optimizes alongside→ retriever  (x1)
- Retrieval-Augmented Language Model Pre-Training —optimizes alongside→ text generation model  (x1)
- BERT-based cross-encoder —is used for→ re-ranking  (x1)
- Pointwise Ranking —is a type of→ Learning to rank  (x1)
- Pairwise Ranking —is a type of→ Learning to rank  (x1)
- Generation Component —can be implemented with→ T5  (x1)
- Generation Component —can be implemented with→ pre-trained seq2seq model  (x1)
- T5 —is evaluated on→ NaturalQuestions dataset  (x1)
- T5 —is evaluated on→ TriviaQA  (x1)
- pre-trained seq2seq model —is an example of→ denoising autoencoder  (x1)
- pre-trained seq2seq model —is used in→ retrieval-augmented generation  (x1)
- self-attention —is used within→ large-scale language model  (x1)
- cross attention —is used within→ large-scale language model  (x1)
- pre-trained seq2seq model —is trained as→ denoising autoencoder  (x1)
- pre-trained seq2seq model —can be paired with in→ retrieval-augmented generation  (x1)
- retrieval-augmented generation —includes→ RAG system  (x1)
- RAG system —uses→ Transformer  (x1)
- BERT —is an instance of→ Transformer  (x1)
- T5 —is an instance of→ Transformer  (x1)
- retriever —uses→ dense representation  (x1)
- retriever —outperforms→ TF-IDF  (x1)
- Retrieval-Augmented Language Model Pre-Training —is an approach to→ retrieval-augmented generation  (x1)
- audio-based RAG model —extends→ retrieval-augmented generation  (x1)
- audio-based RAG model —uses embeddings from→ Wav2Vec 2.0  (x1)
- video-based RAG model —extends→ retrieval-augmented generation  (x1)
- video-based RAG model —uses embeddings from→ I3D  (x1)
- video-based RAG model —uses embeddings from→ TimeSformer  (x1)
- multimodal RAG model —extends→ retrieval-augmented generation  (x1)
- multimodal RAG model —is exemplified by→ Flamingo  (x1)
- multimodal RAG model —uses→ cross-modal retrieval  (x1)
- retrieval as generation —extends→ retrieval-augmented generation  (x1)
- retrieval as generation —incorporates→ cross-modal retrieval  (x1)
- agentic Retrieval-Augmented Generation —uses→ hierarchical multi-agent architecture  (x1)
- hierarchical multi-agent architecture —includes→ sub-agent  (x1)
- sub-agent —uses→ smaller pre-trained language model  (x1)
- agentic Retrieval-Augmented Generation —uses→ shared knowledge repository  (x1)
- sub-agent —retrieves from→ shared knowledge repository  (x1)
- RULE —improves→ medical Vision-Language Model  (x1)
- RULE —introduces→ calibrated selection strategy  (x1)
- RULE —develops→ fine-tuning with human feedback  (x1)
- fine-tuning with human feedback —balances→ retrieved context  (x1)
- METRAG —uses→ LLM supervision  (x1)
- METRAG —generates→ utility-oriented thought  (x1)
- METRAG —incorporates→ task-adaptive summarizer  (x1)
- METRAG —generates→ knowledge-augmented content  (x1)
- Retrieval Augmented Fine-Tuning —is combined with→ chain of thought  (x1)
- FILCO —improves→ search relevance  (x1)
- Self-RAG —uses→ Reflection Token  (x1)
- data-centric retrieval-augmented generation workflow —employs→ prepare-then-rewrite-then-retrieve-then-read framework  (x1)
- data-centric retrieval-augmented generation workflow —introduces→ Meta Knowledge Summary  (x1)
- CommunityKG-RAG —depends on→ search relevance  (x1)
- CommunityKG-RAG —integrates→ graph communities  (x1)
- CommunityKG-RAG —is a kind of→ RAPTOR  (x1)
- RAPTOR —forms→ summary tree  (x1)
- Self-Route —routes to→ long-context language model  (x1)
- Self-Route —alternates with→ RAPTOR  (x1)
- LA-RAG —improves→ automatic speech recognition  (x1)
- LA-RAG —is a kind of→ retrieval-augmented generation  (x1)
- LA-RAG —is designed to enhance→ automatic speech recognition  (x1)
- LA-RAG —is used with→ large-scale language model  (x1)
- LA-RAG —leverages→ token-level speech data store  (x1)
- LA-RAG —uses→ speech-to-speech retrieval mechanism  (x1)
- retrieval-augmented generation —helps minimize→ hallucination  (x1)
- GraphRAG —depends on→ knowledge graph  (x1)
- GraphRAG —depends on→ subgraph retrieval  (x1)
- GraphRAG —depends on→ Structure-aware knowledge integration algorithm  (x1)
- subgraph retrieval —uses→ knowledge graph  (x1)
- fine-tuning —is used to adapt→ large-scale language model  (x1)
- distribution gap —complicates→ fine-tuning  (x1)
- fine-tuning —can cause→ hallucination  (x1)
- fine-tuning —can cause→ catastrophic forgetting  (x1)
- retrieval-augmented generation —leverages→ corpus  (x1)
- retrieval-augmented generation —includes→ passage retrieval  (x1)
- knowledge preparation —creates→ dense representation  (x1)
- passage retrieval —uses→ sparse bag-of-words matching  (x1)
- passage retrieval —uses→ Similarity function  (x1)
- integration —combines results of→ passage retrieval  (x1)
- hierarchical RAG —is a kind of→ retrieval-augmented generation  (x1)
- RQ-RAG —is a kind of→ retrieval-augmented generation  (x1)
- Self-RAG —is a kind of→ retrieval-augmented generation  (x1)
- retrieval-augmented generation —augments→ large-scale language model  (x1)
- knowledge augmentation —is used for→ retrieval-augmented generation  (x1)
- Self-RAG —depends on→ contextual awareness  (x1)
- RQ-RAG —depends on→ complex query understanding  (x1)
- chunking —can sacrifice→ contextual information  (x1)
- 上下文窗口 —limits→ long-range dependencies  (x1)
- 上下文窗口 —can disrupt→ logical flow  (x1)
- complex query understanding —requires→ multi-hop reasoning  (x1)
- sparse bag-of-words matching —fails to capture→ multi-hop reasoning  (x1)
- embedding matching —fails to capture→ multi-hop reasoning  (x1)
- contextual comprehension —depends on→ contextual information  (x1)
- context window truncation —disrupts→ semantic units  (x1)
- RAG pipeline —faces→ efficiency bottleneck  (x1)
- non-parametric knowledge source —contains→ domain-specific terminology  (x1)
- RAG pipeline —depends on→ 可扩展性  (x1)
- context window truncation —limits→ 可扩展性  (x1)
- GraphRAG —is a form of→ retrieval-augmented generation  (x1)
- knowledge-based GraphRAG —is a category of→ GraphRAG  (x1)
- LightRAG —is a category of→ GraphRAG  (x1)
- hybrid GraphRAG —is a category of→ GraphRAG  (x1)
- knowledge-based GraphRAG —uses→ knowledge graph  (x1)
- GraphRAG —extends→ RAG system  (x1)
- GraphRetriever —operates on→ knowledge graph  (x1)
- graph context-aware generation —depends on→ 知识集成方法  (x1)
- knowledge-based GraphRAG —是一个类别→ GraphRAG  (x1)
- 索引型GraphRAG —是一个类别→ GraphRAG  (x1)
- hybrid GraphRAG —是一个类别→ GraphRAG  (x1)
- graph index —用于→ GraphRAG  (x1)
- GraphRetriever —用于→ GraphRAG  (x1)
- graph context-aware generation —用于→ GraphRAG  (x1)
- RAG pipeline —与之对比→ GraphRAG  (x1)
- Non-graph RAG —uses→ chunking  (x1)
- Non-graph RAG —uses→ semantic search  (x1)
- knowledge-based GraphRAG —builds→ knowledge graph  (x1)
- knowledge-based GraphRAG —uses→ entity extraction  (x1)
- knowledge-based GraphRAG —uses→ relationship extraction  (x1)
- LightRAG —uses→ Topic node  (x1)
- LightRAG —uses→ Topic linking  (x1)
- LightRAG —uses→ Fact linking  (x1)
- Topic linking —connects→ Topic node  (x1)
- Fact linking —connects→ Topic node  (x1)
- subgraph retrieval —operates on→ knowledge graph  (x1)
- Subgraph pruning —refines→ subgraph retrieval  (x1)
- knowledge retrieval task —operates on→ knowledge graph  (x1)
- Knowledge organization —includes→ knowledge graph  (x1)
- Knowledge organization —includes→ chunking  (x1)
- Knowledge organization —includes→ document summarization  (x1)
- retrieval-augmented generation —includes→ information retrieval  (x1)
- RAG pipeline —includes→ knowledge preparation  (x1)
- RAG pipeline —includes→ information retrieval  (x1)
- RAG pipeline —includes→ integration  (x1)
- knowledge preparation —uses→ chunking  (x1)
- knowledge preparation —uses→ embedding function  (x1)
- embedding function —stores embeddings in→ 向量数据库  (x1)
- chunking —is guided by→ granularity optimization  (x1)
- chunking —uses→ recursive splits  (x1)
- chunking —uses→ sliding windows  (x1)
- chunking —uses→ Small-to-Big  (x1)
- indexing optimization —includes→ metadata-addition techniques  (x1)
- indexing optimization —includes→ 层次化索引  (x1)
- metadata-addition techniques —supports→ post-retrieval process  (x1)
- 层次化索引 —organizes content into→ parent-child relationships  (x1)
- 层次化索引 —inspired by→ graph view  (x1)
- GraphRAG —uses→ graph view  (x1)
- 向量数据库 —supports→ embedding matching  (x1)
- embedding matching —operates in→ 向量空间  (x1)
- GraphRAG —继承了→ 层次化索引  (x1)
- knowledge preparation —支撑→ information retrieval  (x1)
- re-ranking —被实现于→ EAR  (x1)
- 句子变换器 —被用于→ 混合检索方法  (x1)
- 近似邻居 —被识别为→ 混合检索方法  (x1)
- Knowledge Graph Construction from Corpus —is a kind of→ 知识图谱  (x1)
- GraphRAG with Existing Knowledge Graphs —is a kind of→ 知识图谱  (x1)
- hybrid GraphRAG —is a kind of→ GraphRAG  (x1)
- Similarity-based Retriever —is a kind of→ Retrieval Technique  (x1)
- Logical-based Retriever —is a kind of→ Retrieval Technique  (x1)
- GNN-based Retriever —is a kind of→ Retrieval Technique  (x1)
- LLM-based Retriever —is a kind of→ Retrieval Technique  (x1)
- RL-based Retriever —is a kind of→ Retrieval Technique  (x1)
- Retrieval Technique —is a part of→ knowledge retrieval task  (x1)
- Retrieval Strategy —is a part of→ knowledge retrieval task  (x1)
- Retrieval Strategy —includes→ Multi-round Retrieval  (x1)
- Retrieval Strategy —includes→ post-retrieval process  (x1)
- Retrieval Strategy —includes→ 混合检索方法  (x1)
- integration —includes→ fine-tuning  (x1)
- integration —includes→ language model meta-learning  (x1)
- integration —includes→ Graph-enhanced Chain-of-Thought  (x1)
- integration —includes→ Collaborative Knowledge Graph Refinement  (x1)
- fine-tuning —includes→ Node-level Knowledge  (x1)
- fine-tuning —includes→ Path-level Knowledge  (x1)
- fine-tuning —includes→ Subgraph-level Knowledge  (x1)
- LeanContext —is a kind of→ post-retrieval process  (x1)
- Self-RAG —is a kind of→ post-retrieval process  (x1)
- Self-RAG —包含→ 自我反思机制  (x1)
- FILCO —训练→ 上下文过滤模型  (x1)
- Selfmem —构建→ 记忆池  (x1)
- Selfmem —使用→ 迭代选择框架  (x1)
- SAIL —形成→ 指令微调数据集  (x1)
- RAG pipeline —依赖→ 向量数据库  (x1)
- 向量数据库 —检索→ 语义相似片段  (x1)
- 语义相似片段 —不足以回答→ 多跳问题  (x1)
- 块粒度 —影响处理→ 多跳问题  (x1)
- complex query understanding —需要→ 多跳推理  (x1)
- domain-specific knowledge —requires→ multi-hop reasoning  (x1)
- retrieval-augmented generation —often uses→ 向量数据库  (x1)
- 向量数据库 —stores→ chunking  (x1)
- nearest neighbor retrieval —is used in→ retrieval-augmented generation  (x1)
- 上下文窗口 —constrains→ retrieval-augmented generation  (x1)
- long-range dependencies —are limited by→ 上下文窗口  (x1)
- distributed domain knowledge —is made harder by→ chunking  (x1)
- distributed domain knowledge —lacks→ parent-child relationships  (x1)
- recursive splits —is used in→ retrieval-augmented generation  (x1)
- sliding windows —is used in→ retrieval-augmented generation  (x1)
- Small-to-Big —is used in→ retrieval-augmented generation  (x1)
- recursive splits —helps address→ long-range dependencies  (x1)
- sliding windows —helps address→ long-range dependencies  (x1)
- Small-to-Big —helps address→ long-range dependencies  (x1)
- nearest neighbor retrieval —limits capture of→ long-range dependencies  (x1)
- GraphRAG —leverages→ knowledge graph  (x1)
- GraphRAG —employs→ structural database  (x1)
- knowledge graph —is stored in→ structural database  (x1)