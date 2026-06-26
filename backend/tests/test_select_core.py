"""Survey detection — the cheap, deterministic gate-relaxation trigger.

`app.ai.select_core._is_survey` decides whether to append the survey addendum that
widens the aboutness test (a survey's core is a whole field, not one contribution).
A FALSE POSITIVE is the only regression that matters — it loosens a contribution
paper's precision-first gate — so these tests pin that the detector fires on real
surveys (by title or explicit self-description) and stays silent on contribution
papers, including ones that merely use "review"/"survey" in their related-work
prose. Pure (no LLM, no DB), so they run with no environment.
"""

from app.ai.select_core import _is_survey
from app.services.thesis import thesis_anchor


def _anchor(title: str, body: str = "") -> str:
    return thesis_anchor(body, title)


# --- fires on genuine surveys --------------------------------------------------

def test_fires_on_survey_title():
    assert _is_survey(_anchor("A Survey of Large Language Models", "Language is..."))


def test_fires_on_review_title():
    assert _is_survey(_anchor("Pretrained Language Models: A Comprehensive Review", "We discuss methods."))


def test_fires_on_overview_and_taxonomy_titles():
    assert _is_survey(_anchor("An Overview of Graph Neural Networks", "x"))
    assert _is_survey(_anchor("A Taxonomy of Attention Mechanisms", "x"))


def test_fires_on_self_description_when_title_is_silent():
    # Title lacks the keyword; the abstract names the document as a survey.
    assert _is_survey(_anchor("On the Opportunities and Risks of Foundation Models",
                              "In this survey we review the landscape of foundation models."))
    assert _is_survey(_anchor("Recent Advances in NLP",
                              "We present a comprehensive survey of transformer variants."))


# --- stays silent on contribution papers (false positives are the real risk) ---

def test_silent_on_contribution_titles():
    for title in [
        "Attention Is All You Need",
        "RoBERTa: A Robustly Optimized BERT Pretraining Approach",
        "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
        "Language Models are Few-Shot Learners",
        "Scaling Laws for Neural Language Models",
    ]:
        assert not _is_survey(_anchor(title, "We propose a new method.")), title


def test_silent_on_review_survey_words_in_related_work_prose():
    # "review"/"survey" as a verb over PRIOR work is not self-identification.
    assert not _is_survey(_anchor("A New Optimizer for Deep Nets",
                                  "We review prior work in section 2, then propose a new optimizer."))
    assert not _is_survey(_anchor("Fast Attention",
                                  "We survey related kernels briefly, then introduce FastAttn."))
    assert not _is_survey(_anchor("Better Embeddings",
                                  "We give a review of baselines. Our method beats them."))
    assert not _is_survey(_anchor("Robust Training",
                                  "This paper reviews and proposes nothing standard."))


def test_silent_on_empty_anchor():
    assert not _is_survey("")
