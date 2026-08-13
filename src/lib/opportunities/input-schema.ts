import { z } from 'zod'

// Relative, `.ts`-suffixed imports so this module runs unmodified under
// `node --test` as well as through the bundler — same convention as `src/auth`.
import {
  OPPORTUNITY_TYPES,
  WORK_ARRANGEMENTS,
} from '../../sanity/schemaTypes/shared/options.ts'
import type { Opportunity } from '../../sanity/types.ts'
import {
  checkbox,
  optionalCalendarDate,
  optionalOptionValue,
  optionalText,
  optionValue,
  requiredCalendarDate,
  requiredText,
  requiredUrl,
  stringList,
} from '../admin/fields.ts'

/**
 * Validation for opportunity input submitted from `/admin`.
 *
 * The opportunity board stores only facts. There is no `expired` flag and no
 * `daysLeft` number to keep up to date — both are derived from `deadline` by
 * `@/lib/opportunities/deadline`, so a posting cannot rot into claiming
 * something untrue while nobody is looking.
 *
 * `deadline` and `postedAt` are Sanity `date` fields and are validated as
 * written. An application closing "2026-10-01" is open for the whole of October
 * 1st in Fort Myers; turning that into an instant here is what would move it a
 * day, which is the Phase 5 bug.
 */

type OpportunityType = NonNullable<Opportunity['opportunityType']>
type WorkArrangement = NonNullable<Opportunity['workArrangement']>

export const opportunityInputSchema = z
  .object({
    title: requiredText(
      3,
      120,
      'Give the posting a title of at least 3 characters.',
      'Keep the title under 120 characters.',
    ),
    organization: requiredText(
      2,
      120,
      'Add the company, lab or organizer.',
      'Keep the organization under 120 characters.',
    ),
    opportunityType: optionValue<OpportunityType>(OPPORTUNITY_TYPES, 'Choose a type.'),
    description: requiredText(
      20,
      600,
      'Write a short description of what this is.',
      'Keep the description under 600 characters.',
    ),
    location: optionalText(120, 'Keep the location under 120 characters.'),
    workArrangement: optionalOptionValue<WorkArrangement>(
      WORK_ARRANGEMENTS,
      'Choose how the work is done.',
    ),
    applicationUrl: requiredUrl('Add the application link, starting with https://'),
    deadline: optionalCalendarDate('Enter a real deadline date.'),
    postedAt: requiredCalendarDate('Add the date this was posted.'),
    skills: stringList(20, 'Keep it to 20 skills or fewer.'),
    majors: stringList(10, 'Keep it to 10 majors or fewer.'),
    featured: checkbox,
  })
  .superRefine((input, ctx) => {
    // Calendar dates compare correctly as strings — `YYYY-MM-DD` sorts
    // chronologically.
    if (input.deadline && input.deadline < input.postedAt) {
      ctx.addIssue({
        code: 'custom',
        path: ['deadline'],
        message: 'The deadline cannot be before the posting date.',
      })
    }
  })

export type OpportunityInput = z.infer<typeof opportunityInputSchema>

/** The raw form field names, used to echo input back after a failed submit. */
export const OPPORTUNITY_FORM_FIELDS = [
  'title',
  'organization',
  'opportunityType',
  'description',
  'location',
  'workArrangement',
  'applicationUrl',
  'deadline',
  'postedAt',
  'skills',
  'majors',
  'featured',
] as const

export function parseOpportunityForm(formData: FormData) {
  return opportunityInputSchema.safeParse({
    title: formData.get('title') ?? '',
    organization: formData.get('organization') ?? '',
    opportunityType: formData.get('opportunityType') ?? '',
    description: formData.get('description') ?? '',
    location: formData.get('location') ?? '',
    workArrangement: formData.get('workArrangement') ?? '',
    applicationUrl: formData.get('applicationUrl') ?? '',
    deadline: formData.get('deadline') ?? '',
    postedAt: formData.get('postedAt') ?? '',
    skills: formData.get('skills') ?? '',
    majors: formData.get('majors') ?? '',
    featured: formData.get('featured'),
  })
}
