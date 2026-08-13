import { defineQuery } from 'next-sanity'

import { imageFragment, personFragment, projectCardFragment, seoFragment } from './fragments'

/**
 * The `/projects` index.
 *
 * Ordered the way the page is read rather than by date alone: projects taking
 * people come first, then live ones, and archived work sinks — a student
 * scanning for something to join should not have to scroll past finished
 * projects to find an open role.
 *
 * The card fragment alone is not enough here. The approved index row shows the
 * open roles, the lead and mentors and a "what you'll learn" line, so those are
 * projected rather than invented in the component.
 */
export const PROJECTS_QUERY = defineQuery(/* groq */ `
  *[_type == "project"]
    | order(
        select(
          status == "recruiting" => 0,
          status == "active" => 1,
          status == "testing" => 2,
          status == "shipped" => 3,
          status == "idea" => 4,
          5
        ) asc,
        featured desc,
        coalesce(startedAt, _createdAt) desc
      ){
      ${projectCardFragment},
      learningOutcomes,
      githubUrl,
      currentFocus,
      openRoles[]{ _key, title, experienceLevel },
      lead->{ _id, name },
      mentors[]->{ _id, name }
    }
`)

/** Projects currently looking for people. */
export const RECRUITING_PROJECTS_QUERY = defineQuery(/* groq */ `
  *[_type == "project" && status == "recruiting"] | order(featured desc, _createdAt desc){
    ${projectCardFragment}
  }
`)

/**
 * Recruiting projects for the homepage preview.
 *
 * The card fragment alone is not enough here: the approved design shows the
 * open roles, the lead and mentor, and the "what you'll learn" line, so those
 * are projected too rather than being invented in the component.
 */
export const HOME_PROJECTS_QUERY = defineQuery(/* groq */ `
  *[_type == "project" && status in ["recruiting", "active"]]
    | order(select(status == "recruiting" => 0, 1) asc, featured desc, _createdAt desc)[0...2]{
      ${projectCardFragment},
      learningOutcomes,
      githubUrl,
      openRoles[]{ _key, title, experienceLevel },
      lead->{ _id, name },
      mentors[]->{ _id, name }
    }
`)

export const PROJECT_BY_SLUG_QUERY = defineQuery(/* groq */ `
  *[_type == "project" && slug.current == $slug][0]{
    ${projectCardFragment},
    description,
    screenshots[]{ _key, ${imageFragment} },
    learningOutcomes,
    openRoles[]{ _key, title, description, experienceLevel, learningOutcome },
    githubUrl,
    demoUrl,
    discussionUrl,
    currentFocus,
    latestMilestone,
    startedAt,
    completedAt,
    lead->{ ${personFragment} },
    mentors[]->{ ${personFragment} },
    contributors[]->{ _id, name, githubUrl },
    seo { ${seoFragment} }
  }
`)

/** Slugs for static generation of `/projects/[slug]`. */
export const PROJECT_SLUGS_QUERY = defineQuery(/* groq */ `
  *[_type == "project" && defined(slug.current)]{ "slug": slug.current }
`)
