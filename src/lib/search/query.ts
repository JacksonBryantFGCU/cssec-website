/**
 * Turning what someone typed into something safe to hand GROQ.
 *
 * Pure and dependency-free, so the rules below are unit tested without a
 * server, a network or a Sanity project. The route handler is the only caller.
 */

/** Below this, a query matches most of the dataset and means nothing. */
export const MIN_QUERY_LENGTH = 2

/** Above this, it is not a search — it is a paste. Truncated, not rejected. */
export const MAX_QUERY_LENGTH = 80

/** How many documents the GROQ query may return before ranking. */
export const FETCH_LIMIT = 60

/** How many results the user is ever shown. */
export const RESULT_LIMIT = 20

export type ParsedQuery =
  | { ok: false; reason: 'empty' | 'too-short' }
  | { ok: true; text: string; terms: string[] }

/**
 * Everything GROQ's `match` treats as syntax, plus any control character.
 *
 * Control characters are matched by the Unicode `Cc` category rather than by a
 * literal range, so nothing unprintable has to appear in this file. Stripping
 * these costs no real matching ability: `match` tokenises on non-alphanumerics
 * anyway, so "C++" and "C#" already reduce to the token "c" inside Sanity
 * whatever we send it.
 */
const UNSAFE = /[\p{Cc}"'*?\\[\](){}<>|&!:;,^~$@`]/gu

/**
 * Normalises a raw query string.
 *
 * Whitespace is collapsed, the length is clamped, and the result is split into
 * the tokens the GROQ query matches on. An empty or one-character query is
 * rejected here rather than being sent and returning the whole dataset.
 */
export function parseSearchQuery(raw: unknown): ParsedQuery {
  if (typeof raw !== 'string') return { ok: false, reason: 'empty' }

  const text = raw.slice(0, MAX_QUERY_LENGTH).replace(/\s+/g, ' ').trim()

  if (text.length === 0) return { ok: false, reason: 'empty' }
  if (text.length < MIN_QUERY_LENGTH) return { ok: false, reason: 'too-short' }

  const terms = text
    .replace(UNSAFE, ' ')
    .split(/[\s./_-]+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 0)

  // A query made entirely of punctuation survives the length check but has
  // nothing to match on.
  if (terms.length === 0) return { ok: false, reason: 'too-short' }

  return { ok: true, text, terms }
}

/**
 * The `match` patterns GROQ receives.
 *
 * Each token gets a trailing `*` so typing "depl" finds "deployment", and the
 * array is passed as a whole because GROQ requires *every* pattern in an array
 * to match — which is the behaviour people expect from a multi-word query.
 */
export function matchPatterns(terms: string[]): string[] {
  return terms.map((term) => `${term}*`)
}
