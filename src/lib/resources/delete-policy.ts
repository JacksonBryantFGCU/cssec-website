/**
 * What an officer may do to a resource that should go away.
 *
 * Resources are different from events and projects: they have no "cancelled" or
 * "archived" state to retreat to, because a resource *is* its content. So the
 * removal screen offers exactly one destructive action, and the interesting
 * question is when to withhold it.
 *
 * V1 policy:
 *
 * | Situation                                   | Offered in `/admin`          |
 * | ------------------------------------------- | ---------------------------- |
 * | Nothing links to it                         | Delete, with confirmation    |
 * | Another resource lists it as related        | Blocked — edit that resource first |
 * | Anything else references it                 | Blocked — remove the link first |
 *
 * Note what is deliberately *not* a reason to delete:
 *
 * - **Being attached to a past event.** The resource points at the event, not
 *   the other way round, so the link does not block deletion — but a workshop's
 *   slides are the most valuable thing the club produces, and the removal
 *   screen says so rather than making it a one-click tidy-up.
 * - **A dead external link.** A recording that has been taken down is still a
 *   record that the session happened. The fix is to edit the URL or attach the
 *   file, not to erase the entry — nothing in the admin deletes on that basis,
 *   automatically or otherwise.
 *
 * Pure and side-effect free so it can be unit tested.
 */

export type ResourceRemovalFacts = {
  /** Documents pointing at this resource. */
  referenceCount: number
  /** Other resources listing it under "related resources". */
  relatedByCount?: number
}

export type ResourceRemovalPolicy = {
  canHardDelete: boolean
  blockedReason?: string
}

export function resourceRemovalPolicy(facts: ResourceRemovalFacts): ResourceRemovalPolicy {
  const relatedBy = facts.relatedByCount ?? 0

  if (relatedBy > 0) {
    return {
      canHardDelete: false,
      blockedReason:
        relatedBy === 1
          ? 'Another resource lists this one as related. Remove that link first, or keep this resource.'
          : `${relatedBy} other resources list this one as related. Remove those links first, or keep this resource.`,
    }
  }

  if (facts.referenceCount > 0) {
    return {
      canHardDelete: false,
      blockedReason:
        facts.referenceCount === 1
          ? 'Another document links to this resource. Remove that link first, or keep this resource.'
          : `${facts.referenceCount} other documents link to this resource. Remove those links first, or keep this resource.`,
    }
  }

  return { canHardDelete: true }
}
