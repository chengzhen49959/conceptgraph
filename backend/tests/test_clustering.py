"""P2-min — isolated-concept rescue in clustering (`_isolated_knn_edges`).

A concept with no relation edge would otherwise become a singleton cluster. The
helper links it to its nearest embedding neighbours so it joins a real topic —
but only above a similarity floor, and only for the isolated nodes, so existing
communities are never reshaped.
"""

from app.services.clustering import (
    _ISOLATED_KNN_MIN_SIM,
    _isolated_knn_edges,
    _subpartition,
    _two_level,
)


def test_orphan_attaches_to_near_neighbours():
    # 0,1 are a tight group; 3 is an orphan sitting right next to them; 2 is a
    # far-away group of its own.
    vectors = [[1.0, 0.0], [0.95, 0.05], [0.0, 1.0], [0.97, 0.03]]
    edges = _isolated_knn_edges(vectors, isolated={3})

    assert edges, "orphan should attach to something"
    assert all(src == 3 for src, _ in edges), "only the orphan gets new links"
    assert {dst for _, dst in edges} <= {0, 1}, "attaches to the near group, not the far one"


def test_far_orphan_stays_a_singleton():
    # node 2 is orthogonal to the others -> cosine ~0, below the floor.
    vectors = [[1.0, 0.0, 0.0], [0.9, 0.1, 0.0], [0.0, 0.0, 1.0]]
    edges = _isolated_knn_edges(vectors, isolated={2})

    assert edges == []


def test_connected_nodes_are_untouched():
    vectors = [[1.0, 0.0], [0.99, 0.01]]
    # nothing isolated -> no new edges, even though they are near each other.
    assert _isolated_knn_edges(vectors, isolated=set()) == []


def test_manual_node_without_embedding_cannot_attach():
    # index 1 is a manual node (no embedding) and isolated; it has no vector to
    # match on, so it stays unlinked.
    vectors = [[1.0, 0.0], None, [0.98, 0.02]]
    assert _isolated_knn_edges(vectors, isolated={1}) == []


def test_too_few_embeddings_is_empty():
    assert _isolated_knn_edges([[1.0, 0.0]], isolated={0}) == []
    assert _isolated_knn_edges([None, None], isolated={0, 1}) == []


def test_similarity_floor_is_respected():
    # A neighbour exactly at the floor is borderline; well below it is dropped.
    # Build an orphan whose only non-self neighbour sits clearly under the floor.
    vectors = [[1.0, 0.0], [_ISOLATED_KNN_MIN_SIM / 2, 1.0]]
    assert _isolated_knn_edges(vectors, isolated={0}) == []


# --- P2 hierarchy: _subpartition / _two_level ---------------------------------


def _clique(nodes, weight=5):
    edges, weights = [], []
    for i in range(len(nodes)):
        for j in range(i + 1, len(nodes)):
            edges.append((nodes[i], nodes[j]))
            weights.append(weight)
    return edges, weights


def test_subpartition_returns_global_indices_and_splits_components():
    # Induced subgraph over members {10,11,12,13} = two disjoint pairs; Leiden
    # always separates disconnected components, so we get two groups back, in the
    # ORIGINAL (global) indices — not 0..3.
    members = [10, 11, 12, 13]
    edges = [(10, 11), (12, 13)]
    weights = [1, 1]
    groups = _subpartition(members, edges, weights)

    assert sorted(sorted(g) for g in groups) == [[10, 11], [12, 13]]


def test_two_level_covers_every_concept_exactly_once():
    # Two well-separated cliques + a weak bridge.
    e1, w1 = _clique(range(0, 6))
    e2, w2 = _clique(range(6, 12))
    edges = e1 + e2 + [(5, 6)]
    weights = w1 + w2 + [1]

    structure = _two_level(12, edges, weights)
    seen = sorted(i for _, leaves in structure for leaf in leaves for i in leaf)

    assert seen == list(range(12))


def test_two_level_invariants_hold():
    # Whatever the partition, each entry must obey the parent/leaf contract the
    # write loop relies on: a parent has >1 leaf covering exactly its members; a
    # parentless entry is a single leaf.
    e1, w1 = _clique(range(0, 10))
    e2, w2 = _clique(range(10, 20))
    edges = e1 + e2 + [(9, 10)]
    weights = w1 + w2 + [1]

    for parent_members, leaves in _two_level(20, edges, weights):
        if parent_members is None:
            assert len(leaves) == 1
        else:
            assert len(leaves) > 1
            union = {i for leaf in leaves for i in leaf}
            assert union == set(parent_members)


def test_small_community_is_not_split():
    # A single clique below _MIN_SPLIT stays one leaf with no parent.
    edges, weights = _clique(range(0, 4))
    structure = _two_level(4, edges, weights)

    assert len(structure) == 1
    parent_members, leaves = structure[0]
    assert parent_members is None
    assert sorted(leaves[0]) == [0, 1, 2, 3]
