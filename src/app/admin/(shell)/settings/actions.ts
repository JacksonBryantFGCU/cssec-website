'use server'

import { redirect } from 'next/navigation'

import { requireOfficer } from '@/auth/require-officer'
import { fieldErrorsFrom, rowErrorsFrom } from '@/lib/admin/fields'
import type { AdminFormState } from '@/lib/admin/form-state'
import { toReference } from '@/lib/admin/references'
import { rowKey } from '@/lib/admin/rows'
import { revalidateSiteSettings } from '@/lib/revalidate'
import {
  SITE_SETTINGS_FORM_FIELDS,
  SITE_SETTINGS_ID,
  SOCIAL_LINK_FIELDS,
  parseSiteSettingsForm,
  type SiteSettingsInput,
} from '@/lib/settings/input-schema'
import { getAdminClient } from '@/sanity/lib/admin-client'
import { getWriteClient } from '@/sanity/lib/write-client'

/**
 * The one mutation for the club's global settings.
 *
 * Two things make this different from every other module here.
 *
 * **It is a singleton.** There must never be a second settings document: the
 * public site fetches `_id == "siteSettings"` by name, so a stray second one
 * would be invisible and an officer would edit it forever wondering why nothing
 * changed. `createIfNotExists` followed by a patch on that exact id is what
 * guarantees there is exactly one, whether or not Studio has ever been opened.
 * Studio's own singleton restriction (`src/sanity/structure.ts`) pins editing to
 * the same id from the other side.
 *
 * **It is admin-only** (`settings:manage`). Ordinary content mistakes show up on
 * one page; a bad save here changes the club's name, contact address and Discord
 * invite on every page at once.
 */

function submittedValues(formData: FormData): Record<string, string | string[]> {
  const values: Record<string, string | string[]> = {}

  for (const field of SITE_SETTINGS_FORM_FIELDS) {
    values[field] = String(formData.get(field) ?? '')
  }
  for (const name of Object.values(SOCIAL_LINK_FIELDS)) {
    values[name] = formData.getAll(name).map(String)
  }

  return values
}

function logFailure(operation: string, error: unknown): void {
  console.error(`[admin/settings] ${operation} failed`, error)
}

type SiteSettingsDocumentFields = {
  clubName: string
  shortName: string
  description: string
  meetingInfo?: string
  footerNote?: string
  contactEmail: string
  discordUrl?: string
  githubUrl?: string
  teamsUrl?: string
  facultyAdvisor?: { _type: 'reference'; _ref: string }
  socialLinks?: Array<{
    _key: string
    _type: 'socialLink'
    platform: string
    label?: string
    url: string
  }>
}

function toSettingsFields(input: SiteSettingsInput): SiteSettingsDocumentFields {
  return {
    clubName: input.clubName,
    shortName: input.shortName,
    description: input.description,
    meetingInfo: input.meetingInfo,
    footerNote: input.footerNote,
    contactEmail: input.contactEmail,
    discordUrl: input.discordUrl,
    githubUrl: input.githubUrl,
    teamsUrl: input.teamsUrl,
    facultyAdvisor: toReference(input.facultyAdvisor),
    socialLinks: input.socialLinks.length
      ? input.socialLinks.map((link, index) => ({
          _key: rowKey('social', index),
          _type: 'socialLink' as const,
          platform: link.platform,
          label: link.label,
          url: link.url,
        }))
      : undefined,
  }
}

export async function updateSiteSettings(
  _previous: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireOfficer({ capability: 'settings:manage' })

  const parsed = parseSiteSettingsForm(formData)
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Check the highlighted fields and try again.',
      fieldErrors: {
        ...fieldErrorsFrom(parsed.error),
        ...rowErrorsFrom(parsed.error, 'socialLinks'),
      },
      values: submittedValues(formData),
    }
  }

  try {
    if (parsed.data.facultyAdvisor) {
      const advisor = await getAdminClient().fetch<string | null>(
        /* groq */ `*[_type == "person" && _id == $id][0]._id`,
        { id: parsed.data.facultyAdvisor },
      )
      if (!advisor) {
        return {
          status: 'error',
          message: 'Check the highlighted fields and try again.',
          fieldErrors: { facultyAdvisor: 'That person no longer exists.' },
          values: submittedValues(formData),
        }
      }
    }

    const fields = toSettingsFields(parsed.data)

    const set: Record<string, unknown> = {}
    const unset: string[] = []

    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined) unset.push(key)
      else set[key] = value
    }

    // SEO is a nested object the form only partly manages, so it is written by
    // path rather than replaced — a share image set in Studio, and anything the
    // `seo` object grows later, survives an admin save untouched.
    if (parsed.data.metaTitle) set['seo.metaTitle'] = parsed.data.metaTitle
    else unset.push('seo.metaTitle')

    if (parsed.data.metaDescription) set['seo.metaDescription'] = parsed.data.metaDescription
    else unset.push('seo.metaDescription')

    // The two halves of the singleton guarantee:
    //   1. `createIfNotExists` with the fixed id, so the first save on a fresh
    //      dataset creates *that* document rather than a new random one.
    //   2. A patch on the same id, so every later save updates it in place.
    // Required fields go on the creation payload as well, since a document
    // created empty would momentarily fail its own schema validation in Studio.
    await getWriteClient()
      .transaction()
      .createIfNotExists({
        _id: SITE_SETTINGS_ID,
        _type: 'siteSettings',
        clubName: parsed.data.clubName,
        shortName: parsed.data.shortName,
        description: parsed.data.description,
        contactEmail: parsed.data.contactEmail,
      })
      .patch(SITE_SETTINGS_ID, (patch) => {
        const withSet = patch
          // So the first SEO value does not have to create the object itself,
          // and so Studio recognises the object it lands in.
          .setIfMissing({ seo: { _type: 'seo' } })
          .set(set)
        return unset.length ? withSet.unset(unset) : withSet
      })
      .commit()
  } catch (error) {
    logFailure('updateSiteSettings', error)
    return {
      status: 'error',
      message: 'The settings could not be saved. Nothing was changed — please try again.',
      values: submittedValues(formData),
    }
  }

  revalidateSiteSettings()
  // Outside the try: redirect works by throwing a control-flow signal.
  redirect('/admin/settings?saved=updated')
}
