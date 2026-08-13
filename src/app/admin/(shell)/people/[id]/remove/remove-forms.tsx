'use client'

import { HardDeleteCard } from '@/components/admin/destructive-section'

import { deletePerson } from '../../actions'

/**
 * Deleting a person is only ever offered when nothing credits them.
 *
 * There is no safe alternative state — a person record either exists or does
 * not — so the page around this card lists every place they are used instead,
 * which is the thing an officer can actually act on.
 */
export function RemovePersonForms({
  blockedReason,
  canHardDelete,
  personId,
  personName,
}: {
  blockedReason?: string
  canHardDelete: boolean
  personId: string
  personName: string
}) {
  return (
    <HardDeleteCard
      action={deletePerson}
      allowed={canHardDelete}
      blockedReason={blockedReason}
      confirmationLabel="Type the person’s name to confirm"
      description="Removes the person record from Sanity for good, along with the photo uploaded with it. There is no undo. This does not touch anybody’s login."
      documentId={personId}
      documentName={personName}
    />
  )
}
