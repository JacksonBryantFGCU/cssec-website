import Link from 'next/link'

import { cn } from '@/lib/utils'

/**
 * The segmented control every admin index uses to switch view.
 *
 * Links rather than buttons, because each view is a real, shareable, reloadable
 * URL — an officer can bookmark "recruiting projects" — and because that keeps
 * the whole index a Server Component with no client state to lose.
 *
 * The count beside each label is honest: it comes from the same fetched list
 * the rows are drawn from, so it can never disagree with what clicking shows.
 */

export type FilterTab<T extends string> = { value: T; label: string }

export function FilterTabs<T extends string>({
  active,
  basePath,
  counts,
  label,
  tabs,
}: {
  active: T
  /** The route the tabs link to, e.g. `/admin/projects`. */
  basePath: string
  counts: Record<T, number>
  /** Names the group for assistive technology, e.g. "Filter projects". */
  label: string
  tabs: readonly FilterTab<T>[]
}) {
  return (
    <nav aria-label={label}>
      {/* Scrollable rather than wrapped on a phone: seven project statuses
          wrapped onto three lines pushes the list itself below the fold. */}
      <ul className="border-rule-card -mx-4 flex gap-1 overflow-x-auto rounded-lg border-y bg-white p-1 sm:mx-0 sm:inline-flex sm:flex-wrap sm:rounded-lg sm:border">
        {tabs.map((tab) => {
          const isActive = tab.value === active

          return (
            <li key={tab.value}>
              <Link
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  'flex min-h-9 items-center gap-1.5 rounded-md px-3 text-[13px] font-semibold whitespace-nowrap transition-colors',
                  isActive
                    ? 'bg-club-surface text-club-dark'
                    : 'text-ink-soft hover:bg-rule-fill hover:text-ink',
                )}
                href={`${basePath}?filter=${tab.value}`}
              >
                {tab.label}
                <span
                  className={cn(
                    'font-mono text-[11px] tabular-nums',
                    isActive ? 'text-club-link' : 'text-ink-label',
                  )}
                >
                  {counts[tab.value]}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** The confirmation strip an index shows after a redirect from a mutation. */
export function SavedNotice({ detail, message }: { detail?: string; message?: string }) {
  if (!message) return null

  return (
    <p
      className="border-club-border bg-club-surface text-club-dark flex items-start gap-2 rounded-md border px-4 py-3 text-[13.5px] font-medium"
      role="status"
    >
      <span aria-hidden="true">✓</span>
      <span>
        {message}
        {detail ? ` — “${detail}”` : ''}
      </span>
    </p>
  )
}
