'use server'

import { redirect } from 'next/navigation'

import { requireOfficer } from '@/auth/require-officer'
import { checkUpload } from '@/lib/admin/assets'
import { fieldErrorsFrom } from '@/lib/admin/fields'
import type { AdminActionResult, AdminFormState } from '@/lib/admin/form-state'
import { missingReferences, toReference, toReferenceArray } from '@/lib/admin/references'
import { slugify, uniqueSlug } from '@/lib/admin/slug'
import { resourceRemovalPolicy } from '@/lib/resources/delete-policy'
import {
  RESOURCE_FORM_FIELDS,
  parseResourceForm,
  type ResourceInput,
} from '@/lib/resources/input-schema'
import { revalidateResourceContent } from '@/lib/revalidate'
import { getAdminClient } from '@/sanity/lib/admin-client'
import { getWriteClient } from '@/sanity/lib/write-client'
import { RESOURCE_SLUGS_IN_USE_QUERY } from '@/sanity/queries/admin'

/**
 * Resource mutations.
 *
 * Same five steps as every other admin module: authorize independently, Zod,
 * server-only write client, revalidate, typed result.
 *
 * The one thing specific to resources is the **upload**. Bytes travel inside
 * the Server Action's multipart body and are handed to Sanity's asset API with
 * the write token, which never leaves the server; there is no signed-URL step
 * and no upload endpoint of our own that could be reached without a session.
 * Size and type are checked before anything is transferred to Sanity — see
 * `@/lib/admin/assets` — and `serverActions.bodySizeLimit` in `next.config.ts`
 * is the outer bound the framework enforces before this code runs at all.
 */

/** Echoes the raw submission back to the form after a rejected save. */
function submittedValues(formData: FormData): Record<string, string | string[]> {
  const values: Record<string, string | string[]> = {}

  for (const field of RESOURCE_FORM_FIELDS) {
    values[field] = String(formData.get(field) ?? '')
  }
  values.relatedResources = formData.getAll('relatedResources').map(String)

  return values
}

function invalid(
  formData: FormData,
  fieldErrors: Record<string, string>,
  message = 'Check the highlighted fields and try again.',
): AdminFormState {
  return { status: 'error', message, fieldErrors, values: submittedValues(formData) }
}

function logFailure(operation: string, error: unknown): void {
  console.error(`[admin/resources] ${operation} failed`, error)
}

type ResourceDocumentFields = {
  title: string
  slug: { _type: 'slug'; current: string }
  resourceType: ResourceInput['resourceType']
  description: string
  topics?: string[]
  experienceLevel: ResourceInput['experienceLevel']
  featured: boolean
  externalUrl?: string
  githubUrl?: string
  author?: { _type: 'reference'; _ref: string }
  event?: { _type: 'reference'; _ref: string }
  relatedResources?: Array<{ _key: string; _type: 'reference'; _ref: string }>
  publishedAt: string
  updatedAt?: string
}

/**
 * Maps validated input onto the Sanity resource schema.
 *
 * `file` is absent on purpose: it depends on what is already stored, so the
 * actions set or unset it explicitly rather than letting a mapped `undefined`
 * quietly detach an asset.
 */
function toResourceFields(input: ResourceInput, slug: string): ResourceDocumentFields {
  return {
    title: input.title,
    slug: { _type: 'slug', current: slug },
    resourceType: input.resourceType,
    description: input.description,
    topics: input.topics.length ? input.topics : undefined,
    experienceLevel: input.experienceLevel,
    featured: input.featured,
    externalUrl: input.externalUrl,
    githubUrl: input.githubUrl,
    author: toReference(input.author),
    event: toReference(input.event),
    relatedResources: toReferenceArray(input.relatedResources),
    publishedAt: input.publishedAt,
    updatedAt: input.updatedAt,
  }
}

/** Confirms the selected author, event and related resources all still exist. */
async function unknownReferences(
  input: ResourceInput,
  selfId: string,
): Promise<Record<string, string> | null> {
  const errors: Record<string, string> = {}
  const sanity = getAdminClient()

  const ids = [input.author, input.event, ...input.relatedResources].filter(
    (id): id is string => Boolean(id),
  )
  if (ids.length === 0) return null

  const existing = await sanity.fetch<string[]>(/* groq */ `*[_id in $ids]._id`, { ids })
  const missing = new Set(missingReferences(ids, existing))

  if (input.author && missing.has(input.author)) errors.author = 'That person no longer exists.'
  if (input.event && missing.has(input.event)) errors.event = 'That event no longer exists.'
  if (input.relatedResources.some((id) => missing.has(id))) {
    errors.relatedResources = 'One of the selected resources no longer exists.'
  }
  // A resource listing itself as related is a loop with no meaning.
  if (selfId && input.relatedResources.includes(selfId)) {
    errors.relatedResources = 'A resource cannot be related to itself.'
  }

  return Object.keys(errors).length ? errors : null
}

async function resolveSlug(input: ResourceInput, excludeId: string): Promise<string> {
  const desired = slugify(input.slug ?? input.title)
  const taken = await getAdminClient().fetch(RESOURCE_SLUGS_IN_USE_QUERY, { excludeId })

  return uniqueSlug(desired, taken.filter((slug): slug is string => typeof slug === 'string'))
}

type FileValue = { _type: 'file'; asset: { _type: 'reference'; _ref: string } }

/** The chosen file, checked but not yet transferred to Sanity. */
function chosenFile(formData: FormData): File | null {
  const file = formData.get('file')
  if (!(file instanceof File)) return null
  return checkUpload(file, 'document').outcome === 'empty' ? null : file
}

/**
 * Validates and uploads the chosen file.
 *
 * Kept separate from `chosenFile` so validation can run *before* the document
 * is written and before a single byte is sent onward: a rejected save must not
 * leave an orphaned asset behind in the Content Lake.
 */
async function uploadFile(file: File): Promise<{ value: FileValue } | { error: string }> {
  const check = checkUpload(file, 'document')
  if (check.outcome === 'empty') return { error: 'That file could not be read. Try again.' }
  if (check.outcome === 'rejected') return { error: check.message }

  const asset = await getWriteClient().assets.upload('file', file, {
    filename: check.filename,
    contentType: check.contentType,
  })

  return { value: { _type: 'file', asset: { _type: 'reference', _ref: asset._id } } }
}

export async function createResource(
  _previous: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireOfficer({ capability: 'content:write' })

  const file = chosenFile(formData)
  // The "does it have somewhere to go?" rule needs to know the outcome of the
  // upload before the upload happens, so it is answered from the submission.
  const parsed = parseResourceForm(formData, file !== null)
  if (!parsed.success) {
    return invalid(formData, fieldErrorsFrom(parsed.error))
  }

  try {
    const referenceErrors = await unknownReferences(parsed.data, '')
    if (referenceErrors) return invalid(formData, referenceErrors)

    let fileValue: FileValue | undefined
    if (file) {
      const upload = await uploadFile(file)
      if ('error' in upload) return invalid(formData, { file: upload.error })
      fileValue = upload.value
    }

    const slug = await resolveSlug(parsed.data, '')

    await getWriteClient().create({
      _type: 'resource',
      ...toResourceFields(parsed.data, slug),
      ...(fileValue ? { file: fileValue } : {}),
    })
  } catch (error) {
    logFailure('createResource', error)
    return {
      status: 'error',
      message: 'The resource could not be saved. Nothing was changed — please try again.',
      values: submittedValues(formData),
    }
  }

  revalidateResourceContent()
  // Outside the try: redirect works by throwing a control-flow signal.
  redirect(`/admin/resources?saved=created&title=${encodeURIComponent(parsed.data.title)}`)
}

export async function updateResource(
  _previous: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireOfficer({ capability: 'content:write' })

  const id = String(formData.get('id') ?? '')
  if (!id) {
    return {
      status: 'error',
      message: 'This resource could not be identified. Reload and try again.',
    }
  }

  const file = chosenFile(formData)
  const removeFile = formData.get('removeFile') === 'on'

  // Read first, so the "somewhere to go" rule is checked against what the
  // document will look like *after* the save rather than what the form alone
  // can see. A failure here is a load failure, not a save failure.
  let existing: { hasFile: boolean } | null
  try {
    existing = await getAdminClient().fetch<{ hasFile: boolean } | null>(
      /* groq */ `*[_type == "resource" && _id == $id][0]{ "hasFile": defined(file.asset) }`,
      { id },
    )
  } catch (error) {
    logFailure('updateResource (load)', error)
    return {
      status: 'error',
      message: 'The resource could not be loaded. Nothing was changed — please try again.',
      values: submittedValues(formData),
    }
  }

  if (!existing) {
    return { status: 'error', message: 'That resource no longer exists.' }
  }

  const parsed = parseResourceForm(formData, file !== null || (existing.hasFile && !removeFile))
  if (!parsed.success) {
    return invalid(formData, fieldErrorsFrom(parsed.error))
  }

  try {
    const referenceErrors = await unknownReferences(parsed.data, id)
    if (referenceErrors) return invalid(formData, referenceErrors)

    let fileValue: FileValue | undefined
    if (file) {
      const upload = await uploadFile(file)
      if ('error' in upload) return invalid(formData, { file: upload.error })
      fileValue = upload.value
    }

    const slug = await resolveSlug(parsed.data, id)
    const fields = toResourceFields(parsed.data, slug)

    // Split into set/unset so clearing an optional field actually removes it —
    // and so fields this form does not manage are left untouched.
    const set: Record<string, unknown> = {}
    const unset: string[] = []

    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined) unset.push(key)
      else set[key] = value
    }

    // Three distinct intentions, never conflated: replace, remove, leave alone.
    if (fileValue) set.file = fileValue
    else if (removeFile) unset.push('file')

    const patch = getWriteClient().patch(id).set(set)

    await (unset.length ? patch.unset(unset) : patch).commit()
  } catch (error) {
    logFailure('updateResource', error)
    return {
      status: 'error',
      message: 'The changes could not be saved. Nothing was changed — please try again.',
      values: submittedValues(formData),
    }
  }

  revalidateResourceContent()
  redirect(`/admin/resources?saved=updated&title=${encodeURIComponent(parsed.data.title)}`)
}

/**
 * Permanent deletion, allowed only where the policy says it is safe.
 *
 * Resources have no archived state — a resource is its content — so this is the
 * only removal action, and the policy in `@/lib/resources/delete-policy` is
 * what keeps it from breaking another document's links. It is re-evaluated here
 * against fresh Sanity data, because this action can be POSTed directly.
 */
export async function deleteResource(
  _previous: AdminActionResult | null,
  formData: FormData,
): Promise<AdminActionResult | null> {
  await requireOfficer({ capability: 'content:write' })

  const id = String(formData.get('id') ?? '')
  if (!id) return { status: 'error', message: 'This resource could not be identified.' }

  try {
    const resource = await getAdminClient().fetch<{
      referenceCount: number
      relatedByCount: number
    } | null>(
      /* groq */ `*[_type == "resource" && _id == $id][0]{
        "referenceCount": count(*[references(^._id)]),
        "relatedByCount": count(*[_type == "resource" && references(^._id)])
      }`,
      { id },
    )

    if (!resource) {
      return { status: 'error', message: 'That resource no longer exists.' }
    }

    const policy = resourceRemovalPolicy(resource)

    if (!policy.canHardDelete) {
      return {
        status: 'error',
        message: policy.blockedReason ?? 'This resource cannot be deleted here.',
      }
    }

    await getWriteClient().delete(id)
  } catch (error) {
    logFailure('deleteResource', error)
    return {
      status: 'error',
      message:
        'The resource could not be deleted. Another document may now link to it — remove that link first.',
    }
  }

  revalidateResourceContent()
  redirect('/admin/resources?saved=deleted')
}
