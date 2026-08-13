'use client'

import { useId, useState } from 'react'

import { FieldError, Select, TextArea, TextInput } from '@/components/admin/form-field'
import { Button } from '@/components/ui/button'
import type { RowValues } from '@/lib/admin/rows'
import type { Option } from '@/sanity/schemaTypes/shared/options'

/**
 * The editor for a Sanity array of objects — open roles, social links.
 *
 * These were the fields that used to force an officer into Studio, so this is
 * the component the phase exists for. The design constraints, in order:
 *
 * - **Rows are real form controls.** Each row contributes one value to each of
 *   its field names, and the Server Action reads them back as parallel arrays
 *   (`@/lib/admin/rows`). No JSON blob in a hidden input, nothing to hand-edit.
 * - **Keys are stable.** Rows carry a client-side id that never changes, so
 *   React moves the existing DOM nodes on reorder and removal — which is also
 *   what keeps the uncontrolled inputs' values attached to the right row.
 * - **Keyboard first.** Add, remove and reorder are ordinary buttons in the tab
 *   order with real labels ("Move Frontend contributor up"), not drag handles.
 * - **Nothing vanishes silently.** Removing a row is one click and reversible
 *   only by re-typing, so the button says what it removes.
 *
 * The generic part is the row mechanics; the fields themselves are described by
 * the caller. That is the line where a further abstraction would start guessing
 * at content, which this admin deliberately does not do.
 */

export type RowField =
  | {
      kind: 'text'
      key: string
      /** The form field name every row shares. */
      name: string
      label: string
      placeholder?: string
      maxLength?: number
      inputMode?: 'url' | 'text'
    }
  | { kind: 'textarea'; key: string; name: string; label: string; placeholder?: string; maxLength?: number }
  | { kind: 'select'; key: string; name: string; label: string; options: Option[] }

export type { RowValues } from '@/lib/admin/rows'

/** One row, plus the client-side identity that keeps its DOM node attached. */
type Row = { id: string; values: RowValues }

/**
 * A key unique within this editor for the lifetime of the page.
 *
 * `randomUUID` rather than an incrementing counter: seeding the initial rows
 * from a counter would mean mutating a module-level value while rendering,
 * which is a side effect in a render path.
 */
const asRow = (values: RowValues): Row => ({ id: crypto.randomUUID(), values })

export function RepeatableRows({
  addLabel,
  description,
  emptyMessage,
  error,
  fields,
  initialRows,
  legend,
  max = 20,
  rowErrors,
  rowLabel,
  rowNoun,
}: {
  addLabel: string
  description?: string
  /** Shown in place of the list when there are no rows. */
  emptyMessage: string
  /** A message about the group as a whole. */
  error?: string
  fields: RowField[]
  initialRows: RowValues[]
  legend: string
  max?: number
  /** Messages keyed by row index, from `rowErrorsFrom`. */
  rowErrors?: Record<number, string>
  /** Which field's value names the row in button labels. */
  rowLabel: string
  /** Singular noun for headings and buttons, e.g. "role". */
  rowNoun: string
}) {
  const groupId = useId()
  // The ids live alongside the values in one piece of state, so a reorder can
  // never move one without the other — which is what keeps each uncontrolled
  // input attached to the row it belongs to.
  const [rows, setRows] = useState<Row[]>(() => initialRows.map(asRow))

  const addRow = () => {
    if (rows.length >= max) return
    setRows([...rows, asRow(Object.fromEntries(fields.map((field) => [field.key, ''])))])
  }

  const removeRow = (index: number) => {
    setRows(rows.filter((_unused, position) => position !== index))
  }

  const renameRow = (index: number, value: string) => {
    setRows(
      rows.map((row, position) =>
        position === index ? { ...row, values: { ...row.values, [rowLabel]: value } } : row,
      ),
    )
  }

  const moveRow = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= rows.length) return

    const next = [...rows]
    ;[next[index], next[target]] = [next[target], next[index]]
    setRows(next)
  }

  return (
    <fieldset className="border-rule-card flex flex-col gap-3 rounded-lg border bg-white p-4 sm:p-5">
      <legend className="text-ink-label -ml-1 px-1 font-mono text-[10.5px] tracking-[0.16em] uppercase">
        {legend}
      </legend>
      {description ? (
        <p className="text-ink-faint -mt-2 text-[12px] leading-snug">{description}</p>
      ) : null}

      {rows.length === 0 ? (
        <p className="border-rule-dashed bg-paper-warm text-ink-soft rounded-md border border-dashed px-3 py-4 text-center text-[12.5px]">
          {emptyMessage}
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {rows.map((row, index) => {
            const name = row.values[rowLabel]?.trim() || `${rowNoun} ${index + 1}`
            const rowError = rowErrors?.[index]

            return (
              <li
                className="border-rule bg-paper-warm flex flex-col gap-3 rounded-md border p-3"
                key={row.id}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-ink-label font-mono text-[10.5px] tracking-[0.14em] uppercase">
                    {rowNoun} {index + 1}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      aria-label={`Move ${name} up`}
                      disabled={index === 0}
                      onClick={() => moveRow(index, -1)}
                      size="icon-sm"
                      type="button"
                      variant="ghost"
                    >
                      <span aria-hidden="true">↑</span>
                    </Button>
                    <Button
                      aria-label={`Move ${name} down`}
                      disabled={index === rows.length - 1}
                      onClick={() => moveRow(index, 1)}
                      size="icon-sm"
                      type="button"
                      variant="ghost"
                    >
                      <span aria-hidden="true">↓</span>
                    </Button>
                    <Button
                      onClick={() => removeRow(index)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      Remove<span className="sr-only"> {name}</span>
                    </Button>
                  </div>
                </div>

                {fields.map((field) => {
                  const controlId = `${groupId}-${row.id}-${field.key}`

                  return (
                    <div className="flex flex-col gap-1.5" key={field.key}>
                      <label className="text-ink text-[13px] font-semibold" htmlFor={controlId}>
                        {field.label}
                      </label>
                      {field.kind === 'select' ? (
                        <Select
                          defaultValue={row.values[field.key] ?? ''}
                          id={controlId}
                          name={field.name}
                        >
                          {field.options.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.title}
                            </option>
                          ))}
                        </Select>
                      ) : field.kind === 'textarea' ? (
                        <TextArea
                          className="min-h-20"
                          defaultValue={row.values[field.key] ?? ''}
                          id={controlId}
                          maxLength={field.maxLength}
                          name={field.name}
                          placeholder={field.placeholder}
                        />
                      ) : (
                        <TextInput
                          autoComplete="off"
                          defaultValue={row.values[field.key] ?? ''}
                          id={controlId}
                          inputMode={field.inputMode}
                          maxLength={field.maxLength}
                          name={field.name}
                          // Only the naming field is mirrored into state, so the
                          // "Remove Frontend contributor" labels stay truthful
                          // while the officer types. Every other control stays
                          // uncontrolled.
                          onChange={
                            field.key === rowLabel
                              ? (event) => renameRow(index, event.target.value)
                              : undefined
                          }
                          placeholder={field.placeholder}
                        />
                      )}
                    </div>
                  )
                })}

                <FieldError error={rowError} id={`${groupId}-${row.id}-error`} />
              </li>
            )
          })}
        </ol>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={rows.length >= max} onClick={addRow} type="button" variant="outline">
          {addLabel}
        </Button>
        {rows.length >= max ? (
          <span className="text-ink-faint text-[12px]">
            That is the maximum of {max}. Remove one to add another.
          </span>
        ) : null}
      </div>

      <FieldError error={error} id={`${groupId}-error`} />
    </fieldset>
  )
}
