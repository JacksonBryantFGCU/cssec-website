'use client'

import { useActionState } from 'react'

import {
  CheckboxField,
  describedBy,
  FieldSet,
  FormAlert,
  FormField,
  FormFooter,
  Select,
  TextArea,
  TextInput,
} from '@/components/admin/form-field'
import { EMPTY_FORM_STATE, type AdminFormState, type AdminFormValues } from '@/lib/admin/form-state'
import { OPPORTUNITY_TYPES, WORK_ARRANGEMENTS } from '@/sanity/schemaTypes/shared/options'

/**
 * The create/edit form for an opportunity.
 *
 * There is no "is it still open?" control anywhere on this form, and that is
 * the point: the board works out open, closing soon and expired from the
 * deadline alone. An officer sets a date once and never has to come back to
 * mark it closed.
 */
export function OpportunityForm({
  action,
  cancelHref,
  defaults,
  opportunityId,
  submitLabel,
}: {
  action: (state: AdminFormState, formData: FormData) => Promise<AdminFormState>
  cancelHref: string
  defaults: AdminFormValues
  opportunityId?: string
  submitLabel: string
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
      {opportunityId ? <input name="id" type="hidden" value={opportunityId} /> : null}

      <FormAlert message={state.status === 'error' ? state.message : undefined} />

      <FieldSet legend="The posting">
        <FormField error={errorFor('title')} htmlFor="title" label="Title" required>
          <TextInput
            {...field('title')}
            autoComplete="off"
            defaultValue={text('title')}
            maxLength={120}
            placeholder="Software Engineering Intern"
            required
          />
        </FormField>

        <FormField
          description="Company, lab, university or event organizer."
          error={errorFor('organization')}
          htmlFor="organization"
          label="Organization"
          required
        >
          <TextInput
            {...field('organization', 'Company, lab, university or event organizer.')}
            autoComplete="off"
            defaultValue={text('organization')}
            maxLength={120}
            required
          />
        </FormField>

        <FormField error={errorFor('opportunityType')} htmlFor="opportunityType" label="Type" required>
          <Select
            {...field('opportunityType')}
            defaultValue={text('opportunityType') || 'internship'}
            required
          >
            {OPPORTUNITY_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.title}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          description="What it is, who it suits, and anything a student should know before applying."
          error={errorFor('description')}
          htmlFor="description"
          label="Description"
          required
        >
          <TextArea
            {...field('description', 'What it is and who it suits.')}
            defaultValue={text('description')}
            maxLength={600}
            required
          />
        </FormField>

        <FormField
          description="Where students apply. This is the button on the board."
          error={errorFor('applicationUrl')}
          htmlFor="applicationUrl"
          label="Application link"
          required
        >
          <TextInput
            {...field('applicationUrl', 'Where students apply.')}
            defaultValue={text('applicationUrl')}
            inputMode="url"
            placeholder="https://"
            required
          />
        </FormField>

        <CheckboxField
          defaultChecked={checked('featured')}
          description="Highlights this posting at the top of the board."
          id="featured"
          label="Feature on the opportunity board"
          name="featured"
        />
      </FieldSet>

      <FieldSet legend="Where">
        <FormField
          description="For example: Fort Myers, FL or Remote (US)."
          error={errorFor('location')}
          htmlFor="location"
          label="Location"
        >
          <TextInput
            {...field('location', 'For example: Fort Myers, FL.')}
            autoComplete="off"
            defaultValue={text('location')}
            maxLength={120}
          />
        </FormField>

        <FormField
          error={errorFor('workArrangement')}
          htmlFor="workArrangement"
          label="Work arrangement"
        >
          <Select {...field('workArrangement')} defaultValue={text('workArrangement')}>
            <option value="">Not stated</option>
            {WORK_ARRANGEMENTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.title}
              </option>
            ))}
          </Select>
        </FormField>
      </FieldSet>

      <FieldSet
        description="The board works out “6 days left”, “closes today” and “closed” from the deadline. Nothing here needs updating once the date passes."
        legend="Dates"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            description="Leave empty for rolling applications."
            error={errorFor('deadline')}
            htmlFor="deadline"
            label="Application deadline"
          >
            <TextInput
              {...field('deadline', 'Leave empty for rolling applications.')}
              defaultValue={text('deadline')}
              type="date"
            />
          </FormField>

          <FormField error={errorFor('postedAt')} htmlFor="postedAt" label="Posted" required>
            <TextInput {...field('postedAt')} defaultValue={text('postedAt')} required type="date" />
          </FormField>
        </div>
      </FieldSet>

      <FieldSet legend="Who it suits">
        <FormField
          description="Comma separated. For example: Python, SQL, data analysis."
          error={errorFor('skills')}
          htmlFor="skills"
          label="Relevant skills / topics"
        >
          <TextInput
            {...field('skills', 'Comma separated.')}
            defaultValue={text('skills')}
            placeholder="Python, SQL, data analysis"
          />
        </FormField>

        <FormField
          description="Comma separated. For example: Computer Science, Software Engineering."
          error={errorFor('majors')}
          htmlFor="majors"
          label="Relevant majors"
        >
          <TextInput
            {...field('majors', 'Comma separated.')}
            defaultValue={text('majors')}
            placeholder="Computer Science, Software Engineering"
          />
        </FormField>
      </FieldSet>

      <FormFooter cancelHref={cancelHref} isPending={isPending} submitLabel={submitLabel} />
    </form>
  )
}
