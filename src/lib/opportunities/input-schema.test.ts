import assert from 'node:assert/strict'
import { test } from 'node:test'

import { fieldErrorsFrom } from '../admin/fields.ts'
import { deadlineStatus } from './deadline.ts'
import { parseOpportunityForm } from './input-schema.ts'

function form(values: Record<string, string> = {}): FormData {
  const data = new FormData()
  const defaults: Record<string, string> = {
    title: 'Software Engineering Intern',
    organization: 'Gartner',
    opportunityType: 'internship',
    description: 'A summer internship on a platform team, open to rising juniors and seniors.',
    applicationUrl: 'https://jobs.example.com/123',
    postedAt: '2026-09-01',
  }

  for (const [key, value] of Object.entries({ ...defaults, ...values })) data.set(key, value)

  return data
}

const errors = (data: FormData) => {
  const parsed = parseOpportunityForm(data)
  assert.equal(parsed.success, false)
  return parsed.success ? {} : fieldErrorsFrom(parsed.error)
}

test('a minimal posting is accepted', () => {
  const parsed = parseOpportunityForm(form())

  assert.equal(parsed.success, true)
  assert.equal(parsed.success && parsed.data.opportunityType, 'internship')
  assert.equal(parsed.success && parsed.data.featured, false)
  // Absent rather than empty: a missing deadline is a rolling application.
  assert.equal(parsed.success && parsed.data.deadline, undefined)
})

test('the required fields are required', () => {
  assert.ok(errors(form({ title: '' })).title)
  assert.ok(errors(form({ organization: '' })).organization)
  assert.ok(errors(form({ description: 'too short' })).description)
  assert.ok(errors(form({ opportunityType: 'volunteering' })).opportunityType)
  assert.ok(errors(form({ postedAt: '' })).postedAt)
})

test('the application link is required and must be a real http(s) URL', () => {
  assert.ok(errors(form({ applicationUrl: '' })).applicationUrl)
  assert.ok(errors(form({ applicationUrl: 'jobs.example.com' })).applicationUrl)
  assert.ok(errors(form({ applicationUrl: 'javascript:alert(1)' })).applicationUrl)
})

test('the work arrangement is optional but constrained when given', () => {
  assert.equal(parseOpportunityForm(form({ workArrangement: '' })).success, true)
  assert.equal(parseOpportunityForm(form({ workArrangement: 'remote' })).success, true)
  assert.ok(errors(form({ workArrangement: 'hybrid-ish' })).workArrangement)
})

test('a deadline is stored exactly as entered, with no timezone shift', () => {
  const parsed = parseOpportunityForm(form({ deadline: '2026-10-01' }))

  // This is the Phase 5 fix on the writing side: "closes Oct 1" must stay
  // Oct 1, not become Sep 30 because the server sits west of UTC.
  assert.equal(parsed.success && parsed.data.deadline, '2026-10-01')
})

test('impossible dates are rejected rather than rolled over', () => {
  assert.ok(errors(form({ deadline: '2026-02-30' })).deadline)
  assert.ok(errors(form({ deadline: '2026-13-01' })).deadline)
  assert.ok(errors(form({ postedAt: '10/01/2026' })).postedAt)
  // A real leap day is fine.
  assert.equal(parseOpportunityForm(form({ deadline: '2028-02-29' })).success, true)
})

test('a deadline before the posting date is rejected', () => {
  assert.match(
    errors(form({ postedAt: '2026-09-01', deadline: '2026-08-01' })).deadline,
    /cannot be before/,
  )
  // Same day is fine — a posting shared on its closing day.
  assert.equal(
    parseOpportunityForm(form({ postedAt: '2026-09-01', deadline: '2026-09-01' })).success,
    true,
  )
})

test('nothing about expiry is stored on the document', () => {
  const parsed = parseOpportunityForm(form({ deadline: '2020-01-01', postedAt: '2019-12-01' }))

  assert.equal(parsed.success, true)
  if (!parsed.success) return

  // A long-past deadline still validates and still saves: expiry is derived at
  // read time, so there is no `expired` or `daysLeft` field to keep in sync.
  const stored = Object.keys(parsed.data)
  assert.equal(stored.includes('expired'), false)
  assert.equal(stored.includes('daysLeft'), false)
})

test('what is stored and what the board says stay in step', () => {
  const parsed = parseOpportunityForm(form({ deadline: '2026-10-01' }))
  assert.equal(parsed.success, true)
  if (!parsed.success) return

  const status = deadlineStatus(parsed.data.deadline, new Date('2026-09-25T12:00:00Z'))
  assert.equal(status.expired, false)
  assert.equal(status.urgent, true)
  assert.equal(status.daysLeft, 6)

  const later = deadlineStatus(parsed.data.deadline, new Date('2026-10-02T12:00:00Z'))
  assert.equal(later.expired, true)
})

test('skills and majors are trimmed and de-duplicated', () => {
  const parsed = parseOpportunityForm(
    form({ skills: ' Python , SQL ,, python ', majors: 'Computer Science, Computer Science' }),
  )

  assert.deepEqual(parsed.success && parsed.data.skills, ['Python', 'SQL', 'python'])
  assert.deepEqual(parsed.success && parsed.data.majors, ['Computer Science'])
})
