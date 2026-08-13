'use client'

import { HardDeleteCard, SafeRemovalCard } from '@/components/admin/destructive-section'

import { archiveProject, deleteProject } from '../../actions'

/**
 * The two removal options for a project, safest first.
 *
 * Both cards are the shared admin components; this file only binds them to the
 * project actions and writes the words. The policy shown here is re-checked
 * inside the actions against fresh Sanity data — this screen is an explanation,
 * not a gate.
 */
export function RemoveProjectForms({
  blockedReason,
  canArchive,
  canHardDelete,
  projectId,
  projectName,
}: {
  blockedReason?: string
  canArchive: boolean
  canHardDelete: boolean
  projectId: string
  projectName: string
}) {
  return (
    <div className="flex flex-col gap-4">
      <SafeRemovalCard
        action={archiveProject}
        alreadyDone={canArchive ? undefined : 'This project is already archived.'}
        badge="Reversible"
        buttonLabel="Archive this project"
        description="Sets the status to Archived. The project stays on the website as part of the club’s history, sinks to the bottom of the projects page, and stops being offered to students looking to join. This is reversible — set the status back at any time."
        documentId={projectId}
        pendingLabel="Archiving…"
        title="Archive the project"
      />

      <HardDeleteCard
        action={deleteProject}
        allowed={canHardDelete}
        blockedReason={blockedReason}
        confirmationLabel="Type the project name to confirm"
        description="Removes the project from Sanity for good, along with its open roles and the credit it gives contributors. There is no undo."
        documentId={projectId}
        documentName={projectName}
      />
    </div>
  )
}
