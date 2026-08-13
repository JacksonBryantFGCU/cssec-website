/**
 * Shown when a list has nothing in it.
 *
 * CSSEC starts with an empty Content Lake, so "no content yet" is the normal
 * first experience, not an error — it always offers the next action.
 */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center">
      <p className="font-medium">{title}</p>
      {description ? <p className="text-muted-foreground max-w-md text-sm">{description}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  )
}
