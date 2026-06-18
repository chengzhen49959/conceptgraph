# PRD — Concept-Graph Knowledge Base (English)

## 1. Overview
Turn scattered learning/research material (PDF / Markdown / text) into an **auto-growing, auto-deduplicating concept graph**. Flow: import documents → automatically extract concepts and merge synonymous concepts across documents → graph visualization + semantic search + RAG Q&A grounded in the library, with concepts mentioned in answers highlighted on the graph in real time. Offers a private personal workspace plus an invitable shared collaborative workspace.

## 2. Background & Problem
After reading documents, knowledge workers (researchers, students, consulting/legal teams) are left with isolated notes and PDFs. The same concept recurs across documents but is never merged; relationships between concepts are invisible, and there is no way to "ask the library for answers." Existing tools are either linear notes (Notion/Obsidian) or pure search (enterprise search); neither auto-structures knowledge into a growing concept network.

## 3. Target Users
Researchers, students, and knowledge-intensive teams such as consulting and legal.

## 4. Product Goals
- After importing a document, concepts enter the store automatically and merge correctly with existing concepts — no manual dedup.
- Users can see concept relationships and each concept's document provenance on the graph.
- Users can ask the library directly and get cited answers, with related concepts lit up on the graph.
- Two people can co-build a domain concept graph, while each person's personal workspace stays private.

## 5. Feature List (each with acceptance criteria)

### F1 Account & Auth
Sign-up/sign-in (Amazon Cognito via AWS Amplify).
**Done when:** users can register and log in via Cognito (Amplify), confirming sign-up with an emailed verification code; unauthenticated users cannot access any workspace data; after login the user lands in their own private personal workspace.

### F2 Document Import
Upload PDF / Markdown / text, triggering an async processing pipeline.
**Done when:** upload returns immediately and shows progress; once the pipeline finishes, the document's concepts appear on the graph and status flips to done; large files (e.g., a 20MB PDF) do not block or time out.

### F3 Automatic Concept Extraction
Extract concepts and their relationships from document chunks.
**Done when:** after a document is processed, its extracted concept nodes and relationship edges appear on the graph, and each concept traces back to its source chunk.

### F4 Cross-Document Auto-Merge / Dedup (core differentiator)
A new concept is matched against existing concepts by semantic similarity; if judged the same, it is merged (alias + provenance) rather than creating a new node.
**Done when:** importing a second document containing the same concept produces **no duplicate node** — instead the original node's provenance/mention count increases (demoable live). False-merge rate stays acceptable (tunable threshold, optional LLM confirmation).

### F5 Graph Visualization
Force-directed graph of concept nodes and edges, colored by cluster.
**Done when:** the graph renders all concepts/edges in the current workspace; nodes are colored by cluster; zoom/drag/select work; interaction stays smooth at hundreds of nodes.

### F6 Concept Detail
Click a node to see name, aliases, description, source documents, related concepts.
**Done when:** clicking any node opens a detail view listing all its aliases, linked source documents/passages, and directly connected concepts, with clickable provenance.

### F7 Semantic Search
Retrieve concepts and document passages by meaning.
**Done when:** a query returns relevance-ranked concept/passage results scoped to the current workspace; matching is driven by vector similarity, not pure keywords.

### F8 RAG Q&A + Real-Time Highlight
Answer from library knowledge, with citations, lighting up the concepts the answer relies on.
**Done when:** a question yields a streamed, citation-backed answer; as the answer streams, the concept nodes it relies on light up on the graph in real time (driven by backend-returned concept_id, not fuzzy text matching).

### F9 Automatic Clustering (topic grouping)
Run community detection/clustering over the concept graph to form named topic clusters.
**Done when:** concepts are assigned to topic clusters reflected as graph coloring; each cluster has an auto-generated label; clustering updates after new documents are imported.

### F10 Shared Collaborative Workspace
Create a shared workspace and invite collaborators to co-build a graph; personal workspaces always stay private.
**Done when:** a user can create a shared workspace and invite others; all members can import documents into it and co-build one graph; no one's personal workspace is visible to others.

> Scope note: F10 is the highest-risk, most cuttable item within 13 days. Recommend a minimal version or deferring to v2, prioritizing the single-user F2–F9 loop.

## 6. User Flows
1. **Onboarding:** sign up/in → land in personal private workspace.
2. **Import:** upload a document → watch progress → graph grows new nodes, or an existing node gains a mention.
3. **Explore:** click a node on the graph → view detail and provenance → navigate relationships.
4. **Search:** semantic search box → find relevant concepts/passages.
5. **Ask the library:** ask → streamed, cited answer → related concepts light up on the graph in real time.
6. **Collaborate:** create a shared workspace → invite a collaborator → co-build the graph; personal workspace stays private.

## 7. Page List
- Sign-in/Sign-up page (Cognito via Amplify)
- Workspace list / switcher (personal + shared)
- Main graph view (force-directed canvas + nodes/edges, colored by cluster)
- Import panel (upload + processing progress)
- Document list page
- Concept detail drawer (name/aliases/description/provenance/related concepts)
- Semantic search box (may live within the main view)
- Q&A panel (ask + streamed answer + citations, synced with graph highlight)
- Workspace settings / member invite (shared workspace)

## 8. Hackathon Constraints & Deliverables (reference)
- Mandatory: use Aurora PostgreSQL (one of the three required DBs) as the primary backend; deploy the frontend on Vercel.
- Deliverables: <3-min public demo video (problem/audience/DB used + working footage), published Vercel project link + Vercel Team ID, architecture diagram, screenshot proving AWS database usage, English text description.
- Key dates: submission deadline 2026-06-29 17:00 PT; credits request form by 2026-06-26 12:00 PT.
- Bonus: publish content on how you built it, 0.2 each up to 0.6, stating it was created for this hackathon, with #H0Hackathon on social media.
