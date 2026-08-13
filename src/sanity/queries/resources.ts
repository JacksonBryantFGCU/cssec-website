import { defineQuery } from 'next-sanity'

import { personFragment, resourceCardFragment } from './fragments'

/**
 * The resource library listing.
 *
 * The source event is projected with it because the archive's whole premise is
 * that material stays attached to the session that produced it — the row shows
 * "From: Git & GitHub, September 18" and links there.
 */
export const RESOURCES_QUERY = defineQuery(/* groq */ `
  *[_type == "resource"] | order(featured desc, coalesce(publishedAt, _createdAt) desc){
    ${resourceCardFragment},
    author->{ _id, name },
    event->{ _id, title, "slug": slug.current, startsAt }
  }
`)

/** Resources of one type, for category browsing. */
export const RESOURCES_BY_TYPE_QUERY = defineQuery(/* groq */ `
  *[_type == "resource" && resourceType == $resourceType] | order(publishedAt desc){
    ${resourceCardFragment}
  }
`)

export const RESOURCE_BY_SLUG_QUERY = defineQuery(/* groq */ `
  *[_type == "resource" && slug.current == $slug][0]{
    ${resourceCardFragment},
    updatedAt,
    "fileName": file.asset->originalFilename,
    "fileSize": file.asset->size,
    author->{ ${personFragment} },
    event->{ _id, title, "slug": slug.current, startsAt },
    relatedResources[]->{ ${resourceCardFragment} }
  }
`)

/** Slugs for static generation of `/resources/[slug]`. */
export const RESOURCE_SLUGS_QUERY = defineQuery(/* groq */ `
  *[_type == "resource" && defined(slug.current)]{ "slug": slug.current }
`)
