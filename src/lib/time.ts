/**
 * Club time.
 *
 * CSSEC events happen at FGCU, so officers think in one timezone and one only.
 * The rule for the whole codebase:
 *
 * - **Stored** in Sanity as a UTC ISO-8601 instant (`datetime` fields).
 * - **Entered and displayed** as `America/New_York` wall-clock time.
 *
 * Nothing else may hard-code a timezone: import `CLUB_TIME_ZONE` from here.
 * Conversion uses `Intl` only — no date library, and no naive
 * `new Date("2026-09-04T18:00")` parsing, which would silently interpret the
 * value in the *server's* timezone and move a 6:00 PM event to another hour
 * (or another day) once deployed.
 *
 * This module is dependency-free so it runs in both Server Actions and the
 * browser, and is unit tested in `time.test.ts`.
 */

export const CLUB_TIME_ZONE = 'America/New_York'

/** Human label for the timezone, shown next to date inputs. */
export const CLUB_TIME_ZONE_LABEL = 'Fort Myers time (America/New_York)'

const LOCAL_INPUT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: CLUB_TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

type WallClock = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

/** The club-timezone wall-clock reading of an instant. */
function wallClockAt(instant: Date): WallClock {
  const parts = partsFormatter.formatToParts(instant)
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? '0')

  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour'),
    minute: read('minute'),
    second: read('second'),
  }
}

/** How far the club timezone is from UTC at a given instant, in milliseconds. */
function offsetMsAt(instant: Date): number {
  const wall = wallClockAt(instant)
  const asIfUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second)
  return asIfUtc - instant.getTime()
}

/** Rejects impossible calendar dates such as 2026-02-31, which `Date` rolls over. */
function isRealCalendarDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1) return false
  return day <= new Date(Date.UTC(year, month, 0)).getUTCDate()
}

const pad = (value: number) => String(value).padStart(2, '0')

/**
 * Converts a `<input type="datetime-local">` value ("2026-09-04T18:00") entered
 * in club time into the UTC ISO instant stored in Sanity.
 *
 * Returns `null` for anything that is not a real date/time, so callers can turn
 * it into a validation message rather than storing a wrong instant.
 */
export function clubInputToIso(value: string): string | null {
  const match = LOCAL_INPUT_PATTERN.exec(value.trim())
  if (!match) return null

  const [, y, mo, d, h, mi, s] = match
  const year = Number(y)
  const month = Number(mo)
  const day = Number(d)
  const hour = Number(h)
  const minute = Number(mi)
  const second = Number(s ?? '0')

  if (!isRealCalendarDate(year, month, day)) return null
  if (hour > 23 || minute > 59 || second > 59) return null

  const asIfUtc = Date.UTC(year, month - 1, day, hour, minute, second)

  // First guess using the offset at the nominal instant, then correct once: on a
  // DST changeover day the offset before and after the shift differ, and the
  // correct one is the offset *at the resulting instant*.
  const firstGuess = asIfUtc - offsetMsAt(new Date(asIfUtc))
  const correctedOffset = offsetMsAt(new Date(firstGuess))
  const instant = asIfUtc - correctedOffset

  return new Date(instant).toISOString()
}

/**
 * Converts a stored UTC instant back into the `datetime-local` value an officer
 * should see — i.e. the club-time wall clock, never the browser's timezone.
 */
export function isoToClubInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const instant = new Date(iso)
  if (Number.isNaN(instant.getTime())) return ''

  const wall = wallClockAt(instant)
  return `${wall.year}-${pad(wall.month)}-${pad(wall.day)}T${pad(wall.hour)}:${pad(wall.minute)}`
}

/** "Sep 4, 2026, 6:00 PM" in club time. */
export function formatClubDateTime(iso: string | null | undefined): string {
  if (!iso) return 'No date set'
  const instant = new Date(iso)
  if (Number.isNaN(instant.getTime())) return 'No date set'

  return instant.toLocaleString('en-US', {
    timeZone: CLUB_TIME_ZONE,
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

/** "Sep 4, 2026" in club time. */
export function formatClubDate(iso: string | null | undefined): string {
  if (!iso) return 'No date set'
  const instant = new Date(iso)
  if (Number.isNaN(instant.getTime())) return 'No date set'

  return instant.toLocaleDateString('en-US', {
    timeZone: CLUB_TIME_ZONE,
    dateStyle: 'medium',
  })
}

/** "6:00 PM" in club time. */
export function formatClubTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const instant = new Date(iso)
  if (Number.isNaN(instant.getTime())) return ''

  return instant.toLocaleTimeString('en-US', {
    timeZone: CLUB_TIME_ZONE,
    timeStyle: 'short',
  })
}

/** "Thu, Sep 18, 2026" in club time — the long form used on event pages. */
export function formatClubDateLong(iso: string | null | undefined): string {
  if (!iso) return 'Date to be announced'
  const instant = new Date(iso)
  if (Number.isNaN(instant.getTime())) return 'Date to be announced'

  return instant.toLocaleDateString('en-US', {
    timeZone: CLUB_TIME_ZONE,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** The three pieces of the stacked date block: `THU` / `18` / `SEP`. */
export type ClubDateParts = { weekday: string; day: string; month: string }

/**
 * Uppercase calendar parts in club time.
 *
 * The design's date blocks show the weekday and month as mono labels above and
 * below a large day number, so they are formatted separately rather than being
 * pulled apart from a combined string.
 */
export function formatClubDateParts(iso: string | null | undefined): ClubDateParts | null {
  if (!iso) return null
  const instant = new Date(iso)
  if (Number.isNaN(instant.getTime())) return null

  const format = (options: Intl.DateTimeFormatOptions) =>
    instant.toLocaleDateString('en-US', { timeZone: CLUB_TIME_ZONE, ...options })

  return {
    weekday: format({ weekday: 'short' }).toUpperCase(),
    day: format({ day: '2-digit' }),
    month: format({ month: 'short' }).toUpperCase(),
  }
}

/**
 * "6:00 – 7:30 PM" in club time, collapsing the shared meridiem.
 *
 * Falls back to the start time alone when an event has no end, and to an empty
 * string when it has no usable start — callers decide what to show instead.
 */
export function formatClubTimeRange(
  startIso: string | null | undefined,
  endIso?: string | null,
): string {
  const start = formatClubTime(startIso)
  if (!start) return ''

  const end = formatClubTime(endIso)
  if (!end) return start

  const [startClock, startMeridiem] = start.split(' ')
  const [, endMeridiem] = end.split(' ')

  // "6:00 – 7:30 PM" when both sides share AM/PM, "11:30 AM – 1:00 PM" when not.
  return startMeridiem === endMeridiem ? `${startClock} – ${end}` : `${start} – ${end}`
}
