import { cn } from '@/lib/utils'

/**
 * The small repeated pieces of the public design system.
 *
 * These exist because the approved design uses each of them in three or more
 * places with identical treatment — not to abstract for its own sake. The
 * component-system page in the reference states the rules they encode:
 *
 *  - Mono is metadata: dates, counts, tags, kinds and shortcuts only.
 *  - Every status carries a glyph as well as a colour.
 *  - Rows over cards for lists of comparable things.
 */

/** The uppercase mono kicker above a section heading. */
export function MonoLabel({
  children,
  className,
  tone = 'muted',
}: {
  children: React.ReactNode
  className?: string
  tone?: 'muted' | 'green' | 'navy'
}) {
  return (
    <span
      className={cn(
        'font-mono text-[10.5px] tracking-[0.16em]',
        tone === 'green' && 'text-club-link',
        tone === 'muted' && 'text-ink-label',
        tone === 'navy' && 'text-navy-quiet',
        className,
      )}
    >
      {children}
    </span>
  )
}

/**
 * A section heading with its optional kicker, standfirst and trailing link.
 *
 * `variant` picks between the two heading faces the design alternates: the
 * display sans for structural sections, the serif for the editorial ones (the
 * workshop archive, past meetings).
 */
export function SectionHeader({
  kicker,
  title,
  standfirst,
  action,
  variant = 'display',
  className,
}: {
  kicker?: string
  title: string
  standfirst?: string
  action?: React.ReactNode
  variant?: 'display' | 'editorial' | 'compact'
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row',
        variant === 'display' ? 'sm:items-end' : 'sm:items-baseline',
        'sm:gap-4',
        className,
      )}
    >
      <div
        className={cn(
          'flex min-w-0 gap-1.5',
          variant === 'editorial' ? 'flex-col sm:flex-row sm:items-baseline sm:gap-4' : 'flex-col',
        )}
      >
        {kicker ? <MonoLabel tone="green">{kicker}</MonoLabel> : null}
        <h2
          className={cn(
            'text-ink m-0',
            variant === 'editorial' &&
              'font-serif text-[26px] font-normal tracking-[-0.01em] sm:text-[29px]',
            variant === 'display' &&
              'font-display text-[23px] font-semibold tracking-[-0.022em] sm:text-[30px]',
            variant === 'compact' &&
              'font-display text-xl font-semibold tracking-[-0.015em] sm:text-[21px]',
          )}
        >
          {title}
        </h2>
        {standfirst ? <p className="text-ink-soft text-sm">{standfirst}</p> : null}
      </div>

      {action ? (
        <>
          <span className="hidden flex-1 sm:block" />
          <div className="shrink-0">{action}</div>
        </>
      ) : null}
    </div>
  )
}

/** The green "→" link that closes most sections. */
export function SectionLink({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <a
      className="text-club-link hover:text-club-link-hover inline-flex min-h-11 items-center text-sm font-semibold hover:underline sm:min-h-0"
      href={href}
    >
      {children}
    </a>
  )
}

/**
 * The experience-level pill.
 *
 * Green for "no experience required", blue for anything that assumes some
 * background — and a glyph in both cases, so the distinction survives
 * greyscale printing and colour-vision differences.
 */
export function LevelBadge({
  label,
  tone,
  className,
}: {
  label: string
  tone: 'beginner' | 'experienced'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[20px] border px-[9px] py-[3px] text-[12.5px] font-bold',
        tone === 'beginner'
          ? 'text-club-dark bg-club-surface border-club-border'
          : 'text-level-blue bg-level-blue-surface border-level-blue-border',
        className,
      )}
    >
      <span aria-hidden>{tone === 'beginner' ? '✓' : '◆'}</span>
      {label}
    </span>
  )
}

const STATUS_TONES: Record<string, { className: string; glyph: string }> = {
  recruiting: { className: 'text-club-dark bg-club-surface-tint', glyph: '◆' },
  active: { className: 'text-level-blue bg-level-blue-surface', glyph: '●' },
  testing: { className: 'text-level-blue bg-level-blue-surface', glyph: '◐' },
  shipped: { className: 'text-ink-muted bg-[#E7EAE6]', glyph: '✓' },
  archived: { className: 'text-ink-soft bg-rule-fill', glyph: '✓' },
  idea: { className: 'text-ink-soft bg-rule-fill', glyph: '○' },
}

/** The mono status chip used on projects. Glyph plus word plus colour. */
export function StatusBadge({ status, label }: { status: string; label: string }) {
  const tone = STATUS_TONES[status] ?? STATUS_TONES.idea

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded px-2 py-[3px] font-mono text-[10px] tracking-[0.12em] uppercase',
        tone.className,
      )}
    >
      <span aria-hidden>{tone.glyph}</span>
      {label}
    </span>
  )
}

/** A technology tag. Mono, because it is metadata. */
export function TechTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="border-rule-strong text-ink-muted rounded border px-2 py-[3px] font-mono text-[11px]">
      {children}
    </span>
  )
}

/**
 * The stacked date block: weekday, day, month.
 *
 * `tone` switches it between the navy masthead and the light content surfaces;
 * the whole block is `aria-hidden` and its caller supplies a readable date,
 * because "THU 18 SEP" read aloud in three fragments is worse than useless.
 */
export function EventDateBlock({
  parts,
  tone = 'light',
  size = 'md',
}: {
  parts: { weekday: string; day: string; month: string }
  tone?: 'light' | 'navy'
  size?: 'md' | 'lg'
}) {
  return (
    <div aria-hidden className="text-center">
      <div
        className={cn(
          'font-mono text-[11px] tracking-[0.12em]',
          tone === 'navy' ? 'text-club-green-bright' : 'text-club-link',
        )}
      >
        {parts.weekday}
      </div>
      <div
        className={cn(
          'font-display font-semibold tracking-[-0.03em]',
          tone === 'navy' ? 'text-navy-fg leading-[1.02] font-bold' : 'text-ink leading-[1.05]',
          size === 'lg' ? 'text-[34px] sm:text-[46px]' : 'text-[26px] sm:text-[34px]',
        )}
      >
        {parts.day}
      </div>
      <div
        className={cn(
          'font-mono text-[11px]',
          tone === 'navy' ? 'text-navy-quiet' : 'text-ink-faint',
        )}
      >
        {parts.month}
      </div>
    </div>
  )
}

/**
 * The production empty state.
 *
 * Every list on the public site can legitimately be empty — a new semester, a
 * dataset that has not been filled in yet — so this is a designed state in the
 * site's own language rather than a blank region, and it always offers a way
 * onward.
 */
export function EmptyState({
  kicker = 'NOTHING HERE YET',
  title,
  body,
  actions,
  className,
}: {
  kicker?: string
  title: string
  body: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'border-rule-dashed flex flex-col items-center gap-2.5 rounded-[10px] border border-dashed px-6 py-12 text-center',
        className,
      )}
    >
      <MonoLabel className="text-[11px]">{kicker}</MonoLabel>
      <p className="font-display text-ink text-[20px] font-semibold sm:text-[22px]">{title}</p>
      <p className="text-ink-soft max-w-[440px] text-sm leading-relaxed">{body}</p>
      {actions ? <div className="flex flex-wrap justify-center gap-2.5 pt-2">{actions}</div> : null}
    </div>
  )
}
