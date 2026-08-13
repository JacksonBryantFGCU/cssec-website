import assert from 'node:assert/strict'
import { test } from 'node:test'

import { hasProjectWork, projectRemovalPolicy } from './delete-policy.ts'

/**
 * The policy the Server Action enforces. It is re-evaluated there against fresh
 * Sanity data, so these cases describe what the action will actually allow —
 * not just what the confirmation screen chooses to show.
 */

test('an idea nobody has built on can be deleted outright', () => {
  const policy = projectRemovalPolicy({ status: 'idea', referenceCount: 0 })

  assert.equal(policy.canArchive, true)
  assert.equal(policy.canHardDelete, true)
  assert.equal(policy.blockedReason, undefined)
})

test('a recruiting project with nothing behind it can still be deleted', () => {
  assert.equal(projectRemovalPolicy({ status: 'recruiting', referenceCount: 0 }).canHardDelete, true)
})

test('projects that have been worked on are history and are never deleted here', () => {
  for (const status of ['active', 'testing', 'shipped']) {
    const policy = projectRemovalPolicy({ status, referenceCount: 0 })

    assert.equal(policy.canHardDelete, false, status)
    assert.match(policy.blockedReason ?? '', /Archive it instead/)
    // Archiving stays available — the safe option is never withheld.
    assert.equal(policy.canArchive, true, status)
  }
})

test('an idea with a repository or a shipped date counts as real work', () => {
  const policy = projectRemovalPolicy({ status: 'idea', referenceCount: 0, hasWork: true })

  assert.equal(policy.canHardDelete, false)
  assert.match(policy.blockedReason ?? '', /repository, demo or end date/)
})

test('anything another document links to cannot be deleted', () => {
  const one = projectRemovalPolicy({ status: 'idea', referenceCount: 1 })
  assert.equal(one.canHardDelete, false)
  assert.match(one.blockedReason ?? '', /Another document links/)

  const many = projectRemovalPolicy({ status: 'idea', referenceCount: 3 })
  assert.match(many.blockedReason ?? '', /^3 other documents/)
})

test('references outrank status when explaining the refusal', () => {
  // Both rules block; the reference message is the one an officer can act on.
  const policy = projectRemovalPolicy({ status: 'shipped', referenceCount: 2 })
  assert.match(policy.blockedReason ?? '', /link to this project/)
})

test('an already archived project offers no second archive', () => {
  assert.equal(projectRemovalPolicy({ status: 'archived', referenceCount: 0 }).canArchive, false)
  // Archived ideas are still deletable — archiving is not a one-way trap.
  assert.equal(projectRemovalPolicy({ status: 'archived', referenceCount: 0 }).canHardDelete, true)
})

test('a project with no status at all is treated as an empty idea', () => {
  const policy = projectRemovalPolicy({ referenceCount: 0 })
  assert.equal(policy.canHardDelete, true)
})

test('evidence of work is read from the stored document', () => {
  assert.equal(hasProjectWork({}), false)
  assert.equal(hasProjectWork({ githubUrl: 'https://github.com/cssec/app' }), true)
  assert.equal(hasProjectWork({ demoUrl: 'https://demo.example.com' }), true)
  assert.equal(hasProjectWork({ completedAt: '2026-05-01' }), true)
  assert.equal(hasProjectWork({ githubUrl: null, demoUrl: null, completedAt: null }), false)
})
