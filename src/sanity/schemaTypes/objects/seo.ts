import { SearchIcon } from '@sanity/icons/Search'
import { defineField, defineType } from 'sanity'

/**
 * Optional search/social metadata overrides. When empty the frontend falls back
 * to the document's own title and summary, so officers can ignore this section.
 */
export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  icon: SearchIcon,
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: 'metaTitle',
      title: 'Meta title',
      type: 'string',
      description: 'Overrides the page title in search results and browser tabs.',
      validation: (rule) => rule.max(60).warning('Titles over 60 characters get truncated.'),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta description',
      type: 'text',
      rows: 3,
      validation: (rule) =>
        rule.max(160).warning('Descriptions over 160 characters get truncated.'),
    }),
    defineField({
      name: 'shareImage',
      title: 'Share image',
      type: 'image',
      description: 'Shown when the page is linked in Discord, LinkedIn, etc.',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
        }),
      ],
    }),
  ],
})
