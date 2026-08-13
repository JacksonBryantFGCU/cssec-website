import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  currentAcademicYear,
  newOfficerTermValues,
  officerTermToFormValues,
  personToFormValues,
} from './form-values.ts'

test('a stored person round-trips into the values the form renders', () => {
  const values = personToFormValues({
    name: 'Jordan Rivera',
    slug: 'jordan-rivera',
    shortBio: 'Senior, interested in distributed systems.',
    email: 'jordan@eagle.fgcu.edu',
    githubUrl: 'https://github.com/jordan',
    photoAlt: 'Jordan in front of a whiteboard',
  })

  assert.equal(values.name, 'Jordan Rivera')
  assert.equal(values.photoAlt, 'Jordan in front of a whiteboard')
  assert.equal(values.linkedinUrl, '')
})

test('the academic year runs from the fall semester', () => {
  // September is the start of a new year…
  assert.equal(currentAcademicYear(new Date('2025-09-15T12:00:00Z')), '2025–2026')
  // …August is too, since that is when the semester opens…
  assert.equal(currentAcademicYear(new Date('2025-08-01T12:00:00Z')), '2025–2026')
  // …and the spring semester still belongs to the year that began in the fall.
  assert.equal(currentAcademicYear(new Date('2026-03-01T12:00:00Z')), '2025–2026')
  assert.equal(currentAcademicYear(new Date('2026-07-31T12:00:00Z')), '2025–2026')
})

test('the academic year is read in club time', () => {
  // 03:00 UTC on Aug 1 is still July 31 in Fort Myers, so the year has not
  // rolled over yet.
  assert.equal(currentAcademicYear(new Date('2025-08-01T03:00:00Z')), '2024–2025')
})

test('a new term defaults to the current year and to serving', () => {
  const values = newOfficerTermValues(new Date('2025-09-15T12:00:00Z'))

  assert.equal(values.term, '2025–2026')
  assert.equal(values.isCurrent, 'on')
  assert.equal(values.displayOrder, '100')
  assert.equal(values.person, '')
})

test('a stored term round-trips, including a past one', () => {
  const values = officerTermToFormValues({
    personId: 'person-1',
    position: 'President',
    term: '2024–2025',
    isCurrent: false,
    displayOrder: 10,
  })

  assert.equal(values.person, 'person-1')
  assert.equal(values.isCurrent, '')
  assert.equal(values.displayOrder, '10')
})

test('a term with no display order falls back to the schema default', () => {
  assert.equal(officerTermToFormValues({ position: 'Treasurer' }).displayOrder, '100')
  // Zero is a real order and must not be replaced by the default.
  assert.equal(officerTermToFormValues({ displayOrder: 0 }).displayOrder, '0')
})
