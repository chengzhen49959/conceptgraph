# Pipeline smoke — attention

_Generated 2026-06-23 20:07 UTC_

## Summary (P3 — document summary)

This document is the Transformer paper, which introduces a new sequence transduction architecture that replaces recurrence and convolution with attention alone. It explains the model’s core components—scaled dot-product attention, multi-head self-attention, encoder-decoder stacks, feed-forward layers, residual connections, layer normalization, and positional encodings—and compares its efficiency and long-range modeling advantages with recurrent and convolutional approaches. The paper also describes the training setup, optimizer, regularization, and dataset processing used for machine translation experiments. Results show state-of-the-art BLEU scores on WMT translation benchmarks with much lower training cost, and ablation studies examine how attention heads, dimensionality, dropout, and positional encoding affect performance.

## Counts

- **Concepts (post-merge):** 26
- **Aliases (folded surface forms):** 45
- **Edges (relations):** 40
- **Edges (co-occurrence, clustering substrate):** 128
- **Clusters:** 5 leaf / 2 parent (7 total)
- **Singleton clusters:** 0

## Topic hierarchy (P2 — two-level Leiden)

- **Transformer Architecture**
  - Transformer Attention Mechanism — Attention mechanism, Encoder-decoder attention, Masked Self-Attention, Multi-Head Attention, Position-wise feed-forward network, Scaled Dot-Product Attention, Self-attention
  - Neural Network Components — Decoder, Encoder, Layer Normalization, Residual Connection
- **Transformer Architectures**
  - Neural Network Layers — Convolutional Layer, Positional Encoding, Recurrent Layer, Restricted Self-Attention, Sinusoidal Positional Encoding
  - Sequence Modeling Complexity — Computational Complexity per Layer, Long-Range Dependency, Path Length, Sequence transduction, Sequential Operations
- Transformer Architecture — Decoder Stack, Encoder Stack, Encoder-decoder architecture, Multi-Head Self-Attention, Transformer

## Concepts

- **Attention mechanism** (3 mentions, Transformer Attention Mechanism) · aliases: Attention, attention
  - A mechanism that lets a model selectively focus on relevant parts of an input or another internal representation when producing an output. In sequence-to-sequence models, it helps connect encoder and decoder states by weighting informative source positions.
- **Computational Complexity per Layer** (1 mentions, Sequence Modeling Complexity)
  - The amount of computation required by a single neural network layer as a function of input size. It is used to compare how efficient different layer types are when processing sequences.
- **Convolutional Layer** (2 mentions, Neural Network Layers) · aliases: Convolutional, convolution layer
  - A sequence-processing layer that applies a kernel across local neighborhoods to compute representations. It captures nearby context efficiently and can be stacked to increase the effective receptive field over longer distances.
- **Decoder** (3 mentions, Neural Network Components)
  - A model component that generates an output sequence from an internal representation, often one token at a time. In sequence-to-sequence systems, it conditions on encoder information and previously produced outputs.
- **Decoder Stack** (1 mentions, Transformer Architecture)
  - A stack of repeated decoder layers used to generate an output sequence from encoded representations. It processes previously generated symbols while building the next output.
- **Encoder** (3 mentions, Neural Network Components)
  - A model component that reads an input sequence and converts it into an internal representation. In sequence-to-sequence systems, it produces information that the decoder uses to generate the output sequence.
- **Encoder-decoder architecture** (3 mentions, Transformer Architecture) · aliases: Sequence-to-Sequence Architecture, encoder-decoder architectures, sequence-to-sequence architecture
  - A sequence modeling framework with one component that reads an input sequence into an internal representation and another that generates an output sequence from it. It is widely used for tasks such as translation and other sequence transduction problems.
- **Encoder-decoder attention** (1 mentions, Transformer Attention Mechanism) · aliases: encoder-decoder attention
  - An attention layer in which the decoder queries attend to the encoder outputs used as keys and values. It lets each decoder position access information from all positions in the input sequence and is a standard mechanism in sequence-to-sequence models.
- **Encoder Stack** (1 mentions, Transformer Architecture)
  - A stack of repeated encoder layers used to transform an input sequence into contextual continuous representations. Each layer applies attention-based processing before passing the result onward.
- **Layer Normalization** (1 mentions, Neural Network Components) · aliases: LayerNorm
  - A normalization technique applied across the features of a single example. It stabilizes and speeds up training by keeping activations in a more controlled range.
- **Long-Range Dependency** (1 mentions, Sequence Modeling Complexity) · aliases: long-range dependencies
  - A relationship between distant positions in a sequence that a model must capture despite the elements being far apart. Learning such dependencies is important in many sequence modeling tasks and is easier when the network path between positions is short.
- **Masked Self-Attention** (2 mentions, Transformer Attention Mechanism) · aliases: Decoder self-attention, causal self-attention, masked self-attention
  - Masked self-attention is a self-attention mechanism that restricts how each position can attend within a sequence. In decoder architectures for autoregressive prediction, a causal mask prevents a token from attending to future tokens (often allowing only earlier positions and, depending on the convention, the current position), ensuring information from future tokens cannot influence the current output.
- **Multi-Head Attention** (7 mentions, Transformer Attention Mechanism) · aliases: MultiHead, Multihead Attention, Multiple-Head Attention, multi-head attention, multihead attention, multiple-head attention
  - An attention mechanism that runs several attention operations in parallel on different learned projections of the same input. The separate heads let a model attend to different relationships and representation subspaces at once.
- **Multi-Head Self-Attention** (1 mentions, Transformer Architecture) · aliases: Multihead Self-Attention
  - A self-attention mechanism that runs multiple attention operations in parallel and combines their outputs. This lets the model capture different types of relationships between positions in a sequence at the same time.
- **Path Length** (1 mentions, Sequence Modeling Complexity)
  - The number of computational steps a signal must traverse through a network between two positions. Shorter path lengths generally make it easier for models to learn dependencies between distant elements.
- **Positional Encoding** (3 mentions, Neural Network Layers) · aliases: Parameter-Free Position Representation, position encoding
  - A position representation added to token embeddings so a sequence model can use order information. It provides information about token location without using learned recurrent state.
- **Position-wise feed-forward network** (2 mentions, Transformer Attention Mechanism) · aliases: FFN, feed-forward network
  - A fully connected neural network applied independently to each sequence position in a Transformer layer. It typically consists of two linear transformations with a nonlinearity between them, enabling per-position feature transformation after attention.
- **Recurrent Layer** (2 mentions, Neural Network Layers) · aliases: Recurrent, recurrent layer
  - A sequence-processing layer that updates hidden states step by step, with each position depending on previous computations. This makes the computation inherently sequential and can create long paths between distant positions in a sequence.
- **Residual Connection** (1 mentions, Neural Network Components) · aliases: skip connection
  - A shortcut connection that adds a sublayer's input to its output before further processing. It helps information and gradients flow through deep networks and makes stacked architectures easier to optimize.
- **Restricted Self-Attention** (2 mentions, Neural Network Layers) · aliases: Self-Attention (restricted), local self-attention
  - A variant of self-attention that limits each position to attend only to a local neighborhood. This reduces computation compared with full self-attention while restricting information flow to a window of size r.
- **Scaled Dot-Product Attention** (3 mentions, Transformer Attention Mechanism) · aliases: Dot-Product Attention, Scaled Attention, scaled dot product attention
  - An attention mechanism that scores query-key compatibility with a dot product, scales the result, and converts it into weights over values. The scaling helps keep gradients stable when key and query dimensions are large.
- **Self-attention** (9 mentions, Transformer Attention Mechanism) · aliases: Attention, Intra-Attention, attention, intra-attention, self attention, self-attention layer
  - An attention mechanism in which each element in a sequence attends to other elements in the same sequence. It allows a model to build contextual representations without recurrence or convolution by directly relating positions to one another.
- **Sequence transduction** (2 mentions, Sequence Modeling Complexity) · aliases: sequence transduction task
  - A class of problems in which a model transforms one sequence into another sequence, often of different length. Examples include translation, where the input and output sequences are aligned only implicitly.
- **Sequential Operations** (1 mentions, Sequence Modeling Complexity)
  - Operations that must be executed one after another in a fixed order. A smaller number of sequential operations usually means better ability to parallelize computation.
- **Sinusoidal Positional Encoding** (3 mentions, Neural Network Layers) · aliases: sinusoidal encoding, sinusoidal positional encoding, sinusoidal version, sinusoids
  - A fixed positional encoding that represents each position using sine and cosine functions at different frequencies. The resulting patterns allow positions to be represented smoothly and can support extrapolation to longer sequences than those seen in training.
- **Transformer** (7 mentions, Transformer Architecture) · aliases: Transformer model, the Transformer
  - A neural network architecture for sequence transduction that relies entirely on attention mechanisms. It removes recurrence and convolutions while preserving the ability to model relationships between elements in a sequence, which makes computation more parallelizable.

## Edges (top by weight)

- Multi-Head Attention —[is a kind of ×2]→ Attention mechanism
- Restricted Self-Attention —[is a variant of ×2]→ Self-attention
- Attention mechanism —[connects ×1]→ Encoder
- Attention mechanism —[connects ×1]→ Decoder
- Decoder —[uses ×1]→ Masked Self-Attention
- Decoder —[uses ×1]→ Multi-Head Attention
- Decoder —[uses ×1]→ Residual Connection
- Decoder —[uses ×1]→ Layer Normalization
- Encoder —[uses ×1]→ Self-attention
- Encoder —[uses ×1]→ Residual Connection
- Encoder —[uses ×1]→ Layer Normalization
- Encoder Stack —[contains ×1]→ Multi-Head Self-Attention
- Encoder-decoder architecture —[contains ×1]→ Encoder
- Encoder-decoder architecture —[contains ×1]→ Decoder
- Encoder-decoder attention —[is a use of ×1]→ Multi-Head Attention
- Masked Self-Attention —[is a form of ×1]→ Self-attention
- Masked Self-Attention —[is a kind of ×1]→ Self-attention
- Multi-Head Attention —[is used with ×1]→ Self-attention
- Multi-Head Attention —[uses ×1]→ Scaled Dot-Product Attention
- Path Length —[affects learning of ×1]→ Long-Range Dependency
- Recurrent Layer —[requires ×1]→ Sequential Operations
- Self-attention —[is a type of ×1]→ Attention mechanism
- Self-attention —[is a kind of ×1]→ Attention mechanism
- Self-attention —[is a use of ×1]→ Multi-Head Attention
- Self-attention —[is used in ×1]→ Sequence transduction
- Self-attention —[is used in ×1]→ Encoder
- Self-attention —[is used in ×1]→ Decoder
- Self-attention —[is compared by ×1]→ Computational Complexity per Layer
- Self-attention —[is compared by ×1]→ Path Length
- Sinusoidal Positional Encoding —[is a kind of ×1]→ Positional Encoding
- Transformer —[is based solely on ×1]→ Attention mechanism
- Transformer —[relies on ×1]→ Attention mechanism
- Transformer —[follows ×1]→ Encoder-decoder architecture
- Transformer —[relies on ×1]→ Self-attention
- Transformer —[uses ×1]→ Encoder Stack
- Transformer —[uses ×1]→ Decoder Stack
- Transformer —[includes ×1]→ Encoder
- Transformer —[includes ×1]→ Decoder
- Transformer —[replaces components in ×1]→ Encoder-decoder architecture
- Transformer —[uses ×1]→ Sinusoidal Positional Encoding
