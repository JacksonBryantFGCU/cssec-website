import { CalendarIcon } from '@sanity/icons/Calendar'
import { defineArrayMember, defineField, defineType } from 'sanity'

import { EVENT_STATUSES, EVENT_TYPES, EXPERIENCE_LEVELS, titleForValue } from '../shared/options'

/**
 * An event before and after it happens.
 *
 * The same document powers the upcoming view (date, location, prerequisites,
 * setup instructions) and the historical view once it is over. Materials such
 * as slides, recordings and repositories are separate `resource` documents that
 * point back here, so they are also usable from the resource library.
 */
export const event = defineType({
  name: 'event',
  title: 'Event',
  type: 'document',
  icon: CalendarIcon,
  groups: [
    { name: 'details', title: 'Details', default: true },
    { name: 'attend', title: 'Attending' },
    { name: 'materials', title: 'Materials' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      group: 'details',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'details',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'status',
      type: 'string',
      group: 'details',
      description: 'Set to Completed after the event so it moves into the archive view.',
      options: { list: EVENT_STATUSES, layout: 'radio' },
      initialValue: 'scheduled',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'eventType',
      title: 'Event type',
      type: 'string',
      group: 'details',
      options: { list: EVENT_TYPES },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'startsAt',
      title: 'Starts',
      type: 'datetime',
      group: 'details',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'endsAt',
      title: 'Ends',
      type: 'datetime',
      group: 'details',
      validation: (rule) =>
        rule.custom((endsAt, context) => {
          const startsAt = (context.document as { startsAt?: string } | undefined)?.startsAt
          if (endsAt && startsAt && new Date(endsAt) < new Date(startsAt)) {
            return 'The end time cannot be before the start time.'
          }
          return true
        }),
    }),
    defineField({
      name: 'location',
      type: 'eventLocation',
      group: 'details',
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 3,
      group: 'details',
      description: 'One or two sentences shown on event cards and in previews.',
      validation: (rule) => rule.required().max(300),
    }),
    defineField({
      name: 'description',
      title: 'Full description',
      type: 'array',
      group: 'details',
      of: [defineArrayMember({ type: 'block' })],
    }),
    defineField({
      name: 'presenters',
      type: 'array',
      group: 'details',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'person' }] })],
    }),
    defineField({
      name: 'topics',
      title: 'Topics',
      type: 'array',
      group: 'details',
      description: 'For example: git, python, resumes, react.',
      of: [defineArrayMember({ type: 'string' })],
      options: { layout: 'tags' },
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'featured',
      title: 'Feature on the homepage',
      type: 'boolean',
      group: 'details',
      initialValue: false,
    }),
    defineField({
      name: 'experienceLevel',
      title: 'Experience level',
      type: 'string',
      group: 'attend',
      options: { list: EXPERIENCE_LEVELS },
      initialValue: 'any',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'noExperienceRequired',
      title: 'No experience required',
      type: 'boolean',
      group: 'attend',
      description: 'Shows the "beginners welcome, nothing to prepare" messaging.',
      initialValue: true,
    }),
    defineField({
      name: 'prerequisites',
      title: 'Prerequisites',
      type: 'array',
      group: 'attend',
      description: 'Leave empty when no experience is required.',
      of: [defineArrayMember({ type: 'string' })],
    }),
    defineField({
      name: 'setupInstructions',
      title: 'Setup instructions',
      type: 'array',
      group: 'attend',
      description: 'What attendees should install or bring before the event.',
      of: [defineArrayMember({ type: 'block' })],
    }),
    defineField({
      name: 'registrationUrl',
      title: 'Registration URL',
      type: 'url',
      group: 'attend',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'communityUrl',
      title: 'Discord / community link',
      type: 'url',
      group: 'attend',
      description: 'Channel or thread where this event is discussed.',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'recap',
      title: 'Recap',
      type: 'text',
      rows: 3,
      group: 'materials',
      description: 'Short note added after the event — what was covered, attendance, highlights.',
    }),
    defineField({
      name: 'relatedResources',
      title: 'Additional resources',
      type: 'array',
      group: 'materials',
      description:
        'Optional. Resources created for this event should set their own "Related event" field instead — use this only to highlight extra material from elsewhere.',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'resource' }] })],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'seo',
      type: 'seo',
      group: 'seo',
    }),
  ],
  orderings: [
    {
      title: 'Date, newest first',
      name: 'startsAtDesc',
      by: [{ field: 'startsAt', direction: 'desc' }],
    },
    {
      title: 'Date, oldest first',
      name: 'startsAtAsc',
      by: [{ field: 'startsAt', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      startsAt: 'startsAt',
      eventType: 'eventType',
      status: 'status',
    },
    prepare: ({ title, startsAt, eventType, status }) => {
      const date = startsAt
        ? new Date(startsAt).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })
        : 'No date set'

      return {
        title,
        subtitle: [date, titleForValue(EVENT_TYPES, eventType), titleForValue(EVENT_STATUSES, status)]
          .filter(Boolean)
          .join(' · '),
      }
    },
  },
})
