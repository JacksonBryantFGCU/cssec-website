'use client'

import { useActionState } from 'react'

import { runWriteCheck, type WriteCheckResult } from './actions'

/**
 * Minimal client form for the write-check action.
 *
 * Client-side only for the pending/result UX — it carries no authorization
 * meaning. The action re-checks the caller server-side.
 */
export function WriteCheckForm() {
  const [result, formAction, isPending] = useActionState<WriteCheckResult | null, FormData>(
    runWriteCheck,
    null,
  )

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm" htmlFor="note">
        <span className="font-medium">Note</span>
        <input
          className="rounded-md border px-3 py-2"
          defaultValue="Write path verified"
          id="note"
          maxLength={80}
          name="note"
          required
          type="text"
        />
      </label>

      <button
        className="self-start rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? 'Writing…' : 'Run write check'}
      </button>

      <p aria-live="polite" className="text-sm">
        {result?.status === 'ok' && (
          <span>
            Wrote “{result.note}” at {new Date(result.checkedAt).toLocaleString('en-US')}.
          </span>
        )}
        {result?.status === 'error' && <span role="alert">{result.message}</span>}
      </p>
    </form>
  )
}
