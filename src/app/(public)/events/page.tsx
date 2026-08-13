import type { Metadata } from 'next'

import { ArchiveTable, UpcomingEventCard } from '@/components/site/event-rows'
import { EmptyState, MonoLabel, SectionHeader } from '@/components/site/primitives'
import { getSiteLinks } from '@/components/site/site-links'
import { siteButton } from '@/components/site/button'
import { PUBLIC_REVALIDATE_SECONDS, publicClient } from '@/sanity/lib/public-client'
import { PAST_EVENTS_QUERY, UPCOMING_EVENTS_QUERY } from '@/sanity/queries/events'

export const metadata: Metadata = {
  title: 'Events',
  description:
    'Every CSSEC meeting keeps its own page — before it, the setup instructions; after it, the slides and code. Upcoming workshops and the full archive.',
  alternates: { canonical: '/events' },
  openGraph: {
    title: 'Events — CSSEC',
    description:
      'Upcoming CSSEC meetings and the permanent archive of every workshop we have run.',
    url: '/events',
  },
}

const fetchOptions = { next: { revalidate: PUBLIC_REVALIDATE_SECONDS } }

/**
 * `/events` — upcoming meetings above the permanent archive.
 *
 * Both lists come straight from Sanity, ordered by the queries themselves
 * (soonest first ahead, most recent first behind). Filtering by topic is a
 * later phase; the design's chip row is deliberately not stubbed in here,
 * because a filter that does not filter is worse than no filter.
 */
export default async function EventsPage() {
  const [links, upcoming, past] = await Promise.all([
    getSiteLinks(),
    publicClient.fetch(UPCOMING_EVENTS_QUERY, {}, fetchOptions),
    publicClient.fetch(PAST_EVENTS_QUERY, {}, fetchOptions),
  ])

  return (
    <>
      <div className="bg-navy border-navy-line text-navy-fg border-b px-4 py-6 sm:px-7 sm:py-[30px_28px]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-[30px]">
          <div className="flex max-w-[640px] flex-col gap-2 sm:gap-[9px]">
            <h1 className="font-display m-0 text-[27px] font-semibold tracking-[-0.025em] sm:text-[34px]">
              Events
            </h1>
            <p className="text-navy-muted text-[13.5px] leading-relaxed sm:text-[14.5px]">
              {links.meetingInfo
                ? `${links.meetingInfo} `
                : 'We meet weekly during the semester. '}
              Every meeting keeps its own page — before it, the setup instructions; after it, the
              slides and code.
            </p>
          </div>
          <span className="hidden flex-1 sm:block" />
          {links.discordUrl ? (
            <a
              className={siteButton({ variant: 'primary' })}
              href={links.discordUrl}
              rel="noreferrer noopener"
              target="_blank"
            >
              Get reminders in Discord ↗
            </a>
          ) : null}
        </div>
      </div>

      <section className="bg-white px-4 py-7 sm:px-7 sm:py-[28px_30px]">
        <MonoLabel tone="green">UPCOMING</MonoLabel>
        <div className="mt-3.5">
          {upcoming.length > 0 ? (
            <ul className="flex flex-col gap-3.5">
              {upcoming.map((event) => (
                <UpcomingEventCard event={event} key={event._id} />
              ))}
            </ul>
          ) : (
            <EmptyState
              actions={
                links.discordUrl ? (
                  <a
                    className={siteButton({ variant: 'outline', size: 'sm' })}
                    href={links.discordUrl}
                    rel="noreferrer noopener"
                    target="_blank"
                  >
                    Suggest a topic ↗
                  </a>
                ) : null
              }
              body="Officers publish the semester's meetings a few weeks ahead. Most of our sessions started as a request from a member — ask for one in Discord."
              kicker="NOTHING SCHEDULED"
              title="No meetings on the calendar yet"
            />
          )}
        </div>
      </section>

      <section className="bg-paper px-4 py-8 sm:px-7 sm:py-[30px_40px]">
        <SectionHeader
          action={
            <span className="text-ink-faint font-mono text-[11.5px]">
              {past.length} {past.length === 1 ? 'SESSION' : 'SESSIONS'}
            </span>
          }
          standfirst="Permanent, and still carrying their materials."
          title="Past meetings"
          variant="editorial"
        />
        <div className="mt-4">
          {past.length > 0 ? (
            <ArchiveTable events={past} showPresenter />
          ) : (
            <EmptyState
              body="Once a meeting has happened its page becomes the permanent record — summary, slides, recording and repositories all stay attached to it."
              kicker="ARCHIVE IS EMPTY"
              title="Nothing has been archived yet"
            />
          )}
        </div>
      </section>
    </>
  )
}
