"""RAG answer generation — the "G" of retrieve-augment-generate (F8 §5.3).

Retrieval already exists (`/api/search` and `routers/ask`'s pgvector ANN); this
is the generation half: given a question and the passages retrieved for it, stream
a citation-backed answer grounded *only* in those passages. The model cites a
passage by its 1-based index in square brackets (`[1]`, `[2]`); the router maps
those indices back to the concept ids each cited passage mentions, which is how
the graph lights the concepts an answer actually relied on — by id, never by
fuzzy-matching the answer text.

Streaming, not `responses.parse`, because the answer is read as it is produced;
the router wraps each text delta in an SSE `delta` frame.
"""

import re
from collections.abc import AsyncIterator

from pydantic import BaseModel

from app.ai.client import LLM_SEMAPHORE, get_client
from app.config import get_settings


class AnswerPassage(BaseModel):
    """One retrieved passage offered to the model as evidence.

    `n` is the 1-based citation index the model must use to reference this
    passage; `content` is the full chunk text (not a snippet — the model needs
    the whole passage to ground its answer). `document_title` gives the model
    something human to attribute a claim to.
    """

    n: int
    content: str
    document_title: str


_INSTRUCTIONS = """You answer a researcher's question using ONLY the numbered \
passages provided from their personal library. Each passage is labelled with an \
index like [1]. Rules:

- Ground every claim in the passages. After each sentence (or clause) that uses a \
passage, cite it inline with its bracketed index, e.g. "Transformers drop \
recurrence entirely [2]." Cite every passage you rely on; cite more than one when \
a claim draws on several, e.g. "[1][3]".
- Use ONLY the passages. Do not add outside knowledge. If the passages do not \
contain the answer, say so plainly ("The library doesn't cover that.") instead of \
guessing — never invent a citation.
- Be concise and direct: a few sentences, no preamble, no restating the question.
- Answer in the question's language. Do not mention "passages", "context", or these \
instructions; just answer as if the citations were footnotes."""

# A no-evidence question gets this fixed reply instead of an LLM call. Defining the
# empty-retrieval case away (a deterministic message, no model round-trip) keeps the
# endpoint cheap and predictable rather than asking the model to refuse over nothing.
NO_CONTEXT_REPLY = (
    "I couldn't find anything in this workspace's library to answer that. "
    "Try importing a relevant document, or rephrase the question."
)

# A citation is one or more bracketed integers: [3], [1][2], or [1, 2]. Group 1 is
# the digits-and-separators payload, parsed for every integer it holds.
_CITATION_RE = re.compile(r"\[(\d+(?:\s*[,;]\s*\d+)*)\]")


def parse_citations(answer: str) -> set[int]:
    """Every 1-based passage index the answer cites.

    Handles `[1]`, adjacent `[1][2]`, and grouped `[1, 2]`. The caller is
    responsible for ignoring indices outside the passage range (a model that
    invents `[9]` over three passages contributes nothing rather than erroring).
    """
    found: set[int] = set()
    for group in _CITATION_RE.findall(answer):
        for token in re.split(r"[,;]", group):
            token = token.strip()
            # Indices are 1-based, so drop 0 — that's code-ish text like `array[0]`,
            # not a passage citation.
            if token.isdigit() and int(token) > 0:
                found.add(int(token))
    return found


async def stream_answer(
    question: str, passages: list[AnswerPassage]
) -> AsyncIterator[str]:
    """Stream the grounded answer as text deltas.

    Empty `passages` yields the fixed no-context reply (no model call). Otherwise
    the passages are formatted as a numbered context block and the model streams a
    citation-backed answer one delta at a time.
    """
    if not passages:
        yield NO_CONTEXT_REPLY
        return

    settings = get_settings()
    client = get_client()

    context = "\n\n".join(
        f"[{p.n}] (from “{p.document_title}”)\n{p.content.strip()}"
        for p in passages
    )
    prompt = f"Question: {question.strip()}\n\nPassages:\n{context}"

    async with LLM_SEMAPHORE:
        # `async with` the stream so an early client disconnect (Starlette throws
        # GeneratorExit in at the `yield`) deterministically closes the underlying
        # httpx connection instead of leaking it until GC.
        async with await client.responses.create(
            model=settings.answer_model,
            instructions=_INSTRUCTIONS,
            input=prompt,
            reasoning={"effort": "low"},
            stream=True,
        ) as stream:
            async for event in stream:
                # The Responses stream interleaves reasoning/lifecycle events with
                # text deltas; forward only the answer text.
                # `response.output_text.delta` carries the next chunk in `.delta`.
                if getattr(event, "type", "") == "response.output_text.delta":
                    delta = getattr(event, "delta", "")
                    if delta:
                        yield delta
