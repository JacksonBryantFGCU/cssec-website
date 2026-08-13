import { requireOfficer } from '@/auth/require-officer'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { newResourceValues } from '@/lib/resources/form-values'
import { formatClubDate } from '@/lib/time'
import { getAdminClient } from '@/sanity/lib/admin-client'
import {
  ADMIN_EVENT_OPTIONS_QUERY,
  ADMIN_PEOPLE_OPTIONS_QUERY,
  ADMIN_RESOURCE_OPTIONS_QUERY,
} from '@/sanity/queries/admin'

import { createResource } from '../actions'
import { ResourceForm } from '../resource-form'

export const metadata = { title: 'Add resource' }

export default async function NewResourcePage() {
  await requireOfficer({ capability: 'content:write', returnTo: '/admin/resources/new' })

  const sanity = getAdminClient()

  const [events, people, related] = await Promise.all([
    sanity.fetch(ADMIN_EVENT_OPTIONS_QUERY),
    sanity.fetch(ADMIN_PEOPLE_OPTIONS_QUERY),
    // Nothing to exclude yet — the resource does not exist.
    sanity.fetch(ADMIN_RESOURCE_OPTIONS_QUERY, { excludeId: '' }),
  ])

  return (
    <>
      <AdminPageHeader
        description="It appears in the resource library, and on its event's page, as soon as you save."
        kicker="Resources"
        title="Add resource"
      />
      <ResourceForm
        action={createResource}
        cancelHref="/admin/resources"
        defaults={newResourceValues()}
        events={events.flatMap((event) =>
          event.title
            ? [{ _id: event._id, label: event.title, hint: formatClubDate(event.startsAt) }]
            : [],
        )}
        people={people.flatMap((person) =>
          person.name ? [{ _id: person._id, label: person.name }] : [],
        )}
        relatedOptions={related.flatMap((resource) =>
          resource.title ? [{ _id: resource._id, label: resource.title }] : [],
        )}
        submitLabel="Add resource"
      />
    </>
  )
}
