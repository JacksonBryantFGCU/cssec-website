/**
 * Reusable GROQ projections.
 *
 * These are plain strings interpolated into `defineQuery` templates so TypeGen
 * still sees a complete query and can type the result.
 */

export const imageFragment = /* groq */ `
  asset->{ _id, url, metadata { lqip, dimensions } },
  alt,
  hotspot,
  crop
`

export const personFragment = /* groq */ `
  _id,
  name,
  "slug": slug.current,
  photo { ${imageFragment} },
  shortBio,
  githubUrl,
  linkedinUrl,
  websiteUrl
`

export const seoFragment = /* groq */ `
  metaTitle,
  metaDescription,
  shareImage { ${imageFragment} }
`

export const eventCardFragment = /* groq */ `
  _id,
  title,
  "slug": slug.current,
  status,
  eventType,
  startsAt,
  endsAt,
  summary,
  featured,
  experienceLevel,
  noExperienceRequired,
  location
`

export const resourceCardFragment = /* groq */ `
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
  publishedAt
`

export const projectCardFragment = /* groq */ `
  _id,
  name,
  "slug": slug.current,
  status,
  shortDescription,
  techStack,
  experienceLevel,
  noExperienceRequired,
  featured,
  coverImage { ${imageFragment} },
  "openRoleCount": count(openRoles)
`

export const opportunityCardFragment = /* groq */ `
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
  featured
`
