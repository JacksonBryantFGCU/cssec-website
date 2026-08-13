import { z } from 'zod'

// Relative, `.ts`-suffixed imports so this module runs unmodified under
// `node --test` as well as through the bundler — same convention as `src/auth`.
import { SOCIAL_PLATFORMS } from '../../sanity/schemaTypes/shared/options.ts'
import {
  fieldErrorsFrom,
  optionalReferenceId,
  optionalText,
  optionalUrl,
  optionValue,
  requiredText,
  requiredUrl,
} from '../admin/fields.ts'
import { readRows, withoutBlankRows } from '../admin/rows.ts'

export { fieldErrorsFrom }

/**
 * Validation for the `siteSettings` singleton.
 *
 * Content only. There is deliberately nothing here for the Sanity project id,
 * API tokens, Clerk configuration, deployment variables or design tokens —
 * those are developer concerns that live in the environment and in code, and an
 * officer changing one from a web form is a failure mode, not a feature.
 */

/** The identity of the one settings document that may ever exist. */
export const SITE_SETTINGS_ID = 'siteSettings'

/** The form field names one social-link row contributes to. */
export const SOCIAL_LINK_FIELDS = {
  platform: 'socialPlatform',
  label: 'socialLabel',
  url: 'socialUrl',
} as const

export const MAX_SOCIAL_LINKS = 8

const socialLinkSchema = z.object({
  platform: optionValue<string>(SOCIAL_PLATFORMS, 'Choose a platform, or remove the row.'),
  label: optionalText(60, 'Keep the label under 60 characters.'),
  url: requiredUrl('Add the full link, starting with https://'),
})

export const siteSettingsInputSchema = z.object({
  clubName: requiredText(
    3,
    120,
    'Add the club’s full name.',
    'Keep the full name under 120 characters.',
  ),
  shortName: requiredText(
    2,
    12,
    'Add the short name, for example CSSEC.',
    'Keep the short name to 12 characters or fewer.',
  ),
  description: requiredText(
    20,
    300,
    'Write one or two sentences describing the club.',
    'Keep the description under 300 characters.',
  ),
  meetingInfo: optionalText(160, 'Keep the meeting info under 160 characters.'),
  footerNote: optionalText(300, 'Keep the footer note under 300 characters.'),
  contactEmail: z
    .string()
    .trim()
    .min(1, 'Add a contact email — it is the address on every page.')
    .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
      message: 'Enter a real email address.',
    }),
  discordUrl: optionalUrl('Enter a full Discord invite link starting with https://'),
  githubUrl: optionalUrl('Enter a full GitHub link starting with https://'),
  teamsUrl: optionalUrl('Enter a full Microsoft Teams link starting with https://'),
  facultyAdvisor: optionalReferenceId,
  metaTitle: optionalText(70, 'Keep the SEO title under 70 characters.'),
  metaDescription: optionalText(160, 'Keep the SEO description under 160 characters.'),
  socialLinks: z
    .array(socialLinkSchema)
    .max(MAX_SOCIAL_LINKS, `Keep it to ${MAX_SOCIAL_LINKS} links or fewer.`),
})

export type SiteSettingsInput = z.infer<typeof siteSettingsInputSchema>

export const SITE_SETTINGS_FORM_FIELDS = [
  'clubName',
  'shortName',
  'description',
  'meetingInfo',
  'footerNote',
  'contactEmail',
  'discordUrl',
  'githubUrl',
  'teamsUrl',
  'facultyAdvisor',
  'metaTitle',
  'metaDescription',
] as const

export function parseSiteSettingsForm(formData: FormData) {
  const socialLinks = withoutBlankRows(readRows(formData, SOCIAL_LINK_FIELDS))

  return siteSettingsInputSchema.safeParse({
    clubName: formData.get('clubName') ?? '',
    shortName: formData.get('shortName') ?? '',
    description: formData.get('description') ?? '',
    meetingInfo: formData.get('meetingInfo') ?? '',
    footerNote: formData.get('footerNote') ?? '',
    contactEmail: formData.get('contactEmail') ?? '',
    discordUrl: formData.get('discordUrl') ?? '',
    githubUrl: formData.get('githubUrl') ?? '',
    teamsUrl: formData.get('teamsUrl') ?? '',
    facultyAdvisor: formData.get('facultyAdvisor') ?? '',
    metaTitle: formData.get('metaTitle') ?? '',
    metaDescription: formData.get('metaDescription') ?? '',
    socialLinks,
  })
}
