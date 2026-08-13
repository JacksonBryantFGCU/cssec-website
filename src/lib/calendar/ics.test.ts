import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { buildEventIcs, icsFilename } from './ics.ts'

const base = {
  uid: 'event-1@cssec.fgcu',
  title: 'Git & GitHub, for real this time',
  startsAt: '2026-09-18T22:00:00.000Z',
  endsAt: '2026-09-18T23:30:00.000Z',
}

function lines(ics: string): string[] {
  return ics.split('\r\n')
}

describe('buildEventIcs', () => {
  it('emits a well-formed single-event calendar', () => {
    const ics = buildEventIcs(base)!
    const output = lines(ics)

    assert.equal(output[0], 'BEGIN:VCALENDAR')
    assert.equal(output.at(-2), 'END:VCALENDAR')
    assert.ok(ics.endsWith('\r\n'), 'must end with CRLF')
    assert.ok(output.includes('UID:event-1@cssec.fgcu'))
  })

  it('writes the stored instant as UTC, unshifted', () => {
    const ics = buildEventIcs(base)!
    assert.ok(lines(ics).includes('DTSTART:20260918T220000Z'))
    assert.ok(lines(ics).includes('DTEND:20260918T233000Z'))
  })

  it('gives an event with no end a default duration', () => {
    const ics = buildEventIcs({ ...base, endsAt: null })!
    assert.ok(lines(ics).includes('DTEND:20260918T233000Z'))
  })

  it('ignores an end that is not after the start', () => {
    const ics = buildEventIcs({ ...base, endsAt: '2026-09-18T21:00:00.000Z' })!
    assert.ok(lines(ics).includes('DTEND:20260918T233000Z'))
  })

  it('escapes commas, semicolons and newlines in text', () => {
    const ics = buildEventIcs({
      ...base,
      title: 'Docker; containers, images',
      description: 'Line one\nLine two',
    })!

    assert.ok(lines(ics).includes('SUMMARY:Docker\\; containers\\, images'))
    assert.ok(ics.includes('DESCRIPTION:Line one\\nLine two'))
  })

  it('folds lines past the 75-octet limit onto continuations', () => {
    const ics = buildEventIcs({ ...base, title: 'x'.repeat(200) })!

    for (const line of lines(ics)) {
      assert.ok(line.length <= 75, `line too long: ${line.length}`)
    }
    // A continuation line is marked by a single leading space.
    assert.ok(lines(ics).some((line) => line.startsWith(' ')))
  })

  it('omits optional properties rather than emitting empty ones', () => {
    const ics = buildEventIcs(base)!
    assert.ok(!ics.includes('LOCATION:'))
    assert.ok(!ics.includes('DESCRIPTION:'))
    assert.ok(!ics.includes('URL:'))
  })

  it('returns null for an unusable start, so no broken download is offered', () => {
    assert.equal(buildEventIcs({ ...base, startsAt: 'not a date' }), null)
    assert.equal(buildEventIcs({ ...base, startsAt: '' }), null)
  })
})

describe('icsFilename', () => {
  it('derives a safe filename from the slug', () => {
    assert.equal(icsFilename('git-and-github'), 'git-and-github.ics')
    assert.equal(icsFilename('../../etc/passwd'), 'etcpasswd.ics')
    assert.equal(icsFilename('///'), 'cssec-event.ics')
  })
})
