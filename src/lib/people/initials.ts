/**
 * Initials for a person with no photograph.
 *
 * Lives here rather than beside the Sanity image helper so it can be unit
 * tested on its own: anything under `src/sanity/` reads the validated
 * environment at import time and cannot be loaded by the test runner.
 *
 * The deliberate alternative to a stock headshot or a generic silhouette. It is
 * honest about the absence and still gives an officer card a stable anchor.
 */
export function initialsFor(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'

  const first = parts[0]!.charAt(0)
  // First and last, so "Maria del Carmen Rivera" reads MR rather than MD.
  const last = parts.length > 1 ? parts[parts.length - 1]!.charAt(0) : ''

  return `${first}${last}`.toUpperCase()
}
