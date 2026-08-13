'use client'

import { HardDeleteCard } from '@/components/admin/destructive-section'

import { deleteOpportunity } from '../../actions'

/**
 * Deletion is the only removal action an opportunity has — and it is rarely the
 * right one. An expired posting leaves the public board by itself; the page
 * around this card explains that before offering the button.
 */
export function RemoveOpportunityForms({
  opportunityId,
  opportunityTitle,
}: {
  opportunityId: string
  opportunityTitle: string
}) {
  return (
    <HardDeleteCard
      action={deleteOpportunity}
      allowed
      confirmationLabel="Type the posting title to confirm"
      description="Removes the posting from Sanity for good. There is no undo. This is for something entered by mistake — not for a deadline that has passed."
      documentId={opportunityId}
      documentName={opportunityTitle}
    />
  )
}
