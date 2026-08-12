import { can, type Capability } from './permissions.ts'
import { isOfficerRole, type Role } from './roles.ts'

/**
 * The authorization decision, separated from Clerk so it can be reasoned about
 * (and unit tested) on its own. `require-officer.ts` supplies the session
 * facts; this decides what happens.
 */
export type AccessDecision =
  | { outcome: 'signed-out' }
  | { outcome: 'forbidden'; userId: string }
  | { outcome: 'allowed'; userId: string; role: Role }

export function decideAdminAccess(
  session: { userId: string | null; role: Role | null },
  capability: Capability = 'admin:access',
): AccessDecision {
  if (!session.userId) return { outcome: 'signed-out' }

  const { role } = session
  if (!isOfficerRole(role) || !can(role, capability)) {
    return { outcome: 'forbidden', userId: session.userId }
  }

  return { outcome: 'allowed', userId: session.userId, role }
}
