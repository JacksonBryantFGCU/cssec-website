import assert from 'node:assert/strict'
import { test } from 'node:test'

import { eventToFormValues, NEW_EVENT_VALUES } from './form-values.ts'
import { eventInputSchema } from './input-schema.ts'

test('a stored event becomes the values the form renders', () => {
  const values = eventToFormValues({
    title: 'Intro to Git',
    slug: 'intro-to-git',
    status: 'scheduled',
    eventType: 'workshop',
    // Stored UTC; must come back as 6:00 PM club time, not 10:00 PM.
    startsAt: '2026-09-04T22:00:00.000Z',
    endsAt: null,
    location: { locationType: 'inPerson', place: 'Holmes Hall 214' },
    summary: 'Version control from scratch.',
    experienceLevel: 'beginner',
    noExperienceRequired: true,
    prerequisites: ['A laptop'],
    topics: ['git', 'github'],
    featured: false,
    presenterIds: ['person-1', null],
  })

  assert.equal(values.startsAt, '2026-09-04T18:00')
  assert.equal(values.endsAt, '')
  assert.equal(values.place, 'Holmes Hall 214')
  assert.equal(values.topics, 'git, github')
  assert.equal(values.prerequisites, 'A laptop')
  assert.equal(values.noExperienceRequired, 'on')
  assert.equal(values.featured, '')
  assert.deepEqual(values.presenters, ['person-1'])
})

test('a sparse event still produces a complete, usable form', () => {
  const values = eventToFormValues({ title: 'Untitled' })

  assert.equal(values.status, 'scheduled')
  assert.equal(values.eventType, 'workshop')
  assert.equal(values.locationType, 'inPerson')
  assert.equal(values.experienceLevel, 'any')
  assert.equal(values.startsAt, '')
  assert.deepEqual(values.presenters, [])
})

test('the round trip through validation preserves an event unchanged', () => {
  const stored = {
    title: 'Intro to Git',
    slug: 'intro-to-git',
    status: 'scheduled',
    eventType: 'workshop',
    startsAt: '2026-09-04T22:00:00.000Z',
    endsAt: '2026-09-05T00:00:00.000Z',
    location: { locationType: 'inPerson', place: 'Holmes Hall 214' },
    summary: 'Version control from scratch, no experience needed.',
    experienceLevel: 'beginner' as const,
    noExperienceRequired: true,
    topics: ['git'],
  }

  const values = eventToFormValues(stored)
  const parsed = eventInputSchema.safeParse({ ...values, presenters: [] })

  assert.equal(parsed.success, true)
  // Editing and saving without touching anything must not move the event.
  assert.equal(parsed.data!.startsAt, stored.startsAt)
  assert.equal(parsed.data!.endsAt, stored.endsAt)
  assert.equal(parsed.data!.title, stored.title)
})

test('the defaults for a new event are themselves valid once filled in', () => {
  const parsed = eventInputSchema.safeParse({
    ...NEW_EVENT_VALUES,
    title: 'New workshop',
    summary: 'A summary long enough to pass validation.',
    startsAt: '2026-10-01T18:00',
    place: 'Holmes Hall 214',
  })

  assert.equal(parsed.success, true)
  assert.equal(parsed.data!.noExperienceRequired, true)
})
