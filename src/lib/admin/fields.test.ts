import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'

import {
  checkbox,
  fieldErrorsFrom,
  lineList,
  optionalCalendarDate,
  optionalEmail,
  optionalText,
  optionalUrl,
  optionValue,
  referenceIdList,
  requiredCalendarDate,
  rowErrorsFrom,
  stringList,
} from './fields.ts'

const LEVELS = [
  { title: 'Any', value: 'any' },
  { title: 'Beginner', value: 'beginner' },
]

test('a select only accepts values from the shared option list', () => {
  const schema = optionValue(LEVELS, 'Choose a level.')

  assert.equal(schema.safeParse('beginner').success, true)
  assert.equal(schema.safeParse('expert').success, false)
  // The Studio label is not a stored value.
  assert.equal(schema.safeParse('Beginner').success, false)
})

test('blank optional text becomes undefined, not an empty string', () => {
  const schema = optionalText(50, 'Too long.')

  assert.equal(schema.parse(''), undefined)
  assert.equal(schema.parse('   '), undefined)
  assert.equal(schema.parse('  hello  '), 'hello')
  assert.equal(schema.safeParse('x'.repeat(51)).success, false)
})

test('optional URLs are blank or genuinely http(s)', () => {
  const schema = optionalUrl('Enter a full link.')

  assert.equal(schema.parse(''), undefined)
  assert.equal(schema.parse('https://cssec.club/x'), 'https://cssec.club/x')
  assert.equal(schema.safeParse('cssec.club').success, false)
  assert.equal(schema.safeParse('javascript:alert(1)').success, false)
  assert.equal(schema.safeParse('ftp://files.example.com').success, false)
})

test('optional emails are blank or plausible addresses', () => {
  const schema = optionalEmail('Enter a real email address.')

  assert.equal(schema.parse(''), undefined)
  assert.equal(schema.parse('officer@eagle.fgcu.edu'), 'officer@eagle.fgcu.edu')
  assert.equal(schema.safeParse('officer@fgcu').success, false)
  assert.equal(schema.safeParse('not an address').success, false)
})

test('checkboxes read as booleans whether present or absent', () => {
  assert.equal(checkbox.parse('on'), true)
  assert.equal(checkbox.parse('true'), true)
  assert.equal(checkbox.parse(undefined), false)
  assert.equal(checkbox.parse(null), false)
  assert.equal(checkbox.parse(''), false)
  assert.equal(checkbox.parse('false'), false)
})

test('tag lists split on commas and newlines, trim and de-duplicate', () => {
  const schema = stringList(5, 'Too many.')

  assert.deepEqual(schema.parse('git, github\nversion control'), ['git', 'github', 'version control'])
  assert.deepEqual(schema.parse('  react ,, react , '), ['react'])
  assert.deepEqual(schema.parse(''), [])
  assert.equal(schema.safeParse('a,b,c,d,e,f').success, false)
})

test('sentence lists keep their commas', () => {
  const schema = lineList(5, 'Too many.')

  assert.deepEqual(schema.parse('How to review a PR, end to end\nWriting tests'), [
    'How to review a PR, end to end',
    'Writing tests',
  ])
})

test('technology names are not silently rewritten', () => {
  // A tag editor that "normalised" these would rename the technology.
  assert.deepEqual(stringList(10, '').parse('Next.js\nC++\nnode-fetch\nC#'), [
    'Next.js',
    'C++',
    'node-fetch',
    'C#',
  ])
})

test('calendar dates are validated as written, never as instants', () => {
  const optional = optionalCalendarDate('Enter a real date.')

  assert.equal(optional.parse(''), undefined)
  // The exact stored string comes back — no timezone shifting on the way in.
  assert.equal(optional.parse('2026-10-01'), '2026-10-01')
  assert.equal(optional.safeParse('2026-02-31').success, false)
  assert.equal(optional.safeParse('2026-13-01').success, false)
  assert.equal(optional.safeParse('10/01/2026').success, false)
  assert.equal(optional.safeParse('2026-10-01T00:00:00Z').success, false)

  assert.equal(requiredCalendarDate('Add a date.').safeParse('').success, false)
  assert.equal(requiredCalendarDate('Add a date.').parse('2024-02-29'), '2024-02-29')
})

test('reference id lists reject anything that is not a document id', () => {
  const schema = referenceIdList(3, 'Too many.')

  assert.deepEqual(schema.parse(['person-1', 'person-2']), ['person-1', 'person-2'])
  assert.deepEqual(schema.parse(['person-1', 'person-1']), ['person-1'])
  assert.equal(schema.safeParse(['*[_type=="person"]']).success, false)
  assert.equal(schema.safeParse(['a', 'b', 'c', 'd']).success, false)
})

test('one message per field is surfaced, keyed by the field name', () => {
  const schema = z.object({
    title: z.string().min(3, 'Too short.').max(5, 'Too long.'),
    summary: z.string().min(1, 'Add a summary.'),
  })

  const result = schema.safeParse({ title: '', summary: '' })
  assert.equal(result.success, false)

  const errors = fieldErrorsFrom(result.error)
  assert.equal(errors.title, 'Too short.')
  assert.equal(errors.summary, 'Add a summary.')
})

test('array rows report against their own row, not the whole group', () => {
  const schema = z.object({
    openRoles: z.array(z.object({ title: z.string().min(1, 'Add a role name.') })),
  })

  const result = schema.safeParse({ openRoles: [{ title: 'Lead' }, { title: '' }] })
  assert.equal(result.success, false)

  const rowErrors = rowErrorsFrom(result.error, 'openRoles')
  assert.deepEqual(rowErrors, { 'openRoles.1': 'Add a role name.' })
  // The flat map still points at the group, so the group heading marks itself.
  assert.equal(fieldErrorsFrom(result.error).openRoles, 'Add a role name.')
})
