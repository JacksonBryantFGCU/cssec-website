import { requireOfficer } from '@/auth/require-officer'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { NEW_EVENT_VALUES } from '@/lib/events/form-values'
import { getAdminClient } from '@/sanity/lib/admin-client'
import { ADMIN_PEOPLE_OPTIONS_QUERY } from '@/sanity/queries/admin'

import { createEvent } from '../actions'
import { EventForm } from '../event-form'

export const metadata = { title: 'New event' }

export default async function NewEventPage() {
  await requireOfficer({ capability: 'content:write', returnTo: '/admin/events/new' })

  const people = await getAdminClient().fetch(ADMIN_PEOPLE_OPTIONS_QUERY)

  return (
    <>
      <AdminPageHeader
        description="It goes live as soon as you save."
        title="Create event"
      />
      <EventForm
        action={createEvent}
        cancelHref="/admin/events"
        defaults={NEW_EVENT_VALUES}
        people={people.filter((person): person is { _id: string; name: string } => Boolean(person.name))}
        submitLabel="Create event"
      />
    </>
  )
}
