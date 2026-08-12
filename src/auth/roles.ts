/**
 * CSSEC role model.
 *
 * Roles live in Clerk as `publicMetadata.role` on the user — no database, no
 * Clerk Organizations (this is one club, not a multi-tenant product). See the
 * README for how a president grants and revokes officer access.
 *
 * This module is intentionally dependency-free and side-effect-free so the
 * decision logic can be unit tested without a Clerk session.
 */

export const ROLES = ['admin', 'officer'] as const

export type Role = (typeof ROLES)[number]

/** Narrows an unknown metadata value to a known role. */
export function parseRole(value: unknown): Role | null {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
    ? (value as Role)
    : null
}

/** Both roles may use `/admin`; `admin` additionally manages other officers. */
export function isOfficerRole(role: Role | null): role is Role {
  return role === 'admin' || role === 'officer'
}

/** Human-readable label for the admin UI. */
export function roleLabel(role: Role): string {
  return role === 'admin' ? 'Administrator' : 'Officer'
}

declare global {
  /**
   * Types `user.publicMetadata` everywhere Clerk exposes it, so the role is
   * never read through an untyped cast.
   */
  interface UserPublicMetadata {
    role?: Role
  }

  /**
   * Types `auth().sessionClaims`. `metadata` is only present when the Clerk
   * session token is customized with `{"metadata": "{{user.public_metadata}}"}`
   * — see README. Authorization works without it (the role is then read from
   * the Backend API), so it is optional here.
   */
  interface CustomJwtSessionClaims {
    metadata?: {
      role?: Role
    }
  }
}
