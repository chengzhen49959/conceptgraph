import { pinyin } from 'pinyin-pro'

/**
 * Pinyin helpers for the alphabetical concept index. Concept names are mostly
 * Chinese, so an A–Z index means *pinyin* initials. pinyin-pro converts a Han
 * character to its pinyin; Latin names index by their own first letter.
 */

/** First-letter bucket for the A–Z rail: pinyin initial for a Han character,
 *  the letter itself for a Latin name, '#' for anything else. */
export function pinyinInitial(name: string): string {
  const ch = name?.trim()[0]
  if (!ch) return '#'
  if (/[a-zA-Z]/.test(ch)) return ch.toUpperCase()
  if (/\p{Script=Han}/u.test(ch)) {
    const first = pinyin(ch, { pattern: 'first', toneType: 'none', type: 'array' })[0]
    if (first && /[a-zA-Z]/.test(first)) return first.toUpperCase()
  }
  return '#'
}

/** Sort key: full toneless pinyin (so order matches the initial grouping). */
export function pinyinSortKey(name: string): string {
  return pinyin(name, { toneType: 'none' }).toLowerCase()
}
