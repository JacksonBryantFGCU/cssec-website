'use client'

import { useActionState, useState } from 'react'

import { Button } from '@/components/ui/button'
import type { AdminActionResult } from '@/lib/admin/form-state'

/**
 * The two halves of every "remove this" screen.
 *
 * Extracted from the events removal screen once projects, resources, people and
 * officer terms all needed the same pair. The shape is the policy made visible:
 *
 * - `SafeRemovalCard` — the reversible option (archive, cancel, retire). It is
 *   offered first and styled as ordinary UI, because it is the right answer
 *   almost every time.
 * - `HardDeleteCard` — permanent deletion, behind a type-the-name step. That
 *   step is not security: the Server Action re-evaluates the removal policy
 *   against fresh Sanity data, because this component can be bypassed with a
 *   direct POST. It exists so a destructive click cannot happen by reflex.
 *
 * When deletion is not allowed, the card says *why* instead of showing a
 * disabled button — a greyed-out control with no explanation is the thing that
 * sends officers to Studio to do the dangerous version by hand.
 */

type Action = (state: AdminActionResult | null, formData: FormData) => Promise<AdminActionResult | null>

export function SafeRemovalCard({
  action,
  alreadyDone,
  badge,
  buttonLabel,
  description,
  documentId,
  pendingLabel,
  title,
}: {
  action: Action
  /** Message replacing the button when the document is already in this state. */
  alreadyDone?: string
  badge: string
  buttonLabel: string
  description: string
  documentId: string
  pendingLabel: string
  title: string
}) {
  const [result, formAction, isPending] = useActionState<AdminActionResult | null, FormData>(
    action,
    null,
  )

  return (
    <section className="border-rule-card flex flex-col gap-3 rounded-lg border bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-ink text-[17px] font-bold tracking-[-0.01em]">{title}</h2>
        <span className="text-club-dark bg-club-surface-tint inline-flex items-center gap-1 rounded px-2 py-[3px] font-mono text-[10px] tracking-[0.12em] uppercase">
          <span aria-hidden="true">↺</span>
          {badge}
        </span>
      </div>
      <p className="text-ink-soft text-[13.5px] leading-relaxed">{description}</p>

      {alreadyDone ? (
        <p className="text-ink-faint text-[13px]">{alreadyDone}</p>
      ) : (
        <form action={formAction}>
          <input name="id" type="hidden" value={documentId} />
          <Button className="self-start" disabled={isPending} type="submit" variant="outline">
            {isPending ? pendingLabel : buttonLabel}
          </Button>
        </form>
      )}

      {result?.status === 'error' ? (
        <p className="text-destructive text-[13px] font-semibold" role="alert">
          {result.message}
        </p>
      ) : null}
    </section>
  )
}

export function HardDeleteCard({
  action,
  allowed,
  blockedReason,
  confirmationLabel,
  description,
  documentId,
  documentName,
}: {
  action: Action
  allowed: boolean
  /** Officer-facing explanation when the policy withholds deletion. */
  blockedReason?: string
  /** e.g. "Type the project name to confirm". */
  confirmationLabel: string
  description: string
  documentId: string
  /** The exact string that has to be typed. */
  documentName: string
}) {
  const [result, formAction, isPending] = useActionState<AdminActionResult | null, FormData>(
    action,
    null,
  )
  const [confirmation, setConfirmation] = useState('')

  const confirmed = confirmation.trim() === documentName.trim()

  return (
    // Deliberately heavier than the card above: tinted field, red rule and a
    // solid red button, so the two options cannot be confused at a glance.
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
      <p className="text-ink-body text-[13.5px] leading-relaxed">{description}</p>

      {allowed ? (
        <form action={formAction} className="flex flex-col gap-3">
          <input name="id" type="hidden" value={documentId} />

          <div className="flex flex-col gap-1.5">
            <label className="text-ink text-[13px] font-semibold" htmlFor="confirm-name">
              {confirmationLabel}
            </label>
            <p className="text-ink-soft font-mono text-[12px]" id="confirm-name-hint">
              {documentName}
            </p>
            <input
              aria-describedby="confirm-name-hint"
              autoComplete="off"
              className="border-input focus-visible:border-destructive focus-visible:ring-destructive/25 min-h-11 w-full max-w-md rounded-md border bg-white px-3 py-2 text-sm focus-visible:ring-3 focus-visible:outline-none"
              id="confirm-name"
              onChange={(event) => setConfirmation(event.target.value)}
              type="text"
              value={confirmation}
            />
          </div>

          <Button
            className="bg-destructive hover:bg-destructive/90 self-start text-white disabled:opacity-40"
            disabled={!confirmed || isPending}
            type="submit"
            variant="destructive"
          >
            {isPending ? 'Deleting…' : 'Delete permanently'}
          </Button>
        </form>
      ) : (
        <p
          className="border-rule-strong text-ink-body rounded-md border border-dashed bg-white px-3 py-2.5 text-[13px]"
          role="note"
        >
          {blockedReason ?? 'This cannot be deleted here.'}
        </p>
      )}

      {result?.status === 'error' ? (
        <p className="text-destructive text-[13px] font-semibold" role="alert">
          {result.message}
        </p>
      ) : null}
    </section>
  )
}
