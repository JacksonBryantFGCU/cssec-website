import { defineQuery } from 'next-sanity'

/**
 * Global search, as one query across the four public content types.
 *
 * One query rather than four, so the four types cannot drift apart in what they
 * consider a match and a single round trip serves the whole dialog. The fields
 * searched are exactly the ones the existing card fragments already expose —
 * there is no second, search-only content model to keep in step.
 *
 * `$terms` is an array of `token*` patterns; GROQ requires every entry of an
 * array to match, which is what makes a two-word query narrow rather than widen
 * the result. Ranking is deliberately *not* done here: it is a handful of
 * readable rules in `src/lib/search/results.ts`, where it can be unit tested.
 * This query only has to find candidates, so it orders by recency for a stable
 * slice and leaves the ordering that the reader sees to the mapping layer.
 *
 * Everything projected is already public on a page somewhere. Cancelled events
 * are excluded because they are excluded from every other public listing.
 */
export const SEARCH_QUERY = defineQuery(/* groq */ `
  *[
    (
      _type == "event" && status != "cancelled" && defined(slug.current) && (
        title match $terms ||
        summary match $terms ||
        eventType match $terms ||
        topics match $terms
      )
    ) || (
      _type == "project" && defined(slug.current) && (
        name match $terms ||
        shortDescription match $terms ||
        techStack match $terms
      )
    ) || (
      _type == "resource" && defined(slug.current) && (
        title match $terms ||
        description match $terms ||
        resourceType match $terms ||
        topics match $terms
      )
    ) || (
      _type == "opportunity" && (
        title match $terms ||
        organization match $terms ||
        description match $terms ||
        skills match $terms
      )
    )
  ] | order(_updatedAt desc) [0...$limit] {
    _id,
    _type,
    "slug": slug.current,
    "title": coalesce(title, name),
    "summary": coalesce(summary, shortDescription, description),
    "keywords": coalesce(topics, techStack, skills),
    "kind": coalesce(eventType, resourceType, opportunityType, status),
    organization,
    startsAt,
    deadline,
    publishedAt,
    applicationUrl
  }
`)
