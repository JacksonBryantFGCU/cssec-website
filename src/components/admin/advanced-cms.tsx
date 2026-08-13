import { Database } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * The route into Sanity Studio.
 *
 * Studio is the fallback for everything `/admin` does not model yet, so it has
 * to be findable — but it is not where an officer should start, so it is styled
 * as a secondary, slightly technical block rather than a primary action:
 * outlined button, mono kicker, no colour of its own.
 *
 * It is a plain link. Studio runs its own Sanity authentication, which this
 * neither extends nor bypasses.
 */
export function AdvancedCmsCard({ children }: { children?: React.ReactNode }) {
  return (
    <aside className="border-rule-card bg-paper-warm flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
      <span
        aria-hidden="true"
        className="border-rule-strong text-ink-faint grid size-9 shrink-0 place-items-center rounded-md border bg-white"
      >
        <Database className="size-4" />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-ink-label font-mono text-[10.5px] tracking-[0.16em] uppercase">
          Advanced
        </p>
        <p className="text-ink text-[14.5px] font-semibold">Advanced CMS</p>
        <p className="text-ink-soft text-[12.5px] leading-relaxed">
          {children ?? 'Use Sanity Studio for advanced content editing.'}
        </p>
      </div>

      <a
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'shrink-0 self-start')}
        href="/studio"
        rel="noreferrer"
        target="_blank"
      >
        Open Studio<span aria-hidden="true"> ↗</span>
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </aside>
  )
}
