import Link from 'next/link'
import { notFound } from 'next/navigation'

import { requireOfficer } from '@/auth/require-officer'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { buttonVariants } from '@/components/ui/button'
import { eventToFormValues } from '@/lib/events/form-values'
import { cn } from '@/lib/utils'
import { getAdminClient } from '@/sanity/lib/admin-client'
import { ADMIN_EVENT_BY_ID_QUERY, ADMIN_PEOPLE_OPTIONS_QUERY } from '@/sanity/queries/admin'

import { updateEvent } from '../../actions'
import { EventForm } from '../../event-form'

export const metadata = { title: 'Edit event' }

/**
 * Editing is keyed by Sanity document id, not slug.
 *
 * The slug is derived from the title and changes when the title does, so an
 * id-based URL is the one that keeps working — and a stale bookmark cannot
 * silently open the wrong event.
 */
export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireOfficer({ capability: 'content:write', returnTo: `/admin/events/${id}/edit` })

  const sanity = getAdminClient()

  const [event, people] = await Promise.all([
    sanity.fetch(ADMIN_EVENT_BY_ID_QUERY, { id }),
    sanity.fetch(ADMIN_PEOPLE_OPTIONS_QUERY),
  ])

  // Covers a deleted event and a mistyped id alike.
  if (!event) notFound()

  return (
    <>
      <AdminPageHeader
        actions={
          <Link
            className={cn(buttonVariants({ variant: 'outline' }))}
            href={`/admin/events/${event._id}/remove`}
          >
            Cancel or delete
          </Link>
        }
        description={event.title ?? undefined}
        title="Edit event"
      />
      <EventForm
        action={updateEvent}
        cancelHref="/admin/events"
        defaults={eventToFormValues(event)}
        eventId={event._id}
        people={people.filter((person): person is { _id: string; name: string } => Boolean(person.name))}
        submitLabel="Save changes"
      />
    </>
  )
}
