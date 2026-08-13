import Link from 'next/link'
import { notFound } from 'next/navigation'

import { requireOfficer } from '@/auth/require-officer'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { buttonVariants } from '@/components/ui/button'
import { eventRemovalPolicy } from '@/lib/events/delete-policy'
import { formatClubDateTime } from '@/lib/time'
import { cn } from '@/lib/utils'
import { getAdminClient } from '@/sanity/lib/admin-client'
import { ADMIN_EVENT_BY_ID_QUERY } from '@/sanity/queries/admin'

import { RemoveEventForms } from './remove-forms'

export const metadata = { title: 'Remove event' }

/**
 * The one place an event can be cancelled or deleted.
 *
 * Removal is never a single click from a list: it gets its own screen that
 * names the event, says what each option does, and offers the safe option
 * first. The policy shown here is re-checked inside the actions themselves —
 * this screen is an explanation, not a gate.
 */
export default async function RemoveEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireOfficer({ capability: 'content:write', returnTo: `/admin/events/${id}/remove` })

  const event = await getAdminClient().fetch(ADMIN_EVENT_BY_ID_QUERY, { id })

  if (!event) notFound()

  const policy = eventRemovalPolicy({
    status: event.status,
    startsAt: event.startsAt,
    referenceCount: event.referenceCount,
  })

  return (
    <>
      <AdminPageHeader
        description="Cancelling keeps the record. Deleting does not."
        title="Remove event"
      />

      <div className="flex max-w-2xl flex-col gap-6 px-6 py-6">
        <section className="flex flex-col gap-2 rounded-lg border p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-medium">{event.title ?? 'Untitled event'}</h2>
            <StatusBadge status={event.status} />
          </div>
          <p className="text-muted-foreground text-sm">{formatClubDateTime(event.startsAt)}</p>
          {event.referenceCount > 0 ? (
            <p className="text-muted-foreground text-sm">
              {event.referenceCount} other {event.referenceCount === 1 ? 'document links' : 'documents link'}{' '}
              to this event.
            </p>
          ) : null}
        </section>

        <RemoveEventForms
          canCancel={policy.canCancel}
          canHardDelete={policy.canHardDelete}
          blockedReason={policy.blockedReason}
          eventId={event._id}
          eventTitle={event.title ?? 'Untitled event'}
        />

        <Link className={cn(buttonVariants({ variant: 'ghost' }), 'self-start')} href="/admin/events">
          Back to events
        </Link>
      </div>
    </>
  )
}
