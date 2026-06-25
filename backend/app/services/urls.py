"""Canonical-URL helper for web-clip de-duplication.

``normalize_url`` collapses the cosmetic variations that make the *same* page look
like different URLs — tracking query params, a fragment, a default port, a trailing
slash, scheme/host case — to one canonical string. The clip endpoint stores it on
``documents.source_url_canonical`` and looks it up before ingesting, so re-clipping
a page resolves to the document already in the workspace instead of a duplicate.

Best-effort and total: a blank or unparseable URL returns trimmed/empty rather than
raising, because de-dup is an optimisation, not a correctness gate — a missed
normalisation just means a possible duplicate, never a failed clip.
"""

from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

# Query keys that identify a campaign/referrer, not the content. Dropping them
# means "?utm_source=x" and the bare URL canonicalise to the same page.
_TRACKING_PREFIXES = ("utm_",)
_TRACKING_KEYS = {
    "fbclid", "gclid", "gclsrc", "dclid", "msclkid",
    "mc_eid", "mc_cid", "_ga", "ref", "ref_src", "spm",
}


def _is_content_param(key: str) -> bool:
    k = key.lower()
    if any(k.startswith(p) for p in _TRACKING_PREFIXES):
        return False
    return k not in _TRACKING_KEYS


def normalize_url(url: str) -> str:
    """Return a canonical form of ``url`` for de-dup, or the trimmed input if it
    isn't an absolute http(s) URL (nothing to canonicalise)."""
    raw = (url or "").strip()
    if not raw:
        return ""
    try:
        parts = urlsplit(raw)
        if not parts.scheme or not parts.netloc:
            return raw  # relative / opaque — leave as-is

        scheme = parts.scheme.lower()
        host = parts.hostname or ""  # .hostname is already lowercased, no userinfo
        port = parts.port  # may raise ValueError on a malformed port
        default_port = {"http": 80, "https": 443}.get(scheme)
        netloc = host if port in (None, default_port) else f"{host}:{port}"

        # Strip trailing slashes so /a/ and /a — and a bare host with or without a
        # slash (/ → "") — dedupe to one canonical form.
        path = parts.path.rstrip("/")

        query = urlencode(
            [
                (k, v)
                for k, v in parse_qsl(parts.query, keep_blank_values=True)
                if _is_content_param(k)
            ]
        )
        # Fragment dropped: it never changes the server-rendered page.
        return urlunsplit((scheme, netloc, path, query, ""))
    except ValueError:
        return raw
