'use client'

import { useId, useMemo, useState } from 'react'

import { FieldError, Select, TextInput } from '@/components/admin/form-field'
import { cn } from '@/lib/utils'

/**
 * Choosing people (and events, and resources) without ever showing an id.
 *
 * Sanity stores a reference as a document id, but `_id` is not something an
 * officer should read, type or paste. So the id only ever appears as a control
 * `value`; every visible string is the document's own name or title.
 *
 * Two shapes, because the two jobs are genuinely different:
 *
 * - `ReferenceSelect` — one value (project lead, resource author, source
 *   event). A native `<select>`: keyboard- and screen-reader-native, and it
 *   works before JavaScript loads.
 * - `ReferenceCheckboxList` — several values (mentors, contributors). A list of
 *   checkboxes, with a filter box that appears only once the list is long
 *   enough to need one. Filtering is presentational: hidden rows stay checked
 *   and still submit, so typing in the box can never silently drop a mentor.
 *
 * Neither makes an authorization or existence decision — the Server Action
 * re-checks that every selected id still exists before writing.
 */

export type ReferenceOption = {
  _id: string
  label: string
  /** Optional second line, e.g. an event's date or a person's role. */
  hint?: string
}

/** Above this many options the list gets a filter box. */
const FILTER_THRESHOLD = 8

export function ReferenceSelect({
  defaultValue,
  emptyLabel,
  id,
  name,
  options,
  ...rest
}: {
  defaultValue?: string
  /** The "nothing selected" row, e.g. "No lead yet". */
  emptyLabel: string
  id: string
  name: string
  options: ReferenceOption[]
} & Omit<React.ComponentProps<'select'>, 'children' | 'defaultValue' | 'id' | 'name'>) {
  // A stored reference can point at a document this list no longer contains
  // (deleted, or filtered out). Dropping it would silently clear the field on
  // the next save, so it is kept as an explicit, selectable row instead.
  const missing = defaultValue && !options.some((option) => option._id === defaultValue)

  return (
    <Select defaultValue={defaultValue ?? ''} id={id} name={name} {...rest}>
      <option value="">{emptyLabel}</option>
      {options.map((option) => (
        <option key={option._id} value={option._id}>
          {option.label}
          {option.hint ? ` — ${option.hint}` : ''}
        </option>
      ))}
      {missing ? <option value={defaultValue}>Currently set — no longer available</option> : null}
    </Select>
  )
}

export function ReferenceCheckboxList({
  description,
  emptyMessage,
  error,
  label,
  name,
  options,
  selected,
}: {
  description?: string
  /** Shown when there is nothing to pick from at all. */
  emptyMessage: string
  error?: string
  label: string
  name: string
  options: ReferenceOption[]
  selected: string[]
}) {
  const listId = useId()
  const [query, setQuery] = useState('')

  const chosen = useMemo(() => new Set(selected), [selected])
  const needle = query.trim().toLowerCase()

  const visible = useMemo(
    () =>
      needle
        ? options.filter((option) => option.label.toLowerCase().includes(needle))
        : options,
    [needle, options],
  )

  // Anything selected but filtered out still has to render, or the browser
  // would not submit it and the officer would lose it without being told.
  const hiddenSelected = useMemo(
    () => options.filter((option) => chosen.has(option._id) && !visible.includes(option)),
    [chosen, options, visible],
  )

  const rows = [...visible, ...hiddenSelected]

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-ink text-[13px] font-semibold" id={`${listId}-label`}>
        {label}
      </p>
      {description ? (
        <p className="text-ink-faint text-[12px] leading-snug" id={`${listId}-description`}>
          {description}
        </p>
      ) : null}

      {options.length === 0 ? (
        <p className="text-ink-faint text-[12px] leading-snug">{emptyMessage}</p>
      ) : (
        <>
          {options.length > FILTER_THRESHOLD ? (
            <>
              <label className="sr-only" htmlFor={`${listId}-filter`}>
                Filter {label.toLowerCase()}
              </label>
              <TextInput
                autoComplete="off"
                className="min-h-10"
                id={`${listId}-filter`}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Type to filter…"
                type="search"
                value={query}
              />
            </>
          ) : null}

          <ul
            aria-labelledby={`${listId}-label`}
            className="border-rule divide-rule bg-paper-warm max-h-72 divide-y overflow-y-auto rounded-md border"
          >
            {rows.map((option) => (
              <li key={option._id}>
                <label className="text-ink flex min-h-11 items-center gap-3 px-3 py-1.5 text-[13.5px]">
                  <input
                    className="accent-club-green size-[18px] shrink-0"
                    defaultChecked={chosen.has(option._id)}
                    name={name}
                    type="checkbox"
                    value={option._id}
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">{option.label}</span>
                    {option.hint ? (
                      <span className="text-ink-faint font-mono text-[11px]">{option.hint}</span>
                    ) : null}
                  </span>
                </label>
              </li>
            ))}
            {rows.length === 0 ? (
              <li className={cn('text-ink-faint px-3 py-3 text-[12.5px]')}>
                Nothing matches “{query}”.
              </li>
            ) : null}
          </ul>
        </>
      )}

      <FieldError error={error} id={`${listId}-error`} />
    </div>
  )
}
