import { Briefcase, CalendarDays, FolderGit2, Library } from 'lucide-react'
import Link from 'next/link'

import { requireOfficer } from '@/auth/require-officer'
import { AdminPageHeader, AdminSection } from '@/components/admin/admin-page-header'
import { AdminStat } from '@/components/admin/admin-stat'
import { AdvancedCmsCard } from '@/components/admin/advanced-cms'
import { EmptyState } from '@/components/admin/empty-state'
import { MetaBadge } from '@/components/admin/status-badge'
import { buttonVariants } from '@/components/ui/button'
import { formatCalendarDate, formatClubDate, formatClubDateTime } from '@/lib/time'
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
      detail: `Deadline ${formatCalendarDate(opportunity.deadline)} — closes within a week.`,
      href: `/admin/opportunities/${opportunity._id}/edit`,
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
        kicker="Overview"
        title="Dashboard"
      />

      <div className="flex flex-col gap-8 px-4 py-6 sm:px-6">
        <AdminSection id="stats" title="At a glance">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStat
              hint={`${stats.pastEvents} in the archive`}
              href="/admin/events"
              icon={CalendarDays}
              label="Upcoming events"
              value={stats.upcomingEvents}
            />
            <AdminStat
              hint={`${stats.recruitingProjects} recruiting`}
              href="/admin/projects"
              icon={FolderGit2}
              label="Active projects"
              value={stats.activeProjects}
            />
            <AdminStat
              href="/admin/opportunities"
              icon={Briefcase}
              label="Open opportunities"
              value={stats.openOpportunities}
            />
            <AdminStat
              hint={`${stats.people} people`}
              href="/admin/resources"
              icon={Library}
              label="Resources"
              value={stats.publishedResources}
            />
          </div>
        </AdminSection>

        {/* One line, four verbs: the things an officer signs in to do. Adding
            more would make the dashboard a second navigation. */}
        <AdminSection id="quick-actions" title="Add something">
          <div className="flex flex-wrap gap-2">
            {[
              { href: '/admin/events/new', label: 'New event' },
              { href: '/admin/projects/new', label: 'New project' },
              { href: '/admin/resources/new', label: 'Add resource' },
              { href: '/admin/opportunities/new', label: 'Post opportunity' },
            ].map((action) => (
              <Link
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                href={action.href}
                key={action.href}
              >
                {action.label}
              </Link>
            ))}
          </div>
        </AdminSection>

        <AdminSection
          action={
            <Link
              className="text-club-link hover:text-club-link-hover text-[13px] font-semibold hover:underline"
              href="/admin/events"
            >
              All events →
            </Link>
          }
          id="upcoming"
          title="Upcoming events"
        >
          {upcoming.length === 0 ? (
            <EmptyState
              action={
                <Link className={cn(buttonVariants({ size: 'sm' }))} href="/admin/events/new">
                  Create your first event
                </Link>
              }
              description="Once an event is scheduled it will show up here and on the public site."
              kicker="Nothing scheduled"
              title="No events on the calendar"
            />
          ) : (
            <ul className="border-rule-card divide-rule divide-y rounded-lg border bg-white">
              {upcoming.map((event) => (
                <li
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5"
                  key={event._id}
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <Link
                      className="text-ink text-[14.5px] font-semibold underline-offset-4 hover:underline"
                      href={`/admin/events/${event._id}/edit`}
                    >
                      {event.title ?? 'Untitled event'}
                    </Link>
                    <p className="text-ink-faint font-mono text-[11.5px]">
                      {formatClubDateTime(event.startsAt)}
                      {event.location?.place ? ` · ${event.location.place}` : ''}
                    </p>
                  </div>
                  <MetaBadge>{titleForValue(EVENT_TYPES, event.eventType) ?? 'Event'}</MetaBadge>
                </li>
              ))}
            </ul>
          )}
        </AdminSection>

        <AdminSection id="attention" title="Needs attention">
          {needsAttention.length === 0 ? (
            <p className="border-rule-dashed bg-paper-warm text-ink-soft rounded-lg border border-dashed px-4 py-5 text-center text-[13px]">
              <span aria-hidden="true" className="text-club-link">
                ✓
              </span>{' '}
              Nothing needs attention right now.
            </p>
          ) : (
            <ul className="border-rule-card divide-rule divide-y rounded-lg border bg-white">
              {needsAttention.map((item) => (
                <li
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5"
                  key={item.id}
                >
                  <div className="flex min-w-0 gap-2.5">
                    {/* Words carry the meaning; the mark is decoration. */}
                    <span aria-hidden="true" className="text-urgent mt-px font-mono text-[13px]">
                      !
                    </span>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-ink text-[14.5px] font-semibold">{item.label}</span>
                      <span className="text-ink-soft text-[12.5px]">{item.detail}</span>
                    </div>
                  </div>
                  <Link
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                    href={item.href}
                  >
                    Fix<span className="sr-only"> — {item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AdminSection>

        <AdvancedCmsCard>
          Everything routine is managed here. Studio is for the rest: long rich-text descriptions,
          screenshot galleries, share images and repairing an unusual reference.
        </AdvancedCmsCard>
      </div>
    </>
  )
}
