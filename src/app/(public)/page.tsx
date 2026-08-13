import type { Metadata } from 'next'
import Link from 'next/link'

import { siteButton } from '@/components/site/button'
import { ArchiveTable, UpcomingEventRow } from '@/components/site/event-rows'
import { FeaturedEvent, FeaturedEventEmpty } from '@/components/site/featured-event'
import { OpportunityPreview } from '@/components/site/opportunity-preview'
import { EmptyState, MonoLabel, SectionHeader, SectionLink } from '@/components/site/primitives'
import { ProjectPreview } from '@/components/site/project-preview'
import { getSiteLinks } from '@/components/site/site-links'
import { splitFeaturedEvent } from '@/lib/events/view-model'
import { PUBLIC_REVALIDATE_SECONDS, publicClient } from '@/sanity/lib/public-client'
import { PAST_EVENTS_QUERY, UPCOMING_EVENTS_QUERY } from '@/sanity/queries/events'
import { ACTIVE_OPPORTUNITIES_QUERY } from '@/sanity/queries/opportunities'
import { HOME_PROJECTS_QUERY } from '@/sanity/queries/projects'

export const metadata: Metadata = {
  // The root layout's default title is already the homepage's, so it is not
  // repeated here — only the canonical needs stating.
  alternates: { canonical: '/' },
}

const fetchOptions = { next: { revalidate: PUBLIC_REVALIDATE_SECONDS } }

/**
 * The homepage.
 *
 * Section order is the approved design's, top to bottom: the next meeting and
 * the club's own introduction, then projects recruiting, then the workshop
 * archive, then upcoming events beside open deadlines.
 *
 * Every section reads live Sanity data and renders a designed empty state when
 * there is none — no fixtures reach production.
 */
export default async function HomePage() {
  const [links, upcoming, past, projects, opportunities] = await Promise.all([
    getSiteLinks(),
    publicClient.fetch(UPCOMING_EVENTS_QUERY, {}, fetchOptions),
    publicClient.fetch(PAST_EVENTS_QUERY, {}, fetchOptions),
    publicClient.fetch(HOME_PROJECTS_QUERY, {}, fetchOptions),
    publicClient.fetch(ACTIVE_OPPORTUNITIES_QUERY, {}, fetchOptions),
  ])

  const { featured, rest } = splitFeaturedEvent(upcoming)
  const archive = past.slice(0, 4)
  const comingUp = rest.slice(0, 3)
  const deadlines = opportunities.slice(0, 3)

  return (
    <>
      {/* 1 & 2 — the next meeting, and what CSSEC is. */}
      <section className="bg-navy-deep masthead-grid text-navy-fg px-4 py-5 sm:px-7 sm:py-[34px_36px]">
        <h1 className="sr-only">
          CSSEC — Computer Science &amp; Software Engineering Club at Florida Gulf Coast University
        </h1>
        <div className="grid gap-5 lg:grid-cols-[1fr_372px] lg:gap-7">
          {featured ? (
            <FeaturedEvent event={featured} />
          ) : (
            <FeaturedEventEmpty discordUrl={links.discordUrl} />
          )}

          <div className="flex flex-col justify-center gap-3.5 lg:gap-4">
            <p className="text-navy-bright font-serif text-lg leading-[1.4] lg:text-[26px] lg:leading-[1.32]">
              {links.description ??
                'A student-run club for Computer Science and Software Engineering majors at FGCU. We meet weekly, keep every workshop here, and build real software in mentored teams.'}
            </p>
            {links.meetingInfo ? (
              <p className="text-navy-soft text-[13.5px]">{links.meetingInfo}</p>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-2.5">
              <Link className={siteButton({ variant: 'primary' })} href="/about#join">
                Join CSSEC
              </Link>
              {links.discordUrl ? (
                <a
                  className={siteButton({ variant: 'onNavy' })}
                  href={links.discordUrl}
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  Discord server ↗
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile-only quick navigation, as in the 390px reference. */}
      <nav
        aria-label="Sections"
        className="bg-rule border-rule grid grid-cols-2 gap-px border-b lg:hidden"
      >
        {[
          { href: '/events', label: 'Events', hint: 'Meetings and archive' },
          { href: '/projects', label: 'Projects', hint: 'Build with a team' },
          { href: '/resources', label: 'Resources', hint: 'Workshop archive' },
          { href: '/opportunities', label: 'Opportunities', hint: 'Internships and deadlines' },
        ].map((item) => (
          <Link
            className="flex min-h-16 flex-col justify-center gap-[3px] bg-white p-4"
            href={item.href}
            key={item.href}
          >
            <span className="text-ink text-[15px] font-bold">{item.label}</span>
            <span className="text-ink-soft text-[12.5px]">{item.hint}</span>
          </Link>
        ))}
      </nav>

      {/* 3 — projects looking for contributors. */}
      <section className="border-rule border-b bg-white px-4 py-8 sm:px-7 sm:py-[38px_34px]">
        <SectionHeader
          action={<SectionLink href="/projects">All projects →</SectionLink>}
          kicker="PROJECTS LOOKING FOR PEOPLE"
          title="Build something with a team"
        />
        <p className="text-ink-muted mt-4 mb-[22px] max-w-[660px] text-[14.5px] leading-relaxed">
          You do not need to know the stack before you join. Every team has a lead and a mentor,
          and roles are labelled by how much experience they actually assume.
        </p>

        {projects.length > 0 ? (
          <ul className="flex flex-col gap-3.5">
            {projects.map((project) => (
              <ProjectPreview key={project._id} project={project} />
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
                  Pitch a project ↗
                </a>
              ) : null
            }
            body="The project programme starts as soon as a team forms. If there is something you actually want to build, say so — that is how every one of ours began."
            kicker="NO TEAMS RECRUITING"
            title="No projects are recruiting right now"
          />
        )}
      </section>

      {/* 4 — the workshop archive. Links into the library that now exists. */}
      <section className="border-rule bg-paper border-b px-4 py-8 sm:px-7 sm:py-[36px_32px]">
        <SectionHeader
          action={<SectionLink href="/resources">Resource library →</SectionLink>}
          standfirst="Every meeting we have run, with its slides and code still attached."
          title="The workshop archive"
          variant="editorial"
        />
        <div className="mt-4">
          {archive.length > 0 ? (
            <ArchiveTable events={archive} />
          ) : (
            <EmptyState
              body="Once a session has happened, its slides, recordings and repositories are attached to its page and stay there permanently."
              kicker="ARCHIVE IS EMPTY"
              title="No sessions have been archived yet"
            />
          )}
        </div>
      </section>

      {/* 5 & 6 — upcoming events beside open deadlines. */}
      <section className="bg-paper grid gap-8 px-4 py-8 sm:px-7 sm:py-[36px_40px] lg:grid-cols-2 lg:gap-11">
        <div className="flex flex-col gap-3">
          <SectionHeader
            action={<SectionLink href="/events">All events →</SectionLink>}
            title="Coming up"
            variant="compact"
          />
          {comingUp.length > 0 ? (
            <ul>
              {comingUp.map((event) => (
                <UpcomingEventRow event={event} key={event._id} />
              ))}
            </ul>
          ) : (
            <p className="border-rule text-ink-soft border-t pt-3.5 text-sm leading-relaxed">
              {featured
                ? 'Nothing else is on the calendar yet — the meeting above is the next one.'
                : 'No meetings are scheduled yet. The archive has everything we have already run.'}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <SectionHeader
            action={<SectionLink href="/opportunities">Opportunity board →</SectionLink>}
            title="Open deadlines"
            variant="compact"
          />
          {deadlines.length > 0 ? (
            <ul>
              {deadlines.map((opportunity) => (
                <OpportunityPreview key={opportunity._id} opportunity={opportunity} />
              ))}
            </ul>
          ) : (
            <p className="border-rule text-ink-soft border-t pt-3.5 text-sm leading-relaxed">
              No internships, scholarships or hackathons are open right now. Officers post them
              here as they land.
            </p>
          )}
        </div>
      </section>

      {/* Mobile-only join band, as in the 390px reference. */}
      <section className="bg-club-green-deep px-4 py-6 text-white lg:hidden">
        <MonoLabel className="text-club-green-bright">JOIN CSSEC</MonoLabel>
        <p className="font-display mt-2 text-2xl font-bold tracking-[-0.02em]">
          Free, and there is no application
        </p>
        <p className="mt-2.5 text-sm leading-relaxed text-[#D3EFE0]">
          Open to every major. Show up to a meeting, or start in Discord if that is easier.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Link
            className="text-club-dark rounded-[10px] bg-white py-3.5 text-center text-[15px] font-bold"
            href="/about#join"
          >
            How to join
          </Link>
          {links.discordUrl ? (
            <a
              className="rounded-[10px] border border-white/45 py-3 text-center text-[15px] font-semibold"
              href={links.discordUrl}
              rel="noreferrer noopener"
              target="_blank"
            >
              Discord server ↗
            </a>
          ) : null}
        </div>
      </section>
    </>
  )
}
