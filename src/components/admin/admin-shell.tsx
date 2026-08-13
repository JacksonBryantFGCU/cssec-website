import Link from 'next/link'

import { can } from '@/auth/permissions'
import type { OfficerIdentity } from '@/auth/require-officer'

import { AdminIdentity } from './admin-identity'
import { AdminMobileNav } from './admin-mobile-nav'
import { AdminNav } from './admin-nav'
import { ADMIN_NAV, type AdminNavSection } from './navigation'

/**
 * The `/admin` application frame: sidebar on desktop, header + drawer on
 * mobile.
 *
 * Server-rendered. Only the pieces that genuinely need the browser (active-link
 * highlighting, the mobile disclosure, Clerk's sign-out) are Client Components,
 * and the navigation they receive has already been filtered by capability here
 * on the server — an officer never ships links they may not use.
 */
function visibleSections(officer: OfficerIdentity): AdminNavSection[] {
  return ADMIN_NAV.map((section) => ({
    ...section,
    items: section.items.filter((item) => can(officer.role, item.capability ?? 'admin:access')),
  })).filter((section) => section.items.length > 0)
}

export function AdminShell({
  officer,
  children,
}: {
  officer: OfficerIdentity
  children: React.ReactNode
}) {
  const sections = visibleSections(officer)

  return (
    <div className="flex min-h-full flex-1 flex-col lg:flex-row">
      {/* Mobile header */}
      <header className="bg-background sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b px-4 lg:hidden">
        <Link className="font-semibold tracking-tight" href="/admin">
          CSSEC Admin
        </Link>
        <AdminMobileNav sections={sections}>
          <AdminIdentity officer={officer} />
        </AdminMobileNav>
      </header>

      {/* Desktop sidebar */}
      <div className="bg-sidebar hidden w-64 shrink-0 border-r lg:flex lg:flex-col">
        <div className="flex h-14 items-center border-b px-6">
          <Link className="font-semibold tracking-tight" href="/admin">
            CSSEC Admin
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <AdminNav sections={sections} />
        </div>
        <div className="border-t p-3">
          <AdminIdentity officer={officer} />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
