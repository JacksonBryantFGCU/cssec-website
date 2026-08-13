import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { deadlineStatus } from './deadline.ts'

// 2026-09-18, mid-afternoon in Fort Myers (18:00 UTC = 14:00 EDT).
const now = new Date('2026-09-18T18:00:00Z')

describe('deadlineStatus', () => {
  it('treats a missing deadline as rolling', () => {
    for (const value of [null, undefined, '']) {
      const status = deadlineStatus(value, now)
      assert.equal(status.label, 'Rolling')
      assert.equal(status.daysLeft, null)
      assert.equal(status.urgent, false)
    }
  })

  it('counts whole days to the deadline', () => {
    assert.equal(deadlineStatus('2026-09-24', now).daysLeft, 6)
    assert.equal(deadlineStatus('2026-09-24', now).label, '6 days left')
  })

  it('turns amber inside the fortnight and not beyond it', () => {
    assert.equal(deadlineStatus('2026-10-02', now).urgent, true, '14 days is still urgent')
    assert.equal(deadlineStatus('2026-10-02', now).label, '14 days left')
    assert.equal(deadlineStatus('2026-10-03', now).urgent, false, '15 days is not')
    assert.equal(deadlineStatus('2026-10-03', now).label, 'Closes Oct 3')
  })

  it('says today and singular day rather than a bare number', () => {
    assert.equal(deadlineStatus('2026-09-18', now).label, 'Closes today')
    assert.equal(deadlineStatus('2026-09-19', now).label, '1 day left')
  })

  it('marks a passed deadline closed', () => {
    const status = deadlineStatus('2026-09-17', now)
    assert.equal(status.expired, true)
    assert.equal(status.label, 'Closed')
    assert.equal(status.urgent, false)
  })

  it('reads the deadline date literally, not shifted into another zone', () => {
    // Late evening UTC is still the same day in Fort Myers; the label must not
    // jump forward by one because the server happens to be on UTC.
    const lateUtc = new Date('2026-09-18T23:30:00Z')
    assert.equal(deadlineStatus('2026-09-18', lateUtc).label, 'Closes today')
  })

  it('formats a distant deadline as its own calendar date', () => {
    assert.equal(deadlineStatus('2026-11-01', now).label, 'Closes Nov 1')
  })

  it('falls back to rolling for anything that is not a date', () => {
    assert.equal(deadlineStatus('soon', now).label, 'Rolling')
  })
})
