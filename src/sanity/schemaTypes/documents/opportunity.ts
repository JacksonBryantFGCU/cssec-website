import { CaseIcon } from '@sanity/icons/Case'
import { defineArrayMember, defineField, defineType } from 'sanity'

import {
  OPPORTUNITY_TYPES,
  WORK_ARRANGEMENTS,
  titleForValue,
} from '../shared/options'

/**
 * A curated posting for the student opportunity board.
 *
 * Store only facts. Anything derived — "6 days left", "expired", sort order —
 * is computed by the application from `deadline`.
 */
export const opportunity = defineType({
  name: 'opportunity',
  title: 'Opportunity',
  type: 'document',
  icon: CaseIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'organization',
      type: 'string',
      description: 'Company, lab, university or event organizer.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'opportunityType',
      title: 'Type',
      type: 'string',
      options: { list: OPPORTUNITY_TYPES },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required().max(600),
    }),
    defineField({
      name: 'location',
      type: 'string',
      description: 'For example: Fort Myers, FL or Remote (US).',
    }),
    defineField({
      name: 'workArrangement',
      title: 'Work arrangement',
      type: 'string',
      options: { list: WORK_ARRANGEMENTS, layout: 'radio' },
    }),
    defineField({
      name: 'applicationUrl',
      title: 'Application URL',
      type: 'url',
      validation: (rule) => rule.required().uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'deadline',
      title: 'Application deadline',
      type: 'date',
      description: 'Leave empty for rolling applications.',
    }),
    defineField({
      name: 'postedAt',
      title: 'Posted',
      type: 'date',
      initialValue: () => new Date().toISOString().slice(0, 10),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'skills',
      title: 'Relevant skills / topics',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      options: { layout: 'tags' },
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'majors',
      title: 'Relevant majors',
      type: 'array',
      description: 'For example: Computer Science, Software Engineering.',
      of: [defineArrayMember({ type: 'string' })],
      options: { layout: 'tags' },
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'featured',
      title: 'Feature on the opportunity board',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  orderings: [
    {
      title: 'Deadline, soonest first',
      name: 'deadlineAsc',
      by: [{ field: 'deadline', direction: 'asc' }],
    },
    {
      title: 'Recently posted',
      name: 'postedAtDesc',
      by: [{ field: 'postedAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      organization: 'organization',
      opportunityType: 'opportunityType',
      deadline: 'deadline',
    },
    prepare: ({ title, organization, opportunityType, deadline }) => ({
      title: organization ? `${organization} — ${title}` : title,
      subtitle: [
        titleForValue(OPPORTUNITY_TYPES, opportunityType),
        deadline ? `Deadline ${deadline}` : 'Rolling deadline',
      ]
        .filter(Boolean)
        .join(' · '),
    }),
  },
})
