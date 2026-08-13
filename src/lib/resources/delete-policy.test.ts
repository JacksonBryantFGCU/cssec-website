import assert from 'node:assert/strict'
import { test } from 'node:test'

import { resourceRemovalPolicy } from './delete-policy.ts'

test('an unreferenced resource can be deleted', () => {
  const policy = resourceRemovalPolicy({ referenceCount: 0 })

  assert.equal(policy.canHardDelete, true)
  assert.equal(policy.blockedReason, undefined)
})

test('a resource another resource lists as related is protected', () => {
  const one = resourceRemovalPolicy({ referenceCount: 1, relatedByCount: 1 })
  assert.equal(one.canHardDelete, false)
  assert.match(one.blockedReason ?? '', /Another resource lists this one as related/)

  const many = resourceRemovalPolicy({ referenceCount: 2, relatedByCount: 2 })
  assert.match(many.blockedReason ?? '', /^2 other resources/)
})

test('the related-resource message wins, because it names the fix', () => {
  const policy = resourceRemovalPolicy({ referenceCount: 3, relatedByCount: 1 })
  assert.match(policy.blockedReason ?? '', /related/)
})

test('any other referencing document blocks deletion too', () => {
  const policy = resourceRemovalPolicy({ referenceCount: 1, relatedByCount: 0 })

  assert.equal(policy.canHardDelete, false)
  assert.match(policy.blockedReason ?? '', /Another document links/)
})

test('pointing at an event does not block deletion', () => {
  // The resource references the event, not the other way round, so nothing
  // links *to* it and the count is zero.
  assert.equal(resourceRemovalPolicy({ referenceCount: 0, relatedByCount: 0 }).canHardDelete, true)
})
