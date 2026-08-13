import {
  EXPERIENCE_LEVELS,
  RESOURCE_TYPES,
  titleForValue,
} from '../../sanity/schemaTypes/shared/options.ts'

/**
 * Presentation logic for the resource library.
 *
 * Pure and dependency-free so it runs under `node --test`; relative,
 * `.ts`-suffixed imports for the same reason.
 */

/** Resource types whose entries are maintained independently of any meeting. */
export const STANDALONE_TYPES = ['guide', 'cheatSheet', 'tutorial', 'interviewPrep', 'career']

export type ResourceSourceInput = {
  event?: { title?: string | null; slug?: string | null; startsAt?: string | null } | null
}

/** "Git & GitHub Workshop" — the session a resource came out of. */
export function sourceEventLabel(
  resource: ResourceSourceInput,
  formatDate: (iso: string) => string,
): string | null {
  const event = resource.event
  if (!event?.title) return null

  return event.startsAt ? `${event.title} — ${formatDate(event.startsAt)}` : event.title
}

/** Where the source-event link points, or null when there is nothing to link. */
export function sourceEventHref(resource: ResourceSourceInput): string | null {
  return resource.event?.slug ? `/events/${resource.event.slug}` : null
}

export function resourceTypeLabel(resourceType: string | null | undefined): string {
  return titleForValue(RESOURCE_TYPES, resourceType) ?? 'Resource'
}

export function resourceLevelLabel(level: string | null | undefined): string {
  // "Any experience level" is the default and says nothing useful in a table
  // column, so it reads as a dash instead of repeating on every row.
  if (!level || level === 'any') return '—'
  return titleForValue(EXPERIENCE_LEVELS, level) ?? level
}

/**
 * True when a resource stands on its own rather than documenting a session.
 *
 * The design splits the library in two — the dated archive, and the guides
 * officers maintain — and this is the rule that decides which half an entry
 * belongs to: a guide with no source event is maintained, one attached to a
 * meeting is that meeting's material.
 */
export function isMaintainedGuide(
  resource: ResourceSourceInput & { resourceType?: string | null },
): boolean {
  if (resource.event?.title) return false
  return STANDALONE_TYPES.includes(resource.resourceType ?? '')
}
