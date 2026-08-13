/**
 * What an officer may do to a person record that should go away.
 *
 * A `person` is the single record of a human on the website. Everything that
 * credits them — an officer term, an event's presenter list, a project's lead,
 * mentor or contributor list, a resource's author — points at that one document
 * rather than copying their name. That is what keeps the site consistent, and
 * it is also why deleting a person is never a local decision: it would break
 * every credit at once.
 *
 * So this does not answer "may I delete?" with a number. It answers with the
 * *list of places to go and fix first*, because that is the only thing an
 * officer can act on.
 *
 * V1 policy: a person used nowhere may be deleted with confirmation. A person
 * used anywhere may not be deleted here — including in a past officer term,
 * which is exactly the history the separate `officerRole` document exists to
 * preserve.
 *
 * Pure and side-effect free so it can be unit tested.
 */

export type PersonUsage = {
  officerTerms?: Array<{ _id: string; position?: string | null; term?: string | null; isCurrent?: boolean | null }> | null
  eventsPresented?: Array<{ _id: string; title?: string | null }> | null
  projectsLed?: Array<{ _id: string; name?: string | null }> | null
  projectsMentored?: Array<{ _id: string; name?: string | null }> | null
  projectsContributed?: Array<{ _id: string; name?: string | null }> | null
  resourcesAuthored?: Array<{ _id: string; title?: string | null }> | null
  advisorOf?: Array<{ _id: string }> | null
}

export type UsageGroup = {
  /** What the person is, in this group. */
  role: string
  /** The documents naming them, as officer-facing labels. */
  items: string[]
  /** Where to go to change it. */
  href: string
}

const label = (value: string | null | undefined, fallback: string) => value?.trim() || fallback

/**
 * Groups every use of a person into "what they are" and "where to fix it".
 *
 * Empty groups are dropped, so an unused person yields an empty array — which
 * is the same thing as "safe to delete".
 */
export function personUsageGroups(usage: PersonUsage): UsageGroup[] {
  const groups: UsageGroup[] = []

  const officerTerms = usage.officerTerms ?? []
  if (officerTerms.length > 0) {
    groups.push({
      role: 'Officer term',
      items: officerTerms.map(
        (term) =>
          `${label(term.position, 'Officer')}, ${label(term.term, 'unknown year')}${
            term.isCurrent ? ' (current)' : ''
          }`,
      ),
      href: '/admin/people/officers',
    })
  }

  const add = (
    role: string,
    items: Array<{ title?: string | null; name?: string | null }> | null | undefined,
    href: string,
    fallback: string,
  ) => {
    const list = items ?? []
    if (list.length === 0) return
    groups.push({
      role,
      items: list.map((item) => label(item.title ?? item.name, fallback)),
      href,
    })
  }

  add('Event presenter', usage.eventsPresented, '/admin/events', 'Untitled event')
  add('Project lead', usage.projectsLed, '/admin/projects', 'Untitled project')
  add('Project mentor', usage.projectsMentored, '/admin/projects', 'Untitled project')
  add('Project contributor', usage.projectsContributed, '/admin/projects', 'Untitled project')
  add('Resource author', usage.resourcesAuthored, '/admin/resources', 'Untitled resource')

  if ((usage.advisorOf ?? []).length > 0) {
    groups.push({
      role: 'Faculty advisor',
      items: ['Named in site settings'],
      href: '/admin/settings',
    })
  }

  return groups
}

export type PersonRemovalPolicy = {
  canHardDelete: boolean
  blockedReason?: string
}

export function personRemovalPolicy(usage: PersonUsage): PersonRemovalPolicy {
  const groups = personUsageGroups(usage)

  if (groups.length === 0) return { canHardDelete: true }

  const total = groups.reduce((count, group) => count + group.items.length, 0)

  return {
    canHardDelete: false,
    blockedReason:
      total === 1
        ? 'This person is credited somewhere on the site. Remove that credit first, or keep the record.'
        : `This person is credited in ${total} places on the site. Remove those credits first, or keep the record.`,
  }
}
