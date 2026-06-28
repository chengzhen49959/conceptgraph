// Copied from frontend/src/lib/relations.ts — readable labels for the fixed
// relation vocabulary the backend extracts (app/ai/extract.py).
export const RELATION_LABEL: Record<string, string> = {
  builds_on: "builds on",
  contrasts_with: "contrasts with",
  applied_to: "applied to",
  uses: "uses",
  part_of: "part of",
  is_a: "is a",
};

export const humanizeRelation = (relation: string): string =>
  RELATION_LABEL[relation] ?? relation.replace(/_/g, " ");
