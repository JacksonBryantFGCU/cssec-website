/**
 * The shape passed between the event form and its Server Actions.
 *
 * Events named these types before the other modules existed; they are now
 * aliases of the shared admin shapes in `@/lib/admin/form-state`, so the event
 * screens and the five modules that followed cannot drift apart.
 */

import type { AdminActionResult, AdminFormState } from '../admin/form-state.ts'

export { EMPTY_FORM_STATE } from '../admin/form-state.ts'

export type EventFormState = AdminFormState

/** Result of the one-button cancel and delete actions. */
export type EventActionResult = AdminActionResult
