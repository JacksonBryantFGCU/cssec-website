import { requireOfficer } from '@/auth/require-officer'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { newOpportunityValues } from '@/lib/opportunities/form-values'

import { createOpportunity } from '../actions'
import { OpportunityForm } from '../opportunity-form'

export const metadata = { title: 'Post opportunity' }

export default async function NewOpportunityPage() {
  await requireOfficer({ capability: 'content:write', returnTo: '/admin/opportunities/new' })

  return (
    <>
      <AdminPageHeader
        description="It appears on the opportunity board as soon as you save, and drops off on its own once the deadline passes."
        kicker="Opportunities"
        title="Post opportunity"
      />
      <OpportunityForm
        action={createOpportunity}
        cancelHref="/admin/opportunities"
        defaults={newOpportunityValues()}
        submitLabel="Post opportunity"
      />
    </>
  )
}
