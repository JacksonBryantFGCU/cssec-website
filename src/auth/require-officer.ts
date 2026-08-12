import 'server-only'

import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

import { decideAdminAccess } from './access.ts'
import type { Capability } from './permissions.ts'
import { parseRole, type Role } from './roles.ts'

export const SIGN_IN_PATH = '/sign-in'
export const NO_ACCESS_PATH = '/admin/no-access'

export type OfficerIdentity = {
  userId: string
  role: Role
  /** Display name, falling back to the primary email when no name is set. */
  name: string
  email: string | null
}

/**
 * Resolves the caller's CSSEC role from Clerk.
 *
 * Prefers the session token claim (no network call). Falls back to the Backend
 * API so authorization is correct even before the custom session claim is
 * configured in the Clerk dashboard — see README.
 */
async function resolveRole(sessionRole: Role | null): Promise<Role | null> {
  if (sessionRole) return sessionRole

  const user = await currentUser()
  return parseRole(user?.publicMetadata?.role)
}

/**
 * Server-side gate for every officer-only resource.
 *
 * Call this in each protected page **and independently inside every Server
 * Action** — a page-level check does not protect an action, which is its own
 * entry point. Never gate on a client hook: the browser controls that.
 *
 * Signed out → the officer sign-in page (returning to where they were headed).
 * Signed in without a role → the no-access page.
 */
export async function requireOfficer(
  options: { capability?: Capability; returnTo?: string } = {},
): Promise<OfficerIdentity> {
  const { userId, sessionClaims } = await auth()

  const role = userId ? await resolveRole(parseRole(sessionClaims?.metadata?.role)) : null
  const decision = decideAdminAccess({ userId, role }, options.capability)

  if (decision.outcome === 'signed-out') {
    // Redirect explicitly rather than via Clerk's `redirectToSignIn()`, which
    // resolves its target from Clerk's server config (and otherwise sends
    // officers to Clerk's hosted account portal). `redirect_url` is the param
    // Clerk's `<SignIn />` reads to return the officer to where they were.
    const returnTo = options.returnTo ?? '/admin'
    redirect(`${SIGN_IN_PATH}?redirect_url=${encodeURIComponent(returnTo)}`)
  }

  if (decision.outcome === 'forbidden') {
    redirect(NO_ACCESS_PATH)
  }

  const user = await currentUser()
  const email = user?.primaryEmailAddress?.emailAddress ?? null

  return {
    userId: decision.userId,
    role: decision.role,
    name: user?.fullName || user?.username || email || 'Officer',
    email,
  }
}
