'use client'

import { HardDeleteCard } from '@/components/admin/destructive-section'

import { deleteResource } from '../../actions'

/**
 * Deletion is the only removal action a resource has.
 *
 * There is no "archived" resource: a resource *is* its content, so there is
 * nothing meaningful left once you take the content away. The safe alternatives
 * are editorial rather than structural — fix the link, attach the file, unfeature
 * it — and the page around this card says so.
 */
export function RemoveResourceForms({
  blockedReason,
  canHardDelete,
  resourceId,
  resourceTitle,
}: {
  blockedReason?: string
  canHardDelete: boolean
  resourceId: string
  resourceTitle: string
}) {
  return (
    <HardDeleteCard
      action={deleteResource}
      allowed={canHardDelete}
      blockedReason={blockedReason}
      confirmationLabel="Type the resource title to confirm"
      description="Removes the resource from Sanity for good, along with any file uploaded with it. It disappears from the library and from the page of the event it came from. There is no undo."
      documentId={resourceId}
      documentName={resourceTitle}
    />
  )
}
