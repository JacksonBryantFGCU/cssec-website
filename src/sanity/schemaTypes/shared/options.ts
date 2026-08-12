/**
 * Shared option lists.
 *
 * Keeping these in one place means the Studio dropdowns, the GROQ filters in
 * `src/sanity/structure.ts` and any future frontend labels stay in sync.
 * Values are stored in the Content Lake, so change titles freely but treat
 * values as permanent.
 */

export type Option = { title: string; value: string }

export const EXPERIENCE_LEVELS: Option[] = [
  { title: 'Any experience level', value: 'any' },
  { title: 'Beginner', value: 'beginner' },
  { title: 'Intermediate', value: 'intermediate' },
  { title: 'Advanced', value: 'advanced' },
]

export const EVENT_STATUSES: Option[] = [
  { title: 'Scheduled', value: 'scheduled' },
  { title: 'Completed', value: 'completed' },
  { title: 'Cancelled', value: 'cancelled' },
]

export const EVENT_TYPES: Option[] = [
  { title: 'Workshop', value: 'workshop' },
  { title: 'General meeting', value: 'meeting' },
  { title: 'Guest speaker', value: 'speaker' },
  { title: 'Hackathon', value: 'hackathon' },
  { title: 'Study session', value: 'studySession' },
  { title: 'Career / interview prep', value: 'career' },
  { title: 'Social', value: 'social' },
]

export const LOCATION_TYPES: Option[] = [
  { title: 'In person', value: 'inPerson' },
  { title: 'Online', value: 'online' },
  { title: 'Hybrid', value: 'hybrid' },
]

export const PROJECT_STATUSES: Option[] = [
  { title: 'Idea', value: 'idea' },
  { title: 'Recruiting', value: 'recruiting' },
  { title: 'Active', value: 'active' },
  { title: 'Testing', value: 'testing' },
  { title: 'Shipped', value: 'shipped' },
  { title: 'Archived', value: 'archived' },
]

export const RESOURCE_TYPES: Option[] = [
  { title: 'Workshop material', value: 'workshop' },
  { title: 'Slides', value: 'slides' },
  { title: 'Guide', value: 'guide' },
  { title: 'Cheat sheet', value: 'cheatSheet' },
  { title: 'Repository', value: 'repository' },
  { title: 'Recording', value: 'recording' },
  { title: 'Tutorial', value: 'tutorial' },
  { title: 'Interview prep', value: 'interviewPrep' },
  { title: 'Career resource', value: 'career' },
]

export const OPPORTUNITY_TYPES: Option[] = [
  { title: 'Internship', value: 'internship' },
  { title: 'Full-time role', value: 'fullTime' },
  { title: 'Hackathon', value: 'hackathon' },
  { title: 'Research', value: 'research' },
  { title: 'Scholarship', value: 'scholarship' },
  { title: 'Competition', value: 'competition' },
  { title: 'Campus opportunity', value: 'campus' },
]

export const WORK_ARRANGEMENTS: Option[] = [
  { title: 'On site', value: 'onSite' },
  { title: 'Hybrid', value: 'hybrid' },
  { title: 'Remote', value: 'remote' },
]

export const SOCIAL_PLATFORMS: Option[] = [
  { title: 'Discord', value: 'discord' },
  { title: 'GitHub', value: 'github' },
  { title: 'Instagram', value: 'instagram' },
  { title: 'LinkedIn', value: 'linkedin' },
  { title: 'YouTube', value: 'youtube' },
  { title: 'Microsoft Teams', value: 'teams' },
  { title: 'Other', value: 'other' },
]

/** Looks up a human-readable title for a stored option value. */
export function titleForValue(options: Option[], value?: string) {
  if (!value) return undefined
  return options.find((option) => option.value === value)?.title ?? value
}
