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
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">No officer access</h1>
      <p className="text-muted-foreground">
        This account does not have CSSEC officer access. If you are a club officer,
        ask a current administrator to grant access to your account.
      </p>
      <div className="flex flex-wrap gap-4 text-sm">
        <Link className="underline underline-offset-4" href="/">
          Back to the public site
        </Link>
        <SignOutButton redirectUrl="/">
          <button className="underline underline-offset-4" type="button">
            Sign out
          </button>
        </SignOutButton>
      </div>
    </main>
  )
}
