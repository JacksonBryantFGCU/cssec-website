import type { Role } from '@/auth/roles'
import { roleLabel } from '@/auth/roles'
import { cn } from '@/lib/utils'
import {
  EVENT_STATUSES,
  PROJECT_STATUSES,
  titleForValue,
} from '@/sanity/schemaTypes/shared/options'

/**
 * The admin badge system.
 *
 * Deliberately the same grammar as the public site's chips — mono, uppercase,
 * glyph plus word plus colour — so a status means the same thing on both sides
 * of the product. Colour is never the only cue: every badge names its state in
 * words and carries a shape, so it survives greyscale and colour-vision
 * differences.
 *
 * The admin needs a superset of the public statuses (it is the only place that
 * shows cancelled events and officer roles), which is why it states its own map
 * rather than importing the public one.
 */

const chip =
  'inline-flex items-center gap-1 rounded px-2 py-[3px] font-mono text-[10px] tracking-[0.12em] whitespace-nowrap uppercase'

const EVENT_TONES: Record<string, { className: string; glyph: string }> = {
  scheduled: { className: 'text-club-dark bg-club-surface-tint', glyph: '●' },
  completed: { className: 'text-ink-muted bg-rule-fill', glyph: '✓' },
  cancelled: { className: 'text-destructive bg-destructive/10', glyph: '✕' },
}

const PROJECT_TONES: Record<string, { className: string; glyph: string }> = {
  recruiting: { className: 'text-club-dark bg-club-surface-tint', glyph: '◆' },
  active: { className: 'text-level-blue bg-level-blue-surface', glyph: '●' },
  testing: { className: 'text-level-blue bg-level-blue-surface', glyph: '◐' },
  shipped: { className: 'text-ink-muted bg-rule-fill', glyph: '✓' },
  archived: { className: 'text-ink-soft bg-rule-fill', glyph: '✓' },
  idea: { className: 'text-ink-soft bg-rule-fill', glyph: '○' },
}

const NEUTRAL = { className: 'text-ink-soft bg-rule-fill', glyph: '○' }

/** An event's status. */
export function StatusBadge({ status, className }: { status?: string | null; className?: string }) {
  if (!status) return null

  const tone = EVENT_TONES[status] ?? NEUTRAL

  return (
    <span className={cn(chip, tone.className, className)}>
      <span aria-hidden="true">{tone.glyph}</span>
      {titleForValue(EVENT_STATUSES, status) ?? status}
    </span>
  )
}

/** A project's status. Shares the public site's tones exactly. */
export function ProjectStatusBadge({
  status,
  className,
}: {
  status?: string | null
  className?: string
}) {
  if (!status) return null

  const tone = PROJECT_TONES[status] ?? NEUTRAL

  return (
    <span className={cn(chip, tone.className, className)}>
      <span aria-hidden="true">{tone.glyph}</span>
      {titleForValue(PROJECT_STATUSES, status) ?? status}
    </span>
  )
}

/** An officer's role. */
export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  return (
    <span
      className={cn(
        chip,
        role === 'admin'
          ? 'text-level-blue bg-level-blue-surface'
          : 'text-ink-muted bg-rule-fill',
        className,
      )}
    >
      <span aria-hidden="true">{role === 'admin' ? '★' : '●'}</span>
      {roleLabel(role)}
    </span>
  )
}

/** Marks content promoted to the homepage. */
export function FeaturedBadge({ className }: { className?: string }) {
  return (
    <span className={cn(chip, 'text-club-dark border-club-border border bg-transparent', className)}>
      <span aria-hidden="true">★</span>
      Featured
    </span>
  )
}

/** Neutral label for anything that is not a status (type, counts). */
export function MetaBadge({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'border-rule-strong text-ink-muted inline-flex items-center rounded border px-2 py-[3px] font-mono text-[10.5px] whitespace-nowrap',
        className,
      )}
    >
      {children}
    </span>
  )
}
