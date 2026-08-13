import type { Metadata } from 'next'

import { ArchiveTable, UpcomingEventCard } from '@/components/site/event-rows'
import { FilterBar, NoMatches, type FilterGroup } from '@/components/site/filter-bar'
import { EmptyState, MonoLabel, SectionHeader } from '@/components/site/primitives'
import { getSiteLinks } from '@/components/site/site-links'
import { siteButton } from '@/components/site/button'
import {
  buildChips,
  countValues,
  hasActiveFilters,
  optionsFromCounts,
  parseFilters,
} from '@/lib/filters/params'
import { cn } from '@/lib/utils'
import { PUBLIC_REVALIDATE_SECONDS, publicClient } from '@/sanity/lib/public-client'
import { PAST_EVENTS_QUERY, UPCOMING_EVENTS_QUERY } from '@/sanity/queries/events'
import { EVENT_TYPES } from '@/sanity/schemaTypes/shared/options'

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
 * (soonest first ahead, most recent first behind). Filtering narrows both
 * halves at once and never merges them: the upcoming/archive distinction is
 * the page's whole structure, so a type or topic filter thins each section
 * rather than producing one undated list.
 */
export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [params, links, upcoming, past] = await Promise.all([
    searchParams,
    getSiteLinks(),
    publicClient.fetch(UPCOMING_EVENTS_QUERY, {}, fetchOptions),
    publicClient.fetch(PAST_EVENTS_QUERY, {}, fetchOptions),
  ])

  // Filter options are derived from both halves, so a chip offered here always
  // matches something somewhere on the page.
  const everything = [...upcoming, ...past]
  const topicOptions = optionsFromCounts(countValues(everything, (event) => event.topics))

  const active = parseFilters(params, {
    type: EVENT_TYPES.map((option) => option.value),
    topic: topicOptions.map((option) => option.value),
  })

  const matches = (event: (typeof everything)[number], skip?: 'type' | 'topic') =>
    (skip === 'type' || !active.type || event.eventType === active.type) &&
    (skip === 'topic' || !active.topic || (event.topics ?? []).includes(active.topic))

  const visibleUpcoming = upcoming.filter((event) => matches(event))
  const visiblePast = past.filter((event) => matches(event))
  const filtering = hasActiveFilters(active)
  const noMatches = filtering && visibleUpcoming.length === 0 && visiblePast.length === 0

  const groups: FilterGroup[] = [
    {
      label: 'Type',
      chips: buildChips({
        active,
        allLabel: 'All events',
        basePath: '/events',
        counts: countValues(
          everything.filter((event) => matches(event, 'type')),
          (event) => event.eventType,
        ),
        key: 'type',
        options: EVENT_TYPES,
        total: everything.filter((event) => matches(event, 'type')).length,
      }),
    },
    {
      label: 'Topic',
      chips: buildChips({
        active,
        allLabel: 'Any topic',
        basePath: '/events',
        counts: countValues(
          everything.filter((event) => matches(event, 'topic')),
          (event) => event.topics,
        ),
        key: 'topic',
        options: topicOptions,
        total: everything.filter((event) => matches(event, 'topic')).length,
      }),
    },
  ]

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

      {everything.length > 0 ? <FilterBar groups={groups} /> : null}

      {noMatches ? (
        <div className="bg-white">
          <NoMatches
            body="No session matches that combination — the archive may still be small for this topic. Clear the filters to see everything we have run."
            clearHref="/events"
            title="No meetings match those filters"
          />
        </div>
      ) : null}

      <section
        className={cn(
          'bg-white px-4 py-7 sm:px-7 sm:py-[28px_30px]',
          noMatches && 'hidden',
        )}
      >
        <MonoLabel tone="green">UPCOMING</MonoLabel>
        <div className="mt-3.5">
          {visibleUpcoming.length > 0 ? (
            <ul className="flex flex-col gap-3.5">
              {visibleUpcoming.map((event) => (
                <UpcomingEventCard event={event} key={event._id} />
              ))}
            </ul>
          ) : filtering ? (
            <p className="border-rule text-ink-soft border-t pt-3.5 text-sm leading-relaxed">
              Nothing scheduled matches those filters. The archive below may still have something.
            </p>
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

      <section
        className={cn('bg-paper px-4 py-8 sm:px-7 sm:py-[30px_40px]', noMatches && 'hidden')}
      >
        <SectionHeader
          action={
            <span className="text-ink-faint font-mono text-[11.5px]">
              {visiblePast.length} {visiblePast.length === 1 ? 'SESSION' : 'SESSIONS'}
            </span>
          }
          standfirst="Permanent, and still carrying their materials."
          title="Past meetings"
          variant="editorial"
        />
        <div className="mt-4">
          {visiblePast.length > 0 ? (
            <ArchiveTable events={visiblePast} showPresenter />
          ) : filtering ? (
            <p className="border-rule text-ink-soft border-t pt-3.5 text-sm leading-relaxed">
              No archived session matches those filters yet.
            </p>
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
