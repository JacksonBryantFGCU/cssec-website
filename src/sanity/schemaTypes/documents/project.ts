import { RocketIcon } from '@sanity/icons/Rocket'
import { defineArrayMember, defineField, defineType } from 'sanity'

import { EXPERIENCE_LEVELS, PROJECT_STATUSES, titleForValue } from '../shared/options'

/**
 * A club project students can join.
 *
 * This summarises participation — who leads it, what it is for, what roles are
 * open and what you would learn. Day-to-day issue tracking stays in GitHub.
 */
export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  icon: RocketIcon,
  groups: [
    { name: 'details', title: 'Details', default: true },
    { name: 'people', title: 'People & roles' },
    { name: 'links', title: 'Links & progress' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      group: 'details',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'details',
      options: { source: 'name', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'status',
      type: 'string',
      group: 'details',
      options: { list: PROJECT_STATUSES },
      initialValue: 'idea',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short description',
      type: 'text',
      rows: 3,
      group: 'details',
      description: 'One or two sentences shown on project cards.',
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
      name: 'coverImage',
      title: 'Featured image',
      type: 'image',
      group: 'details',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
    }),
    defineField({
      name: 'screenshots',
      type: 'array',
      group: 'details',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
        }),
      ],
    }),
    defineField({
      name: 'techStack',
      title: 'Technology stack',
      type: 'array',
      group: 'details',
      description: 'For example: TypeScript, Next.js, PostgreSQL.',
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
      group: 'people',
      options: { list: EXPERIENCE_LEVELS },
      initialValue: 'any',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'noExperienceRequired',
      title: 'No experience required',
      type: 'boolean',
      group: 'people',
      description: 'Shows the "beginners welcome" messaging on the project page.',
      initialValue: false,
    }),
    defineField({
      name: 'lead',
      title: 'Project lead',
      type: 'reference',
      to: [{ type: 'person' }],
      group: 'people',
    }),
    defineField({
      name: 'mentors',
      type: 'array',
      group: 'people',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'person' }] })],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'contributors',
      type: 'array',
      group: 'people',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'person' }] })],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'openRoles',
      title: 'Open roles',
      type: 'array',
      group: 'people',
      description: 'Positions students can join right now.',
      of: [defineArrayMember({ type: 'openRole' })],
    }),
    defineField({
      name: 'learningOutcomes',
      title: "What you'll learn",
      type: 'array',
      group: 'people',
      of: [defineArrayMember({ type: 'string' })],
    }),
    defineField({
      name: 'githubUrl',
      title: 'GitHub URL',
      type: 'url',
      group: 'links',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'demoUrl',
      title: 'Live demo URL',
      type: 'url',
      group: 'links',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'discussionUrl',
      title: 'Discord / discussion link',
      type: 'url',
      group: 'links',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'currentFocus',
      title: 'Current focus',
      type: 'text',
      rows: 2,
      group: 'links',
      description: 'What the team is working on at the moment.',
    }),
    defineField({
      name: 'latestMilestone',
      title: 'Latest milestone',
      type: 'string',
      group: 'links',
      description: 'The most recent thing the team shipped or reached.',
    }),
    defineField({
      name: 'startedAt',
      title: 'Started',
      type: 'date',
      group: 'links',
    }),
    defineField({
      name: 'completedAt',
      title: 'Shipped / archived',
      type: 'date',
      group: 'links',
      validation: (rule) =>
        rule.custom((completedAt, context) => {
          const startedAt = (context.document as { startedAt?: string } | undefined)?.startedAt
          if (completedAt && startedAt && completedAt < startedAt) {
            return 'The end date cannot be before the start date.'
          }
          return true
        }),
    }),
    defineField({
      name: 'seo',
      type: 'seo',
      group: 'seo',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      status: 'status',
      noExperienceRequired: 'noExperienceRequired',
      openRoles: 'openRoles',
      media: 'coverImage',
    },
    prepare: ({ title, status, noExperienceRequired, openRoles, media }) => {
      const openRoleCount = Array.isArray(openRoles) ? openRoles.length : 0

      return {
        title,
        subtitle: [
          titleForValue(PROJECT_STATUSES, status),
          openRoleCount > 0 && `${openRoleCount} open role${openRoleCount === 1 ? '' : 's'}`,
          noExperienceRequired && 'Beginner friendly',
        ]
          .filter(Boolean)
          .join(' · '),
        media,
      }
    },
  },
})
