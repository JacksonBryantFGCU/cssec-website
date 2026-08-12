import { UserIcon } from '@sanity/icons/User'
import { defineField, defineType } from 'sanity'

/**
 * One document per human. People are referenced from officer terms, events
 * (presenters), projects (leads, mentors, contributors) and resources (authors)
 * so nobody has to be entered twice.
 */
export const person = defineType({
  name: 'person',
  title: 'Person',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      description: 'Used if this person ever gets their own page.',
      options: { source: 'name', maxLength: 96 },
    }),
    defineField({
      name: 'photo',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          description: 'Describe the photo for screen readers.',
        }),
      ],
    }),
    defineField({
      name: 'shortBio',
      title: 'Short bio',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.max(500).warning('Keep bios short — around 400 characters.'),
    }),
    defineField({
      name: 'email',
      type: 'string',
      description: 'Only add this if the person is happy to be contacted publicly.',
      validation: (rule) => rule.email(),
    }),
    defineField({
      name: 'githubUrl',
      title: 'GitHub URL',
      type: 'url',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'linkedinUrl',
      title: 'LinkedIn URL',
      type: 'url',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'websiteUrl',
      title: 'Personal website / portfolio',
      type: 'url',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'shortBio', media: 'photo' },
  },
})
