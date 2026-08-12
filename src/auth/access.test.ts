import assert from 'node:assert/strict'
import { test } from 'node:test'

import { decideAdminAccess } from './access.ts'
import { can } from './permissions.ts'
import { parseRole } from './roles.ts'

/**
 * Security regression tests for the `/admin` authorization decision.
 *
 * Run with `pnpm test` (Node's built-in test runner — no test stack to
 * install). `requireOfficer()` is a thin Clerk wrapper around this function,
 * so these cases cover the behaviour that matters.
 */

test('signed-out callers are sent to sign-in', () => {
  assert.deepEqual(decideAdminAccess({ userId: null, role: null }), { outcome: 'signed-out' })
})

test('a signed-out caller cannot be rescued by a role value', () => {
  // Defensive: role must never grant access without an authenticated session.
  assert.deepEqual(decideAdminAccess({ userId: null, role: 'admin' }), { outcome: 'signed-out' })
})

test('an authenticated user with no role is forbidden', () => {
  assert.deepEqual(decideAdminAccess({ userId: 'user_1', role: null }), {
    outcome: 'forbidden',
    userId: 'user_1',
  })
})

test('the officer role is accepted', () => {
  assert.deepEqual(decideAdminAccess({ userId: 'user_2', role: 'officer' }), {
    outcome: 'allowed',
    userId: 'user_2',
    role: 'officer',
  })
})

test('the admin role is accepted', () => {
  assert.deepEqual(decideAdminAccess({ userId: 'user_3', role: 'admin' }), {
    outcome: 'allowed',
    userId: 'user_3',
    role: 'admin',
  })
})

test('a capability an officer lacks is forbidden', () => {
  assert.deepEqual(decideAdminAccess({ userId: 'user_4', role: 'officer' }, 'officers:manage'), {
    outcome: 'forbidden',
    userId: 'user_4',
  })
  assert.equal(decideAdminAccess({ userId: 'user_5', role: 'admin' }, 'officers:manage').outcome, 'allowed')
})

test('unknown metadata values never become roles', () => {
  for (const value of ['Admin', 'president', '', null, undefined, 1, { role: 'admin' }]) {
    assert.equal(parseRole(value), null)
  }
  assert.equal(parseRole('admin'), 'admin')
  assert.equal(parseRole('officer'), 'officer')
})

test('no capability is granted without a role', () => {
  assert.equal(can(null, 'admin:access'), false)
  assert.equal(can(null, 'content:write'), false)
})
