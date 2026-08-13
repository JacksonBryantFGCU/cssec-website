import { cn } from '@/lib/utils'

/**
 * The heading block every admin screen starts with.
 *
 * Owns the single `<h1>` for the page so heading order stays predictable as
 * more modules are added. `actions` holds the primary action and, where a
 * screen has one, the secondary beside it — the caller orders them, because
 * which is primary differs per screen.
 */
export function AdminPageHeader({
  actions,
  className,
  description,
  kicker,
  title,
}: {
  actions?: React.ReactNode
  className?: string
  description?: string
  /** Short mono label naming the section this screen belongs to. */
  kicker?: string
  title: string
}) {
  return (
    <header
      className={cn(
        'border-rule-card flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b bg-white px-4 py-5 sm:px-6 sm:py-6',
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        {kicker ? (
          <p className="text-ink-label font-mono text-[10.5px] tracking-[0.16em] uppercase">
            {kicker}
          </p>
        ) : null}
        <h1 className="font-display text-ink text-[26px] leading-tight font-bold tracking-[-0.02em]">
          {title}
        </h1>
        {description ? (
          <p className="text-ink-soft max-w-2xl text-[13.5px] leading-relaxed">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}

/**
 * A titled block within a screen, with an optional link on the right.
 *
 * Extracted because the dashboard and the events index were both hand-rolling
 * the same heading row, and their `<h2>`s need to stay consistent for the
 * heading outline to be useful.
 */
export function AdminSection({
  action,
  children,
  id,
  title,
}: {
  action?: React.ReactNode
  children: React.ReactNode
  /** Used to label the section for assistive technology. */
  id: string
  title: string
}) {
  return (
    <section aria-labelledby={`${id}-heading`} className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <h2
          className="text-ink-label font-mono text-[10.5px] tracking-[0.16em] uppercase"
          id={`${id}-heading`}
        >
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}
