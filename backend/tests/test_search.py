"""Hybrid-retrieval pure pieces: RRF fusion and MMR selection.

Both are pure functions (no DB, no LLM, no env) — the rest of search.py is thin
SQL the live e2e exercises. ``rrf_fuse`` must reward cross-list agreement and break
ties stably; ``mmr_select`` must rank by query relevance and, as ``lambda_`` drops,
trade relevance for diversity (skip a near-duplicate for a fresh angle)."""

from app.services.search import mmr_select, rrf_fuse

# --- rrf_fuse ----------------------------------------------------------------


def test_rrf_single_list_preserves_order():
    assert rrf_fuse(["a", "b", "c"]) == ["a", "b", "c"]


def test_rrf_rewards_agreement_across_lists():
    # 'b' appears in both lists (high in each); 'a' only tops one. b must win.
    fused = rrf_fuse(["a", "b", "c"], ["b", "d"])
    assert fused[0] == "b"
    assert set(fused) == {"a", "b", "c", "d"}


def test_rrf_ties_keep_first_seen():
    # Each id is rank-0 in its own list → equal score; first-seen order breaks it.
    assert rrf_fuse(["x"], ["y"]) == ["x", "y"]


def test_rrf_empty_inputs():
    assert rrf_fuse() == []
    assert rrf_fuse([], []) == []


# --- mmr_select --------------------------------------------------------------


def test_mmr_empty_or_zero_k_returns_empty():
    assert mmr_select([1.0, 0.0], [], 5, 0.5) == []
    assert mmr_select([1.0, 0.0], [("a", [1.0, 0.0])], 0, 0.5) == []


def test_mmr_pure_relevance_orders_by_query_similarity():
    q = [1.0, 0.0]
    cands = [("far", [0.0, 1.0]), ("near", [1.0, 0.0]), ("mid", [1.0, 1.0])]
    # lambda_=1 → pure relevance: cos(near)=1 > cos(mid)≈.707 > cos(far)=0
    assert mmr_select(q, cands, 3, 1.0) == ["near", "mid", "far"]


def test_mmr_diversity_skips_near_duplicate():
    q = [1.0, 0.0]
    cands = [
        ("dup1", [1.0, 0.0]),  # most relevant
        ("dup2", [0.9, 0.1]),  # nearly identical to dup1
        ("div", [0.0, 1.0]),  # irrelevant to q but a fresh direction
    ]
    # Relevance-first picks dup1; with diversity weighted (lambda_=0.3) the second
    # pick is 'div' (novel) not 'dup2' (redundant), despite dup2's higher relevance.
    assert mmr_select(q, cands, 2, 0.3) == ["dup1", "div"]


def test_mmr_caps_at_k():
    q = [1.0, 0.0]
    cands = [("a", [1.0, 0.0]), ("b", [0.9, 0.1]), ("c", [0.8, 0.2])]
    assert len(mmr_select(q, cands, 2, 0.5)) == 2
