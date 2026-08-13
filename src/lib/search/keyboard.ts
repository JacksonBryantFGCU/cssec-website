/**
 * The two keyboard decisions the search dialog makes, extracted from it.
 *
 * Both are pure functions over plain values rather than over DOM events, so
 * they are unit tested directly — the alternative would be installing a DOM
 * test environment to assert two arithmetic rules, which is not a trade worth
 * making for a component this size.
 */

/**
 * Where the selection lands after an arrow key.
 *
 * Wraps in both directions: at the last result, ArrowDown returns to the first.
 * A list this short is faster to cycle than to reverse out of, and the wrap is
 * what the ⌘K dialogs people already use do.
 */
export function nextResultIndex(
  current: number,
  length: number,
  direction: 'up' | 'down',
): number {
  if (length <= 0) return 0

  // A stale index — the result set shrank under the selection — restarts rather
  // than wrapping from a position that no longer exists.
  const from = current >= 0 && current < length ? current : 0
  const step = direction === 'down' ? 1 : -1

  return (from + step + length) % length
}

/** What the global shortcut listener needs to know about a keypress. */
export type ShortcutEvent = {
  key: string
  metaKey: boolean
  ctrlKey: boolean
  /** The focused element's tag name, upper-case, or null if there is none. */
  targetTag: string | null
  targetIsContentEditable?: boolean
}

const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

/**
 * Should this keypress open search?
 *
 * ⌘K on macOS, Ctrl+K elsewhere — and neither while the reader is typing into
 * a field. Stealing the key out of a text input is the failure mode this
 * exists to prevent, and it also means the dialog's own input cannot re-trigger
 * the shortcut that opened it.
 */
export function shouldOpenSearch(event: ShortcutEvent): boolean {
  if (event.key.toLowerCase() !== 'k') return false
  if (!event.metaKey && !event.ctrlKey) return false
  if (event.targetIsContentEditable) return false
  if (event.targetTag && TYPING_TAGS.has(event.targetTag)) return false

  return true
}
