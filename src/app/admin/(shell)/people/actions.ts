'use server'

import { redirect } from 'next/navigation'

import { requireOfficer } from '@/auth/require-officer'
import { checkUpload } from '@/lib/admin/assets'
import { fieldErrorsFrom } from '@/lib/admin/fields'
import type { AdminActionResult, AdminFormState } from '@/lib/admin/form-state'
import { slugify, uniqueSlug } from '@/lib/admin/slug'
import { personRemovalPolicy } from '@/lib/people/delete-policy'
import {
  OFFICER_TERM_FORM_FIELDS,
  PERSON_FORM_FIELDS,
  parseOfficerTermForm,
  parsePersonForm,
  type OfficerTermInput,
  type PersonInput,
} from '@/lib/people/input-schema'
import { revalidatePeopleContent } from '@/lib/revalidate'
import { getAdminClient } from '@/sanity/lib/admin-client'
import { getWriteClient } from '@/sanity/lib/write-client'
import { ADMIN_PERSON_USAGE_QUERY, PERSON_SLUGS_IN_USE_QUERY } from '@/sanity/queries/admin'

/**
 * People and officer-term mutations.
 *
 * Two document types in one module because they are one workflow: an officer
 * term needs a person, and adding this year's board is the most common reason
 * anyone creates a person at all.
 *
 * The capability split is deliberate. Editing a person is ordinary content work
 * (`content:write`) — anybody maintaining a project's credits does it. Deciding
 * *who the club says its leadership is*, and for which year, is
 * `officers:manage`, because getting it wrong misrepresents the club and
 * because the historical record is what a future president inherits.
 *
 * None of this touches Clerk. A `person` is a public website record and an
 * `officerRole` is public club history; neither grants or removes access to
 * `/admin`, which Clerk alone decides. See the README.
 */

function submittedValues(
  formData: FormData,
  fields: readonly string[],
): Record<string, string | string[]> {
  const values: Record<string, string | string[]> = {}
  for (const field of fields) values[field] = String(formData.get(field) ?? '')
  return values
}

function invalid(
  formData: FormData,
  fields: readonly string[],
  fieldErrors: Record<string, string>,
  message = 'Check the highlighted fields and try again.',
): AdminFormState {
  return { status: 'error', message, fieldErrors, values: submittedValues(formData, fields) }
}

function logFailure(operation: string, error: unknown): void {
  console.error(`[admin/people] ${operation} failed`, error)
}

type PersonDocumentFields = {
  name: string
  slug: { _type: 'slug'; current: string }
  shortBio?: string
  email?: string
  githubUrl?: string
  linkedinUrl?: string
  websiteUrl?: string
}

/** Maps validated input onto the Sanity person schema. `photo` is separate. */
function toPersonFields(input: PersonInput, slug: string): PersonDocumentFields {
  return {
    name: input.name,
    slug: { _type: 'slug', current: slug },
    shortBio: input.shortBio,
    email: input.email,
    githubUrl: input.githubUrl,
    linkedinUrl: input.linkedinUrl,
    websiteUrl: input.websiteUrl,
  }
}

async function resolveSlug(input: PersonInput, excludeId: string): Promise<string> {
  const desired = slugify(input.slug ?? input.name)
  const taken = await getAdminClient().fetch(PERSON_SLUGS_IN_USE_QUERY, { excludeId })

  return uniqueSlug(desired, taken.filter((slug): slug is string => typeof slug === 'string'))
}

type PhotoValue = {
  _type: 'image'
  asset: { _type: 'reference'; _ref: string }
  alt?: string
}

/**
 * Uploads a chosen photo and returns the field value to store.
 *
 * Bytes travel inside the Server Action's multipart body and are handed to
 * Sanity's asset API with the server-only write token; the browser never holds
 * a credential. Type and size are checked first — see `@/lib/admin/assets`.
 */
async function uploadPhoto(
  formData: FormData,
  alt: string | undefined,
): Promise<{ photo: PhotoValue } | { error: string } | null> {
  const file = formData.get('photo')
  if (!(file instanceof File)) return null

  const check = checkUpload(file, 'image')
  if (check.outcome === 'empty') return null
  if (check.outcome === 'rejected') return { error: check.message }

  const asset = await getWriteClient().assets.upload('image', file, {
    filename: check.filename,
    contentType: check.contentType,
  })

  return { photo: { _type: 'image', asset: { _type: 'reference', _ref: asset._id }, alt } }
}

export async function createPerson(
  _previous: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireOfficer({ capability: 'content:write' })

  const parsed = parsePersonForm(formData)
  if (!parsed.success) {
    return invalid(formData, PERSON_FORM_FIELDS, fieldErrorsFrom(parsed.error))
  }

  try {
    const upload = await uploadPhoto(formData, parsed.data.photoAlt)
    if (upload && 'error' in upload) {
      return invalid(formData, PERSON_FORM_FIELDS, { photo: upload.error })
    }

    const slug = await resolveSlug(parsed.data, '')

    await getWriteClient().create({
      _type: 'person',
      ...toPersonFields(parsed.data, slug),
      ...(upload ? { photo: upload.photo } : {}),
    })
  } catch (error) {
    logFailure('createPerson', error)
    return {
      status: 'error',
      message: 'This person could not be saved. Nothing was changed — please try again.',
      values: submittedValues(formData, PERSON_FORM_FIELDS),
    }
  }

  revalidatePeopleContent()
  // Outside the try: redirect works by throwing a control-flow signal.
  redirect(`/admin/people?saved=created&title=${encodeURIComponent(parsed.data.name)}`)
}

export async function updatePerson(
  _previous: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireOfficer({ capability: 'content:write' })

  const id = String(formData.get('id') ?? '')
  if (!id) {
    return { status: 'error', message: 'This person could not be identified. Reload and try again.' }
  }

  const parsed = parsePersonForm(formData)
  if (!parsed.success) {
    return invalid(formData, PERSON_FORM_FIELDS, fieldErrorsFrom(parsed.error))
  }

  try {
    const existing = await getAdminClient().fetch<{ hasPhoto: boolean } | null>(
      /* groq */ `*[_type == "person" && _id == $id][0]{ "hasPhoto": defined(photo.asset) }`,
      { id },
    )
    if (!existing) {
      return { status: 'error', message: 'That person no longer exists.' }
    }

    const upload = await uploadPhoto(formData, parsed.data.photoAlt)
    if (upload && 'error' in upload) {
      return invalid(formData, PERSON_FORM_FIELDS, { photo: upload.error })
    }

    const slug = await resolveSlug(parsed.data, id)
    const fields = toPersonFields(parsed.data, slug)

    // Split into set/unset so clearing an optional field removes it rather than
    // storing an empty value.
    const set: Record<string, unknown> = {}
    const unset: string[] = []

    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined) unset.push(key)
      else set[key] = value
    }

    // Replace, remove, or leave alone — three distinct intentions.
    if (upload) {
      set.photo = upload.photo
    } else if (parsed.data.removePhoto) {
      unset.push('photo')
    } else if (existing.hasPhoto) {
      if (parsed.data.photoAlt) set['photo.alt'] = parsed.data.photoAlt
      else unset.push('photo.alt')
    }

    const patch = getWriteClient().patch(id).set(set)

    await (unset.length ? patch.unset(unset) : patch).commit()
  } catch (error) {
    logFailure('updatePerson', error)
    return {
      status: 'error',
      message: 'The changes could not be saved. Nothing was changed — please try again.',
      values: submittedValues(formData, PERSON_FORM_FIELDS),
    }
  }

  revalidatePeopleContent()
  redirect(`/admin/people?saved=updated&title=${encodeURIComponent(parsed.data.name)}`)
}

/**
 * Permanent deletion, allowed only where the person is credited nowhere.
 *
 * The usage check is re-run here against fresh Sanity data, because this action
 * can be POSTed directly and because a credit may have been added since the
 * confirmation screen rendered.
 */
export async function deletePerson(
  _previous: AdminActionResult | null,
  formData: FormData,
): Promise<AdminActionResult | null> {
  await requireOfficer({ capability: 'content:write' })

  const id = String(formData.get('id') ?? '')
  if (!id) return { status: 'error', message: 'This person could not be identified.' }

  try {
    const usage = await getAdminClient().fetch(ADMIN_PERSON_USAGE_QUERY, { id })

    if (!usage) {
      return { status: 'error', message: 'That person no longer exists.' }
    }

    const policy = personRemovalPolicy(usage)

    if (!policy.canHardDelete) {
      return {
        status: 'error',
        message: policy.blockedReason ?? 'This person cannot be deleted here.',
      }
    }

    await getWriteClient().delete(id)
  } catch (error) {
    logFailure('deletePerson', error)
    return {
      status: 'error',
      message:
        'This person could not be deleted. Something may now credit them — remove that credit first.',
    }
  }

  revalidatePeopleContent()
  redirect('/admin/people?saved=deleted')
}

type OfficerTermDocumentFields = {
  person: { _type: 'reference'; _ref: string }
  position: string
  term: string
  isCurrent: boolean
  displayOrder: number
}

function toOfficerTermFields(input: OfficerTermInput): OfficerTermDocumentFields {
  return {
    person: { _type: 'reference', _ref: input.person },
    position: input.position,
    term: input.term,
    isCurrent: input.isCurrent,
    displayOrder: input.displayOrder,
  }
}

/** Confirms the selected person exists before a strong reference is written. */
async function personExists(id: string): Promise<boolean> {
  const found = await getAdminClient().fetch<string | null>(
    /* groq */ `*[_type == "person" && _id == $id][0]._id`,
    { id },
  )
  return found !== null
}

export async function createOfficerTerm(
  _previous: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireOfficer({ capability: 'officers:manage' })

  const parsed = parseOfficerTermForm(formData)
  if (!parsed.success) {
    return invalid(formData, OFFICER_TERM_FORM_FIELDS, fieldErrorsFrom(parsed.error))
  }

  try {
    if (!(await personExists(parsed.data.person))) {
      return invalid(formData, OFFICER_TERM_FORM_FIELDS, {
        person: 'That person no longer exists. Add them under People first.',
      })
    }

    await getWriteClient().create({
      _type: 'officerRole',
      ...toOfficerTermFields(parsed.data),
    })
  } catch (error) {
    logFailure('createOfficerTerm', error)
    return {
      status: 'error',
      message: 'The officer term could not be saved. Nothing was changed — please try again.',
      values: submittedValues(formData, OFFICER_TERM_FORM_FIELDS),
    }
  }

  revalidatePeopleContent()
  redirect(`/admin/people/officers?saved=created&title=${encodeURIComponent(parsed.data.position)}`)
}

export async function updateOfficerTerm(
  _previous: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireOfficer({ capability: 'officers:manage' })

  const id = String(formData.get('id') ?? '')
  if (!id) {
    return { status: 'error', message: 'This term could not be identified. Reload and try again.' }
  }

  const parsed = parseOfficerTermForm(formData)
  if (!parsed.success) {
    return invalid(formData, OFFICER_TERM_FORM_FIELDS, fieldErrorsFrom(parsed.error))
  }

  try {
    if (!(await personExists(parsed.data.person))) {
      return invalid(formData, OFFICER_TERM_FORM_FIELDS, {
        person: 'That person no longer exists. Add them under People first.',
      })
    }

    // Every field of this document is managed here, so a plain set is a
    // complete and honest patch — there is nothing Studio-only to preserve.
    await getWriteClient().patch(id).set(toOfficerTermFields(parsed.data)).commit()
  } catch (error) {
    logFailure('updateOfficerTerm', error)
    return {
      status: 'error',
      message: 'The changes could not be saved. Nothing was changed — please try again.',
      values: submittedValues(formData, OFFICER_TERM_FORM_FIELDS),
    }
  }

  revalidatePeopleContent()
  redirect(`/admin/people/officers?saved=updated&title=${encodeURIComponent(parsed.data.position)}`)
}

/**
 * Ends a term without deleting it.
 *
 * This is the action a leadership handover actually needs: last year's board
 * stops being "current" and becomes history, and nobody's person record is
 * touched. It is the safe counterpart to `deleteOfficerTerm`, which exists only
 * for terms entered by mistake.
 */
export async function endOfficerTerm(
  _previous: AdminActionResult | null,
  formData: FormData,
): Promise<AdminActionResult | null> {
  await requireOfficer({ capability: 'officers:manage' })

  const id = String(formData.get('id') ?? '')
  if (!id) return { status: 'error', message: 'This term could not be identified.' }

  try {
    await getWriteClient().patch(id).set({ isCurrent: false }).commit()
  } catch (error) {
    logFailure('endOfficerTerm', error)
    return { status: 'error', message: 'The term could not be ended. Please try again.' }
  }

  revalidatePeopleContent()
  redirect('/admin/people/officers?saved=ended')
}

/** Permanent deletion of a term, for one entered by mistake. */
export async function deleteOfficerTerm(
  _previous: AdminActionResult | null,
  formData: FormData,
): Promise<AdminActionResult | null> {
  await requireOfficer({ capability: 'officers:manage' })

  const id = String(formData.get('id') ?? '')
  if (!id) return { status: 'error', message: 'This term could not be identified.' }

  try {
    const exists = await getAdminClient().fetch<string | null>(
      /* groq */ `*[_type == "officerRole" && _id == $id][0]._id`,
      { id },
    )

    if (!exists) {
      return { status: 'error', message: 'That term no longer exists.' }
    }

    await getWriteClient().delete(id)
  } catch (error) {
    logFailure('deleteOfficerTerm', error)
    return { status: 'error', message: 'The term could not be deleted. Please try again.' }
  }

  revalidatePeopleContent()
  redirect('/admin/people/officers?saved=deleted')
}
