import type { AdminFormValues } from '../admin/form-state.ts'
import type { RowValues } from '../admin/rows.ts'

/**
 * The bridge between a stored project and the admin form.
 *
 * Form controls speak strings, so this is where a Sanity document becomes the
 * exact values an officer sees — lists flattened into text, references reduced
 * to the ids the selectors use, calendar dates passed through untouched.
 *
 * Calendar dates are deliberately *not* converted: `startedAt` is a Sanity
 * `date`, and `<input type="date">` speaks the same `YYYY-MM-DD`. Routing one
 * through `Date` on the way to the form would move it a day in either
 * direction, which is the Phase 5 bug.
 *
 * Pure and free of Sanity imports so it can be unit tested; the same shape is
 * echoed back by the Server Action after a rejected save.
 */

export type EditableOpenRole = {
  title?: string | null
  description?: string | null
  experienceLevel?: string | null
  learningOutcome?: string | null
}

export type EditableProject = {
  name?: string | null
  slug?: string | null
  status?: string | null
  shortDescription?: string | null
  experienceLevel?: string | null
  noExperienceRequired?: boolean | null
  techStack?: Array<string | null> | null
  learningOutcomes?: Array<string | null> | null
  leadId?: string | null
  mentorIds?: Array<string | null> | null
  contributorIds?: Array<string | null> | null
  openRoles?: Array<EditableOpenRole | null> | null
  githubUrl?: string | null
  demoUrl?: string | null
  discussionUrl?: string | null
  currentFocus?: string | null
  latestMilestone?: string | null
  startedAt?: string | null
  completedAt?: string | null
  featured?: boolean | null
  coverImageAlt?: string | null
}

/** HTML checkboxes are submitted as "on", so defaults use the same vocabulary. */
const checkbox = (value: boolean | null | undefined) => (value ? 'on' : '')

const text = (value: string | null | undefined) => value ?? ''

const ids = (value: Array<string | null> | null | undefined) =>
  (value ?? []).filter((id): id is string => typeof id === 'string')

const strings = (value: Array<string | null> | null | undefined) =>
  (value ?? []).filter((entry): entry is string => typeof entry === 'string' && entry.trim() !== '')

/** Sensible starting point for a brand new project. */
export const NEW_PROJECT_VALUES: AdminFormValues = {
  name: '',
  slug: '',
  // Matches the Sanity schema's initial value: a project starts as an idea.
  status: 'idea',
  shortDescription: '',
  experienceLevel: 'any',
  noExperienceRequired: '',
  techStack: '',
  learningOutcomes: '',
  lead: '',
  mentors: [],
  contributors: [],
  githubUrl: '',
  demoUrl: '',
  discussionUrl: '',
  currentFocus: '',
  latestMilestone: '',
  startedAt: '',
  completedAt: '',
  featured: '',
  coverImageAlt: '',
}

export function projectToFormValues(project: EditableProject): AdminFormValues {
  return {
    name: text(project.name),
    slug: text(project.slug),
    status: text(project.status) || 'idea',
    shortDescription: text(project.shortDescription),
    experienceLevel: text(project.experienceLevel) || 'any',
    noExperienceRequired: checkbox(project.noExperienceRequired),
    // Comma separated: technology names are short labels.
    techStack: strings(project.techStack).join(', '),
    // One per line: outcomes are sentences and may contain commas.
    learningOutcomes: strings(project.learningOutcomes).join('\n'),
    lead: text(project.leadId),
    mentors: ids(project.mentorIds),
    contributors: ids(project.contributorIds),
    githubUrl: text(project.githubUrl),
    demoUrl: text(project.demoUrl),
    discussionUrl: text(project.discussionUrl),
    currentFocus: text(project.currentFocus),
    latestMilestone: text(project.latestMilestone),
    startedAt: text(project.startedAt),
    completedAt: text(project.completedAt),
    featured: checkbox(project.featured),
    coverImageAlt: text(project.coverImageAlt),
  }
}

/** The open-role rows the repeating editor renders. */
export function projectToOpenRoleRows(project: EditableProject): RowValues[] {
  return (project.openRoles ?? [])
    .filter((role): role is EditableOpenRole => Boolean(role))
    .map((role) => ({
      title: text(role.title),
      description: text(role.description),
      experienceLevel: text(role.experienceLevel) || 'any',
      learningOutcome: text(role.learningOutcome),
    }))
}

/**
 * Rebuilds the open-role rows from a rejected submission.
 *
 * Without this, a validation failure anywhere on the form would empty the open
 * roles editor and the officer would retype every one of them.
 */
export function openRoleRowsFromValues(values: AdminFormValues): RowValues[] {
  const column = (key: string) => {
    const value = values[key]
    return Array.isArray(value) ? value : []
  }

  const titles = column('openRoleTitle')
  const descriptions = column('openRoleDescription')
  const levels = column('openRoleExperienceLevel')
  const outcomes = column('openRoleLearningOutcome')

  return titles.map((title, index) => ({
    title,
    description: descriptions[index] ?? '',
    experienceLevel: levels[index] || 'any',
    learningOutcome: outcomes[index] ?? '',
  }))
}
