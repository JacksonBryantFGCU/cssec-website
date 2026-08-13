'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'

import { nextResultIndex, shouldOpenSearch } from '@/lib/search/keyboard'
import { MIN_QUERY_LENGTH } from '@/lib/search/query'
import {
  flattenGroups,
  groupSearchResults,
  type SearchGroup,
  type SearchResult,
} from '@/lib/search/results'
import { cn } from '@/lib/utils'

/**
 * The ⌘K search.
 *
 * Built on the native `<dialog>`: modal semantics, focus containment, Escape to
 * close, background inerting and focus restoration all come from the platform
 * rather than from a hand-rolled trap.
 *
 * The results list is a real combobox — the input keeps focus so the reader can
 * keep typing, and `aria-activedescendant` moves the selection. Each result is
 * still an ordinary link, so pointer, touch and Tab all work without the
 * keyboard handling being involved at all.
 */

const SECTIONS = [
  { label: 'Events', href: '/events', hint: 'Upcoming meetings and the full archive' },
  { label: 'Projects', href: '/projects', hint: 'Teams looking for contributors' },
  { label: 'Resources', href: '/resources', hint: 'Slides, guides, and cheat sheets' },
  { label: 'Opportunities', href: '/opportunities', hint: 'Internships, research, deadlines' },
]

const LISTBOX_ID = 'site-search-results'
const optionId = (index: number) => `site-search-option-${index}`

/**
 * What came back for a particular query.
 *
 * Only the *asynchronous* part of search is state. Whether the box is empty or
 * too short to search is a fact about the current query and is derived during
 * render, so those transitions need no effect and cannot cascade.
 *
 * The query is stored alongside the outcome so a response can be recognised as
 * belonging to an older keystroke and shown as still-loading rather than as a
 * result for what is now in the box.
 */
type RemoteState = {
  query: string
  outcome: 'loading' | 'ready' | 'error'
  results: SearchResult[]
}

const NOTHING_FETCHED: RemoteState = { query: '', outcome: 'ready', results: [] }

/**
 * The modifier this visitor's keyboard actually has.
 *
 * Read through `useSyncExternalStore` rather than in an effect: the platform is
 * an external value that simply differs between the server and the browser and
 * never changes afterwards, so it needs a server snapshot and a client one —
 * not a render followed by a state update. Hence the subscribe function that
 * never fires.
 */
const NO_UPDATES = () => () => {}
const macLike = () => /Mac|iPhone|iPad|iPod/.test(globalThis.navigator?.platform ?? '')

function useShortcutLabel(): string {
  return useSyncExternalStore(
    NO_UPDATES,
    () => (macLike() ? '⌘K' : 'Ctrl K'),
    () => '⌘K',
  )
}

export function SiteSearch() {
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [remote, setRemote] = useState<RemoteState>(NOTHING_FETCHED)
  const [activeIndex, setActiveIndex] = useState(0)
  const shortcutLabel = useShortcutLabel()

  const show = useCallback(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) {
      dialog.showModal()
      setOpen(true)
    }
  }, [])

  const close = useCallback(() => dialogRef.current?.close(), [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null

      const open = shouldOpenSearch({
        key: event.key,
        metaKey: event.metaKey,
        ctrlKey: event.ctrlKey,
        targetTag: target?.tagName ?? null,
        targetIsContentEditable: target?.isContentEditable ?? false,
      })
      if (!open) return

      event.preventDefault()
      show()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [show])

  const trimmed = query.trim()
  /** Derived, not stored: an empty or one-character box searches for nothing. */
  const phase =
    trimmed.length === 0 ? 'idle' : trimmed.length < MIN_QUERY_LENGTH ? 'short' : 'search'

  /**
   * Fetches results for the current query.
   *
   * Debounced, because a request per keystroke is network churn nobody asked
   * for, and aborted on the next change so a slow early response can never
   * overwrite a newer one — which is what makes the list flicker. Every state
   * update happens in the timer or promise callback, never in the effect body.
   */
  useEffect(() => {
    if (!open || phase !== 'search') return

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setRemote({ query: trimmed, outcome: 'loading', results: [] })

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error(`search responded ${response.status}`)

        const payload: { results?: SearchResult[] } = await response.json()
        setRemote({ query: trimmed, outcome: 'ready', results: payload.results ?? [] })
        // A new result set invalidates wherever the selection was, and this is
        // the moment it changes — so it is reset here rather than by an effect
        // watching the list.
        setActiveIndex(0)
      } catch (error) {
        if (controller.signal.aborted) return
        console.error('[search] request failed', error)
        setRemote({ query: trimmed, outcome: 'error', results: [] })
      }
    }, 180)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [trimmed, phase, open])

  // A response for an older keystroke is not a result for what is in the box.
  const settled = phase === 'search' && remote.query === trimmed
  const status = phase === 'search' ? (settled ? remote.outcome : 'loading') : phase

  const groups: SearchGroup[] = useMemo(
    () => (settled && remote.outcome === 'ready' ? groupSearchResults(remote.results) : []),
    [settled, remote],
  )
  const flat = useMemo(() => flattenGroups(groups), [groups])

  // Clamped during render, so a result set that shrank under the selection can
  // never leave `aria-activedescendant` pointing at an element that is gone.
  const active = activeIndex < flat.length ? activeIndex : 0

  // Keep the highlighted row in view when it moves off the end of the list.
  useEffect(() => {
    if (flat.length === 0) return
    listRef.current
      ?.querySelector(`#${CSS.escape(optionId(active))}`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [active, flat.length])

  const openResult = useCallback(
    (result: SearchResult) => {
      close()

      if (result.external) window.open(result.href, '_blank', 'noopener,noreferrer')
      else router.push(result.href)
    },
    [close, router],
  )

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (flat.length === 0) return

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const direction = event.key === 'ArrowDown' ? 'down' : 'up'
      setActiveIndex((index) => nextResultIndex(index, flat.length, direction))
      return
    }

    if (event.key === 'Enter') {
      const result = flat[active]
      if (!result) return
      event.preventDefault()
      openResult(result)
    }
  }

  /** The single sentence the status region announces for the current state. */
  const statusMessage = (() => {
    switch (status) {
      case 'idle':
        return 'BROWSE BY SECTION'
      case 'short':
        return `KEEP TYPING — AT LEAST ${MIN_QUERY_LENGTH} CHARACTERS`
      case 'loading':
        return 'SEARCHING…'
      case 'error':
        return 'SEARCH UNAVAILABLE'
      case 'ready':
        return flat.length === 0
          ? 'NO RESULTS'
          : `${flat.length} ${flat.length === 1 ? 'RESULT' : 'RESULTS'}`
    }
  })()

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
        ref={triggerRef}
        type="button"
      >
        <span className="text-navy-quiet text-[13.5px] whitespace-nowrap">Search CSSEC</span>
        <span className="flex-1" />
        <span
          aria-hidden
          className="border-navy-key text-navy-faint rounded border px-[5px] py-0.5 font-mono text-[10px]"
        >
          {shortcutLabel}
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
          'text-ink m-0 h-full max-h-none w-full max-w-none bg-white p-0',
          'sm:mx-auto sm:mt-24 sm:h-auto sm:max-h-[80vh] sm:w-[min(660px,calc(100vw-2rem))]',
          'sm:overflow-hidden sm:rounded-xl sm:border sm:border-[#C9D2C9]',
          'sm:shadow-[0_30px_80px_-20px_rgba(4,14,24,0.6)]',
        )}
        onClose={() => {
          setOpen(false)
          setQuery('')
          setRemote(NOTHING_FETCHED)
          setActiveIndex(0)
          // The platform restores focus to whatever had it before `showModal`,
          // which is right when the trigger was clicked but not when the dialog
          // was opened by the shortcut from somewhere else on the page.
          triggerRef.current?.focus()
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
                aria-activedescendant={flat.length > 0 ? optionId(active) : undefined}
                aria-autocomplete="list"
                aria-controls={LISTBOX_ID}
                aria-describedby="site-search-status"
                aria-expanded={flat.length > 0}
                aria-label="Search CSSEC"
                autoFocus
                className="text-ink placeholder:text-ink-label flex-1 bg-transparent text-base outline-none"
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Search events, projects, resources, opportunities"
                role="combobox"
                type="text"
                value={query}
              />
              <button
                aria-label="Close search"
                className="border-rule-strong text-ink-label rounded border px-2 py-[5px] text-[13px] sm:px-1.5 sm:py-[3px] sm:font-mono sm:text-[10px]"
                onClick={close}
                type="button"
              >
                <span className="sm:hidden">Cancel</span>
                <span className="hidden sm:inline">ESC</span>
              </button>
            </div>

            <div className="flex-1 overflow-auto py-2" ref={listRef}>
              {/* `role="status"` already implies a polite live region. */}
              <p
                className="text-ink-label px-4 pt-2.5 pb-1.5 font-mono text-[10px] tracking-[0.16em] sm:px-[18px]"
                id="site-search-status"
                role="status"
              >
                {statusMessage}
              </p>

              {/* Empty box: the sections are a real answer to "where do I find
                  this", so they stay as the resting state. */}
              {status === 'idle' || status === 'short' ? (
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
              ) : null}

              {status === 'error' ? (
                <p className="text-ink-soft px-4 pb-3 text-[13.5px] leading-relaxed sm:px-[18px]">
                  Search is not responding right now. The sections in the navigation still work,
                  and the archive is browsable from Events and Resources.
                </p>
              ) : null}

              {/* `listbox > group > option` with nothing in between: the
                  intermediate list wrappers a `<ul>` would need are exactly what
                  breaks the relationship assistive technology walks. */}
              <div aria-label="Search results" id={LISTBOX_ID} role="listbox">
                {groups.map((group) => (
                  <div aria-label={group.label} key={group.type} role="group">
                    <p
                      aria-hidden
                      className="text-ink-label px-4 pt-3 pb-1 font-mono text-[10px] tracking-[0.16em] sm:px-[18px]"
                    >
                      {group.label}
                    </p>
                    {group.items.map((result) => {
                      const index = flat.indexOf(result)
                      const selected = index === active

                      return (
                        <a
                          aria-selected={selected}
                          className={cn(
                            'flex min-h-11 items-center gap-3 px-4 py-2.5 sm:px-[18px]',
                            selected ? 'bg-paper' : 'hover:bg-paper',
                          )}
                          href={result.href}
                          id={optionId(index)}
                          key={result.id}
                          onClick={close}
                          onMouseEnter={() => setActiveIndex(index)}
                          rel={result.external ? 'noreferrer noopener' : undefined}
                          role="option"
                          target={result.external ? '_blank' : undefined}
                        >
                          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="text-ink truncate text-[14.5px] font-semibold">
                              {result.title}
                              {result.external ? <span aria-hidden> ↗</span> : null}
                            </span>
                            {result.meta ? (
                              <span className="text-ink-soft truncate text-[12.5px]">
                                {result.meta}
                              </span>
                            ) : null}
                          </span>
                          <span className="text-ink-faint shrink-0 font-mono text-[10px] tracking-[0.12em]">
                            {result.kind}
                          </span>
                        </a>
                      )
                    })}
                  </div>
                ))}
              </div>

              {status === 'ready' && flat.length === 0 ? (
                <div className="flex flex-col items-start gap-2 px-4 pb-4 sm:px-[18px]">
                  <p className="text-ink text-[14.5px] font-semibold">
                    Nothing matches “{query.trim()}”
                  </p>
                  <p className="text-ink-soft text-[13.5px] leading-relaxed">
                    Try a technology, a topic, or a semester. Officers can also add missing
                    material — ask in Discord.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="border-rule bg-[#FAFBF9] text-ink-faint flex gap-[18px] border-t px-4 py-[11px] font-mono text-[10.5px] sm:px-[18px]">
              <span aria-hidden className="hidden sm:inline">
                ↑↓ NAVIGATE
              </span>
              <span aria-hidden className="hidden sm:inline">
                ↵ OPEN
              </span>
              <span aria-hidden>ESC CLOSE</span>
              <span className="flex-1" />
              {status === 'ready' ? (
                <span aria-hidden>
                  {flat.length} {flat.length === 1 ? 'RESULT' : 'RESULTS'}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  )
}
