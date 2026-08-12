import { PlugIcon } from '@sanity/icons/Plug'
import { defineField, defineType } from 'sanity'

/**
 * Diagnostic singleton — not website content.
 *
 * The `/admin` "write check" action updates this one document to prove the
 * secure mutation path end to end (Clerk authorization → Zod → server-only
 * write client → Content Lake). It is safe to delete at any time; the action
 * recreates it. Nothing on the public site reads it.
 */
export const adminWriteCheck = defineType({
  name: 'adminWriteCheck',
  title: 'Admin write check (diagnostic)',
  type: 'document',
  icon: PlugIcon,
  // Written only by the server action; editing by hand serves no purpose.
  readOnly: true,
  fields: [
    defineField({
      name: 'lastCheckedAt',
      title: 'Last checked',
      type: 'datetime',
    }),
    defineField({
      name: 'lastCheckedBy',
      title: 'Checked by',
      type: 'string',
      description: 'Clerk user id of the officer who ran the check.',
    }),
    defineField({
      name: 'note',
      title: 'Note',
      type: 'string',
    }),
  ],
  preview: {
    select: { subtitle: 'lastCheckedAt', note: 'note' },
    prepare: ({ subtitle, note }) => ({
      title: note || 'Admin write check',
      subtitle: subtitle ? `Last checked ${new Date(subtitle).toLocaleString('en-US')}` : 'Never run',
    }),
  },
})
