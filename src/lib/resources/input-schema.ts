import { z } from 'zod'

// Relative, `.ts`-suffixed imports so this module runs unmodified under
// `node --test` as well as through the bundler — same convention as `src/auth`.
import {
  EXPERIENCE_LEVELS,
  RESOURCE_TYPES,
} from '../../sanity/schemaTypes/shared/options.ts'
import type { Resource } from '../../sanity/types.ts'
import {
  checkbox,
  optionalReferenceId,
  optionalSlug,
  optionalUrl,
  optionValue,
  referenceIdList,
  requiredCalendarDate,
  optionalCalendarDate,
  requiredText,
  stringList,
} from '../admin/fields.ts'

/**
 * Validation for resource input submitted from `/admin`.
 *
 * The one rule that is not a simple field check: a resource has to have
 * somewhere to go. The Sanity schema states it as a document-level rule
 * ("Add an uploaded file, an external URL or a GitHub URL"), and it is mirrored
 * here — but the admin knows something the schema does not, namely whether the
 * officer just attached a file, is removing the one that is stored, or is
 * leaving it alone. So the caller resolves that to a single boolean and passes
 * it in, rather than this module trying to guess from the form alone.
 */

type ResourceType = NonNullable<Resource['resourceType']>
type ExperienceLevel = NonNullable<Resource['experienceLevel']>

export const resourceInputSchema = z
  .object({
    title: requiredText(
      3,
      120,
      'Give the resource a title of at least 3 characters.',
      'Keep the title under 120 characters.',
    ),
    slug: optionalSlug,
    resourceType: optionValue<ResourceType>(RESOURCE_TYPES, 'Choose a resource type.'),
    description: requiredText(
      10,
      400,
      'Write a sentence or two saying what this is and who it is for.',
      'Keep the description under 400 characters.',
    ),
    topics: stringList(20, 'Keep it to 20 topics or fewer.'),
    experienceLevel: optionValue<ExperienceLevel>(EXPERIENCE_LEVELS, 'Choose an experience level.'),
    featured: checkbox,
    externalUrl: optionalUrl('Enter a full link starting with https://'),
    githubUrl: optionalUrl('Enter a full GitHub link starting with https://'),
    author: optionalReferenceId,
    event: optionalReferenceId,
    relatedResources: referenceIdList(10, 'Select up to 10 related resources.'),
    publishedAt: requiredCalendarDate('Add the date this was published.'),
    updatedAt: optionalCalendarDate('Enter a real review date.'),
    removeFile: checkbox,
    /**
     * Whether the saved document will end up with a file attached — resolved by
     * the Server Action from the upload, the removal checkbox and what is
     * already stored. Not a control on the form.
     */
    hasFile: z.boolean(),
  })
  .superRefine((input, ctx) => {
    // Mirrors the Sanity document-level rule. Reported against all three fields
    // so the message appears wherever the officer is looking.
    if (!input.hasFile && !input.externalUrl && !input.githubUrl) {
      for (const path of ['file', 'externalUrl', 'githubUrl'] as const) {
        ctx.addIssue({
          code: 'custom',
          path: [path],
          message: 'A resource needs somewhere to go: attach a file, or add a link or repository.',
        })
      }
    }

    // Calendar dates compare correctly as strings — `YYYY-MM-DD` sorts
    // chronologically — which is also how the Sanity rule is written.
    if (input.updatedAt && input.updatedAt < input.publishedAt) {
      ctx.addIssue({
        code: 'custom',
        path: ['updatedAt'],
        message: 'The review date cannot be before the published date.',
      })
    }
  })

export type ResourceInput = z.infer<typeof resourceInputSchema>

/** The raw form field names, used to echo input back after a failed submit. */
export const RESOURCE_FORM_FIELDS = [
  'title',
  'slug',
  'resourceType',
  'description',
  'topics',
  'experienceLevel',
  'featured',
  'externalUrl',
  'githubUrl',
  'author',
  'event',
  'publishedAt',
  'updatedAt',
] as const

/**
 * Parses a submitted form into validated resource input.
 *
 * `hasFile` is the caller's answer to "will this document have a file once the
 * save completes?" — see the note at the top of this module.
 */
export function parseResourceForm(formData: FormData, hasFile: boolean) {
  return resourceInputSchema.safeParse({
    title: formData.get('title') ?? '',
    slug: formData.get('slug') ?? '',
    resourceType: formData.get('resourceType') ?? '',
    description: formData.get('description') ?? '',
    topics: formData.get('topics') ?? '',
    experienceLevel: formData.get('experienceLevel') ?? '',
    featured: formData.get('featured'),
    externalUrl: formData.get('externalUrl') ?? '',
    githubUrl: formData.get('githubUrl') ?? '',
    author: formData.get('author') ?? '',
    event: formData.get('event') ?? '',
    relatedResources: formData.getAll('relatedResources').map(String),
    publishedAt: formData.get('publishedAt') ?? '',
    updatedAt: formData.get('updatedAt') ?? '',
    removeFile: formData.get('removeFile'),
    hasFile,
  })
}
