import { SignOutButton } from '@clerk/nextjs'
import type { Metadata } from 'next'
import Link from 'next/link'

import { requireOfficer } from '@/auth/require-officer'
import { roleLabel } from '@/auth/roles'
import { ADMIN_WRITE_CHECK_QUERY } from '@/sanity/queries/admin'
import { getWriteClient } from '@/sanity/lib/write-client'

import { WriteCheckForm } from './write-check-form'

export const metadata: Metadata = {
  title: 'CSSEC Admin',
}

// Authorization depends on the request, so this route must never be
// prerendered or cached.
export const dynamic = 'force-dynamic'

/**
 * Protected officer landing page — the shell for later phases, not the admin
 * product. Authorization runs before any of this renders, so no admin content
 * is ever sent to the browser and hidden afterwards.
 */
export default async function AdminPage() {
  const officer = await requireOfficer()

  // Read through the server-only client so the result is never CDN-stale.
  const lastCheck = await getWriteClient().fetch(ADMIN_WRITE_CHECK_QUERY)

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">CSSEC Admin</h1>
        <p className="text-muted-foreground text-sm">
          Signed in as {officer.name}
          {officer.email ? ` (${officer.email})` : ''} · {roleLabel(officer.role)}
        </p>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Status</h2>
        <p className="text-muted-foreground text-sm">
          Clerk authentication and server-side officer authorization are working.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Sanity write check</h2>
        <p className="text-muted-foreground text-sm">
          Writes a diagnostic document to prove the secure path: this page → Server
          Action → officer check → validation → server-only Sanity client. It never
          touches club content.
        </p>
        <WriteCheckForm />
        <p className="text-muted-foreground text-sm">
          {lastCheck?.lastCheckedAt
            ? `Last check: ${new Date(lastCheck.lastCheckedAt).toLocaleString('en-US')}${
                lastCheck.note ? ` — “${lastCheck.note}”` : ''
              }`
            : 'No write check has been run yet.'}
        </p>
      </section>

      <footer className="flex flex-wrap gap-4 text-sm">
        <Link className="underline underline-offset-4" href="/studio">
          Advanced CMS (Sanity Studio)
        </Link>
        <Link className="underline underline-offset-4" href="/">
          Public site
        </Link>
        <SignOutButton redirectUrl="/">
          <button className="underline underline-offset-4" type="button">
            Sign out
          </button>
        </SignOutButton>
      </footer>
    </main>
  )
}
