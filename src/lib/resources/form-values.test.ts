import assert from 'node:assert/strict'
import { test } from 'node:test'

import { newResourceValues, resourceToFormValues, todayInClubTime } from './form-values.ts'

test('a stored resource round-trips into the values the form renders', () => {
  const values = resourceToFormValues({
    title: 'Intro to Git slides',
    slug: 'intro-to-git-slides',
    resourceType: 'slides',
    description: 'The deck from the workshop.',
    topics: ['git', 'github'],
    experienceLevel: 'beginner',
    featured: true,
    externalUrl: 'https://example.com/deck',
    authorId: 'person-1',
    eventId: 'event-1',
    relatedResourceIds: ['resource-2'],
    publishedAt: '2026-02-04',
  })

  assert.equal(values.featured, 'on')
  assert.equal(values.topics, 'git, github')
  assert.equal(values.author, 'person-1')
  assert.equal(values.event, 'event-1')
  assert.deepEqual(values.relatedResources, ['resource-2'])
  // Straight through: the date input speaks the same YYYY-MM-DD Sanity stores.
  assert.equal(values.publishedAt, '2026-02-04')
  assert.equal(values.updatedAt, '')
})

test('missing fields become empty controls with usable select defaults', () => {
  const values = resourceToFormValues({})

  assert.equal(values.title, '')
  assert.equal(values.resourceType, 'workshop')
  assert.equal(values.experienceLevel, 'any')
  assert.equal(values.event, '')
  assert.deepEqual(values.relatedResources, [])
})

test('a new resource defaults its published date to today in club time', () => {
  // 04:00 UTC on Feb 5 is still Feb 4 in Fort Myers, which is the day an
  // officer uploading late at night would expect to see.
  const lateNight = new Date('2026-02-05T04:00:00Z')

  assert.equal(todayInClubTime(lateNight), '2026-02-04')
  assert.equal(newResourceValues(lateNight).publishedAt, '2026-02-04')
})

test('a new resource starts unfeatured with nothing attached', () => {
  const values = newResourceValues(new Date('2026-02-04T18:00:00Z'))

  assert.equal(values.featured, '')
  assert.equal(values.externalUrl, '')
  assert.equal(values.updatedAt, '')
})
