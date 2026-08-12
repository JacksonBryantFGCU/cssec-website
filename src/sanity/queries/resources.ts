import { defineQuery } from 'next-sanity'

import { personFragment, resourceCardFragment } from './fragments'

/** The resource library listing. */
export const RESOURCES_QUERY = defineQuery(/* groq */ `
  *[_type == "resource"] | order(featured desc, publishedAt desc){
    ${resourceCardFragment},
    event->{ _id, title, "slug": slug.current }
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
