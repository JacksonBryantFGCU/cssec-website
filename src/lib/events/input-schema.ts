import { z } from 'zod'

// Relative, `.ts`-suffixed imports so this module runs unmodified under
// `node --test` as well as through the bundler — same convention as `src/auth`.
import {
  EVENT_STATUSES,
  EVENT_TYPES,
  EXPERIENCE_LEVELS,
  LOCATION_TYPES,
} from '../../sanity/schemaTypes/shared/options.ts'
import type { Event } from '../../sanity/types.ts'
import {
  checkbox,
  fieldErrorsFrom,
  optionalSlug,
  optionalText,
  optionalUrl,
  optionValue,
  referenceIdList,
  stringList,
} from '../admin/fields.ts'
import { clubInputToIso } from '../time.ts'

export { fieldErrorsFrom }

/**
 * Validation for event input submitted from `/admin`.
 *
 * This is the application's contract, deliberately separate from Sanity's own
 * schema validation: Sanity validates in the Studio UI, but a Server Action is
 * reachable by direct POST, so nothing may reach the Content Lake unvalidated.
 *
 * Only two things are imported from the Sanity side, and both are safe in a
 * browser bundle:
 *
 * - the shared **option lists** (a dependency-free data module), so the allowed
 *   values here can never drift from the Studio dropdowns;
 * - the **generated document type**, as a type-only import that is erased at
 *   build time, so the unions below are derived from the real schema.
 */

type EventStatus = NonNullable<Event['status']>
type EventType = NonNullable<Event['eventType']>
type ExperienceLevel = NonNullable<Event['experienceLevel']>
type LocationType = NonNullable<NonNullable<Event['location']>['locationType']>

/** A club-time `datetime-local` value converted to the stored UTC instant. */
const requiredClubDateTime = z
  .string()
  .trim()
  .min(1, 'Add the date and time.')
  .transform((value, ctx) => {
    const iso = clubInputToIso(value)
    if (!iso) {
      ctx.addIssue({ code: 'custom', message: 'Enter a real date and time.' })
      return z.NEVER
    }
    return iso
  })

const optionalClubDateTime = z
  .string()
  .trim()
  .transform((value, ctx) => {
    if (!value) return undefined
    const iso = clubInputToIso(value)
    if (!iso) {
      ctx.addIssue({ code: 'custom', message: 'Enter a real date and time.' })
      return z.NEVER
    }
    return iso
  })
  .optional()

export const eventInputSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Give the event a title of at least 3 characters.')
      .max(120, 'Keep the title under 120 characters.'),
    slug: optionalSlug,
    status: optionValue<EventStatus>(EVENT_STATUSES, 'Choose a status.'),
    eventType: optionValue<EventType>(EVENT_TYPES, 'Choose an event type.'),
    startsAt: requiredClubDateTime,
    endsAt: optionalClubDateTime,
    locationType: optionValue<LocationType>(LOCATION_TYPES, 'Choose how the event is held.'),
    place: optionalText(120, 'Keep the room under 120 characters.'),
    onlineUrl: optionalUrl('Enter a full meeting link starting with https://'),
    directions: optionalText(300, 'Keep directions under 300 characters.'),
    summary: z
      .string()
      .trim()
      .min(10, 'Write a one or two sentence summary.')
      .max(300, 'Keep the summary under 300 characters.'),
    experienceLevel: optionValue<ExperienceLevel>(EXPERIENCE_LEVELS, 'Choose an experience level.'),
    noExperienceRequired: checkbox,
    prerequisites: stringList(20, 'Keep it to 20 prerequisites or fewer.'),
    topics: stringList(20, 'Keep it to 20 topics or fewer.'),
    registrationUrl: optionalUrl('Enter a full registration link starting with https://'),
    communityUrl: optionalUrl('Enter a full Discord or community link starting with https://'),
    recap: optionalText(1000, 'Keep the recap under 1000 characters.'),
    featured: checkbox,
    presenters: referenceIdList(10, 'Select up to 10 presenters.'),
  })
  .superRefine((input, ctx) => {
    if (input.endsAt && input.endsAt < input.startsAt) {
      ctx.addIssue({
        code: 'custom',
        path: ['endsAt'],
        message: 'The end time cannot be before the start time.',
      })
    }

    // Mirrors the Sanity `eventLocation` rule: somewhere to physically go.
    if (input.locationType !== 'online' && !input.place) {
      ctx.addIssue({
        code: 'custom',
        path: ['place'],
        message: 'Add the building and room for in-person and hybrid events.',
      })
    }

    if (input.locationType !== 'inPerson' && !input.onlineUrl) {
      ctx.addIssue({
        code: 'custom',
        path: ['onlineUrl'],
        message: 'Add the meeting link for online and hybrid events.',
      })
    }
  })

export type EventInput = z.infer<typeof eventInputSchema>

/** The raw form field names, used to echo input back after a failed submit. */
export const EVENT_FORM_FIELDS = [
  'title',
  'slug',
  'status',
  'eventType',
  'startsAt',
  'endsAt',
  'locationType',
  'place',
  'onlineUrl',
  'directions',
  'summary',
  'experienceLevel',
  'noExperienceRequired',
  'prerequisites',
  'topics',
  'registrationUrl',
  'communityUrl',
  'recap',
  'featured',
] as const

export type EventFormField = (typeof EVENT_FORM_FIELDS)[number]

/** Parses a submitted form into validated event input. */
export function parseEventForm(formData: FormData) {
  return eventInputSchema.safeParse({
    title: formData.get('title') ?? '',
    slug: formData.get('slug') ?? '',
    status: formData.get('status') ?? '',
    eventType: formData.get('eventType') ?? '',
    startsAt: formData.get('startsAt') ?? '',
    endsAt: formData.get('endsAt') ?? '',
    locationType: formData.get('locationType') ?? '',
    place: formData.get('place') ?? '',
    onlineUrl: formData.get('onlineUrl') ?? '',
    directions: formData.get('directions') ?? '',
    summary: formData.get('summary') ?? '',
    experienceLevel: formData.get('experienceLevel') ?? '',
    noExperienceRequired: formData.get('noExperienceRequired'),
    prerequisites: formData.get('prerequisites') ?? '',
    topics: formData.get('topics') ?? '',
    registrationUrl: formData.get('registrationUrl') ?? '',
    communityUrl: formData.get('communityUrl') ?? '',
    recap: formData.get('recap') ?? '',
    featured: formData.get('featured'),
    presenters: formData.getAll('presenters').map(String),
  })
}
