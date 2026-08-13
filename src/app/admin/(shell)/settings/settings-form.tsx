'use client'

import { useActionState } from 'react'

import {
  describedBy,
  FieldSet,
  FormAlert,
  FormField,
  FormFooter,
  StudioNote,
  TextArea,
  TextInput,
} from '@/components/admin/form-field'
import { ReferenceSelect, type ReferenceOption } from '@/components/admin/reference-field'
import { RepeatableRows, type RowField } from '@/components/admin/repeatable-rows'
import { EMPTY_FORM_STATE, type AdminFormState, type AdminFormValues } from '@/lib/admin/form-state'
import type { RowValues } from '@/lib/admin/rows'
import { socialLinkRowsFromValues } from '@/lib/settings/form-values'
import { MAX_SOCIAL_LINKS, SOCIAL_LINK_FIELDS } from '@/lib/settings/input-schema'
import { SOCIAL_PLATFORMS } from '@/sanity/schemaTypes/shared/options'

/**
 * The club's global content, in one form.
 *
 * Everything here appears on every page, which is why it is short: a name, a
 * sentence, an address, a few links. Nothing on this form configures the
 * *application* — no project ids, no tokens, no deployment or design settings —
 * because those are code and environment concerns, and an officer should never
 * be one mistyped field away from breaking the site.
 */

const SOCIAL_ROW_FIELDS: RowField[] = [
  {
    kind: 'select',
    key: 'platform',
    name: SOCIAL_LINK_FIELDS.platform,
    label: 'Platform',
    options: SOCIAL_PLATFORMS,
  },
  {
    kind: 'text',
    key: 'label',
    name: SOCIAL_LINK_FIELDS.label,
    label: 'Label',
    placeholder: 'Only needed for “Other”',
    maxLength: 60,
  },
  {
    kind: 'text',
    key: 'url',
    name: SOCIAL_LINK_FIELDS.url,
    label: 'Link',
    placeholder: 'https://',
    inputMode: 'url',
  },
]

export function SettingsForm({
  action,
  defaults,
  people,
  socialLinks,
}: {
  action: (state: AdminFormState, formData: FormData) => Promise<AdminFormState>
  defaults: AdminFormValues
  people: ReferenceOption[]
  socialLinks: RowValues[]
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

  const linkRows = state.values ? socialLinkRowsFromValues(state.values) : socialLinks

  const linkErrors: Record<number, string> = {}
  for (const [key, message] of Object.entries(state.fieldErrors ?? {})) {
    const match = /^socialLinks\.(\d+)$/.exec(key)
    if (match) linkErrors[Number(match[1])] = message
  }

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6" noValidate>
      <FormAlert message={state.status === 'error' ? state.message : undefined} />

      <FieldSet legend="The club">
        <FormField error={errorFor('clubName')} htmlFor="clubName" label="Full name" required>
          <TextInput
            {...field('clubName')}
            autoComplete="off"
            defaultValue={text('clubName')}
            maxLength={120}
            required
          />
        </FormField>

        <FormField
          description="Used in the wordmark and anywhere space is tight."
          error={errorFor('shortName')}
          htmlFor="shortName"
          label="Short name"
          required
        >
          <TextInput
            {...field('shortName', 'Used in the wordmark and anywhere space is tight.')}
            autoComplete="off"
            className="max-w-40"
            defaultValue={text('shortName')}
            maxLength={12}
            required
          />
        </FormField>

        <FormField
          description="One or two sentences, used in the footer and as the default description for search engines."
          error={errorFor('description')}
          htmlFor="description"
          label="Short description"
          required
        >
          <TextArea
            {...field('description', 'One or two sentences, used in the footer and for search engines.')}
            defaultValue={text('description')}
            maxLength={300}
            required
          />
        </FormField>

        <FormField
          description="For example: Wednesdays at 5:00 PM in Holmes Hall 214."
          error={errorFor('meetingInfo')}
          htmlFor="meetingInfo"
          label="Regular meeting info"
        >
          <TextInput
            {...field('meetingInfo', 'For example: Wednesdays at 5:00 PM in Holmes Hall 214.')}
            defaultValue={text('meetingInfo')}
            maxLength={160}
          />
        </FormField>

        <FormField
          description="Affiliation, disclaimer or anything else the footer should carry."
          error={errorFor('footerNote')}
          htmlFor="footerNote"
          label="Footer note"
        >
          <TextArea
            {...field('footerNote', 'Affiliation or disclaimer for the footer.')}
            defaultValue={text('footerNote')}
            maxLength={300}
          />
        </FormField>

        <FormField
          description="Shown on the about page. Add them under People first if they are not listed."
          error={errorFor('facultyAdvisor')}
          htmlFor="facultyAdvisor"
          label="Faculty advisor"
        >
          <ReferenceSelect
            {...field('facultyAdvisor', 'Shown on the about page.')}
            defaultValue={text('facultyAdvisor')}
            emptyLabel="No advisor listed"
            options={people}
          />
        </FormField>
      </FieldSet>

      <FieldSet
        description="How students reach the club. These appear in the footer and on the join page."
        legend="Contact & links"
      >
        <FormField
          description="The address on every page. Make sure somebody actually reads it."
          error={errorFor('contactEmail')}
          htmlFor="contactEmail"
          label="Contact email"
          required
        >
          <TextInput
            {...field('contactEmail', 'The address on every page.')}
            autoComplete="off"
            defaultValue={text('contactEmail')}
            inputMode="email"
            required
          />
        </FormField>

        <FormField
          description="Use a permanent invite link — a temporary one expires and quietly stops working."
          error={errorFor('discordUrl')}
          htmlFor="discordUrl"
          label="Discord invite"
        >
          <TextInput
            {...field('discordUrl', 'Use a permanent invite link.')}
            defaultValue={text('discordUrl')}
            inputMode="url"
            placeholder="https://discord.gg/"
          />
        </FormField>

        <FormField error={errorFor('githubUrl')} htmlFor="githubUrl" label="GitHub organization">
          <TextInput
            {...field('githubUrl')}
            defaultValue={text('githubUrl')}
            inputMode="url"
            placeholder="https://github.com/"
          />
        </FormField>

        <FormField error={errorFor('teamsUrl')} htmlFor="teamsUrl" label="Microsoft Teams">
          <TextInput
            {...field('teamsUrl')}
            defaultValue={text('teamsUrl')}
            inputMode="url"
            placeholder="https://teams.microsoft.com/"
          />
        </FormField>
      </FieldSet>

      <RepeatableRows
        addLabel="Add a link"
        description="Instagram, YouTube, anywhere else the club has a presence."
        emptyMessage="No other links yet."
        error={errorFor('socialLinks')}
        fields={SOCIAL_ROW_FIELDS}
        initialRows={linkRows}
        legend="Other links"
        max={MAX_SOCIAL_LINKS}
        rowErrors={linkErrors}
        rowLabel="label"
        rowNoun="Link"
      />

      <FieldSet
        description="Used for pages that do not define their own. Leave blank to fall back to the club name and description above."
        legend="Default search-engine listing"
      >
        <FormField
          description="Around 60 characters is what search results show."
          error={errorFor('metaTitle')}
          htmlFor="metaTitle"
          label="Title"
        >
          <TextInput
            {...field('metaTitle', 'Around 60 characters is what search results show.')}
            defaultValue={text('metaTitle')}
            maxLength={70}
          />
        </FormField>

        <FormField
          description="Around 155 characters. This is the grey text under the link."
          error={errorFor('metaDescription')}
          htmlFor="metaDescription"
          label="Description"
        >
          <TextArea
            {...field('metaDescription', 'Around 155 characters.')}
            defaultValue={text('metaDescription')}
            maxLength={160}
          />
        </FormField>
      </FieldSet>

      <StudioNote>The default share image, and anything else on this document, is edited in the</StudioNote>

      <FormFooter cancelHref="/admin" isPending={isPending} submitLabel="Save settings" />
    </form>
  )
}
