'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import {
  CheckboxField,
  describedBy,
  FieldError,
  FieldSet,
  FormField,
  Select,
  TextArea,
  TextInput,
} from '@/components/admin/form-field'
import { Button, buttonVariants } from '@/components/ui/button'
import { EMPTY_FORM_STATE, type EventFormState } from '@/lib/events/form-state'
import type { EventFormValues } from '@/lib/events/form-values'
import { CLUB_TIME_ZONE_LABEL } from '@/lib/time'
import { cn } from '@/lib/utils'
import {
  EVENT_STATUSES,
  EVENT_TYPES,
  EXPERIENCE_LEVELS,
  LOCATION_TYPES,
} from '@/sanity/schemaTypes/shared/options'

/**
 * The create/edit form for an event.
 *
 * Shared by `/admin/events/new` and `/admin/events/[id]/edit` — the only
 * difference is the action passed in and the hidden id, so the two screens can
 * never drift apart.
 *
 * A Client Component for the pending state and inline errors only. It is a
 * plain `<form>` posting to a Server Action, so it still submits without
 * JavaScript, and it makes no authorization or validation decision: the action
 * re-validates everything server-side.
 */

export type PersonOption = { _id: string; name: string }

export function EventForm({
  action,
  cancelHref,
  defaults,
  eventId,
  people,
  submitLabel,
}: {
  action: (state: EventFormState, formData: FormData) => Promise<EventFormState>
  cancelHref: string
  defaults: EventFormValues
  eventId?: string
  people: PersonOption[]
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

  const selectedPresenters = list('presenters')

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-8 px-6 py-6" noValidate>
      {eventId ? <input name="id" type="hidden" value={eventId} /> : null}

      {state.status === 'error' && state.message ? (
        <p
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-4 py-3 text-sm font-medium"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}

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
            placeholder="intro-to-git"
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField error={errorFor('eventType')} htmlFor="eventType" label="Event type" required>
            <Select {...field('eventType')} defaultValue={text('eventType') || 'workshop'} required>
              {EVENT_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.title}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            description="Cancelled and completed events stay on record."
            error={errorFor('status')}
            htmlFor="status"
            label="Status"
            required
          >
            <Select
              {...field('status', 'Cancelled and completed events stay on record.')}
              defaultValue={text('status') || 'scheduled'}
              required
            >
              {EVENT_STATUSES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.title}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField
          description="One or two sentences shown on event cards."
          error={errorFor('summary')}
          htmlFor="summary"
          label="Summary"
          required
        >
          <TextArea
            {...field('summary', 'One or two sentences shown on event cards.')}
            defaultValue={text('summary')}
            maxLength={300}
            required
          />
        </FormField>
      </FieldSet>

      <FieldSet
        description={`All times are ${CLUB_TIME_ZONE_LABEL}.`}
        legend="When"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField error={errorFor('startsAt')} htmlFor="startsAt" label="Starts" required>
            <TextInput
              {...field('startsAt')}
              defaultValue={text('startsAt')}
              required
              type="datetime-local"
            />
          </FormField>

          <FormField
            description="Optional."
            error={errorFor('endsAt')}
            htmlFor="endsAt"
            label="Ends"
          >
            <TextInput
              {...field('endsAt', 'Optional.')}
              defaultValue={text('endsAt')}
              type="datetime-local"
            />
          </FormField>
        </div>
      </FieldSet>

      <FieldSet legend="Where">
        <FormField error={errorFor('locationType')} htmlFor="locationType" label="How is it held?" required>
          <Select {...field('locationType')} defaultValue={text('locationType') || 'inPerson'} required>
            {LOCATION_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.title}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          description="Required for in-person and hybrid events. For example: Holmes Hall 214."
          error={errorFor('place')}
          htmlFor="place"
          label="Building and room"
        >
          <TextInput
            {...field('place', 'Required for in-person and hybrid events.')}
            defaultValue={text('place')}
          />
        </FormField>

        <FormField
          description="Required for online and hybrid events."
          error={errorFor('onlineUrl')}
          htmlFor="onlineUrl"
          label="Meeting link"
        >
          <TextInput
            {...field('onlineUrl', 'Required for online and hybrid events.')}
            defaultValue={text('onlineUrl')}
            inputMode="url"
            placeholder="https://"
          />
        </FormField>

        <FormField
          description="Optional parking or wayfinding notes."
          error={errorFor('directions')}
          htmlFor="directions"
          label="Directions"
        >
          <TextArea
            {...field('directions', 'Optional parking or wayfinding notes.')}
            defaultValue={text('directions')}
            maxLength={300}
          />
        </FormField>
      </FieldSet>

      <FieldSet legend="Who it is for">
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

        <CheckboxField
          defaultChecked={checked('noExperienceRequired')}
          description="Shows the “beginners welcome, nothing to prepare” messaging."
          id="noExperienceRequired"
          label="No experience required"
          name="noExperienceRequired"
        />

        <FormField
          description="One per line. Leave empty when nothing is needed."
          error={errorFor('prerequisites')}
          htmlFor="prerequisites"
          label="Prerequisites"
        >
          <TextArea
            {...field('prerequisites', 'One per line.')}
            defaultValue={text('prerequisites')}
            placeholder={'A laptop\nGit installed'}
          />
        </FormField>
      </FieldSet>

      <FieldSet legend="Details">
        <FormField
          description="Comma separated. For example: git, python, resumes."
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

        <div>
          <p className="mb-2 text-sm font-medium" id="presenters-label">
            Presenters
          </p>
          {people.length === 0 ? (
            <p className="text-muted-foreground text-xs">
              No people have been added yet. Add them in the Advanced CMS, then select them here.
            </p>
          ) : (
            <ul aria-labelledby="presenters-label" className="flex flex-col gap-1">
              {people.map((person) => (
                <li key={person._id}>
                  <label className="flex min-h-11 items-center gap-3 text-sm">
                    <input
                      className="accent-primary size-5"
                      defaultChecked={selectedPresenters.includes(person._id)}
                      name="presenters"
                      type="checkbox"
                      value={person._id}
                    />
                    {person.name}
                  </label>
                </li>
              ))}
            </ul>
          )}
          <FieldError error={errorFor('presenters')} id="presenters-error" />
        </div>

        <FormField
          error={errorFor('registrationUrl')}
          htmlFor="registrationUrl"
          label="Registration link"
        >
          <TextInput
            {...field('registrationUrl')}
            defaultValue={text('registrationUrl')}
            inputMode="url"
            placeholder="https://"
          />
        </FormField>

        <FormField
          description="Channel or thread where this event is discussed."
          error={errorFor('communityUrl')}
          htmlFor="communityUrl"
          label="Discord / community link"
        >
          <TextInput
            {...field('communityUrl', 'Channel or thread where this event is discussed.')}
            defaultValue={text('communityUrl')}
            inputMode="url"
            placeholder="https://"
          />
        </FormField>

        <CheckboxField
          defaultChecked={checked('featured')}
          description="Highlights this event on the homepage."
          id="featured"
          label="Feature on the homepage"
          name="featured"
        />

        <FormField
          description="Added after the event — what was covered, attendance, highlights."
          error={errorFor('recap')}
          htmlFor="recap"
          label="Recap"
        >
          <TextArea
            {...field('recap', 'Added after the event.')}
            defaultValue={text('recap')}
            maxLength={1000}
          />
        </FormField>
      </FieldSet>

      <p className="text-muted-foreground text-xs">
        Full descriptions, setup instructions and SEO are edited in the{' '}
        <Link className="underline underline-offset-4" href="/studio" rel="noreferrer" target="_blank">
          Advanced CMS
        </Link>
        . Saving here leaves them untouched.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={isPending} type="submit">
          {isPending ? 'Saving…' : submitLabel}
        </Button>
        <Link className={cn(buttonVariants({ variant: 'ghost' }))} href={cancelHref}>
          Cancel
        </Link>
      </div>
    </form>
  )
}
