import Link from 'next/link'

import {
  eventLocationLabel,
  experienceLabel,
  experienceTone,
  materialsLabel,
  presenterLabel,
  type EventSummary,
} from '@/lib/events/view-model'
import { formatClubDateLong, formatClubDateParts, formatClubTimeRange } from '@/lib/time'
import { EVENT_TYPES, titleForValue } from '@/sanity/schemaTypes/shared/options'
import { cn } from '@/lib/utils'

import { EventDateBlock, LevelBadge, MonoLabel } from './primitives'

export type ArchiveEvent = EventSummary & {
  topics?: string[] | null
  resourceCount?: number | null
}

/** "Git / GitHub" — the topic column. Falls back to the event's own type. */
function topicLabel(event: ArchiveEvent): string {
  const topic = event.topics?.[0]?.trim()
  if (topic) return topic

  return titleForValue(EVENT_TYPES, event.eventType) ?? 'Session'
}

/**
 * The workshop archive.
 *
 * A ruled table, not a card grid — the reference's first stated layout rule is
 * "rows over cards" for lists of comparable things, and a table is also what
 * makes ten sessions scannable by date.
 *
 * It collapses to stacked rows below `md` rather than scrolling sideways: a
 * four-column table at 390px is unusable either way, and the mobile reference
 * shows the stacked form.
 */
export function ArchiveTable({
  events,
  showPresenter = false,
}: {
  events: ArchiveEvent[]
  showPresenter?: boolean
}) {
  const columns = showPresenter
    ? 'md:grid-cols-[88px_1fr_160px_150px_190px]'
    : 'md:grid-cols-[88px_1fr_170px_220px]'

  return (
    <div>
      <div
        aria-hidden
        className={cn(
          'border-ink text-ink-label hidden gap-5 border-b pb-[9px] font-mono text-[10px] tracking-[0.14em] md:grid',
          columns,
        )}
      >
        <div>DATE</div>
        <div>SESSION</div>
        <div>TOPIC</div>
        {showPresenter ? <div>PRESENTER</div> : null}
        <div>MATERIALS</div>
      </div>

      <ul>
        {events.map((event) => {
          const parts = formatClubDateParts(event.startsAt)
          const materials = materialsLabel(event.resourceCount ?? 0, true)

          return (
            <li
              className={cn(
                'border-rule border-b md:grid md:items-center md:gap-5',
                'hover:bg-white',
                columns,
              )}
              key={event._id}
            >
              {/* One link per row: the whole row is the target, and its
                  accessible name is the session title, not the date. */}
              <Link
                className={cn(
                  'flex min-h-11 flex-col gap-1.5 py-3.5 md:contents',
                  'focus-visible:outline-offset-[-2px]',
                )}
                href={`/events/${event.slug}`}
              >
                <span className="text-ink-faint order-1 font-mono text-[11px] md:text-[12px]">
                  <span className="md:hidden">{formatClubDateLong(event.startsAt)}</span>
                  <span className="hidden md:inline">
                    {parts ? `${parts.month} ${parts.day}` : 'TBA'}
                  </span>
                </span>
                <span className="text-ink order-2 text-[14.5px] font-semibold md:text-[15px]">
                  {event.title}
                </span>
                <span className="text-ink-muted order-3 text-[12.5px] md:text-[13.5px]">
                  {topicLabel(event)}
                  {showPresenter ? (
                    <span className="md:hidden"> · {presenterLabel(event.presenters)}</span>
                  ) : null}
                </span>
                {showPresenter ? (
                  <span className="text-ink-muted order-4 hidden text-[13.5px] md:block">
                    {presenterLabel(event.presenters)}
                  </span>
                ) : null}
                <span className="text-club-link order-5 text-[13px] font-semibold md:text-[13.5px]">
                  {materials} <span aria-hidden>→</span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/**
 * The compact "Coming up" row.
 *
 * Date, title, and one metadata line — this list sits beside the opportunities
 * column and its job is only to prove that meetings keep happening.
 */
export function UpcomingEventRow({ event }: { event: EventSummary }) {
  const parts = formatClubDateParts(event.startsAt)
  const timeRange = formatClubTimeRange(event.startsAt, event.endsAt)

  return (
    <li className="border-rule border-t">
      <Link
        className="flex min-h-11 items-baseline gap-4 py-3.5 hover:bg-white"
        href={`/events/${event.slug}`}
      >
        <span className="text-club-link min-w-[54px] shrink-0 font-mono text-[12px]">
          {parts ? `${parts.month} ${parts.day}` : 'TBA'}
        </span>
        <span className="flex flex-col gap-[3px]">
          <span className="text-ink text-[15px] font-semibold">{event.title}</span>
          <span className="text-ink-soft text-[13px]">
            {[eventLocationLabel(event.location), timeRange, experienceLabel(event)]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </span>
      </Link>
    </li>
  )
}

/**
 * The full upcoming-event card used on `/events`.
 *
 * Three columns on desktop — date block, substance, logistics — and a single
 * stack on mobile, matching the reference at both widths.
 */
export function UpcomingEventCard({ event }: { event: EventSummary }) {
  const parts = formatClubDateParts(event.startsAt)
  const timeRange = formatClubTimeRange(event.startsAt, event.endsAt)
  const tone = experienceTone(event)

  return (
    <li className="border-rule-card bg-paper-card hover:border-club-border rounded-[10px] border transition-colors">
      <div className="flex flex-col gap-3.5 p-4 sm:grid sm:grid-cols-[78px_1fr] sm:gap-[26px] sm:p-[20px_24px] lg:grid-cols-[78px_1fr_240px]">
        {parts ? (
          <div className="border-rule hidden sm:block sm:border-r sm:pr-5">
            <EventDateBlock parts={parts} />
          </div>
        ) : null}

        <div className="flex min-w-0 flex-col gap-[7px]">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="font-display text-ink m-0 text-[17px] font-semibold sm:text-[20px]">
              <Link className="hover:underline" href={`/events/${event.slug}`}>
                {event.title}
              </Link>
            </h3>
            <span className="border-rule-strong text-ink-muted rounded border px-[7px] py-0.5 font-mono text-[10px] tracking-[0.1em]">
              {topicLabel(event)}
            </span>
          </div>

          {/* The date is hidden as a block on mobile, so it is stated here. */}
          <p className="text-ink-soft text-[13px] sm:hidden">
            {[formatClubDateLong(event.startsAt), timeRange, eventLocationLabel(event.location)]
              .filter(Boolean)
              .join(' · ')}
          </p>

          {event.summary ? (
            <p className="text-ink-body max-w-[560px] text-sm leading-relaxed">{event.summary}</p>
          ) : null}

          <LevelBadge className="self-start" label={experienceLabel(event)} tone={tone} />
        </div>

        <div className="text-ink-body hidden text-[13.5px] leading-relaxed lg:block">
          {timeRange ? <div>{timeRange}</div> : null}
          <div>{eventLocationLabel(event.location)}</div>
          <div className="text-ink-soft">{presenterLabel(event.presenters)}</div>
        </div>
      </div>
    </li>
  )
}

/** The "also coming up" / "related meetings" sidebar list. */
export function EventMiniList({
  label,
  events,
}: {
  label: string
  events: Array<Pick<EventSummary, '_id' | 'title' | 'slug' | 'startsAt'>>
}) {
  if (events.length === 0) return null

  return (
    <div className="flex flex-col gap-[11px]">
      <MonoLabel>{label}</MonoLabel>
      <ul>
        {events.map((event) => {
          const parts = formatClubDateParts(event.startsAt)

          return (
            <li className="border-rule border-b" key={event._id}>
              <Link
                className="flex min-h-11 items-baseline gap-3 pb-[11px]"
                href={`/events/${event.slug}`}
              >
                <span className="text-club-link min-w-[50px] shrink-0 font-mono text-[11px]">
                  {parts ? `${parts.month} ${parts.day}` : 'TBA'}
                </span>
                <span className="text-ink text-sm font-semibold">{event.title}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
