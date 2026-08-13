import { deadlineStatus } from '@/lib/opportunities/deadline'
import { cn } from '@/lib/utils'
import { OPPORTUNITY_TYPES, titleForValue } from '@/sanity/schemaTypes/shared/options'

/**
 * The opportunity board's rows.
 *
 * Five ruled columns on desktop (organization, opportunity, type, location,
 * deadline) collapsing to a card below `md`, matching the approved design.
 *
 * The deadline label is computed on every render from the stored date — see
 * `@/lib/opportunities/deadline`. Nothing resembling "6 days left" is ever
 * written into Sanity, so a page cached yesterday cannot show a stale count.
 */

export type OpportunityRowData = {
  _id: string
  title?: string | null
  organization?: string | null
  opportunityType?: string | null
  description?: string | null
  location?: string | null
  applicationUrl?: string | null
  deadline?: string | null
  majors?: string[] | null
  skills?: string[] | null
}

function typeLabel(type: string | null | undefined): string {
  return titleForValue(OPPORTUNITY_TYPES, type) ?? 'Opportunity'
}

function audience(opportunity: OpportunityRowData): string | null {
  const values = opportunity.majors?.length ? opportunity.majors : opportunity.skills
  return values?.length ? values.join(', ') : null
}

/** The deadline chip. Urgent changes the words, not only the colour. */
function Deadline({ deadline, urgentMark }: { deadline?: string | null; urgentMark: boolean }) {
  const status = deadlineStatus(deadline)

  return (
    <span
      className={cn(
        'font-mono text-[12px] whitespace-nowrap',
        status.urgent ? 'text-urgent font-semibold' : 'text-ink-faint',
      )}
    >
      {status.urgent && urgentMark ? <span aria-hidden="true">⏱ </span> : null}
      {status.label}
    </span>
  )
}

function ApplyLink({
  opportunity,
  prominent,
}: {
  opportunity: OpportunityRowData
  prominent: boolean
}) {
  if (!opportunity.applicationUrl) {
    return <span className="text-ink-label text-[12.5px]">Ask an officer</span>
  }

  return (
    <a
      className={cn(
        'inline-flex items-center whitespace-nowrap',
        prominent
          ? 'border-club-green text-club-dark hover:bg-club-surface min-h-11 rounded-[7px] border bg-white px-3 text-[12.5px] font-bold sm:min-h-0 sm:py-[7px]'
          : 'text-club-link hover:text-club-link-hover min-h-11 text-[12.5px] font-semibold hover:underline sm:min-h-0',
      )}
      href={opportunity.applicationUrl}
      rel="noreferrer noopener"
      target="_blank"
    >
      Apply ↗<span className="sr-only"> for {opportunity.title}</span>
    </a>
  )
}

export function OpportunityTable({
  closingSoon = false,
  opportunities,
}: {
  /** Adds the warm tint and the stronger Apply button the design gives them. */
  closingSoon?: boolean
  opportunities: OpportunityRowData[]
}) {
  return (
    <div className="md:grid md:grid-cols-[190px_1fr_120px_130px_140px] md:gap-[18px]">
      <div aria-hidden="true" className="hidden md:contents">
        {['ORGANIZATION', 'OPPORTUNITY', 'TYPE', 'LOCATION', 'DEADLINE'].map((heading) => (
          <span
            className="text-ink-label border-b border-[#11201B] pb-2.5 font-mono text-[10px] tracking-[0.14em]"
            key={heading}
          >
            {heading}
          </span>
        ))}
      </div>

      <ul className="flex flex-col gap-3 md:contents">
        {opportunities.map((opportunity) => {
          const people = audience(opportunity)
          // Once the row becomes `md:contents` it has no box of its own, so the
          // tint and rule have to be carried by every cell instead.
          const cell = closingSoon
            ? 'md:bg-urgent-surface md:border-b md:border-[#E8CDBE]'
            : 'md:border-rule md:border-b'

          return (
            <li
              className={cn(
                'flex flex-col gap-1.5 rounded-[10px] border p-4',
                'md:contents',
                closingSoon ? 'border-urgent-border bg-urgent-surface' : 'border-rule',
              )}
              key={opportunity._id}
            >
              {/* Mobile header: type and deadline share a line. */}
              <span className="flex items-baseline justify-between gap-2.5 md:hidden">
                <span className="text-ink-muted font-mono text-[10px]">
                  {typeLabel(opportunity.opportunityType)}
                </span>
                <Deadline deadline={opportunity.deadline} urgentMark={closingSoon} />
              </span>

              <span
                className={cn(
                  'text-ink hidden items-center py-4 text-[15px] font-semibold md:flex',
                  cell,
                )}
              >
                {opportunity.organization}
              </span>

              <span
                className={cn(
                  'flex flex-col gap-1 md:py-4',
                  cell,
                )}
              >
                <span className="text-ink text-base font-semibold md:text-[15.5px]">
                  {opportunity.title}
                </span>
                <span className="text-ink-soft text-[13px] md:hidden">
                  {[opportunity.organization, opportunity.location].filter(Boolean).join(' · ')}
                </span>
                {people ? <span className="text-ink-soft text-[13px]">{people}</span> : null}
                {closingSoon && opportunity.description ? (
                  <span className="text-ink-body text-[13px] leading-relaxed">
                    {opportunity.description}
                  </span>
                ) : null}
              </span>

              <span
                className={cn(
                  'text-ink-muted hidden items-center py-4 font-mono text-[11px] md:flex',
                  cell,
                )}
              >
                {typeLabel(opportunity.opportunityType)}
              </span>

              <span
                className={cn(
                  'text-ink-muted hidden items-center py-4 text-[13.5px] md:flex',
                  cell,
                )}
              >
                {opportunity.location ?? '—'}
              </span>

              <span
                className={cn(
                  'flex items-center justify-between gap-2 md:flex-col md:items-end md:justify-center md:gap-1.5 md:py-4',
                  cell,
                )}
              >
                <span className="hidden md:block">
                  <Deadline deadline={opportunity.deadline} urgentMark={closingSoon} />
                </span>
                <ApplyLink opportunity={opportunity} prominent={closingSoon} />
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
