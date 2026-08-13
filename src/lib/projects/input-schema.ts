import { z } from 'zod'

// Relative, `.ts`-suffixed imports so this module runs unmodified under
// `node --test` as well as through the bundler — same convention as `src/auth`.
import {
  EXPERIENCE_LEVELS,
  PROJECT_STATUSES,
} from '../../sanity/schemaTypes/shared/options.ts'
import type { Project } from '../../sanity/types.ts'
import {
  checkbox,
  lineList,
  optionalCalendarDate,
  optionalReferenceId,
  optionalSlug,
  optionalText,
  optionalUrl,
  optionValue,
  referenceIdList,
  requiredText,
  stringList,
} from '../admin/fields.ts'
import { readRows, withoutBlankRows } from '../admin/rows.ts'

/**
 * Validation for project input submitted from `/admin`.
 *
 * The application's contract, deliberately separate from Sanity's own schema
 * validation: Sanity validates in the Studio UI, but a Server Action is
 * reachable by direct POST, so nothing may reach the Content Lake unvalidated.
 *
 * The unions below are derived from the generated document type, and the
 * allowed values from the shared option lists, so neither can drift from the
 * schema. Both imports are safe in a browser bundle — one is erased at build
 * time, the other is a dependency-free data module.
 */

type ProjectStatus = NonNullable<Project['status']>
type ExperienceLevel = NonNullable<Project['experienceLevel']>

/** The form field names one open role row contributes to. */
export const OPEN_ROLE_FIELDS = {
  title: 'openRoleTitle',
  description: 'openRoleDescription',
  experienceLevel: 'openRoleExperienceLevel',
  learningOutcome: 'openRoleLearningOutcome',
} as const

export const MAX_OPEN_ROLES = 12

const openRoleSchema = z.object({
  title: requiredText(
    2,
    120,
    'Give the role a name, or remove the row.',
    'Keep the role name under 120 characters.',
  ),
  description: optionalText(500, 'Keep the description under 500 characters.'),
  experienceLevel: optionValue<ExperienceLevel>(EXPERIENCE_LEVELS, 'Choose an experience level.'),
  learningOutcome: optionalText(300, 'Keep this under 300 characters.'),
})

export type OpenRoleInput = z.infer<typeof openRoleSchema>

export const projectInputSchema = z
  .object({
    name: requiredText(
      3,
      120,
      'Give the project a name of at least 3 characters.',
      'Keep the name under 120 characters.',
    ),
    slug: optionalSlug,
    status: optionValue<ProjectStatus>(PROJECT_STATUSES, 'Choose a status.'),
    shortDescription: requiredText(
      10,
      300,
      'Write a one or two sentence description.',
      'Keep the short description under 300 characters.',
    ),
    experienceLevel: optionValue<ExperienceLevel>(EXPERIENCE_LEVELS, 'Choose an experience level.'),
    noExperienceRequired: checkbox,
    techStack: stringList(30, 'Keep it to 30 technologies or fewer.'),
    learningOutcomes: lineList(20, 'Keep it to 20 outcomes or fewer.'),
    lead: optionalReferenceId,
    mentors: referenceIdList(10, 'Select up to 10 mentors.'),
    contributors: referenceIdList(40, 'Select up to 40 contributors.'),
    openRoles: z.array(openRoleSchema).max(MAX_OPEN_ROLES, `Keep it to ${MAX_OPEN_ROLES} open roles or fewer.`),
    githubUrl: optionalUrl('Enter a full GitHub link starting with https://'),
    demoUrl: optionalUrl('Enter a full demo link starting with https://'),
    discussionUrl: optionalUrl('Enter a full Discord or discussion link starting with https://'),
    currentFocus: optionalText(500, 'Keep the current focus under 500 characters.'),
    latestMilestone: optionalText(200, 'Keep the milestone under 200 characters.'),
    startedAt: optionalCalendarDate('Enter a real start date.'),
    completedAt: optionalCalendarDate('Enter a real end date.'),
    featured: checkbox,
    coverImageAlt: optionalText(200, 'Keep the alt text under 200 characters.'),
    removeCoverImage: checkbox,
  })
  .superRefine((input, ctx) => {
    // Calendar dates compare correctly as strings — `YYYY-MM-DD` sorts
    // chronologically — which is also how the Sanity rule is written.
    if (input.startedAt && input.completedAt && input.completedAt < input.startedAt) {
      ctx.addIssue({
        code: 'custom',
        path: ['completedAt'],
        message: 'The end date cannot be before the start date.',
      })
    }

    // A shipped or archived project claims to be finished, so it needs the date
    // that says when. This is the admin's rule rather than the schema's: Studio
    // has to stay able to record a half-known historical project.
    if (
      (input.status === 'shipped' || input.status === 'archived') &&
      !input.completedAt &&
      input.startedAt
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['completedAt'],
        message: 'Add the date this project shipped or was archived.',
      })
    }

    // Somebody has to be able to answer a student's question about a project
    // that is actively taking people.
    if (input.status === 'recruiting' && input.openRoles.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['openRoles'],
        message: 'A recruiting project needs at least one open role — or change the status.',
      })
    }

    if (input.lead && input.mentors.includes(input.lead)) {
      ctx.addIssue({
        code: 'custom',
        path: ['mentors'],
        message: 'The project lead is already listed — pick different mentors.',
      })
    }
  })

export type ProjectInput = z.infer<typeof projectInputSchema>

/** The raw form field names, used to echo input back after a failed submit. */
export const PROJECT_FORM_FIELDS = [
  'name',
  'slug',
  'status',
  'shortDescription',
  'experienceLevel',
  'noExperienceRequired',
  'techStack',
  'learningOutcomes',
  'lead',
  'githubUrl',
  'demoUrl',
  'discussionUrl',
  'currentFocus',
  'latestMilestone',
  'startedAt',
  'completedAt',
  'featured',
  'coverImageAlt',
] as const

/** Parses a submitted form into validated project input. */
export function parseProjectForm(formData: FormData) {
  const openRoles = withoutBlankRows(readRows(formData, OPEN_ROLE_FIELDS)).map((row) => ({
    ...row,
    // An unset select would otherwise fail the required option check on a row
    // the officer never opened.
    experienceLevel: row.experienceLevel || 'any',
  }))

  return projectInputSchema.safeParse({
    name: formData.get('name') ?? '',
    slug: formData.get('slug') ?? '',
    status: formData.get('status') ?? '',
    shortDescription: formData.get('shortDescription') ?? '',
    experienceLevel: formData.get('experienceLevel') ?? '',
    noExperienceRequired: formData.get('noExperienceRequired'),
    techStack: formData.get('techStack') ?? '',
    learningOutcomes: formData.get('learningOutcomes') ?? '',
    lead: formData.get('lead') ?? '',
    mentors: formData.getAll('mentors').map(String),
    contributors: formData.getAll('contributors').map(String),
    openRoles,
    githubUrl: formData.get('githubUrl') ?? '',
    demoUrl: formData.get('demoUrl') ?? '',
    discussionUrl: formData.get('discussionUrl') ?? '',
    currentFocus: formData.get('currentFocus') ?? '',
    latestMilestone: formData.get('latestMilestone') ?? '',
    startedAt: formData.get('startedAt') ?? '',
    completedAt: formData.get('completedAt') ?? '',
    featured: formData.get('featured'),
    coverImageAlt: formData.get('coverImageAlt') ?? '',
    removeCoverImage: formData.get('removeCoverImage'),
  })
}
