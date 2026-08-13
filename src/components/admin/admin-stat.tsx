import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * A single dashboard number, optionally linking to the screen that manages it.
 *
 * The count is the loudest thing in the tile and the label the quietest — this
 * is an operational readout, not a marketing statistic, so nothing here grows
 * beyond what the number needs.
 */
export function AdminStat({
  href,
  hint,
  icon: Icon,
  label,
  value,
}: {
  href?: string
  hint?: string
  icon?: LucideIcon
  label: string
  value: number
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-ink-label font-mono text-[10.5px] tracking-[0.14em] uppercase">
          {label}
        </span>
        {Icon ? <Icon aria-hidden="true" className="text-ink-disabled size-4 shrink-0" /> : null}
      </div>
      <span className="font-display text-ink text-[30px] leading-none font-bold tabular-nums">
        {value}
      </span>
      <span className="text-ink-faint min-h-4 text-[12px]">{hint ?? ''}</span>
    </>
  )

  const shell = 'border-rule-card flex flex-col gap-2 rounded-lg border bg-white p-4'

  if (href) {
    return (
      <Link
        className={cn(
          shell,
          'hover:border-club-border hover:bg-club-surface-soft group transition-colors',
        )}
        href={href}
      >
        {body}
      </Link>
    )
  }

  return <div className={shell}>{body}</div>
}
