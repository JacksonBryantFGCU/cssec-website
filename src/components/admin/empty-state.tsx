/**
 * Shown when a list has nothing in it.
 *
 * CSSEC starts with an empty Content Lake, so "no content yet" is the normal
 * first experience, not an error — it always offers the next action. The dashed
 * rule and mono kicker are the public site's empty-state language, kept so the
 * two halves of the product agree about what "nothing here" looks like.
 */
export function EmptyState({
  action,
  description,
  kicker,
  title,
}: {
  action?: React.ReactNode
  description?: string
  /** Short mono label naming the state, e.g. "NOTHING SCHEDULED". */
  kicker?: string
  title: string
}) {
  return (
    <div className="border-rule-dashed bg-paper-warm flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center">
      {kicker ? (
        <p className="text-ink-label font-mono text-[10.5px] tracking-[0.16em] uppercase">
          {kicker}
        </p>
      ) : null}
      <p className="font-display text-ink text-[17px] font-bold tracking-[-0.01em]">{title}</p>
      {description ? (
        <p className="text-ink-soft max-w-md text-[13px] leading-relaxed">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}
