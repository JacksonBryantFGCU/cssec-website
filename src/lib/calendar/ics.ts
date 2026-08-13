/**
 * iCalendar generation for "Add to calendar".
 *
 * Served as a download from `/events/[slug]/calendar.ics`, which means the
 * button is a plain link and the public site needs no client JavaScript for it.
 *
 * No timezone logic lives here, on purpose. Sanity stores `startsAt` as a UTC
 * instant, and RFC 5545 accepts UTC directly with a trailing `Z`, so the
 * instant passes straight through and the user's own calendar renders it in
 * their local zone. Re-deriving `America/New_York` here would be a second
 * source of truth about club time — `@/lib/time` stays the only one.
 */

export type CalendarEvent = {
  uid: string
  title: string
  startsAt: string
  endsAt?: string | null
  description?: string | null
  location?: string | null
  url?: string | null
}

/** Default length for an event whose end time an officer has not filled in. */
const DEFAULT_DURATION_MS = 90 * 60 * 1000

/** RFC 5545 basic-format UTC stamp: `20260918T220000Z`. */
function toIcsStamp(instant: Date): string {
  return `${instant.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`
}

/**
 * Escapes a value for a text property.
 *
 * Backslash first, or it would escape the escapes added after it. Newlines
 * become the literal `\n` the format expects.
 */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n')
}

/**
 * Folds a line to the 75-octet limit.
 *
 * Long summaries and descriptions routinely exceed it, and calendar clients
 * are entitled to reject a file that does not fold. Continuation lines start
 * with a single space.
 */
function foldLine(line: string): string {
  if (line.length <= 75) return line

  const parts = [line.slice(0, 75)]
  let rest = line.slice(75)

  while (rest.length > 74) {
    parts.push(` ${rest.slice(0, 74)}`)
    rest = rest.slice(74)
  }
  if (rest.length > 0) parts.push(` ${rest}`)

  return parts.join('\r\n')
}

/**
 * Builds a single-event `VCALENDAR` document.
 *
 * Returns `null` when the event has no usable start — an event without a date
 * cannot be added to a calendar, and the caller renders no button rather than
 * offering a broken download.
 */
export function buildEventIcs(event: CalendarEvent): string | null {
  const start = new Date(event.startsAt)
  if (Number.isNaN(start.getTime())) return null

  const parsedEnd = event.endsAt ? new Date(event.endsAt) : null
  const end =
    parsedEnd && !Number.isNaN(parsedEnd.getTime()) && parsedEnd.getTime() > start.getTime()
      ? parsedEnd
      : new Date(start.getTime() + DEFAULT_DURATION_MS)

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CSSEC//FGCU Computer Science & Software Engineering Club//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    // Stamped now: clients use DTSTAMP to decide which copy of an event wins.
    `DTSTAMP:${toIcsStamp(new Date())}`,
    `DTSTART:${toIcsStamp(start)}`,
    `DTEND:${toIcsStamp(end)}`,
    `SUMMARY:${escapeText(event.title)}`,
  ]

  if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`)
  if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`)
  if (event.url) lines.push(`URL:${escapeText(event.url)}`)

  lines.push('END:VEVENT', 'END:VCALENDAR')

  // CRLF throughout, and a trailing one — required by the format.
  return `${lines.map(foldLine).join('\r\n')}\r\n`
}

/** A safe `filename.ics` for the download, derived from the event slug. */
export function icsFilename(slug: string): string {
  const safe = slug.replace(/[^a-z0-9-]/gi, '').toLowerCase()
  return `${safe || 'cssec-event'}.ics`
}
