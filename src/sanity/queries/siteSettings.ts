import { defineQuery } from 'next-sanity'

import { imageFragment, seoFragment } from './fragments'

/** Global club information. Fetched by id because it is a singleton. */
export const SITE_SETTINGS_QUERY = defineQuery(/* groq */ `
  *[_id == "siteSettings"][0]{
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
