import Link from 'next/link'

import { requireOfficer } from '@/auth/require-officer'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { EmptyState } from '@/components/admin/empty-state'
import { FilterTabs, SavedNotice, type FilterTab } from '@/components/admin/filter-tabs'
import { FeaturedBadge, MetaBadge } from '@/components/admin/status-badge'
import { buttonVariants } from '@/components/ui/button'
import { deadlineStatus } from '@/lib/opportunities/deadline'
import { formatCalendarDate } from '@/lib/time'
import { cn } from '@/lib/utils'
import { getAdminClient } from '@/sanity/lib/admin-client'
import { ADMIN_OPPORTUNITIES_QUERY } from '@/sanity/queries/admin'
import {
  OPPORTUNITY_TYPES,
  WORK_ARRANGEMENTS,
  titleForValue,
} from '@/sanity/schemaTypes/shared/options'

export const metadata = { title: 'Opportunities' }

const FILTERS = [
  { value: 'open', label: 'Open' },
  { value: 'closing', label: 'Closing soon' },
  { value: 'expired', label: 'Expired' },
  { value: 'all', label: 'All' },
] as const satisfies readonly FilterTab<string>[]

type Filter = (typeof FILTERS)[number]['value']

const SAVED_MESSAGES: Record<string, string> = {
  created: 'Opportunity posted.',
  updated: 'Changes saved.',
  deleted: 'Opportunity deleted.',
}

function parseFilter(value: string | string[] | undefined): Filter {
  const match = FILTERS.find((filter) => filter.value === value)
  return match?.value ?? 'open'
}

/**
 * The opportunity board's admin side.
 *
 * Every view is computed from `deadline` through the same `deadlineStatus`
 * helper the public board uses, so the tab an officer finds a posting under and
 * the label a student sees on it can never disagree. Nothing in Sanity records
 * "expired" — see the note in `@/lib/opportunities/deadline`.
 */
export default async function AdminOpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireOfficer({ capability: 'content:write', returnTo: '/admin/opportunities' })

  const params = await searchParams
  const filter = parseFilter(params.filter)
  const saved = typeof params.saved === 'string' ? SAVED_MESSAGES[params.saved] : undefined
  const savedTitle = typeof params.title === 'string' ? params.title : undefined

  const opportunities = await getAdminClient().fetch(ADMIN_OPPORTUNITIES_QUERY)

  // One clock reading for the whole page, so two rows cannot disagree about
  // what "today" is if the render straddles midnight.
  const now = new Date()
  const rows = opportunities.map((opportunity) => ({
    opportunity,
    deadline: deadlineStatus(opportunity.deadline, now),
  }))

  const open = rows.filter((row) => !row.deadline.expired)
  const closing = open.filter((row) => row.deadline.urgent)
  const expired = rows.filter((row) => row.deadline.expired)

  const counts: Record<Filter, number> = {
    open: open.length,
    closing: closing.length,
    expired: expired.length,
    all: rows.length,
  }

  const visible =
    filter === 'open' ? open : filter === 'closing' ? closing : filter === 'expired' ? expired : rows

  return (
    <>
      <AdminPageHeader
        actions={
          <Link className={cn(buttonVariants())} href="/admin/opportunities/new">
            Post opportunity
          </Link>
        }
        description="Internships, research, scholarships and competitions curated for students."
        kicker="Content"
        title="Opportunities"
      />

      <div className="flex flex-col gap-4 px-4 py-6 sm:px-6">
        <SavedNotice detail={savedTitle} message={saved} />

        <FilterTabs
          active={filter}
          basePath="/admin/opportunities"
          counts={counts}
          label="Filter opportunities"
          tabs={FILTERS}
        />

        {rows.length === 0 ? (
          <EmptyState
            action={
              <Link className={cn(buttonVariants())} href="/admin/opportunities/new">
                Post the first opportunity
              </Link>
            }
            description="Postings appear on the public opportunity board and drop out of it on their own once the deadline passes."
            kicker="Nothing yet"
            title="No opportunities yet"
          />
        ) : visible.length === 0 ? (
          <EmptyState
            description={
              filter === 'closing'
                ? 'Nothing closes within the next two weeks.'
                : filter === 'expired'
                  ? 'Nothing has closed yet. Expired postings are kept here as a record.'
                  : 'Nothing here right now.'
            }
            kicker="Empty filter"
            title="Nothing here"
          />
        ) : (
          <ul className="border-rule-card divide-rule divide-y rounded-lg border bg-white">
            {visible.map(({ deadline, opportunity }) => (
              <li
                className="hover:bg-paper-warm flex flex-col gap-3 px-4 py-4 transition-colors sm:flex-row sm:items-start sm:justify-between sm:gap-6"
                key={opportunity._id}
              >
                <div className="flex min-w-0 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      className="text-ink text-[15px] font-semibold underline-offset-4 hover:underline"
                      href={`/admin/opportunities/${opportunity._id}/edit`}
                    >
                      {opportunity.title ?? 'Untitled posting'}
                    </Link>
                    {/* The deadline state, in words and with a glyph — never
                        colour alone. */}
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded px-2 py-[3px] font-mono text-[10px] tracking-[0.12em] whitespace-nowrap uppercase',
                        deadline.expired
                          ? 'text-ink-muted bg-rule-fill'
                          : deadline.urgent
                            ? 'text-urgent bg-urgent-surface'
                            : 'text-club-dark bg-club-surface-tint',
                      )}
                    >
                      <span aria-hidden="true">
                        {deadline.expired ? '✓' : deadline.urgent ? '!' : '●'}
                      </span>
                      {deadline.label}
                    </span>
                    {opportunity.featured ? <FeaturedBadge /> : null}
                  </div>

                  <p className="text-ink-soft font-mono text-[11.5px]">
                    {opportunity.organization ?? 'Unknown organization'}
                    {opportunity.location ? ` · ${opportunity.location}` : ''}
                    {opportunity.deadline
                      ? ` · Closes ${formatCalendarDate(opportunity.deadline)}`
                      : ''}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <MetaBadge>
                      {titleForValue(OPPORTUNITY_TYPES, opportunity.opportunityType) ??
                        'Opportunity'}
                    </MetaBadge>
                    {opportunity.workArrangement ? (
                      <MetaBadge>
                        {titleForValue(WORK_ARRANGEMENTS, opportunity.workArrangement)}
                      </MetaBadge>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Link
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                    href={`/admin/opportunities/${opportunity._id}/edit`}
                  >
                    Edit<span className="sr-only"> {opportunity.title ?? 'opportunity'}</span>
                  </Link>
                  <Link
                    className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                    href={`/admin/opportunities/${opportunity._id}/remove`}
                  >
                    Remove<span className="sr-only"> {opportunity.title ?? 'opportunity'}</span>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="text-ink-faint text-[12px]">
          Expired postings stay here on purpose — they are a record of what the club has shared, and
          they cost nothing. There is no need to delete one just because its deadline has passed.
        </p>
      </div>
    </>
  )
}
