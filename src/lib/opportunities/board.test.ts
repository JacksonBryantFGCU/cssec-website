import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { splitByUrgency } from './board.ts'

// Fixed "now" so the split is deterministic: 2026-08-13, club time.
const NOW = new Date('2026-08-13T16:00:00.000Z')

describe('splitByUrgency', () => {
  it('puts deadlines inside the fortnight in Closing soon', () => {
    const { closingSoon, later } = splitByUrgency(
      [{ _id: 'a', deadline: '2026-08-20' }, { _id: 'b', deadline: '2026-11-01' }],
      NOW,
    )

    assert.deepEqual(closingSoon.map((o) => o._id), ['a'])
    assert.deepEqual(later.map((o) => o._id), ['b'])
  })

  it('treats a rolling application as later, not urgent', () => {
    const { closingSoon, later } = splitByUrgency([{ _id: 'rolling', deadline: null }], NOW)

    assert.equal(closingSoon.length, 0)
    assert.deepEqual(later.map((o) => o._id), ['rolling'])
  })

  it('counts a deadline of today as closing soon', () => {
    const { closingSoon } = splitByUrgency([{ _id: 'today', deadline: '2026-08-13' }], NOW)
    assert.deepEqual(closingSoon.map((o) => o._id), ['today'])
  })

  it('does not put an expired listing at the top of the board', () => {
    // The query excludes these, but a stale cache could still hold one.
    const { closingSoon, later } = splitByUrgency([{ _id: 'gone', deadline: '2026-08-01' }], NOW)

    assert.equal(closingSoon.length, 0)
    assert.deepEqual(later.map((o) => o._id), ['gone'])
  })

  it('preserves the order the query returned within each group', () => {
    const { closingSoon } = splitByUrgency(
      [
        { _id: 'first', deadline: '2026-08-15' },
        { _id: 'second', deadline: '2026-08-14' },
      ],
      NOW,
    )

    assert.deepEqual(closingSoon.map((o) => o._id), ['first', 'second'])
  })

  it('handles an empty board', () => {
    const { closingSoon, later } = splitByUrgency([], NOW)
    assert.deepEqual(closingSoon, [])
    assert.deepEqual(later, [])
  })
})
