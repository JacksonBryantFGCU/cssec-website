import type { Role } from './roles.ts'

/**
 * Named capabilities.
 *
 * The split is by *what a mistake costs the club*, not by seniority:
 *
 * - `content:write` — events, projects, resources, opportunities and the people
 *   records those refer to. This is the routine work every officer does, and a
 *   mistake shows up on one page and is fixed by editing it again.
 * - `officers:manage` — who the website says is on the board, and for which
 *   term. Wrong here misrepresents the club, and the historical record is the
 *   thing a future president inherits.
 * - `settings:manage` — the club's name, contact email, Discord invite and
 *   default SEO. One bad save changes every page at once.
 *
 * Nothing in the app compares roles directly — `can()` is the only reader — so
 * moving a capability between roles is a change in this file alone.
 *
 * None of these grant a Clerk account anything: Clerk decides who may reach
 * `/admin` at all, and the Sanity `officerRole` documents that `officers:manage`
 * edits are public club content, not login accounts. See the README.
 */
export const CAPABILITIES = [
  'admin:access',
  'content:write',
  'officers:manage',
  'settings:manage',
] as const

export type Capability = (typeof CAPABILITIES)[number]

const CAPABILITIES_BY_ROLE: Record<Role, readonly Capability[]> = {
  admin: ['admin:access', 'content:write', 'officers:manage', 'settings:manage'],
  officer: ['admin:access', 'content:write'],
}

export function can(role: Role | null, capability: Capability): boolean {
  if (!role) return false
  return CAPABILITIES_BY_ROLE[role].includes(capability)
}
