import { isoToClubInput } from '../time.ts'

/**
 * The bridge between a stored event and the admin form.
 *
 * Form controls speak strings, so this is where a Sanity document becomes the
 * exact values an officer sees in the inputs — dates converted from the stored
 * UTC instant into club-time wall clock, lists flattened into text.
 *
 * Pure and free of Sanity imports so it can be unit tested; the same shape is
 * echoed back by the Server Action after a rejected save.
 */

export type EventFormValues = Record<string, string | string[]>

export type EditableEvent = {
  title?: string | null
  slug?: string | null
  status?: string | null
  eventType?: string | null
  startsAt?: string | null
  endsAt?: string | null
  location?: {
    locationType?: string | null
    place?: string | null
    onlineUrl?: string | null
    directions?: string | null
  } | null
  summary?: string | null
  experienceLevel?: string | null
  noExperienceRequired?: boolean | null
  prerequisites?: string[] | null
  topics?: string[] | null
  registrationUrl?: string | null
  communityUrl?: string | null
  recap?: string | null
  featured?: boolean | null
  presenterIds?: Array<string | null> | null
}

/** HTML checkboxes are submitted as "on", so defaults use the same vocabulary. */
const checkbox = (value: boolean | null | undefined) => (value ? 'on' : '')

const text = (value: string | null | undefined) => value ?? ''

/** Sensible starting point for a brand new event. */
export const NEW_EVENT_VALUES: EventFormValues = {
  title: '',
  slug: '',
  status: 'scheduled',
  eventType: 'workshop',
  startsAt: '',
  endsAt: '',
  locationType: 'inPerson',
  place: '',
  onlineUrl: '',
  directions: '',
  summary: '',
  experienceLevel: 'any',
  // Matches the Sanity schema's initial value: CSSEC events are beginner-open
  // unless an officer says otherwise.
  noExperienceRequired: 'on',
  prerequisites: '',
  topics: '',
  registrationUrl: '',
  communityUrl: '',
  recap: '',
  featured: '',
  presenters: [],
}

export function eventToFormValues(event: EditableEvent): EventFormValues {
  return {
    title: text(event.title),
    slug: text(event.slug),
    status: text(event.status) || 'scheduled',
    eventType: text(event.eventType) || 'workshop',
    startsAt: isoToClubInput(event.startsAt),
    endsAt: isoToClubInput(event.endsAt),
    locationType: text(event.location?.locationType) || 'inPerson',
    place: text(event.location?.place),
    onlineUrl: text(event.location?.onlineUrl),
    directions: text(event.location?.directions),
    summary: text(event.summary),
    experienceLevel: text(event.experienceLevel) || 'any',
    noExperienceRequired: checkbox(event.noExperienceRequired),
    // One per line: the form parses newlines and commas alike.
    prerequisites: (event.prerequisites ?? []).join('\n'),
    topics: (event.topics ?? []).join(', '),
    registrationUrl: text(event.registrationUrl),
    communityUrl: text(event.communityUrl),
    recap: text(event.recap),
    featured: checkbox(event.featured),
    presenters: (event.presenterIds ?? []).filter((id): id is string => typeof id === 'string'),
  }
}
