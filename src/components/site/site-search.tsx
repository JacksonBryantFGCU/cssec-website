'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

/**
 * The ⌘K search affordance.
 *
 * Full search is a later phase, so this deliberately ships the *trigger* and
 * the shell — the shortcut, the dialog, the keyboard contract — without
 * pretending to have an index. Typing tells you plainly that search is not
 * built yet and hands you the section links instead, which is a real answer to
 * "where do I find this"; an inert button would not be.
 *
 * Built on the native `<dialog>`: modal semantics, focus containment, Escape
 * to close and background inerting come from the platform rather than from a
 * hand-rolled trap.
 */

const SECTIONS = [
  { label: 'Events', href: '/events', hint: 'Upcoming meetings and the full archive' },
  { label: 'Projects', href: '/projects', hint: 'Teams looking for contributors' },
  { label: 'Resources', href: '/resources', hint: 'Slides, guides, and cheat sheets' },
  { label: 'Opportunities', href: '/opportunities', hint: 'Internships, research, deadlines' },
]

function useSearchDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(false)

  const show = useCallback(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) {
      dialog.showModal()
      setOpen(true)
    }
  }, [])

  const close = useCallback(() => {
    dialogRef.current?.close()
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        show()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [show])

  return { dialogRef, open, show, close, setOpen }
}

export function SiteSearch() {
  const { dialogRef, open, show, close, setOpen } = useSearchDialog()
  const [query, setQuery] = useState('')

  return (
    <>
      {/* Wide desktop: the full field. */}
      <button
        aria-haspopup="dialog"
        aria-label="Search CSSEC"
        className={cn(
          'border-navy-edge bg-navy-field hidden w-[214px] shrink-0 items-center gap-2.5',
          'rounded-lg border px-[11px] py-[7px] transition-colors',
          'hover:border-club-green xl:flex',
        )}
        onClick={show}
        type="button"
      >
        <span className="text-navy-quiet text-[13.5px] whitespace-nowrap">Search CSSEC</span>
        <span className="flex-1" />
        <span
          aria-hidden
          className="border-navy-key text-navy-faint rounded border px-[5px] py-0.5 font-mono text-[10px]"
        >
          ⌘K
        </span>
      </button>

      {/* Narrow desktop and mobile: the icon only, at a 44px touch target. */}
      <button
        aria-haspopup="dialog"
        aria-label="Search CSSEC"
        className={cn(
          'border-navy-edge bg-navy-field text-navy-soft flex h-11 w-[46px] shrink-0',
          'items-center justify-center rounded-[10px] border text-[17px]',
          'transition-colors hover:border-club-green lg:h-10 lg:w-11 xl:hidden',
        )}
        onClick={show}
        type="button"
      >
        <span aria-hidden>⌕</span>
      </button>

      <dialog
        aria-label="Search CSSEC"
        className={cn(
          'backdrop:bg-[rgba(6,18,30,0.62)]',
          'm-0 h-full max-h-none w-full max-w-none bg-white p-0 text-ink',
          'sm:mx-auto sm:mt-24 sm:h-auto sm:max-h-[80vh] sm:w-[min(660px,calc(100vw-2rem))]',
          'sm:overflow-hidden sm:rounded-xl sm:border sm:border-[#C9D2C9]',
          'sm:shadow-[0_30px_80px_-20px_rgba(4,14,24,0.6)]',
        )}
        onClose={() => {
          setOpen(false)
          setQuery('')
        }}
        ref={dialogRef}
      >
        {open ? (
          <div className="flex h-full flex-col">
            <div className="border-rule flex items-center gap-3 border-b px-4 py-4 sm:px-[18px]">
              <span aria-hidden className="text-ink-label text-base">
                ⌕
              </span>
              {/* Autofocused deliberately: a search dialog that does not focus
                  its field on open is unusable by keyboard. */}
              <input
                aria-describedby="site-search-status"
                autoFocus
                className="text-ink placeholder:text-ink-label flex-1 bg-transparent text-base outline-none"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search events, projects, resources"
                type="search"
                value={query}
              />
              <button
                aria-label="Close search"
                className="border-rule-strong text-ink-label rounded border px-1.5 py-[3px] font-mono text-[10px]"
                onClick={close}
                type="button"
              >
                ESC
              </button>
            </div>

            <div className="flex-1 overflow-auto py-2">
              <p
                className="text-ink-label px-4 pt-2.5 pb-1.5 font-mono text-[10px] tracking-[0.16em] sm:px-[18px]"
                id="site-search-status"
                role="status"
              >
                {query.trim() ? 'SEARCH IS NOT BUILT YET' : 'BROWSE BY SECTION'}
              </p>

              {query.trim() ? (
                <p className="text-ink-soft px-4 pb-3 text-[13.5px] leading-relaxed sm:px-[18px]">
                  Searching every event, project and resource is coming in a later release. For
                  now, the sections below are the fastest way in.
                </p>
              ) : null}

              <ul>
                {SECTIONS.map((section) => (
                  <li key={section.href}>
                    <Link
                      className="hover:bg-paper flex min-h-11 items-center gap-3 px-4 py-2.5 sm:px-[18px]"
                      href={section.href}
                      onClick={close}
                    >
                      <span className="flex flex-col gap-0.5">
                        <span className="text-ink text-[14.5px] font-semibold">
                          {section.label}
                        </span>
                        <span className="text-ink-soft text-[12.5px]">{section.hint}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-rule bg-[#FAFBF9] text-ink-faint flex gap-[18px] border-t px-4 py-[11px] font-mono text-[10.5px] sm:px-[18px]">
              <span>↑↓ NAVIGATE</span>
              <span>↵ OPEN</span>
              <span>ESC CLOSE</span>
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  )
}
