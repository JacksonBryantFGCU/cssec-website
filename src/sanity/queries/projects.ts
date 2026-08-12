import { defineQuery } from 'next-sanity'

import { imageFragment, personFragment, projectCardFragment, seoFragment } from './fragments'

/** All projects, newest and most active first. */
export const PROJECTS_QUERY = defineQuery(/* groq */ `
  *[_type == "project"] | order(featured desc, coalesce(startedAt, _createdAt) desc){
    ${projectCardFragment}
  }
`)

/** Projects currently looking for people. */
export const RECRUITING_PROJECTS_QUERY = defineQuery(/* groq */ `
  *[_type == "project" && status == "recruiting"] | order(featured desc, _createdAt desc){
    ${projectCardFragment}
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
