import { deadlineStatus } from './deadline.ts'

/**
 * Grouping for the opportunity board.
 *
 * The design splits open listings into "Closing soon" and "Open" rather than
 * one long list, so a deadline two days away is not buried under a rolling
 * application. Where the line falls is `URGENT_WITHIN_DAYS` in `./deadline`,
 * the same threshold that decides whether the label reads urgently — the two
 * cannot disagree, because the split asks that module rather than re-deriving.
 */

export type DeadlineBearing = { deadline?: string | null }

export function splitByUrgency<T extends DeadlineBearing>(
  opportunities: readonly T[],
  now: Date = new Date(),
): { closingSoon: T[]; later: T[] } {
  const closingSoon: T[] = []
  const later: T[] = []

  for (const opportunity of opportunities) {
    const status = deadlineStatus(opportunity.deadline, now)
    // Expired listings are excluded by the query, but a stale cache could still
    // hold one — it belongs with the later group rather than shouting at the
    // top of the board.
    if (status.urgent && !status.expired) {
      closingSoon.push(opportunity)
    } else {
      later.push(opportunity)
    }
  }

  return { closingSoon, later }
}
