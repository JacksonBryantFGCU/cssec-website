import { AddUserIcon } from '@sanity/icons/AddUser'
import { defineField, defineType } from 'sanity'

import { EXPERIENCE_LEVELS, titleForValue } from '../shared/options'

/** A position students can join a project in. */
export const openRole = defineType({
  name: 'openRole',
  title: 'Open role',
  type: 'object',
  icon: AddUserIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Role',
      type: 'string',
      description: 'For example: Frontend contributor, UI designer, API developer.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      type: 'text',
      rows: 3,
      description: 'What this person would work on.',
    }),
    defineField({
      name: 'experienceLevel',
      title: 'Experience expected',
      type: 'string',
      options: { list: EXPERIENCE_LEVELS },
      initialValue: 'any',
    }),
    defineField({
      name: 'learningOutcome',
      title: "What you'll learn",
      type: 'text',
      rows: 2,
    }),
  ],
  preview: {
    select: { title: 'title', experienceLevel: 'experienceLevel' },
    prepare: ({ title, experienceLevel }) => ({
      title,
      subtitle: titleForValue(EXPERIENCE_LEVELS, experienceLevel),
    }),
  },
})
