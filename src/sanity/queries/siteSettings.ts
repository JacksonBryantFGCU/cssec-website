import { defineQuery } from 'next-sanity'

import { imageFragment, seoFragment } from './fragments'

/**
 * Global club information. Fetched by id because it is a singleton.
 *
 * `_type` is matched as well as `_id`: without it TypeGen has to assume the
 * document could be *any* type sharing that id and widens every field to a
 * union across the whole schema, which makes the result unusable downstream.
 */
export const SITE_SETTINGS_QUERY = defineQuery(/* groq */ `
  *[_type == "siteSettings" && _id == "siteSettings"][0]{
    clubName,
    shortName,
    description,
    meetingInfo,
    contactEmail,
    discordUrl,
    githubUrl,
    teamsUrl,
    footerNote,
    socialLinks[]{ _key, platform, label, url },
    facultyAdvisor->{
      _id,
      name,
      email,
      photo { ${imageFragment} }
    },
    seo { ${seoFragment} }
  }
`)
