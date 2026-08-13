import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { siteButton } from '@/components/site/button'
import { EventMiniList } from '@/components/site/event-rows'
import { MaterialsList } from '@/components/site/materials-list'
import { LevelBadge, MonoLabel, TechTag } from '@/components/site/primitives'
import { Prose } from '@/components/site/prose'
import { getSiteLinks } from '@/components/site/site-links'
import {
  eventLocationLabel,
  experienceLabel,
  experienceTone,
  isPastEvent,
  presenterLabel,
} from '@/lib/events/view-model'
import { formatClubDateLong, formatClubTimeRange } from '@/lib/time'
import { PUBLIC_REVALIDATE_SECONDS, publicClient } from '@/sanity/lib/public-client'
import {
  EVENT_BY_SLUG_QUERY,
  EVENT_SLUGS_QUERY,
  UPCOMING_EVENTS_QUERY,
} from '@/sanity/queries/events'

const fetchOptions = { next: { revalidate: PUBLIC_REVALIDATE_SECONDS } }

/** One page per published event, prerendered from the existing slug query. */
export async function generateStaticParams() {
  const slugs = await publicClient.fetch(EVENT_SLUGS_QUERY, {}, fetchOptions)

  return slugs
    .map((entry) => entry.slug)
    .filter((slug): slug is string => Boolean(slug))
    .map((slug) => ({ slug }))
}

async function getEvent(slug: string) {
  return publicClient.fetch(EVENT_BY_SLUG_QUERY, { slug }, fetchOptions)
}

export async function generateMetadata({
  params,
}: PageProps<'/events/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const event = await getEvent(slug)

  // A missing event gets no invented metadata; the page itself will 404.
  if (!event) return { title: 'Event not found' }

  const title = event.seo?.metaTitle ?? event.title ?? 'Event'
  const description =
    event.seo?.metaDescription ??
    event.summary ??
    `A CSSEC meeting at Florida Gulf Coast University.`

  return {
    title,
    description,
    alternates: { canonical: `/events/${slug}` },
    openGraph: {
      title: `${title} — CSSEC`,
      description,
      url: `/events/${slug}`,
      type: 'article',
    },
  }
}

/**
 * `/events/[slug]` — one permanent page per meeting.
 *
 * The same route serves both halves of an event's life, which is the whole
 * point of the design: before it happens the page is the setup instructions,
 * and afterwards the same URL becomes the archive entry carrying the slides,
 * recording and repositories. The link a member saved never stops working.
 *
 * Unpublished or missing events `notFound()` — no Sanity detail leaks out.
 */
export default async function EventPage({ params }: PageProps<'/events/[slug]'>) {
  const { slug } = await params
  const [event, links, upcoming] = await Promise.all([
    getEvent(slug),
    getSiteLinks(),
    publicClient.fetch(UPCOMING_EVENTS_QUERY, {}, fetchOptions),
  ])

  if (!event || event.status === 'cancelled') notFound()

  const past = isPastEvent(event)
  const dateLabel = formatClubDateLong(event.startsAt)
  const timeRange = formatClubTimeRange(event.startsAt, event.endsAt)
  const location = eventLocationLabel(event.location)
  const presenters = presenterLabel(event.presenters)
  const tone = experienceTone(event)
  const materials = event.resources ?? []
  const alsoComing = upcoming.filter((other) => other.slug !== slug).slice(0, 3)
  const communityUrl = event.communityUrl ?? links.discordUrl

  // The archive masthead promotes the two things people come back for. Both
  // are the *first* matching material rather than a separate field, so they
  // cannot disagree with the table below them, and each is omitted entirely
  // when the session has nothing of that kind.
  const slides = materials.find((material) => material.fileUrl)
  const repository = materials.find((material) => material.githubUrl)

  return (
    <article>
      {/* Masthead — navy in both states, with different badges and actions. */}
      <div className="bg-navy border-navy-line text-navy-fg border-b px-4 py-5 sm:px-7 sm:py-[22px_30px]">
        <nav aria-label="Breadcrumb" className="text-navy-faint mb-4 text-[13px]">
          <Link className="hover:text-white hover:underline" href="/events">
            Events
          </Link>
          <span aria-hidden> · </span>
          <span className="text-navy-body">{event.title}</span>
        </nav>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:gap-9">
          <div className="flex max-w-[720px] flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {past ? (
                <span className="border-navy-border text-navy-muted rounded border bg-white/[0.07] px-2 py-[3px] font-mono text-[10px] tracking-[0.14em]">
                  <span aria-hidden>✓ </span>PAST MEETING
                  {materials.length > 0 ? ' · MATERIALS AVAILABLE' : ''}
                </span>
              ) : (
                <span className="text-club-green-bright rounded border border-[rgba(47,163,107,0.4)] bg-[rgba(47,163,107,0.15)] px-2 py-[3px] font-mono text-[10px] tracking-[0.14em]">
                  UPCOMING
                </span>
              )}
              <span className="text-navy-faint font-mono text-[11.5px]">{dateLabel}</span>
            </div>

            <h1 className="font-display m-0 text-[28px] leading-[1.14] font-semibold tracking-[-0.028em] sm:text-[38px]">
              {event.title}
            </h1>

            {event.summary ? (
              <p
                className={
                  past
                    ? 'text-navy-muted text-[15px] leading-relaxed'
                    : 'text-navy-body max-w-[640px] font-serif text-[18px] leading-[1.5] sm:text-[20px]'
                }
              >
                {event.summary}
              </p>
            ) : null}

            {past ? (
              <p className="text-navy-muted text-[15px] leading-relaxed">
                Presented by {presenters} · {location}
                {timeRange ? ` · ${timeRange}` : ''}
              </p>
            ) : null}
          </div>

          <span className="hidden flex-1 lg:block" />

          <div className="flex flex-col gap-2.5 lg:w-[330px]">
            {!past ? (
              <a
                className={siteButton({ variant: 'primary', size: 'block' })}
                download
                href={`/events/${slug}/calendar.ics`}
              >
                Add to calendar
              </a>
            ) : null}
            {past && slides?.fileUrl ? (
              <a
                className={siteButton({ variant: 'primary', size: 'block' })}
                download
                href={slides.fileUrl}
              >
                Download slides
              </a>
            ) : null}
            {past && repository?.githubUrl ? (
              <a
                className={siteButton({ variant: 'onNavy', size: 'block' })}
                href={repository.githubUrl}
                rel="noreferrer noopener"
                target="_blank"
              >
                Open repository ↗
              </a>
            ) : null}
            {!past && event.registrationUrl ? (
              <a
                className={siteButton({ variant: 'onNavy', size: 'block' })}
                href={event.registrationUrl}
                rel="noreferrer noopener"
                target="_blank"
              >
                Register ↗
              </a>
            ) : null}
            {communityUrl ? (
              <a
                className={siteButton({ variant: 'discord', size: 'block' })}
                href={communityUrl}
                rel="noreferrer noopener"
                target="_blank"
              >
                {past ? 'Open the discussion ↗' : 'Ask a question in Discord ↗'}
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid bg-white lg:grid-cols-[1fr_356px]">
        {/* Main column */}
        <div className="border-rule flex flex-col gap-7 px-4 py-7 sm:px-[34px] sm:py-[30px_40px] lg:border-r">
          {past && event.recap ? (
            <p className="text-ink-strong font-serif text-[18px] leading-[1.5] sm:text-[20px]">
              {event.recap}
            </p>
          ) : null}

          {Array.isArray(event.description) && event.description.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="font-display text-ink m-0 text-[19px] font-semibold">
                {past ? 'What we covered' : 'What we will do'}
              </h2>
              <Prose value={event.description} />
            </section>
          ) : null}

          {/* Preparation — upcoming only. */}
          {!past && Array.isArray(event.setupInstructions) && event.setupInstructions.length > 0 ? (
            <section className="bg-club-surface-soft border-club-border flex flex-col gap-3 rounded-[10px] border p-4 sm:p-[20px_22px]">
              <h2 className="font-display text-club-dark m-0 text-[17px] font-semibold sm:text-[18px]">
                Before you come — setup
              </h2>
              <Prose value={event.setupInstructions} />
              {communityUrl ? (
                <p className="border-club-rule text-ink-body border-t pt-[11px] text-[13.5px] leading-relaxed">
                  Could not get it working? Come a little early and an officer will sit with you,
                  or{' '}
                  <a
                    className="text-club-link font-semibold hover:underline"
                    href={communityUrl}
                    rel="noreferrer noopener"
                    target="_blank"
                  >
                    ask in Discord ↗
                  </a>
                  .
                </p>
              ) : null}
            </section>
          ) : null}

          {!past && event.prerequisites?.length ? (
            <section className="flex flex-col gap-3">
              <h2 className="font-display text-ink m-0 text-[19px] font-semibold">
                What to bring
              </h2>
              <ul className="flex flex-col gap-2">
                {event.prerequisites.map((item, index) => (
                  <li className="text-ink-body flex gap-3 text-[14.5px] leading-relaxed" key={item}>
                    <span
                      aria-hidden
                      className="text-club-link min-w-5 font-mono text-[12px]"
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Materials — the archive half. */}
          {past ? (
            <section className="flex flex-col">
              <div className="border-ink flex items-baseline gap-3.5 border-b pb-2.5">
                <h2 className="font-serif text-ink m-0 text-[22px] font-normal sm:text-[25px]">
                  Materials from this session
                </h2>
                <span className="flex-1" />
                <MonoLabel className="text-[10px]">PERMANENT</MonoLabel>
              </div>
              {materials.length > 0 ? (
                <MaterialsList materials={materials} />
              ) : (
                <p className="text-ink-soft py-5 text-sm leading-relaxed">
                  Nothing has been attached to this session yet. Slides, recordings and
                  repositories are added to this page as officers upload them — the link you have
                  is the permanent one.
                </p>
              )}
            </section>
          ) : (
            <div className="border-rule-dashed bg-paper flex flex-col gap-2 rounded-[10px] border border-dashed p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-[18px_20px]">
              <MonoLabel className="min-w-[112px] text-[10px]">AFTER THE EVENT</MonoLabel>
              <p className="text-ink-body text-[13.5px] leading-relaxed">
                Slides, the recording and any repositories get attached to this same page — the
                link you have now is the permanent one.
              </p>
            </div>
          )}
        </div>

        {/* Rail */}
        <aside className="bg-paper flex flex-col gap-6 px-4 py-7 sm:px-7 sm:py-[30px_40px]">
          <div className="border-rule flex flex-col gap-3 rounded-[10px] border bg-white p-[18px_20px]">
            <MonoLabel className="text-[10px]">AT A GLANCE</MonoLabel>
            <dl className="flex flex-col gap-[9px] text-sm">
              {[
                { term: 'Date', value: dateLabel },
                { term: 'Time', value: timeRange || 'To be announced' },
                { term: 'Location', value: location },
                { term: 'Presenter', value: presenters },
              ].map((row) => (
                <div className="flex gap-3" key={row.term}>
                  <dt className="text-ink-label min-w-[82px]">{row.term}</dt>
                  <dd className="text-ink-strong m-0">{row.value}</dd>
                </div>
              ))}
              <div className="flex gap-3">
                <dt className="text-ink-label min-w-[82px]">Level</dt>
                <dd className="m-0">
                  <LevelBadge label={experienceLabel(event)} tone={tone} />
                </dd>
              </div>
            </dl>
          </div>

          {event.topics?.length ? (
            <div className="flex flex-col gap-2.5">
              <MonoLabel className="text-[10px]">TOPICS</MonoLabel>
              <ul className="flex flex-wrap gap-[7px]">
                {event.topics.map((topic) => (
                  <li key={topic}>
                    <TechTag>{topic}</TechTag>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {past ? (
            <a
              className={siteButton({ variant: 'outline', size: 'block' })}
              download
              href={`/events/${slug}/calendar.ics`}
            >
              Add to calendar
            </a>
          ) : null}

          <EventMiniList
            events={alsoComing}
            label={past ? 'COMING UP NEXT' : 'ALSO COMING UP'}
          />
        </aside>
      </div>
    </article>
  )
}
