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
    <div className="flex flex-col gap-4">
      <section className="border-rule-card flex flex-col gap-3 rounded-lg border bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-ink text-[17px] font-bold tracking-[-0.01em]">
            Cancel the event
          </h2>
          <span className="text-club-dark bg-club-surface-tint inline-flex items-center gap-1 rounded px-2 py-[3px] font-mono text-[10px] tracking-[0.12em] uppercase">
            <span aria-hidden="true">↺</span>
            Reversible
          </span>
        </div>
        <p className="text-ink-soft text-[13.5px] leading-relaxed">
          Sets the status to Cancelled. It disappears from upcoming listings on the website but stays
          on record, along with anything linked to it. This is reversible — set the status back to
          Scheduled at any time.
        </p>

        {canCancel ? (
          <form action={cancelAction}>
            <input name="id" type="hidden" value={eventId} />
            <Button className="self-start" disabled={cancelPending} type="submit" variant="outline">
              {cancelPending ? 'Cancelling…' : 'Cancel this event'}
            </Button>
          </form>
        ) : (
          <p className="text-ink-faint text-[13px]">This event is already cancelled.</p>
        )}

        {cancelResult?.status === 'error' ? (
          <p className="text-destructive text-[13px] font-semibold" role="alert">
            {cancelResult.message}
          </p>
        ) : null}
      </section>

      {/* Deliberately heavier than the block above: tinted field, red rule and a
          solid red button, so the two options cannot be confused at a glance. */}
      <section className="border-destructive/35 bg-destructive/[0.035] flex flex-col gap-3 rounded-lg border border-l-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-destructive text-[17px] font-bold tracking-[-0.01em]">
            Delete permanently
          </h2>
          <span className="text-destructive bg-destructive/10 inline-flex items-center gap-1 rounded px-2 py-[3px] font-mono text-[10px] tracking-[0.12em] uppercase">
            <span aria-hidden="true">✕</span>
            No undo
          </span>
        </div>
        <p className="text-ink-body text-[13.5px] leading-relaxed">
          Removes the event from Sanity for good. There is no undo.
        </p>

        {canHardDelete ? (
          <form action={deleteAction} className="flex flex-col gap-3">
            <input name="id" type="hidden" value={eventId} />

            <div className="flex flex-col gap-1.5">
              <label className="text-ink text-[13px] font-semibold" htmlFor="confirm-title">
                Type the event title to confirm
              </label>
              <p className="text-ink-soft font-mono text-[12px]" id="confirm-title-hint">
                {eventTitle}
              </p>
              <input
                aria-describedby="confirm-title-hint"
                autoComplete="off"
                className="border-input focus-visible:border-destructive focus-visible:ring-destructive/25 min-h-11 w-full max-w-md rounded-md border bg-white px-3 py-2 text-sm focus-visible:ring-3 focus-visible:outline-none"
                id="confirm-title"
                onChange={(event) => setConfirmation(event.target.value)}
                type="text"
                value={confirmation}
              />
            </div>

            <Button
              className="bg-destructive hover:bg-destructive/90 self-start text-white disabled:opacity-40"
              disabled={!confirmed || deletePending}
              type="submit"
              variant="destructive"
            >
              {deletePending ? 'Deleting…' : 'Delete permanently'}
            </Button>
          </form>
        ) : (
          <p className="border-rule-strong text-ink-body rounded-md border border-dashed bg-white px-3 py-2.5 text-[13px]" role="note">
            {blockedReason ?? 'This event cannot be deleted here.'}
          </p>
        )}

        {deleteResult?.status === 'error' ? (
          <p className="text-destructive text-[13px] font-semibold" role="alert">
            {deleteResult.message}
          </p>
        ) : null}
      </section>
    </div>
  )
}
