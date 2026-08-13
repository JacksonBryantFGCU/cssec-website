import { EXPERIENCE_LEVELS, titleForValue } from '../../sanity/schemaTypes/shared/options.ts'

/**
 * Presentation logic for events.
 *
 * Everything here is pure and takes plain data, so the labels the design calls
 * for are unit tested rather than checked by eye in a browser. Components read
 * these; they do not re-derive them.
 *
 * Deliberately *not* here: date and time formatting, which belongs to
 * `@/lib/time` so there is exactly one place that knows the club timezone.
 */

export type EventLocation = {
  locationType?: string | null
  place?: string | null
  onlineUrl?: string | null
  directions?: string | null
} | null

export type EventPresenter = { _id: string; name?: string | null }

/** The shape every event list and card in this phase reads. */
export type EventSummary = {
  _id: string
  title?: string | null
  slug?: string | null
  status?: string | null
  eventType?: string | null
  startsAt?: string | null
  endsAt?: string | null
  summary?: string | null
  featured?: boolean | null
  experienceLevel?: string | null
  noExperienceRequired?: boolean | null
  location?: EventLocation
  presenters?: EventPresenter[] | null
}

/**
 * Where the event happens, in one line.
 *
 * Online events have no room, hybrid events have both, and an in-person event
 * missing its room still needs to say something — the design never renders an
 * empty metadata slot.
 */
export function eventLocationLabel(location: EventLocation | undefined): string {
  const place = location?.place?.trim()

  switch (location?.locationType) {
    case 'online':
      return 'Online'
    case 'hybrid':
      return place ? `${place} · also online` : 'Online'
    default:
      return place || 'Location to be announced'
  }
}

/**
 * The experience-level line.
 *
 * `noExperienceRequired` wins over the graded level: an event flagged for
 * beginners says so in the words the club uses, which is the single most
 * important message on the page for a first-time attendee.
 */
export function experienceLabel(event: {
  experienceLevel?: string | null
  noExperienceRequired?: boolean | null
}): string {
  if (event.noExperienceRequired) return 'No experience required'
  if (!event.experienceLevel || event.experienceLevel === 'any') return 'Everyone welcome'

  return titleForValue(EXPERIENCE_LEVELS, event.experienceLevel) ?? 'Everyone welcome'
}

/**
 * Which of the two level treatments an event gets.
 *
 * The design pairs green with "no experience required" and blue with anything
 * that assumes some background. Both carry a glyph as well as the colour.
 */
export function experienceTone(event: {
  noExperienceRequired?: boolean | null
  experienceLevel?: string | null
}): 'beginner' | 'experienced' {
  if (event.noExperienceRequired) return 'beginner'
  return !event.experienceLevel || event.experienceLevel === 'any' ? 'beginner' : 'experienced'
}

/** "Jackson Bryant", "Maya Rivera and Devon Cole", "Three presenters". */
export function presenterLabel(presenters: EventPresenter[] | null | undefined): string {
  const names = (presenters ?? [])
    .map((presenter) => presenter.name?.trim())
    .filter((name): name is string => Boolean(name))

  if (names.length === 0) return 'Presenter to be announced'
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`

  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

/**
 * Has this event finished?
 *
 * Matches the GROQ filters in `@/sanity/queries/events` exactly: an event is
 * past once its *end* has passed, so a session still running at 6:45 is not
 * quietly moved into the archive halfway through.
 */
export function isPastEvent(
  event: Pick<EventSummary, 'startsAt' | 'endsAt'>,
  now: Date = new Date(),
): boolean {
  const boundary = event.endsAt ?? event.startsAt
  if (!boundary) return false

  const instant = new Date(boundary)
  if (Number.isNaN(instant.getTime())) return false

  return instant.getTime() < now.getTime()
}

/**
 * The archive row's right-hand column.
 *
 * A finished session advertises what it left behind; an upcoming one points at
 * the preparation instead. Zero materials is a real state — a session can end
 * before its slides are uploaded — and must not read "0 materials".
 */
export function materialsLabel(materialCount: number, past: boolean): string {
  if (!past) return 'Setup steps'
  if (materialCount === 0) return 'Session details'

  return materialCount === 1 ? '1 material' : `${materialCount} materials`
}

/**
 * Splits one ordered list of events into the two the homepage needs.
 *
 * The featured slot takes the first upcoming event — preferring one an officer
 * explicitly flagged — and `rest` never repeats it, because the design shows
 * "Coming up" as *subsequent* events only.
 */
export function splitFeaturedEvent<T extends { featured?: boolean | null }>(
  upcoming: readonly T[],
): { featured: T | null; rest: T[] } {
  if (upcoming.length === 0) return { featured: null, rest: [] }

  const flaggedIndex = upcoming.findIndex((event) => event.featured)
  const index = flaggedIndex === -1 ? 0 : flaggedIndex

  return {
    featured: upcoming[index],
    rest: upcoming.filter((_, position) => position !== index),
  }
}
