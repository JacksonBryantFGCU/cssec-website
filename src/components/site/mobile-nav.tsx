'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

import { SITE_NAV, isActiveNavItem } from './navigation'

/**
 * The mobile navigation drawer.
 *
 * The approved design opens it as a navy top sheet directly under the header,
 * with the destination hints visible, a full-width Join action, and Discord /
 * GitHub side by side — not as a generic slide-in list, so that is what this
 * builds.
 *
 * A native `<dialog>` supplies modal semantics, Escape, focus containment and
 * background inerting. Selecting a route closes it, and the panel dismisses on
 * a backdrop tap because the sheet does not cover the whole screen.
 */
export function MobileNav({
  discordUrl,
  githubUrl,
}: {
  discordUrl: string | null
  githubUrl: string | null
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const close = useCallback(() => dialogRef.current?.close(), [])

  // A route change can also come from the browser's back button, which never
  // runs the links' onClick — close on the pathname itself so the sheet can
  // never be left open over a page the user has already navigated away from.
  useEffect(() => {
    close()
  }, [pathname, close])

  return (
    <>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Menu"
        className={cn(
          'border-navy-edge flex h-11 w-[46px] shrink-0 flex-col items-center justify-center',
          'gap-[5px] rounded-[10px] border lg:hidden',
        )}
        onClick={() => {
          dialogRef.current?.showModal()
          setOpen(true)
        }}
        type="button"
      >
        {[0, 1, 2].map((bar) => (
          <span aria-hidden className="bg-navy-soft h-[1.5px] w-4" key={bar} />
        ))}
      </button>

      <dialog
        aria-label="Site menu"
        className={cn(
          'backdrop:bg-[rgba(6,18,30,0.55)]',
          'bg-navy border-navy-line m-0 w-full max-w-none border-b p-0 lg:hidden',
        )}
        onClose={() => setOpen(false)}
        ref={dialogRef}
      >
        <div className="px-3.5 pt-4 pb-[22px]">
          <div className="flex items-center gap-2.5 pb-3">
            <span className="text-navy-quiet font-mono text-[10px] tracking-[0.16em]">MENU</span>
            <span className="flex-1" />
            <button
              aria-label="Close menu"
              className="border-navy-edge text-navy-soft flex size-11 items-center justify-center rounded-[10px] border text-lg"
              onClick={close}
              type="button"
            >
              <span aria-hidden>✕</span>
            </button>
          </div>

          <nav aria-label="Main">
            <ul>
              {SITE_NAV.map((item) => {
                const active = isActiveNavItem(item.href, pathname)

                return (
                  <li key={item.href}>
                    <Link
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex min-h-[52px] items-center gap-3 border-b border-[#16344F] px-1.5 text-lg',
                        active ? 'text-club-green-bright font-bold' : 'text-navy-fg font-semibold',
                      )}
                      href={item.href}
                      onClick={close}
                    >
                      <span>{item.label}</span>
                      <span className="flex-1" />
                      <span className="text-navy-quiet text-[13px] font-normal">{item.hint}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="flex flex-col gap-[9px] pt-4">
            <Link
              className="bg-club-green text-club-green-ink rounded-[10px] py-3.5 text-center text-[15px] font-bold"
              href="/about#join"
              onClick={close}
            >
              Join CSSEC
            </Link>
            <div className="flex gap-[9px]">
              {discordUrl ? (
                <a
                  className="bg-discord flex-1 rounded-[10px] py-[13px] text-center text-sm font-semibold text-white"
                  href={discordUrl}
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  Discord ↗
                </a>
              ) : null}
              {githubUrl ? (
                <a
                  className="border-navy-border text-navy-body flex-1 rounded-[10px] border py-3 text-center text-sm font-semibold"
                  href={githubUrl}
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  GitHub ↗
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </dialog>
    </>
  )
}
