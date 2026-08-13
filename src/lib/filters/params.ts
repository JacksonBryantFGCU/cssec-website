/**
 * URL-driven filtering, shared by Projects, Resources, Opportunities and Events.
 *
 * The whole filter state lives in the query string — `?status=recruiting&level=beginner`
 * — which makes a filtered view shareable, bookmarkable, server-rendered and
 * back-button-correct, and means the chips can be plain links that work before
 * (and without) JavaScript. There is no client filter state anywhere.
 *
 * Deliberately small: parse, toggle, count. Four pages need the same three
 * things, so they are written once here rather than four times or as a generic
 * filtering framework.
 */

/** The selected value per facet key. `null` means "no filter on this facet". */
export type ActiveFilters = Record<string, string | null>

/** What a page hands to the filter bar for one chip. */
export type FilterChip = {
  /** `null` is the "All" chip. */
  value: string | null
  label: string
  href: string
  active: boolean
  /** Matching items; omitted when a count would not help. */
  count?: number
}

type RawParam = string | string[] | undefined

/**
 * Narrows one query parameter to a known value.
 *
 * Anything unrecognised — a stale link, a hand-edited URL, a repeated
 * parameter — is treated as no filter rather than an error, so a bad URL still
 * renders the full list instead of an empty page or a crash.
 */
export function parseFilterParam(raw: RawParam, allowed: readonly string[]): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return allowed.includes(trimmed) ? trimmed : null
}

/** Parses every facet of a page in one call. */
export function parseFilters(
  searchParams: Record<string, RawParam>,
  facets: Record<string, readonly string[]>,
): ActiveFilters {
  const active: ActiveFilters = {}
  for (const [key, allowed] of Object.entries(facets)) {
    active[key] = parseFilterParam(searchParams[key], allowed)
  }
  return active
}

/**
 * The href for setting one facet to `value`, keeping the other facets.
 *
 * Passing the already-active value clears that facet, so a chip toggles — the
 * behaviour the design's chip rows imply, and the reason "All" needs no
 * special case.
 */
export function filterHref(
  basePath: string,
  active: ActiveFilters,
  key: string,
  value: string | null,
): string {
  const next: ActiveFilters = { ...active, [key]: active[key] === value ? null : value }

  // Sorted so the same filter state always produces the same URL, which keeps
  // it cacheable and stops two links to the same view looking different.
  const params = new URLSearchParams()
  for (const facet of Object.keys(next).sort()) {
    const facetValue = next[facet]
    if (facetValue) params.set(facet, facetValue)
  }

  const query = params.toString()
  return query ? `${basePath}?${query}` : basePath
}

/** True when at least one facet is filtering. */
export function hasActiveFilters(active: ActiveFilters): boolean {
  return Object.values(active).some(Boolean)
}

/**
 * How many items match each value of a facet.
 *
 * Counts come from the unfiltered set for the facet being counted, so the
 * numbers on the chips stay honest and a chip never advertises results it
 * cannot deliver.
 */
export function countValues<T>(
  items: readonly T[],
  select: (item: T) => readonly (string | null | undefined)[] | string | null | undefined,
): Map<string, number> {
  const counts = new Map<string, number>()

  for (const item of items) {
    const selected = select(item)
    const values = Array.isArray(selected) ? selected : [selected]
    // A value repeated on one item still counts once for that item.
    const unique = new Set(values.filter((value): value is string => Boolean(value)))
    for (const value of unique) {
      counts.set(value, (counts.get(value) ?? 0) + 1)
    }
  }

  return counts
}

/**
 * Builds a chip row for one facet, dropping options nothing matches.
 *
 * Hiding empty options is what keeps these filters honest at CSSEC's current
 * size: a "Hackathon" chip that always returns nothing is worse than no chip,
 * and as the catalogue grows the row fills in on its own.
 */
export function buildChips({
  active,
  allLabel = 'All',
  basePath,
  counts,
  key,
  options,
  total,
}: {
  active: ActiveFilters
  allLabel?: string
  basePath: string
  counts: Map<string, number>
  key: string
  options: readonly { value: string; title: string }[]
  /** Count for the "All" chip. */
  total: number
}): FilterChip[] {
  const chips: FilterChip[] = [
    {
      value: null,
      label: allLabel,
      href: filterHref(basePath, active, key, null),
      active: !active[key],
      count: total,
    },
  ]

  for (const option of options) {
    const count = counts.get(option.value) ?? 0
    // Keep an active chip visible even at zero, or clearing it becomes
    // impossible once it is the thing making the list empty.
    if (count === 0 && active[key] !== option.value) continue

    chips.push({
      value: option.value,
      label: option.title,
      href: filterHref(basePath, active, key, option.value),
      active: active[key] === option.value,
      count,
    })
  }

  return chips
}

/** Turns free-text values (topics, tech) into chip options, most common first. */
export function optionsFromCounts(
  counts: Map<string, number>,
  limit = 12,
): { value: string; title: string }[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([value]) => ({ value, title: value }))
}
