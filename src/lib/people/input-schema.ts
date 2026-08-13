import { z } from 'zod'

// Relative, `.ts`-suffixed imports so this module runs unmodified under
// `node --test` as well as through the bundler — same convention as `src/auth`.
import {
  checkbox,
  fieldErrorsFrom,
  optionalEmail,
  optionalSlug,
  optionalText,
  optionalUrl,
  requiredText,
} from '../admin/fields.ts'

export { fieldErrorsFrom }

/**
 * Validation for the two people-shaped documents `/admin` manages.
 *
 * A **person** is a public website record: a name, a photo, links. It is what
 * every credit on the site points at, which is why the same human is never
 * entered twice.
 *
 * An **officer term** is one person holding one position for one academic year.
 * It is a separate document precisely so leadership history survives turnover:
 * a new term is a new document, and last year's board is never overwritten by
 * this year's.
 *
 * Neither has anything to do with Clerk. Creating a person grants nobody access
 * to `/admin`, and ending an officer term removes nobody's login — see the
 * README.
 */

export const personInputSchema = z.object({
  name: requiredText(
    2,
    120,
    'Add the person’s name.',
    'Keep the name under 120 characters.',
  ),
  slug: optionalSlug,
  shortBio: optionalText(500, 'Keep the bio under 500 characters.'),
  email: optionalEmail('Enter a real email address, or leave it blank.'),
  githubUrl: optionalUrl('Enter a full GitHub link starting with https://'),
  linkedinUrl: optionalUrl('Enter a full LinkedIn link starting with https://'),
  websiteUrl: optionalUrl('Enter a full link starting with https://'),
  photoAlt: optionalText(200, 'Keep the alt text under 200 characters.'),
  removePhoto: checkbox,
})

export type PersonInput = z.infer<typeof personInputSchema>

export const PERSON_FORM_FIELDS = [
  'name',
  'slug',
  'shortBio',
  'email',
  'githubUrl',
  'linkedinUrl',
  'websiteUrl',
  'photoAlt',
] as const

export function parsePersonForm(formData: FormData) {
  return personInputSchema.safeParse({
    name: formData.get('name') ?? '',
    slug: formData.get('slug') ?? '',
    shortBio: formData.get('shortBio') ?? '',
    email: formData.get('email') ?? '',
    githubUrl: formData.get('githubUrl') ?? '',
    linkedinUrl: formData.get('linkedinUrl') ?? '',
    websiteUrl: formData.get('websiteUrl') ?? '',
    photoAlt: formData.get('photoAlt') ?? '',
    removePhoto: formData.get('removePhoto'),
  })
}

/**
 * An academic year, written the way the club writes it.
 *
 * Accepts an en dash or a hyphen, because both get typed, and requires the
 * second year to follow the first — "2026–2025" is a typo, and a term list
 * sorted by a nonsense value is worse than one that refused to save.
 */
const TERM_PATTERN = /^(\d{4})\s*[–-]\s*(\d{4})$/

export const officerTermInputSchema = z.object({
  person: z
    .string()
    .trim()
    .min(1, 'Choose the person holding this position.')
    .regex(/^[A-Za-z0-9._-]+$/, 'Unrecognised selection.'),
  position: requiredText(
    2,
    80,
    'Add the position, for example President.',
    'Keep the position under 80 characters.',
  ),
  term: z
    .string()
    .trim()
    .min(1, 'Add the academic year, for example 2025–2026.')
    .refine(
      (value) => {
        const match = TERM_PATTERN.exec(value)
        return match !== null && Number(match[2]) === Number(match[1]) + 1
      },
      { message: 'Write the academic year as two consecutive years, for example 2025–2026.' },
    )
    // Stored with an en dash whichever the officer typed, so the list sorts and
    // reads consistently.
    .transform((value) => value.replace(TERM_PATTERN, '$1–$2')),
  isCurrent: checkbox,
  displayOrder: z
    .string()
    .trim()
    .transform((value) => (value === '' ? 100 : Number(value)))
    .refine((value) => Number.isInteger(value) && value >= 0 && value <= 9999, {
      message: 'Use a whole number between 0 and 9999.',
    }),
})

export type OfficerTermInput = z.infer<typeof officerTermInputSchema>

export const OFFICER_TERM_FORM_FIELDS = ['person', 'position', 'term', 'displayOrder'] as const

export function parseOfficerTermForm(formData: FormData) {
  return officerTermInputSchema.safeParse({
    person: formData.get('person') ?? '',
    position: formData.get('position') ?? '',
    term: formData.get('term') ?? '',
    isCurrent: formData.get('isCurrent'),
    displayOrder: formData.get('displayOrder') ?? '',
  })
}
