import Link from 'next/link'

import { requireOfficer } from '@/auth/require-officer'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStat } from '@/components/admin/admin-stat'
import { EmptyState } from '@/components/admin/empty-state'
import { MetaBadge } from '@/components/admin/status-badge'
import { buttonVariants } from '@/components/ui/button'
import { formatClubDate, formatClubDateTime } from '@/lib/time'
import { cn } from '@/lib/utils'
import { getAdminClient } from '@/sanity/lib/admin-client'
import {
  ADMIN_DASHBOARD_STATS_QUERY,
  ADMIN_NEEDS_ATTENTION_QUERY,
  ADMIN_UPCOMING_EVENTS_QUERY,
} from '@/sanity/queries/admin'
import { EVENT_TYPES, titleForValue } from '@/sanity/schemaTypes/shared/options'

export const metadata = { title: 'Dashboard' }

type AttentionItem = { id: string; label: string; detail: string; href: string }

/**
 * The officer landing screen.
 *
 * Everything here is real Sanity data. Counts are computed in GROQ, so the
 * tiles cost one query rather than fetching documents to measure them, and the
 * three queries run concurrently.
 */
export default async function AdminDashboardPage() {
  // Not redundant with the layout: Next renders layouts and pages concurrently,
  // so a page that only relied on the layout would still run its queries — and
  // serialize the result into the redirect response — for a signed-out caller.
  // Authorizing here first means nothing is fetched or rendered.
  await requireOfficer()

  const sanity = getAdminClient()

  const [stats, upcoming, attention] = await Promise.all([
    sanity.fetch(ADMIN_DASHBOARD_STATS_QUERY),
    sanity.fetch(ADMIN_UPCOMING_EVENTS_QUERY),
    sanity.fetch(ADMIN_NEEDS_ATTENTION_QUERY),
  ])

  // Derived only from facts already stored on the documents — no invented
  // scoring, and every row links to the screen that fixes it.
  const needsAttention: AttentionItem[] = [
    ...attention.eventsMissingSummary.map((event) => ({
      id: `summary-${event._id}`,
      label: event.title ?? 'Untitled event',
      detail: 'Has no summary, so it will look empty on the website.',
      href: `/admin/events/${event._id}/edit`,
    })),
    ...attention.eventsMissingLocation.map((event) => ({
      id: `location-${event._id}`,
      label: event.title ?? 'Untitled event',
      detail: 'Has no location set.',
      href: `/admin/events/${event._id}/edit`,
    })),
    ...attention.eventsToClose.map((event) => ({
      id: `close-${event._id}`,
      label: event.title ?? 'Untitled event',
      detail: `Happened on ${formatClubDate(event.startsAt)} but is still marked scheduled.`,
      href: `/admin/events/${event._id}/edit`,
    })),
    ...attention.opportunitiesClosingSoon.map((opportunity) => ({
      id: `deadline-${opportunity._id}`,
      label: [opportunity.title, opportunity.organization].filter(Boolean).join(' · '),
      detail: `Deadline ${formatClubDate(opportunity.deadline)} — closes within a week.`,
      href: '/studio',
    })),
  ]

  return (
    <>
      <AdminPageHeader
        actions={
          <Link className={cn(buttonVariants())} href="/admin/events/new">
            New event
          </Link>
        }
        description="Everything below is live content from Sanity."
        title="Dashboard"
      />

      <div className="flex flex-col gap-10 px-6 py-6">
        <section aria-labelledby="stats-heading" className="flex flex-col gap-3">
          <h2 className="text-lg font-medium" id="stats-heading">
            At a glance
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStat
              hint={`${stats.pastEvents} in the archive`}
              href="/admin/events"
              label="Upcoming events"
              value={stats.upcomingEvents}
            />
            <AdminStat
              hint={`${stats.recruitingProjects} recruiting`}
              label="Active projects"
              value={stats.activeProjects}
            />
            <AdminStat label="Open opportunities" value={stats.openOpportunities} />
            <AdminStat hint={`${stats.people} people`} label="Resources" value={stats.publishedResources} />
          </div>
        </section>

        <section aria-labelledby="upcoming-heading" className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-medium" id="upcoming-heading">
              Upcoming events
            </h2>
            <Link className="text-sm underline underline-offset-4" href="/admin/events">
              All events
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <EmptyState
              action={
                <Link className={cn(buttonVariants({ size: 'sm' }))} href="/admin/events/new">
                  Create your first event
                </Link>
              }
              description="Once an event is scheduled it will show up here and on the public site."
              title="Nothing scheduled yet."
            />
          ) : (
            <ul className="divide-y rounded-lg border">
              {upcoming.map((event) => (
                <li key={event._id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 flex-col gap-1">
                    <Link
                      className="font-medium underline-offset-4 hover:underline"
                      href={`/admin/events/${event._id}/edit`}
                    >
                      {event.title ?? 'Untitled event'}
                    </Link>
                    <p className="text-muted-foreground text-sm">
                      {formatClubDateTime(event.startsAt)}
                      {event.location?.place ? ` · ${event.location.place}` : ''}
                    </p>
                  </div>
                  <MetaBadge>{titleForValue(EVENT_TYPES, event.eventType) ?? 'Event'}</MetaBadge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="attention-heading" className="flex flex-col gap-3">
          <h2 className="text-lg font-medium" id="attention-heading">
            Needs attention
          </h2>

          {needsAttention.length === 0 ? (
            <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
              Nothing needs attention right now.
            </p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {needsAttention.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 flex-col">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-muted-foreground text-sm">{item.detail}</span>
                  </div>
                  <Link
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                    href={item.href}
                  >
                    Fix
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
