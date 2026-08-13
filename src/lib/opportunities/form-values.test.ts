import assert from 'node:assert/strict'
import { test } from 'node:test'

import { newOpportunityValues, opportunityToFormValues } from './form-values.ts'

test('a stored posting round-trips into the values the form renders', () => {
  const values = opportunityToFormValues({
    title: 'Software Engineering Intern',
    organization: 'Gartner',
    opportunityType: 'internship',
    description: 'A summer internship on a platform team.',
    location: 'Fort Myers, FL',
    workArrangement: 'hybrid',
    applicationUrl: 'https://jobs.example.com/123',
    deadline: '2026-10-01',
    postedAt: '2026-09-01',
    skills: ['Python', 'SQL'],
    featured: true,
  })

  assert.equal(values.organization, 'Gartner')
  assert.equal(values.workArrangement, 'hybrid')
  assert.equal(values.skills, 'Python, SQL')
  assert.equal(values.featured, 'on')
  // Straight through, both directions: the date input and Sanity agree on the
  // format, so nothing is converted and nothing can shift a day.
  assert.equal(values.deadline, '2026-10-01')
  assert.equal(values.postedAt, '2026-09-01')
})

test('a rolling posting has an empty deadline control', () => {
  const values = opportunityToFormValues({ title: 'Research assistant' })

  assert.equal(values.deadline, '')
  // Not "null" or "undefined" leaking into the input.
  assert.equal(values.location, '')
  assert.equal(values.workArrangement, '')
})

test('a new posting defaults its posted date to today in club time', () => {
  const lateNight = new Date('2026-09-02T03:00:00Z')

  assert.equal(newOpportunityValues(lateNight).postedAt, '2026-09-01')
  assert.equal(newOpportunityValues(lateNight).deadline, '')
  assert.equal(newOpportunityValues(lateNight).opportunityType, 'internship')
})
