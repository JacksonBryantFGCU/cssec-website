import assert from 'node:assert/strict'
import { test } from 'node:test'

import { eventRemovalPolicy, hasStarted } from './delete-policy.ts'

const now = new Date('2026-06-01T12:00:00.000Z')
const future = '2026-07-01T22:00:00.000Z'
const past = '2026-05-01T22:00:00.000Z'

test('an upcoming event with no references may be deleted', () => {
  const policy = eventRemovalPolicy({ status: 'scheduled', startsAt: future, referenceCount: 0, now })
  assert.equal(policy.canHardDelete, true)
  assert.equal(policy.canCancel, true)
  assert.equal(policy.blockedReason, undefined)
})

test('an event that already happened is never hard-deletable from the admin', () => {
  const policy = eventRemovalPolicy({ status: 'scheduled', startsAt: past, referenceCount: 0, now })
  assert.equal(policy.canHardDelete, false)
  assert.match(policy.blockedReason ?? '', /already happened/)
})

test('a completed event is protected even if its date is somehow in the future', () => {
  const policy = eventRemovalPolicy({ status: 'completed', startsAt: future, referenceCount: 0, now })
  assert.equal(policy.canHardDelete, false)
  assert.match(policy.blockedReason ?? '', /history/)
})

test('references block deletion regardless of date', () => {
  const one = eventRemovalPolicy({ status: 'scheduled', startsAt: future, referenceCount: 1, now })
  assert.equal(one.canHardDelete, false)
  assert.match(one.blockedReason ?? '', /A resource links/)

  const many = eventRemovalPolicy({ status: 'scheduled', startsAt: future, referenceCount: 3, now })
  assert.match(many.blockedReason ?? '', /^3 resources link/)
})

test('an already cancelled event cannot be cancelled again', () => {
  const policy = eventRemovalPolicy({ status: 'cancelled', startsAt: future, referenceCount: 0, now })
  assert.equal(policy.canCancel, false)
  assert.equal(policy.canHardDelete, true)
})

test('a missing or unparseable start date counts as not started', () => {
  assert.equal(hasStarted(null, now), false)
  assert.equal(hasStarted('not a date', now), false)
  assert.equal(hasStarted(past, now), true)
  assert.equal(hasStarted(future, now), false)
})
