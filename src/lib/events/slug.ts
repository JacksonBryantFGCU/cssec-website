/**
 * Slug derivation for admin-created content.
 *
 * Officers should never have to think about URL formatting, so the slug is
 * derived from the title by default and only overridden deliberately. This is a
 * deterministic 20-line helper rather than a dependency: the rules are fixed
 * (lowercase, ASCII, hyphen separated) and must stay stable, because changing
 * them later would change existing URLs.
 *
 * `maxLength: 96` mirrors the `slug` field options in the Sanity event schema.
 */

export const SLUG_MAX_LENGTH = 96

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Turns free text into a URL slug. Returns "" when nothing usable is left. */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    // Strip the combining marks NFKD just separated, so "Café" becomes "cafe".
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX_LENGTH)
    // A trailing hyphen can reappear after slicing.
    .replace(/-+$/g, '')
}

export function isValidSlug(value: string): boolean {
  return value.length > 0 && value.length <= SLUG_MAX_LENGTH && SLUG_PATTERN.test(value)
}

/**
 * Picks the first slug not already taken.
 *
 * `taken` is the set of slugs found in Sanity for this document type, minus the
 * document being edited. Collisions are rare, so counting up is clearer than
 * hashing — and it keeps "git-workshop-2" readable.
 */
export function uniqueSlug(desired: string, taken: Iterable<string>): string {
  const used = new Set(taken)
  if (!used.has(desired)) return desired

  for (let suffix = 2; suffix < 1000; suffix += 1) {
    // Keep room for the suffix without exceeding the schema's max length.
    const candidate = `${desired.slice(0, SLUG_MAX_LENGTH - `-${suffix}`.length)}-${suffix}`
    if (!used.has(candidate)) return candidate
  }

  // Practically unreachable; falls back to something guaranteed unique.
  return `${desired.slice(0, SLUG_MAX_LENGTH - 14)}-${Date.now().toString(36)}`
}
