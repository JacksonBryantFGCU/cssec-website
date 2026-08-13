import { deadlineStatus } from '@/lib/opportunities/deadline'
import { cn } from '@/lib/utils'

/**
 * An open opportunity, as the homepage's "Open deadlines" column shows it.
 *
 * The urgency label is computed from the stored `deadline` on every render —
 * see `@/lib/opportunities/deadline`. Nothing resembling "6 days left" is ever
 * written into Sanity.
 */
export type OpportunityPreviewData = {
  _id: string
  title?: string | null
  organization?: string | null
  location?: string | null
  applicationUrl?: string | null
  deadline?: string | null
}

export function OpportunityPreview({
  opportunity,
}: {
  opportunity: OpportunityPreviewData
}) {
  const status = deadlineStatus(opportunity.deadline)
  const meta = [opportunity.organization, opportunity.location].filter(Boolean).join(' · ')

  const body = (
    <>
      <span className="flex min-w-0 flex-col gap-[3px]">
        <span className="text-ink text-[14.5px] font-semibold sm:text-[15px]">
          {opportunity.title}
        </span>
        {meta ? <span className="text-ink-soft text-[12.5px] sm:text-[13px]">{meta}</span> : null}
      </span>
      <span
        className={cn(
          'shrink-0 font-mono text-[12px] sm:text-right',
          status.urgent ? 'text-urgent font-semibold' : 'text-ink-faint',
        )}
      >
        {/* Urgency is not carried by colour alone: the words change too. */}
        {status.label}
      </span>
    </>
  )

  return (
    <li className="border-rule border-t">
      {opportunity.applicationUrl ? (
        <a
          className="flex min-h-11 items-center justify-between gap-3.5 py-3.5 hover:bg-white"
          href={opportunity.applicationUrl}
          rel="noreferrer noopener"
          target="_blank"
        >
          {body}
        </a>
      ) : (
        <div className="flex min-h-11 items-center justify-between gap-3.5 py-3.5">{body}</div>
      )}
    </li>
  )
}
