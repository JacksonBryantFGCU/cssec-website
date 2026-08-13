import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  eventLocationLabel,
  experienceLabel,
  experienceTone,
  isPastEvent,
  materialsLabel,
  presenterLabel,
  splitFeaturedEvent,
} from './view-model.ts'

describe('eventLocationLabel', () => {
  it('uses the room for an in-person event', () => {
    assert.equal(
      eventLocationLabel({ locationType: 'inPerson', place: 'Holmes Hall 112' }),
      'Holmes Hall 112',
    )
  })

  it('never shows a room for an online event', () => {
    assert.equal(
      eventLocationLabel({ locationType: 'online', place: 'Holmes Hall 112' }),
      'Online',
    )
  })

  it('says both for a hybrid event', () => {
    assert.equal(
      eventLocationLabel({ locationType: 'hybrid', place: 'Holmes Hall 112' }),
      'Holmes Hall 112 · also online',
    )
  })

  it('falls back rather than rendering an empty slot', () => {
    assert.equal(eventLocationLabel(null), 'Location to be announced')
    assert.equal(eventLocationLabel({ locationType: 'inPerson' }), 'Location to be announced')
    assert.equal(eventLocationLabel({ locationType: 'hybrid' }), 'Online')
  })
})

describe('experienceLabel', () => {
  it('lets the beginner flag win over the graded level', () => {
    assert.equal(
      experienceLabel({ experienceLevel: 'intermediate', noExperienceRequired: true }),
      'No experience required',
    )
  })

  it('names the level when some background is assumed', () => {
    assert.equal(
      experienceLabel({ experienceLevel: 'intermediate', noExperienceRequired: false }),
      'Intermediate',
    )
  })

  it('treats "any" and a missing level as open to everyone', () => {
    assert.equal(experienceLabel({ experienceLevel: 'any' }), 'Everyone welcome')
    assert.equal(experienceLabel({}), 'Everyone welcome')
  })
})

describe('experienceTone', () => {
  it('is beginner for the flag and for an open level', () => {
    assert.equal(experienceTone({ noExperienceRequired: true }), 'beginner')
    assert.equal(experienceTone({ experienceLevel: 'any' }), 'beginner')
    assert.equal(experienceTone({}), 'beginner')
  })

  it('is experienced once a level is assumed', () => {
    assert.equal(experienceTone({ experienceLevel: 'advanced' }), 'experienced')
  })
})

describe('presenterLabel', () => {
  it('joins one, two and many correctly', () => {
    assert.equal(presenterLabel([{ _id: 'a', name: 'Maya Rivera' }]), 'Maya Rivera')
    assert.equal(
      presenterLabel([
        { _id: 'a', name: 'Maya Rivera' },
        { _id: 'b', name: 'Devon Cole' },
      ]),
      'Maya Rivera and Devon Cole',
    )
    assert.equal(
      presenterLabel([
        { _id: 'a', name: 'Maya Rivera' },
        { _id: 'b', name: 'Devon Cole' },
        { _id: 'c', name: 'Aisha Nguyen' },
      ]),
      'Maya Rivera, Devon Cole and Aisha Nguyen',
    )
  })

  it('ignores presenters with no name rather than rendering a gap', () => {
    assert.equal(
      presenterLabel([{ _id: 'a', name: '  ' }, { _id: 'b', name: 'Maya Rivera' }]),
      'Maya Rivera',
    )
  })

  it('falls back when there are none', () => {
    assert.equal(presenterLabel([]), 'Presenter to be announced')
    assert.equal(presenterLabel(null), 'Presenter to be announced')
  })
})

describe('isPastEvent', () => {
  const now = new Date('2026-09-18T23:00:00Z')

  it('uses the end time, so an event running now is not yet archived', () => {
    assert.equal(
      isPastEvent({ startsAt: '2026-09-18T22:00:00Z', endsAt: '2026-09-18T23:30:00Z' }, now),
      false,
    )
  })

  it('is past once the end has gone by', () => {
    assert.equal(
      isPastEvent({ startsAt: '2026-09-18T21:00:00Z', endsAt: '2026-09-18T22:30:00Z' }, now),
      true,
    )
  })

  it('falls back to the start when there is no end', () => {
    assert.equal(isPastEvent({ startsAt: '2026-09-18T22:00:00Z' }, now), true)
    assert.equal(isPastEvent({ startsAt: '2026-09-19T22:00:00Z' }, now), false)
  })

  it('treats a missing or unparseable date as not past', () => {
    assert.equal(isPastEvent({}, now), false)
    assert.equal(isPastEvent({ startsAt: 'not a date' }, now), false)
  })
})

describe('materialsLabel', () => {
  it('counts materials on a finished session', () => {
    assert.equal(materialsLabel(1, true), '1 material')
    assert.equal(materialsLabel(6, true), '6 materials')
  })

  it('never says "0 materials"', () => {
    assert.equal(materialsLabel(0, true), 'Session details')
  })

  it('points at the preparation before the event', () => {
    assert.equal(materialsLabel(0, false), 'Setup steps')
    assert.equal(materialsLabel(3, false), 'Setup steps')
  })
})

describe('splitFeaturedEvent', () => {
  const a = { _id: 'a', featured: false }
  const b = { _id: 'b', featured: true }
  const c = { _id: 'c', featured: false }

  it('takes the soonest event when none is flagged', () => {
    const { featured, rest } = splitFeaturedEvent([a, c])
    assert.equal(featured, a)
    assert.deepEqual(rest, [c])
  })

  it('prefers an event an officer flagged', () => {
    const { featured, rest } = splitFeaturedEvent([a, b, c])
    assert.equal(featured, b)
    assert.deepEqual(rest, [a, c])
  })

  it('never repeats the featured event in the rest', () => {
    const { featured, rest } = splitFeaturedEvent([a, b, c])
    assert.ok(!rest.includes(featured!))
  })

  it('handles an empty schedule', () => {
    assert.deepEqual(splitFeaturedEvent([]), { featured: null, rest: [] })
  })
})
