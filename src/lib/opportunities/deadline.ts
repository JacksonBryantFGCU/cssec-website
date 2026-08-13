import { CLUB_TIME_ZONE } from '../time.ts'

/**
 * Deadline urgency, derived — never stored.
 *
 * The design shows "6 days left" in amber inside the fortnight and a plain
 * "Closes Oct 10" beyond it. Both are calculated here from the `deadline` date
 * on the document, so a page cached yesterday cannot claim the wrong number,
 * and an officer never has to remember to update a countdown by hand.
 *
 * `deadline` is a Sanity `date` (`YYYY-MM-DD`), not a datetime: an application
 * closing "Oct 1" is open for all of October 1st in Fort Myers.
 */

export type DeadlineStatus = {
  /** The mono label the design renders. */
  label: string
  /** Amber when the deadline is inside the fortnight. */
  urgent: boolean
  /** Whole days remaining; `null` for a rolling deadline. */
  daysLeft: number | null
  expired: boolean
}

/** Deadlines inside this many days are shown as urgent. */
export const URGENT_WITHIN_DAYS = 14

const MS_PER_DAY = 86_400_000
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: CLUB_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Today's date in club time, as a UTC-midnight instant for whole-day maths. */
function clubToday(now: Date): number {
  const [year, month, day] = dayFormatter.format(now).split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

/** "Oct 10" — the deadline's own calendar date, with no timezone shifting. */
function formatDeadlineDate(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
  })
}

export function deadlineStatus(
  deadline: string | null | undefined,
  now: Date = new Date(),
): DeadlineStatus {
  const match = deadline ? DATE_PATTERN.exec(deadline.trim()) : null

  // No deadline, or something that is not a date: the opportunity is rolling.
  if (!match) {
    return { label: 'Rolling', urgent: false, daysLeft: null, expired: false }
  }

  const [, y, m, d] = match
  const year = Number(y)
  const month = Number(m)
  const day = Number(d)

  const daysLeft = Math.round((Date.UTC(year, month - 1, day) - clubToday(now)) / MS_PER_DAY)

  if (daysLeft < 0) {
    return { label: 'Closed', urgent: false, daysLeft, expired: true }
  }
  if (daysLeft === 0) {
    return { label: 'Closes today', urgent: true, daysLeft, expired: false }
  }
  if (daysLeft === 1) {
    return { label: '1 day left', urgent: true, daysLeft, expired: false }
  }
  if (daysLeft <= URGENT_WITHIN_DAYS) {
    return { label: `${daysLeft} days left`, urgent: true, daysLeft, expired: false }
  }

  return {
    label: `Closes ${formatDeadlineDate(year, month, day)}`,
    urgent: false,
    daysLeft,
    expired: false,
  }
}
