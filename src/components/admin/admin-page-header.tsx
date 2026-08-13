import { cn } from '@/lib/utils'

/**
 * The heading block every admin screen starts with.
 *
 * Owns the single `<h1>` for the page so heading order stays predictable as
 * more modules are added.
 */
export function AdminPageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <header
      className={cn('flex flex-wrap items-start justify-between gap-4 border-b px-6 py-6', className)}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}
