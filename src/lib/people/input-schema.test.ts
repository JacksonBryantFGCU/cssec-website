import assert from 'node:assert/strict'
import { test } from 'node:test'

import { fieldErrorsFrom, parseOfficerTermForm, parsePersonForm } from './input-schema.ts'

function personForm(values: Record<string, string> = {}): FormData {
  const data = new FormData()
  for (const [key, value] of Object.entries({ name: 'Jordan Rivera', ...values })) {
    data.set(key, value)
  }
  return data
}

function termForm(values: Record<string, string> = {}): FormData {
  const data = new FormData()
  const defaults: Record<string, string> = {
    person: 'person-1',
    position: 'President',
    term: '2025–2026',
    displayOrder: '10',
  }
  for (const [key, value] of Object.entries({ ...defaults, ...values })) data.set(key, value)
  return data
}

const personErrors = (data: FormData) => {
  const parsed = parsePersonForm(data)
  assert.equal(parsed.success, false)
  return parsed.success ? {} : fieldErrorsFrom(parsed.error)
}

const termErrors = (data: FormData) => {
  const parsed = parseOfficerTermForm(data)
  assert.equal(parsed.success, false)
  return parsed.success ? {} : fieldErrorsFrom(parsed.error)
}

test('a person needs only a name', () => {
  const parsed = parsePersonForm(personForm())

  assert.equal(parsed.success, true)
  assert.equal(parsed.success && parsed.data.name, 'Jordan Rivera')
  // Blank optionals become absent, so an update unsets them rather than storing
  // empty strings.
  assert.equal(parsed.success && parsed.data.email, undefined)
  assert.equal(parsed.success && parsed.data.shortBio, undefined)
})

test('a person without a name is rejected', () => {
  assert.ok(personErrors(personForm({ name: '' })).name)
  assert.ok(personErrors(personForm({ name: ' J ' })).name)
})

test('a person’s links and email are validated when present', () => {
  assert.ok(personErrors(personForm({ email: 'jordan@fgcu' })).email)
  assert.ok(personErrors(personForm({ githubUrl: 'github.com/jordan' })).githubUrl)
  assert.ok(personErrors(personForm({ linkedinUrl: 'javascript:alert(1)' })).linkedinUrl)

  const parsed = parsePersonForm(
    personForm({ email: 'jordan@eagle.fgcu.edu', websiteUrl: 'https://jordan.dev' }),
  )
  assert.equal(parsed.success, true)
})

test('an officer term needs a person, a position and a year', () => {
  assert.equal(parseOfficerTermForm(termForm()).success, true)

  assert.ok(termErrors(termForm({ person: '' })).person)
  assert.ok(termErrors(termForm({ position: '' })).position)
  assert.ok(termErrors(termForm({ term: '' })).term)
})

test('the academic year has to be two consecutive years', () => {
  assert.ok(termErrors(termForm({ term: '2025' })).term)
  assert.ok(termErrors(termForm({ term: 'Fall 2025' })).term)
  assert.ok(termErrors(termForm({ term: '2025–2027' })).term)
  // Backwards is a typo, not a term.
  assert.ok(termErrors(termForm({ term: '2026–2025' })).term)
})

test('a hyphen and an en dash are both accepted, and stored the same way', () => {
  for (const typed of ['2025-2026', '2025–2026', '2025 - 2026']) {
    const parsed = parseOfficerTermForm(termForm({ term: typed }))
    assert.equal(parsed.success, true, typed)
    // Normalised, so the list sorts and reads consistently.
    assert.equal(parsed.success && parsed.data.term, '2025–2026')
  }
})

test('a new term defaults to currently serving; an unchecked box does not', () => {
  const serving = parseOfficerTermForm(termForm({ isCurrent: 'on' }))
  assert.equal(serving.success && serving.data.isCurrent, true)

  // An unchecked checkbox submits nothing at all.
  const ended = parseOfficerTermForm(termForm())
  assert.equal(ended.success && ended.data.isCurrent, false)
})

test('display order falls back to the schema default and rejects nonsense', () => {
  const blank = parseOfficerTermForm(termForm({ displayOrder: '' }))
  assert.equal(blank.success && blank.data.displayOrder, 100)

  assert.ok(termErrors(termForm({ displayOrder: '-1' })).displayOrder)
  assert.ok(termErrors(termForm({ displayOrder: '1.5' })).displayOrder)
  assert.ok(termErrors(termForm({ displayOrder: 'first' })).displayOrder)
})

test('the person on a term must look like a document id', () => {
  assert.ok(termErrors(termForm({ person: '*[_type == "person"]' })).person)
  assert.equal(parseOfficerTermForm(termForm({ person: 'drafts.person-1' })).success, true)
})
