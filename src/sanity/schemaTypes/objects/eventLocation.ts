import { PinIcon } from '@sanity/icons/Pin'
import { defineField, defineType } from 'sanity'

import { LOCATION_TYPES, titleForValue } from '../shared/options'

export const eventLocation = defineType({
  name: 'eventLocation',
  title: 'Location',
  type: 'object',
  icon: PinIcon,
  fields: [
    defineField({
      name: 'locationType',
      title: 'How is it held?',
      type: 'string',
      options: { list: LOCATION_TYPES, layout: 'radio' },
      initialValue: 'inPerson',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'place',
      title: 'Building and room',
      type: 'string',
      description: 'For example: Holmes Hall 214.',
      hidden: ({ parent }) => parent?.locationType === 'online',
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { locationType?: string } | undefined
          if (parent?.locationType !== 'online' && !value) {
            return 'Add the building and room for in-person and hybrid events.'
          }
          return true
        }),
    }),
    defineField({
      name: 'onlineUrl',
      title: 'Meeting link',
      type: 'url',
      description: 'Zoom, Teams or Discord voice channel link.',
      hidden: ({ parent }) => parent?.locationType === 'inPerson',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'directions',
      title: 'Directions or parking notes',
      type: 'text',
      rows: 2,
      hidden: ({ parent }) => parent?.locationType === 'online',
    }),
  ],
  preview: {
    select: { locationType: 'locationType', place: 'place' },
    prepare: ({ locationType, place }) => ({
      title: place || titleForValue(LOCATION_TYPES, locationType) || 'Location',
      subtitle: titleForValue(LOCATION_TYPES, locationType),
    }),
  },
})
