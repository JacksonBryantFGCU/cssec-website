import Link from 'next/link'
import { notFound } from 'next/navigation'

import { requireOfficer } from '@/auth/require-officer'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { buttonVariants } from '@/components/ui/button'
import { opportunityToFormValues } from '@/lib/opportunities/form-values'
import { cn } from '@/lib/utils'
import { getAdminClient } from '@/sanity/lib/admin-client'
import { ADMIN_OPPORTUNITY_BY_ID_QUERY } from '@/sanity/queries/admin'

import { updateOpportunity } from '../../actions'
import { OpportunityForm } from '../../opportunity-form'

export const metadata = { title: 'Edit opportunity' }

export default async function EditOpportunityPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireOfficer({ capability: 'content:write', returnTo: `/admin/opportunities/${id}/edit` })

  const opportunity = await getAdminClient().fetch(ADMIN_OPPORTUNITY_BY_ID_QUERY, { id })

  if (!opportunity) notFound()

  return (
    <>
      <AdminPageHeader
        actions={
          <Link
            className={cn(buttonVariants({ variant: 'outline' }))}
            href={`/admin/opportunities/${opportunity._id}/remove`}
          >
            Delete
          </Link>
        }
        description={
          [opportunity.organization, opportunity.title].filter(Boolean).join(' — ') || undefined
        }
        kicker="Opportunities"
        title="Edit opportunity"
      />
      <OpportunityForm
        action={updateOpportunity}
        cancelHref="/admin/opportunities"
        defaults={opportunityToFormValues(opportunity)}
        opportunityId={opportunity._id}
        submitLabel="Save changes"
      />
    </>
  )
}
