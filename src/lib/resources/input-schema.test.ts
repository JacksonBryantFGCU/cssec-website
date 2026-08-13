import assert from 'node:assert/strict'
import { test } from 'node:test'

import { fieldErrorsFrom } from '../admin/fields.ts'
import { parseResourceForm } from './input-schema.ts'

function form(values: Record<string, string | string[]> = {}): FormData {
  const data = new FormData()
  const defaults: Record<string, string> = {
    title: 'Intro to Git slides',
    resourceType: 'slides',
    description: 'The deck from the Intro to Git workshop, with the demo commands.',
    experienceLevel: 'beginner',
    publishedAt: '2026-02-04',
  }

  for (const [key, value] of Object.entries({ ...defaults, ...values })) {
    if (Array.isArray(value)) for (const entry of value) data.append(key, entry)
    else data.set(key, value)
  }

  return data
}

const errors = (data: FormData, hasFile = true) => {
  const parsed = parseResourceForm(data, hasFile)
  assert.equal(parsed.success, false)
  return parsed.success ? {} : fieldErrorsFrom(parsed.error)
}

test('a resource with an uploaded file is accepted', () => {
  const parsed = parseResourceForm(form(), true)

  assert.equal(parsed.success, true)
  assert.equal(parsed.success && parsed.data.resourceType, 'slides')
  assert.equal(parsed.success && parsed.data.publishedAt, '2026-02-04')
})

test('a resource needs somewhere to go', () => {
  // No file, no link, no repository — nothing for a student to open.
  const withoutDestination = errors(form(), false)
  assert.match(withoutDestination.file, /somewhere to go/)
  // Reported on all three fields so the message is wherever the officer looks.
  assert.ok(withoutDestination.externalUrl)
  assert.ok(withoutDestination.githubUrl)

  assert.equal(parseResourceForm(form({ externalUrl: 'https://youtu.be/abc' }), false).success, true)
  assert.equal(
    parseResourceForm(form({ githubUrl: 'https://github.com/cssec/starter' }), false).success,
    true,
  )
})

test('a file already attached satisfies the destination rule on edit', () => {
  // `hasFile` is the caller's answer for the *saved* state, which is how an
  // edit that only changes the title keeps passing.
  assert.equal(parseResourceForm(form(), true).success, true)
})

test('links must be real http(s) URLs', () => {
  assert.ok(errors(form({ externalUrl: 'youtu.be/abc' })).externalUrl)
  assert.ok(errors(form({ githubUrl: 'javascript:alert(1)' })).githubUrl)
})

test('the required fields are required', () => {
  assert.ok(errors(form({ title: 'x' })).title)
  assert.ok(errors(form({ description: 'short' })).description)
  assert.ok(errors(form({ resourceType: 'podcast' })).resourceType)
  assert.ok(errors(form({ experienceLevel: '' })).experienceLevel)
  assert.ok(errors(form({ publishedAt: '' })).publishedAt)
})

test('dates are stored exactly as entered, and reviewed cannot precede published', () => {
  const parsed = parseResourceForm(form({ publishedAt: '2026-02-04', updatedAt: '2026-09-01' }), true)
  assert.equal(parsed.success && parsed.data.publishedAt, '2026-02-04')
  assert.equal(parsed.success && parsed.data.updatedAt, '2026-09-01')

  assert.match(
    errors(form({ publishedAt: '2026-09-01', updatedAt: '2026-02-04' })).updatedAt,
    /cannot be before/,
  )
  assert.ok(errors(form({ publishedAt: '2026-02-30' })).publishedAt)
})

test('the source event and author are stored as ids', () => {
  const parsed = parseResourceForm(
    form({ event: 'event-1', author: 'person-1', relatedResources: ['resource-2'] }),
    true,
  )

  assert.equal(parsed.success && parsed.data.event, 'event-1')
  assert.equal(parsed.success && parsed.data.author, 'person-1')
  assert.deepEqual(parsed.success && parsed.data.relatedResources, ['resource-2'])
})

test('a blank event means "not from an event", not an invalid reference', () => {
  const parsed = parseResourceForm(form({ event: '', author: '' }), true)

  assert.equal(parsed.success, true)
  assert.equal(parsed.success && parsed.data.event, undefined)
  assert.equal(parsed.success && parsed.data.author, undefined)
})

test('a reference that is not a document id is rejected', () => {
  assert.ok(errors(form({ event: '*[_type == "event"]' })).event)
  assert.ok(errors(form({ relatedResources: ['not an id'] })).relatedResources)
})

test('topics are trimmed and de-duplicated', () => {
  const parsed = parseResourceForm(form({ topics: ' git , github ,, git ' }), true)
  assert.deepEqual(parsed.success && parsed.data.topics, ['git', 'github'])
})
