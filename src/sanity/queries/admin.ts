import { defineQuery } from 'next-sanity'

/**
 * Queries that exist only for the `/admin` officer interface.
 *
 * They are deliberately separate from the public queries in this folder: the
 * admin needs counts, editing shapes and cancelled/past documents that the
 * public site must never show. Counts are computed in GROQ with `count()` so a
 * dashboard tile never pulls whole documents just to measure them.
 */

/** Everything the dashboard tiles need, in one round trip. */
export const ADMIN_DASHBOARD_STATS_QUERY = defineQuery(/* groq */ `{
  "upcomingEvents": count(*[_type == "event" && status == "scheduled"
    && dateTime(coalesce(endsAt, startsAt)) >= dateTime(now())]),
  "pastEvents": count(*[_type == "event"
    && dateTime(coalesce(endsAt, startsAt)) < dateTime(now())]),
  "activeProjects": count(*[_type == "project" && status in ["recruiting", "active", "testing"]]),
  "recruitingProjects": count(*[_type == "project" && status == "recruiting"]),
  "openOpportunities": count(*[_type == "opportunity"
    && (!defined(deadline) || dateTime(deadline + "T23:59:59Z") >= dateTime(now()))]),
  "publishedResources": count(*[_type == "resource"]),
  "people": count(*[_type == "person"])
}`)

/** The next few scheduled events, for the dashboard list. */
export const ADMIN_UPCOMING_EVENTS_QUERY = defineQuery(/* groq */ `
  *[_type == "event" && status == "scheduled"
    && dateTime(coalesce(endsAt, startsAt)) >= dateTime(now())]
    | order(startsAt asc)[0...5]{
      _id,
      title,
      startsAt,
      endsAt,
      eventType,
      location
    }
`)

/**
 * Content an officer should look at, derived only from facts already in the
 * documents — no invented scoring. Each entry says what is missing and where.
 */
export const ADMIN_NEEDS_ATTENTION_QUERY = defineQuery(/* groq */ `{
  "eventsMissingSummary": *[_type == "event" && status == "scheduled"
    && dateTime(coalesce(endsAt, startsAt)) >= dateTime(now())
    && !defined(summary)]{ _id, title, startsAt },
  "eventsMissingLocation": *[_type == "event" && status == "scheduled"
    && dateTime(coalesce(endsAt, startsAt)) >= dateTime(now())
    && !defined(location.locationType)]{ _id, title, startsAt },
  "eventsToClose": *[_type == "event" && status == "scheduled"
    && dateTime(coalesce(endsAt, startsAt)) < dateTime(now())]
    | order(startsAt desc)[0...5]{ _id, title, startsAt },
  "opportunitiesClosingSoon": *[_type == "opportunity" && defined(deadline)
    && dateTime(deadline + "T23:59:59Z") >= dateTime(now())
    && dateTime(deadline + "T23:59:59Z") <= dateTime(now()) + 60 * 60 * 24 * 7]
    | order(deadline asc){ _id, title, organization, deadline }
}`)

/**
 * The admin events index. Includes cancelled and past events — unlike the
 * public queries — because managing them is the entire point of this screen.
 */
export const ADMIN_EVENTS_QUERY = defineQuery(/* groq */ `
  *[_type == "event"] | order(startsAt desc){
    _id,
    title,
    "slug": slug.current,
    status,
    eventType,
    startsAt,
    endsAt,
    featured,
    location,
    "isPast": dateTime(coalesce(endsAt, startsAt)) < dateTime(now()),
    "resourceCount": count(*[_type == "resource" && event._ref == ^._id]),
    // count() on a missing array is null, so coalesce for a plain number.
    "presenterCount": coalesce(count(presenters), 0)
  }
`)

/**
 * One event in the shape the admin edit form needs.
 *
 * Fields the admin form does not manage (description, setup instructions, SEO,
 * related resources) are intentionally absent: the form never sends them, and
 * the update action patches only what it manages, so Studio-authored content
 * survives an admin edit untouched.
 */
export const ADMIN_EVENT_BY_ID_QUERY = defineQuery(/* groq */ `
  *[_type == "event" && _id == $id][0]{
    _id,
    title,
    "slug": slug.current,
    status,
    eventType,
    startsAt,
    endsAt,
    location,
    summary,
    experienceLevel,
    noExperienceRequired,
    prerequisites,
    topics,
    registrationUrl,
    communityUrl,
    recap,
    featured,
    "presenterIds": presenters[]._ref,
    "referenceCount": count(*[references(^._id)])
  }
`)

/** Slugs already in use, so a new event never collides with an existing URL. */
export const EVENT_SLUGS_IN_USE_QUERY = defineQuery(/* groq */ `
  *[_type == "event" && defined(slug.current) && _id != $excludeId].slug.current
`)

/** People who can be selected as presenters. */
export const ADMIN_PEOPLE_OPTIONS_QUERY = defineQuery(/* groq */ `
  *[_type == "person"] | order(name asc){ _id, name }
`)
