/**
 * What an officer may do to an event that should go away.
 *
 * Events are the club's institutional memory: a workshop from two years ago is
 * what proves the club has been running, and resources point back at it. So the
 * admin's *default* removal action is never destructive.
 *
 * V1 policy:
 *
 * | Situation                          | Offered in `/admin`            |
 * | ---------------------------------- | ------------------------------ |
 * | Event has not started yet          | Cancel, or permanently delete  |
 * | Event has started or is completed  | Cancel only — history is kept  |
 * | Anything referenced by a resource  | Cancel only — delete would break the link |
 *
 * "Cancel" sets `status: "cancelled"`, which the public queries already exclude
 * from upcoming events while keeping the record. Permanent deletion exists only
 * for the genuine case it is needed: an event created by mistake ten minutes
 * ago. Anything else stays available in `/studio` for a deliberate decision.
 *
 * Pure and side-effect free so it can be unit tested — see `delete-policy.test.ts`.
 */

export type EventRemovalFacts = {
  status?: string | null
  startsAt?: string | null
  /** Resources and other documents pointing at this event. */
  referenceCount: number
  /** Injected so the decision is testable without mocking the clock. */
  now?: Date
}

export type EventRemovalPolicy = {
  /** Whether `status` can still be moved to "cancelled". */
  canCancel: boolean
  /** Whether permanent deletion may be offered at all. */
  canHardDelete: boolean
  /** Officer-facing explanation when deletion is withheld. */
  blockedReason?: string
}

export function eventRemovalPolicy(facts: EventRemovalFacts): EventRemovalPolicy {
  const now = facts.now ?? new Date()
  const canCancel = facts.status !== 'cancelled'

  if (facts.referenceCount > 0) {
    return {
      canCancel,
      canHardDelete: false,
      blockedReason:
        facts.referenceCount === 1
          ? 'A resource links to this event. Remove that link first, or cancel the event instead.'
          : `${facts.referenceCount} resources link to this event. Remove those links first, or cancel the event instead.`,
    }
  }

  if (facts.status === 'completed') {
    return {
      canCancel,
      canHardDelete: false,
      blockedReason:
        'Completed events are part of the club’s history and cannot be deleted here. Cancel it instead, or delete it in the Advanced CMS.',
    }
  }

  const started = hasStarted(facts.startsAt, now)
  if (started) {
    return {
      canCancel,
      canHardDelete: false,
      blockedReason:
        'This event has already happened. Cancel it instead, or delete it in the Advanced CMS.',
    }
  }

  return { canCancel, canHardDelete: true }
}

/** True when the start time is in the past. An unset date counts as not started. */
export function hasStarted(startsAt: string | null | undefined, now: Date = new Date()): boolean {
  if (!startsAt) return false
  const start = new Date(startsAt)
  if (Number.isNaN(start.getTime())) return false
  return start.getTime() <= now.getTime()
}
