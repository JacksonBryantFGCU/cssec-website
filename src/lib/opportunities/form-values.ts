import type { AdminFormValues } from '../admin/form-state.ts'
import { todayInClubTime } from '../resources/form-values.ts'

/**
 * The bridge between a stored opportunity and the admin form.
 *
 * Both dates pass through untouched. `<input type="date">` speaks the same
 * `YYYY-MM-DD` a Sanity `date` stores, so there is nothing to convert — and
 * converting would be the bug.
 */

export type EditableOpportunity = {
  title?: string | null
  organization?: string | null
  opportunityType?: string | null
  description?: string | null
  location?: string | null
  workArrangement?: string | null
  applicationUrl?: string | null
  deadline?: string | null
  postedAt?: string | null
  skills?: Array<string | null> | null
  majors?: Array<string | null> | null
  featured?: boolean | null
}

const checkbox = (value: boolean | null | undefined) => (value ? 'on' : '')

const text = (value: string | null | undefined) => value ?? ''

const strings = (value: Array<string | null> | null | undefined) =>
  (value ?? []).filter((entry): entry is string => typeof entry === 'string' && entry.trim() !== '')

/**
 * Sensible starting point for a brand new opportunity.
 *
 * A function rather than a constant because it defaults the posting date to
 * today, matching the Sanity schema's `initialValue`.
 */
export function newOpportunityValues(now: Date = new Date()): AdminFormValues {
  return {
    title: '',
    organization: '',
    opportunityType: 'internship',
    description: '',
    location: '',
    workArrangement: '',
    applicationUrl: '',
    deadline: '',
    postedAt: todayInClubTime(now),
    skills: '',
    majors: '',
    featured: '',
  }
}

export function opportunityToFormValues(opportunity: EditableOpportunity): AdminFormValues {
  return {
    title: text(opportunity.title),
    organization: text(opportunity.organization),
    opportunityType: text(opportunity.opportunityType) || 'internship',
    description: text(opportunity.description),
    location: text(opportunity.location),
    workArrangement: text(opportunity.workArrangement),
    applicationUrl: text(opportunity.applicationUrl),
    deadline: text(opportunity.deadline),
    postedAt: text(opportunity.postedAt),
    skills: strings(opportunity.skills).join(', '),
    majors: strings(opportunity.majors).join(', '),
    featured: checkbox(opportunity.featured),
  }
}
