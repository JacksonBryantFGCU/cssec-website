import { SignIn } from '@clerk/nextjs'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Officer Access — CSSEC',
  description: 'Sign in to manage CSSEC website content.',
}

/**
 * Officer sign-in. This is not public member authentication — accounts are
 * created by invitation in the Clerk dashboard (see README).
 */
export default function SignInPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-6 py-16">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">CSSEC Officer Access</h1>
        <p className="text-muted-foreground text-sm">
          Sign in to manage CSSEC website content.
        </p>
      </div>
      {/* `fallbackRedirectUrl` applies only when no explicit return URL was
          carried into sign-in, so `requireOfficer()` can still send an officer
          back to where they were headed. */}
      <SignIn fallbackRedirectUrl="/admin" />
    </main>
  )
}
