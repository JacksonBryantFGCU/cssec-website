// Explicit `.ts` specifier so Node's built-in test runner can execute the
// search tests without a bundler, exactly as `src/auth/*` does.
import { RESULT_LIMIT } from './query.ts'

/**
 * The shape the search dialog renders.
 *
 * Deliberately flat and type-agnostic: the interactive component should not
 * contain a four-way union and a switch over document types, because that is
 * where a "which field is the title again?" bug lives. Everything specific to
 * an event, a project, a resource or an opportunity is resolved here, once.
 */
export type SearchResultType = 'event' | 'project' | 'resource' | 'opportunity'

export type SearchResult = {
  id: string
  type: SearchResultType
  /** What the reader is looking for. */
  title: string
  /** The secondary line: organization, date, or the opening of the summary. */
  meta: string
  /** The badge on the right — the document's own kind, in the design's mono. */
  kind: string
  href: string
  /** Opportunities link out to the employer, so the link needs `target`. */
  external: boolean
}

export type SearchGroup = {
  type: SearchResultType
  label: string
  items: SearchResult[]
}

/** The order the design lists sections in, reused as the group order. */
const TYPE_ORDER: SearchResultType[] = ['event', 'project', 'resource', 'opportunity']

const GROUP_LABELS: Record<SearchResultType, string> = {
  event: 'EVENTS',
  project: 'PROJECTS',
  resource: 'RESOURCES',
  opportunity: 'OPPORTUNITIES',
}

/** One row as the GROQ query returns it, before it becomes a `SearchResult`. */
export type SearchDocument = {
  _id: string
  _type: string
  slug?: string | null
  title?: string | null
  summary?: string | null
  keywords?: Array<string | null> | null
  kind?: string | null
  organization?: string | null
  startsAt?: string | null
  deadline?: string | null
  publishedAt?: string | null
  applicationUrl?: string | null
}

function isSearchResultType(value: string): value is SearchResultType {
  return TYPE_ORDER.includes(value as SearchResultType)
}

/** Turns a stored option value like `studySession` into `STUDY SESSION`. */
function kindLabel(kind: string | null | undefined): string {
  if (!kind) return ''
  return kind
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toUpperCase()
}

/**
 * Where a result sends the reader.
 *
 * Events, projects and resources each have a detail route. Opportunities do
 * not, by design — the schema has no slug, and the board links straight to the
 * organization's own application page, which is what someone searching for an
 * internship actually wants. Without one we fall back to the board itself
 * rather than inventing a route that does not exist.
 */
function destination(document: SearchDocument, type: SearchResultType): {
  href: string
  external: boolean
} | null {
  if (type === 'opportunity') {
    return document.applicationUrl
      ? { href: document.applicationUrl, external: true }
      : { href: '/opportunities', external: false }
  }

  if (!document.slug) return null

  const segment = type === 'event' ? 'events' : type === 'project' ? 'projects' : 'resources'
  return { href: `/${segment}/${document.slug}`, external: false }
}

/** The one-line context under the title. */
function metaFor(document: SearchDocument, type: SearchResultType): string {
  const summary = document.summary?.replace(/\s+/g, ' ').trim() ?? ''
  const trimmed = summary.length > 96 ? `${summary.slice(0, 95).trimEnd()}…` : summary

  if (type === 'opportunity' && document.organization) {
    return trimmed ? `${document.organization} · ${trimmed}` : document.organization
  }

  return trimmed
}

/**
 * How well a document answers the query.
 *
 * Three tiers, in the order a reader would rank them themselves: the title,
 * then the strong metadata (topics, stack, skills, organization, kind), then
 * the body text. A term appearing in several places scores each of them, so a
 * workshop actually called "Git" beats one that mentions git in its summary.
 *
 * Every term is scored independently and the scores are summed, which means a
 * two-word query prefers the document matching both words strongly. There is
 * no field weighting beyond these three numbers and no decay — anything more
 * would be a relevance engine nobody could explain to the next officer.
 */
function score(document: SearchDocument, terms: string[]): number {
  const title = (document.title ?? '').toLowerCase()
  const keywords = (document.keywords ?? [])
    .filter((keyword): keyword is string => Boolean(keyword))
    .join(' ')
    .toLowerCase()
  const strong = `${keywords} ${document.organization ?? ''} ${document.kind ?? ''}`.toLowerCase()
  const body = (document.summary ?? '').toLowerCase()

  let total = 0

  for (const term of terms) {
    const needle = term.toLowerCase()

    if (title === needle) total += 12
    else if (title.startsWith(needle)) total += 8
    else if (title.includes(needle)) total += 6

    if (strong.includes(needle)) total += 3
    if (body.includes(needle)) total += 1
  }

  return total
}

/**
 * Maps, ranks and caps the raw query result.
 *
 * A document that cannot produce a working link is dropped rather than
 * rendered as a dead row — a resource saved without a slug is a real state.
 */
export function toSearchResults(
  documents: SearchDocument[],
  terms: string[],
  limit: number = RESULT_LIMIT,
): SearchResult[] {
  const scored: Array<{ result: SearchResult; score: number; order: number }> = []

  for (const document of documents) {
    if (!isSearchResultType(document._type)) continue
    const type = document._type

    const target = destination(document, type)
    if (!target || !document.title) continue

    scored.push({
      result: {
        id: document._id,
        type,
        title: document.title,
        meta: metaFor(document, type),
        kind: kindLabel(document.kind) || GROUP_LABELS[type].slice(0, -1),
        href: target.href,
        external: target.external,
      },
      score: score(document, terms),
      order: TYPE_ORDER.indexOf(type),
    })
  }

  return scored
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.order - b.order ||
        a.result.title.localeCompare(b.result.title),
    )
    .slice(0, limit)
    .map((entry) => entry.result)
}

/**
 * Groups ranked results by type for display, preserving rank inside each group.
 *
 * The design lists results under type headings, so the groups are ordered by
 * the strongest result each one contains rather than by the fixed type order —
 * otherwise a query that plainly means a project would still show events first.
 */
export function groupSearchResults(results: SearchResult[]): SearchGroup[] {
  const groups: SearchGroup[] = []

  for (const result of results) {
    const existing = groups.find((group) => group.type === result.type)
    if (existing) existing.items.push(result)
    else groups.push({ type: result.type, label: GROUP_LABELS[result.type], items: [result] })
  }

  return groups
}

/** The flat, keyboard-navigable order — grouping must not change it. */
export function flattenGroups(groups: SearchGroup[]): SearchResult[] {
  return groups.flatMap((group) => group.items)
}
