import Link from 'next/link'

import { cn } from '@/lib/utils'

/**
 * The CSSEC mark: gradient tile, wordmark, and the FGCU affiliation rule.
 *
 * The affiliation is part of the identity in the approved design rather than a
 * separate credit, so it travels with the wordmark everywhere it appears.
 */
export function SiteWordmark({ className }: { className?: string }) {
  return (
    <Link
      className={cn(
        'flex shrink-0 items-center gap-2.5 rounded-sm text-navy-fg',
        'transition-opacity hover:opacity-90',
        className,
      )}
      href="/"
    >
      <span
        aria-hidden
        className={cn(
          'flex size-7 items-center justify-center rounded-[7px]',
          'bg-linear-140 from-[#3FBE84] to-[#1D7E8C]',
          'font-mono text-[13px] font-semibold text-[#04121D]',
        )}
      >
        C
      </span>
      <span className="font-display text-[17px] font-bold tracking-[-0.01em]">CSSEC</span>
      <span className="border-navy-edge text-navy-quiet border-l pl-2.5 font-mono text-[10px] tracking-[0.1em]">
        FGCU
      </span>
      <span className="sr-only">
        — Computer Science &amp; Software Engineering Club, Florida Gulf Coast University
      </span>
    </Link>
  )
}
