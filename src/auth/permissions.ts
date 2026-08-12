import type { Role } from './roles.ts'

/**
 * Named capabilities.
 *
 * Both roles can currently do the same things — the split exists so later
 * phases can add officer-management capabilities to `admin` without hunting
 * down scattered `role === 'admin'` comparisons.
 */
export const CAPABILITIES = ['admin:access', 'content:write', 'officers:manage'] as const

export type Capability = (typeof CAPABILITIES)[number]

const CAPABILITIES_BY_ROLE: Record<Role, readonly Capability[]> = {
  admin: ['admin:access', 'content:write', 'officers:manage'],
  officer: ['admin:access', 'content:write'],
}

export function can(role: Role | null, capability: Capability): boolean {
  if (!role) return false
  return CAPABILITIES_BY_ROLE[role].includes(capability)
}
