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
import { RepeatableRows, type RowField } from '@/components/admin/repeatable-rows'
import { EMPTY_FORM_STATE, type AdminFormState, type AdminFormValues } from '@/lib/admin/form-state'
import type { RowValues } from '@/lib/admin/rows'
import { OPEN_ROLE_FIELDS, MAX_OPEN_ROLES } from '@/lib/projects/input-schema'
import { openRoleRowsFromValues } from '@/lib/projects/form-values'
import { EXPERIENCE_LEVELS, PROJECT_STATUSES } from '@/sanity/schemaTypes/shared/options'

/**
 * The create/edit form for a project.
 *
 * Shared by `/admin/projects/new` and `/admin/projects/[id]/edit` — the only
 * difference is the action passed in and the hidden id, so the two screens can
 * never drift apart.
 *
 * A Client Component for the pending state, the inline errors and the open-role
 * editor. It is still a plain `<form>` posting to a Server Action, and it makes
 * no authorization or validation decision: the action re-validates everything
 * server-side, including that every selected person still exists.
 */

const OPEN_ROLE_ROW_FIELDS: RowField[] = [
  {
    kind: 'text',
    key: 'title',
    name: OPEN_ROLE_FIELDS.title,
    label: 'Role',
    placeholder: 'Frontend contributor',
    maxLength: 120,
  },
  {
    kind: 'textarea',
    key: 'description',
    name: OPEN_ROLE_FIELDS.description,
    label: 'What they would work on',
    maxLength: 500,
  },
  {
    kind: 'select',
    key: 'experienceLevel',
    name: OPEN_ROLE_FIELDS.experienceLevel,
    label: 'Experience expected',
    options: EXPERIENCE_LEVELS,
  },
  {
    kind: 'textarea',
    key: 'learningOutcome',
    name: OPEN_ROLE_FIELDS.learningOutcome,
    label: "What you'll learn",
    maxLength: 300,
  },
]

export function ProjectForm({
  action,
  cancelHref,
  coverImage,
  defaults,
  openRoles,
  people,
  projectId,
  screenshotCount,
  submitLabel,
}: {
  action: (state: AdminFormState, formData: FormData) => Promise<AdminFormState>
  cancelHref: string
  /** What is stored today, so the file field can show and link to it. */
  coverImage?: { label: string; href?: string } | null
  defaults: AdminFormValues
  openRoles: RowValues[]
  people: ReferenceOption[]
  projectId?: string
  screenshotCount?: number
  submitLabel: string
}) {
  const [state, formAction, isPending] = useActionState(action, EMPTY_FORM_STATE)

  // After a rejected save the action echoes the submission back, so nothing an
  // officer typed is lost when the form re-renders.
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

  // The rows the officer last submitted win over the stored ones, so a failed
  // save does not empty the open-roles editor.
  const roleRows = state.values ? openRoleRowsFromValues(state.values) : openRoles

  const roleErrors: Record<number, string> = {}
  for (const [key, message] of Object.entries(state.fieldErrors ?? {})) {
    const match = /^openRoles\.(\d+)$/.exec(key)
    if (match) roleErrors[Number(match[1])] = message
  }

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6" noValidate>
      {projectId ? <input name="id" type="hidden" value={projectId} /> : null}

      <FormAlert message={state.status === 'error' ? state.message : undefined} />

      <FieldSet legend="The basics">
        <FormField error={errorFor('name')} htmlFor="name" label="Project name" required>
          <TextInput
            {...field('name')}
            autoComplete="off"
            defaultValue={text('name')}
            maxLength={120}
            required
          />
        </FormField>

        <FormField
          description="Leave blank to build it from the name. Changing it changes the public link."
          error={errorFor('slug')}
          htmlFor="slug"
          label="URL"
        >
          <TextInput
            {...field('slug', 'Leave blank to build it from the name.')}
            autoComplete="off"
            defaultValue={text('slug')}
            placeholder="club-scheduling-app"
          />
        </FormField>

        <FormField
          description="Recruiting shows the project to students looking to join. Archived keeps it on record but sinks it down the list."
          error={errorFor('status')}
          htmlFor="status"
          label="Status"
          required
        >
          <Select
            {...field('status', 'Recruiting shows the project to students looking to join.')}
            defaultValue={text('status') || 'idea'}
            required
          >
            {PROJECT_STATUSES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.title}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          description="One or two sentences shown on project cards."
          error={errorFor('shortDescription')}
          htmlFor="shortDescription"
          label="Short description"
          required
        >
          <TextArea
            {...field('shortDescription', 'One or two sentences shown on project cards.')}
            defaultValue={text('shortDescription')}
            maxLength={300}
            required
          />
        </FormField>

        <FormField
          description="Comma separated. For example: TypeScript, Next.js, PostgreSQL."
          error={errorFor('techStack')}
          htmlFor="techStack"
          label="Technology stack"
        >
          <TextInput
            {...field('techStack', 'Comma separated.')}
            defaultValue={text('techStack')}
            placeholder="TypeScript, Next.js, PostgreSQL"
          />
        </FormField>

        <CheckboxField
          defaultChecked={checked('featured')}
          description="Highlights this project on the homepage."
          id="featured"
          label="Feature on the homepage"
          name="featured"
        />
      </FieldSet>

      <FieldSet
        description="Who the project is for, and what someone would take away from working on it."
        legend="Who it is for"
      >
        <FormField
          error={errorFor('experienceLevel')}
          htmlFor="experienceLevel"
          label="Experience level"
          required
        >
          <Select {...field('experienceLevel')} defaultValue={text('experienceLevel') || 'any'} required>
            {EXPERIENCE_LEVELS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.title}
              </option>
            ))}
          </Select>
        </FormField>

        <CheckboxField
          defaultChecked={checked('noExperienceRequired')}
          description="Shows the “beginners welcome” messaging on the project page."
          id="noExperienceRequired"
          label="No experience required"
          name="noExperienceRequired"
        />

        <FormField
          description="One per line. These are sentences, so commas are kept."
          error={errorFor('learningOutcomes')}
          htmlFor="learningOutcomes"
          label="What you'll learn"
        >
          <TextArea
            {...field('learningOutcomes', 'One per line.')}
            defaultValue={text('learningOutcomes')}
            placeholder={'How to review a pull request\nWriting tests for an API'}
          />
        </FormField>
      </FieldSet>

      <FieldSet
        description="People are shared records — selecting someone here links to them rather than copying their details."
        legend="People"
      >
        <FormField
          description="The student running the project."
          error={errorFor('lead')}
          htmlFor="lead"
          label="Project lead"
        >
          <ReferenceSelect
            {...field('lead', 'The student running the project.')}
            defaultValue={text('lead')}
            emptyLabel="No lead yet"
            options={people}
          />
        </FormField>

        <ReferenceCheckboxList
          description="Officers or alumni advising the team."
          emptyMessage="No people have been added yet. Add them under People, then select them here."
          error={errorFor('mentors')}
          label="Mentors"
          name="mentors"
          options={people}
          selected={list('mentors')}
        />

        <ReferenceCheckboxList
          description="Everyone who has worked on it. Credit is worth keeping accurate."
          emptyMessage="No people have been added yet. Add them under People, then select them here."
          error={errorFor('contributors')}
          label="Contributors"
          name="contributors"
          options={people}
          selected={list('contributors')}
        />
      </FieldSet>

      <RepeatableRows
        addLabel="Add an open role"
        description="Positions students can join right now. A recruiting project needs at least one."
        emptyMessage="No open roles. Add one so students know how to join."
        error={errorFor('openRoles')}
        fields={OPEN_ROLE_ROW_FIELDS}
        initialRows={roleRows}
        legend="Open roles"
        max={MAX_OPEN_ROLES}
        rowErrors={roleErrors}
        rowLabel="title"
        rowNoun="Role"
      />

      <FieldSet legend="Links & progress">
        <FormField error={errorFor('githubUrl')} htmlFor="githubUrl" label="GitHub repository">
          <TextInput
            {...field('githubUrl')}
            defaultValue={text('githubUrl')}
            inputMode="url"
            placeholder="https://github.com/"
          />
        </FormField>

        <FormField error={errorFor('demoUrl')} htmlFor="demoUrl" label="Live demo">
          <TextInput
            {...field('demoUrl')}
            defaultValue={text('demoUrl')}
            inputMode="url"
            placeholder="https://"
          />
        </FormField>

        <FormField
          description="Channel or thread where the team talks."
          error={errorFor('discussionUrl')}
          htmlFor="discussionUrl"
          label="Discord / discussion link"
        >
          <TextInput
            {...field('discussionUrl', 'Channel or thread where the team talks.')}
            defaultValue={text('discussionUrl')}
            inputMode="url"
            placeholder="https://"
          />
        </FormField>

        <FormField
          description="What the team is working on at the moment."
          error={errorFor('currentFocus')}
          htmlFor="currentFocus"
          label="Current focus"
        >
          <TextArea
            {...field('currentFocus', 'What the team is working on at the moment.')}
            defaultValue={text('currentFocus')}
            maxLength={500}
          />
        </FormField>

        <FormField
          description="The most recent thing the team shipped or reached."
          error={errorFor('latestMilestone')}
          htmlFor="latestMilestone"
          label="Latest milestone"
        >
          <TextInput
            {...field('latestMilestone', 'The most recent thing the team shipped or reached.')}
            defaultValue={text('latestMilestone')}
            maxLength={200}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField error={errorFor('startedAt')} htmlFor="startedAt" label="Started">
            <TextInput {...field('startedAt')} defaultValue={text('startedAt')} type="date" />
          </FormField>

          <FormField
            description="Needed once a project is shipped or archived."
            error={errorFor('completedAt')}
            htmlFor="completedAt"
            label="Shipped / archived"
          >
            <TextInput
              {...field('completedAt', 'Needed once a project is shipped or archived.')}
              defaultValue={text('completedAt')}
              type="date"
            />
          </FormField>
        </div>
      </FieldSet>

      <FieldSet legend="Featured image">
        <FileField
          current={coverImage}
          description="Shown on the project card and at the top of the project page."
          error={errorFor('coverImage')}
          htmlFor="coverImage"
          kind="image"
          label="Cover image"
          removeName="removeCoverImage"
        />

        <FormField
          description="Describe the image for screen readers. Leave blank if it is purely decorative."
          error={errorFor('coverImageAlt')}
          htmlFor="coverImageAlt"
          label="Alt text"
        >
          <TextInput
            {...field('coverImageAlt', 'Describe the image for screen readers.')}
            defaultValue={text('coverImageAlt')}
            maxLength={200}
          />
        </FormField>

        {screenshotCount ? (
          <p className="border-rule bg-paper-warm text-ink-body rounded-md border px-3 py-2.5 text-[12.5px]">
            This project has {screenshotCount} screenshot{screenshotCount === 1 ? '' : 's'}. Manage
            screenshots in the Advanced CMS — saving here leaves them untouched.
          </p>
        ) : null}
      </FieldSet>

      <StudioNote>
        The full rich-text description, the screenshot gallery and SEO are edited in the
      </StudioNote>

      <FormFooter cancelHref={cancelHref} isPending={isPending} submitLabel={submitLabel} />
    </form>
  )
}
