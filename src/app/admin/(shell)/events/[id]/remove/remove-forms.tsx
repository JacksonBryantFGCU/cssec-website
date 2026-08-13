'use client'

import { useActionState, useState } from 'react'

import { Button } from '@/components/ui/button'
import type { EventActionResult } from '@/lib/events/form-state'

import { cancelEvent, deleteEvent } from '../../actions'

/**
 * The two removal options, safest first.
 *
 * Permanent deletion is behind a second, deliberate step: the officer has to
 * type the event's title. That is not security — the action re-checks the
 * removal policy server-side — it is there so a destructive click cannot happen
 * by muscle memory.
 */
export function RemoveEventForms({
  blockedReason,
  canCancel,
  canHardDelete,
  eventId,
  eventTitle,
}: {
  blockedReason?: string
  canCancel: boolean
  canHardDelete: boolean
  eventId: string
  eventTitle: string
}) {
  const [cancelResult, cancelAction, cancelPending] = useActionState<EventActionResult | null, FormData>(
    cancelEvent,
    null,
  )
  const [deleteResult, deleteAction, deletePending] = useActionState<EventActionResult | null, FormData>(
    deleteEvent,
    null,
  )
  const [confirmation, setConfirmation] = useState('')

  const confirmed = confirmation.trim() === eventTitle.trim()

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 rounded-lg border p-4">
        <h2 className="font-medium">Cancel the event</h2>
        <p className="text-muted-foreground text-sm">
          Sets the status to Cancelled. It disappears from upcoming listings on the website but stays
          on record, along with anything linked to it. This is reversible — set the status back to
          Scheduled at any time.
        </p>

        {canCancel ? (
          <form action={cancelAction}>
            <input name="id" type="hidden" value={eventId} />
            <Button disabled={cancelPending} type="submit" variant="outline">
              {cancelPending ? 'Cancelling…' : 'Cancel this event'}
            </Button>
          </form>
        ) : (
          <p className="text-muted-foreground text-sm">This event is already cancelled.</p>
        )}

        {cancelResult?.status === 'error' ? (
          <p className="text-destructive text-sm font-medium" role="alert">
            {cancelResult.message}
          </p>
        ) : null}
      </section>

      <section className="border-destructive/30 flex flex-col gap-3 rounded-lg border p-4">
        <h2 className="font-medium">Delete permanently</h2>
        <p className="text-muted-foreground text-sm">
          Removes the event from Sanity for good. There is no undo.
        </p>

        {canHardDelete ? (
          <form action={deleteAction} className="flex flex-col gap-3">
            <input name="id" type="hidden" value={eventId} />

            <label className="flex flex-col gap-1.5 text-sm" htmlFor="confirm-title">
              <span className="font-medium">
                Type the event title to confirm: <span className="font-normal">{eventTitle}</span>
              </span>
              <input
                autoComplete="off"
                className="bg-background focus-visible:border-ring focus-visible:ring-ring/50 min-h-11 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-3 focus-visible:outline-none"
                id="confirm-title"
                onChange={(event) => setConfirmation(event.target.value)}
                type="text"
                value={confirmation}
              />
            </label>

            <Button
              className="self-start"
              disabled={!confirmed || deletePending}
              type="submit"
              variant="destructive"
            >
              {deletePending ? 'Deleting…' : 'Delete permanently'}
            </Button>
          </form>
        ) : (
          <p className="text-sm" role="note">
            {blockedReason ?? 'This event cannot be deleted here.'}
          </p>
        )}

        {deleteResult?.status === 'error' ? (
          <p className="text-destructive text-sm font-medium" role="alert">
            {deleteResult.message}
          </p>
        ) : null}
      </section>
    </div>
  )
}
