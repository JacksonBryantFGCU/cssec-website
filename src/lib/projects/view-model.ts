import {
  EXPERIENCE_LEVELS,
  PROJECT_STATUSES,
  titleForValue,
} from '../../sanity/schemaTypes/shared/options.ts'

/**
 * Presentation logic for projects.
 *
 * Pure and dependency-free so it runs under `node --test`; relative,
 * `.ts`-suffixed imports for the same reason. The index, the detail page and
 * the homepage all render the same labels, and this is the one place that
 * decides what they say.
 */

export type ProjectLevelInput = {
  experienceLevel?: string | null
  noExperienceRequired?: boolean | null
}

/** The lifecycle, in the order the index sorts and the detail rail draws it. */
export const PROJECT_STATUS_FACET = PROJECT_STATUSES.filter(
  // "Idea" projects have nothing to join yet and no page worth linking to, so
  // they are surfaced as a group at the bottom of the index instead of as a
  // filter of their own.
  (option) => option.value !== 'idea',
)

/**
 * The experience filter.
 *
 * Deliberately two options rather than the schema's four: the question a
 * student actually asks is "can I join without having done this before?", and
 * splitting intermediate from advanced answers a question nobody asked.
 */
export const LEVEL_FACET = [
  { value: 'beginner', title: 'Beginner friendly' },
  { value: 'experienced', title: 'Some experience' },
] as const

/** True when a project belongs in the given experience bucket. */
export function isBeginnerFriendly(project: ProjectLevelInput): boolean {
  if (project.noExperienceRequired) return true
  return project.experienceLevel === 'any' || project.experienceLevel === 'beginner'
}

export function matchesLevel(project: ProjectLevelInput, level: string | null): boolean {
  if (!level) return true
  return level === 'beginner' ? isBeginnerFriendly(project) : !isBeginnerFriendly(project)
}

/** The words on the level pill. */
export function projectLevelLabel(project: ProjectLevelInput): string {
  if (project.noExperienceRequired) return 'No experience required'
  return titleForValue(EXPERIENCE_LEVELS, project.experienceLevel) ?? 'Any experience level'
}

export function projectStatusLabel(status: string | null | undefined): string {
  return titleForValue(PROJECT_STATUSES, status) ?? status ?? 'Project'
}

export type ProjectRoleInput = { title?: string | null }

/**
 * "Frontend contributor · UI designer", or a count when the roles are unnamed.
 *
 * Returns null when a project is not taking people, so callers can drop the
 * block rather than print "0 open roles".
 */
export function rolesSummary(
  roles: readonly ProjectRoleInput[] | null | undefined,
  openRoleCount?: number | null,
): string | null {
  const titles = (roles ?? [])
    .map((role) => role.title?.trim())
    .filter((title): title is string => Boolean(title))

  if (titles.length > 0) return titles.join(' · ')
  if (openRoleCount && openRoleCount > 0) return `${openRoleCount} open`
  return null
}

/** "3 OPEN ROLES" / "NO OPEN ROLES" — the mono heading above the summary. */
export function openRolesLabel(count: number): string {
  if (count <= 0) return 'NO OPEN ROLES'
  return `${count} OPEN ${count === 1 ? 'ROLE' : 'ROLES'}`
}
