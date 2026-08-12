import { defineQuery } from 'next-sanity'

import { personFragment } from './fragments'

/** The current officer board, in display order. */
export const CURRENT_OFFICERS_QUERY = defineQuery(/* groq */ `
  *[_type == "officerRole" && isCurrent == true] | order(displayOrder asc, position asc){
    _id,
    position,
    term,
    person->{ ${personFragment} }
  }
`)
