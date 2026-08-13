import type { Metadata } from 'next'

import { requireOfficer } from '@/auth/require-officer'
import { AdminShell } from '@/components/admin/admin-shell'

export const metadata: Metadata = {
  title: {
    default: 'CSSEC Admin',
    template: '%s — CSSEC Admin',
  },
}

// Authorization depends on the request, so nothing under /admin may be
// prerendered or cached.
export const dynamic = 'force-dynamic'

/**
 * The authorization boundary for every `/admin` screen.
 *
 * Layouts render before their pages, so a route added under this group is
 * protected by default rather than by remembering to add a check. The
 * `(shell)` route group exists so `/admin/no-access` — which must stay
 * reachable *without* a role — is not inside this boundary and cannot loop.
 *
 * This does **not** protect Server Actions. An action is its own entry point,
 * reachable by direct POST without ever rendering a layout, so each one calls
 * `requireOfficer()` again itself.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const officer = await requireOfficer()

  return <AdminShell officer={officer}>{children}</AdminShell>
}
