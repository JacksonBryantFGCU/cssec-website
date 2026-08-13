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

/** People who can be selected as presenters, leads, mentors or authors. */
export const ADMIN_PEOPLE_OPTIONS_QUERY = defineQuery(/* groq */ `
  *[_type == "person"] | order(name asc){ _id, name }
`)

/**
 * The admin projects index.
 *
 * Ordered so the projects an officer is most likely to be maintaining come
 * first, and archived work sinks — the same intent as the public index, but
 * including archived projects, which the public page ranks last rather than
 * hiding.
 */
export const ADMIN_PROJECTS_QUERY = defineQuery(/* groq */ `
  *[_type == "project"] | order(
    select(
      status == "recruiting" => 0,
      status == "active" => 1,
      status == "testing" => 2,
      status == "idea" => 3,
      status == "shipped" => 4,
      5
    ) asc,
    featured desc,
    coalesce(startedAt, _createdAt) desc
  ){
    _id,
    name,
    "slug": slug.current,
    status,
    experienceLevel,
    noExperienceRequired,
    featured,
    techStack,
    // count() on a missing array is null, so coalesce for a plain number.
    "openRoleCount": coalesce(count(openRoles), 0),
    "mentorCount": coalesce(count(mentors), 0),
    "leadName": lead->name,
    startedAt,
    completedAt
  }
`)

/**
 * One project in the shape the admin edit form needs.
 *
 * Fields the admin form does not manage (the rich-text description, the
 * screenshot gallery and SEO) are intentionally absent: the form never sends
 * them, and the update action patches only what it manages, so Studio-authored
 * content survives an admin edit untouched.
 */
export const ADMIN_PROJECT_BY_ID_QUERY = defineQuery(/* groq */ `
  *[_type == "project" && _id == $id][0]{
    _id,
    name,
    "slug": slug.current,
    status,
    shortDescription,
    experienceLevel,
    noExperienceRequired,
    techStack,
    learningOutcomes,
    "leadId": lead._ref,
    "mentorIds": mentors[]._ref,
    "contributorIds": contributors[]._ref,
    openRoles[]{ _key, title, description, experienceLevel, learningOutcome },
    githubUrl,
    demoUrl,
    discussionUrl,
    currentFocus,
    latestMilestone,
    startedAt,
    completedAt,
    featured,
    "coverImageAlt": coverImage.alt,
    "coverImageUrl": coverImage.asset->url,
    "screenshotCount": coalesce(count(screenshots), 0),
    "referenceCount": count(*[references(^._id)])
  }
`)

export const PROJECT_SLUGS_IN_USE_QUERY = defineQuery(/* groq */ `
  *[_type == "project" && defined(slug.current) && _id != $excludeId].slug.current
`)

/**
 * The admin resources index.
 *
 * `fileUrl` and `fileExtension` come from the asset document, so the list can
 * say what an officer would actually get when they open a row without
 * duplicating that on the resource itself.
 */
export const ADMIN_RESOURCES_QUERY = defineQuery(/* groq */ `
  *[_type == "resource"] | order(coalesce(updatedAt, publishedAt) desc){
    _id,
    title,
    "slug": slug.current,
    resourceType,
    topics,
    experienceLevel,
    featured,
    publishedAt,
    updatedAt,
    externalUrl,
    githubUrl,
    "fileUrl": file.asset->url,
    "fileExtension": file.asset->extension,
    "eventTitle": event->title,
    "authorName": author->name
  }
`)

/** One resource in the shape the admin edit form needs. */
export const ADMIN_RESOURCE_BY_ID_QUERY = defineQuery(/* groq */ `
  *[_type == "resource" && _id == $id][0]{
    _id,
    title,
    "slug": slug.current,
    resourceType,
    description,
    topics,
    experienceLevel,
    featured,
    externalUrl,
    githubUrl,
    "fileUrl": file.asset->url,
    "fileName": file.asset->originalFilename,
    "authorId": author._ref,
    "eventId": event._ref,
    "relatedResourceIds": relatedResources[]._ref,
    publishedAt,
    updatedAt,
    "referenceCount": count(*[references(^._id)]),
    // Split out because it is the case with a specific fix: go and edit the
    // other resource's "related resources" list.
    "relatedByCount": count(*[_type == "resource" && references(^._id)])
  }
`)

export const RESOURCE_SLUGS_IN_USE_QUERY = defineQuery(/* groq */ `
  *[_type == "resource" && defined(slug.current) && _id != $excludeId].slug.current
`)

/** Events a resource can name as its source, newest first. */
export const ADMIN_EVENT_OPTIONS_QUERY = defineQuery(/* groq */ `
  *[_type == "event"] | order(startsAt desc){ _id, title, startsAt }
`)

/** Other resources, for the "related resources" selector. */
export const ADMIN_RESOURCE_OPTIONS_QUERY = defineQuery(/* groq */ `
  *[_type == "resource" && _id != $excludeId] | order(title asc){ _id, title, resourceType }
`)

/**
 * The admin opportunities index.
 *
 * `deadline` is projected raw. Whether a posting is open, closing soon or
 * expired is derived in the application from that one date — see
 * `@/lib/opportunities/deadline` — so nothing here can disagree with what the
 * public board says.
 */
export const ADMIN_OPPORTUNITIES_QUERY = defineQuery(/* groq */ `
  *[_type == "opportunity"] | order(
    select(defined(deadline) => 0, 1) asc,
    deadline asc,
    postedAt desc
  ){
    _id,
    title,
    organization,
    opportunityType,
    location,
    workArrangement,
    deadline,
    postedAt,
    featured
  }
`)

export const ADMIN_OPPORTUNITY_BY_ID_QUERY = defineQuery(/* groq */ `
  *[_type == "opportunity" && _id == $id][0]{
    _id,
    title,
    organization,
    opportunityType,
    description,
    location,
    workArrangement,
    applicationUrl,
    deadline,
    postedAt,
    skills,
    majors,
    featured
  }
`)

/**
 * The admin people index, with the counts that decide whether a person can be
 * deleted and the officer terms that name them.
 */
export const ADMIN_PEOPLE_QUERY = defineQuery(/* groq */ `
  *[_type == "person"] | order(name asc){
    _id,
    name,
    "slug": slug.current,
    email,
    shortBio,
    githubUrl,
    linkedinUrl,
    websiteUrl,
    "photoUrl": photo.asset->url,
    "referenceCount": count(*[references(^._id)]),
    "currentPositions": *[_type == "officerRole" && isCurrent == true && person._ref == ^._id].position
  }
`)

export const ADMIN_PERSON_BY_ID_QUERY = defineQuery(/* groq */ `
  *[_type == "person" && _id == $id][0]{
    _id,
    name,
    "slug": slug.current,
    shortBio,
    email,
    githubUrl,
    linkedinUrl,
    websiteUrl,
    "photoUrl": photo.asset->url,
    "photoAlt": photo.alt,
    "referenceCount": count(*[references(^._id)])
  }
`)

export const PERSON_SLUGS_IN_USE_QUERY = defineQuery(/* groq */ `
  *[_type == "person" && defined(slug.current) && _id != $excludeId].slug.current
`)

/**
 * Where a person is used, named rather than counted.
 *
 * A number alone ("3 documents link to this person") tells an officer nothing
 * actionable. This lists the actual titles so the removal screen can say which
 * project or event to edit first.
 */
export const ADMIN_PERSON_USAGE_QUERY = defineQuery(/* groq */ `
  *[_type == "person" && _id == $id][0]{
    "officerTerms": *[_type == "officerRole" && person._ref == ^._id]{ _id, position, term, isCurrent },
    "eventsPresented": *[_type == "event" && ^._id in presenters[]._ref]{ _id, title },
    "projectsLed": *[_type == "project" && lead._ref == ^._id]{ _id, name },
    "projectsMentored": *[_type == "project" && ^._id in mentors[]._ref]{ _id, name },
    "projectsContributed": *[_type == "project" && ^._id in contributors[]._ref]{ _id, name },
    "resourcesAuthored": *[_type == "resource" && author._ref == ^._id]{ _id, title },
    "advisorOf": *[_type == "siteSettings" && facultyAdvisor._ref == ^._id]{ _id }
  }
`)

/** Officer terms, current first, then by academic year. */
export const ADMIN_OFFICER_TERMS_QUERY = defineQuery(/* groq */ `
  *[_type == "officerRole"] | order(isCurrent desc, term desc, displayOrder asc, position asc){
    _id,
    position,
    term,
    isCurrent,
    displayOrder,
    "personId": person._ref,
    "personName": person->name
  }
`)

export const ADMIN_OFFICER_TERM_BY_ID_QUERY = defineQuery(/* groq */ `
  *[_type == "officerRole" && _id == $id][0]{
    _id,
    position,
    term,
    isCurrent,
    displayOrder,
    "personId": person._ref,
    "personName": person->name
  }
`)

/**
 * Site settings in the shape the admin form edits.
 *
 * Fetched by the fixed singleton id, matching `_type` as well, so TypeGen can
 * type the result — see the note on the public settings query.
 */
export const ADMIN_SITE_SETTINGS_QUERY = defineQuery(/* groq */ `
  *[_type == "siteSettings" && _id == "siteSettings"][0]{
    _id,
    clubName,
    shortName,
    description,
    meetingInfo,
    footerNote,
    contactEmail,
    discordUrl,
    githubUrl,
    teamsUrl,
    socialLinks[]{ _key, platform, label, url },
    "facultyAdvisorId": facultyAdvisor._ref,
    seo { metaTitle, metaDescription }
  }
`)
