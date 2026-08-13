import Link from 'next/link'

import { requireOfficer } from '@/auth/require-officer'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { EmptyState } from '@/components/admin/empty-state'
import { MetaBadge, StatusBadge } from '@/components/admin/status-badge'
import { buttonVariants } from '@/components/ui/button'
import { formatClubDateTime } from '@/lib/time'
import { cn } from '@/lib/utils'
import { getAdminClient } from '@/sanity/lib/admin-client'
import { ADMIN_EVENTS_QUERY } from '@/sanity/queries/admin'
import { EVENT_TYPES, LOCATION_TYPES, titleForValue } from '@/sanity/schemaTypes/shared/options'

export const metadata = { title: 'Events' }

const FILTERS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'all', label: 'All' },
] as const

type Filter = (typeof FILTERS)[number]['value']

const SAVED_MESSAGES: Record<string, string> = {
  created: 'Event created.',
  updated: 'Changes saved.',
  cancelled: 'Event cancelled. It stays on record but no longer shows as upcoming.',
  deleted: 'Event deleted.',
}

function parseFilter(value: string | string[] | undefined): Filter {
  return value === 'past' || value === 'all' ? value : 'upcoming'
}

/**
 * The events index.
 *
 * Filtering is done in the page rather than in GROQ: the club runs on the order
 * of dozens of events a year, so one query and a partition is simpler, cheaper
 * and keeps the counts on the filter tabs honest.
 */
export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  // Before any query: see the note in the dashboard page — layouts and pages
  // render concurrently, so the layout's check alone would not stop the fetch.
  await requireOfficer({ capability: 'content:write', returnTo: '/admin/events' })

  const params = await searchParams
  const filter = parseFilter(params.filter)
  const saved = typeof params.saved === 'string' ? SAVED_MESSAGES[params.saved] : undefined
  const savedTitle = typeof params.title === 'string' ? params.title : undefined

  const events = await getAdminClient().fetch(ADMIN_EVENTS_QUERY)

  const upcoming = events.filter((event) => !event.isPast)
  const past = events.filter((event) => event.isPast)
  const counts = { upcoming: upcoming.length, past: past.length, all: events.length }
  const visible = filter === 'upcoming' ? upcoming : filter === 'past' ? past : events

  return (
    <>
      <AdminPageHeader
        actions={
          <Link className={cn(buttonVariants())} href="/admin/events/new">
            Create event
          </Link>
        }
        description="Workshops, meetings and everything else on the club calendar."
        title="Events"
      />

      <div className="flex flex-col gap-4 px-6 py-6">
        {saved ? (
          <p
            className="bg-secondary text-secondary-foreground rounded-md px-4 py-3 text-sm font-medium"
            role="status"
          >
            {saved}
            {savedTitle ? ` — “${savedTitle}”` : ''}
          </p>
        ) : null}

        <nav aria-label="Filter events" className="flex flex-wrap gap-2">
          {FILTERS.map((option) => {
            const active = option.value === filter

            return (
              <Link
                aria-current={active ? 'true' : undefined}
                className={cn(
                  buttonVariants({ variant: active ? 'secondary' : 'ghost', size: 'sm' }),
                  'gap-1.5',
                )}
                href={`/admin/events?filter=${option.value}`}
                key={option.value}
              >
                {option.label}
                <span className="text-muted-foreground tabular-nums">{counts[option.value]}</span>
              </Link>
            )
          })}
        </nav>

        {events.length === 0 ? (
          <EmptyState
            action={
              <Link className={cn(buttonVariants())} href="/admin/events/new">
                Create your first event
              </Link>
            }
            description="Events created here appear on the club calendar and in the Advanced CMS."
            title="No events yet."
          />
        ) : visible.length === 0 ? (
          <EmptyState
            description={
              filter === 'upcoming'
                ? 'Nothing is scheduled. Past events are still available under the Past filter.'
                : 'Nothing here yet.'
            }
            title={filter === 'upcoming' ? 'No upcoming events.' : 'No past events.'}
          />
        ) : (
          <ul className="divide-y rounded-lg border">
            {visible.map((event) => (
              <li className="flex flex-wrap items-start justify-between gap-4 p-4" key={event._id}>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      className="font-medium underline-offset-4 hover:underline"
                      href={`/admin/events/${event._id}/edit`}
                    >
                      {event.title ?? 'Untitled event'}
                    </Link>
                    <StatusBadge status={event.status} />
                    {event.featured ? <MetaBadge>Featured</MetaBadge> : null}
                  </div>

                  <p className="text-muted-foreground text-sm">
                    {formatClubDateTime(event.startsAt)}
                    {event.location?.place ? ` · ${event.location.place}` : ''}
                    {event.location?.locationType && event.location.locationType !== 'inPerson'
                      ? ` · ${titleForValue(LOCATION_TYPES, event.location.locationType)}`
                      : ''}
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <MetaBadge>{titleForValue(EVENT_TYPES, event.eventType) ?? 'Event'}</MetaBadge>
                    {event.resourceCount > 0 ? (
                      <MetaBadge>
                        {event.resourceCount} {event.resourceCount === 1 ? 'resource' : 'resources'}
                      </MetaBadge>
                    ) : null}
                    {event.presenterCount > 0 ? (
                      <MetaBadge>
                        {event.presenterCount}{' '}
                        {event.presenterCount === 1 ? 'presenter' : 'presenters'}
                      </MetaBadge>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                    href={`/admin/events/${event._id}/edit`}
                  >
                    Edit<span className="sr-only"> {event.title ?? 'event'}</span>
                  </Link>
                  <Link
                    className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                    href={`/admin/events/${event._id}/remove`}
                  >
                    Remove<span className="sr-only"> {event.title ?? 'event'}</span>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="text-muted-foreground text-xs">
          Public event pages are not built yet, so there is nothing to preview from here. Events are
          already live in the{' '}
          <Link className="underline underline-offset-4" href="/studio" rel="noreferrer" target="_blank">
            Advanced CMS
          </Link>
          .
        </p>
      </div>
    </>
  )
}
