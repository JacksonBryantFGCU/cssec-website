import assert from 'node:assert/strict'
import { describe, it, test } from 'node:test'

import {
  clubInputToIso,
  formatCalendarDate,
  formatClubDateLong,
  formatClubDateParts,
  formatClubDateTime,
  formatClubTimeRange,
  isoToClubInput,
} from './time.ts'

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

test('the date block reads the club-time calendar day, not the UTC one', () => {
  // 2026-09-19 01:00 UTC is still Friday the 18th at 9pm in Fort Myers, so a
  // late event must not appear in the archive under the following day.
  assert.deepEqual(formatClubDateParts('2026-09-19T01:00:00.000Z'), {
    weekday: 'FRI',
    day: '18',
    month: 'SEP',
  })
  assert.equal(formatClubDateParts(null), null)
  assert.equal(formatClubDateParts('not a date'), null)
})

test('the long date names the weekday in club time', () => {
  assert.equal(formatClubDateLong('2026-09-18T22:00:00.000Z'), 'Fri, Sep 18, 2026')
  assert.equal(formatClubDateLong(undefined), 'Date to be announced')
})

test('a time range collapses a shared meridiem and keeps a crossing one', () => {
  assert.equal(
    formatClubTimeRange('2026-09-18T22:00:00.000Z', '2026-09-18T23:30:00.000Z'),
    '6:00 – 7:30 PM',
  )
  assert.equal(
    formatClubTimeRange('2026-09-18T15:30:00.000Z', '2026-09-18T17:00:00.000Z'),
    '11:30 AM – 1:00 PM',
  )
})

test('a time range degrades to the start alone, then to nothing', () => {
  assert.equal(formatClubTimeRange('2026-09-18T22:00:00.000Z', null), '6:00 PM')
  assert.equal(formatClubTimeRange(null, '2026-09-18T23:30:00.000Z'), '')
})

describe('formatCalendarDate', () => {
  it('keeps the stored day for a date-only field', () => {
    // The bug this prevents: reading `2026-01-15` as UTC midnight and then
    // rendering it in club time lands on the 14th.
    assert.equal(formatCalendarDate('2026-01-15'), 'Thu, Jan 15, 2026')
    assert.equal(formatCalendarDate('2026-08-01'), 'Sat, Aug 1, 2026')
  })

  it('is stable across the new-year boundary', () => {
    assert.equal(formatCalendarDate('2027-01-01'), 'Fri, Jan 1, 2027')
  })

  it('falls back to the instant formatter for a full datetime', () => {
    assert.equal(formatCalendarDate('2026-09-18T22:00:00.000Z'), formatClubDateLong('2026-09-18T22:00:00.000Z'))
  })

  it('renders nothing for a missing or malformed date', () => {
    assert.equal(formatCalendarDate(null), '')
    assert.equal(formatCalendarDate(undefined), '')
    assert.equal(formatCalendarDate(''), '')
  })
})
