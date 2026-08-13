/**
 * Canonical site identity.
 *
 * `metadataBase` needs an absolute origin so Next.js can resolve relative
 * Open Graph and canonical URLs. Vercel exposes the deployment host without a
 * scheme, so it is normalised here rather than at every call site.
 */

export const SITE_NAME = 'CSSEC'
export const SITE_FULL_NAME = 'Computer Science & Software Engineering Club'
export const SITE_AFFILIATION = 'Florida Gulf Coast University'

const FALLBACK_ORIGIN = 'http://localhost:3000'

/** The absolute origin this deployment is served from. */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (configured) return configured.replace(/\/$/, '')

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL
  if (vercel) return `https://${vercel.replace(/\/$/, '')}`

  return FALLBACK_ORIGIN
}
