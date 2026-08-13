/**
 * Reading a repeating group of fields out of a submitted form.
 *
 * Sanity models open roles and social links as arrays of objects. In HTML that
 * is a set of *parallel* controls: every row contributes one value to each of
 * its field names, so row `i` is the `i`th entry of every array. It is the
 * plainest encoding that survives a form posting without JavaScript, and adding
 * or removing a row on the client shrinks all of that row's arrays together, so
 * they stay aligned by construction.
 *
 * The alternative — `openRoles[0][title]` style names — needs the indices to be
 * renumbered on every removal, and one missed renumber silently merges two
 * rows. Parallel arrays cannot do that.
 *
 * Pure, and takes only the `getAll` surface of `FormData`, so it is unit tested
 * without a request.
 */

export type FormDataLike = { getAll(name: string): unknown[] }

/** One row: every field of the repeating group, as the strings a form speaks. */
export type RowValues = Record<string, string>

/**
 * Builds one object per row from a map of `{ rowKey: formFieldName }`.
 *
 * Rows are padded rather than truncated: a browser that omits a trailing empty
 * value should not shift every later row up by one.
 */
export function readRows<K extends string>(
  formData: FormDataLike,
  fields: Record<K, string>,
): Array<Record<K, string>> {
  const keys = Object.keys(fields) as K[]
  const columns = new Map<K, string[]>(
    keys.map((key) => [key, formData.getAll(fields[key]).map((value) => String(value ?? ''))]),
  )

  const rowCount = Math.max(0, ...keys.map((key) => columns.get(key)?.length ?? 0))

  return Array.from({ length: rowCount }, (_unused, index) => {
    const row = {} as Record<K, string>
    for (const key of keys) row[key] = columns.get(key)?.[index] ?? ''
    return row
  })
}

/**
 * Drops rows the officer left completely empty.
 *
 * An "add row" button that was clicked and then ignored should not become a
 * validation error, or an empty object in the Content Lake.
 */
export function withoutBlankRows<T extends Record<string, string>>(rows: T[]): T[] {
  return rows.filter((row) => Object.values(row).some((value) => value.trim() !== ''))
}

/**
 * A `_key` for array member `index`.
 *
 * Sanity requires one per member and it must be unique within the array. Rows
 * have no natural identity — two open roles can be identical — so the index is
 * the honest choice; reordering rewrites the whole array anyway.
 */
export function rowKey(prefix: string, index: number): string {
  return `${prefix}${index}`
}
