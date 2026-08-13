import Link from 'next/link'

import type { FilterChip } from '@/lib/filters/params'
import { cn } from '@/lib/utils'

/**
 * The chip rows the approved design puts under a page masthead.
 *
 * Every chip is a real `<Link>` to the same page with a different query
 * string, so filtering is a normal navigation: it works without JavaScript,
 * the back button behaves, and a filtered view can be shared. There is no
 * client state here and no `onClick` anywhere.
 *
 * Active state is carried three ways — a filled chip, a bold weight and
 * `aria-current` — so it never depends on colour alone.
 */

/** One facet's row of chips. */
export type FilterGroup = {
  /** Mono label, e.g. "STATUS". Also names the row for assistive technology. */
  label: string
  chips: FilterChip[]
  /**
   * The one value that gets the green active treatment rather than the dark
   * one — in the reference only "Recruiting" does, because it is the state the
   * page wants you to notice.
   */
  greenValue?: string
}

function Chip({ chip, tone }: { chip: FilterChip; tone: 'ink' | 'green' }) {
  return (
    <Link
      aria-current={chip.active ? 'true' : undefined}
      className={cn(
        // 44px tall on mobile per the reference; tighter once there is a pointer.
        'inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-[20px] border px-4 text-sm whitespace-nowrap transition-colors',
        'sm:min-h-0 sm:px-3.5 sm:py-2 sm:text-[13px]',
        chip.active
          ? tone === 'green'
            ? 'border-club-border bg-club-surface text-club-dark font-bold'
            : 'border-ink bg-ink font-semibold text-white'
          : 'border-rule-strong text-ink-body hover:border-ink-faint bg-white font-medium hover:bg-white',
      )}
      href={chip.href}
    >
      {chip.label}
      {typeof chip.count === 'number' ? (
        <span
          className={cn(
            'font-mono text-[11px] tabular-nums',
            chip.active ? 'opacity-70' : 'text-ink-label',
          )}
        >
          {chip.count}
        </span>
      ) : null}
    </Link>
  )
}

/**
 * `action` is the trailing control the design places at the end of the row
 * (Pitch a project, Submit a listing). It is separated from the chips so it
 * never scrolls out of reach with them on mobile.
 */
export function FilterBar({
  action,
  className,
  groups,
}: {
  action?: React.ReactNode
  className?: string
  groups: FilterGroup[]
}) {
  const rows = groups.filter((group) => group.chips.length > 1)
  if (rows.length === 0 && !action) return null

  return (
    <div
      className={cn(
        'border-rule bg-white px-4 py-3 sm:px-7 sm:py-3.5',
        'flex flex-col gap-2.5 border-b sm:flex-row sm:flex-wrap sm:items-center sm:gap-3',
        className,
      )}
    >
      {rows.map((group) => (
        <nav
          aria-label={`Filter by ${group.label.toLowerCase()}`}
          // Chips scroll sideways on a narrow screen rather than stacking into
          // a wall that pushes the results off the fold.
          className="-mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
          key={group.label}
        >
          {group.chips.map((chip) => (
            <Chip
              chip={chip}
              key={chip.value ?? 'all'}
              tone={chip.value && chip.value === group.greenValue ? 'green' : 'ink'}
            />
          ))}
        </nav>
      ))}

      {action ? (
        <>
          <span className="hidden flex-1 sm:block" />
          <div className="shrink-0">{action}</div>
        </>
      ) : null}
    </div>
  )
}

/**
 * The library's sidebar variant of the same chips.
 *
 * The resource design puts topics and types in a left rail with counts rather
 * than in a chip row, because the archive is browsed by subject. Same data,
 * same hrefs — only the arrangement differs, so a page can switch between the
 * two without changing how filtering works.
 */
export function FilterList({ groups }: { groups: FilterGroup[] }) {
  const rows = groups.filter((group) => group.chips.length > 1)
  if (rows.length === 0) return null

  return (
    <div className="flex flex-col gap-6">
      {rows.map((group) => (
        <nav aria-label={`Filter by ${group.label.toLowerCase()}`} key={group.label}>
          <p className="text-ink-label mb-2 font-mono text-[10px] tracking-[0.16em] uppercase">
            {group.label}
          </p>
          <ul className="flex flex-col">
            {group.chips.map((chip) => (
              <li key={chip.value ?? 'all'}>
                <Link
                  aria-current={chip.active ? 'true' : undefined}
                  className={cn(
                    'flex min-h-9 items-center justify-between gap-3 rounded-md px-2 py-1.5 text-[13.5px] transition-colors',
                    chip.active
                      ? 'bg-club-surface text-club-dark font-bold'
                      : 'text-ink-body hover:bg-rule-fill',
                  )}
                  href={chip.href}
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    {/* A mark as well as weight and colour, so the selection
                        survives greyscale. */}
                    <span aria-hidden="true" className={chip.active ? 'text-club-link' : 'invisible'}>
                      ✓
                    </span>
                    <span className="truncate">{chip.label}</span>
                  </span>
                  {typeof chip.count === 'number' ? (
                    <span className="text-ink-label shrink-0 font-mono text-[11.5px] tabular-nums">
                      {chip.count}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ))}
    </div>
  )
}

/**
 * The "nothing matched" state, distinct from "there is nothing here at all".
 *
 * A filtered empty result always offers a way back out, because the filter is
 * the thing hiding the content.
 */
export function NoMatches({
  action,
  body,
  clearHref,
  title,
}: {
  action?: React.ReactNode
  body: string
  clearHref: string
  title: string
}) {
  return (
    <div className="flex flex-col items-center gap-2.5 px-4 py-12 text-center sm:py-16">
      <p className="text-ink-label font-mono text-[10.5px] tracking-[0.16em]">NO MATCHES</p>
      <p className="font-display text-ink text-xl font-semibold sm:text-[22px]">{title}</p>
      <p className="text-ink-soft max-w-[440px] text-sm leading-relaxed">{body}</p>
      <div className="flex flex-wrap justify-center gap-2.5 pt-2">
        <Link
          className="bg-ink inline-flex min-h-11 items-center rounded-lg px-4 text-[13px] font-semibold text-white"
          href={clearHref}
        >
          Clear filters
        </Link>
        {action}
      </div>
    </div>
  )
}
