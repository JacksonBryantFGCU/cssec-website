/**
 * What an officer may do to a project that should go away.
 *
 * Projects are institutional history. "We built and shipped a scheduling app in
 * 2026" is evidence the club does real work, it is what a graduating member puts
 * on a résumé, and it is what the next president inherits. Deleting that to tidy
 * a list is a loss the club cannot undo.
 *
 * So the admin's default removal action is `status: "archived"`, which keeps the
 * document and sinks it to the bottom of the public index. Permanent deletion
 * exists only for the case it is genuinely needed: an idea typed in by mistake
 * that nothing has been built on yet.
 *
 * V1 policy:
 *
 * | Situation                                  | Offered in `/admin`         |
 * | ------------------------------------------ | --------------------------- |
 * | Idea or recruiting, nothing linked to it   | Archive, or delete          |
 * | Active, testing or shipped                 | Archive only — real history |
 * | Referenced by any other document           | Archive only — delete would break the link |
 * | Has a repository, demo or shipped date     | Archive only — work exists  |
 *
 * "Shipped" stays a meaningful public state and is never rewritten by removal:
 * archiving a shipped project records that it is finished *and* retired, and the
 * `completedAt` date it already carries is what dates it.
 *
 * Pure and side-effect free so it can be unit tested — see `delete-policy.test.ts`.
 */

export type ProjectRemovalFacts = {
  status?: string | null
  /** Documents pointing at this project. */
  referenceCount: number
  /** True when the project has a repository, demo or recorded end date. */
  hasWork?: boolean
}

export type ProjectRemovalPolicy = {
  /** Whether `status` can still be moved to "archived". */
  canArchive: boolean
  /** Whether permanent deletion may be offered at all. */
  canHardDelete: boolean
  /** Officer-facing explanation when deletion is withheld. */
  blockedReason?: string
}

/** Statuses that mean work actually happened. */
const SUBSTANTIAL_STATUSES = new Set(['active', 'testing', 'shipped'])

export function projectRemovalPolicy(facts: ProjectRemovalFacts): ProjectRemovalPolicy {
  const canArchive = facts.status !== 'archived'

  if (facts.referenceCount > 0) {
    return {
      canArchive,
      canHardDelete: false,
      blockedReason:
        facts.referenceCount === 1
          ? 'Another document links to this project. Remove that link first, or archive the project instead.'
          : `${facts.referenceCount} other documents link to this project. Remove those links first, or archive the project instead.`,
    }
  }

  if (facts.status && SUBSTANTIAL_STATUSES.has(facts.status)) {
    return {
      canArchive,
      canHardDelete: false,
      blockedReason:
        'This project has been worked on and is part of the club’s history. Archive it instead, or delete it in the Advanced CMS.',
    }
  }

  if (facts.hasWork) {
    return {
      canArchive,
      canHardDelete: false,
      blockedReason:
        'This project has a repository, demo or end date recorded, so there is work behind it. Archive it instead, or delete it in the Advanced CMS.',
    }
  }

  return { canArchive, canHardDelete: true }
}

/**
 * Whether the stored document shows evidence of real work.
 *
 * Kept beside the policy so the Server Action and the confirmation screen agree
 * on what "an empty idea" means.
 */
export function hasProjectWork(project: {
  githubUrl?: string | null
  demoUrl?: string | null
  completedAt?: string | null
}): boolean {
  return Boolean(project.githubUrl || project.demoUrl || project.completedAt)
}
