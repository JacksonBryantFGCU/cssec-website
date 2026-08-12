import { LinkIcon } from '@sanity/icons/Link'
import { defineField, defineType } from 'sanity'

import { SOCIAL_PLATFORMS, titleForValue } from '../shared/options'

export const socialLink = defineType({
  name: 'socialLink',
  title: 'Social link',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({
      name: 'platform',
      type: 'string',
      options: { list: SOCIAL_PLATFORMS },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'label',
      type: 'string',
      description: 'Only needed for "Other", or to override the platform name.',
    }),
    defineField({
      name: 'url',
      type: 'url',
      validation: (rule) =>
        rule.required().uri({ scheme: ['http', 'https'] }),
    }),
  ],
  preview: {
    select: { platform: 'platform', label: 'label', url: 'url' },
    prepare: ({ platform, label, url }) => ({
      title: label || titleForValue(SOCIAL_PLATFORMS, platform) || 'Social link',
      subtitle: url,
    }),
  },
})
