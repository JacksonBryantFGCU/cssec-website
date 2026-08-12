import { defineQuery } from 'next-sanity'

import { opportunityCardFragment } from './fragments'

/**
 * Opportunities that are still open: no deadline (rolling) or a deadline that
 * has not passed. "Days left" and expiry labels are derived in the app from
 * `deadline` — never stored.
 */
export const ACTIVE_OPPORTUNITIES_QUERY = defineQuery(/* groq */ `
  *[_type == "opportunity" && (!defined(deadline) || dateTime(deadline + "T23:59:59Z") >= dateTime(now()))]
    | order(featured desc, deadline asc, postedAt desc){
      ${opportunityCardFragment}
    }
`)

/** Open opportunities of one type, for the board's filters. */
export const ACTIVE_OPPORTUNITIES_BY_TYPE_QUERY = defineQuery(/* groq */ `
  *[_type == "opportunity" && opportunityType == $opportunityType
    && (!defined(deadline) || dateTime(deadline + "T23:59:59Z") >= dateTime(now()))]
    | order(deadline asc, postedAt desc){
      ${opportunityCardFragment}
    }
`)
