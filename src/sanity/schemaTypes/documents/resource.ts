import { BookIcon } from '@sanity/icons/Book'
import { defineArrayMember, defineField, defineType } from 'sanity'

import { EXPERIENCE_LEVELS, RESOURCE_TYPES, titleForValue } from '../shared/options'

/**
 * A first-class piece of learning material: slides, a recording, a cheat sheet,
 * a starter repository, a guide.
 *
 * Resources are browsable on their own in the resource library and are also how
 * an event's materials are attached — set `event` to link one back to the
 * session it came from.
 */
export const resource = defineType({
  name: 'resource',
  title: 'Resource',
  type: 'document',
  icon: BookIcon,
  groups: [
    { name: 'details', title: 'Details', default: true },
    { name: 'content', title: 'File & links' },
    { name: 'related', title: 'Related' },
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
      name: 'resourceType',
      title: 'Resource type',
      type: 'string',
      group: 'details',
      options: { list: RESOURCE_TYPES },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      type: 'text',
      rows: 3,
      group: 'details',
      description: 'What this is and who it is for.',
      validation: (rule) => rule.required().max(400),
    }),
    defineField({
      name: 'topics',
      title: 'Topics',
      type: 'array',
      group: 'details',
      of: [defineArrayMember({ type: 'string' })],
      options: { layout: 'tags' },
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'experienceLevel',
      title: 'Experience level',
      type: 'string',
      group: 'details',
      options: { list: EXPERIENCE_LEVELS },
      initialValue: 'any',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'featured',
      title: 'Feature in the resource library',
      type: 'boolean',
      group: 'details',
      initialValue: false,
    }),
    defineField({
      name: 'file',
      title: 'Uploaded file',
      type: 'file',
      group: 'content',
      description: 'Slides, PDFs and cheat sheets. Do not upload video — link to it instead.',
    }),
    defineField({
      name: 'externalUrl',
      title: 'External URL',
      type: 'url',
      group: 'content',
      description: 'Recording, article or anything hosted elsewhere.',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'githubUrl',
      title: 'GitHub URL',
      type: 'url',
      group: 'content',
      description: 'Starter or completed repository.',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'author',
      title: 'Author / presenter',
      type: 'reference',
      to: [{ type: 'person' }],
      group: 'related',
    }),
    defineField({
      name: 'event',
      title: 'Related event',
      type: 'reference',
      to: [{ type: 'event' }],
      group: 'related',
      description: 'The session this material came from, if any.',
    }),
    defineField({
      name: 'relatedResources',
      title: 'Related resources',
      type: 'array',
      group: 'related',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'resource' }] })],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published',
      type: 'date',
      group: 'related',
      initialValue: () => new Date().toISOString().slice(0, 10),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'updatedAt',
      title: 'Last reviewed',
      type: 'date',
      group: 'related',
      description: 'Bump this when you refresh the content so students know it is current.',
      validation: (rule) =>
        rule.custom((updatedAt, context) => {
          const publishedAt = (context.document as { publishedAt?: string } | undefined)?.publishedAt
          if (updatedAt && publishedAt && updatedAt < publishedAt) {
            return 'The review date cannot be before the published date.'
          }
          return true
        }),
    }),
  ],
  // A resource is useless without something to open: a file, a link or a repo.
  validation: (rule) =>
    rule.custom((doc) => {
      const value = doc as
        | { file?: unknown; externalUrl?: string; githubUrl?: string }
        | undefined
      if (value?.file || value?.externalUrl || value?.githubUrl) return true
      return {
        message: 'Add an uploaded file, an external URL or a GitHub URL.',
        paths: [['file'], ['externalUrl'], ['githubUrl']],
      }
    }),
  orderings: [
    {
      title: 'Newest first',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      resourceType: 'resourceType',
      eventTitle: 'event.title',
    },
    prepare: ({ title, resourceType, eventTitle }) => ({
      title,
      subtitle: [titleForValue(RESOURCE_TYPES, resourceType), eventTitle && `from ${eventTitle}`]
        .filter(Boolean)
        .join(' · '),
    }),
  },
})
