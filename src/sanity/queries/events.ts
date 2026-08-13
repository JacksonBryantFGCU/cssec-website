import { defineQuery } from 'next-sanity'

import {
  eventCardFragment,
  personFragment,
  resourceCardFragment,
  seoFragment,
} from './fragments'

/** Events that have not happened yet, soonest first. */
export const UPCOMING_EVENTS_QUERY = defineQuery(/* groq */ `
  *[_type == "event" && status != "cancelled" && dateTime(coalesce(endsAt, startsAt)) >= dateTime(now())]
    | order(startsAt asc){
      ${eventCardFragment},
      presenters[]->{ _id, name }
    }
`)

/**
 * Events that have already happened, most recent first — the archive.
 *
 * Carries `topics` and the number of materials attached to it, because the
 * archive is presented as a table whose last two columns are exactly those.
 * The count is derived from the resources pointing back at the event, so it
 * cannot fall out of step with the library.
 */
export const PAST_EVENTS_QUERY = defineQuery(/* groq */ `
  *[_type == "event" && status != "cancelled"
    && dateTime(coalesce(endsAt, startsAt)) < dateTime(now())]
    | order(startsAt desc){
      ${eventCardFragment},
      topics,
      presenters[]->{ _id, name },
      "resourceCount": count(*[_type == "resource" && event._ref == ^._id])
    }
`)

export const EVENT_BY_SLUG_QUERY = defineQuery(/* groq */ `
  *[_type == "event" && slug.current == $slug][0]{
    ${eventCardFragment},
    description,
    prerequisites,
    setupInstructions,
    topics,
    registrationUrl,
    communityUrl,
    recap,
    presenters[]->{ ${personFragment} },
    // Materials created for this event, plus anything explicitly highlighted.
    "resources": array::unique([
      ...*[_type == "resource" && event._ref == ^._id]{ ${resourceCardFragment} },
      ...relatedResources[]->{ ${resourceCardFragment} }
    ]),
    seo { ${seoFragment} }
  }
`)

/** Slugs for static generation of `/events/[slug]`. */
export const EVENT_SLUGS_QUERY = defineQuery(/* groq */ `
  *[_type == "event" && defined(slug.current)]{ "slug": slug.current }
`)
