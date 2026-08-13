import { SignOutButton } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { SIGN_IN_PATH } from '@/auth/require-officer'

export const metadata: Metadata = {
  title: 'No officer access — CSSEC',
}

/**
 * Shown to a signed-in account that has no CSSEC role.
 *
 * Requires authentication (so it is not a public page) but deliberately not a
 * role, otherwise `requireOfficer()` would redirect here in a loop. It states
 * only that access is missing — no roles, rules or internals.
 */
export default async function NoAccessPage() {
  const { userId } = await auth()
  if (!userId) redirect(SIGN_IN_PATH)

  return (
    <main className="admin-root bg-paper flex min-h-full flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="border-rule-card w-full max-w-md rounded-lg border bg-white p-6 sm:p-7">
        <p className="text-ink-label font-mono text-[10.5px] tracking-[0.16em] uppercase">
          CSSEC Admin
        </p>
        <h1 className="font-display text-ink mt-1.5 text-[26px] font-bold tracking-[-0.02em]">
          No officer access
        </h1>
        <p className="text-ink-soft mt-2.5 text-[13.5px] leading-relaxed">
          This account does not have CSSEC officer access. If you are a club officer, ask a current
          administrator to grant access to your account.
        </p>
        <div className="border-rule mt-5 flex flex-wrap gap-4 border-t pt-4 text-[13px]">
          <Link className="text-club-link font-medium underline underline-offset-4" href="/">
            Back to the public site
          </Link>
          <SignOutButton redirectUrl="/">
            <button className="text-ink-soft underline underline-offset-4" type="button">
              Sign out
            </button>
          </SignOutButton>
        </div>
      </div>
    </main>
  )
}
