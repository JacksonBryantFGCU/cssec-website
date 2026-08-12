import { UsersIcon } from '@sanity/icons/Users'
import { defineField, defineType } from 'sanity'

/**
 * One officer term: a person holding a position for an academic year.
 *
 * Modelled separately from `person` so leadership history is preserved — a new
 * term is a new document, and last year's board is never overwritten.
 */
export const officerRole = defineType({
  name: 'officerRole',
  title: 'Officer term',
  type: 'document',
  icon: UsersIcon,
  fields: [
    defineField({
      name: 'person',
      type: 'reference',
      to: [{ type: 'person' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'position',
      title: 'Position',
      type: 'string',
      description: 'For example: President, Vice President, Treasurer, Event Coordinator.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'term',
      title: 'Academic year',
      type: 'string',
      description: 'For example: 2025–2026.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'isCurrent',
      title: 'Currently serving',
      type: 'boolean',
      description: 'Turn this off when the term ends — the document stays as history.',
      initialValue: true,
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display order',
      type: 'number',
      description: 'Lower numbers appear first on the leadership list.',
      initialValue: 100,
      validation: (rule) => rule.integer().min(0),
    }),
  ],
  orderings: [
    {
      title: 'Display order',
      name: 'displayOrderAsc',
      by: [
        { field: 'displayOrder', direction: 'asc' },
        { field: 'position', direction: 'asc' },
      ],
    },
  ],
  preview: {
    select: {
      position: 'position',
      name: 'person.name',
      term: 'term',
      isCurrent: 'isCurrent',
      media: 'person.photo',
    },
    prepare: ({ position, name, term, isCurrent, media }) => ({
      title: `${position}${name ? ` — ${name}` : ''}`,
      subtitle: [term, isCurrent ? 'Current' : 'Past'].filter(Boolean).join(' · '),
      media,
    }),
  },
})
