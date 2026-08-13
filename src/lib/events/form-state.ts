/**
 * The shape passed between the event form and its Server Actions.
 *
 * It lives here rather than beside the actions because a `'use server'` module
 * may only export async functions — a shared constant like `EMPTY_FORM_STATE`
 * is a build error there.
 */

export type EventFormState = {
  status: 'idle' | 'error'
  /** Shown above the form for problems that are not tied to one field. */
  message?: string
  fieldErrors?: Record<string, string>
  /** The submitted values, echoed back so nothing an officer typed is lost. */
  values?: Record<string, string | string[]>
}

export const EMPTY_FORM_STATE: EventFormState = { status: 'idle' }

/** Result of the one-button cancel and delete actions. */
export type EventActionResult = { status: 'error'; message: string }
