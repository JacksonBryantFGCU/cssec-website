/**
 * The shape passed between every admin form and its Server Actions.
 *
 * It lives here rather than beside the actions because a `'use server'` module
 * may only export async functions — a shared constant like `EMPTY_FORM_STATE`
 * is a build error there.
 *
 * One shape for all six content modules: the form components read `values`,
 * `fieldErrors` and `message` the same way whatever they are editing, so a new
 * module gets the "nothing you typed was lost" behaviour for free.
 */

export type AdminFormState = {
  status: 'idle' | 'error'
  /** Shown above the form for problems that are not tied to one field. */
  message?: string
  fieldErrors?: Record<string, string>
  /** The submitted values, echoed back so nothing an officer typed is lost. */
  values?: Record<string, string | string[]>
}

export const EMPTY_FORM_STATE: AdminFormState = { status: 'idle' }

/** Result of a single-button action (archive, cancel, delete). */
export type AdminActionResult = { status: 'error'; message: string }

/** The values a form renders: strings for controls, arrays for multi-selects. */
export type AdminFormValues = Record<string, string | string[]>
