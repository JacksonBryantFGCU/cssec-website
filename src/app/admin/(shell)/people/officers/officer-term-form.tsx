'use client'

import { useActionState } from 'react'

import {
  CheckboxField,
  describedBy,
  FieldSet,
  FormAlert,
  FormField,
  FormFooter,
  TextInput,
} from '@/components/admin/form-field'
import { ReferenceSelect, type ReferenceOption } from '@/components/admin/reference-field'
import { EMPTY_FORM_STATE, type AdminFormState, type AdminFormValues } from '@/lib/admin/form-state'

/**
 * The create/edit form for one officer term.
 *
 * A term is a person *plus* a position *plus* an academic year, and it is a
 * document of its own so that all three can change without erasing what came
 * before. Handing over the presidency creates a new term and ends the old one;
 * it never edits last year's.
 */
export function OfficerTermForm({
  action,
  cancelHref,
  defaults,
  people,
  submitLabel,
  termId,
}: {
  action: (state: AdminFormState, formData: FormData) => Promise<AdminFormState>
  cancelHref: string
  defaults: AdminFormValues
  people: ReferenceOption[]
  submitLabel: string
  termId?: string
}) {
  const [state, formAction, isPending] = useActionState(action, EMPTY_FORM_STATE)

  const values = { ...defaults, ...(state.values ?? {}) }
  const text = (field: string) => {
    const value = values[field]
    return typeof value === 'string' ? value : ''
  }
  const checked = (field: string) => {
    const value = values[field]
    return value === 'on' || value === 'true'
  }
  const errorFor = (field: string) => state.fieldErrors?.[field]

  const field = (name: string, description?: string) => ({
    id: name,
    name,
    ...describedBy(name, { description, error: errorFor(name) }),
  })

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6" noValidate>
      {termId ? <input name="id" type="hidden" value={termId} /> : null}

      <FormAlert message={state.status === 'error' ? state.message : undefined} />

      <FieldSet legend="The term">
        <FormField
          description="Add them under People first if they are not in this list."
          error={errorFor('person')}
          htmlFor="person"
          label="Person"
          required
        >
          <ReferenceSelect
            {...field('person', 'Add them under People first if they are not in this list.')}
            defaultValue={text('person')}
            emptyLabel="Choose a person"
            options={people}
            required
          />
        </FormField>

        <FormField
          description="For example: President, Vice President, Treasurer, Event Coordinator."
          error={errorFor('position')}
          htmlFor="position"
          label="Position"
          required
        >
          <TextInput
            {...field('position', 'For example: President, Vice President, Treasurer.')}
            autoComplete="off"
            defaultValue={text('position')}
            maxLength={80}
            required
          />
        </FormField>

        <FormField
          description="Two consecutive years, for example 2025–2026."
          error={errorFor('term')}
          htmlFor="term"
          label="Academic year"
          required
        >
          <TextInput
            {...field('term', 'Two consecutive years, for example 2025–2026.')}
            autoComplete="off"
            defaultValue={text('term')}
            placeholder="2025–2026"
            required
          />
        </FormField>

        <CheckboxField
          defaultChecked={checked('isCurrent')}
          description="Current terms appear on the public leadership list. Turn this off when the term ends — the record stays as history."
          id="isCurrent"
          label="Currently serving"
          name="isCurrent"
        />

        <FormField
          description="Lower numbers appear first. President 10, Vice President 20, and so on."
          error={errorFor('displayOrder')}
          htmlFor="displayOrder"
          label="Display order"
        >
          <TextInput
            {...field('displayOrder', 'Lower numbers appear first.')}
            className="max-w-32"
            defaultValue={text('displayOrder') || '100'}
            inputMode="numeric"
            type="number"
          />
        </FormField>
      </FieldSet>

      <FormFooter cancelHref={cancelHref} isPending={isPending} submitLabel={submitLabel} />
    </form>
  )
}
