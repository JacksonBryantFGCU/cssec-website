import { z } from 'zod'

// Relative, `.ts`-suffixed imports so this module runs unmodified under
// `node --test` as well as through the bundler — same convention as `src/auth`.
import type { Option } from '../../sanity/schemaTypes/shared/options.ts'
import { isValidSlug, slugify, SLUG_MAX_LENGTH } from './slug.ts'

/**
 * The Zod vocabulary every admin module shares.
 *
 * Each content type keeps its own schema — a generic "document validator" would
 * make the rules for any one type impossible to read — but the *pieces* those
 * schemas are built from are identical: a select constrained to a shared option
 * list, an optional URL that must be real if present, an HTML checkbox, a
 * comma-or-newline list, a Sanity calendar date.
 *
 * These were extracted once Projects showed the same six shapes the Events form
 * had already needed. Nothing here knows about a document type.
 */

/** A required select, validated against the shared option list. */
export function optionValue<T extends string>(options: Option[], message: string) {
  const allowed = options.map((option) => option.value)
  return z.string().refine((value): value is T => allowed.includes(value), { message })
}

/** An optional select: blank is allowed, anything present must be in the list. */
export function optionalOptionValue<T extends string>(options: Option[], message: string) {
  const allowed = options.map((option) => option.value)
  return z
    .string()
    .trim()
    .transform((value) => value || undefined)
    .optional()
    .refine((value): value is T | undefined => value === undefined || allowed.includes(value), {
      message,
    })
}

/** Required free text with a length window. */
export const requiredText = (min: number, max: number, tooShort: string, tooLong: string) =>
  z.string().trim().min(min, tooShort).max(max, tooLong)

/** Optional free text: blank submits become `undefined`, not empty strings. */
export const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => value || undefined)
    .optional()

/** Optional URL. Blank is fine; anything present must be a real http(s) URL. */
export const optionalUrl = (message: string) =>
  z
    .string()
    .trim()
    .transform((value) => value || undefined)
    .optional()
    .refine((value) => value === undefined || /^https?:\/\/\S+$/.test(value), { message })

/** A URL the schema marks as required. */
export const requiredUrl = (message: string) =>
  z.string().trim().regex(/^https?:\/\/\S+$/, message)

/** Optional email, mirroring the Sanity `email()` rule. */
export const optionalEmail = (message: string) =>
  z
    .string()
    .trim()
    .transform((value) => value || undefined)
    .optional()
    .refine((value) => value === undefined || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), { message })

/** HTML checkboxes submit "on" when checked and nothing at all when not. */
export const checkbox = z
  .union([
    z.literal('on'),
    z.literal('true'),
    z.literal('false'),
    z.literal(''),
    z.undefined(),
    z.null(),
  ])
  .transform((value) => value === 'on' || value === 'true')

/** Comma- or newline-separated text becomes a trimmed, de-duplicated list. */
export const stringList = (max: number, message: string) =>
  z
    .string()
    .transform((value) =>
      Array.from(
        new Set(
          value
            .split(/[\n,]/)
            .map((entry) => entry.trim())
            .filter(Boolean),
        ),
      ),
    )
    .refine((list) => list.length <= max, { message })

/**
 * Newline-separated text becomes a list, keeping commas inside each entry.
 *
 * "What you'll learn" bullets are sentences — splitting them on commas would
 * shred them — so anything phrase-shaped uses this rather than `stringList`.
 */
export const lineList = (max: number, message: string) =>
  z
    .string()
    .transform((value) =>
      Array.from(
        new Set(
          value
            .split(/\r?\n/)
            .map((entry) => entry.trim())
            .filter(Boolean),
        ),
      ),
    )
    .refine((list) => list.length <= max, { message })

const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/** Rejects impossible calendar dates such as 2026-02-31, which `Date` rolls over. */
function isRealCalendarDate(value: string): boolean {
  const match = CALENDAR_DATE.exec(value)
  if (!match) return false

  const [, y, m, d] = match
  const year = Number(y)
  const month = Number(m)
  const day = Number(d)

  if (month < 1 || month > 12 || day < 1) return false
  return day <= new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/**
 * A Sanity `date` field: `YYYY-MM-DD`, stored and compared as written.
 *
 * Deliberately *not* passed through `Date` — a deadline of "2026-10-01" is the
 * whole of October 1st in Fort Myers, not midnight UTC. Turning it into an
 * instant is the bug fixed in Phase 5, and doing it here would reintroduce it
 * on the writing side.
 */
export const optionalCalendarDate = (message: string) =>
  z
    .string()
    .trim()
    .transform((value) => value || undefined)
    .optional()
    .refine((value) => value === undefined || isRealCalendarDate(value), { message })

export const requiredCalendarDate = (message: string) =>
  z.string().trim().refine(isRealCalendarDate, { message })

/** An optional officer-supplied slug, validated the way `slugify` would write it. */
export const optionalSlug = z
  .string()
  .trim()
  .max(SLUG_MAX_LENGTH, `Keep the URL under ${SLUG_MAX_LENGTH} characters.`)
  .transform((value) => value || undefined)
  .optional()
  .refine((value) => value === undefined || isValidSlug(slugify(value)), {
    message: 'Use letters, numbers and hyphens only.',
  })

/** A single Sanity document id, or `undefined` when nothing is selected. */
export const optionalReferenceId = z
  .string()
  .trim()
  .transform((value) => value || undefined)
  .optional()
  .refine((value) => value === undefined || /^[A-Za-z0-9._-]+$/.test(value), {
    message: 'Unrecognised selection.',
  })

/** Sanity document ids for a multi-select reference field. */
export const referenceIdList = (max: number, message: string) =>
  z
    .array(z.string().trim().regex(/^[A-Za-z0-9._-]+$/, 'Unrecognised selection.'))
    // A checkbox list cannot produce duplicates, but a hand-built POST can, and
    // Sanity rejects a reference array with repeated `_key`s.
    .transform((ids) => Array.from(new Set(ids)))
    .refine((ids) => ids.length <= max, { message })

/** Field-keyed messages, which is what a form needs to render errors inline. */
export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}

  for (const issue of error.issues) {
    const key = issue.path[0]
    const field = typeof key === 'string' ? key : '_form'
    // Keep the first message per field: showing three at once helps nobody.
    errors[field] ??= issue.message
  }

  return errors
}

/**
 * Per-row messages for an array-of-objects field, keyed `"<field>.<index>"`.
 *
 * `fieldErrorsFrom` deliberately keeps only `path[0]`, so an open role with a
 * missing title would otherwise report against the whole group and the officer
 * would have to guess which row. This walks one level further in and names the
 * offending row, without changing the flat behaviour every other field relies
 * on.
 */
export function rowErrorsFrom(error: z.ZodError, field: string): Record<string, string> {
  const errors: Record<string, string> = {}

  for (const issue of error.issues) {
    if (issue.path[0] !== field) continue
    const index = issue.path[1]
    if (typeof index !== 'number') continue

    errors[`${field}.${index}`] ??= issue.message
  }

  return errors
}

/** Reads a text control out of a submission, normalising the missing case. */
export function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '')
}
