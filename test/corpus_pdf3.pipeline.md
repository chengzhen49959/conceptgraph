# Corpus pipeline test — corpus_pdf3 (3 docs)

- models: extract=`gpt-5.4-mini` judge=`gpt-5.4-mini` embed=`text-embedding-3-small`
- dedup: embeddings block top-5 within cosine dist 0.4, LLM match_concept decides

## Counts
- 3 docs -> 54 chunks -> 446 raw concepts (291 distinct names) -> **223 final concepts**
- dedup: new=223 · exact-name=0 · match calls=174 (merged 68 / judged-distinct 106)
- relations: 372 raw -> **336 after remap+dedup** · **36 clusters**

## Quality
- forbidden person-names (should be 0): **0** (ok **PASS**)
- glossary-leak descriptions: **0** (ok)
- sentence-punctuation names: **0** (ok)

## Cross-document concepts (22) — merged across ≥2 papers

The dedup payoff: one node, many sources.

- **Self-attention** — 3 docs, x17 · aliases: Self-attention layer, Bidirectional self-attention, Self-attention mechanism  `1706.03762, 1810.04805, 1911.00172`
- **Transformer** — 3 docs, x15 · aliases: Transformer model  `1706.03762, 1810.04805, 1911.00172`
- **Position-wise feed-forward network** — 2 docs, x7 · aliases: point-wise fully connected layer, position-wise fully connected feed-forward network, Point-wise feed-forward layer, Feed-forward network, Feedforward network  `1706.03762, 1911.00172`
- **Positional encoding** — 2 docs, x5 · aliases: parameter-free position representation, Position embedding  `1706.03762, 1810.04805`
- **Layer normalization** — 2 docs, x5 · aliases: LayerNorm  `1706.03762, 1911.00172`
- **Attention head** — 2 docs, x5 · aliases: Head, Self-attention head  `1706.03762, 1810.04805`
- **Left-to-right language model** — 2 docs, x5 · aliases: unidirectional language model, left-to-right LM, Autoregressive Language Model  `1810.04805, 1911.00172`
- **Encoder stack** — 2 docs, x3 · aliases: encoder, Transformer encoder  `1706.03762, 1810.04805`
- **Masked self-attention** — 2 docs, x3 · aliases: causal self-attention, subsequent-position masking, Constrained self-attention  `1706.03762, 1810.04805`
- **Byte-pair encoding** — 2 docs, x3 · aliases: BPE  `1706.03762, 1911.00172`
- **WordPiece** — 2 docs, x3 · aliases: Word-piece vocabulary  `1706.03762, 1810.04805`
- **Long Short-Term Memory** — 2 docs, x2 · aliases: LSTM  `1706.03762, 1810.04805`
- **Machine Translation** — 2 docs, x2  `1706.03762, 1810.04805`
- **Decoder stack** — 2 docs, x2 · aliases: decoder, Transformer decoder  `1706.03762, 1810.04805`
- **Multi-head self-attention** — 2 docs, x2 · aliases: self-attention, multi-head attention  `1706.03762, 1911.00172`
- **Dot product** — 2 docs, x2 · aliases: scalar product, inner product, Inner product distance  `1706.03762, 1911.00172`
- **Embedding** — 2 docs, x2 · aliases: learned embedding, Token embedding  `1706.03762, 1810.04805`
- **Softmax** — 2 docs, x2 · aliases: Softmax function  `1706.03762, 1810.04805`
- **Weight tying** — 2 docs, x2 · aliases: shared weight matrix, Tied weights  `1706.03762, 1911.00172`
- **Dropout** — 2 docs, x2 · aliases: dropout  `1706.03762, 1911.00172`
- **Development Set** — 2 docs, x2 · aliases: development set, Dev set  `1706.03762, 1810.04805`
- **English Wikipedia** — 2 docs, x2 · aliases: Wikipedia, WIKI-3B  `1810.04805, 1911.00172`

## Clusters (36) — vs the A–E reading-list themes

### Neural Cache Models  (31)
kNN-LM, k-nearest neighbors model, Linear interpolation, Embedding space, Nearest neighbor search, Text datastore, Domain adaptation, Perplexity, pretrained language model, prefix embedding, Key-Value Datastore, Context-Target Pair, Key-value pair, Nearest neighbor distribution, FAISS, Cache model, L2 distance, Negative log-likelihood … (+13)

### Transformer Models  (28)
Transformer, Attention mechanism, Self-attention, Parameter-free position representation, Positional encoding, Tensor2tensor, Transduction, Encoder-Decoder Architecture, Global Dependency, Sinusoidal positional encoding, Learned positional embedding, Restricted self-attention, Recurrent layer, Convolutional layer, Path length, Dilated convolution, Separable convolution, Residual dropout … (+10)

### BERT Pretraining  (26)
BERT, Pre-trained language representations, Fine-tuning approach, Masked language model, Cloze task, Named entity recognition, Question answering, Sentence-level tasks, Token-level tasks, Next sentence prediction, Sentence embedding, Pre-training, Special classification token, Stanford Question Answering Dataset, BERT Base, BERT Large, Hidden size, Layer … (+8)

### Transformer Architecture  (18)
Encoder stack, Decoder stack, Multi-head self-attention, Position-wise feed-forward network, Residual connection, Layer normalization, Masked self-attention, Encoder-decoder attention, Attention function, Query-key-value pair, Autoregressive property, ReLU activation, Convolution with kernel size 1, Model Capacity, Dropout, Transformer language model, Transformer language model layer, n-gram language model

### BERT Input and Output Layers  (15)
Embedding, Softmax, Weight tying, Pre-softmax linear transformation, Byte-pair encoding, WordPiece, Sequence length batching, Separator token, Segment embedding, Input embedding, BERT input representation, Classification layer, BERT vocabulary, Adaptive input, Adaptive softmax

### NLP Benchmark Tasks  (15)
Generative Pre-trained Transformer, Unidirectional language model, Downstream task, GLUE benchmark, Multi-genre natural language inference, Quora Question Pairs, Question Natural Language Inference, Stanford Sentiment Treebank 2, Corpus of Linguistic Acceptability, Semantic Textual Similarity Benchmark, Microsoft Research Paraphrase Corpus, Recognizing Textual Entailment, BiLSTM with ELMo and attention, attention masking, MNLI

### Attention Mechanism  (12)
Scaled dot-product attention, Multi-head attention, Dot-Product Attention, Linear projection, Dot product, Attention head, Softmax mask, Attention key dimension, Attention value dimension, Single-Head Attention, Compatibility Function, Transformer block

### Contextual Language Models  (10)
Feature-based approach, ELMo, Left-to-right language model, Bidirectional pre-training, Word embedding, Right-to-left language model, Contextual word embedding, Unsupervised fine-tuning, Sentence encoder, Bidirectional language model

### Nlp Model Training  (8)
Beam search, Length penalty, English Constituency Parsing, Recurrent Neural Network Sequence-to-Sequence Model, Wall Street Journal Portion of the Penn Treebank, Semi-Supervised Learning, Development Set, fine-tuning learning rate

### Convolutional Sequence Models  (6)
Extended Neural GPU, ByteNet, ConvS2S, Convolutional Neural Network, Dependency, Effective Resolution

### Pretraining Text Corpora  (5)
Pre-training corpus, BooksCorpus, English Wikipedia, Document-level corpus, WIKI-100M

### Question Answering Models  (5)
Span-based question answering, Packed sequence input representation, Start vector, End vector, TriviaQA

### Efficient Computation  (4)
Factorization Trick, Conditional Computation, Parallelization, Computational complexity

### Transfer Learning  (4)
Machine Translation, Transfer learning, Natural language inference, ImageNet

### Recurrent Neural Networks  (4)
Recurrent Neural Network, Long Short-Term Memory, Gated Recurrent Neural Network, Hidden State

### Rare Data Patterns  (4)
Long tail, rare pattern, factual knowledge, near-duplicate sentence

### Learning Rate Scheduling  (3)
Adam optimizer, Learning rate warmup, Inverse square root learning rate decay

### Vector Indexing  (3)
FAISS index, Cluster centroid, Quantization

### Language Model Training  (3)
Neural language model, Representation learning, Next-word prediction

### Text Prediction  (2)
Sequence Modeling, Language Modeling

### Word Representation Models  (2)
Pre-trained word embedding, Left-to-right language modeling objective

### Memory Networks  (1)
End-to-End Memory Network

### Sequence Prediction Models  (1)
Autoregressive model

### Attention Mechanism  (1)
Additive Attention

### GPU Accelerator  (1)
NVIDIA Tesla K80

### Graphics Processing Units  (1)
NVIDIA Tesla K40

### Graphics Processing Unit  (1)
NVIDIA Tesla M40

### Graphics Processing Unit  (1)
NVIDIA Tesla P100

### Foundation Model  (1)
Base model

### Contrastive Learning  (1)
Context discrimination objective

### Text Representation  (1)
Paragraph embedding

### Sentence Embeddings  (1)
Sentence representation

### Next Sentence Prediction  (1)
Next sentence ranking

### Next Word Prediction  (1)
Next sentence word generation

### Autoencoder Training  (1)
Denoising autoencoder objective

### Emotion Analysis  (1)
Sentiment analysis

## Documents (3)

- `1706.03762` — 1706.03762  (18 chunks)
- `1810.04805` — 1810.04805  (18 chunks)
- `1911.00172` — 1911.00172  (18 chunks)

## All final concepts (223) — by #docs then mentions

### Self-attention  [3 docs, x17] [judged-distinct]  · aliases: Self-attention layer, Bidirectional self-attention, Self-attention mechanism
Self-attention is an attention mechanism in which each token in a sequence computes weights over all other tokens in the same sequence and uses them to form a context-sensitive representation. It directly models relationships across the full sequence, allowing contextualized representations without relying on recurrence or separate encoding stages. This enables efficient parallel computation of token-to-token interactions.  · merged: Self-attention layer, Bidirectional self-attention, Self-attention mechanism

### Transformer  [3 docs, x15] [new]  · aliases: Transformer model
The Transformer is a neural network architecture for sequence modeling that relies entirely on attention mechanisms instead of recurrence or convolution. It processes input sequences through stacked layers of self-attention and position-wise feed-forward components, enabling highly parallel computation during training and strong performance on tasks such as language translation.  · merged: Transformer model

### Position-wise feed-forward network  [2 docs, x7] [new]  · aliases: point-wise fully connected layer, position-wise fully connected feed-forward network, Point-wise feed-forward layer, Feed-forward network, Feedforward network
A position-wise feed-forward network is a stack of fully connected transformations applied independently to each token position in a sequence. It uses learned nonlinear projections to expand and refine per-position representations without directly mixing information across different positions. In Transformer architectures, it is typically placed after the attention sublayer and transforms the contextualized hidden states used for subsequent prediction.  · merged: Point-wise feed-forward layer, Feed-forward network, Feedforward network

### Positional encoding  [2 docs, x5] [judged-distinct]  · aliases: parameter-free position representation, Position embedding
Positional encoding is an embedding or added representation that injects information about a token’s position in a sequence into a model. It enables attention-based models to use token order and relative location, since token identities alone do not capture position. By providing location-dependent signals, it removes the need for recurrence to model sequence order.  · merged: Position embedding

### Layer normalization  [2 docs, x5] [new]  · aliases: LayerNorm
A normalization method applied to the activations of a neural network layer. It standardizes features within a layer to improve training stability and convergence.

### Attention head  [2 docs, x5] [judged-distinct]  · aliases: Head, Self-attention head
An attention head is one parallel attention branch within multi-head attention that computes a weighted combination of values using learned linear projections of the input queries, keys, and values. Multiple heads operate simultaneously to capture different relationships or aspects of the input, and their outputs are combined to form the layer’s final representation.  · merged: Self-attention head

### Left-to-right language model  [2 docs, x5] [judged-distinct]  · aliases: unidirectional language model, left-to-right LM, Autoregressive Language Model
A left-to-right language model predicts the next token in a sequence using only the preceding tokens. It assigns a probability to each token conditioned on the leftward context and models text by stepwise next-token prediction. Because it does not use future tokens, it produces unidirectional representations.  · merged: Autoregressive Language Model

### Encoder stack  [2 docs, x3] [judged-distinct]  · aliases: encoder, Transformer encoder
The encoder stack is the encoder portion of the Transformer, built by stacking multiple identical layers (Transformer blocks). Each layer applies self-attention and a position-wise feed-forward network with residual connections and layer normalization, transforming an input token sequence into contextual representations for downstream components. Unlike an autoregressive decoder, it does not generate outputs step by step but produces representations for the full input sequence.  · merged: Transformer encoder

### Masked self-attention  [2 docs, x3] [judged-distinct]  · aliases: causal self-attention, subsequent-position masking, Constrained self-attention
Masked self-attention is a variant of self-attention that restricts the set of positions each token can attend to, typically disallowing attention to future tokens. In autoregressive models, this masking enforces left-to-right generation so the prediction at position i depends only on earlier tokens (e.g., previously generated outputs).  · merged: Constrained self-attention

### Byte-pair encoding  [2 docs, x3] [new]  · aliases: BPE
A subword tokenization method that iteratively merges frequent symbol pairs to form a compact vocabulary. It helps represent rare words using smaller units and is widely used in neural machine translation.

### WordPiece  [2 docs, x3] [new]  · aliases: Word-piece vocabulary
WordPiece is a subword tokenization scheme that builds a vocabulary of frequently used word fragments (“word pieces”). It represents text using these subword units to model language with an open vocabulary, reducing out-of-vocabulary issues by reusing common substrings across many tokens.  · merged: Word-piece vocabulary

### Long Short-Term Memory  [2 docs, x2] [new]  · aliases: LSTM
Long Short-Term Memory (LSTM) is a recurrent neural network architecture designed to model sequential data while preserving information over long spans. It uses gating mechanisms to control what information to store, forget, and output at each time step, enabling it to better handle long-range dependencies than simpler recurrent networks.   · merged: LSTM

### Machine Translation  [2 docs, x2] [judged-distinct]
Machine translation is the automatic conversion of text from one language to another. Modern neural approaches model translation as a sequence-to-sequence transduction problem.

### Decoder stack  [2 docs, x2] [judged-distinct]  · aliases: decoder, Transformer decoder
The Transformer decoder is the left-context-only part of the Transformer that generates outputs autoregressively, conditioning each predicted token on previous tokens. It is built as a stack of identical layers, where each layer contains masked self-attention, encoder–decoder (cross) attention over the encoder outputs, and a position-wise feed-forward network, each wrapped with residual connections and layer normalization.  · merged: Transformer decoder

### Multi-head self-attention  [2 docs, x2] [judged-distinct]  · aliases: self-attention, multi-head attention
An attention mechanism that computes multiple attention distributions in parallel over the same sequence and combines the results. It allows each position to attend to other positions in the sequence and capture different types of contextual relationships.

### Dot product  [2 docs, x2] [judged-distinct]  · aliases: scalar product, inner product, Inner product distance
The dot product is an inner-product operation that multiplies corresponding components of two vectors and sums the results, yielding a single scalar. It measures how aligned the vectors are, with larger values indicating greater similarity or alignment (up to scaling). In applications such as information retrieval and attention, dot products are often used as similarity scores, but they are not a true metric because they do not generally satisfy the distance axioms.  · merged: Inner product distance

### Embedding  [2 docs, x2] [new]  · aliases: learned embedding, Token embedding
An embedding is a learned vector representation of a discrete token, such as a word, symbol, or subword unit. It encodes the token’s lexical identity as continuous values so neural models can process it numerically.  · merged: Token embedding

### Softmax  [2 docs, x2] [judged-distinct]  · aliases: Softmax function
Softmax is a normalization function that converts a vector of scores (logits) into a probability distribution over classes by exponentiating each score and dividing by the sum of all exponentiated scores. It is commonly used in classification models to transform raw neural network outputs into label probabilities.  · merged: Softmax function

### Weight tying  [2 docs, x2] [new]  · aliases: shared weight matrix, Tied weights
Weight tying is a parameter-sharing technique in neural networks where multiple layers or modules are constrained to use the same parameter matrix. It reduces the total number of parameters and can improve consistency between related components, such as sharing weights between input embeddings and output classifiers (or projections).  · merged: Tied weights

### Dropout  [2 docs, x2] [judged-distinct]  · aliases: dropout
A regularization technique that randomly removes units or connections during training. It helps reduce overfitting by preventing the model from relying too heavily on specific features.

### Development Set  [2 docs, x2] [new]  · aliases: development set, Dev set
A held-out subset of data used during model development to tune hyperparameters and make model-selection decisions. It is kept separate from the training set and provides feedback throughout development, while the final test evaluation is performed on different data. Models and settings are chosen based on performance on this development/validation set.  · merged: Dev set

### English Wikipedia  [2 docs, x2] [judged-distinct]  · aliases: Wikipedia, WIKI-3B
An English Wikipedia text corpus used for language model pre-training, constructed from complete articles. It is typically organized into train, validation, and test splits by holding out some articles for evaluation. The corpus supplies large amounts of diverse, document-structured text to support learning general language representations.  · merged: WIKI-3B

### kNN-LM  [1 docs, x14] [new]  · aliases: kNN language model, k-nearest neighbor language model, Nearest Neighbor Language Model, k-nearest-neighbor language model
A k-nearest neighbor language model augments a pretrained neural language model with nearest-neighbor retrieval from an external datastore of context–target pairs. For a given query, it retrieves the k most similar contexts and constructs a probability distribution over next tokens from their associated next-word labels, then interpolates this distribution with the neural model’s own next-token probabilities to produce predictions.  · merged: Nearest Neighbor Language Model, k-nearest neighbor language model, k-nearest-neighbor language model

### BERT  [1 docs, x10] [new]  · aliases: Bidirectional Encoder Representations from Transformers, Deep bidirectional Transformer, BERT Transformer
BERT (Bidirectional Encoder Representations from Transformers) is a Transformer-based language model that builds contextual representations by attending to both the left and right context of each token. It is pre-trained using masked language modeling and is then fine-tuned for a variety of downstream natural language understanding tasks.  · merged: Bidirectional Encoder Representations from Transformers, Deep bidirectional Transformer, BERT Transformer

### Key-Value Datastore  [1 docs, x10] [new]  · aliases: datastore
A key-value datastore stores pairs of keys and values so they can be retrieved later. In language modeling, keys are vector representations of a context and values are the corresponding target tokens; at inference time, a query context is matched against stored keys and the associated values are aggregated to form predictions.  · merged: Datastore

### Multi-head attention  [1 docs, x8] [new]
Multi-head attention applies several attention operations in parallel and combines their outputs. This lets a model capture different kinds of relationships and dependencies at the same time.

### Nearest neighbor search  [1 docs, x7] [judged-distinct]  · aliases: Nearest Neighbor Retrieval, Nearest-neighbor retrieval, k-nearest neighbor retrieval
Nearest neighbor search is a retrieval method for finding the k stored items that are closest to a query according to a chosen distance or similarity function, often in an embedding or vector space. It is commonly used to efficiently search large collections and return similar examples or states, which can then be used directly or aggregated to support downstream tasks such as prediction through information transfer from nearby items.  · merged: Nearest Neighbor Retrieval, Nearest-neighbor retrieval, k-nearest neighbor retrieval

### Fine-tuning approach  [1 docs, x6] [judged-distinct]  · aliases: fine-tuning
A training strategy that adapts a pre-trained language representation model to a downstream task by continuing training on task-specific data and updating the model’s parameters. It typically avoids introducing separate task-specific architectures by reusing the same underlying model, thereby leveraging general language knowledge while improving task performance.  · merged: Fine-tuning

### Masked language model  [1 docs, x6] [new]  · aliases: MLM, Masked language modeling
A pre-training objective in which some input tokens are hidden and the model learns to predict the missing tokens from surrounding context. By using both left and right context around the masked positions, it encourages bidirectional language understanding and representations that reflect information from the entire sequence.  · merged: Masked language modeling

### Perplexity  [1 docs, x6] [new]
Perplexity is an evaluation measure for probabilistic language models that reflects how well the model predicts a sequence of words. Lower perplexity indicates that the model assigns higher probability to the observed text.

### Generative Pre-trained Transformer  [1 docs, x5] [judged-distinct]  · aliases: OpenAI GPT, GPT, GPT Transformer
A Generative Pre-trained Transformer (GPT) is a Transformer-based language model trained with a left-to-right autoregressive objective to predict the next token given the preceding tokens. It is typically pretrained on large amounts of unlabeled text to learn general language representations and fluent text generation. GPT models are commonly adapted to downstream tasks by fine-tuning on task-specific labeled data.  · merged: OpenAI GPT, GPT Transformer

### Cloze task  [1 docs, x5] [judged-distinct]
A language task in which words are removed from a passage and the missing words must be inferred from context. It is closely related to masked-token prediction objectives in language modeling.

### Next sentence prediction  [1 docs, x5] [judged-distinct]  · aliases: NSP
A pre-training task that trains a model to decide whether one sentence logically follows another. It is used to learn representations for sentence pairs and to improve cross-sentence understanding.

### Cache model  [1 docs, x5] [judged-distinct]  · aliases: Neural cache model, Online language model, Continuous Cache
A cache model is a language modeling approach that improves inference by storing recent hidden representations (or other intermediate states) and reusing them to influence the model’s next-token predictions. By biasing predictions toward recently seen contexts, it acts as a lightweight memory mechanism that complements other modeling methods, including retrieval-based language models.  · merged: Online language model, Continuous Cache

### Scaled dot-product attention  [1 docs, x4] [new]
Scaled dot-product attention is an attention formulation that computes compatibility scores with dot products and scales them before normalization. The scaling helps keep gradients and score magnitudes well behaved when the dimensionality is large.

### Convolutional layer  [1 docs, x4] [judged-distinct]  · aliases: convolutional neural network layer, Contiguous convolution
A convolutional layer applies learned kernels (filters) to local, contiguous windows of a sequence, producing feature maps that capture patterns from nearby positions. By stacking convolutional layers, the network increases its effective receptive field, enabling information from more distant positions to influence later representations.  · merged: Contiguous convolution

### GLUE benchmark  [1 docs, x4] [new]  · aliases: General Language Understanding Evaluation benchmark, GLUE
A benchmark suite of standardized natural language understanding tasks used to compare the performance of language models across multiple problems. By aggregating diverse sentence- and text-level tasks under a common evaluation framework, it enables assessment of transfer and generalization and provides results suitable for leaderboard-style comparison.  · merged: GLUE

### Special classification token  [1 docs, x4] [new]  · aliases: CLS token, [CLS], Classification token, [CLS] representation, [CLS] token
A special reserved input token prepended to an input sequence in transformer models. The model’s final hidden state for this token is commonly used as a single vector representation of the entire sequence for downstream prediction tasks, such as single-sentence and sentence-pair classification.  · merged: Classification token, [CLS] representation, [CLS] token

### Domain adaptation  [1 docs, x4] [new]
Domain adaptation is the process of adjusting a model so that it performs well on a target domain that differs from the data used for initial training. It often relies on changing the data source, features, or retrieval memory rather than retraining the full model.

### Interpolation parameter  [1 docs, x4] [judged-distinct]  · aliases: lambda
A scalar weight used to balance two or more probability distributions or scores when combining model components. In retrieval-augmented language modeling, it controls how strongly retrieved neighbors influence the final prediction.

### Sinusoidal positional encoding  [1 docs, x3] [judged-distinct]  · aliases: sine and cosine positional encoding
Sinusoidal positional encoding is a fixed positional encoding scheme that assigns each embedding dimension a sine or cosine wave at a different frequency. The frequencies are typically arranged so the model can represent position information across a range of wavelengths and may generalize to longer sequences.

### Learned positional embedding  [1 docs, x3] [judged-distinct]  · aliases: learned positional encodings, Positional embedding
A learned positional embedding is a set of vector parameters that represent token positions in a sequence and are optimized during training rather than computed from a fixed formula. These position vectors are added to (or otherwise combined with) token embeddings so the model can incorporate order and relative positional information while processing the sequence.  · merged: Positional embedding

### Beam search  [1 docs, x3] [new]
A decoding algorithm that keeps the top-scoring partial hypotheses at each step while generating a sequence. It trades off search breadth and efficiency to produce higher-quality outputs than greedy decoding in many sequence generation tasks.

### Named entity recognition  [1 docs, x3] [new]  · aliases: NER
A token-level information extraction task that identifies spans of text corresponding to entities such as people, organizations, and locations. It requires fine-grained predictions at the token level.

### Question answering  [1 docs, x3] [new]  · aliases: QA, question answering task
Question answering is a task in which a model responds to a question using a supporting passage or document. In extractive settings, the model identifies and outputs the exact text span within the passage that contains the answer; in token-level or span-based variants, it similarly predicts the relevant answer tokens using contextual information.  · merged: question answering task

### Stanford Question Answering Dataset  [1 docs, x3] [new]  · aliases: SQuAD
The Stanford Question Answering Dataset (SQuAD) is an extractive question answering benchmark made from question–answer pairs generated from Wikipedia passages. It is used to train and evaluate models that locate the correct answer by predicting the exact text span within the given passage.  · merged: SQuAD

### BERT Base  [1 docs, x3] [new]  · aliases: BERTBASE
BERT Base is a standard BERT configuration with 12 transformer layers, a hidden size of 768, and 12 self-attention heads. It represents the “base” model capacity in the BERT family and is commonly fine-tuned on downstream NLP tasks as a compact reference model for comparison.  · merged: BERTBASE

### BERT Large  [1 docs, x3] [judged-distinct]  · aliases: BERTLARGE
BERT Large is a larger configuration of the BERT Transformer model, typically with 24 layers, a hidden size of 1024, and 16 self-attention heads. Its increased parameters and representational capacity often yield better performance than smaller BERT variants when fine-tuned on downstream tasks, particularly when labeled training data is limited.  · merged: BERTLARGE

### k-nearest neighbors model  [1 docs, x3] [judged-distinct]  · aliases: kNN model, nearest neighbor model, k-nearest neighbors
A k-nearest neighbors model makes predictions by retrieving the k stored examples closest to a query under a chosen distance (or similarity) function. The retrieved neighbors are used to estimate the output, typically assigning greater influence to nearer items, such as through weighted voting for classification or averaging for regression. Similarity is often computed in an embedding or other feature space, making the approach memory-based.  · merged: k-nearest neighbors

### Linear interpolation  [1 docs, x3] [new]  · aliases: Probability Interpolation, Interpolation
Linear interpolation is a method for combining two (or more) probability distributions by taking a weighted average, controlled by mixing/interpolation coefficients, to produce a single output distribution. In language modeling, it can blend a base model’s predicted next-token probabilities with retrieval-based probabilities using specified interpolation weights.  · merged: Probability Interpolation, Interpolation

### Transformer language model  [1 docs, x3] [judged-distinct]  · aliases: Transformer LM, vanilla Transformer language model
A Transformer language model is a language model built on the Transformer architecture, using self-attention layers and position-wise feed-forward networks to compute contextual token representations. It produces hidden states that capture dependencies across the input sequence and are used to predict the next token (or other language modeling targets) and to support downstream tasks such as prediction or retrieval.  · merged: vanilla Transformer language model

### Attention mechanism  [1 docs, x2] [new]  · aliases: attention
An attention mechanism is a method that lets a model selectively focus on different parts of an input when producing an output. It is commonly used in sequence models to connect encoded inputs with decoded outputs and to improve alignment between them.

### Transduction  [1 docs, x2] [new]  · aliases: Sequence transduction
Transduction is the task of mapping one variable-length sequence of symbols to another output sequence. In neural sequence models, it is commonly formulated as an encoder–decoder problem for sequence-to-sequence transformations such as machine translation.  · merged: Sequence transduction

### Encoder-Decoder Architecture  [1 docs, x2] [new]
An encoder-decoder architecture is a neural network design that first encodes an input sequence into an intermediate representation and then decodes that representation into an output sequence. It is widely used for sequence transduction tasks such as translation.

### Parallelization  [1 docs, x2] [new]
Parallelization is the execution of multiple computations at the same time rather than sequentially. In sequence models, it is important because it can significantly reduce training and inference time.

### Global Dependency  [1 docs, x2] [judged-distinct]  · aliases: Long-range dependency
A global dependency is a relationship between distant positions in a sequence that a model must capture to make correct predictions. It contrasts with local dependencies by requiring information exchange across long ranges, where learning can be easier when the effective network path between the relevant positions is short.  · merged: Long-range dependency

### Encoder-decoder attention  [1 docs, x2] [judged-distinct]  · aliases: attention over the encoder output, cross-attention
An attention mechanism in the decoder that attends over the outputs of the encoder stack. It lets the decoder condition each generated position on the full encoded input sequence.

### Dot-Product Attention  [1 docs, x2] [judged-distinct]  · aliases: dot product attention, multiplicative attention
Dot-product attention is an attention mechanism that computes query–key compatibility using the dot product, then converts these compatibility scores into weights to take a weighted sum of the values. It is closely related to scaled dot-product attention, but without applying an explicit scaling factor to the raw dot products. The dot product offers a simple, efficient way to measure similarity between queries and keys.  · merged: Dot Product Attention

### Linear projection  [1 docs, x2] [new]  · aliases: projection, learned linear projection, Linear transformation
A linear projection is a learned affine transformation that maps an input vector into a new vector space, typically implemented as multiplication by a learned weight matrix with an optional bias term. In neural networks, it is used to project learned representations into feature spaces with different dimensionalities. In attention mechanisms, separate projections are commonly applied to queries, keys, and values to produce vectors of sizes appropriate for computing attention.  · merged: Linear transformation

### Restricted self-attention  [1 docs, x2] [judged-distinct]  · aliases: Local self-attention
Restricted self-attention is a variant of self-attention where each token (or output position) attends only to a fixed neighborhood of surrounding tokens rather than all tokens in the sequence. This constraint reduces computation and memory for long sequences, but limits direct interactions between distant positions.  · merged: Local self-attention

### Recurrent layer  [1 docs, x2] [judged-distinct]  · aliases: recurrent neural network layer
A recurrent layer processes a sequence step by step, carrying information forward through a hidden state. Because each step depends on previous steps, it is inherently sequential and can model long-range dependencies through repeated updates.

### Sequence length batching  [1 docs, x2] [new]  · aliases: batching by approximate sequence length, Length-based batching
Sequence length batching is a strategy for grouping training examples with similar sequence lengths so each batch contains comparable amounts of sequence material. By reducing the padding required within each batch, it improves computational efficiency and helps make training more balanced across examples.  · merged: Length-based batching

### Label smoothing  [1 docs, x2] [new]
Label smoothing is a training regularization method that replaces hard target labels with a softened target distribution. It reduces overconfidence in predicted classes and can improve accuracy and translation quality even when perplexity worsens.

### BLEU score  [1 docs, x2] [new]  · aliases: BLEU
The BLEU score is an automatic evaluation metric for comparing machine-generated text to one or more reference translations, commonly used in machine translation. It measures n-gram overlap between the system output and references and applies a brevity penalty to discourage overly short translations. Higher BLEU scores generally correlate with better translation quality, but the score is an approximation of human judgment.  · merged: BLEU

### Checkpoint averaging  [1 docs, x2] [new]  · aliases: averaging checkpoints
A model-ensembling technique that averages the parameters or predictions from several saved training checkpoints. It is used to improve generalization and stabilize final model performance without training a separate ensemble.

### Attention key dimension  [1 docs, x2] [judged-distinct]  · aliases: dk, key dimension
The dimensionality of the key vectors used in an attention mechanism. It determines the size of the space in which queries are matched against keys and affects the computational cost and expressiveness of attention.

### Attention value dimension  [1 docs, x2] [judged-distinct]  · aliases: dv, value dimension
The dimensionality of the value vectors used in an attention mechanism. It controls the size of the information returned by attention and contributes to the model's computational cost.

### ELMo  [1 docs, x2] [new]
A contextual language representation model that provides pre-trained embeddings for downstream tasks. It is commonly used in a feature-based setup, where its representations are added to a task-specific architecture.

### Word embedding  [1 docs, x2] [judged-distinct]  · aliases: Word embedding vectors, Embeddings
A word embedding is a dense vector representation of a word learned from data so that words with similar meanings or usage patterns have nearby vectors. It is used to capture semantic and syntactic regularities in a form that can be fed into machine learning models.

### Sentence embedding  [1 docs, x2] [judged-distinct]
A sentence embedding is a fixed-dimensional vector representation of an entire sentence. It is designed to summarize sentence meaning so that sentences can be compared or used as inputs to downstream models.

### Right-to-left language model  [1 docs, x2] [judged-distinct]  · aliases: Backward language model
A right-to-left language model predicts each token from the tokens that come after it. It provides backward contextual information that complements a forward language model.

### Contextual word embedding  [1 docs, x2] [judged-distinct]  · aliases: Contextual representation, Contextual token representation
A contextual word embedding is a word (token) representation whose vector depends on the sentence or passage where the word appears, rather than being fixed for each word type. By conditioning on surrounding tokens, it enables the model to assign different meanings—or aspects of meaning—to the same word in different contexts.  · merged: Contextual token representation

### Pre-training  [1 docs, x2] [judged-distinct]
A training stage in which a model is taught general language representations on large unlabeled data before being adapted to a specific task. It is used to produce parameters that transfer well to multiple downstream applications.

### Separator token  [1 docs, x2] [judged-distinct]  · aliases: SEP token, [SEP]
A reserved token used to mark boundaries between segments within a single input sequence. It is commonly inserted between paired sentences or other text spans to make their separation explicit.

### Multi-genre natural language inference  [1 docs, x2] [judged-distinct]  · aliases: MNLI
A natural language inference benchmark covering sentence pairs from multiple genres. It is used as a downstream classification task for evaluating and fine-tuning language models.

### Segment embedding  [1 docs, x2] [judged-distinct]  · aliases: sentence embedding, sentence A/B embedding
A learned embedding added to each token to indicate which segment it belongs to, such as sentence A or sentence B. It lets the model represent sentence-pair inputs within one sequence.

### Bidirectional language model  [1 docs, x2] [judged-distinct]  · aliases: deep bidirectional model
A bidirectional language model is a language representation model that encodes or predicts tokens using both left and right context. By conditioning on surrounding tokens from both directions, it captures richer information about the full sequence than models that process text only left-to-right or right-to-left.  · merged: Deep bidirectional model

### Bidirectional cross-attention  [1 docs, x2] [new]  · aliases: bidirectional cross attention, cross-attention
An attention pattern in which two sequences attend to each other in both directions. It enables each sequence’s representations (e.g., tokens within a sentence or passage) to incorporate contextual information from the corresponding elements of the paired sequence.  · merged: Bidirectional cross attention

### Span-based question answering  [1 docs, x2] [judged-distinct]  · aliases: extractive question answering, Answer span scoring
Span-based question answering is a reading-comprehension approach that identifies an answer as a contiguous text span within a given passage. The model computes scores for potential start and end tokens and selects the highest-scoring valid span, typically requiring the end position not to precede the start. The resulting span is returned as the answer.  · merged: Answer span scoring

### Text datastore  [1 docs, x2] [new]  · aliases: datastore, nearest neighbor datastore
A text datastore is a collection of stored text-derived representations with associated targets that can be queried at inference time using nearest-neighbor retrieval. It acts as an external memory that provides similar contexts or continuations to support prediction. Updating or swapping the datastore allows the model to adapt to different domains or data sources.  · merged: nearest neighbor datastore

### Long tail  [1 docs, x2] [new]  · aliases: long-tail phenomenon
The long tail is the portion of a distribution composed of rare events, items, or patterns that occur infrequently but together account for substantial probability or “mass.” In modeling contexts, these long-tail cases are often difficult because they are underrepresented in training data, so models may learn them poorly despite their importance.  · merged: long-tail phenomenon

### prefix embedding  [1 docs, x2] [judged-distinct]  · aliases: prefix representations, Context representation
A prefix embedding is a fixed-length vector representation of a preceding text context, produced by a language model or another encoder to summarize that prefix’s information. Because similar contexts map to nearby points in the vector space, the embeddings can be compared geometrically for retrieval or used to support tasks such as next-token prediction via nearest-neighbor lookup.  · merged: Context representation

### FAISS  [1 docs, x2] [new]
An open-source library for fast nearest-neighbor retrieval in high-dimensional spaces. It is designed to scale search by using approximate indexing methods and compact vector representations, making retrieval practical over very large collections.

### L2 distance  [1 docs, x2] [new]  · aliases: Euclidean distance
L2 distance is the Euclidean distance between two vectors in a metric space. It measures the square-root of the sum of squared coordinate-wise differences and is commonly used to compare embeddings, including in nearest-neighbor search and other similarity-based methods.  · merged: Euclidean distance

### Squared Euclidean distance  [1 docs, x2] [judged-distinct]  · aliases: squared L2 distance, squared L2
Squared Euclidean distance is a distance measure equal to the square of the Euclidean norm between two vectors. It is commonly used in nearest-neighbor search because it preserves the ordering of true Euclidean distances while avoiding an explicit square-root computation.  · merged: Squared L2 distance

### Wikitext-103  [1 docs, x2] [new]  · aliases: WIKITEXT-103
A large language modeling benchmark derived from Wikipedia articles. It is commonly used to evaluate next-word prediction systems and compare perplexity across language models.

### implicit memorization  [1 docs, x2] [judged-distinct]  · aliases: memorization in parameters, Memorization
Implicit memorization is when a neural network encodes and later reproduces specific patterns from its training data directly in its learned parameters, without relying on an external memory. This typically indicates sufficient model capacity to fit the training set closely, and it may lead to poor generalization beyond the training data.  · merged: Memorization

### validation perplexity  [1 docs, x2] [judged-distinct]
A measure of how well a language model predicts held-out validation data. Lower perplexity indicates better predictive performance, and it is commonly used to compare language models under evaluation.

### Parameter-free position representation  [1 docs, x1] [new]  · aliases: positional encoding without parameters
A parameter-free position representation is a way to encode token order without learned position-specific parameters. It provides a model with information about sequence positions while preserving the architecture's ability to process inputs in parallel.

### Tensor2tensor  [1 docs, x1] [new]  · aliases: tensor2tensor, T2T
A TensorFlow-based library and research codebase for building and experimenting with sequence models. It provides reusable implementations of model components, training pipelines, and inference utilities for machine learning research.

### Recurrent Neural Network  [1 docs, x1] [new]  · aliases: RNN
A recurrent neural network is a neural network architecture that processes a sequence step by step, carrying forward a hidden state from one position to the next. This sequential computation makes it natural for sequence data but limits parallelization within a training example.

### Gated Recurrent Neural Network  [1 docs, x1] [judged-distinct]  · aliases: GRU
A gated recurrent neural network is a recurrent architecture that uses gating mechanisms to control information flow across time steps. These gates help the model retain or discard information when processing sequences.

### Sequence Modeling  [1 docs, x1] [new]
Sequence modeling is the task of learning patterns in ordered data such as text or speech. Models for sequence modeling aim to represent dependencies among elements that appear in a specific order.

### Language Modeling  [1 docs, x1] [judged-distinct]
Language modeling is the task of assigning probabilities to sequences of words or tokens. It is used to predict how likely a sequence is and to support generation and understanding of text.

### Hidden State  [1 docs, x1] [new]
A hidden state is an internal vector representation maintained by a neural network while processing a sequence. It summarizes information from previous inputs and is updated as new inputs are read.

### Factorization Trick  [1 docs, x1] [new]
A factorization trick is a computational technique that reduces the cost of sequence processing by reorganizing how operations are computed. Such tricks aim to improve efficiency without necessarily changing the overall learning task.

### Conditional Computation  [1 docs, x1] [new]
Conditional computation is an approach in which only a subset of a model's components are activated for a given input or example. It can improve computational efficiency and, in some settings, model performance.

### Extended Neural GPU  [1 docs, x1] [new]
The Extended Neural GPU is a neural sequence model that reduces sequential computation by using convolutional building blocks. It computes hidden representations in parallel across positions in a sequence.

### ByteNet  [1 docs, x1] [new]
ByteNet is a neural sequence model that uses convolutional neural networks to compute representations in parallel. It reduces sequential processing by increasing the number of operations only logarithmically with distance between positions.

### ConvS2S  [1 docs, x1] [new]
ConvS2S is a convolutional sequence-to-sequence model that computes hidden representations in parallel for all positions in the input and output sequences. Its computational cost for relating distant positions grows linearly with distance.

### Convolutional Neural Network  [1 docs, x1] [judged-distinct]  · aliases: CNN
A convolutional neural network is a neural architecture built from convolution operations that extract local patterns from structured data. In sequence models, it can be used as a parallel alternative to recurrence.

### Dependency  [1 docs, x1] [new]
A dependency is a relationship in which the interpretation or prediction at one position relies on information from another position. Sequence models aim to capture such relationships even when the positions are far apart.

### Effective Resolution  [1 docs, x1] [new]
Effective resolution is the degree to which a model can distinguish or preserve fine-grained positional information in its representations. Methods that average information can reduce effective resolution even when they improve efficiency.

### End-to-End Memory Network  [1 docs, x1] [new]  · aliases: Memory network
A neural network architecture that uses a recurrent attention mechanism to answer questions or model language without relying on sequence-aligned recurrence. It reads and attends over memory representations in multiple steps to produce an output.

### Autoregressive model  [1 docs, x1] [new]  · aliases: Auto-regressive model
A model that generates a sequence one element at a time, conditioning each new element on the previously generated elements. This factorization makes later predictions depend on earlier outputs.

### Residual connection  [1 docs, x1] [new]  · aliases: skip connection
A skip connection that adds a sub-layer's input to its output. It helps information and gradients flow through deep networks and makes optimization more stable.

### Attention function  [1 docs, x1] [new]  · aliases: attention
A function that maps a query and a set of key-value pairs to an output vector. The output is computed as a weighted sum of the value vectors, with weights determined by the compatibility between the query and the keys.

### Query-key-value pair  [1 docs, x1] [judged-distinct]  · aliases: query, key, value
The representation used by attention mechanisms, consisting of a query vector, key vectors, and value vectors. Queries are matched against keys to produce weights that are applied to the values.

### Additive Attention  [1 docs, x1] [judged-distinct]  · aliases: additive attention
An attention mechanism that computes query-key compatibility with a feed-forward network containing a single hidden layer. It is often compared with dot-product attention and can perform better when key and query dimensions are large, though it is typically less efficient to compute than optimized dot-product attention.

### Autoregressive property  [1 docs, x1] [judged-distinct]
The constraint that a position is generated using only earlier positions and not future ones. This property is essential for left-to-right sequence generation and is enforced in decoders by preventing attention to later tokens.

### Softmax mask  [1 docs, x1] [new]  · aliases: Attention mask
A masking operation that sets illegal attention scores to negative infinity before the softmax is applied. This removes forbidden connections by giving them zero probability after normalization.

### ReLU activation  [1 docs, x1] [new]  · aliases: rectified linear unit
ReLU, or rectified linear unit, is an activation function that returns zero for negative inputs and the input itself for positive inputs. It introduces nonlinearity into neural networks while remaining simple and efficient.

### Convolution with kernel size 1  [1 docs, x1] [new]  · aliases: 1x1 convolution
A convolution with kernel size 1 applies the same learned linear transformation independently at each position. It is mathematically equivalent to a position-wise affine projection over feature channels.

### Pre-softmax linear transformation  [1 docs, x1] [new]  · aliases: output projection
A pre-softmax linear transformation projects decoder hidden states into the vocabulary space before the softmax is applied. It produces the logits that are turned into next-token probabilities.

### Path length  [1 docs, x1] [new]  · aliases: maximum path length
The number of computational steps or layers a signal must traverse between two positions in a neural network. Shorter path length generally makes it easier to learn relationships between distant elements in a sequence.

### Computational complexity  [1 docs, x1] [new]  · aliases: total computational complexity per layer
The amount of computation required by a model or layer, often expressed as a function of sequence length. It is used to compare the efficiency of different neural architectures.

### Dilated convolution  [1 docs, x1] [new]  · aliases: atrous convolution
A convolutional operation that inserts gaps between sampled input positions within a kernel. By expanding the receptive field without proportionally increasing kernel width, it can connect distant positions more efficiently than contiguous convolutions.

### Separable convolution  [1 docs, x1] [new]  · aliases: depthwise separable convolution
A convolutional design that factorizes spatial filtering into cheaper components, typically reducing computational cost relative to a full convolution. It is often used to make convolutional models more efficient while preserving expressive power.

### Adam optimizer  [1 docs, x1] [new]  · aliases: Adam
An adaptive gradient-based optimization algorithm that maintains running estimates of first and second moments of the gradients. It is widely used for training neural networks because it combines momentum-like updates with per-parameter learning-rate adaptation.

### Learning rate warmup  [1 docs, x1] [new]  · aliases: warmup
A training schedule in which the learning rate is increased gradually at the beginning of optimization. This helps stabilize early training when parameter estimates are still unreliable.

### Inverse square root learning rate decay  [1 docs, x1] [new]  · aliases: inverse square root decay
A learning rate schedule in which the step size decreases in proportion to the inverse square root of the training step. It provides a smooth decay after an initial warmup period and is often used in sequence models.

### Residual dropout  [1 docs, x1] [judged-distinct]  · aliases: dropout on residual connections
Residual dropout is a regularization technique that applies dropout to a sublayer's output before it is added back to the sublayer input and normalized. It helps prevent overfitting in deep neural networks by randomly removing activations during training.

### WMT 2014 English-to-German translation task  [1 docs, x1] [new]  · aliases: WMT 2014 En-De task, English-to-German translation task
A standard machine translation benchmark in which systems translate English sentences into German and are evaluated against reference translations. It is commonly used to compare translation models using automatic metrics such as BLEU.

### WMT 2014 English-to-French translation task  [1 docs, x1] [judged-distinct]  · aliases: WMT 2014 En-Fr task, English-to-French translation task
A standard machine translation benchmark in which systems translate English sentences into French and are evaluated against reference translations. It is used to compare translation models under a common test setting and automatic scoring.

### Length penalty  [1 docs, x1] [new]  · aliases: length normalization parameter
A decoding adjustment used with beam search to control the preference for longer or shorter generated sequences. It rescales sequence scores so that length differences do not dominate the search objective.

### NVIDIA Tesla K80  [1 docs, x1] [new]  · aliases: K80
A dual-GPU accelerator card based on the Kepler architecture for high-performance computing and machine learning workloads. It provides large-scale parallel floating-point throughput for compute-intensive tasks.

### NVIDIA Tesla K40  [1 docs, x1] [judged-distinct]  · aliases: K40
A GPU accelerator card based on the Kepler architecture for high-performance computing and data processing. It is designed to deliver high floating-point throughput for parallel workloads.

### NVIDIA Tesla M40  [1 docs, x1] [judged-distinct]  · aliases: M40
A GPU accelerator card based on the Maxwell architecture for high-performance computing and deep learning workloads. It is designed to provide high parallel computing throughput, especially for floating-point operations.

### NVIDIA Tesla P100  [1 docs, x1] [judged-distinct]  · aliases: P100
A GPU accelerator card based on the Pascal architecture for high-performance computing and machine learning workloads. It is designed to deliver very high floating-point throughput for parallel computation.

### Base model  [1 docs, x1] [new]  · aliases: base model
The default reference configuration of a model family used for comparison against architectural variants. It fixes a standard set of hyperparameters and serves as the baseline against which changes are evaluated.

### Single-Head Attention  [1 docs, x1] [judged-distinct]  · aliases: single head attention
An attention mechanism that uses only one attention head instead of several parallel heads. It is a simpler form of attention with less representational diversity than multi-head attention.

### Compatibility Function  [1 docs, x1] [judged-distinct]  · aliases: matching function
A function that measures how well a query matches a key in an attention mechanism. It determines the attention scores before normalization and can be implemented by dot product or by a more sophisticated learned alternative.

### Model Capacity  [1 docs, x1] [new]  · aliases: bigger models
The representational ability of a neural network, often increased by using larger hidden dimensions or more parameters. Higher-capacity models can fit more complex patterns but may require more regularization.

### English Constituency Parsing  [1 docs, x1] [new]  · aliases: constituency parsing
A syntactic parsing task that predicts the phrase-structure tree of an English sentence. The output must satisfy structural constraints and is often much longer than the input sequence.

### Recurrent Neural Network Sequence-to-Sequence Model  [1 docs, x1] [judged-distinct]  · aliases: RNN sequence-to-sequence model, sequence-to-sequence model, seq2seq model
A sequence-to-sequence architecture that uses recurrent neural networks to encode an input sequence and decode an output sequence. It is a standard baseline for tasks such as translation and parsing, especially in earlier neural NLP systems.

### Wall Street Journal Portion of the Penn Treebank  [1 docs, x1] [new]  · aliases: WSJ portion of the Penn Treebank, WSJ, Penn Treebank
A benchmark corpus consisting of Wall Street Journal text from the Penn Treebank, commonly used for syntactic parsing experiments. It provides a standardized training and evaluation split for constituency parsing.

### Semi-Supervised Learning  [1 docs, x1] [new]  · aliases: semi-supervised setting
A learning setting that combines a smaller labeled dataset with a larger set of additional data that may be unlabeled or weakly labeled. It is used to improve model performance when fully annotated data are limited.

### Pre-trained language representations  [1 docs, x1] [new]  · aliases: pre-trained representations, pre-trained language representations
Language representations learned on large text corpora before being applied to downstream tasks. They provide general linguistic information that can be reused by task-specific models.

### Feature-based approach  [1 docs, x1] [judged-distinct]  · aliases: feature-based
A way of applying pre-trained language representations in which the representations are used as additional input features for a separate task-specific model. The downstream architecture is typically designed around the task and does not fully update the pre-trained model during training.

### Unidirectional language model  [1 docs, x1] [judged-distinct]  · aliases: unidirectional LM
A language model that predicts text using context from only one direction, such as left-to-right or right-to-left. Because it cannot incorporate both left and right context simultaneously, it can limit the quality of learned representations for some tasks.

### Sentence-level tasks  [1 docs, x1] [new]
Tasks in which the model must make predictions about an entire sentence or sentence pair rather than individual tokens. They often rely on holistic understanding of the input.

### Token-level tasks  [1 docs, x1] [judged-distinct]
Tasks in which a model must produce predictions for individual tokens or spans of tokens. They require fine-grained outputs aligned to the input sequence.

### Pre-trained word embedding  [1 docs, x1] [judged-distinct]  · aliases: word embedding, word embeddings
A vector representation of words learned before training on a downstream task. Such embeddings capture general distributional information and can improve performance compared with embeddings learned from scratch.

### Bidirectional pre-training  [1 docs, x1] [new]
A pre-training approach that learns language representations from both preceding and following context. It is intended to produce richer representations than methods that rely only on one direction of text.

### Left-to-right language modeling objective  [1 docs, x1] [judged-distinct]  · aliases: language modeling objective
A training objective that teaches a model to predict the next token from previous tokens only. It is commonly used to pre-train word vectors and other unidirectional language models.

### Context discrimination objective  [1 docs, x1] [new]  · aliases: Discriminative context objective
A context discrimination objective trains a model to distinguish correct words from incorrect words using the surrounding left and right context. It encourages learned representations to encode information that makes the true token more compatible with its context than alternatives.

### Paragraph embedding  [1 docs, x1] [judged-distinct]
A paragraph embedding is a vector representation that summarizes the content of a paragraph. It is used to encode longer text units into a compact form suitable for prediction or retrieval tasks.

### Sentence representation  [1 docs, x1] [judged-distinct]
A sentence representation is any encoded form that captures the meaning or structure of a sentence for use by another model. Such representations are often learned so that they support tasks like ranking, generation, or classification.

### Next sentence ranking  [1 docs, x1] [new]
Next sentence ranking is a training objective in which a model scores candidate sentences according to how likely they are to follow a given sentence. The model is trained to assign higher scores to the true continuation than to incorrect alternatives.

### Next sentence word generation  [1 docs, x1] [judged-distinct]
Next sentence word generation is a training objective in which a model generates the words of a following sentence from a representation of the previous sentence. It forces the representation to preserve enough information to support sequential text prediction.

### Denoising autoencoder objective  [1 docs, x1] [new]  · aliases: Denoising autoencoder
A denoising autoencoder objective trains a model to reconstruct original text from a corrupted version of the input. By learning to undo noise, the model acquires representations that capture robust structure in the data.

### Sentiment analysis  [1 docs, x1] [new]
Sentiment analysis is the task of identifying the emotional polarity or attitude expressed in text. It typically classifies text as positive, negative, or neutral, or predicts a finer-grained sentiment label.

### Unsupervised fine-tuning  [1 docs, x1] [judged-distinct]  · aliases: unsupervised fine-tuning approaches
A transfer-learning approach in which a model is first pretrained on unlabeled text and then adapted to a target task with limited labeled data. It reduces the amount of parameter learning required from scratch during task-specific training.

### Sentence encoder  [1 docs, x1] [judged-distinct]  · aliases: document encoder
A model that converts an input sentence into a fixed or structured vector representation capturing its meaning. Sentence encoders can be pretrained on unlabeled text and then fine-tuned for supervised tasks.

### Downstream task  [1 docs, x1] [judged-distinct]  · aliases: supervised downstream task
A target application task that a pretrained model is adapted to after pretraining, such as classification or question answering. Fine-tuning optimizes the model to perform well on the specific target objective.

### Transfer learning  [1 docs, x1] [judged-distinct]
A learning approach in which knowledge acquired from one task or dataset is reused to improve performance on another task. In language processing, it often means starting from a pre-trained model and adapting it to a new downstream problem.

### Natural language inference  [1 docs, x1] [new]  · aliases: NLI
A supervised task that predicts the relationship between two sentences, typically whether one entails, contradicts, or is neutral with respect to the other. It is often used as a source of transferable sentence-level supervision.

### ImageNet  [1 docs, x1] [new]
A large labeled image dataset widely used to pre-train computer vision models. Models trained on it often transfer effectively when fine-tuned on other visual tasks.

### Transformer block  [1 docs, x1] [judged-distinct]
A standard building block of a Transformer made up of self-attention and feed-forward computations. Stacking multiple blocks increases model depth and representational capacity.

### Hidden size  [1 docs, x1] [new]
The dimensionality of the internal vector representation used by a neural network layer. In Transformer models, it determines the width of token embeddings and hidden states.

### Layer  [1 docs, x1] [new]
A level in a stacked neural network architecture that transforms representations from one form to another. In Transformer models, multiple layers are composed sequentially to build deeper representations.

### Input embedding  [1 docs, x1] [judged-distinct]  · aliases: input representation
The vector representation given to each token before it enters the model. In this architecture, it is formed by adding the token, segment, and position embeddings together.

### WordPiece token  [1 docs, x1] [judged-distinct]  · aliases: WordPiece
A subword token produced by the WordPiece tokenization scheme. WordPiece tokens split words into smaller units so that a language model can represent rare or unseen words more effectively.

### Denoising autoencoder  [1 docs, x1] [judged-distinct]  · aliases: denoising auto-encoder
A model that learns by reconstructing clean input from a corrupted version of that input. Its training objective is broader than masked language modeling because it typically aims to recover the entire original input, not just selected missing parts.

### MASK token  [1 docs, x1] [judged-distinct]  · aliases: [MASK] token
A special placeholder token used to replace selected input words during masked language model training. It marks positions that the model must infer from surrounding context.

### Cross-Entropy Loss  [1 docs, x1] [new]
A loss function that measures the difference between a predicted probability distribution and the target distribution. It is commonly used for classification and language-modeling objectives by penalizing low probability assigned to the correct target.

### BERT input representation  [1 docs, x1] [judged-distinct]  · aliases: BERT input embeddings
A text input format for BERT that combines token embeddings, segment embeddings, and position embeddings into a single vector representation for each input token. It is designed to encode both the identity of tokens and their order and sentence membership for transformer-based language understanding.

### Pre-training corpus  [1 docs, x1] [judged-distinct]  · aliases: pretraining corpus
A large text collection used to train a language model before task-specific fine-tuning. It provides broad linguistic and semantic patterns that the model can later reuse for downstream applications.

### BooksCorpus  [1 docs, x1] [judged-distinct]  · aliases: Books Corpus
A large-scale corpus of unpublished books used as a source of contiguous natural language text for language model pre-training. It is valuable for learning long-range dependencies and discourse-level patterns.

### Document-level corpus  [1 docs, x1] [new]  · aliases: document level corpus
A text corpus organized at the level of whole documents rather than isolated shuffled sentences. It preserves long contiguous sequences, which are useful for learning cross-sentence context and discourse structure.

### Token representation  [1 docs, x1] [judged-distinct]  · aliases: token-level representation
A contextual vector assigned to an individual token in a sequence. These vectors are passed to token-level output layers for tasks such as sequence tagging and question answering.

### Classification layer  [1 docs, x1] [new]  · aliases: Classifier head
A task-specific output layer that maps a sequence representation to label scores. It is commonly added during fine-tuning to adapt a pretrained model to a classification problem.

### Quora Question Pairs  [1 docs, x1] [new]  · aliases: QQP
A paraphrase detection task that determines whether two questions have the same meaning. It is used to measure semantic similarity and duplicate-question recognition.

### Question Natural Language Inference  [1 docs, x1] [new]  · aliases: QNLI
A question-answer entailment task that evaluates whether a question is answerable by a given passage or context. It tests a model's ability to reason about question relevance and textual entailment.

### Stanford Sentiment Treebank 2  [1 docs, x1] [new]  · aliases: SST-2, Stanford Sentiment Treebank
A sentiment classification dataset built from movie review snippets. It is used to predict the overall sentiment expressed in short text.

### Corpus of Linguistic Acceptability  [1 docs, x1] [new]  · aliases: CoLA
A grammatical acceptability task that asks whether a sentence sounds well-formed to native speakers. It is used to evaluate sensitivity to syntax and linguistic acceptability judgments.

### Semantic Textual Similarity Benchmark  [1 docs, x1] [new]  · aliases: STS-B
A sentence-pair regression task that measures how semantically similar two texts are. Models are evaluated by how closely their similarity scores match human judgments, often using Spearman correlation.

### Microsoft Research Paraphrase Corpus  [1 docs, x1] [judged-distinct]  · aliases: MRPC
A paraphrase identification task consisting of sentence pairs labeled for semantic equivalence. It is used to measure whether two sentences express the same meaning.

### Recognizing Textual Entailment  [1 docs, x1] [judged-distinct]  · aliases: RTE
A textual entailment task that evaluates whether one sentence logically follows from another. It is a standard benchmark for natural language inference and semantic reasoning.

### BiLSTM with ELMo and attention  [1 docs, x1] [new]  · aliases: BiLSTM+ELMo+Attn
A neural text classification or matching model that combines a bidirectional LSTM encoder with contextual ELMo representations and an attention mechanism. It uses contextual word embeddings and alignment between tokens to improve sentence understanding.

### attention masking  [1 docs, x1] [judged-distinct]
A mechanism that controls which positions in a sequence can attend to other positions during self-attention. It is used to shape the information flow in transformer models and can distinguish different model architectures.

### MNLI  [1 docs, x1] [judged-distinct]  · aliases: Multi-Genre Natural Language Inference
A natural language inference task that asks whether a hypothesis is entailed by, contradicts, or is neutral with respect to a premise. It is one of the largest and most widely reported tasks in the GLUE benchmark.

### random restarts  [1 docs, x1] [new]
A training strategy that repeats fine-tuning multiple times from the same pre-trained checkpoint with different random shuffles or parameter initializations. It is used to reduce instability and select the best-performing model on validation data.

### pre-trained checkpoint  [1 docs, x1] [new]
A saved set of model parameters obtained after pre-training. It provides the starting point for fine-tuning on downstream tasks and can be reused across multiple training runs.

### classifier layer initialization  [1 docs, x1] [new]
The process of setting the initial weights of a classifier head before fine-tuning. Different initializations can lead to different optimization outcomes when training is unstable.

### fine-tuning learning rate  [1 docs, x1] [judged-distinct]
The learning rate used when adapting a pre-trained model to a downstream task. It is typically chosen by validation performance because it strongly affects fine-tuning stability and final accuracy.

### Packed sequence input representation  [1 docs, x1] [new]  · aliases: single packed sequence
An input formatting scheme that concatenates the question and passage into a single sequence for a transformer or similar encoder. Different segment embeddings are used to indicate which tokens belong to the question and which belong to the passage.

### Start vector  [1 docs, x1] [new]  · aliases: S vector
A learned vector used to score which token in a passage is the beginning of an answer span. It is compared with each token representation, typically by dot product, to produce start-position probabilities.

### End vector  [1 docs, x1] [judged-distinct]  · aliases: E vector
A learned vector used to score which token in a passage is the end of an answer span. It is compared with each token representation, typically by dot product, to produce end-position probabilities.

### TriviaQA  [1 docs, x1] [new]
A large-scale question answering dataset built from trivia questions and their associated answers. It is often used for pretraining or intermediate fine-tuning before adapting a model to another question answering benchmark.

### Neural language model  [1 docs, x1] [judged-distinct]  · aliases: LM, language model
A neural language model is a model that predicts the next word in a sequence using learned vector representations of preceding text. It typically maps sentence prefixes to fixed-size representations and then uses those representations to produce a distribution over possible next words.

### Embedding space  [1 docs, x1] [judged-distinct]  · aliases: representation space
An embedding space is a vector space in which items such as words, phrases, or contexts are represented by learned continuous vectors. Distances in this space are used to measure similarity between items and to support retrieval-based methods such as nearest-neighbor search.

### Representation learning  [1 docs, x1] [new]
Representation learning is the process of learning useful internal features or embeddings from data. In language processing, it aims to encode text prefixes into vectors that capture information relevant for downstream prediction.

### Next-word prediction  [1 docs, x1] [judged-distinct]  · aliases: next token prediction
Next-word prediction is the task of estimating the most likely next token in a sequence given the preceding context. It is the central objective of many language models and is used to generate or score text.

### pretrained language model  [1 docs, x1] [judged-distinct]  · aliases: pre-trained LM, LM
A language model that has been trained on a large corpus before being adapted or combined with another method. Its learned parameters and embedding space provide a general representation of text that can be reused for downstream prediction tasks.

### Context-Target Pair  [1 docs, x1] [new]
A paired representation consisting of a token context and the token that follows it. Such pairs are used to connect an input context with the next-token target during training and retrieval-based inference.

### Key-value pair  [1 docs, x1] [judged-distinct]
A key-value pair is a stored association between an input key and a corresponding value. In retrieval-based language modeling, the key is a context vector and the value is the next target word observed for that context.

### Nearest neighbor distribution  [1 docs, x1] [judged-distinct]  · aliases: kNN distribution
A nearest neighbor distribution is a probability distribution over vocabulary items constructed from retrieved neighbors of a query. Each neighbor contributes probability mass to its target word, typically weighted by a function of its distance from the query.

### WIKI-100M  [1 docs, x1] [new]
A random 100 million token subset of the WIKI-3B corpus. It consists of complete articles rather than arbitrary text fragments.

### BERT vocabulary  [1 docs, x1] [judged-distinct]  · aliases: 29K subword vocabulary
The 29,000-item subword vocabulary associated with BERT. It provides a fixed set of token units used by byte-pair encoding in the described experiments.

### Decoder-only Transformer  [1 docs, x1] [judged-distinct]  · aliases: Transformer decoder
A Transformer architecture that generates text using only a decoder stack and causal self-attention. It models each token based on previous tokens in the context and is commonly used for language modeling.

### Adaptive input  [1 docs, x1] [new]
A parameterization for word embeddings that allocates modeling capacity unevenly across the vocabulary. It typically uses different embedding sizes or transforms for frequent and infrequent tokens to improve efficiency.

### Adaptive softmax  [1 docs, x1] [judged-distinct]
A softmax approximation that reduces computation for large vocabularies by partitioning words into frequency-based clusters. It speeds up training and inference while preserving good probability estimates for common and rare tokens.

### Negative log-likelihood  [1 docs, x1] [new]
A loss function that measures how much probability a model assigns to observed data. In language modeling, it is minimized so that the model increases the likelihood of the training corpus.

### Training set  [1 docs, x1] [new]
The collection of examples used to fit a model's parameters. It provides the data over which statistics, representations, or caches may be built for later use.

### Prior context  [1 docs, x1] [new]
The sequence of preceding tokens available to a language model when predicting the next token. Longer prior context gives the model more surrounding information for contextual disambiguation.

### FAISS index  [1 docs, x1] [judged-distinct]  · aliases: FAISS
An approximate nearest-neighbor search index built with FAISS for efficient similarity lookup over large vector collections. It supports fast retrieval by organizing vectors into clusters and searching only a subset of them.

### Cluster centroid  [1 docs, x1] [new]  · aliases: centroid
A representative vector for a cluster of data points, typically used in vector quantization or approximate nearest-neighbor search. Centroids help reduce search cost by partitioning the space into regions that can be searched selectively.

### Quantization  [1 docs, x1] [new]  · aliases: vector quantization
A compression method that maps high-precision vectors to lower-precision or compact representations. In vector search systems, it reduces memory usage and can speed up similarity computation at some cost in accuracy.

### Continuous cache model  [1 docs, x1] [judged-distinct]
A cache-based language modeling technique that predicts tokens by retrieving similar recent hidden states from earlier positions in the same document. It improves prediction by exploiting short-range repetition and topical locality in text.

### Vanilla language model  [1 docs, x1] [judged-distinct]  · aliases: vanilla LM
A standard language model that predicts tokens directly from learned parameters without retrieval augmentation or external memory. It serves as a baseline for comparison against enhanced language modeling methods.

### Transformer language model layer  [1 docs, x1] [judged-distinct]  · aliases: Transformer LM layer
A layer in a Transformer-based language model that combines attention, a feed-forward transformation, and normalization steps. It processes token representations to produce contextualized hidden states used for next-token prediction.

### In-domain language model  [1 docs, x1] [new]  · aliases: in-domain LM
A language model trained on data from the same domain as the target evaluation data. Because its training distribution matches the target domain, it typically achieves lower perplexity than an out-of-domain model.

### Quantized key  [1 docs, x1] [judged-distinct]
A compressed vector representation used to reduce memory usage and speed up similarity search. Quantization lowers precision, which can trade off accuracy for efficiency in nearest-neighbor retrieval.

### Full-precision key  [1 docs, x1] [judged-distinct]
A vector representation stored without aggressive compression or quantization. Using full precision can improve the accuracy of similarity computations in nearest-neighbor search.

### n-gram language model  [1 docs, x1] [judged-distinct]  · aliases: n-gram LM
A probabilistic language model that predicts the next token from a fixed-size context of previous tokens. It estimates local word-sequence statistics directly from observed n-gram counts or smoothed n-gram probabilities.

### learned representation function  [1 docs, x1] [judged-distinct]  · aliases: f(·), representation function
A neural mapping that converts input contexts or examples into vector representations. These representations are designed so that similar contexts are placed near each other, enabling similarity-based retrieval or comparison.

### explicit memory  [1 docs, x1] [judged-distinct]
Information stored outside model parameters and accessed directly during prediction. In neural language modeling, this typically means a retrievable collection of stored examples or representations rather than knowledge encoded implicitly in weights.

### rare pattern  [1 docs, x1] [new]
A sequence or structure that appears only infrequently in the data. Rare patterns are challenging for standard parametric models because they provide limited direct evidence during training.

### factual knowledge  [1 docs, x1] [new]
Information about real-world facts such as entities, properties, and relationships. In language modeling, it often appears as memorized or retrievable content rather than purely syntactic regularities.

### near-duplicate sentence  [1 docs, x1] [new]
A sentence that is almost the same as another sentence, differing only slightly in wording or punctuation. Such sentences can be highly useful for retrieval-based methods because they provide closely matching context for prediction.

### overfitting  [1 docs, x1] [new]
A situation in which a model fits the training data extremely well but performs worse on unseen data. It usually indicates that the model has captured idiosyncratic details of the training set rather than generalizable structure.

### training loss  [1 docs, x1] [new]
The objective value computed on the training set during optimization. Lower training loss means the model is fitting the observed data better, and a value near zero indicates near-perfect fit on the training examples.

## Relations (336)

- kNN-LM —uses→ Key-Value Datastore  (x7)
- BERT —uses→ Masked language model  (x4)
- Transformer —uses→ Multi-head attention  (x3)
- Checkpoint averaging —is used with→ Transformer  (x3)
- kNN-LM —uses→ Nearest neighbor search  (x3)
- kNN-LM —is evaluated by→ Perplexity  (x3)
- Transformer —uses→ Scaled dot-product attention  (x2)
- Transformer —uses→ Positional encoding  (x2)
- Multi-head attention —uses→ Scaled dot-product attention  (x2)
- Multi-head attention —is composed of→ Attention head  (x2)
- Transformer —is evaluated on→ WMT 2014 English-to-German translation task  (x2)
- Transformer —uses→ Self-attention  (x2)
- Masked language model —is inspired by→ Cloze task  (x2)
- BERT —uses→ Next sentence prediction  (x2)
- BERT —uses→ Pre-training  (x2)
- BERT —uses→ Fine-tuning approach  (x2)
- BERT —uses→ Self-attention  (x2)
- kNN-LM —uses→ Linear interpolation  (x2)
- kNN-LM —is evaluated on→ Wikitext-103  (x2)
- Cache model —is additive with→ kNN-LM  (x2)
- Nearest neighbor search —uses→ Key-Value Datastore  (x2)
- Transformer —is based on→ Attention mechanism  (x1)
- Transformer —is based on→ Self-attention  (x1)
- Self-attention —is a kind of→ Attention mechanism  (x1)
- Transformer —uses→ Parameter-free position representation  (x1)
- Tensor2tensor —implements→ Transformer  (x1)
- Long Short-Term Memory —is a kind of→ Recurrent Neural Network  (x1)
- Gated Recurrent Neural Network —is a kind of→ Recurrent Neural Network  (x1)
- Language Modeling —is a kind of→ Sequence Modeling  (x1)
- Machine Translation —is a kind of→ Transduction  (x1)
- Encoder-Decoder Architecture —is used for→ Transduction  (x1)
- Hidden State —is used by→ Recurrent Neural Network  (x1)
- Attention mechanism —is used for modeling→ Dependency  (x1)
- Transformer —relies on→ Attention mechanism  (x1)
- Transformer —enables→ Parallelization  (x1)
- Extended Neural GPU —uses→ Convolutional Neural Network  (x1)
- ByteNet —uses→ Convolutional Neural Network  (x1)
- ConvS2S —uses→ Convolutional Neural Network  (x1)
- ConvS2S —makes it harder to learn→ Dependency  (x1)
- ByteNet —makes it harder to learn→ Dependency  (x1)
- Transformer —models→ Global Dependency  (x1)
- Attention mechanism —models→ Global Dependency  (x1)
- Conditional Computation —improves→ Parallelization  (x1)
- Factorization Trick —improves→ Parallelization  (x1)
- ByteNet —reduces→ Effective Resolution  (x1)
- Attention mechanism —allows modeling of→ Global Dependency  (x1)
- Transformer —relies entirely on→ Self-attention  (x1)
- Transformer —includes→ Encoder stack  (x1)
- Transformer —includes→ Decoder stack  (x1)
- Encoder stack —includes→ Multi-head self-attention  (x1)
- Encoder stack —includes→ Position-wise feed-forward network  (x1)
- Encoder stack —uses→ Residual connection  (x1)
- Encoder stack —uses→ Layer normalization  (x1)
- Decoder stack —includes→ Multi-head self-attention  (x1)
- Decoder stack —includes→ Encoder-decoder attention  (x1)
- Decoder stack —includes→ Position-wise feed-forward network  (x1)
- Decoder stack —uses→ Masked self-attention  (x1)
- Decoder stack —uses→ Residual connection  (x1)
- Decoder stack —uses→ Layer normalization  (x1)
- Attention function —maps→ Query-key-value pair  (x1)
- Masked self-attention —is a kind of→ Attention function  (x1)
- Multi-head self-attention —is a kind of→ Attention function  (x1)
- Encoder-decoder attention —is a kind of→ Attention function  (x1)
- Dot-Product Attention —is identical to except for the scaling factor→ Scaled dot-product attention  (x1)
- Multi-head attention —is based on→ Dot-Product Attention  (x1)
- Multi-head attention —uses→ Linear projection  (x1)
- Dot product —is used in→ Multi-head attention  (x1)
- Encoder-decoder attention —is an application of→ Multi-head attention  (x1)
- Self-attention —is an application of→ Multi-head attention  (x1)
- Masked self-attention —is a kind of→ Self-attention  (x1)
- Masked self-attention —preserves→ Autoregressive property  (x1)
- Masked self-attention —is implemented inside→ Scaled dot-product attention  (x1)
- Scaled dot-product attention —uses→ Softmax mask  (x1)
- Position-wise feed-forward network —follows→ Self-attention  (x1)
- Encoder-decoder attention —does not preserve→ Autoregressive property  (x1)
- Position-wise feed-forward network —consists of→ Linear projection  (x1)
- Position-wise feed-forward network —uses→ ReLU activation  (x1)
- Position-wise feed-forward network —is equivalent to→ Convolution with kernel size 1  (x1)
- Embedding —is paired with→ Softmax  (x1)
- Weight tying —shares parameters with→ Embedding  (x1)
- Weight tying —shares parameters with→ Pre-softmax linear transformation  (x1)
- Pre-softmax linear transformation —is followed by→ Softmax  (x1)
- Sinusoidal positional encoding —is a kind of→ Positional encoding  (x1)
- Learned positional embedding —is a kind of→ Positional encoding  (x1)
- Positional encoding —is added to inputs of→ Self-attention  (x1)
- Positional encoding —compensates for lack of recurrence in→ Recurrent layer  (x1)
- Positional encoding —compensates for lack of convolution in→ Convolutional layer  (x1)
- Restricted self-attention —is a kind of→ Self-attention  (x1)
- Self-attention —is compared to→ Recurrent layer  (x1)
- Self-attention —is compared to→ Convolutional layer  (x1)
- Self-attention —is used for→ Transduction  (x1)
- Recurrent layer —is used for→ Transduction  (x1)
- Convolutional layer —is used for→ Transduction  (x1)
- Path length —affects learning of→ Global Dependency  (x1)
- Parallelization —is a separate criterion from→ Computational complexity  (x1)
- Self-attention —has shorter→ Path length  (x1)
- Recurrent layer —has longer→ Path length  (x1)
- Restricted self-attention —is a restricted form of→ Self-attention  (x1)
- Dilated convolution —is a kind of→ Convolutional layer  (x1)
- Separable convolution —is a kind of→ Convolutional layer  (x1)
- Position-wise feed-forward network —is combined with→ Self-attention  (x1)
- Attention head —is a component of→ Self-attention  (x1)
- Byte-pair encoding —is contrasted with→ WordPiece  (x1)
- Sequence length batching —is used with→ Byte-pair encoding  (x1)
- Sequence length batching —is used with→ WordPiece  (x1)
- Adam optimizer —uses→ Learning rate warmup  (x1)
- Adam optimizer —uses→ Inverse square root learning rate decay  (x1)
- Transformer —uses→ Residual dropout  (x1)
- Transformer —uses→ Label smoothing  (x1)
- Transformer —is evaluated by→ BLEU score  (x1)
- Transformer —is evaluated on→ WMT 2014 English-to-French translation task  (x1)
- BLEU score —is used to evaluate→ WMT 2014 English-to-German translation task  (x1)
- BLEU score —is used to evaluate→ WMT 2014 English-to-French translation task  (x1)
- Beam search —is combined with→ Length penalty  (x1)
- Attention head —uses→ Attention key dimension  (x1)
- Attention head —uses→ Attention value dimension  (x1)
- Learned positional embedding —replaces→ Sinusoidal positional encoding  (x1)
- Beam search —is used with→ Transformer  (x1)
- Label smoothing —regularizes→ Transformer  (x1)
- Byte-pair encoding —tokenizes input for→ Transformer  (x1)
- Single-Head Attention —is a simpler form of→ Multi-head attention  (x1)
- Attention head —is a component of→ Multi-head attention  (x1)
- Attention key dimension —constrains the input space of→ Compatibility Function  (x1)
- Dot-Product Attention —is an implementation of→ Compatibility Function  (x1)
- Dropout —regularizes→ Model Capacity  (x1)
- Sinusoidal positional encoding —is replaced by→ Learned positional embedding  (x1)
- English Constituency Parsing —is evaluated with→ Transformer  (x1)
- English Constituency Parsing —is contrasted with→ Recurrent Neural Network Sequence-to-Sequence Model  (x1)
- Wall Street Journal Portion of the Penn Treebank —is used for→ English Constituency Parsing  (x1)
- Semi-Supervised Learning —is used for→ English Constituency Parsing  (x1)
- Beam search —is used for→ English Constituency Parsing  (x1)
- Development Set —is used to tune→ Beam search  (x1)
- BERT —is based on→ Transformer  (x1)
- Feature-based approach —is exemplified by→ ELMo  (x1)
- Fine-tuning approach —is exemplified by→ Generative Pre-trained Transformer  (x1)
- Generative Pre-trained Transformer —uses→ Unidirectional language model  (x1)
- Unidirectional language model —constrains→ Transformer  (x1)
- Named entity recognition —is a kind of→ Token-level tasks  (x1)
- Question answering —is a kind of→ Token-level tasks  (x1)
- Sentence-level tasks —benefit from→ Pre-trained language representations  (x1)
- Token-level tasks —benefit from→ Pre-trained language representations  (x1)
- Fine-tuning approach —is used for→ Token-level tasks  (x1)
- Fine-tuning approach —is used for→ Sentence-level tasks  (x1)
- BERT —is a type of→ Pre-trained language representations  (x1)
- Masked language model —enables→ Bidirectional pre-training  (x1)
- Left-to-right language model —contrasts with→ Bidirectional pre-training  (x1)
- Masked language model —contrasts with→ Left-to-right language model  (x1)
- Pre-trained word embedding —can be trained with→ Left-to-right language modeling objective  (x1)
- Fine-tuning approach —is used by→ BERT  (x1)
- ELMo —uses→ Left-to-right language model  (x1)
- ELMo —uses→ Right-to-left language model  (x1)
- ELMo —produces→ Contextual word embedding  (x1)
- Contextual word embedding —is a kind of→ Word embedding  (x1)
- Cloze task —is used in→ Question answering  (x1)
- Long Short-Term Memory —is used in→ Cloze task  (x1)
- Unsupervised fine-tuning —includes→ Word embedding  (x1)
- Unsupervised fine-tuning —includes→ Sentence encoder  (x1)
- Sentence encoder —produces→ Contextual word embedding  (x1)
- Word embedding —is used in→ Unsupervised fine-tuning  (x1)
- Sentence encoder —is used in→ Unsupervised fine-tuning  (x1)
- Generative Pre-trained Transformer —uses→ Left-to-right language model  (x1)
- Generative Pre-trained Transformer —achieved strong results on→ GLUE benchmark  (x1)
- Generative Pre-trained Transformer —is fine-tuned for→ Downstream task  (x1)
- Pre-training —is followed by→ Fine-tuning approach  (x1)
- Special classification token —is used by→ BERT  (x1)
- Separator token —is used by→ BERT  (x1)
- Fine-tuning approach —is used for→ Named entity recognition  (x1)
- Fine-tuning approach —is used for→ Stanford Question Answering Dataset  (x1)
- Fine-tuning approach —is used for→ Multi-genre natural language inference  (x1)
- Transfer learning —includes→ Natural language inference  (x1)
- Transfer learning —includes→ Machine Translation  (x1)
- Transfer learning —includes→ ImageNet  (x1)
- BERT —is based on→ Encoder stack  (x1)
- Encoder stack —is composed of→ Transformer block  (x1)
- Transformer block —contains→ Attention head  (x1)
- BERT Base —is a configuration of→ BERT  (x1)
- BERT Large —is a configuration of→ BERT  (x1)
- BERT Base —has→ Layer  (x1)
- BERT Large —has→ Layer  (x1)
- BERT Base —has→ Hidden size  (x1)
- BERT Large —has→ Hidden size  (x1)
- Self-attention —is implemented with→ Attention head  (x1)
- Generative Pre-trained Transformer —uses→ Masked self-attention  (x1)
- Special classification token —is part of→ Input embedding  (x1)
- Separator token —is part of→ Input embedding  (x1)
- Segment embedding —is part of→ Input embedding  (x1)
- Positional encoding —is part of→ Input embedding  (x1)
- Segment embedding —is used with→ Separator token  (x1)
- Special classification token —is used for→ Masked language model  (x1)
- Bidirectional language model —is trained by→ Masked language model  (x1)
- Left-to-right language model —is contrasted with→ Bidirectional language model  (x1)
- Right-to-left language model —is contrasted with→ Bidirectional language model  (x1)
- WordPiece —is used to create→ Input embedding  (x1)
- Masked language model —is also referred to as→ Cloze task  (x1)
- Encoder stack —is an implementation of→ Bidirectional language model  (x1)
- Decoder stack —contrasts with→ Bidirectional language model  (x1)
- Masked language model —uses→ MASK token  (x1)
- Masked language model —operates on→ WordPiece token  (x1)
- Masked language model —contrasts with→ Denoising autoencoder  (x1)
- Next sentence prediction —is optimized with→ Cross-Entropy Loss  (x1)
- BERT input representation —includes→ Embedding  (x1)
- BERT input representation —includes→ Segment embedding  (x1)
- BERT input representation —includes→ Positional encoding  (x1)
- Next sentence prediction —is related to→ Sentence embedding  (x1)
- Pre-training corpus —includes→ BooksCorpus  (x1)
- Pre-training corpus —includes→ English Wikipedia  (x1)
- Document-level corpus —contrasts with→ BooksCorpus  (x1)
- Document-level corpus —describes→ English Wikipedia  (x1)
- Fine-tuning approach —is enabled by→ Self-attention  (x1)
- Fine-tuning approach —uses→ Transformer  (x1)
- Self-attention —can unify→ Bidirectional cross-attention  (x1)
- Transformer —is built around→ Self-attention  (x1)
- Self-attention —is used by→ BERT  (x1)
- Self-attention —unifies→ Bidirectional cross-attention  (x1)
- Bidirectional cross-attention —is enabled by→ BERT  (x1)
- Fine-tuning approach —adapts→ BERT  (x1)
- BERT —is evaluated on→ GLUE benchmark  (x1)
- Special classification token —contrasts with→ Token representation  (x1)
- Special classification token —is produced by→ BERT  (x1)
- Token representation —is produced by→ BERT  (x1)
- Special classification token —is used by→ Classification layer  (x1)
- Classification layer —uses→ Softmax  (x1)
- GLUE benchmark —includes→ Multi-genre natural language inference  (x1)
- GLUE benchmark —includes→ Quora Question Pairs  (x1)
- GLUE benchmark —includes→ Question Natural Language Inference  (x1)
- GLUE benchmark —includes→ Stanford Sentiment Treebank 2  (x1)
- GLUE benchmark —includes→ Corpus of Linguistic Acceptability  (x1)
- GLUE benchmark —includes→ Semantic Textual Similarity Benchmark  (x1)
- GLUE benchmark —includes→ Microsoft Research Paraphrase Corpus  (x1)
- GLUE benchmark —includes→ Recognizing Textual Entailment  (x1)
- BiLSTM with ELMo and attention —is compared against→ Generative Pre-trained Transformer  (x1)
- BERT Base —is compared against→ Generative Pre-trained Transformer  (x1)
- BERT Large —is compared against→ Generative Pre-trained Transformer  (x1)
- BERT Base —is a variant of→ BERT  (x1)
- BERT Large —is a variant of→ BERT  (x1)
- Generative Pre-trained Transformer —differs in→ attention masking  (x1)
- BERT Base —can use→ random restarts  (x1)
- BERT Large —can use→ random restarts  (x1)
- random restarts —reuse→ pre-trained checkpoint  (x1)
- random restarts —varies→ classifier layer initialization  (x1)
- fine-tuning learning rate —is selected on→ Development Set  (x1)
- random restarts —is selected on→ Development Set  (x1)
- MNLI —is a task in→ GLUE benchmark  (x1)
- Stanford Question Answering Dataset —is used for→ Question answering  (x1)
- Span-based question answering —uses→ Start vector  (x1)
- Span-based question answering —uses→ End vector  (x1)
- Span-based question answering —uses→ Packed sequence input representation  (x1)
- Stanford Question Answering Dataset —is a benchmark for→ Span-based question answering  (x1)
- TriviaQA —is used for pretraining on→ Span-based question answering  (x1)
- kNN-LM —extends→ Neural language model  (x1)
- kNN-LM —combines with→ k-nearest neighbors model  (x1)
- kNN-LM —retrieves neighbors from→ Embedding space  (x1)
- kNN-LM —draws neighbors from→ Text datastore  (x1)
- kNN-LM —improves→ Perplexity  (x1)
- kNN-LM —enables→ Domain adaptation  (x1)
- Neural language model —depends on→ Representation learning  (x1)
- Neural language model —uses for→ Next-word prediction  (x1)
- k-nearest neighbors model —uses→ Nearest neighbor search  (x1)
- k-nearest neighbors model —measures distance in→ Embedding space  (x1)
- Text datastore —helps predict→ Long tail  (x1)
- kNN-LM —extends→ pretrained language model  (x1)
- kNN-LM —interpolates with→ k-nearest neighbors model  (x1)
- kNN-LM —uses→ prefix embedding  (x1)
- k-nearest neighbors model —queries→ Text datastore  (x1)
- prefix embedding —is matched against→ Text datastore  (x1)
- kNN-LM —augments→ Left-to-right language model  (x1)
- Key-Value Datastore —stores→ Context-Target Pair  (x1)
- Nearest neighbor search —queries→ Key-Value Datastore  (x1)
- Linear interpolation —is used in→ kNN-LM  (x1)
- Key-Value Datastore —is composed of→ Key-value pair  (x1)
- prefix embedding —forms the key in→ Key-value pair  (x1)
- k-nearest neighbors model —are retrieved from→ Key-Value Datastore  (x1)
- kNN-LM —uses→ Nearest neighbor distribution  (x1)
- Self-attention —produces→ prefix embedding  (x1)
- Linear interpolation —combines with→ Nearest neighbor distribution  (x1)
- FAISS —is used for→ Nearest neighbor search  (x1)
- kNN-LM —uses→ FAISS  (x1)
- Cache model —is superseded by→ Self-attention  (x1)
- Cache model —uses→ Nearest neighbor search  (x1)
- L2 distance —is used by→ FAISS  (x1)
- Dot product —is used by→ FAISS  (x1)
- WIKI-100M —is a subset of→ English Wikipedia  (x1)
- Byte-pair encoding —uses→ BERT vocabulary  (x1)
- Decoder-only Transformer —uses→ Self-attention  (x1)
- kNN-LM —is built on→ Decoder-only Transformer  (x1)
- Perplexity —is derived from→ Negative log-likelihood  (x1)
- Adaptive softmax —can use→ Weight tying  (x1)
- Adaptive input —is paired with→ Adaptive softmax  (x1)
- kNN-LM —augments→ Transformer language model  (x1)
- Transformer language model —contains→ Self-attention  (x1)
- Transformer language model —contains→ Layer normalization  (x1)
- Transformer language model —contains→ Position-wise feed-forward network  (x1)
- Key-Value Datastore —is built from→ Training set  (x1)
- Prior context —supplies context to→ kNN-LM  (x1)
- kNN-LM —is related to→ Cache model  (x1)
- kNN-LM —uses→ FAISS index  (x1)
- FAISS index —stores→ Cluster centroid  (x1)
- FAISS index —uses→ Quantization  (x1)
- kNN-LM —depends on→ Interpolation parameter  (x1)
- kNN-LM —uses→ Squared Euclidean distance  (x1)
- Squared Euclidean distance —is a variant of→ L2 distance  (x1)
- kNN-LM —is tuned with→ Interpolation parameter  (x1)
- Continuous cache model —is evaluated by→ Perplexity  (x1)
- Continuous cache model —is evaluated on→ Wikitext-103  (x1)
- kNN-LM —is controlled by→ Interpolation parameter  (x1)
- Cache model —is controlled by→ Interpolation parameter  (x1)
- Self-attention —is used in→ Vanilla language model  (x1)
- kNN-LM —retrieves from→ Key-Value Datastore  (x1)
- Nearest neighbor search —improves→ Perplexity  (x1)
- Transformer language model layer —contains→ Multi-head self-attention  (x1)
- Transformer language model layer —contains→ Position-wise feed-forward network  (x1)
- Transformer language model layer —contains→ Layer normalization  (x1)
- Domain adaptation —uses→ Key-Value Datastore  (x1)
- In-domain language model —is relevant to→ Domain adaptation  (x1)
- Nearest neighbor search —operates on representations from→ Transformer  (x1)
- Transformer —includes→ Self-attention  (x1)
- Transformer —includes→ Position-wise feed-forward network  (x1)
- Layer normalization —is used in→ Transformer  (x1)
- kNN-LM —depends on→ Nearest neighbor search  (x1)
- kNN-LM —uses→ Interpolation parameter  (x1)
- Nearest neighbor search —uses→ Squared Euclidean distance  (x1)
- FAISS —implements→ Nearest neighbor search  (x1)
- FAISS —uses→ Quantized key  (x1)
- Full-precision key —improves→ Squared Euclidean distance  (x1)
- Domain adaptation —depends on→ Interpolation parameter  (x1)
- kNN-LM —uses→ learned representation function  (x1)
- kNN-LM —depends on→ explicit memory  (x1)
- n-gram language model —is interpolated with→ Transformer language model  (x1)
- Transformer language model —uses→ Dropout  (x1)
- implicit memorization —can cause→ overfitting  (x1)
- training loss —contrasts with→ validation perplexity  (x1)
- near-duplicate sentence —is an example of→ rare pattern  (x1)
- factual knowledge —is an example of→ rare pattern  (x1)
- Long tail —manifests as→ rare pattern  (x1)
- validation perplexity —is a kind of→ Perplexity  (x1)
- Transformer —is capable of→ implicit memorization  (x1)