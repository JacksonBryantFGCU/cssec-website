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
 *
 * `admin-root` is the class that carries the CSSEC palette into every shadcn
 * component below it; see the token block in `globals.css`.
 */
function visibleSections(officer: OfficerIdentity): AdminNavSection[] {
  return ADMIN_NAV.map((section) => ({
    ...section,
    items: section.items.filter((item) => can(officer.role, item.capability ?? 'admin:access')),
  })).filter((section) => section.items.length > 0)
}

/** The club mark, sized for the sidebar rail and the mobile bar alike. */
function AdminWordmark() {
  return (
    <Link
      className="group/mark flex items-center gap-2.5 rounded-sm"
      href="/admin"
      aria-label="CSSEC admin home"
    >
      <span
        aria-hidden="true"
        className="from-club-green to-club-green-deep text-club-green-ink grid size-7 shrink-0 place-items-center rounded-[7px] bg-gradient-to-br font-mono text-[11px] font-bold"
      >
        CS
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-navy-bright text-[15px] font-bold tracking-[-0.01em]">
          CSSEC
        </span>
        <span className="text-navy-whisper mt-[3px] font-mono text-[9.5px] tracking-[0.14em]">
          ADMIN
        </span>
      </span>
    </Link>
  )
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
    <div className="admin-root bg-paper flex min-h-full flex-1 flex-col lg:flex-row">
      {/* Mobile header */}
      <header className="admin-sidebar bg-navy border-navy-line sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b px-4 lg:hidden">
        <AdminWordmark />
        <AdminMobileNav sections={sections}>
          <AdminIdentity officer={officer} />
        </AdminMobileNav>
      </header>

      {/* Desktop sidebar */}
      <div className="admin-sidebar bg-navy border-navy-line hidden w-60 shrink-0 border-r lg:flex lg:flex-col">
        <div className="border-navy-line flex h-14 items-center border-b px-5">
          <AdminWordmark />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <AdminNav sections={sections} />
        </div>
        <div className="border-navy-line border-t p-3">
          <AdminIdentity officer={officer} />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
