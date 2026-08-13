import Link from 'next/link'
import { notFound } from 'next/navigation'

import { requireOfficer } from '@/auth/require-officer'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { MetaBadge } from '@/components/admin/status-badge'
import { buttonVariants } from '@/components/ui/button'
import { deadlineStatus } from '@/lib/opportunities/deadline'
import { formatCalendarDate } from '@/lib/time'
import { cn } from '@/lib/utils'
import { getAdminClient } from '@/sanity/lib/admin-client'
import { ADMIN_OPPORTUNITY_BY_ID_QUERY } from '@/sanity/queries/admin'
import { OPPORTUNITY_TYPES, titleForValue } from '@/sanity/schemaTypes/shared/options'

import { RemoveOpportunityForms } from './remove-forms'

export const metadata = { title: 'Delete opportunity' }

export default async function RemoveOpportunityPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireOfficer({
    capability: 'content:write',
    returnTo: `/admin/opportunities/${id}/remove`,
  })

  const opportunity = await getAdminClient().fetch(ADMIN_OPPORTUNITY_BY_ID_QUERY, { id })

  if (!opportunity) notFound()

  const deadline = deadlineStatus(opportunity.deadline)

  return (
    <>
      <AdminPageHeader
        description="Deleting is permanent, and a passed deadline is not a reason to."
        kicker="Opportunities"
        title="Delete opportunity"
      />

      <div className="flex max-w-2xl flex-col gap-5 px-4 py-6 sm:px-6">
        <section className="border-rule-card flex flex-col gap-2 rounded-lg border bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-ink text-[15px] font-semibold">
              {opportunity.title ?? 'Untitled posting'}
            </h2>
            <MetaBadge>
              {titleForValue(OPPORTUNITY_TYPES, opportunity.opportunityType) ?? 'Opportunity'}
            </MetaBadge>
          </div>
          <p className="text-ink-soft font-mono text-[11.5px]">
            {opportunity.organization ?? 'Unknown organization'}
            {opportunity.deadline ? ` · Closed ${formatCalendarDate(opportunity.deadline)}` : ''}
          </p>
        </section>

        {deadline.expired ? (
          <p
            className="border-rule bg-paper-warm text-ink-body rounded-lg border px-4 py-3 text-[13px] leading-relaxed"
            role="note"
          >
            This posting has already closed, so it is no longer shown on the public board. It costs
            nothing to keep, and it is a record of what the club shared with students — there is no
            need to delete it.
          </p>
        ) : null}

        <RemoveOpportunityForms
          opportunityId={opportunity._id}
          opportunityTitle={opportunity.title ?? 'Untitled posting'}
        />

        <Link
          className={cn(buttonVariants({ variant: 'ghost' }), 'self-start')}
          href="/admin/opportunities"
        >
          Back to opportunities
        </Link>
      </div>
    </>
  )
}
