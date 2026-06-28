// Mirrors the backend payloads (app/services/graph_read.py GraphOut,
// app/services/concept_read.py ConceptDetail/ConceptPassages). UUIDs arrive as
// strings over JSON.

export type GraphNode = {
  id: string;
  name: string;
  description: string | null;
  cluster_id: string | null;
  mentions: number;
};

export type GraphLink = {
  id: string;
  source: string;
  target: string;
  relation: string;
  weight: number;
};

export type GraphCluster = {
  id: string;
  label: string | null;
  parent_id: string | null;
};

export type GraphData = {
  nodes: GraphNode[];
  links: GraphLink[];
  clusters: GraphCluster[];
};

export type ConceptPassage = {
  document_id: string;
  document_title: string;
  chunk_id: string;
  content: string;
};

export type ConceptDetail = {
  id: string;
  name: string;
  description: string | null;
  cluster_label: string | null;
  aliases: string[];
  documents: { document_id: string; title: string }[];
  mentions: number;
  degree: number;
  passages?: ConceptPassage[];
};
