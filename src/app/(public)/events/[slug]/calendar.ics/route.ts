import { notFound } from 'next/navigation'

import { buildEventIcs, icsFilename } from '@/lib/calendar/ics'
import { eventLocationLabel } from '@/lib/events/view-model'
import { siteUrl } from '@/lib/site'
import { publicClient } from '@/sanity/lib/public-client'
import { EVENT_BY_SLUG_QUERY } from '@/sanity/queries/events'

/**
 * `Add to calendar`, as a download rather than a script.
 *
 * Serving the `.ics` from a route handler keeps the button a plain `<a download>`
 * — no client component, no bundle, and it works with JavaScript disabled.
 * Every value comes from the real event; the instant passes through as stored
 * UTC, so the timezone logic in `@/lib/time` stays the only copy.
 */
export async function GET(_request: Request, { params }: RouteContext<'/events/[slug]/calendar.ics'>) {
  const { slug } = await params

  // Read fresh rather than from the page cache: this route is dynamic anyway,
  // downloads are rare, and a calendar file is the one thing that must not be
  // an hour out of date if an officer just moved the meeting.
  const event = await publicClient.fetch(EVENT_BY_SLUG_QUERY, { slug }, { cache: 'no-store' })

  if (!event || !event.startsAt || event.status === 'cancelled') notFound()

  const url = `${siteUrl()}/events/${slug}`
  const online = event.location?.onlineUrl

  const ics = buildEventIcs({
    // Stable across regenerations: calendars use the UID to update rather than
    // duplicate an event a member already added.
    uid: `${event._id}@cssec.fgcu`,
    title: event.title ?? 'CSSEC event',
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    location: online ?? eventLocationLabel(event.location),
    description: [event.summary, url].filter(Boolean).join('\n\n'),
    url,
  })

  if (!ics) notFound()

  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${icsFilename(slug)}"`,
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  })
}
