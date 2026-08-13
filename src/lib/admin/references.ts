/**
 * Turning selected people (and events, and resources) into Sanity references.
 *
 * Two rules matter and both are easy to get wrong by hand:
 *
 * 1. Every member of a Sanity array needs a `_key` that is unique *within that
 *    array*. Two members sharing a key makes the document unopenable in Studio.
 * 2. A reference stores the document id only. Copying a person's name into the
 *    project would fork the record — rename the person and the copy goes stale —
 *    so nothing here ever writes a display value.
 *
 * Pure and Sanity-free so the key derivation can be unit tested.
 */

export type SanityReference = { _key: string; _type: 'reference'; _ref: string }

/** A document id reduced to characters that are legal in a `_key`. */
export function referenceKey(id: string): string {
  return id.replace(/[^A-Za-z0-9]/g, '')
}

/**
 * Builds the array a reference field stores, or `undefined` when empty.
 *
 * `undefined` rather than `[]` because the update actions translate that into
 * an `unset`, which removes the field instead of leaving an empty array behind.
 */
export function toReferenceArray(ids: readonly string[]): SanityReference[] | undefined {
  if (ids.length === 0) return undefined

  const seen = new Set<string>()

  return ids
    .filter((id) => {
      // Ids are already unique in practice; this guarantees the `_key`s are.
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })
    .map((id) => ({ _key: referenceKey(id), _type: 'reference' as const, _ref: id }))
}

/** A single reference field's value, or `undefined` when nothing is selected. */
export function toReference(id: string | undefined): { _type: 'reference'; _ref: string } | undefined {
  return id ? { _type: 'reference', _ref: id } : undefined
}

/**
 * Which of the selected ids are not in the set that actually exists.
 *
 * Sanity rejects a strong reference to a missing document with an error we do
 * not want to show an officer, so callers turn this into a field message. It
 * also covers the race where someone deletes a person while a form is open.
 */
export function missingReferences(
  selected: readonly string[],
  existing: readonly string[],
): string[] {
  const found = new Set(existing)
  return selected.filter((id) => !found.has(id))
}
