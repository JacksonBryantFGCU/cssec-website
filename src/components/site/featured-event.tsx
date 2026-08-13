import Link from 'next/link'

import { formatClubDateParts, formatClubDateLong, formatClubTimeRange } from '@/lib/time'
import {
  eventLocationLabel,
  experienceLabel,
  experienceTone,
  presenterLabel,
  type EventSummary,
} from '@/lib/events/view-model'
import { cn } from '@/lib/utils'

import { siteButton } from './button'
import { EventDateBlock, MonoLabel } from './primitives'

/**
 * The next meeting, at the top of the homepage.
 *
 * This is the single most important thing on the site — a student's first
 * question is "when do you meet and can I just turn up" — so it gets the
 * masthead, the date block, and the only two calls to action in the region.
 *
 * The whole card is not one giant link: the title anchor is the link, and the
 * two buttons are separate destinations. Nesting them inside a card-wide
 * anchor, as the prototype does with `role="link"` divs, produces invalid
 * markup and unusable keyboard behaviour.
 */
export function FeaturedEvent({ event }: { event: EventSummary }) {
  const parts = formatClubDateParts(event.startsAt)
  const timeRange = formatClubTimeRange(event.startsAt, event.endsAt)
  const location = eventLocationLabel(event.location)
  const tone = experienceTone(event)
  const href = `/events/${event.slug}`

  return (
    <article
      className={cn(
        'border-navy-edge rounded-xl border p-4 sm:p-[24px_26px]',
        'bg-linear-160 from-navy-raised to-navy',
        'flex flex-col gap-3 sm:flex-row sm:gap-[26px]',
      )}
    >
      {parts ? (
        <div className="border-navy-edge hidden shrink-0 sm:block sm:min-w-[82px] sm:border-r sm:pr-6">
          <EventDateBlock parts={parts} size="lg" tone="navy" />
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:gap-[11px]">
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <span className="text-club-green-bright rounded border border-[rgba(47,163,107,0.4)] bg-[rgba(47,163,107,0.15)] px-2 py-[3px] font-mono text-[10.5px] tracking-[0.14em]">
            NEXT MEETING
          </span>
          <span className="text-navy-soft text-[13px]">
            {/* On mobile the date block is hidden, so the date joins this line. */}
            <span className="sm:hidden">{formatClubDateLong(event.startsAt)} · </span>
            {timeRange ? `${timeRange} · ` : ''}
            {location}
          </span>
        </div>

        <h2 className="font-display text-navy-fg m-0 text-[23px] leading-[1.2] font-semibold tracking-[-0.02em] sm:text-[29px]">
          <Link className="hover:underline" href={href}>
            {event.title}
          </Link>
        </h2>

        {event.summary ? (
          <p className="text-navy-muted max-w-[560px] text-[14.5px] leading-relaxed">
            {event.summary}
          </p>
        ) : null}

        <div className="text-navy-soft flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[13px]">
          <span>Presented by {presenterLabel(event.presenters)}</span>
          <span
            className={cn(
              'font-semibold',
              tone === 'beginner' ? 'text-club-green-bright' : 'text-navy-link',
            )}
          >
            <span aria-hidden>{tone === 'beginner' ? '✓ ' : '◆ '}</span>
            {experienceLabel(event)}
          </span>
        </div>

        <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:gap-2.5">
          <Link className={siteButton({ variant: 'primary' })} href={href}>
            Event details &amp; setup
          </Link>
          <a
            className={siteButton({ variant: 'onNavy' })}
            download
            href={`${href}/calendar.ics`}
          >
            Add to calendar
          </a>
        </div>
      </div>
    </article>
  )
}

/**
 * What the masthead shows between semesters.
 *
 * An empty schedule is a normal state for a student club — summer, reading
 * week, the gap before officers post the new term — so it stays in the same
 * visual language and points at the two places where something *is* happening.
 */
export function FeaturedEventEmpty({ discordUrl }: { discordUrl: string | null }) {
  return (
    <article className="border-navy-edge bg-linear-160 from-navy-raised to-navy flex flex-col gap-3 rounded-xl border p-4 sm:p-[24px_26px]">
      <MonoLabel tone="navy">NO MEETING SCHEDULED</MonoLabel>
      <h2 className="font-display text-navy-fg m-0 text-[23px] leading-[1.2] font-semibold tracking-[-0.02em] sm:text-[29px]">
        The next semester&rsquo;s schedule is not posted yet
      </h2>
      <p className="text-navy-muted max-w-[560px] text-[14.5px] leading-relaxed">
        Officers publish meetings a few weeks ahead. Everything we have already run stays in the
        archive, and Discord is where the next date is announced first.
      </p>
      <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:gap-2.5">
        <Link className={siteButton({ variant: 'primary' })} href="/events">
          Browse past meetings
        </Link>
        {discordUrl ? (
          <a
            className={siteButton({ variant: 'onNavy' })}
            href={discordUrl}
            rel="noreferrer noopener"
            target="_blank"
          >
            Discord server ↗
          </a>
        ) : null}
      </div>
    </article>
  )
}
