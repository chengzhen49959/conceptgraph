# Corpus pipeline test — corpus (24 docs)

- models: extract=`gpt-5.4-mini` judge=`gpt-5.4-mini` embed=`text-embedding-3-small`
- dedup: embeddings block top-5 within cosine dist 0.4, LLM match_concept decides

## Counts
- 24 docs -> 24 chunks -> 220 raw concepts (194 distinct names) -> **176 final concepts**
- dedup: new=176 · exact-name=0 · match calls=93 (merged 18 / judged-distinct 75)
- relations: 198 raw -> **193 after remap+dedup** · **21 clusters**

## Quality
- forbidden person-names (should be 0): **0** (ok **PASS**)
- glossary-leak descriptions: **0** (ok)
- sentence-punctuation names: **0** (ok)

## Cross-document concepts (26) — merged across ≥2 papers

The dedup payoff: one node, many sources.

- **retrieval-augmented generation** — 7 docs, x8 · aliases: RAG, retrieval-augmented language model  `2005.11401, 2208.03299, 2404.16130, 2405.16506, 2410.05779, 2410.12837, 2501.13958`
- **large language model** — 5 docs, x5 · aliases: LLM, 大语言模型  `2201.11903, 2303.18223, 2410.05779, 2410.12837, 2501.13958`
- **open-domain question answering** — 4 docs, x4 · aliases: Open-QA, open domain question answering  `2002.08909, 2004.04906, 2005.11401, 2007.01282`
- **Transformer** — 3 docs, x3 · aliases: Transformer architecture  `1706.03762, 2106.09685, 2303.18223`
- **GPT-3** — 3 docs, x3 · aliases: Generative Pre-trained Transformer 3  `2005.14165, 2106.09685, 2109.07958`
- **question-answering** — 3 docs, x3 · aliases: QA, question answering  `2005.14165, 2208.03299, 2410.12837`
- **Graph view** — 3 docs, x3 · aliases: graph structure, Graph-structured knowledge representation  `2405.16506, 2410.05779, 2501.13958`
- **dense representation** — 2 docs, x3 · aliases: dense representations, embedding, vector representation  `2004.04906, 2410.05779`
- **BERT** — 2 docs, x2 · aliases: Bidirectional Encoder Representations from Transformers  `1810.04805, 1907.11692`
- **RoBERTa** — 2 docs, x2  `1907.11692, 2106.09685`
- **training data size** — 2 docs, x2 · aliases: dataset size  `1907.11692, 2001.08361`
- **pre-trained neural language model** — 2 docs, x2 · aliases: LM, 预训练语言模型  `1911.00172, 2303.18223`
- **domain adaptation** — 2 docs, x2  `1911.00172, 2005.14165`
- **model size** — 2 docs, x2 · aliases: 模型规模  `2001.08361, 2303.18223`
- **implicit knowledge storage** — 2 docs, x2 · aliases: parametric memory  `2002.08909, 2005.11401`
- **passage retrieval** — 2 docs, x2  `2004.04906, 2007.01282`
- **dense retriever** — 2 docs, x2 · aliases: pre-trained neural retriever  `2004.04906, 2005.11401`
- **few-shot learning** — 2 docs, x2 · aliases: few-shot performance  `2005.14165, 2208.03299`
- **fine-tuning** — 2 docs, x2  `2005.14165, 2109.07958`
- **Natural Questions** — 2 docs, x2 · aliases: NQ  `2007.01282, 2208.03299`
- **GPT-2** — 2 docs, x2  `2106.09685, 2109.07958`
- **truthfulness** — 2 docs, x2  `2109.07958, 2203.02155`
- **knowledge-intensive task** — 2 docs, x2  `2208.03299, 2410.12837`
- **GraphRAG** — 2 docs, x2 · aliases: Graph Retrieval-Augmented Generation  `2404.16130, 2405.16506`
- **Multi-hop reasoning** — 2 docs, x2  `2405.16506, 2501.13958`
- **retrieval process** — 2 docs, x2 · aliases: retrieval processes, retrieval mechanism  `2410.05779, 2410.12837`

## Clusters (21) — vs the A–E reading-list themes

### Retrieval-Augmented Generation  (19)
retrieval-augmented generation, non-parametric memory, pre-trained seq2seq model, question-answering, Atlas, knowledge-intensive task, fact checking, document index, MMLU, KILT, query-focused summarization, GraphRAG, entity knowledge graph, community summary, global sensemaking question, Textual subgraph retrieval, Divide-and-conquer strategy, retrieval process … (+1)

### Open-Domain QA  (17)
open-domain question answering, passage retrieval, sparse vector space model, TF-IDF, BM25, dual-encoder framework, dense retriever, Lucene-BM25 system, top-20 passage retrieval accuracy, end-to-end QA system, open-domain QA benchmark, dense vector index, retrieve-and-extract architecture, knowledge-intensive NLP task, evidence aggregation, Natural Questions, TriviaQA

### Transformer Fine-Tuning  (17)
BERT, RoBERTa, BERT pretraining, hyperparameter choice, GLUE, RACE, SQuAD, Low-Rank Adaptation, full fine-tuning, pre-trained model weights, rank decomposition matrices, adapters, inference latency, rank-deficiency, language model adaptation, PyTorch, DeBERTa

### Neural Language Modeling  (14)
recurrent neural network, convolutional neural network, encoder-decoder architecture, attention mechanism, Transformer, English constituency parsing, kNN-LM, pre-trained neural language model, k-nearest neighbors model, embedding space, nearest neighbor datastore, nearest neighbor search, rare pattern prediction, 神经语言模型

### Scaling Laws  (14)
training data size, empirical scaling laws, cross-entropy loss, power law, model size, compute, network width, network depth, overfitting, training speed, compute budget, sample efficiency, compute-efficient training, convergence

### Graph-Based Retrieval  (13)
dense representation, Graph context-aware generation, Text view, Graph view, Textual graph, Multi-hop reasoning, Graph reasoning benchmark, related entity, relationship, Graph-based retrieval-augmented generation, Graph-based retrieval technique, Structure-aware knowledge integration algorithm, Context-preserving knowledge retrieval

### Language Model Reasoning  (12)
chain of thought, chain of thought prompting, large language model, few-shot demonstration, arithmetic reasoning, commonsense reasoning, symbolic reasoning, GSM8K benchmark, math word problem, fine-tuned GPT-3, ChatGPT, generative language model

### Language Model Tasks  (12)
domain adaptation, few-shot learning, language model, GPT-3, autoregressive language model, translation, cloze task, unscrambling words, 3-digit arithmetic, news article generation, web corpus, Adam

### Language Model Truthfulness  (9)
GPT-2, TruthfulQA, truthfulness, false beliefs, imitation of text, training distribution, scaling up models, GPT-Neo, T5

### Retrieval-Augmented Systems  (9)
external knowledge source, LightRAG, text indexing, dual-level retrieval system, low-level knowledge discovery, high-level knowledge discovery, incremental update algorithm, retrieval accuracy, retrieval efficiency

### RLHF Alignment  (9)
instruction following, human feedback, labeler demonstrations, supervised learning, reinforcement learning from human feedback, InstructGPT, alignment, toxic output generation, model rankings

### Hallucination Management  (7)
large language model hallucination, hallucination detection, hallucination benchmark, hallucination mitigation, retrieval-augmented large language model, large vision-language model hallucination, knowledge boundary

### Knowledge Retrieval Models  (6)
Retrieval-Augmented Language Model pre-training, latent knowledge retriever, masked language modeling, backpropagation through retrieval, implicit knowledge storage, explicit knowledge storage

### Long-Context Retrieval  (4)
multi-document question answering, key-value retrieval, long-context language model, input context

### Model Training  (3)
pre-training, fine-tuning, training objectives

### Machine Translation Evaluation  (3)
BLEU, WMT 2014 English-to-German translation task, WMT 2014 English-to-French translation task

### Approximate Nearest Neighbor  (3)
Approximate Nearest Neighbor Negative Contrastive Estimation, Approximate Nearest Neighbor, Approximate Nearest Neighbor index

### Sentence Similarity  (2)
BERT-Siamese model, dot product

### Data Provenance  (1)
provenance

### 统计语言模型  (1)
统计语言模型

### Deployment  (1)
deployment

## Documents (24)

- `1706.03762` — Attention Is All You Need  (1 chunks)
- `1810.04805` — BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding  (1 chunks)
- `1907.11692` — RoBERTa: A Robustly Optimized BERT Pretraining Approach  (1 chunks)
- `1911.00172` — Generalization through Memorization: Nearest Neighbor Language Models  (1 chunks)
- `2001.08361` — Scaling Laws for Neural Language Models  (1 chunks)
- `2002.08909` — REALM: Retrieval-Augmented Language Model Pre-Training  (1 chunks)
- `2004.04906` — Dense Passage Retrieval for Open-Domain Question Answering  (1 chunks)
- `2005.11401` — Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks  (1 chunks)
- `2005.14165` — Language Models are Few-Shot Learners  (1 chunks)
- `2007.00808` — Approximate Nearest Neighbor Negative Contrastive Learning for Dense Text Retrieval  (1 chunks)
- `2007.01282` — Leveraging Passage Retrieval with Generative Models for Open Domain Question Answering  (1 chunks)
- `2106.09685` — LoRA: Low-Rank Adaptation of Large Language Models  (1 chunks)
- `2109.07958` — TruthfulQA: Measuring How Models Mimic Human Falsehoods  (1 chunks)
- `2201.11903` — Chain-of-Thought Prompting Elicits Reasoning in Large Language Models  (1 chunks)
- `2203.02155` — Training language models to follow instructions with human feedback  (1 chunks)
- `2208.03299` — Atlas: Few-shot Learning with Retrieval Augmented Language Models  (1 chunks)
- `2303.18223` — A Survey of Large Language Models  (1 chunks)
- `2307.03172` — Lost in the Middle: How Language Models Use Long Contexts  (1 chunks)
- `2311.05232` — A Survey on Hallucination in Large Language Models: Principles, Taxonomy, Challenges, and Open Questions  (1 chunks)
- `2404.16130` — From Local to Global: A Graph RAG Approach to Query-Focused Summarization  (1 chunks)
- `2405.16506` — GRAG: Graph Retrieval-Augmented Generation  (1 chunks)
- `2410.05779` — LightRAG: Simple and Fast Retrieval-Augmented Generation  (1 chunks)
- `2410.12837` — A Comprehensive Survey of Retrieval-Augmented Generation (RAG): Evolution, Current Landscape and Future Directions  (1 chunks)
- `2501.13958` — A Survey of Graph Retrieval-Augmented Generation for Customized Large Language Models  (1 chunks)

## All final concepts (176) — by #docs then mentions

### retrieval-augmented generation  [7 docs, x8] [judged-distinct]  · aliases: RAG, retrieval-augmented language model
A neural generation approach that combines a pretrained parametric model with retrieval from an external non-parametric memory. During generation, the model conditions on retrieved documents or passages so it can produce more factual, knowledge-grounded outputs. Its behavior can be influenced by changing the retrieval source without modifying only the model parameters.  · merged: retrieval-augmented language model

### large language model  [5 docs, x5] [judged-distinct]  · aliases: LLM, 大语言模型
大语言模型是指参数规模显著增大的预训练语言模型，通常通过在大规模文本语料上训练获得。随着参数与训练规模的扩展，这类模型往往具备更强的自然语言理解与生成能力，并可能在提示适当时表现出更复杂的能力（如一定程度的涌现或推理）。  · merged: 大语言模型

### open-domain question answering  [4 docs, x4] [new]  · aliases: Open-QA, open domain question answering
Open-domain question answering is a question answering setting where the model answers questions using information from a large, unstructured corpus rather than a provided passage or a closed, narrow domain. It typically requires retrieving relevant evidence from broad sources and then generating or selecting the correct answer, often relying on general-world knowledge when necessary.  · merged: open domain question answering

### Transformer  [3 docs, x3] [new]  · aliases: Transformer architecture
A Transformer is a neural network architecture for sequence modeling built around attention-based layers. It removes the need for recurrence and convolution, enabling highly parallel computation and strong performance on tasks such as machine translation and language modeling. Its modular layer structure also supports inserting adaptation modules into the network for specialized behavior.  · merged: Transformer architecture

### GPT-3  [3 docs, x3] [new]  · aliases: Generative Pre-trained Transformer 3
An autoregressive language model with 175 billion parameters designed to generate and predict text from context. It is notable for strong task-agnostic few-shot performance when prompted with examples in text.

### question-answering  [3 docs, x3] [new]  · aliases: QA, question answering
A language task in which a system must produce an answer to a natural-language question, often by locating relevant information in a passage or knowledge source and synthesizing it into a concise response. It is used to evaluate the model’s question understanding, information retrieval, and comprehension-based reasoning.  · merged: question answering

### Graph view  [3 docs, x3] [judged-distinct]  · aliases: graph structure, Graph-structured knowledge representation
A graph view is a representation of graph-structured information organized as nodes and edges, where nodes denote entities and edges denote relationships. It explicitly encodes how entities are connected, supporting retrieval and reasoning that rely on relational context, including hierarchical or interconnected structures when present.  · merged: graph structure, Graph-structured knowledge representation

### dense representation  [2 docs, x3] [new]  · aliases: dense representations, embedding, vector representation
A dense (continuous) learned vector representation that encodes text, words, entities, or other discrete items in a continuous vector space. The embedding is trained so that semantically or conceptually related items are close under a chosen similarity measure, enabling similarity-based retrieval and robust matching beyond exact term overlap.  · merged: embedding, vector representation

### BERT  [2 docs, x2] [new]  · aliases: Bidirectional Encoder Representations from Transformers
BERT is a language representation model based on deep bidirectional Transformers. It is pre-trained on unlabeled text by conditioning on both left and right context in all layers, and then fine-tuned with a small task-specific output layer for downstream language understanding tasks.

### RoBERTa  [2 docs, x2] [judged-distinct]
RoBERTa is a robustly optimized BERT pretraining approach that revisits the original BERT training recipe and systematically studies the effects of key training choices. It is designed to improve downstream language model performance by optimizing pretraining setup and data usage.

### training data size  [2 docs, x2] [new]  · aliases: dataset size
Training data size is the amount of data available for fitting a model during pretraining or training. It affects how low the model’s loss can reach and how prone it is to overfitting, and it interacts with model size and compute in scaling relationships.  · merged: dataset size

### pre-trained neural language model  [2 docs, x2] [new]  · aliases: LM, 预训练语言模型
预训练神经语言模型是指先在大规模语料上进行预训练学习，再将其用于下游任务或进一步适配的语言模型。它通过学习通用的语言表示来建模词序列的概率分布，从而在多种自然语言处理任务上提升性能。  · merged: 预训练语言模型

### domain adaptation  [2 docs, x2] [new]
The process of adjusting a model so that it works better on a target domain whose data distribution differs from the original training domain. It can be achieved by changing the support data or retrieval source rather than retraining the whole model.

### model size  [2 docs, x2] [new]  · aliases: 模型规模
指机器学习模型的规模，通常用参数数量、层数或整体容量等指标来衡量。增大模型规模往往能提升模型的表达能力与性能，但同时会显著增加训练所需的计算量与存储成本，并影响样本效率与训练损失等表现。  · merged: 模型规模

### implicit knowledge storage  [2 docs, x2] [new]  · aliases: parametric memory
The storage of factual information in the internal parameters (weights) of a neural network rather than in an explicit external memory. The knowledge is distributed across the model and is accessed indirectly through the network’s computations, enabling generation or prediction from learned internal representations rather than providing directly readable facts.  · merged: parametric memory

### passage retrieval  [2 docs, x2] [new]
The task of selecting candidate passages from a large collection that are likely to contain the answer to a question. It serves as an initial filtering step in open-domain question answering and must balance effectiveness with efficiency.

### dense retriever  [2 docs, x2] [judged-distinct]  · aliases: pre-trained neural retriever
A dense retriever is a retrieval model that maps queries and documents (or passages) into a shared vector embedding space, then retrieves items by measuring similarity between their embeddings. Instead of relying on sparse lexical overlap, it ranks candidates based on vector-space similarity, often using a neural encoder. It is commonly used as a first-stage component to fetch relevant passages from a large collection for a downstream generator or answering system.  · merged: pre-trained neural retriever

### few-shot learning  [2 docs, x2] [new]  · aliases: few-shot performance
A learning setting in which a model must perform a new task from only a few examples or simple instructions. It aims to approximate human-like adaptation without requiring large task-specific training sets.

### fine-tuning  [2 docs, x2] [new]
A training process that adapts a pre-trained model to a particular task using task-specific labeled examples. It specializes the model beyond its general pre-training.

### Natural Questions  [2 docs, x2] [new]  · aliases: NQ
Natural Questions is a benchmark for open-domain question answering built from real Google search queries and associated answers. It is used to evaluate whether systems can retrieve and use relevant evidence from large text collections.

### GPT-2  [2 docs, x2] [judged-distinct]
A transformer-based language model used as a benchmark for evaluating adaptation methods. It is commonly used to compare fine-tuning approaches on language generation tasks.

### truthfulness  [2 docs, x2] [judged-distinct]
The degree to which generated answers are factually correct rather than misleading or false. In language models, it concerns whether responses avoid repeating incorrect information learned from data or imitation.

### knowledge-intensive task  [2 docs, x2] [judged-distinct]
A task whose successful solution depends heavily on access to factual or world knowledge rather than only pattern recognition or local reasoning. Question answering and fact checking are common examples.

### GraphRAG  [2 docs, x2] [new]  · aliases: Graph Retrieval-Augmented Generation
GraphRAG is a retrieval-augmented generation approach for graph-structured documents. It builds a graph index from source content, retrieves relevant subgraphs or neighborhoods, and combines their textual information with the graph’s topological context to support more informed generation. It typically also produces community-level summaries of related entities to answer both local (specific) and global (broader) questions over large corpora.  · merged: Graph Retrieval-Augmented Generation

### Multi-hop reasoning  [2 docs, x2] [new]
A reasoning process that reaches an answer by chaining together multiple intermediate facts or relations. It is commonly used when information is distributed across several connected pieces of evidence.

### retrieval process  [2 docs, x2] [judged-distinct]  · aliases: retrieval processes, retrieval mechanism
The procedure for finding, selecting, and returning information relevant to a query from a stored collection or external corpus. In retrieval-augmented systems, it provides evidence to the generator to ground its responses and improve factuality.   · merged: retrieval mechanism

### latent knowledge retriever  [1 docs, x2] [judged-distinct]  · aliases: document retrieval
A latent knowledge retriever is a module that selects relevant documents or passages from a large text corpus in response to an input query or context. It provides external evidence or background knowledge to downstream language models so they can consult information beyond what is stored in their parameters.  · merged: document retrieval

### false beliefs  [1 docs, x2] [new]  · aliases: misconceptions
Widely held but incorrect ideas about a topic that can lead people to reason or answer questions wrongly. In evaluation settings, such false beliefs may be used to construct questions that test whether a model reproduces human-like mistakes, and in language models they can be reinforced by training text, resulting in plausible but false answers.  · merged: misconceptions

### recurrent neural network  [1 docs, x1] [new]  · aliases: recurrent neural networks, RNNs
A neural network architecture that processes sequences one step at a time while carrying forward a hidden state that summarizes previous inputs. This recurrence makes it suitable for ordered data, but it limits parallelization because later steps depend on earlier ones.

### convolutional neural network  [1 docs, x1] [new]  · aliases: convolutional neural networks, CNNs
A neural network architecture that uses learned convolutional filters to detect local patterns in structured inputs such as images or sequences. It shares parameters across positions and can exploit local regularities efficiently.

### encoder-decoder architecture  [1 docs, x1] [new]  · aliases: encoder-decoder configuration
A neural network design in which one component encodes an input sequence into an internal representation and a second component decodes that representation into an output sequence. It is widely used for sequence-to-sequence tasks such as translation.

### attention mechanism  [1 docs, x1] [new]  · aliases: attention
A method that lets a model weight different parts of an input or intermediate representation according to their relevance for a current prediction. It improves sequence modeling by providing direct, content-based access to information without relying only on a fixed-size summary.

### BLEU  [1 docs, x1] [new]  · aliases: Bilingual Evaluation Understudy
An automatic evaluation metric for machine translation that measures the overlap between a candidate translation and one or more reference translations. Higher scores generally indicate closer agreement with the references.

### WMT 2014 English-to-German translation task  [1 docs, x1] [new]  · aliases: WMT 2014 En-De translation task
A standard machine translation benchmark from the 2014 Workshop on Machine Translation for translating English text into German. It is used to compare the quality and efficiency of translation systems under a common test setting.

### WMT 2014 English-to-French translation task  [1 docs, x1] [judged-distinct]  · aliases: WMT 2014 En-Fr translation task
A standard machine translation benchmark from the 2014 Workshop on Machine Translation for translating English text into French. It is used to compare translation systems and report state-of-the-art performance under a shared evaluation setup.

### English constituency parsing  [1 docs, x1] [new]  · aliases: constituency parsing
A syntactic parsing task that analyzes an English sentence into a hierarchy of nested constituents such as noun phrases and verb phrases. The output is a phrase-structure tree showing how words group into larger grammatical units.

### BERT pretraining  [1 docs, x1] [judged-distinct]
BERT pretraining is the process of training a BERT-style language model on large text corpora before task-specific fine-tuning. It is intended to learn general language representations that transfer well to many downstream tasks.

### hyperparameter choice  [1 docs, x1] [new]  · aliases: hyperparameter choices
A hyperparameter choice is a selection of training settings specified before optimization, such as learning rate, batch size, or schedule. These choices can strongly affect model convergence and final performance, even when the model architecture and data are fixed.

### GLUE  [1 docs, x1] [new]  · aliases: General Language Understanding Evaluation
GLUE is a benchmark suite for evaluating general language understanding systems across multiple natural language processing tasks. It is used to compare models on standardized tests of linguistic and reasoning abilities.

### RACE  [1 docs, x1] [new]
RACE is a reading comprehension benchmark constructed from English exams, designed to test a model's ability to answer questions based on passages. It emphasizes understanding of longer contexts and inference over text.

### SQuAD  [1 docs, x1] [new]  · aliases: Stanford Question Answering Dataset
SQuAD is a question answering benchmark built from Wikipedia articles and human-generated questions. It evaluates a model's ability to extract or identify answer spans from a context passage.

### kNN-LM  [1 docs, x1] [new]  · aliases: k-nearest neighbors language model, nearest neighbor language model, k-nearest neighbors LM
A language model that augments a pre-trained neural language model by linearly interpolating its predictions with a k-nearest neighbors model. It retrieves similar contexts from a datastore in embedding space to improve next-word prediction without additional training.

### k-nearest neighbors model  [1 docs, x1] [judged-distinct]  · aliases: kNN model
A predictive model that makes decisions by retrieving the k closest stored examples to a query and combining their information. In language modeling, it can provide next-token evidence from similar contexts instead of relying only on parametric weights.

### embedding space  [1 docs, x1] [new]  · aliases: LM embedding space
A vector space in which linguistic items are represented as continuous embeddings so that geometric distance reflects similarity. Nearby points in the space correspond to contexts or sequences that the model considers alike.

### nearest neighbor datastore  [1 docs, x1] [judged-distinct]  · aliases: datastore
A stored collection of examples that can be searched for the nearest neighbors of a query representation. In language modeling, it supplies retrieved contexts and targets that can be combined with model predictions at inference time.

### nearest neighbor search  [1 docs, x1] [judged-distinct]
A retrieval procedure that finds the stored items closest to a query according to a distance measure. It is used to identify similar contexts or examples that can inform a model's prediction.

### rare pattern prediction  [1 docs, x1] [new]  · aliases: prediction of rare patterns
The ability to predict infrequent sequences or structures that occur only sparsely in training data. In language modeling, this often includes unusual word combinations and low-frequency factual associations.

### empirical scaling laws  [1 docs, x1] [new]
Regular quantitative relationships that describe how a model’s performance changes as key resources such as model size, dataset size, or compute scale up. In language modeling, they are used to predict performance trends across many orders of magnitude and to guide resource allocation.

### cross-entropy loss  [1 docs, x1] [new]
A loss function that measures the difference between predicted probability distributions and the true target distribution. In language modeling, it is a standard measure of performance and uncertainty, with lower values indicating better predictive accuracy.

### power law  [1 docs, x1] [new]
A functional relationship in which one quantity varies as a constant times another quantity raised to an exponent. In scaling analyses, power laws capture smooth, predictable changes over wide ranges of model size, data size, or compute.

### compute  [1 docs, x1] [new]
The total computational resources consumed during training, typically measured in operations or similar cost units. It constrains feasible model and data choices and determines the tradeoff between training scale and efficiency.

### network width  [1 docs, x1] [new]
The number of units or channels in a neural network layer. It is an architectural parameter that can affect capacity, but within a wide range it has only a minimal effect compared with the dominant scaling variables.

### network depth  [1 docs, x1] [judged-distinct]
The number of layers in a neural network. It is an architectural parameter that can affect representational capacity, but within a wide range it has only a minimal effect compared with the dominant scaling variables.

### overfitting  [1 docs, x1] [new]
The tendency of a model to fit idiosyncrasies of the training set that do not generalize well. It depends on the balance between model size and dataset size and can be estimated with simple scaling equations.

### training speed  [1 docs, x1] [new]
The rate at which a model’s loss improves during optimization. It depends on model size and can be characterized by simple equations in scaling analyses.

### compute budget  [1 docs, x1] [judged-distinct]
A fixed allowance of computational resources available for training. It imposes a constraint that must be divided among model size, data size, and training duration to achieve the best result.

### sample efficiency  [1 docs, x1] [new]
The ability of a model to achieve strong performance using relatively little training data. Higher sample efficiency means that a given amount of data produces more improvement in loss or accuracy.

### compute-efficient training  [1 docs, x1] [judged-distinct]
A training strategy that seeks the best possible performance for a fixed amount of compute. It typically involves choosing model size, dataset size, and training duration to maximize return on computational investment.

### convergence  [1 docs, x1] [new]
The state in which training has largely exhausted further improvement under the optimization process. Stopping before convergence can be preferable when compute is limited and additional training yields diminishing returns.

### Retrieval-Augmented Language Model pre-training  [1 docs, x1] [judged-distinct]  · aliases: REALM
A pre-training approach for language models that augments parametric memory with document retrieval. It trains the model to fetch relevant text from a large corpus so knowledge can be accessed more modularly and interpreted more directly.

### masked language modeling  [1 docs, x1] [new]  · aliases: MLM
A self-supervised learning objective in which some tokens in an input sequence are hidden and the model is trained to predict them. It is widely used to learn language representations from unlabeled text.

### backpropagation through retrieval  [1 docs, x1] [new]
A training approach that propagates gradients through a retrieval operation so the retrieval component can be optimized end to end. It is used when the model must learn which documents to retrieve as part of the prediction process.

### explicit knowledge storage  [1 docs, x1] [judged-distinct]
The storage of factual information in an external, inspectable memory such as retrieved documents or a structured knowledge source. This form of storage makes the source of information easier to access and interpret.

### sparse vector space model  [1 docs, x1] [new]  · aliases: sparse vector space models
A retrieval model that represents text as a sparse vector over terms, assigning nonzero weight only to a small subset of vocabulary items. Such models are effective for lexical matching and are widely used in traditional information retrieval systems.

### TF-IDF  [1 docs, x1] [new]  · aliases: term frequency-inverse document frequency
A term-weighting scheme that scores terms by combining their frequency in a document with their inverse frequency across a corpus. It is used to emphasize informative words while downweighting common terms in retrieval and text analysis.

### BM25  [1 docs, x1] [new]  · aliases: Okapi BM25
A ranking function used in information retrieval that estimates how well a document matches a query based on term overlap and term saturation effects. It is a standard sparse retrieval method and is often a strong baseline for passage ranking.

### dual-encoder framework  [1 docs, x1] [new]  · aliases: dual encoder framework, two-tower model
A neural retrieval architecture that encodes a query and a candidate passage separately into vector representations. Relevance is computed by comparing the two vectors, which makes large-scale retrieval efficient because passage representations can be precomputed.

### Lucene-BM25 system  [1 docs, x1] [judged-distinct]  · aliases: Lucene BM25 system
A retrieval system built with the Lucene search engine and BM25 ranking. It is commonly used as a strong sparse-retrieval baseline for passage ranking and document search.

### top-20 passage retrieval accuracy  [1 docs, x1] [judged-distinct]  · aliases: top-20 accuracy
An evaluation metric measuring whether at least one correct passage appears among the top 20 retrieved passages. It reflects how well a retrieval system surfaces relevant evidence early in the ranked list.

### end-to-end QA system  [1 docs, x1] [new]  · aliases: end-to-end question answering system
A question answering system that performs the full pipeline from retrieving evidence to producing an answer. Its performance depends on both retrieval quality and answer prediction quality.

### open-domain QA benchmark  [1 docs, x1] [judged-distinct]  · aliases: open-domain QA benchmarks
A standardized evaluation dataset or suite used to compare open-domain question answering systems. It provides common tasks and metrics for measuring retrieval and answer quality across models.

### non-parametric memory  [1 docs, x1] [judged-distinct]
An external memory store that is accessed directly rather than encoded into model weights. It typically contains explicit items such as documents or vectors and can be updated independently of the generator.

### pre-trained seq2seq model  [1 docs, x1] [judged-distinct]  · aliases: sequence-to-sequence model, seq2seq model
A sequence-to-sequence neural model pretrained on large text corpora and then adapted to downstream tasks. It maps an input sequence to an output sequence, making it suitable for tasks such as generation and question answering.

### dense vector index  [1 docs, x1] [judged-distinct]
An index that represents items as dense embedding vectors to support similarity-based retrieval. It allows fast nearest-neighbor access to passages or documents using continuous representations rather than sparse lexical matching.

### retrieve-and-extract architecture  [1 docs, x1] [judged-distinct]
A knowledge-intensive NLP architecture that first retrieves relevant passages and then extracts the answer from them. It is designed to ground predictions in external text instead of generating answers only from model parameters.

### knowledge-intensive NLP task  [1 docs, x1] [new]
A natural language processing task that depends heavily on factual world knowledge and precise information access. Such tasks often expose the limits of purely parametric models and benefit from retrieval over external sources.

### provenance  [1 docs, x1] [new]
Information about the source or origin of a model's output or decision. In language systems, provenance helps show where a generated fact or answer came from and supports transparency and verification.

### language model  [1 docs, x1] [judged-distinct]
A probabilistic model that assigns likelihoods to sequences of text and can generate or predict words based on preceding context. Language models are used to model and produce natural language.

### pre-training  [1 docs, x1] [judged-distinct]
A training stage in which a model is first fit on a large corpus of general data before being adapted to specific tasks. It is used to learn broad linguistic patterns and representations.

### autoregressive language model  [1 docs, x1] [judged-distinct]
A language model that generates text token by token by conditioning each next token on the preceding tokens. This formulation is commonly used for text generation and conditional prediction.

### translation  [1 docs, x1] [new]
A language task that maps text from one language into another while preserving meaning. It is a standard benchmark for evaluating natural language processing systems.

### cloze task  [1 docs, x1] [new]
A task in which a system must fill in a missing word or span in a sentence or passage. It evaluates how well the model uses context to infer the omitted content.

### unscrambling words  [1 docs, x1] [new]
A language task that requires restoring a scrambled sequence of letters or words to its intended form. It tests pattern recognition and on-the-fly reasoning over character or token order.

### 3-digit arithmetic  [1 docs, x1] [new]
A reasoning task involving arithmetic operations on numbers with three digits. It is used to test whether a model can carry out exact symbolic computation from context.

### news article generation  [1 docs, x1] [new]
The generation of news-style articles in natural language. It is used to evaluate whether a model can produce coherent, realistic text in a specific genre.

### web corpus  [1 docs, x1] [new]  · aliases: web corpora, large web corpus
A large collection of text gathered from the web and used as training data for language models. Web corpora are broad and diverse but may contain noisy or duplicated content.

### Approximate Nearest Neighbor Negative Contrastive Estimation  [1 docs, x1] [judged-distinct]  · aliases: ANCE
A training mechanism for dense retrieval models that selects negative examples from an approximate nearest neighbor index built over the corpus. By continually refreshing the index during learning, it surfaces harder and more realistic negatives that better match the distribution of irrelevant documents seen at test time.

### Approximate Nearest Neighbor  [1 docs, x1] [judged-distinct]  · aliases: ANN
A method for finding items in a large space that are close to a query item without computing exact distances to every candidate. It is commonly used to speed up similarity search by trading a small amount of precision for much higher efficiency.

### Approximate Nearest Neighbor index  [1 docs, x1] [judged-distinct]  · aliases: ANN index
An index structure organized to support approximate nearest neighbor search over a collection of items. It enables fast retrieval of likely close candidates and is often updated as the underlying representations change.

### BERT-Siamese model  [1 docs, x1] [new]  · aliases: BERT Siamese DR model
A Siamese neural retrieval architecture that uses BERT to encode a query and a document into comparable vector representations. Relevance is then estimated from the similarity between the two embeddings, typically with a simple scoring function such as a dot product.

### dot product  [1 docs, x1] [new]  · aliases: dot-product
A vector similarity measure computed by multiplying corresponding components and summing the results. In learned retrieval systems, it is often used as a scoring function for comparing query and document representations.

### evidence aggregation  [1 docs, x1] [new]
Evidence aggregation is the process of combining information from multiple supporting sources to form a more complete or reliable answer or prediction. It is important when no single source contains all necessary information.

### TriviaQA  [1 docs, x1] [new]
TriviaQA is a question answering benchmark composed of trivia questions paired with evidence from documents such as web pages and Wikipedia. It is used to test a system's ability to answer questions using retrieved textual evidence.

### Low-Rank Adaptation  [1 docs, x1] [new]  · aliases: LoRA
A parameter-efficient method for adapting a pre-trained neural network by freezing the original weights and adding trainable low-rank matrices to selected layers. It reduces the number of trainable parameters and memory use while preserving model quality on downstream tasks.

### full fine-tuning  [1 docs, x1] [judged-distinct]  · aliases: fine-tuning
A model adaptation approach that retrains all of a pre-trained model’s parameters on a new task or domain. It can achieve strong performance but becomes increasingly expensive as model size grows.

### pre-trained model weights  [1 docs, x1] [judged-distinct]  · aliases: pre-trained weights
The learned parameters of a model obtained during large-scale pre-training on general data. These weights provide the starting point for later adaptation to specific tasks or domains and may be kept fixed during parameter-efficient fine-tuning methods.

### rank decomposition matrices  [1 docs, x1] [judged-distinct]  · aliases: low-rank matrices
Low-rank trainable matrices used to represent an update to a larger weight matrix through factorization. They enable efficient adaptation by adding a small number of parameters instead of retraining the full matrix.

### adapters  [1 docs, x1] [judged-distinct]
Small trainable modules inserted into a neural network to adapt a pre-trained model to new tasks while keeping most original parameters frozen. They improve parameter efficiency but can add extra computation at inference time.

### inference latency  [1 docs, x1] [new]
The delay between providing an input to a model and receiving its output. In model adaptation methods, added modules can increase this latency by introducing extra computation during prediction.

### rank-deficiency  [1 docs, x1] [judged-distinct]
A property of matrix updates or transformations in which the effective dimensionality is lower than the full dimensionality. In language model adaptation, it can explain why low-rank parameterizations are effective.

### language model adaptation  [1 docs, x1] [judged-distinct]
The process of modifying a pre-trained language model so it performs well on a new task or domain. It often aims to reuse existing knowledge while changing only a small set of parameters or components.

### PyTorch  [1 docs, x1] [new]
A machine learning framework for building and training neural networks. It provides model and tensor abstractions that can be extended with additional adaptation modules such as low-rank updates.

### DeBERTa  [1 docs, x1] [judged-distinct]
A transformer-based language model used as a benchmark for comparing adaptation methods. It is designed for strong performance on language understanding tasks and is commonly fine-tuned for downstream applications.

### Adam  [1 docs, x1] [new]
A gradient-based optimization algorithm that adapts learning rates using estimates of first and second moments of the gradients. It is widely used for training neural networks and fine-tuning large language models.

### TruthfulQA  [1 docs, x1] [judged-distinct]  · aliases: TruthfulQA benchmark
A benchmark designed to measure whether a language model gives truthful answers to questions. It evaluates responses on questions that are likely to elicit false answers because they align with common human misconceptions or false beliefs.

### imitation of text  [1 docs, x1] [new]  · aliases: imitating human texts
A learning behavior in which a model reproduces patterns, statements, and associations found in its training text. This can cause the model to mirror both correct information and common falsehoods present in the data.

### training distribution  [1 docs, x1] [new]
The distribution of examples present in the data used to train a model. If false statements are common in that data, a model may learn to reproduce them as likely outputs.

### training objectives  [1 docs, x1] [new]
The optimization goals used during model training to shape the model's behavior. Different objectives can encourage different kinds of output, such as imitation, factuality, or task-specific accuracy.

### scaling up models  [1 docs, x1] [judged-distinct]
Increasing model size, often by adding more parameters or capacity. This can improve many language tasks, but it does not necessarily improve truthfulness when the model has learned false patterns from data.

### GPT-Neo  [1 docs, x1] [judged-distinct]  · aliases: GPT-Neo, GPT-J
An open language model family modeled after GPT-style autoregressive architectures. It is used to generate text and can be evaluated for factuality and truthfulness.

### T5  [1 docs, x1] [judged-distinct]  · aliases: T5-based model
A text-to-text transformer model that frames all language tasks as converting one text sequence into another. It can be adapted to many tasks through fine-tuning on labeled examples or other objectives.

### chain of thought  [1 docs, x1] [new]
A chain of thought is a sequence of intermediate reasoning steps used to work through a problem. It helps break complex reasoning into smaller, explicit steps that can support more accurate conclusions.

### chain of thought prompting  [1 docs, x1] [judged-distinct]  · aliases: CoT prompting
Chain of thought prompting is a prompting method that includes examples of step-by-step reasoning in the prompt. It encourages a language model to produce intermediate reasoning before giving an answer, which can improve performance on complex reasoning tasks.

### few-shot demonstration  [1 docs, x1] [judged-distinct]  · aliases: exemplar, exemplars
A few-shot demonstration is an example included in a prompt to show a model the desired input-output pattern. Using a small number of exemplars can steer the model toward the intended task format or reasoning style.

### arithmetic reasoning  [1 docs, x1] [judged-distinct]
Arithmetic reasoning is the ability to solve problems that require numerical computation and manipulation of numbers. It involves applying arithmetic operations and intermediate calculations to reach an answer.

### commonsense reasoning  [1 docs, x1] [new]
Commonsense reasoning is the ability to draw on everyday knowledge about how the world works. It allows a system to infer plausible conclusions from ordinary situations and implicit assumptions.

### symbolic reasoning  [1 docs, x1] [new]
Symbolic reasoning is the manipulation of symbols according to formal rules to derive conclusions. It is used in tasks that require structured, logic-like inference rather than direct pattern matching.

### GSM8K benchmark  [1 docs, x1] [new]
GSM8K is a benchmark of grade-school math word problems used to evaluate mathematical reasoning in language models. It measures how well a system can solve multi-step numerical problems from natural language questions.

### math word problem  [1 docs, x1] [new]
A math word problem is a natural-language problem that describes a situation requiring mathematical reasoning to solve. It typically combines text understanding with numerical computation and stepwise inference.

### fine-tuned GPT-3  [1 docs, x1] [judged-distinct]  · aliases: finetuned GPT-3
Fine-tuned GPT-3 is a version of GPT-3 adapted on additional task-specific data to improve performance on a target task. Fine-tuning adjusts the model beyond its base training to better match a benchmark or application.

### instruction following  [1 docs, x1] [new]  · aliases: following instructions
The ability of a language model to produce responses that match a user's requested intent and constraints. It is a practical measure of how well the model behaves as an assistant in response to prompts.

### human feedback  [1 docs, x1] [new]
Information provided by people about the quality or desirability of model behavior. It can be collected as demonstrations or rankings and used to steer a model toward outputs preferred by humans.

### labeler demonstrations  [1 docs, x1] [new]  · aliases: demonstrations of the desired model behavior
Examples created by human labelers that show the desired behavior of a model for given prompts. They are used as supervised targets when fine-tuning a language model.

### supervised learning  [1 docs, x1] [judged-distinct]
A training approach in which a model is optimized to match labeled examples. For language models, it learns to imitate target outputs provided in demonstrations.

### reinforcement learning from human feedback  [1 docs, x1] [new]  · aliases: RLHF
A training method that uses human preferences over model outputs as feedback to optimize a model's behavior. A reward model or preference signal is learned from rankings, and the model is further updated to produce outputs humans prefer.

### InstructGPT  [1 docs, x1] [judged-distinct]
A family of language models fine-tuned to follow user instructions using supervised learning and reinforcement learning from human feedback. The resulting models are optimized to better align outputs with human intent.

### alignment  [1 docs, x1] [judged-distinct]  · aliases: aligned with their users
The degree to which a language model's outputs match human intent, preferences, and values. Aligned models are more useful, truthful, and less likely to produce harmful or irrelevant content.

### toxic output generation  [1 docs, x1] [new]  · aliases: toxic output
The production of harmful, offensive, or abusive text by a language model. Reducing toxic output generation is a common goal in making model behavior safer and more acceptable.

### model rankings  [1 docs, x1] [judged-distinct]  · aliases: rankings of model outputs
Human preference judgments that order multiple model outputs from best to worst. They provide comparative feedback used to train preference-based or reinforcement learning systems.

### Atlas  [1 docs, x1] [judged-distinct]
A pre-trained retrieval-augmented language model designed to learn knowledge-intensive tasks from very few training examples. It combines language modeling with document retrieval so it can perform well on tasks that require factual information.

### fact checking  [1 docs, x1] [new]
A task that determines whether a claim is supported, refuted, or otherwise verifiable using evidence. It typically requires retrieving and comparing factual information against the claim.

### document index  [1 docs, x1] [new]  · aliases: index
An organized collection of documents or passages used for retrieval in a retrieval-augmented system. The contents of the index can be changed to refresh the evidence available to the model.

### MMLU  [1 docs, x1] [new]  · aliases: Massive Multitask Language Understanding
A benchmark suite of multiple-choice questions spanning many subjects and disciplines. It is used to measure broad language understanding and knowledge across diverse topics.

### KILT  [1 docs, x1] [new]  · aliases: Knowledge Intensive Language Tasks
A benchmark suite for knowledge-intensive language tasks that evaluates systems on tasks requiring retrieval and grounded generation. It is designed to test whether models can use external evidence effectively.

### 统计语言模型  [1 docs, x1] [judged-distinct]  · aliases: statistical language model
一种基于词序列统计规律来估计语言出现概率的语言建模方法。它通常利用人工设计的特征或有限上下文来进行下一词预测和语言生成。

### 神经语言模型  [1 docs, x1] [judged-distinct]  · aliases: neural language model
一种使用神经网络来学习语言分布的语言模型。它通过从数据中自动学习表示来改进对上下文和语义关系的建模能力。

### ChatGPT  [1 docs, x1] [new]
一种面向对话的人工智能系统，能够根据用户输入生成自然语言回复。它因强大的交互式语言能力而受到广泛关注。

### multi-document question answering  [1 docs, x1] [judged-distinct]
A question answering task in which a system must find and combine relevant evidence scattered across multiple documents. It tests whether the model can retrieve and synthesize information from a set of sources rather than relying on a single passage.

### key-value retrieval  [1 docs, x1] [new]
A retrieval task in which a model must locate a key in its input and return the associated value. It is often used to measure whether a system can accurately access specific information embedded in a longer context.

### long-context language model  [1 docs, x1] [judged-distinct]  · aliases: explicitly long-context models
A language model designed to process and use very long input sequences. Such models are intended to maintain useful information across extended contexts and support tasks that require accessing distant parts of the input.

### input context  [1 docs, x1] [new]  · aliases: long input contexts, context
The text provided to a language model as its immediate source of information for generating outputs. It may contain evidence, instructions, or other relevant material that the model is expected to use during prediction.

### large language model hallucination  [1 docs, x1] [judged-distinct]  · aliases: LLM hallucination, hallucination in large language models
A phenomenon in which a large language model generates content that is fluent and plausible but not grounded in fact. It is a central reliability problem because the output can appear trustworthy while containing false or unsupported information.

### hallucination detection  [1 docs, x1] [judged-distinct]  · aliases: hallucination detection methods
The task of identifying when a model output contains hallucinated or nonfactual content. Detection methods are designed to flag unreliable generations so they can be corrected, filtered, or further verified.

### hallucination benchmark  [1 docs, x1] [judged-distinct]  · aliases: hallucination benchmarks
An evaluation benchmark designed to measure how often a model produces hallucinated content or how well a system detects it. Benchmarks provide standardized test cases for comparing methods across models and settings.

### hallucination mitigation  [1 docs, x1] [judged-distinct]  · aliases: mitigation of hallucination, hallucination mitigation methods
Methods and strategies intended to reduce the frequency, severity, or impact of hallucinated model outputs. Mitigation can involve training, decoding, retrieval, verification, or system-level controls.

### retrieval-augmented large language model  [1 docs, x1] [judged-distinct]  · aliases: retrieval-augmented LLM, retrieval-augmented LLMs
A large language model that incorporates external retrieved information during generation. Retrieval is used to ground responses in relevant evidence and improve factuality, especially in information retrieval settings.

### large vision-language model hallucination  [1 docs, x1] [judged-distinct]  · aliases: hallucination in large vision-language models
Hallucination occurring in models that process both visual and textual information, where generated descriptions or answers may conflict with the input image or other visual evidence. It extends the hallucination problem into multimodal systems.

### knowledge boundary  [1 docs, x1] [new]  · aliases: knowledge boundaries in LLM hallucinations
The limit of what a language model reliably knows or can infer from its parameters and context. Understanding these boundaries helps distinguish likely factual generation from cases where the model may fabricate unsupported content.

### query-focused summarization  [1 docs, x1] [new]  · aliases: QFS
A summarization task in which the output is tailored to a specific user question rather than to a document’s general content. It aims to synthesize information from a corpus into an answer that addresses the query directly.

### entity knowledge graph  [1 docs, x1] [new]
A graph structure whose nodes represent entities and whose edges encode relationships among them. It organizes information extracted from source documents so that related entities can be grouped and summarized.

### community summary  [1 docs, x1] [new]  · aliases: community summaries
A summary generated for a group of closely related entities in a graph. It condenses the shared information in that group so it can later support question answering at a higher level of abstraction.

### global sensemaking question  [1 docs, x1] [new]  · aliases: global questions
A question that asks for an overview, pattern, or theme spanning an entire corpus rather than a single passage. Such questions require synthesizing information across many documents or topics.

### Textual subgraph retrieval  [1 docs, x1] [new]
The task of retrieving a connected subgraph of text nodes that is relevant to a query or reasoning goal. It aims to select not just individual documents but a coherent graph-structured context that supports multi-hop understanding.

### Divide-and-conquer strategy  [1 docs, x1] [new]
A problem-solving approach that breaks a task into smaller parts, solves them separately, and combines the results. In retrieval settings, it can be used to efficiently search complex structures by recursively narrowing the candidate space.

### Graph context-aware generation  [1 docs, x1] [judged-distinct]
A generation setting in which a model conditions its outputs on graph-structured context as well as textual content. The goal is to let the model use both local text and relational structure when producing responses.

### Text view  [1 docs, x1] [new]
A representation of graph-structured information that presents the content as plain text. It supports language models by exposing the textual semantics of nodes and edges in a form they can process naturally.

### Textual graph  [1 docs, x1] [judged-distinct]  · aliases: Textual graphs
A graph whose nodes, edges, or connected structure are expressed through text. Such graphs combine natural-language content with relational links, enabling both semantic and topological reasoning.

### Graph reasoning benchmark  [1 docs, x1] [new]  · aliases: Graph reasoning benchmarks
An evaluation benchmark designed to measure reasoning over graph-structured information. It tests a model's ability to use relationships, paths, and multi-step connectivity to answer questions or solve tasks.

### external knowledge source  [1 docs, x1] [new]  · aliases: external knowledge sources
A source of information outside a language model that can be retrieved and incorporated into generation. External knowledge sources help ground outputs in up-to-date or domain-specific facts not fully stored in model parameters.

### LightRAG  [1 docs, x1] [judged-distinct]
A retrieval-augmented generation framework that incorporates graph structures into text indexing and retrieval. It is designed to improve contextual relevance, retrieval completeness, and efficiency by combining graph-based and vector-based methods.

### text indexing  [1 docs, x1] [judged-distinct]
The process of organizing text so that relevant information can be efficiently retrieved later. Indexing methods determine how documents or text fragments are represented and searched during retrieval.

### dual-level retrieval system  [1 docs, x1] [new]
A retrieval architecture that operates at two levels of abstraction to obtain information. It is designed to support both fine-grained and more global discovery of relevant knowledge.

### low-level knowledge discovery  [1 docs, x1] [new]
The retrieval of fine-grained, local, or detailed pieces of knowledge from a source. It helps identify specific facts or entities that may be directly relevant to a query.

### high-level knowledge discovery  [1 docs, x1] [judged-distinct]
The retrieval of broader, more abstract, or more global knowledge from a source. It helps surface higher-order context and relationships that may not appear in fine-grained retrieval alone.

### related entity  [1 docs, x1] [new]  · aliases: related entities
An entity that has a meaningful semantic or relational connection to another entity. Related entities are often retrieved together to preserve context and support more complete answers.

### relationship  [1 docs, x1] [judged-distinct]  · aliases: relationships
A semantic connection between entities that expresses how they are associated in a knowledge representation. Relationships help capture structure beyond isolated facts and support relational reasoning.

### incremental update algorithm  [1 docs, x1] [new]
An algorithm that incorporates new data into an existing system without rebuilding everything from scratch. It is used to keep indexed knowledge current while preserving efficiency in changing data environments.

### retrieval accuracy  [1 docs, x1] [judged-distinct]
The degree to which a retrieval system returns information that is relevant and correct for a given query. Higher retrieval accuracy means the system is better at finding useful evidence for generation.

### retrieval efficiency  [1 docs, x1] [judged-distinct]
The degree to which a retrieval system returns relevant information using limited time or computational resources. Higher retrieval efficiency means faster or cheaper access to useful knowledge.

### generative language model  [1 docs, x1] [judged-distinct]
A language model that produces text by predicting and generating sequences of tokens. It can be conditioned on prompts, retrieved evidence, or other context to create fluent natural-language outputs.

### summarization  [1 docs, x1] [judged-distinct]
A text generation task that condenses a longer source into a shorter version while preserving the main points. Retrieval-augmented methods can support summarization by supplying additional context or evidence when needed.

### deployment  [1 docs, x1] [new]
The process of putting a model or system into practical use in a real-world setting. In language-model applications, deployment raises concerns about performance, safety, and responsible operation.

### Graph-based retrieval-augmented generation  [1 docs, x1] [judged-distinct]  · aliases: GraphRAG
Graph-based retrieval-augmented generation is a retrieval-augmented generation paradigm that uses graph structures to organize knowledge and support retrieval. It aims to improve domain-specific generation by representing relationships explicitly and retrieving context in a way that supports reasoning across linked information.

### Graph-based retrieval technique  [1 docs, x1] [judged-distinct]
A graph-based retrieval technique is an information retrieval method that operates over graph-structured knowledge rather than flat text. It can traverse connected entities and relations to gather context that preserves relationships and supports multi-step reasoning.

### Structure-aware knowledge integration algorithm  [1 docs, x1] [new]
A structure-aware knowledge integration algorithm is a method for combining retrieved knowledge while preserving the structural information in which it is organized. It uses relationships and graph context to produce more accurate and logically coherent generated outputs.

### Context-preserving knowledge retrieval  [1 docs, x1] [new]
Context-preserving knowledge retrieval is a retrieval approach that aims to return information together with the surrounding relational context needed to interpret it correctly. By preserving links among entities and concepts, it supports more faithful downstream reasoning and generation.

## Relations (193)

- TruthfulQA —uses questions shaped by→ false beliefs  (x2)
- retrieval-augmented generation —is used for→ knowledge-intensive task  (x2)
- Transformer —is based solely on→ attention mechanism  (x1)
- Transformer —dispenses with→ recurrent neural network  (x1)
- Transformer —dispenses with→ convolutional neural network  (x1)
- encoder-decoder architecture —is connected through→ attention mechanism  (x1)
- WMT 2014 English-to-German translation task —is evaluated with→ BLEU  (x1)
- WMT 2014 English-to-French translation task —is evaluated with→ BLEU  (x1)
- Transformer —is applied to→ English constituency parsing  (x1)
- RoBERTa —is a revised approach to→ BERT pretraining  (x1)
- BERT pretraining —trains→ BERT  (x1)
- RoBERTa —studies the impact of→ hyperparameter choice  (x1)
- RoBERTa —studies the impact of→ training data size  (x1)
- RoBERTa —achieves strong results on→ GLUE  (x1)
- RoBERTa —achieves strong results on→ RACE  (x1)
- RoBERTa —achieves strong results on→ SQuAD  (x1)
- kNN-LM —extends→ pre-trained neural language model  (x1)
- kNN-LM —interpolates with→ k-nearest neighbors model  (x1)
- k-nearest neighbors model —uses→ nearest neighbor search  (x1)
- nearest neighbor search —operates in→ embedding space  (x1)
- kNN-LM —uses→ nearest neighbor datastore  (x1)
- kNN-LM —allows→ domain adaptation  (x1)
- kNN-LM —improves→ rare pattern prediction  (x1)
- empirical scaling laws —describe→ cross-entropy loss  (x1)
- empirical scaling laws —follow→ power law  (x1)
- cross-entropy loss —scales with→ model size  (x1)
- cross-entropy loss —scales with→ training data size  (x1)
- cross-entropy loss —scales with→ compute  (x1)
- network width —has minimal effect on→ cross-entropy loss  (x1)
- network depth —has minimal effect on→ cross-entropy loss  (x1)
- overfitting —depends on→ model size  (x1)
- overfitting —depends on→ training data size  (x1)
- training speed —depends on→ model size  (x1)
- compute budget —limits→ compute  (x1)
- sample efficiency —improves with→ model size  (x1)
- compute-efficient training —is constrained by→ compute budget  (x1)
- compute-efficient training —depends on→ sample efficiency  (x1)
- compute-efficient training —stops before→ convergence  (x1)
- Retrieval-Augmented Language Model pre-training —augments with→ latent knowledge retriever  (x1)
- Retrieval-Augmented Language Model pre-training —uses→ masked language modeling  (x1)
- Retrieval-Augmented Language Model pre-training —is evaluated on→ open-domain question answering  (x1)
- latent knowledge retriever —is trained with→ backpropagation through retrieval  (x1)
- implicit knowledge storage —contrasts with→ explicit knowledge storage  (x1)
- latent knowledge retriever —supports→ explicit knowledge storage  (x1)
- open-domain question answering —relies on→ passage retrieval  (x1)
- passage retrieval —traditionally uses→ sparse vector space model  (x1)
- TF-IDF —is a kind of→ sparse vector space model  (x1)
- BM25 —is a kind of→ sparse vector space model  (x1)
- dense retriever —uses→ dense representation  (x1)
- dense retriever —is based on→ dual-encoder framework  (x1)
- Lucene-BM25 system —uses→ BM25  (x1)
- dense retriever —outperforms→ Lucene-BM25 system  (x1)
- dense retriever —improves→ top-20 passage retrieval accuracy  (x1)
- end-to-end QA system —implements→ open-domain question answering  (x1)
- end-to-end QA system —uses→ dense retriever  (x1)
- open-domain QA benchmark —evaluates→ open-domain question answering  (x1)
- retrieval-augmented generation —combines→ implicit knowledge storage  (x1)
- retrieval-augmented generation —combines→ non-parametric memory  (x1)
- retrieval-augmented generation —uses→ pre-trained seq2seq model  (x1)
- retrieval-augmented generation —accesses→ dense vector index  (x1)
- retrieval-augmented generation —uses→ dense retriever  (x1)
- dense retriever —retrieves from→ dense vector index  (x1)
- retrieve-and-extract architecture —is used for→ open-domain question answering  (x1)
- knowledge-intensive NLP task —includes→ open-domain question answering  (x1)
- GPT-3 —is a kind of→ autoregressive language model  (x1)
- GPT-3 —is evaluated in→ few-shot learning  (x1)
- few-shot learning —is improved by scaling up→ language model  (x1)
- pre-training —is followed by→ fine-tuning  (x1)
- GPT-3 —is applied to→ translation  (x1)
- GPT-3 —is applied to→ question-answering  (x1)
- GPT-3 —is applied to→ cloze task  (x1)
- GPT-3 —is applied to→ unscrambling words  (x1)
- GPT-3 —is applied to→ domain adaptation  (x1)
- GPT-3 —is applied to→ 3-digit arithmetic  (x1)
- GPT-3 —is applied to→ news article generation  (x1)
- GPT-3 —is trained on→ web corpus  (x1)
- Approximate Nearest Neighbor Negative Contrastive Estimation —constructs negatives from→ Approximate Nearest Neighbor index  (x1)
- Approximate Nearest Neighbor Negative Contrastive Estimation —uses→ Approximate Nearest Neighbor  (x1)
- BERT-Siamese model —is scored by→ dot product  (x1)
- passage retrieval —supports→ evidence aggregation  (x1)
- Natural Questions —is a benchmark for→ open-domain question answering  (x1)
- TriviaQA —is a benchmark for→ open-domain question answering  (x1)
- Low-Rank Adaptation —is an alternative to→ full fine-tuning  (x1)
- Low-Rank Adaptation —freezes→ pre-trained model weights  (x1)
- Low-Rank Adaptation —injects→ rank decomposition matrices  (x1)
- Low-Rank Adaptation —modifies→ Transformer  (x1)
- Low-Rank Adaptation —differs from→ adapters  (x1)
- Low-Rank Adaptation —avoids increasing→ inference latency  (x1)
- Low-Rank Adaptation —is motivated by→ rank-deficiency  (x1)
- Low-Rank Adaptation —is used for→ language model adaptation  (x1)
- adapters —can increase→ inference latency  (x1)
- GPT-3 —is fine-tuned with→ Adam  (x1)
- Low-Rank Adaptation —is integrated with→ PyTorch  (x1)
- Low-Rank Adaptation —is evaluated on→ RoBERTa  (x1)
- Low-Rank Adaptation —is evaluated on→ DeBERTa  (x1)
- Low-Rank Adaptation —is evaluated on→ GPT-2  (x1)
- Low-Rank Adaptation —is evaluated on→ GPT-3  (x1)
- TruthfulQA —measures→ truthfulness  (x1)
- imitation of text —learns from→ training distribution  (x1)
- false beliefs —can be reinforced by→ imitation of text  (x1)
- scaling up models —may not improve→ truthfulness  (x1)
- fine-tuning —uses→ training objectives  (x1)
- GPT-3 —was tested on→ TruthfulQA  (x1)
- GPT-Neo —was tested on→ TruthfulQA  (x1)
- GPT-2 —was tested on→ TruthfulQA  (x1)
- T5 —was tested on→ TruthfulQA  (x1)
- chain of thought prompting —uses→ chain of thought  (x1)
- chain of thought prompting —uses→ few-shot demonstration  (x1)
- chain of thought prompting —improves reasoning in→ large language model  (x1)
- chain of thought prompting —improves performance on→ arithmetic reasoning  (x1)
- chain of thought prompting —improves performance on→ commonsense reasoning  (x1)
- chain of thought prompting —improves performance on→ symbolic reasoning  (x1)
- GSM8K benchmark —consists of→ math word problem  (x1)
- chain of thought prompting —achieves state of the art on→ GSM8K benchmark  (x1)
- fine-tuned GPT-3 —is surpassed on→ GSM8K benchmark  (x1)
- human feedback —includes→ labeler demonstrations  (x1)
- human feedback —includes→ model rankings  (x1)
- labeler demonstrations —used for→ supervised learning  (x1)
- model rankings —used for→ reinforcement learning from human feedback  (x1)
- supervised learning —used to fine-tune→ InstructGPT  (x1)
- reinforcement learning from human feedback —used to further fine-tune→ InstructGPT  (x1)
- InstructGPT —improves→ instruction following  (x1)
- InstructGPT —is designed for→ alignment  (x1)
- InstructGPT —improves→ truthfulness  (x1)
- InstructGPT —reduces→ toxic output generation  (x1)
- Atlas —is a kind of→ retrieval-augmented generation  (x1)
- Atlas —is designed for→ few-shot learning  (x1)
- question-answering —is a kind of→ knowledge-intensive task  (x1)
- fact checking —is a kind of→ knowledge-intensive task  (x1)
- Atlas —uses→ document index  (x1)
- document index —is used by→ retrieval-augmented generation  (x1)
- MMLU —is used to evaluate→ knowledge-intensive task  (x1)
- KILT —is used to evaluate→ knowledge-intensive task  (x1)
- Natural Questions —is a kind of→ question-answering  (x1)
- 神经语言模型 —is implemented with→ Transformer  (x1)
- pre-trained neural language model —is based on→ Transformer  (x1)
- large language model —is a kind of→ pre-trained neural language model  (x1)
- large language model —depends on→ model size  (x1)
- ChatGPT —is built on→ large language model  (x1)
- multi-document question answering —uses→ input context  (x1)
- key-value retrieval —uses→ input context  (x1)
- long-context language model —processes→ input context  (x1)
- hallucination detection —targets→ large language model hallucination  (x1)
- hallucination benchmark —evaluates→ hallucination detection  (x1)
- hallucination mitigation —reduces→ large language model hallucination  (x1)
- retrieval-augmented large language model —is used to combat→ large language model hallucination  (x1)
- large vision-language model hallucination —is a kind of→ large language model hallucination  (x1)
- knowledge boundary —helps explain→ large language model hallucination  (x1)
- GraphRAG —combines→ retrieval-augmented generation  (x1)
- GraphRAG —combines→ query-focused summarization  (x1)
- GraphRAG —builds→ entity knowledge graph  (x1)
- GraphRAG —uses→ community summary  (x1)
- community summary —summarizes groups in→ entity knowledge graph  (x1)
- global sensemaking question —is a kind of→ query-focused summarization  (x1)
- retrieval-augmented generation —differs from→ query-focused summarization  (x1)
- GraphRAG —is a kind of→ retrieval-augmented generation  (x1)
- GraphRAG —depends on→ Textual subgraph retrieval  (x1)
- GraphRAG —depends on→ Graph context-aware generation  (x1)
- Textual subgraph retrieval —uses→ Divide-and-conquer strategy  (x1)
- Graph context-aware generation —uses→ Text view  (x1)
- Graph context-aware generation —uses→ Graph view  (x1)
- Text view —represents→ Textual graph  (x1)
- Graph view —represents→ Textual graph  (x1)
- Multi-hop reasoning —is performed on→ Textual graph  (x1)
- Graph reasoning benchmark —evaluates→ Multi-hop reasoning  (x1)
- retrieval-augmented generation —enhances→ large language model  (x1)
- retrieval-augmented generation —integrates→ external knowledge source  (x1)
- LightRAG —incorporates→ Graph view  (x1)
- LightRAG —uses in→ text indexing  (x1)
- LightRAG —uses in→ retrieval process  (x1)
- LightRAG —employs→ dual-level retrieval system  (x1)
- dual-level retrieval system —supports→ low-level knowledge discovery  (x1)
- dual-level retrieval system —supports→ high-level knowledge discovery  (x1)
- Graph view —is integrated with→ dense representation  (x1)
- dense representation —facilitates retrieval of→ related entity  (x1)
- dense representation —facilitates retrieval of→ relationship  (x1)
- LightRAG —is enhanced by→ incremental update algorithm  (x1)
- incremental update algorithm —integrates new data into→ external knowledge source  (x1)
- LightRAG —improves→ retrieval accuracy  (x1)
- LightRAG —improves→ retrieval efficiency  (x1)
- retrieval-augmented generation —combines→ retrieval process  (x1)
- retrieval-augmented generation —combines→ generative language model  (x1)
- retrieval-augmented generation —is used for→ question-answering  (x1)
- retrieval-augmented generation —is used for→ summarization  (x1)
- large language model —is a kind of→ generative language model  (x1)
- retrieval-augmented generation —depends on→ retrieval process  (x1)
- question-answering —depends on→ retrieval process  (x1)
- Graph-based retrieval-augmented generation —is a kind of→ retrieval-augmented generation  (x1)
- Graph-based retrieval-augmented generation —uses→ Graph view  (x1)
- Graph-based retrieval-augmented generation —depends on→ Graph-based retrieval technique  (x1)
- Graph-based retrieval-augmented generation —uses→ Structure-aware knowledge integration algorithm  (x1)
- Graph-based retrieval technique —enables→ Context-preserving knowledge retrieval  (x1)
- Graph-based retrieval technique —supports→ Multi-hop reasoning  (x1)