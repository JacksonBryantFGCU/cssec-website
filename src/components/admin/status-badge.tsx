import { EVENT_STATUSES, titleForValue } from '@/sanity/schemaTypes/shared/options'
import { cn } from '@/lib/utils'

/**
 * An event's status.
 *
 * Colour is a secondary cue only: the status word is always present, so the
 * badge still reads correctly in monochrome or with colour vision deficiency.
 */
const STATUS_STYLES: Record<string, string> = {
  scheduled: 'border-transparent bg-secondary text-secondary-foreground',
  completed: 'border-transparent bg-muted text-muted-foreground',
  cancelled: 'border-destructive/30 bg-destructive/10 text-destructive',
}

export function StatusBadge({ status, className }: { status?: string | null; className?: string }) {
  if (!status) return null

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        STATUS_STYLES[status] ?? 'border-border',
        className,
      )}
    >
      {titleForValue(EVENT_STATUSES, status)}
    </span>
  )
}

/** Neutral label for anything that is not a status (type, level, flags). */
export function MetaBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'text-muted-foreground inline-flex items-center rounded-full border px-2 py-0.5 text-xs whitespace-nowrap',
        className,
      )}
    >
      {children}
    </span>
  )
}
