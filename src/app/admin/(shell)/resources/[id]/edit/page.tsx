import Link from 'next/link'
import { notFound } from 'next/navigation'

import { requireOfficer } from '@/auth/require-officer'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { buttonVariants } from '@/components/ui/button'
import { resourceToFormValues } from '@/lib/resources/form-values'
import { formatClubDate } from '@/lib/time'
import { cn } from '@/lib/utils'
import { getAdminClient } from '@/sanity/lib/admin-client'
import {
  ADMIN_EVENT_OPTIONS_QUERY,
  ADMIN_PEOPLE_OPTIONS_QUERY,
  ADMIN_RESOURCE_BY_ID_QUERY,
  ADMIN_RESOURCE_OPTIONS_QUERY,
} from '@/sanity/queries/admin'

import { updateResource } from '../../actions'
import { ResourceForm } from '../../resource-form'

export const metadata = { title: 'Edit resource' }

export default async function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireOfficer({ capability: 'content:write', returnTo: `/admin/resources/${id}/edit` })

  const sanity = getAdminClient()

  const [resource, events, people, related] = await Promise.all([
    sanity.fetch(ADMIN_RESOURCE_BY_ID_QUERY, { id }),
    sanity.fetch(ADMIN_EVENT_OPTIONS_QUERY),
    sanity.fetch(ADMIN_PEOPLE_OPTIONS_QUERY),
    // Excluded so a resource cannot be offered as related to itself.
    sanity.fetch(ADMIN_RESOURCE_OPTIONS_QUERY, { excludeId: id }),
  ])

  if (!resource) notFound()

  return (
    <>
      <AdminPageHeader
        actions={
          <>
            {resource.slug ? (
              <a
                className={cn(buttonVariants({ variant: 'ghost' }))}
                href={`/resources/${resource.slug}`}
                rel="noreferrer"
                target="_blank"
              >
                View<span aria-hidden="true"> ↗</span>
                <span className="sr-only"> on the website (opens in a new tab)</span>
              </a>
            ) : null}
            <Link
              className={cn(buttonVariants({ variant: 'outline' }))}
              href={`/admin/resources/${resource._id}/remove`}
            >
              Delete
            </Link>
          </>
        }
        description={resource.title ?? undefined}
        kicker="Resources"
        title="Edit resource"
      />
      <ResourceForm
        action={updateResource}
        cancelHref="/admin/resources"
        currentFile={
          resource.fileUrl
            ? { label: resource.fileName || 'Attached file', href: resource.fileUrl }
            : null
        }
        defaults={resourceToFormValues(resource)}
        events={events.flatMap((event) =>
          event.title
            ? [{ _id: event._id, label: event.title, hint: formatClubDate(event.startsAt) }]
            : [],
        )}
        people={people.flatMap((person) =>
          person.name ? [{ _id: person._id, label: person.name }] : [],
        )}
        relatedOptions={related.flatMap((item) =>
          item.title ? [{ _id: item._id, label: item.title }] : [],
        )}
        resourceId={resource._id}
        submitLabel="Save changes"
      />
    </>
  )
}
