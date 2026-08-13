import assert from 'node:assert/strict'
import { test } from 'node:test'

import { eventInputSchema, fieldErrorsFrom, parseEventForm } from './input-schema.ts'

/**
 * Validation is the boundary between an officer's typing and the Content Lake.
 * A Server Action is reachable by direct POST, so these rules — not the form
 * markup — are what actually protects the data.
 */

const valid = {
  title: 'Intro to Git',
  slug: '',
  status: 'scheduled',
  eventType: 'workshop',
  startsAt: '2026-09-04T18:00',
  endsAt: '2026-09-04T20:00',
  locationType: 'inPerson',
  place: 'Holmes Hall 214',
  onlineUrl: '',
  directions: '',
  summary: 'A hands-on introduction to version control with Git and GitHub.',
  experienceLevel: 'any',
  noExperienceRequired: 'on',
  prerequisites: '',
  topics: 'git, github',
  registrationUrl: '',
  communityUrl: '',
  recap: '',
  featured: undefined,
  presenters: [] as string[],
}

const parse = (overrides: Partial<typeof valid> = {}) =>
  eventInputSchema.safeParse({ ...valid, ...overrides })

const errors = (overrides: Partial<typeof valid> = {}) => {
  const result = parse(overrides)
  assert.equal(result.success, false, 'expected the input to be rejected')
  return fieldErrorsFrom(result.error)
}

test('a complete event is accepted and normalised', () => {
  const result = parse()
  assert.equal(result.success, true)

  const data = result.data!
  // Club-time input is stored as a UTC instant.
  assert.equal(data.startsAt, '2026-09-04T22:00:00.000Z')
  assert.equal(data.endsAt, '2026-09-05T00:00:00.000Z')
  assert.deepEqual(data.topics, ['git', 'github'])
  assert.equal(data.noExperienceRequired, true)
  // An unchecked checkbox submits nothing at all.
  assert.equal(data.featured, false)
  assert.equal(data.slug, undefined)
})

test('a title is required and bounded', () => {
  assert.match(errors({ title: '' }).title ?? '', /at least 3/)
  assert.match(errors({ title: 'a'.repeat(200) }).title ?? '', /under 120/)
})

test('a summary is required so events are not empty on the site', () => {
  assert.ok(errors({ summary: '' }).summary)
  assert.match(errors({ summary: 'x'.repeat(400) }).summary ?? '', /under 300/)
})

test('status and event type must be values the schema knows', () => {
  assert.ok(errors({ status: 'published' }).status)
  assert.ok(errors({ eventType: 'party' }).eventType)
  assert.ok(errors({ experienceLevel: 'expert' }).experienceLevel)
  assert.ok(errors({ locationType: 'teleport' }).locationType)
})

test('the start date must be a real date and time', () => {
  assert.ok(errors({ startsAt: '' }).startsAt)
  assert.ok(errors({ startsAt: '2026-02-31T18:00' }).startsAt)
  assert.ok(errors({ startsAt: 'next tuesday' }).startsAt)
})

test('an event cannot end before it starts', () => {
  assert.match(
    errors({ startsAt: '2026-09-04T18:00', endsAt: '2026-09-04T17:00' }).endsAt ?? '',
    /cannot be before/,
  )
  // Equal start and end is allowed.
  assert.equal(parse({ endsAt: valid.startsAt }).success, true)
  // No end time at all is allowed.
  assert.equal(parse({ endsAt: '' }).success, true)
})

test('in-person events need a room and online events need a link', () => {
  assert.ok(errors({ locationType: 'inPerson', place: '' }).place)
  assert.ok(errors({ locationType: 'online', place: '', onlineUrl: '' }).onlineUrl)

  const hybrid = errors({ locationType: 'hybrid', place: '', onlineUrl: '' })
  assert.ok(hybrid.place)
  assert.ok(hybrid.onlineUrl)

  assert.equal(
    parse({ locationType: 'online', place: '', onlineUrl: 'https://fgcu.zoom.us/j/123' }).success,
    true,
  )
})

test('URLs are optional but must be real when present', () => {
  assert.ok(errors({ registrationUrl: 'not a url' }).registrationUrl)
  assert.ok(errors({ communityUrl: 'javascript:alert(1)' }).communityUrl)
  assert.equal(parse({ registrationUrl: 'https://forms.gle/abc' }).success, true)
  assert.equal(parse({ registrationUrl: '' }).success, true)
})

test('a slug override must be URL safe', () => {
  assert.ok(errors({ slug: '!!!' }).slug)
  assert.equal(parse({ slug: 'intro-to-git' }).success, true)
})

test('lists are split, trimmed and de-duplicated', () => {
  const result = parse({ topics: 'git, , github,git', prerequisites: 'A laptop\n\nGit installed' })
  assert.equal(result.success, true)
  assert.deepEqual(result.data!.topics, ['git', 'github'])
  assert.deepEqual(result.data!.prerequisites, ['A laptop', 'Git installed'])
})

test('presenter ids are structurally validated', () => {
  assert.equal(parse({ presenters: ['person-abc', 'drafts.person-abc'] }).success, true)
  assert.ok(errors({ presenters: ['*[_type=="event"]'] }).presenters)
})

test('parseEventForm reads the real form field names', () => {
  const formData = new FormData()
  for (const [key, value] of Object.entries(valid)) {
    if (value === undefined || Array.isArray(value)) continue
    formData.set(key, value)
  }
  formData.append('presenters', 'person-1')

  const result = parseEventForm(formData)
  assert.equal(result.success, true)
  assert.equal(result.data!.title, 'Intro to Git')
  assert.deepEqual(result.data!.presenters, ['person-1'])
  // `featured` was never appended, exactly as an unchecked box behaves.
  assert.equal(result.data!.featured, false)
})

test('only the first message per field is reported', () => {
  const result = parse({ title: '', summary: '' })
  assert.equal(result.success, false)
  const fields = fieldErrorsFrom(result.error)
  assert.equal(Object.keys(fields).length, 2)
})
