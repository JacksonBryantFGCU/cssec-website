'use server'

import { redirect } from 'next/navigation'

import { requireOfficer } from '@/auth/require-officer'
import { fieldErrorsFrom } from '@/lib/admin/fields'
import type { AdminActionResult, AdminFormState } from '@/lib/admin/form-state'
import {
  OPPORTUNITY_FORM_FIELDS,
  parseOpportunityForm,
  type OpportunityInput,
} from '@/lib/opportunities/input-schema'
import { revalidateOpportunityContent } from '@/lib/revalidate'
import { getAdminClient } from '@/sanity/lib/admin-client'
import { getWriteClient } from '@/sanity/lib/write-client'

/**
 * Opportunity mutations.
 *
 * Same five steps as every other admin module: authorize independently, Zod,
 * server-only write client, revalidate, typed result.
 *
 * Note what is *not* here: no "expire" or "close" action. A posting's state is
 * derived from its deadline every time it is read, so an expired opportunity
 * needs no maintenance — it drops out of the open view on its own and stays in
 * Sanity as a record of what the club has shared. The only removal is deletion,
 * for postings entered by mistake.
 */

function submittedValues(formData: FormData): Record<string, string | string[]> {
  const values: Record<string, string | string[]> = {}

  for (const field of OPPORTUNITY_FORM_FIELDS) {
    values[field] = String(formData.get(field) ?? '')
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

function logFailure(operation: string, error: unknown): void {
  console.error(`[admin/opportunities] ${operation} failed`, error)
}

type OpportunityDocumentFields = {
  title: string
  organization: string
  opportunityType: OpportunityInput['opportunityType']
  description: string
  location?: string
  workArrangement?: OpportunityInput['workArrangement']
  applicationUrl: string
  deadline?: string
  postedAt: string
  skills?: string[]
  majors?: string[]
  featured: boolean
}

/**
 * Maps validated input onto the Sanity opportunity schema.
 *
 * Every field the schema has, because the admin manages all of them — an
 * opportunity has no rich text and no Studio-only corner. Dates are written as
 * the `YYYY-MM-DD` strings they came in as.
 */
function toOpportunityFields(input: OpportunityInput): OpportunityDocumentFields {
  return {
    title: input.title,
    organization: input.organization,
    opportunityType: input.opportunityType,
    description: input.description,
    location: input.location,
    workArrangement: input.workArrangement,
    applicationUrl: input.applicationUrl,
    // Absent means a rolling deadline, which is a real state — not a gap.
    deadline: input.deadline,
    postedAt: input.postedAt,
    skills: input.skills.length ? input.skills : undefined,
    majors: input.majors.length ? input.majors : undefined,
    featured: input.featured,
  }
}

export async function createOpportunity(
  _previous: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireOfficer({ capability: 'content:write' })

  const parsed = parseOpportunityForm(formData)
  if (!parsed.success) {
    return invalid(formData, fieldErrorsFrom(parsed.error))
  }

  try {
    await getWriteClient().create({
      _type: 'opportunity',
      ...toOpportunityFields(parsed.data),
    })
  } catch (error) {
    logFailure('createOpportunity', error)
    return {
      status: 'error',
      message: 'The opportunity could not be saved. Nothing was changed — please try again.',
      values: submittedValues(formData),
    }
  }

  revalidateOpportunityContent()
  // Outside the try: redirect works by throwing a control-flow signal.
  redirect(`/admin/opportunities?saved=created&title=${encodeURIComponent(parsed.data.title)}`)
}

export async function updateOpportunity(
  _previous: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireOfficer({ capability: 'content:write' })

  const id = String(formData.get('id') ?? '')
  if (!id) {
    return {
      status: 'error',
      message: 'This opportunity could not be identified. Reload and try again.',
    }
  }

  const parsed = parseOpportunityForm(formData)
  if (!parsed.success) {
    return invalid(formData, fieldErrorsFrom(parsed.error))
  }

  try {
    const fields = toOpportunityFields(parsed.data)

    // Split into set/unset so clearing the deadline actually removes it — an
    // empty string would make the posting look like it has a broken date rather
    // than a rolling one.
    const set: Record<string, unknown> = {}
    const unset: string[] = []

    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined) unset.push(key)
      else set[key] = value
    }

    const patch = getWriteClient().patch(id).set(set)

    await (unset.length ? patch.unset(unset) : patch).commit()
  } catch (error) {
    logFailure('updateOpportunity', error)
    return {
      status: 'error',
      message: 'The changes could not be saved. Nothing was changed — please try again.',
      values: submittedValues(formData),
    }
  }

  revalidateOpportunityContent()
  redirect(`/admin/opportunities?saved=updated&title=${encodeURIComponent(parsed.data.title)}`)
}

/**
 * Permanent deletion, for postings entered by mistake.
 *
 * There is no policy module here because there is no safe alternative state to
 * fall back to and nothing references an opportunity: it is a leaf document. A
 * passed deadline is explicitly *not* a reason to delete — the board keeps its
 * history — so the confirmation screen says so and this action does not check
 * the date at all.
 */
export async function deleteOpportunity(
  _previous: AdminActionResult | null,
  formData: FormData,
): Promise<AdminActionResult | null> {
  await requireOfficer({ capability: 'content:write' })

  const id = String(formData.get('id') ?? '')
  if (!id) return { status: 'error', message: 'This opportunity could not be identified.' }

  try {
    const exists = await getAdminClient().fetch<string | null>(
      /* groq */ `*[_type == "opportunity" && _id == $id][0]._id`,
      { id },
    )

    if (!exists) {
      return { status: 'error', message: 'That opportunity no longer exists.' }
    }

    await getWriteClient().delete(id)
  } catch (error) {
    logFailure('deleteOpportunity', error)
    return {
      status: 'error',
      message: 'The opportunity could not be deleted. Please try again.',
    }
  }

  revalidateOpportunityContent()
  redirect('/admin/opportunities?saved=deleted')
}
