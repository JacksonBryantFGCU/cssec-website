import 'server-only'

import { SITE_SETTINGS_QUERY } from '@/sanity/queries/siteSettings'
import { PUBLIC_REVALIDATE_SECONDS, publicClient } from '@/sanity/lib/public-client'

/**
 * The club's external destinations, read from Sanity site settings.
 *
 * The header, the footer and several calls to action all need the Discord and
 * GitHub links. Fetching them in one place — and falling back to `null` rather
 * than to an invented URL — means an unconfigured setting renders no link at
 * all instead of a dead one.
 */
export type SiteLinks = {
  clubName: string
  shortName: string
  description: string | null
  meetingInfo: string | null
  contactEmail: string | null
  discordUrl: string | null
  githubUrl: string | null
  footerNote: string | null
  advisorName: string | null
}

const FALLBACK: SiteLinks = {
  clubName: 'Computer Science & Software Engineering Club',
  shortName: 'CSSEC',
  description: null,
  meetingInfo: null,
  contactEmail: null,
  discordUrl: null,
  githubUrl: null,
  footerNote: null,
  advisorName: null,
}

export async function getSiteLinks(): Promise<SiteLinks> {
  const settings = await publicClient.fetch(
    SITE_SETTINGS_QUERY,
    {},
    { next: { revalidate: PUBLIC_REVALIDATE_SECONDS } },
  )

  if (!settings) return FALLBACK

  return {
    clubName: settings.clubName ?? FALLBACK.clubName,
    shortName: settings.shortName ?? FALLBACK.shortName,
    description: settings.description ?? null,
    meetingInfo: settings.meetingInfo ?? null,
    contactEmail: settings.contactEmail ?? null,
    discordUrl: settings.discordUrl ?? null,
    githubUrl: settings.githubUrl ?? null,
    footerNote: settings.footerNote ?? null,
    advisorName: settings.facultyAdvisor?.name ?? null,
  }
}
