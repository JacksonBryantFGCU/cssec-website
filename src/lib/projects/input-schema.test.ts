import assert from 'node:assert/strict'
import { test } from 'node:test'

import { fieldErrorsFrom, rowErrorsFrom } from '../admin/fields.ts'
import { MAX_OPEN_ROLES, OPEN_ROLE_FIELDS, parseProjectForm } from './input-schema.ts'

/**
 * These run against the same `parseProjectForm` the Server Action calls, so a
 * case that passes here is a case the action would accept from a raw POST.
 */

function form(values: Record<string, string | string[]> = {}): FormData {
  const data = new FormData()
  const defaults: Record<string, string> = {
    name: 'Club Scheduling App',
    status: 'idea',
    shortDescription: 'A scheduling tool for club events, built by students.',
    experienceLevel: 'any',
  }

  for (const [key, value] of Object.entries({ ...defaults, ...values })) {
    if (Array.isArray(value)) for (const entry of value) data.append(key, entry)
    else data.set(key, value)
  }

  return data
}

/** Appends one open-role row's worth of controls. */
function addRole(
  data: FormData,
  row: { title?: string; description?: string; experienceLevel?: string; learningOutcome?: string } = {},
): FormData {
  data.append(OPEN_ROLE_FIELDS.title, row.title ?? 'Frontend contributor')
  data.append(OPEN_ROLE_FIELDS.description, row.description ?? '')
  data.append(OPEN_ROLE_FIELDS.experienceLevel, row.experienceLevel ?? 'beginner')
  data.append(OPEN_ROLE_FIELDS.learningOutcome, row.learningOutcome ?? '')
  return data
}

const errors = (data: FormData) => {
  const parsed = parseProjectForm(data)
  assert.equal(parsed.success, false)
  return parsed.success ? {} : fieldErrorsFrom(parsed.error)
}

test('a minimal project is accepted', () => {
  const parsed = parseProjectForm(form())

  assert.equal(parsed.success, true)
  if (!parsed.success) return

  assert.equal(parsed.data.name, 'Club Scheduling App')
  assert.equal(parsed.data.status, 'idea')
  assert.equal(parsed.data.featured, false)
  assert.deepEqual(parsed.data.techStack, [])
  assert.deepEqual(parsed.data.openRoles, [])
  assert.equal(parsed.data.slug, undefined)
})

test('the required fields are required', () => {
  assert.match(errors(form({ name: '' })).name, /at least 3/)
  assert.match(errors(form({ shortDescription: 'short' })).shortDescription, /one or two sentence/)
  assert.ok(errors(form({ status: 'in-progress' })).status)
  assert.ok(errors(form({ experienceLevel: 'wizard' })).experienceLevel)
})

test('links must be real http(s) URLs', () => {
  assert.ok(errors(form({ githubUrl: 'github.com/cssec' })).githubUrl)
  assert.ok(errors(form({ demoUrl: 'javascript:alert(1)' })).demoUrl)

  const parsed = parseProjectForm(form({ githubUrl: 'https://github.com/cssec/app' }))
  assert.equal(parsed.success && parsed.data.githubUrl, 'https://github.com/cssec/app')
})

test('technologies are trimmed and de-duplicated without being renamed', () => {
  const parsed = parseProjectForm(form({ techStack: ' Next.js , C++ ,, next.js , C# ' }))

  assert.equal(parsed.success, true)
  // "Next.js" and "next.js" are different strings and both are kept: silently
  // merging them would rename a technology the officer typed deliberately.
  assert.deepEqual(parsed.success && parsed.data.techStack, ['Next.js', 'C++', 'next.js', 'C#'])
})

test('learning outcomes keep their commas', () => {
  const parsed = parseProjectForm(
    form({ learningOutcomes: 'How to review a PR, end to end\n\nWriting tests' }),
  )

  assert.deepEqual(parsed.success && parsed.data.learningOutcomes, [
    'How to review a PR, end to end',
    'Writing tests',
  ])
})

test('open roles are read as rows and validated individually', () => {
  const data = form({ status: 'recruiting' })
  addRole(data, { title: 'Frontend contributor', description: 'Build the UI' })
  addRole(data, { title: '', description: 'No name on this one' })

  const parsed = parseProjectForm(data)
  assert.equal(parsed.success, false)
  if (parsed.success) return

  // The message names the offending row rather than the whole group.
  assert.deepEqual(rowErrorsFrom(parsed.error, 'openRoles'), {
    'openRoles.1': 'Give the role a name, or remove the row.',
  })
})

test('a row the officer added and never filled in is dropped, not rejected', () => {
  const data = form()
  addRole(data, { title: '', description: '', experienceLevel: '', learningOutcome: '' })

  const parsed = parseProjectForm(data)
  assert.equal(parsed.success, true)
  assert.deepEqual(parsed.success && parsed.data.openRoles, [])
})

test('a role row with no experience chosen defaults to "any"', () => {
  const data = form()
  addRole(data, { title: 'Designer', experienceLevel: '' })

  const parsed = parseProjectForm(data)
  assert.equal(parsed.success && parsed.data.openRoles[0].experienceLevel, 'any')
})

test('open roles are capped', () => {
  const data = form()
  for (let index = 0; index <= MAX_OPEN_ROLES; index += 1) {
    addRole(data, { title: `Role ${index}` })
  }

  assert.ok(errors(data).openRoles)
})

test('a recruiting project has to say what it is recruiting for', () => {
  assert.match(errors(form({ status: 'recruiting' })).openRoles, /at least one open role/)

  const data = form({ status: 'recruiting' })
  addRole(data)
  assert.equal(parseProjectForm(data).success, true)
})

test('a finished project records when it finished', () => {
  assert.ok(errors(form({ status: 'shipped', startedAt: '2026-01-15' })).completedAt)

  const parsed = parseProjectForm(
    form({ status: 'shipped', startedAt: '2026-01-15', completedAt: '2026-05-01' }),
  )
  assert.equal(parsed.success, true)
})

test('dates are stored exactly as the officer entered them', () => {
  const parsed = parseProjectForm(form({ startedAt: '2026-01-15' }))

  // No instant conversion anywhere on the path: a project that started on the
  // 15th must not become the 14th because the server sits west of UTC.
  assert.equal(parsed.success && parsed.data.startedAt, '2026-01-15')
})

test('the end date cannot precede the start date', () => {
  assert.match(
    errors(form({ startedAt: '2026-05-01', completedAt: '2026-01-15' })).completedAt,
    /cannot be before/,
  )
  assert.ok(errors(form({ startedAt: '2026-02-31' })).startedAt)
})

test('people are stored as ids, and the lead is not also a mentor', () => {
  const parsed = parseProjectForm(
    form({ lead: 'person-1', mentors: ['person-2', 'person-3'], contributors: ['person-4'] }),
  )

  assert.equal(parsed.success, true)
  assert.equal(parsed.success && parsed.data.lead, 'person-1')
  assert.deepEqual(parsed.success && parsed.data.mentors, ['person-2', 'person-3'])

  assert.match(errors(form({ lead: 'person-1', mentors: ['person-1'] })).mentors, /already listed/)
})

test('a reference that is not a document id is rejected', () => {
  assert.ok(errors(form({ mentors: ['*[_type == "person"]'] })).mentors)
  assert.ok(errors(form({ lead: 'person 1; drop' })).lead)
})

test('a custom slug is validated, and a blank one is left for the action to derive', () => {
  // Nothing usable survives slugification, so there is no URL to store.
  assert.ok(errors(form({ slug: '!!!' })).slug)
  assert.ok(errors(form({ slug: 'x'.repeat(200) })).slug)

  assert.equal(parseProjectForm(form({ slug: '' })).success, true)
  assert.equal(parseProjectForm(form({ slug: 'club-scheduling-app' })).success, true)
  // Typed loosely: the action slugifies it rather than refusing the save.
  assert.equal(parseProjectForm(form({ slug: 'Club Scheduling App' })).success, true)
})
