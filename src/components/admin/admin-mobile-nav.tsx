'use client'

import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'

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
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <div className="lg:hidden">
      <Button
        aria-controls="admin-mobile-nav"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        size="icon"
        variant="outline"
      >
        {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
      </Button>

      <div
        className="bg-background absolute inset-x-0 top-14 z-20 border-b p-4 shadow-sm data-[closed]:hidden"
        data-closed={open ? undefined : ''}
        id="admin-mobile-nav"
      >
        <AdminNav onNavigate={() => setOpen(false)} sections={sections} />
        {children ? <div className="mt-6 border-t pt-4">{children}</div> : null}
      </div>
    </div>
  )
}
