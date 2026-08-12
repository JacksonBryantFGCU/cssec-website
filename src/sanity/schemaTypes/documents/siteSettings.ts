import { CogIcon } from '@sanity/icons/Cog'
import { defineArrayMember, defineField, defineType } from 'sanity'

/**
 * Singleton holding global club information.
 *
 * The singleton is enforced in `src/sanity/structure.ts`, which pins editing to
 * the fixed document id `siteSettings` and hides the type from the "create new"
 * flows. Content only — layout and design live in code.
 */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  icon: CogIcon,
  groups: [
    { name: 'club', title: 'Club', default: true },
    { name: 'contact', title: 'Contact & links' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'clubName',
      title: 'Full club name',
      type: 'string',
      group: 'club',
      initialValue: 'Computer Science & Software Engineering Club',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'shortName',
      title: 'Short name',
      type: 'string',
      group: 'club',
      initialValue: 'CSSEC',
      validation: (rule) => rule.required().max(12),
    }),
    defineField({
      name: 'description',
      title: 'Short description',
      type: 'text',
      rows: 3,
      group: 'club',
      description: 'One or two sentences used in the footer and as the default SEO description.',
      validation: (rule) => rule.required().max(300),
    }),
    defineField({
      name: 'meetingInfo',
      title: 'Regular meeting info',
      type: 'string',
      group: 'club',
      description: 'For example: Wednesdays at 5:00 PM in Holmes Hall 214.',
    }),
    defineField({
      name: 'facultyAdvisor',
      title: 'Faculty advisor',
      type: 'reference',
      to: [{ type: 'person' }],
      group: 'club',
    }),
    defineField({
      name: 'footerNote',
      title: 'Footer note',
      type: 'text',
      rows: 2,
      group: 'club',
      description: 'Optional line shown in the site footer (affiliation, disclaimer, etc.).',
    }),
    defineField({
      name: 'contactEmail',
      title: 'Contact email',
      type: 'string',
      group: 'contact',
      validation: (rule) => rule.required().email(),
    }),
    defineField({
      name: 'discordUrl',
      title: 'Discord invite URL',
      type: 'url',
      group: 'contact',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'githubUrl',
      title: 'GitHub organization URL',
      type: 'url',
      group: 'contact',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'teamsUrl',
      title: 'Microsoft Teams URL',
      type: 'url',
      group: 'contact',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'socialLinks',
      title: 'Other links',
      type: 'array',
      group: 'contact',
      of: [defineArrayMember({ type: 'socialLink' })],
    }),
    defineField({
      name: 'seo',
      title: 'Default SEO',
      type: 'seo',
      group: 'seo',
      description: 'Used for pages that do not define their own metadata.',
    }),
  ],
  preview: {
    select: { title: 'clubName', subtitle: 'shortName' },
  },
})
