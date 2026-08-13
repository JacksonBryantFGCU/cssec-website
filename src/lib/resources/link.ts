import { RESOURCE_TYPES, titleForValue } from '../../sanity/schemaTypes/shared/options.ts'

/**
 * Where a resource actually leads, and what its button should say.
 *
 * A resource can be an uploaded file, a repository, an external page, or a
 * page in our own library — and it can be more than one at once. The order
 * below is the order the design implies: the concrete artefact first, our own
 * page last, so "Download" never loses to a link to a page whose only content
 * is the same download.
 */

export type ResourceLinkTarget = {
  href: string
  /** The words on the link. */
  action: string
  external: boolean
  /** True when the browser should save rather than navigate. */
  download: boolean
}

export type ResourceLinkInput = {
  slug?: string | null
  resourceType?: string | null
  fileUrl?: string | null
  githubUrl?: string | null
  externalUrl?: string | null
}

/** "CHEAT SHEET" — the mono kind label in the materials table. */
export function resourceKindLabel(resourceType: string | null | undefined): string {
  return (titleForValue(RESOURCE_TYPES, resourceType) ?? 'Resource').toUpperCase()
}

/**
 * Returns `null` when a resource has no destination at all — an entry with no
 * file, no links and no slug is not something we can render as a link.
 */
export function resourceLink(resource: ResourceLinkInput): ResourceLinkTarget | null {
  if (resource.fileUrl) {
    return { href: resource.fileUrl, action: 'Download', external: false, download: true }
  }
  if (resource.githubUrl) {
    return { href: resource.githubUrl, action: 'GitHub ↗', external: true, download: false }
  }
  if (resource.externalUrl) {
    const action = resource.resourceType === 'recording' ? 'Watch ↗' : 'Open ↗'
    return { href: resource.externalUrl, action, external: true, download: false }
  }
  if (resource.slug) {
    return { href: `/resources/${resource.slug}`, action: 'Read', external: false, download: false }
  }

  return null
}
