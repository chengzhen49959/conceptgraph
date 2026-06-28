from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Backend configuration, loaded from the environment / a local `.env` file."""

    model_config = SettingsConfigDict(env_file=".env.local", extra="ignore")

    # --- Auth & data (required) ------------------------------------------------
    # Cognito — from the User Pool's "App integration" page. Used to verify the
    # JWT the frontend forwards; no AWS credentials needed for verification.
    cognito_region: str
    cognito_user_pool_id: str
    cognito_app_client_id: str

    # Aurora PostgreSQL — async SQLAlchemy URL, e.g.
    # postgresql+asyncpg://user:pass@cluster-host:5432/dbname
    database_url: str

    # Browser origin allowed by CORS (the Next.js dev server).
    frontend_origin: str = "http://localhost:3000"
    # Extra origins allowed by CORS, comma-separated. Holds the Chrome clipper
    # extension's `chrome-extension://<id>` origin(s); the extension ID is fixed
    # via the manifest "key" so it's stable across dev and the published build.
    extension_origins: str = ""

    # --- Pipeline runtime credentials -----------------------------------------
    # Defaulted to "" so importing config never fails when these aren't set yet
    # (migrations and the pgvector smoke test only need DATABASE_URL). The code
    # paths that actually use them (AI adapter, worker, S3) fail loudly if blank.
    openai_api_key: str = ""
    redis_url: str = ""  # arq queue + per-workspace merge lock
    s3_bucket: str = ""  # raw document object storage
    aws_region: str = "us-east-1"
    # Optional explicit creds; if blank, boto3 uses its default credential chain
    # (env vars, shared config, or the Render instance role).
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""

    # --- Model ids (pinned in config so a rename is a one-line change) ----------
    # Verify availability at deploy time; the openai-sdk skill documents the
    # gpt-5.4 family (knowledge cutoff 2025-08-31).
    embed_model: str = "text-embedding-3-small"
    # Extraction quality matters (nano over-extracts sentence fragments / single
    # words as "concepts"), so use the stronger mini for it.
    extract_model: str = "gpt-5.4-mini"  # per-chunk concept/relation extraction
    confirm_model: str = "gpt-5.4-nano"  # merge same-concept confirmation
    label_model: str = "gpt-5.4-mini"  # cluster labelling (low volume, quality)
    # Document-level reduce-pass that keeps only the concepts a document is about
    # (drops cited/background mentions). Needs document-wide judgement, so mini.
    select_core_model: str = "gpt-5.4-mini"
    # RAG answer synthesis (F8): grounds a streamed, citation-backed answer in the
    # retrieved passages. Quality + faithful citation matter (nano drops/garbles
    # citations and over-summarises), so mini, not nano.
    answer_model: str = "gpt-5.4-mini"

    # --- Pipeline tuning -------------------------------------------------------
    # NOTE: the embedding dimension is a DDL-fixed constant (the vector column
    # width), not a runtime setting — see EMBED_DIM in app/models.py.
    #
    # Concept dedup uses embeddings only as a BLOCKER (to recall candidates); the
    # MERGE decision is the LLM's (ai.match_concept). Pure cosine-threshold merging
    # is low-precision and false-merges siblings/opposites (e.g. top-down vs
    # bottom-up). Cosine DISTANCE (= 1 - similarity) matches the `cosine_distance`
    # query in services/concepts.py.
    # The judge is the precision gate, so the block favours RECALL. A tighter 0.40
    # (sim >= 0.60) starved the judge of true synonyms whose descriptions differ
    # slightly — e.g. "Attention" vs "Attention mechanism" sit at sim ~0.59 and
    # never reached it, becoming duplicate nodes.
    block_distance: float = 0.50  # recall neighbours with sim >= 0.50 as candidates
    # Nearest candidates sent to the judge. Must exceed the count of close-but-
    # distinct siblings (the query limits BEFORE the distance filter), so a real
    # synonym ranked 6th+ among many "*attention*" nodes still lands.
    block_top_k: int = 8
    # The merge judge must tell apart siblings/opposites, which nano confuses, so
    # it uses the stronger mini rather than confirm_model.
    judge_model: str = "gpt-5.4-mini"
    # Concurrent concept resolutions in the merge phase. Each resolution makes its own
    # merge-judge LLM call; running them one-at-a-time (≈60 sequential calls over the
    # network) is what blew the 600s job_timeout on a first document. Bounded so the
    # fan-out can't exhaust the DB pool (see db.get_engine pool_size) or the OpenAI
    # rate limit. The trade-off: concurrent resolutions judge against a racy view of
    # the graph, so two differently-named near-duplicates in ONE document can both
    # create a node — the manual dedup_sweep is the repair pass for that.
    merge_concurrency: int = 8

    # --- Web clip ingress ------------------------------------------------------
    # Hard ceiling on a single clip's main text (characters). A clipped page is
    # chunked (~512 tokens each) and EACH chunk costs one extraction LLM call, so
    # an unbounded paste fans out to a large, slow, expensive job (bounded only by
    # the 600s worker timeout). Reject above this; the extension warns earlier
    # (soft) and offers selection-only. ~300k chars ≈ a very long article —
    # comfortably above real pages, below abuse.
    clip_max_chars: int = 300_000

    # --- MCP server (external-memory API for AI clients) -----------------------
    # The MCP server is mounted at /mcp and authenticates AI clients via OAuth 2.1
    # with Cognito as the Authorization Server; this backend is the Resource
    # Server. All fields default so importing config never fails before M0
    # provisioning; the OAuth dance only works once cognito_domain is set.
    mcp_enabled: bool = True
    # Cognito Hosted UI domain — a bare prefix (e.g. "conceptgraph-auth", expanded
    # to <prefix>.auth.<region>.amazoncognito.com) or a full https host. Empty
    # until create_user_pool_domain has run (see _provision_cognito.py).
    cognito_domain: str = ""
    # Resource-server identifier registered in Cognito; custom scopes are
    # "<id>/read" and "<id>/write". This is the audience mechanism for the
    # opaque-to-aud Cognito access tokens.
    mcp_resource_identifier: str = "concept-graph"
    # Public origin of THIS backend, no trailing slash (e.g.
    # https://concept-graph-api.onrender.com). Used as the OAuth issuer the MCP
    # client discovers and to build the protected-resource URL (<public>/mcp).
    mcp_public_url: str = "http://127.0.0.1:8000"
    # Redirect-URI prefixes the DCR shim (/register) accepts, comma-separated.
    # Guards against registering clients that exfiltrate codes to arbitrary URLs.
    mcp_allowed_redirect_schemes: str = "https://,http://localhost,http://127.0.0.1"
    # Secret that signs Personal Access Tokens (PATs) — the static-bearer fast
    # path for clients that paste one token instead of running OAuth (Claude
    # Desktop / Cursor via `mcp-remote --header`). Empty disables PATs entirely
    # (verify_pat returns None). The running server and the minting host must
    # share the SAME value or minted tokens won't verify; rotating it revokes
    # every PAT at once.
    mcp_pat_secret: str = ""

    @property
    def cognito_hosted_ui_base(self) -> str:
        """Base URL of the Cognito Hosted UI OAuth endpoints
        (https://<domain>.auth.<region>.amazoncognito.com), or "" if no domain
        is configured yet."""
        d = self.cognito_domain.strip().rstrip("/")
        if not d:
            return ""
        if d.startswith("http"):
            return d
        return f"https://{d}.auth.{self.cognito_region}.amazoncognito.com"

    @property
    def mcp_issuer(self) -> str:
        """OAuth issuer for the MCP auth flow — this backend's public origin."""
        return self.mcp_public_url.rstrip("/")

    @property
    def mcp_resource_url(self) -> str:
        """The protected resource identifier the access token is bound to."""
        return f"{self.mcp_issuer}/mcp"

    @property
    def mcp_scopes(self) -> tuple[str, str]:
        """(read, write) custom scope strings, e.g. ("concept-graph/read", ...)."""
        ident = self.mcp_resource_identifier
        return f"{ident}/read", f"{ident}/write"

    @property
    def cors_allow_origins(self) -> list[str]:
        """Origins CORS allows: the frontend plus any comma-separated extras
        (e.g. the clipper extension). Trims blanks so an unset extras value is
        a no-op rather than an empty-string origin that matches nothing.

        `localhost` and `127.0.0.1` are distinct CORS origins but the same dev
        machine, so each configured http origin is mirrored to its sibling host —
        the dev server then works whether the browser is pointed at either one
        (this app is served on 127.0.0.1 while the default frontend_origin names
        localhost). Mirroring is host-only and never touches the extension origins."""
        extra = [o.strip() for o in self.extension_origins.split(",") if o.strip()]
        origins = [self.frontend_origin, *extra]
        mirrors: list[str] = []
        for o in origins:
            if "localhost" in o:
                mirrors.append(o.replace("localhost", "127.0.0.1"))
            elif "127.0.0.1" in o:
                mirrors.append(o.replace("127.0.0.1", "localhost"))
        # dict.fromkeys dedups while preserving order.
        return list(dict.fromkeys([*origins, *mirrors]))


@lru_cache
def get_settings() -> Settings:
    return Settings()
