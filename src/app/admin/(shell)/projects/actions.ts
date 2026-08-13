'use server'

import { redirect } from 'next/navigation'

import { requireOfficer } from '@/auth/require-officer'
import { checkUpload } from '@/lib/admin/assets'
import { fieldErrorsFrom, rowErrorsFrom } from '@/lib/admin/fields'
import type { AdminActionResult, AdminFormState } from '@/lib/admin/form-state'
import { missingReferences, toReference, toReferenceArray } from '@/lib/admin/references'
import { rowKey } from '@/lib/admin/rows'
import { slugify, uniqueSlug } from '@/lib/admin/slug'
import { hasProjectWork, projectRemovalPolicy } from '@/lib/projects/delete-policy'
import {
  OPEN_ROLE_FIELDS,
  PROJECT_FORM_FIELDS,
  parseProjectForm,
  type ProjectInput,
} from '@/lib/projects/input-schema'
import { revalidateProjectContent } from '@/lib/revalidate'
import { getAdminClient } from '@/sanity/lib/admin-client'
import { getWriteClient } from '@/sanity/lib/write-client'
import { PROJECT_SLUGS_IN_USE_QUERY } from '@/sanity/queries/admin'

/**
 * Project mutations.
 *
 * Every action in this file follows the same five steps, in the same order:
 *
 *   1. `requireOfficer({ capability: 'content:write' })` — independently. A
 *      Server Action is its own entry point, reachable by a direct POST, so the
 *      layout's check does not cover it.
 *   2. Zod validation of the raw input (`@/lib/projects/input-schema`).
 *   3. The mutation through `getWriteClient()`, which is `server-only`.
 *   4. Revalidation of everything the change affects.
 *   5. Redirect or a typed result — never a raw Sanity error.
 *
 * These are deliberately domain-specific, matching the events module. A generic
 * `mutateDocument(type, data)` would make the authorization and validation of
 * each document type impossible to review, which is exactly the property we
 * want to keep.
 */

/** Echoes the raw submission back to the form after a rejected save. */
function submittedValues(formData: FormData): Record<string, string | string[]> {
  const values: Record<string, string | string[]> = {}

  for (const field of PROJECT_FORM_FIELDS) {
    values[field] = String(formData.get(field) ?? '')
  }
  values.mentors = formData.getAll('mentors').map(String)
  values.contributors = formData.getAll('contributors').map(String)

  // The open-role rows, so a validation failure elsewhere does not empty them.
  for (const name of Object.values(OPEN_ROLE_FIELDS)) {
    values[name] = formData.getAll(name).map(String)
  }

  return values
}

function invalid(
  formData: FormData,
  fieldErrors: Record<string, string>,
  message = 'Check the highlighted fields and try again.',
): AdminFormState {
  return { status: 'error', message, fieldErrors, values: submittedValues(formData) }
}

/** Server-side details stay on the server; officers get a plain sentence. */
function logFailure(operation: string, error: unknown): void {
  console.error(`[admin/projects] ${operation} failed`, error)
}

type CoverImage = {
  _type: 'image'
  asset: { _type: 'reference'; _ref: string }
  alt?: string
}

type ProjectDocumentFields = {
  name: string
  slug: { _type: 'slug'; current: string }
  status: ProjectInput['status']
  shortDescription: string
  experienceLevel: ProjectInput['experienceLevel']
  noExperienceRequired: boolean
  techStack?: string[]
  learningOutcomes?: string[]
  lead?: { _type: 'reference'; _ref: string }
  mentors?: Array<{ _key: string; _type: 'reference'; _ref: string }>
  contributors?: Array<{ _key: string; _type: 'reference'; _ref: string }>
  openRoles?: Array<{
    _key: string
    _type: 'openRole'
    title: string
    description?: string
    experienceLevel: string
    learningOutcome?: string
  }>
  githubUrl?: string
  demoUrl?: string
  discussionUrl?: string
  currentFocus?: string
  latestMilestone?: string
  startedAt?: string
  completedAt?: string
  featured: boolean
}

/**
 * Maps validated input onto the Sanity project schema.
 *
 * Only the fields the admin form manages appear here. The rich-text
 * description, the screenshot gallery and SEO are Studio-only, and
 * `updateProject` patches rather than replaces so those survive an admin edit.
 * `coverImage` is handled separately, because it depends on what is already
 * stored.
 */
function toProjectFields(input: ProjectInput, slug: string): ProjectDocumentFields {
  return {
    name: input.name,
    slug: { _type: 'slug', current: slug },
    status: input.status,
    shortDescription: input.shortDescription,
    experienceLevel: input.experienceLevel,
    noExperienceRequired: input.noExperienceRequired,
    techStack: input.techStack.length ? input.techStack : undefined,
    learningOutcomes: input.learningOutcomes.length ? input.learningOutcomes : undefined,
    lead: toReference(input.lead),
    mentors: toReferenceArray(input.mentors),
    contributors: toReferenceArray(input.contributors),
    openRoles: input.openRoles.length
      ? input.openRoles.map((role, index) => ({
          _key: rowKey('role', index),
          _type: 'openRole' as const,
          title: role.title,
          description: role.description,
          experienceLevel: role.experienceLevel,
          learningOutcome: role.learningOutcome,
        }))
      : undefined,
    githubUrl: input.githubUrl,
    demoUrl: input.demoUrl,
    discussionUrl: input.discussionUrl,
    currentFocus: input.currentFocus,
    latestMilestone: input.latestMilestone,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    featured: input.featured,
  }
}

/**
 * Confirms every selected person exists.
 *
 * Sanity rejects a strong reference to a missing document with an error we do
 * not want to show an officer, so this turns it into a field message instead —
 * and it covers the case where somebody deletes a person while a form is open.
 */
async function unknownPeople(input: ProjectInput): Promise<Record<string, string> | null> {
  const selected = [input.lead, ...input.mentors, ...input.contributors].filter(
    (id): id is string => Boolean(id),
  )
  if (selected.length === 0) return null

  const existing = await getAdminClient().fetch<string[]>(
    /* groq */ `*[_type == "person" && _id in $ids]._id`,
    { ids: selected },
  )
  const missing = new Set(missingReferences(selected, existing))
  if (missing.size === 0) return null

  const errors: Record<string, string> = {}
  if (input.lead && missing.has(input.lead)) errors.lead = 'That person no longer exists.'
  if (input.mentors.some((id) => missing.has(id))) {
    errors.mentors = 'One of the selected mentors no longer exists.'
  }
  if (input.contributors.some((id) => missing.has(id))) {
    errors.contributors = 'One of the selected contributors no longer exists.'
  }

  return Object.keys(errors).length ? errors : null
}

/** Resolves the slug to store: the officer's override, or one from the name. */
async function resolveSlug(input: ProjectInput, excludeId: string): Promise<string> {
  const desired = slugify(input.slug ?? input.name)
  const taken = await getAdminClient().fetch(PROJECT_SLUGS_IN_USE_QUERY, { excludeId })

  return uniqueSlug(desired, taken.filter((slug): slug is string => typeof slug === 'string'))
}

/**
 * Uploads a chosen cover image and returns the field value to store.
 *
 * The bytes travel inside the Server Action's multipart body and are handed to
 * Sanity's asset API with the server-only write token; the browser never sees a
 * credential and there is no upload endpoint of our own to leave open.
 */
async function uploadCoverImage(
  formData: FormData,
  alt: string | undefined,
): Promise<{ image: CoverImage } | { error: string } | null> {
  const file = formData.get('coverImage')
  if (!(file instanceof File)) return null

  const check = checkUpload(file, 'image')
  if (check.outcome === 'empty') return null
  if (check.outcome === 'rejected') return { error: check.message }

  const asset = await getWriteClient().assets.upload('image', file, {
    filename: check.filename,
    contentType: check.contentType,
  })

  return {
    image: {
      _type: 'image',
      asset: { _type: 'reference', _ref: asset._id },
      alt,
    },
  }
}

export async function createProject(
  _previous: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireOfficer({ capability: 'content:write' })

  const parsed = parseProjectForm(formData)
  if (!parsed.success) {
    return invalid(formData, {
      ...fieldErrorsFrom(parsed.error),
      ...rowErrorsFrom(parsed.error, 'openRoles'),
    })
  }

  try {
    const peopleErrors = await unknownPeople(parsed.data)
    if (peopleErrors) return invalid(formData, peopleErrors)

    const upload = await uploadCoverImage(formData, parsed.data.coverImageAlt)
    if (upload && 'error' in upload) return invalid(formData, { coverImage: upload.error })

    const slug = await resolveSlug(parsed.data, '')

    await getWriteClient().create({
      _type: 'project',
      ...toProjectFields(parsed.data, slug),
      ...(upload ? { coverImage: upload.image } : {}),
    })
  } catch (error) {
    logFailure('createProject', error)
    return {
      status: 'error',
      message: 'The project could not be saved. Nothing was changed — please try again.',
      values: submittedValues(formData),
    }
  }

  revalidateProjectContent()
  // Outside the try: redirect works by throwing a control-flow signal.
  redirect(`/admin/projects?saved=created&title=${encodeURIComponent(parsed.data.name)}`)
}

export async function updateProject(
  _previous: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireOfficer({ capability: 'content:write' })

  const id = String(formData.get('id') ?? '')
  if (!id) {
    return {
      status: 'error',
      message: 'This project could not be identified. Reload and try again.',
    }
  }

  const parsed = parseProjectForm(formData)
  if (!parsed.success) {
    return invalid(formData, {
      ...fieldErrorsFrom(parsed.error),
      ...rowErrorsFrom(parsed.error, 'openRoles'),
    })
  }

  try {
    const existing = await getAdminClient().fetch<{ hasCoverImage: boolean } | null>(
      /* groq */ `*[_type == "project" && _id == $id][0]{ "hasCoverImage": defined(coverImage.asset) }`,
      { id },
    )
    if (!existing) {
      return { status: 'error', message: 'That project no longer exists.' }
    }

    const peopleErrors = await unknownPeople(parsed.data)
    if (peopleErrors) return invalid(formData, peopleErrors)

    const upload = await uploadCoverImage(formData, parsed.data.coverImageAlt)
    if (upload && 'error' in upload) return invalid(formData, { coverImage: upload.error })

    const slug = await resolveSlug(parsed.data, id)
    const fields = toProjectFields(parsed.data, slug)

    // Split into set/unset so clearing an optional field actually removes it
    // rather than storing an empty value — and so fields this form does not
    // manage (the rich-text description, screenshots, SEO) are left untouched.
    const set: Record<string, unknown> = {}
    const unset: string[] = []

    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined) unset.push(key)
      else set[key] = value
    }

    // The image is three separate intentions, and conflating them is how an
    // admin form quietly destroys an asset nobody meant to touch.
    if (upload) {
      set.coverImage = upload.image
    } else if (parsed.data.removeCoverImage) {
      unset.push('coverImage')
    } else if (existing.hasCoverImage) {
      // Keep the stored asset, update only the alt text beside it.
      if (parsed.data.coverImageAlt) set['coverImage.alt'] = parsed.data.coverImageAlt
      else unset.push('coverImage.alt')
    }

    const patch = getWriteClient().patch(id).set(set)

    await (unset.length ? patch.unset(unset) : patch).commit()
  } catch (error) {
    logFailure('updateProject', error)
    return {
      status: 'error',
      message: 'The changes could not be saved. Nothing was changed — please try again.',
      values: submittedValues(formData),
    }
  }

  revalidateProjectContent()
  redirect(`/admin/projects?saved=updated&title=${encodeURIComponent(parsed.data.name)}`)
}

/**
 * The safe removal action: keeps the record, sinks it out of the active views.
 *
 * This is what the admin offers by default — see `@/lib/projects/delete-policy`.
 */
export async function archiveProject(
  _previous: AdminActionResult | null,
  formData: FormData,
): Promise<AdminActionResult | null> {
  await requireOfficer({ capability: 'content:write' })

  const id = String(formData.get('id') ?? '')
  if (!id) return { status: 'error', message: 'This project could not be identified.' }

  try {
    await getWriteClient().patch(id).set({ status: 'archived' }).commit()
  } catch (error) {
    logFailure('archiveProject', error)
    return { status: 'error', message: 'The project could not be archived. Please try again.' }
  }

  revalidateProjectContent()
  redirect('/admin/projects?saved=archived')
}

/**
 * Permanent deletion, allowed only where the policy says it is safe.
 *
 * The policy is re-evaluated here against fresh Sanity data — the confirmation
 * screen that led here proves nothing, since this action can be POSTed directly
 * and the project may have changed since that screen rendered.
 */
export async function deleteProject(
  _previous: AdminActionResult | null,
  formData: FormData,
): Promise<AdminActionResult | null> {
  await requireOfficer({ capability: 'content:write' })

  const id = String(formData.get('id') ?? '')
  if (!id) return { status: 'error', message: 'This project could not be identified.' }

  try {
    const project = await getAdminClient().fetch<{
      status?: string
      githubUrl?: string
      demoUrl?: string
      completedAt?: string
      referenceCount: number
    } | null>(
      /* groq */ `*[_type == "project" && _id == $id][0]{
        status, githubUrl, demoUrl, completedAt,
        "referenceCount": count(*[references(^._id)])
      }`,
      { id },
    )

    if (!project) {
      return { status: 'error', message: 'That project no longer exists.' }
    }

    const policy = projectRemovalPolicy({
      status: project.status,
      referenceCount: project.referenceCount,
      hasWork: hasProjectWork(project),
    })

    if (!policy.canHardDelete) {
      return {
        status: 'error',
        message: policy.blockedReason ?? 'This project cannot be deleted here.',
      }
    }

    await getWriteClient().delete(id)
  } catch (error) {
    logFailure('deleteProject', error)
    return {
      status: 'error',
      // The most likely cause is a reference added between the check and the
      // delete; Sanity refuses that, and saying so is more useful than "error".
      message:
        'The project could not be deleted. Another document may now link to it — archive it instead.',
    }
  }

  revalidateProjectContent()
  redirect('/admin/projects?saved=deleted')
}
