'use client'

import { HardDeleteCard, SafeRemovalCard } from '@/components/admin/destructive-section'

import { deleteOfficerTerm, endOfficerTerm } from '../../../actions'

/**
 * Ending a term and deleting one are completely different acts.
 *
 * Ending is what a handover needs, every year, and it is the safe option: the
 * record stays and simply stops being current. Deleting is for a term typed in
 * by mistake — it erases a piece of the club's leadership history, which is the
 * one thing the separate `officerRole` document exists to protect.
 */
export function RemoveOfficerTermForms({
  isCurrent,
  termId,
  termName,
}: {
  isCurrent: boolean
  termId: string
  termName: string
}) {
  return (
    <div className="flex flex-col gap-4">
      <SafeRemovalCard
        action={endOfficerTerm}
        alreadyDone={isCurrent ? undefined : 'This term has already ended.'}
        badge="Reversible"
        buttonLabel="End this term"
        description="Marks the term as no longer current. It comes off the public leadership list and moves into the club’s leadership history, where it stays. This is what a handover needs — and it is reversible."
        documentId={termId}
        pendingLabel="Ending…"
        title="End the term"
      />

      <HardDeleteCard
        action={deleteOfficerTerm}
        allowed
        confirmationLabel="Type the position to confirm"
        description="Removes the term from Sanity for good, erasing the record that this person held this position. There is no undo. Use this only for a term entered by mistake — to hand over, end the term instead. Deleting a term does not touch the person’s record or anybody’s login."
        documentId={termId}
        documentName={termName}
      />
    </div>
  )
}
