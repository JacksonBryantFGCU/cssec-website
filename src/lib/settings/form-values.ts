import type { AdminFormValues } from '../admin/form-state.ts'
import type { RowValues } from '../admin/rows.ts'

/** The bridge between the stored `siteSettings` singleton and its form. */

export type EditableSocialLink = {
  platform?: string | null
  label?: string | null
  url?: string | null
}

export type EditableSiteSettings = {
  clubName?: string | null
  shortName?: string | null
  description?: string | null
  meetingInfo?: string | null
  footerNote?: string | null
  contactEmail?: string | null
  discordUrl?: string | null
  githubUrl?: string | null
  teamsUrl?: string | null
  facultyAdvisorId?: string | null
  socialLinks?: Array<EditableSocialLink | null> | null
  seo?: { metaTitle?: string | null; metaDescription?: string | null } | null
}

const text = (value: string | null | undefined) => value ?? ''

/**
 * The starting point when the singleton does not exist yet.
 *
 * The first two mirror the Sanity schema's `initialValue`s, so a club that has
 * never opened Studio still gets sensible defaults rather than empty inputs.
 */
export const NEW_SITE_SETTINGS_VALUES: AdminFormValues = {
  clubName: 'Computer Science & Software Engineering Club',
  shortName: 'CSSEC',
  description: '',
  meetingInfo: '',
  footerNote: '',
  contactEmail: '',
  discordUrl: '',
  githubUrl: '',
  teamsUrl: '',
  facultyAdvisor: '',
  metaTitle: '',
  metaDescription: '',
}

export function siteSettingsToFormValues(
  settings: EditableSiteSettings | null | undefined,
): AdminFormValues {
  if (!settings) return NEW_SITE_SETTINGS_VALUES

  return {
    clubName: text(settings.clubName) || String(NEW_SITE_SETTINGS_VALUES.clubName),
    shortName: text(settings.shortName) || String(NEW_SITE_SETTINGS_VALUES.shortName),
    description: text(settings.description),
    meetingInfo: text(settings.meetingInfo),
    footerNote: text(settings.footerNote),
    contactEmail: text(settings.contactEmail),
    discordUrl: text(settings.discordUrl),
    githubUrl: text(settings.githubUrl),
    teamsUrl: text(settings.teamsUrl),
    facultyAdvisor: text(settings.facultyAdvisorId),
    metaTitle: text(settings.seo?.metaTitle),
    metaDescription: text(settings.seo?.metaDescription),
  }
}

/** The social-link rows the repeating editor renders. */
export function socialLinkRows(settings: EditableSiteSettings | null | undefined): RowValues[] {
  return (settings?.socialLinks ?? [])
    .filter((link): link is EditableSocialLink => Boolean(link))
    .map((link) => ({
      platform: text(link.platform) || 'other',
      label: text(link.label),
      url: text(link.url),
    }))
}

/** Rebuilds the social-link rows from a rejected submission. */
export function socialLinkRowsFromValues(values: AdminFormValues): RowValues[] {
  const column = (key: string) => {
    const value = values[key]
    return Array.isArray(value) ? value : []
  }

  const platforms = column('socialPlatform')
  const labels = column('socialLabel')
  const urls = column('socialUrl')

  return platforms.map((platform, index) => ({
    platform: platform || 'other',
    label: labels[index] ?? '',
    url: urls[index] ?? '',
  }))
}
