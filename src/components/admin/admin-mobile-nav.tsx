'use client'

import { Menu, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { AdminNav } from './admin-nav'
import type { AdminNavSection } from './navigation'

/**
 * Compact navigation for small screens.
 *
 * A disclosure rather than an overlay sheet: it needs no focus trap, no scroll
 * lock and no portal, which makes it easier to keep correct than the equivalent
 * modal. `aria-expanded` / `aria-controls` describe it to screen readers, Escape
 * closes it, and selecting a link closes it too.
 */
export function AdminMobileNav({
  sections,
  children,
}: {
  sections: AdminNavSection[]
  /** Officer identity and sign-out, shown at the bottom of the open panel. */
  children?: React.ReactNode
}) {
  const pathname = usePathname()

  // Openness is stored as *which route it was opened on*, so a navigation
  // closes the panel by making this stale — including a back-button
  // navigation, which fires no click. Deriving it during render avoids an
  // effect that would only exist to undo state React can already compute.
  const [openedAt, setOpenedAt] = useState<string | null>(null)
  const open = openedAt === pathname

  const close = useCallback(() => setOpenedAt(null), [])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [close, open])

  return (
    <div className="lg:hidden">
      <button
        aria-controls="admin-mobile-nav"
        aria-expanded={open}
        className="border-navy-border text-navy-fg hover:border-navy-border-hover hover:text-navy-bright grid size-11 place-items-center rounded-md border transition-colors"
        onClick={() => setOpenedAt(open ? null : pathname)}
        type="button"
      >
        {open ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
        <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
      </button>

      <div
        className="bg-navy-deep border-navy-line absolute inset-x-0 top-14 z-20 max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b px-3 py-4 shadow-lg data-[closed]:hidden"
        data-closed={open ? undefined : ''}
        id="admin-mobile-nav"
      >
        <AdminNav onNavigate={close} sections={sections} />
        {children ? <div className="border-navy-line mt-5 border-t pt-4">{children}</div> : null}
      </div>
    </div>
  )
}
