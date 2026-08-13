import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  NEW_PROJECT_VALUES,
  openRoleRowsFromValues,
  projectToFormValues,
  projectToOpenRoleRows,
} from './form-values.ts'

test('a stored project round-trips into the values the form renders', () => {
  const values = projectToFormValues({
    name: 'Club Scheduling App',
    slug: 'club-scheduling-app',
    status: 'recruiting',
    shortDescription: 'A scheduling tool for club events.',
    experienceLevel: 'beginner',
    noExperienceRequired: true,
    techStack: ['TypeScript', 'Next.js'],
    learningOutcomes: ['How to review a PR, end to end'],
    leadId: 'person-1',
    mentorIds: ['person-2'],
    contributorIds: ['person-3', 'person-4'],
    startedAt: '2026-01-15',
    featured: false,
  })

  assert.equal(values.name, 'Club Scheduling App')
  assert.equal(values.noExperienceRequired, 'on')
  assert.equal(values.featured, '')
  assert.equal(values.techStack, 'TypeScript, Next.js')
  assert.equal(values.learningOutcomes, 'How to review a PR, end to end')
  assert.equal(values.lead, 'person-1')
  assert.deepEqual(values.mentors, ['person-2'])
  assert.deepEqual(values.contributors, ['person-3', 'person-4'])
})

test('a calendar date reaches the date input unchanged', () => {
  // `<input type="date">` speaks YYYY-MM-DD, which is what Sanity stores. Any
  // conversion here would move the day — the Phase 5 bug.
  const values = projectToFormValues({ startedAt: '2026-01-15', completedAt: '2026-05-01' })

  assert.equal(values.startedAt, '2026-01-15')
  assert.equal(values.completedAt, '2026-05-01')
})

test('missing fields become empty controls rather than "null"', () => {
  const values = projectToFormValues({})

  assert.equal(values.name, '')
  assert.equal(values.lead, '')
  assert.equal(values.techStack, '')
  assert.deepEqual(values.mentors, [])
  // Falls back to the schema's initial status so the select is never blank.
  assert.equal(values.status, 'idea')
  assert.equal(values.experienceLevel, 'any')
})

test('nulls inside stored arrays are dropped instead of becoming blank tags', () => {
  const values = projectToFormValues({
    techStack: ['TypeScript', null, '  '],
    mentorIds: ['person-1', null],
  })

  assert.equal(values.techStack, 'TypeScript')
  assert.deepEqual(values.mentors, ['person-1'])
})

test('a new project starts as an idea with nothing selected', () => {
  assert.equal(NEW_PROJECT_VALUES.status, 'idea')
  assert.deepEqual(NEW_PROJECT_VALUES.mentors, [])
  assert.equal(NEW_PROJECT_VALUES.featured, '')
})

test('stored open roles become editor rows', () => {
  const rows = projectToOpenRoleRows({
    openRoles: [
      { title: 'Frontend contributor', description: 'Build the UI', experienceLevel: 'beginner' },
      null,
      { title: 'API developer' },
    ],
  })

  assert.equal(rows.length, 2)
  assert.equal(rows[0].learningOutcome, '')
  // A role saved before the field existed still gets a usable select value.
  assert.equal(rows[1].experienceLevel, 'any')
})

test('a rejected submission rebuilds its own rows rather than losing them', () => {
  const rows = openRoleRowsFromValues({
    openRoleTitle: ['Frontend contributor', 'API developer'],
    openRoleDescription: ['Build the UI', ''],
    openRoleExperienceLevel: ['beginner', ''],
    openRoleLearningOutcome: ['React', 'REST'],
  })

  assert.deepEqual(rows, [
    {
      title: 'Frontend contributor',
      description: 'Build the UI',
      experienceLevel: 'beginner',
      learningOutcome: 'React',
    },
    { title: 'API developer', description: '', experienceLevel: 'any', learningOutcome: 'REST' },
  ])
})

test('a submission with no rows rebuilds to no rows', () => {
  assert.deepEqual(openRoleRowsFromValues({ name: 'Club Scheduling App' }), [])
})
