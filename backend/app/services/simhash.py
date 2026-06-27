"""SimHash near-duplicate fingerprint — lexical document de-dup, no model calls.

A 64-bit fingerprint of a document's normalized 5-word shingles. Two renders of
the same paper (a re-encoded PDF, arxiv v1 vs v2 — byte-different, so content-hash
misses them) land within a few bits; two *different* papers on the same topic sit
~half the bits apart, because the signal is exact phrase overlap, not meaning.
That lexical bias is the point: it folds genuine re-uploads without ever merging
BERT into RoBERTa the way an embedding cosine (~0.9 for both) would. Hamming <= 3
on 64 bits is the standard near-duplicate cut (Manku/Google web-crawl dedup).
"""

import hashlib
import re

_NONALNUM = re.compile(r"[^a-z0-9 ]+")
_WS = re.compile(r"\s+")
_SHINGLE = 5  # words per shingle — long enough that different papers rarely share one
_BITS = 64
_MASK = (1 << _BITS) - 1


def _normalize(text: str) -> list[str]:
    """Lowercase, strip punctuation, collapse whitespace → word list. Render-stable:
    spacing/case/punctuation differences between two PDFs of one paper drop out."""
    t = _NONALNUM.sub(" ", text.lower())
    t = _WS.sub(" ", t).strip()
    return t.split(" ") if t else []


def _shingles(words: list[str], k: int = _SHINGLE):
    if len(words) < k:
        if words:
            yield " ".join(words)
        return
    for i in range(len(words) - k + 1):
        yield " ".join(words[i : i + k])


def _hash64(s: str) -> int:
    return int.from_bytes(hashlib.blake2b(s.encode(), digest_size=8).digest(), "big")


def compute(text: str) -> str:
    """64-bit SimHash of `text` as a 16-char hex string; '' for empty/too-short text."""
    words = _normalize(text)
    counts = [0] * _BITS
    n = 0
    for sh in _shingles(words):
        n += 1
        h = _hash64(sh)
        for i in range(_BITS):
            counts[i] += 1 if (h >> i) & 1 else -1
    if n == 0:
        return ""
    fp = 0
    for i in range(_BITS):
        if counts[i] > 0:
            fp |= 1 << i
    return f"{fp:016x}"


def hamming(a: str, b: str) -> int:
    """Bit distance between two hex fingerprints (lower = more similar)."""
    return bin((int(a, 16) ^ int(b, 16)) & _MASK).count("1")
