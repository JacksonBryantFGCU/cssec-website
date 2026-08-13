'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { requireOfficer } from '@/auth/require-officer'
import { eventRemovalPolicy } from '@/lib/events/delete-policy'
import type { EventActionResult, EventFormState } from '@/lib/events/form-state'
import {
  EVENT_FORM_FIELDS,
  fieldErrorsFrom,
  parseEventForm,
  type EventInput,
} from '@/lib/events/input-schema'
import { slugify, uniqueSlug } from '@/lib/events/slug'
import { getAdminClient } from '@/sanity/lib/admin-client'
import { getWriteClient } from '@/sanity/lib/write-client'
import { EVENT_SLUGS_IN_USE_QUERY } from '@/sanity/queries/admin'

/**
 * Event mutations.
 *
 * Every action in this file follows the same five steps, in the same order:
 *
 *   1. `requireOfficer({ capability: 'content:write' })` — independently. A
 *      Server Action is its own entry point, reachable by a direct POST, so the
 *      layout's check does not cover it.
 *   2. Zod validation of the raw input (`@/lib/events/input-schema`).
 *   3. The mutation through `getWriteClient()`, which is `server-only`.
 *   4. Revalidation of everything the change affects.
 *   5. Redirect or a typed result — never a raw Sanity error.
 *
 * These are deliberately domain-specific. A generic `mutateDocument(type, data)`
 * would make the authorization and validation of each document type impossible
 * to review, which is exactly the property we want to keep.
 */

/**
 * Everything a change to an event can affect.
 *
 * One place to extend when the public event pages are built — add their paths
 * here and every existing mutation invalidates them correctly.
 */
function revalidateEventContent(): void {
  // Covers /admin and every nested admin route in one call.
  revalidatePath('/admin', 'layout')
}

/** Echoes the raw submission back to the form after a rejected save. */
function submittedValues(formData: FormData): Record<string, string | string[]> {
  const values: Record<string, string | string[]> = {}

  for (const field of EVENT_FORM_FIELDS) {
    values[field] = String(formData.get(field) ?? '')
  }
  values.presenters = formData.getAll('presenters').map(String)

  return values
}

function invalid(
  formData: FormData,
  fieldErrors: Record<string, string>,
  message = 'Check the highlighted fields and try again.',
): EventFormState {
  return { status: 'error', message, fieldErrors, values: submittedValues(formData) }
}

/** Server-side details stay on the server; officers get a plain sentence. */
function logFailure(operation: string, error: unknown): void {
  console.error(`[admin/events] ${operation} failed`, error)
}

type EventDocumentFields = {
  title: string
  slug: { _type: 'slug'; current: string }
  status: EventInput['status']
  eventType: EventInput['eventType']
  startsAt: string
  endsAt?: string
  location: {
    _type: 'eventLocation'
    locationType: EventInput['locationType']
    place?: string
    onlineUrl?: string
    directions?: string
  }
  summary: string
  experienceLevel: EventInput['experienceLevel']
  noExperienceRequired: boolean
  prerequisites?: string[]
  topics?: string[]
  registrationUrl?: string
  communityUrl?: string
  recap?: string
  featured: boolean
  presenters?: Array<{ _key: string; _type: 'reference'; _ref: string }>
}

/**
 * Maps validated input onto the Sanity event schema.
 *
 * Only the fields the admin form manages appear here. Rich text (description,
 * setup instructions), SEO and related resources are Studio-only for now, and
 * `updateEvent` patches rather than replaces so those survive an admin edit.
 */
function toEventFields(input: EventInput, slug: string): EventDocumentFields {
  return {
    title: input.title,
    slug: { _type: 'slug', current: slug },
    status: input.status,
    eventType: input.eventType,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    location: {
      _type: 'eventLocation',
      locationType: input.locationType,
      place: input.place,
      onlineUrl: input.onlineUrl,
      directions: input.directions,
    },
    summary: input.summary,
    experienceLevel: input.experienceLevel,
    noExperienceRequired: input.noExperienceRequired,
    prerequisites: input.prerequisites.length ? input.prerequisites : undefined,
    topics: input.topics.length ? input.topics : undefined,
    registrationUrl: input.registrationUrl,
    communityUrl: input.communityUrl,
    recap: input.recap,
    featured: input.featured,
    presenters: input.presenters.length
      ? input.presenters.map((id) => ({
          // Document ids are unique within the array, so they make stable keys.
          _key: id.replace(/[^A-Za-z0-9]/g, ''),
          _type: 'reference' as const,
          _ref: id,
        }))
      : undefined,
  }
}

/**
 * Confirms every selected presenter exists.
 *
 * Sanity rejects a strong reference to a missing document with an error we do
 * not want to show an officer, so this turns it into a field message instead.
 */
async function unknownPresenters(ids: string[]): Promise<boolean> {
  if (ids.length === 0) return false

  const found = await getAdminClient().fetch<string[]>(
    /* groq */ `*[_type == "person" && _id in $ids]._id`,
    { ids },
  )

  return found.length !== ids.length
}

/** Resolves the slug to store: the officer's override, or one from the title. */
async function resolveSlug(input: EventInput, excludeId: string): Promise<string> {
  const desired = slugify(input.slug ?? input.title)
  const taken = await getAdminClient().fetch(EVENT_SLUGS_IN_USE_QUERY, { excludeId })

  return uniqueSlug(desired, taken.filter((slug): slug is string => typeof slug === 'string'))
}

export async function createEvent(
  _previous: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  await requireOfficer({ capability: 'content:write' })

  const parsed = parseEventForm(formData)
  if (!parsed.success) {
    return invalid(formData, fieldErrorsFrom(parsed.error))
  }

  try {
    if (await unknownPresenters(parsed.data.presenters)) {
      return invalid(formData, { presenters: 'One of the selected presenters no longer exists.' })
    }

    const slug = await resolveSlug(parsed.data, '')

    await getWriteClient().create({
      _type: 'event',
      ...toEventFields(parsed.data, slug),
    })
  } catch (error) {
    logFailure('createEvent', error)
    return {
      status: 'error',
      message: 'The event could not be saved. Nothing was changed — please try again.',
      values: submittedValues(formData),
    }
  }

  revalidateEventContent()
  // Outside the try: redirect works by throwing a control-flow signal.
  redirect(`/admin/events?saved=created&title=${encodeURIComponent(parsed.data.title)}`)
}

export async function updateEvent(
  _previous: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  await requireOfficer({ capability: 'content:write' })

  const id = String(formData.get('id') ?? '')
  if (!id) {
    return { status: 'error', message: 'This event could not be identified. Reload and try again.' }
  }

  const parsed = parseEventForm(formData)
  if (!parsed.success) {
    return invalid(formData, fieldErrorsFrom(parsed.error))
  }

  try {
    if (await unknownPresenters(parsed.data.presenters)) {
      return invalid(formData, { presenters: 'One of the selected presenters no longer exists.' })
    }

    const slug = await resolveSlug(parsed.data, id)
    const fields = toEventFields(parsed.data, slug)

    // Split into set/unset so clearing an optional field actually removes it
    // rather than storing an empty value — and so fields this form does not
    // manage (rich text, SEO, related resources) are left untouched.
    const set: Record<string, unknown> = {}
    const unset: string[] = []

    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined) unset.push(key)
      else set[key] = value
    }

    const patch = getWriteClient().patch(id).set(set)

    await (unset.length ? patch.unset(unset) : patch).commit()
  } catch (error) {
    logFailure('updateEvent', error)
    return {
      status: 'error',
      message: 'The changes could not be saved. Nothing was changed — please try again.',
      values: submittedValues(formData),
    }
  }

  revalidateEventContent()
  redirect(`/admin/events?saved=updated&title=${encodeURIComponent(parsed.data.title)}`)
}

/**
 * The safe removal action: keeps the record, drops it out of upcoming views.
 *
 * This is what the admin offers by default — see `@/lib/events/delete-policy`.
 */
export async function cancelEvent(
  _previous: EventActionResult | null,
  formData: FormData,
): Promise<EventActionResult | null> {
  await requireOfficer({ capability: 'content:write' })

  const id = String(formData.get('id') ?? '')
  if (!id) return { status: 'error', message: 'This event could not be identified.' }

  try {
    await getWriteClient().patch(id).set({ status: 'cancelled' }).commit()
  } catch (error) {
    logFailure('cancelEvent', error)
    return { status: 'error', message: 'The event could not be cancelled. Please try again.' }
  }

  revalidateEventContent()
  redirect('/admin/events?saved=cancelled')
}

/**
 * Permanent deletion, allowed only where the policy says it is safe.
 *
 * The policy is re-evaluated here against fresh data — the confirmation screen
 * that led here proves nothing, since this action can be POSTed directly.
 */
export async function deleteEvent(
  _previous: EventActionResult | null,
  formData: FormData,
): Promise<EventActionResult | null> {
  await requireOfficer({ capability: 'content:write' })

  const id = String(formData.get('id') ?? '')
  if (!id) return { status: 'error', message: 'This event could not be identified.' }

  try {
    const event = await getAdminClient().fetch<{
      status?: string
      startsAt?: string
      referenceCount: number
    } | null>(
      /* groq */ `*[_type == "event" && _id == $id][0]{
        status, startsAt, "referenceCount": count(*[references(^._id)])
      }`,
      { id },
    )

    if (!event) {
      return { status: 'error', message: 'That event no longer exists.' }
    }

    const policy = eventRemovalPolicy({
      status: event.status,
      startsAt: event.startsAt,
      referenceCount: event.referenceCount,
    })

    if (!policy.canHardDelete) {
      return {
        status: 'error',
        message: policy.blockedReason ?? 'This event cannot be deleted here.',
      }
    }

    await getWriteClient().delete(id)
  } catch (error) {
    logFailure('deleteEvent', error)
    return {
      status: 'error',
      // The most likely cause is a reference added between the check and the
      // delete; Sanity refuses that, and saying so is more useful than "error".
      message:
        'The event could not be deleted. Another document may now link to it — cancel it instead.',
    }
  }

  revalidateEventContent()
  redirect('/admin/events?saved=deleted')
}
