import assert from 'node:assert/strict'
import { test } from 'node:test'

import { clubInputToIso, formatClubDateTime, isoToClubInput } from './time.ts'

/**
 * Timezone regressions are silent and expensive: a wrong conversion moves a
 * real event by an hour or a day and nobody notices until people show up.
 */

test('an evening event during daylight saving time stores as UTC-4', () => {
  // 2026-09-04 18:00 EDT === 2026-09-04 22:00 UTC
  assert.equal(clubInputToIso('2026-09-04T18:00'), '2026-09-04T22:00:00.000Z')
})

test('an evening event during standard time stores as UTC-5', () => {
  // 2026-01-15 18:00 EST === 2026-01-15 23:00 UTC
  assert.equal(clubInputToIso('2026-01-15T18:00'), '2026-01-15T23:00:00.000Z')
})

test('a late evening event does not roll onto the next club day', () => {
  const iso = clubInputToIso('2026-09-04T21:30')
  assert.equal(iso, '2026-09-05T01:30:00.000Z')
  // Stored as the next UTC day, but must still read back as Sep 4 in club time.
  assert.equal(isoToClubInput(iso!), '2026-09-04T21:30')
})

test('club input survives a round trip in both DST states', () => {
  for (const value of ['2026-03-10T09:00', '2026-07-04T12:15', '2026-11-20T19:45']) {
    assert.equal(isoToClubInput(clubInputToIso(value)!), value)
  }
})

test('the day after the spring-forward transition is unaffected', () => {
  // 2026-03-08 is the US transition; 2026-03-09 18:00 is EDT (UTC-4).
  assert.equal(clubInputToIso('2026-03-09T18:00'), '2026-03-09T22:00:00.000Z')
})

test('impossible and malformed values are rejected rather than rolled over', () => {
  for (const value of ['2026-02-31T18:00', '2026-13-01T10:00', '2026-09-04T25:00', 'tomorrow', '', '2026-09-04']) {
    assert.equal(clubInputToIso(value), null, `expected ${value} to be rejected`)
  }
})

test('display helpers render in club time, not the runtime timezone', () => {
  // Independent of the machine running the tests.
  assert.equal(formatClubDateTime('2026-09-04T22:00:00.000Z'), 'Sep 4, 2026, 6:00 PM')
  assert.equal(formatClubDateTime(undefined), 'No date set')
  assert.equal(isoToClubInput(null), '')
})
