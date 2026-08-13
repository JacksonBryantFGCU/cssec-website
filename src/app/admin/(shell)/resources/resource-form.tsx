'use client'

import { useActionState } from 'react'

import {
  CheckboxField,
  describedBy,
  FieldSet,
  FileField,
  FormAlert,
  FormField,
  FormFooter,
  Select,
  StudioNote,
  TextArea,
  TextInput,
} from '@/components/admin/form-field'
import {
  ReferenceCheckboxList,
  ReferenceSelect,
  type ReferenceOption,
} from '@/components/admin/reference-field'
import { EMPTY_FORM_STATE, type AdminFormState, type AdminFormValues } from '@/lib/admin/form-state'
import { EXPERIENCE_LEVELS, RESOURCE_TYPES } from '@/sanity/schemaTypes/shared/options'

/**
 * The create/edit form for a resource.
 *
 * Shared by `/admin/resources/new` and `/admin/resources/[id]/edit`.
 *
 * The "Where it lives" fieldset groups the three destinations together on
 * purpose: the schema's rule is that at least one of them must be present, so
 * an officer should be able to see all three while deciding. The Server Action
 * enforces that rule against the saved state, not the visible controls.
 */
export function ResourceForm({
  action,
  cancelHref,
  currentFile,
  defaults,
  events,
  people,
  relatedOptions,
  resourceId,
  submitLabel,
}: {
  action: (state: AdminFormState, formData: FormData) => Promise<AdminFormState>
  cancelHref: string
  currentFile?: { label: string; href?: string } | null
  defaults: AdminFormValues
  events: ReferenceOption[]
  people: ReferenceOption[]
  relatedOptions: ReferenceOption[]
  resourceId?: string
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
  const list = (field: string) => {
    const value = values[field]
    return Array.isArray(value) ? value : []
  }
  const errorFor = (field: string) => state.fieldErrors?.[field]

  const field = (name: string, description?: string) => ({
    id: name,
    name,
    ...describedBy(name, { description, error: errorFor(name) }),
  })

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6" noValidate>
      {resourceId ? <input name="id" type="hidden" value={resourceId} /> : null}

      <FormAlert message={state.status === 'error' ? state.message : undefined} />

      <FieldSet legend="The basics">
        <FormField error={errorFor('title')} htmlFor="title" label="Title" required>
          <TextInput
            {...field('title')}
            autoComplete="off"
            defaultValue={text('title')}
            maxLength={120}
            required
          />
        </FormField>

        <FormField
          description="Leave blank to build it from the title. Changing it changes the public link."
          error={errorFor('slug')}
          htmlFor="slug"
          label="URL"
        >
          <TextInput
            {...field('slug', 'Leave blank to build it from the title.')}
            autoComplete="off"
            defaultValue={text('slug')}
            placeholder="intro-to-git-slides"
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            error={errorFor('resourceType')}
            htmlFor="resourceType"
            label="Resource type"
            required
          >
            <Select {...field('resourceType')} defaultValue={text('resourceType') || 'workshop'} required>
              {RESOURCE_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.title}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            error={errorFor('experienceLevel')}
            htmlFor="experienceLevel"
            label="Experience level"
            required
          >
            <Select
              {...field('experienceLevel')}
              defaultValue={text('experienceLevel') || 'any'}
              required
            >
              {EXPERIENCE_LEVELS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.title}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField
          description="What this is and who it is for."
          error={errorFor('description')}
          htmlFor="description"
          label="Description"
          required
        >
          <TextArea
            {...field('description', 'What this is and who it is for.')}
            defaultValue={text('description')}
            maxLength={400}
            required
          />
        </FormField>

        <FormField
          description="Comma separated. For example: git, testing, resumes."
          error={errorFor('topics')}
          htmlFor="topics"
          label="Topics"
        >
          <TextInput
            {...field('topics', 'Comma separated.')}
            defaultValue={text('topics')}
            placeholder="git, github, version control"
          />
        </FormField>

        <CheckboxField
          defaultChecked={checked('featured')}
          description="Highlights this resource at the top of the library."
          id="featured"
          label="Feature in the resource library"
          name="featured"
        />
      </FieldSet>

      <FieldSet
        description="A resource needs at least one of these, or there is nothing for a student to open."
        legend="Where it lives"
      >
        <FileField
          current={currentFile}
          description="Slides, PDFs and cheat sheets. Do not upload video — link to it below instead."
          error={errorFor('file')}
          htmlFor="file"
          kind="document"
          label="Uploaded file"
          removeName="removeFile"
        />

        <FormField
          description="A recording, article or anything hosted elsewhere."
          error={errorFor('externalUrl')}
          htmlFor="externalUrl"
          label="External link"
        >
          <TextInput
            {...field('externalUrl', 'A recording, article or anything hosted elsewhere.')}
            defaultValue={text('externalUrl')}
            inputMode="url"
            placeholder="https://"
          />
        </FormField>

        <FormField
          description="Starter or completed repository."
          error={errorFor('githubUrl')}
          htmlFor="githubUrl"
          label="GitHub repository"
        >
          <TextInput
            {...field('githubUrl', 'Starter or completed repository.')}
            defaultValue={text('githubUrl')}
            inputMode="url"
            placeholder="https://github.com/"
          />
        </FormField>
      </FieldSet>

      <FieldSet legend="Where it came from">
        <FormField
          description="The session this material came from. It will be listed on that event's page."
          error={errorFor('event')}
          htmlFor="event"
          label="Source event"
        >
          <ReferenceSelect
            {...field('event', "The session this material came from.")}
            defaultValue={text('event')}
            emptyLabel="Not from an event"
            options={events}
          />
        </FormField>

        <FormField
          description="Who presented or wrote it."
          error={errorFor('author')}
          htmlFor="author"
          label="Author / presenter"
        >
          <ReferenceSelect
            {...field('author', 'Who presented or wrote it.')}
            defaultValue={text('author')}
            emptyLabel="No author recorded"
            options={people}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField error={errorFor('publishedAt')} htmlFor="publishedAt" label="Published" required>
            <TextInput {...field('publishedAt')} defaultValue={text('publishedAt')} required type="date" />
          </FormField>

          <FormField
            description="Bump this when you refresh the content."
            error={errorFor('updatedAt')}
            htmlFor="updatedAt"
            label="Last reviewed"
          >
            <TextInput
              {...field('updatedAt', 'Bump this when you refresh the content.')}
              defaultValue={text('updatedAt')}
              type="date"
            />
          </FormField>
        </div>

        <ReferenceCheckboxList
          description="Other material a student reading this one should see next."
          emptyMessage="There are no other resources yet."
          error={errorFor('relatedResources')}
          label="Related resources"
          name="relatedResources"
          options={relatedOptions}
          selected={list('relatedResources')}
        />
      </FieldSet>

      <StudioNote>Files larger than 10 MB and unusual asset repairs are handled in the</StudioNote>

      <FormFooter cancelHref={cancelHref} isPending={isPending} submitLabel={submitLabel} />
    </form>
  )
}
