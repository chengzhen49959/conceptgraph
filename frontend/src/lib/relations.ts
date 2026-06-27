// The fixed relation vocabulary the backend extracts and stores (app/ai/extract.py).
// Kept in sync here so manual edges use the same six types and the UI renders
// readable labels instead of the raw enum.
export const RELATION_TYPES = [
  'builds_on',
  'contrasts_with',
  'applied_to',
  'uses',
  'part_of',
  'is_a',
] as const

export type RelationType = (typeof RELATION_TYPES)[number]

export const RELATION_LABEL: Record<string, string> = {
  builds_on: 'builds on',
  contrasts_with: 'contrasts with',
  applied_to: 'applied to',
  uses: 'uses',
  part_of: 'part of',
  is_a: 'is a',
}

// Readable label for a stored relation; falls back to de-underscoring any legacy
// free-text value so old edges still render sensibly.
export const humanizeRelation = (relation: string): string =>
  RELATION_LABEL[relation] ?? relation.replace(/_/g, ' ')
