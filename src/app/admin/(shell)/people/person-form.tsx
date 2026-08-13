'use client'

import { useActionState } from 'react'

import {
  describedBy,
  FieldSet,
  FileField,
  FormAlert,
  FormField,
  FormFooter,
  TextArea,
  TextInput,
} from '@/components/admin/form-field'
import { EMPTY_FORM_STATE, type AdminFormState, type AdminFormValues } from '@/lib/admin/form-state'

/**
 * The create/edit form for a person.
 *
 * The banner at the top is not decoration. "Add a person" is the single most
 * misread action in this admin: it looks like account creation, and it is not.
 * A `person` is a public website record; who can sign in to `/admin` is decided
 * in Clerk and cannot be changed from here.
 */
export function PersonForm({
  action,
  cancelHref,
  defaults,
  personId,
  photo,
  submitLabel,
}: {
  action: (state: AdminFormState, formData: FormData) => Promise<AdminFormState>
  cancelHref: string
  defaults: AdminFormValues
  personId?: string
  photo?: { label: string; href?: string } | null
  submitLabel: string
}) {
  const [state, formAction, isPending] = useActionState(action, EMPTY_FORM_STATE)

  const values = { ...defaults, ...(state.values ?? {}) }
  const text = (field: string) => {
    const value = values[field]
    return typeof value === 'string' ? value : ''
  }
  const errorFor = (field: string) => state.fieldErrors?.[field]

  const field = (name: string, description?: string) => ({
    id: name,
    name,
    ...describedBy(name, { description, error: errorFor(name) }),
  })

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6" noValidate>
      {personId ? <input name="id" type="hidden" value={personId} /> : null}

      <FormAlert message={state.status === 'error' ? state.message : undefined} />

      <aside className="border-rule bg-paper-warm text-ink-body flex flex-col gap-1 rounded-lg border px-4 py-3 text-[12.5px] leading-relaxed">
        <p className="text-ink-label font-mono text-[10.5px] tracking-[0.16em] uppercase">
          Website record
        </p>
        <p>
          This is the public record of a person — the one every credit on the site points at. It is
          not a login. Access to this admin is granted in Clerk, separately, and nothing on this
          page changes who can sign in.
        </p>
      </aside>

      <FieldSet legend="The person">
        <FormField error={errorFor('name')} htmlFor="name" label="Name" required>
          <TextInput
            {...field('name')}
            autoComplete="off"
            defaultValue={text('name')}
            maxLength={120}
            required
          />
        </FormField>

        <FormField
          description="Used if this person ever gets their own page. Leave blank to build it from the name."
          error={errorFor('slug')}
          htmlFor="slug"
          label="URL"
        >
          <TextInput
            {...field('slug', 'Leave blank to build it from the name.')}
            autoComplete="off"
            defaultValue={text('slug')}
          />
        </FormField>

        <FormField
          description="A couple of sentences. Shown beside their name on the leadership list and project pages."
          error={errorFor('shortBio')}
          htmlFor="shortBio"
          label="Short bio"
        >
          <TextArea
            {...field('shortBio', 'A couple of sentences.')}
            defaultValue={text('shortBio')}
            maxLength={500}
          />
        </FormField>
      </FieldSet>

      <FieldSet legend="Photo">
        <FileField
          current={photo}
          description="A headshot. Square images work best."
          error={errorFor('photo')}
          htmlFor="photo"
          kind="image"
          label="Photo"
          removeName="removePhoto"
        />

        <FormField
          description="Describe the photo for screen readers, for example “Jordan smiling in front of a whiteboard”."
          error={errorFor('photoAlt')}
          htmlFor="photoAlt"
          label="Alt text"
        >
          <TextInput
            {...field('photoAlt', 'Describe the photo for screen readers.')}
            defaultValue={text('photoAlt')}
            maxLength={200}
          />
        </FormField>
      </FieldSet>

      <FieldSet
        description="All optional, and all public. Only add what this person is happy to have on the website."
        legend="Links"
      >
        <FormField
          description="Only add this if they are happy to be contacted publicly."
          error={errorFor('email')}
          htmlFor="email"
          label="Email"
        >
          <TextInput
            {...field('email', 'Only add this if they are happy to be contacted publicly.')}
            autoComplete="off"
            defaultValue={text('email')}
            inputMode="email"
          />
        </FormField>

        <FormField error={errorFor('githubUrl')} htmlFor="githubUrl" label="GitHub">
          <TextInput
            {...field('githubUrl')}
            defaultValue={text('githubUrl')}
            inputMode="url"
            placeholder="https://github.com/"
          />
        </FormField>

        <FormField error={errorFor('linkedinUrl')} htmlFor="linkedinUrl" label="LinkedIn">
          <TextInput
            {...field('linkedinUrl')}
            defaultValue={text('linkedinUrl')}
            inputMode="url"
            placeholder="https://www.linkedin.com/in/"
          />
        </FormField>

        <FormField
          error={errorFor('websiteUrl')}
          htmlFor="websiteUrl"
          label="Personal website / portfolio"
        >
          <TextInput
            {...field('websiteUrl')}
            defaultValue={text('websiteUrl')}
            inputMode="url"
            placeholder="https://"
          />
        </FormField>
      </FieldSet>

      <FormFooter cancelHref={cancelHref} isPending={isPending} submitLabel={submitLabel} />
    </form>
  )
}
