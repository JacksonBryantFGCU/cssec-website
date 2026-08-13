import type { Metadata } from 'next'

import { siteButton } from '@/components/site/button'
import { Faq } from '@/components/site/faq'
import { OfficerBoard } from '@/components/site/officer-board'
import { MonoLabel, SectionHeader, SectionLink } from '@/components/site/primitives'
import { getSiteLinks } from '@/components/site/site-links'
import { SITE_AFFILIATION } from '@/lib/site'
import { PUBLIC_REVALIDATE_SECONDS, publicClient } from '@/sanity/lib/public-client'
import { CURRENT_OFFICERS_QUERY } from '@/sanity/queries/people'

export const metadata: Metadata = {
  title: 'About & join',
  description:
    'CSSEC is the Computer Science & Software Engineering Club at Florida Gulf Coast University. Free, open to every major, and there is no application.',
  alternates: { canonical: '/about' },
}

const fetchOptions = { next: { revalidate: PUBLIC_REVALIDATE_SECONDS } }

/** The three things the club actually does, in the approved design's order. */
const PROGRAMMES = [
  {
    kicker: 'WORKSHOPS',
    title: 'One thing, taught properly, every week',
    body: 'Hands-on sessions on the things courses skip: Git, deployment, interviews, containers. Every session’s slides and code stay in the library afterwards.',
    href: '/events',
    label: 'See what we have run →',
  },
  {
    kicker: 'PROJECTS',
    title: 'Real teams, mentors attached',
    body: 'Teams have a lead and a mentor each, and roles are labelled by the experience they actually need. Beginners are the point, not an exception.',
    href: '/projects',
    label: 'Open roles →',
  },
  {
    kicker: 'OPPORTUNITIES',
    title: 'Vetted, local, and on time',
    body: 'Internships and research roles that hire from FGCU, posted with deadlines while they are still open. Officers will read your application before you send it.',
    href: '/opportunities',
    label: 'Opportunity board →',
  },
]

/** The four surfaces the club runs on, and who each one is for. */
const PLATFORMS = [
  {
    name: 'This website',
    who: 'Everyone',
    what: 'Discover, reference, and learn. Events, resources, projects and opportunities live here permanently.',
  },
  {
    name: 'Discord',
    who: 'Everyone',
    what: 'Discuss, ask questions, and socialize. Announcements arrive here first.',
  },
  {
    name: 'GitHub',
    who: 'Project contributors',
    what: 'Build and collaborate. Repositories, issues, and code review.',
  },
  {
    name: 'Microsoft Teams',
    who: 'Officers only',
    what: 'Planning, budgets, and internal documents.',
  },
]

/**
 * `/about` — what the club is, how to join, who runs it, and the questions
 * people ask before their first meeting.
 *
 * `#join` is the anchor every "Join CSSEC" control on the site resolves to —
 * the header, the mobile drawer, the footer and both homepage calls to action
 * — so the join section keeps that id whatever else moves around it. There is
 * deliberately no separate `/join` route; the approved design has none.
 */
export default async function AboutPage() {
  const [links, officers] = await Promise.all([
    getSiteLinks(),
    publicClient.fetch(CURRENT_OFFICERS_QUERY, {}, fetchOptions),
  ])

  return (
    <>
      <div className="bg-navy border-navy-line text-navy-fg border-b px-4 py-6 sm:px-7 sm:py-[30px]">
        <div className="flex max-w-[720px] flex-col gap-2 sm:gap-3">
          <MonoLabel tone="navy">{SITE_AFFILIATION.toUpperCase()}</MonoLabel>
          <h1 className="font-display m-0 text-[27px] font-semibold tracking-[-0.025em] sm:text-[34px]">
            {links.clubName}
          </h1>
          <p className="text-navy-body font-serif text-[18px] leading-[1.5] sm:text-[20px]">
            {links.description ??
              'A place to learn things the courses do not cover, with people at the same stage as you. We meet weekly, keep every workshop here, and build real software in mentored teams.'}
          </p>
        </div>
      </div>

      <section className="border-rule border-b bg-white px-4 py-8 sm:px-7 sm:py-10" id="join">
        <SectionHeader kicker="HOW TO JOIN" title="Free, and there is no application" />
        <div className="mt-4 grid max-w-[900px] gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <p className="text-ink-body text-[15px] leading-[1.7]">
              Turn up to a meeting. That is the whole process — there is no fee, no application,
              and no requirement to have written code before. Members come from across the
              university, not only from Computing.
            </p>
            {links.meetingInfo ? (
              <p className="text-ink-strong text-[15px] leading-[1.7] font-semibold">
                {links.meetingInfo}
              </p>
            ) : null}
            <p className="text-ink-body text-[15px] leading-[1.7]">
              Coming mid-semester is normal, and so is coming once. Everything we run stays in the
              archive so you can catch up on anything you missed.
            </p>
            <div className="mt-2 flex flex-col gap-2.5 sm:flex-row">
              {links.discordUrl ? (
                <a
                  className={siteButton({ variant: 'primary' })}
                  href={links.discordUrl}
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  Join the Discord ↗
                </a>
              ) : null}
              {links.contactEmail ? (
                <a
                  className={siteButton({ variant: 'outline' })}
                  href={`mailto:${links.contactEmail}`}
                >
                  Email an officer
                </a>
              ) : null}
            </div>
          </div>

          <ul className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-1">
            {PROGRAMMES.map((programme) => (
              <li
                className="border-rule bg-paper flex flex-col gap-1.5 rounded-[10px] border p-4 sm:p-[18px_20px]"
                key={programme.kicker}
              >
                <MonoLabel tone="green" className="text-[10px]">
                  {programme.kicker}
                </MonoLabel>
                <p className="font-display text-ink text-[16px] font-semibold">
                  {programme.title}
                </p>
                <p className="text-ink-soft text-[13.5px] leading-relaxed">{programme.body}</p>
                <p className="pt-0.5">
                  <SectionLink href={programme.href}>{programme.label}</SectionLink>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-rule bg-paper border-b px-4 py-8 sm:px-7 sm:py-10">
        <SectionHeader
          standfirst="Four tools, each with one job. Most members only need the first two."
          title="Where everything lives"
          variant="editorial"
        />
        <dl className="mt-4 grid max-w-[900px] gap-3.5 sm:grid-cols-2">
          {PLATFORMS.map((platform) => (
            <div
              className="border-rule flex flex-col gap-1 rounded-[10px] border bg-white p-4 sm:p-[18px_20px]"
              key={platform.name}
            >
              <dt className="text-ink flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 text-[14.5px] font-semibold">
                {platform.name}
                <span className="text-ink-label font-mono text-[10px] tracking-[0.12em] uppercase">
                  {platform.who}
                </span>
              </dt>
              <dd className="text-ink-soft m-0 text-[13.5px] leading-relaxed">{platform.what}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="bg-white px-4 py-8 sm:px-7 sm:py-10">
        <div className="grid max-w-[1000px] gap-8 lg:grid-cols-2 lg:gap-11">
          <div className="flex flex-col">
            <SectionHeader title="Who runs it" variant="compact" />
            <OfficerBoard advisor={links.advisor} officers={officers} />
          </div>

          <div className="flex flex-col">
            <SectionHeader title="Questions people actually ask" variant="compact" />
            <Faq />

            <div className="border-club-border bg-club-surface-soft mt-5 flex flex-col gap-1.5 rounded-[10px] border p-4 sm:p-[18px_20px]">
              <p className="text-club-dark text-[14.5px] font-semibold">Still have a question?</p>
              <p className="text-ink-body text-[13.5px] leading-relaxed">
                Ask in Discord
                {links.contactEmail ? (
                  <>
                    , or email the officers at{' '}
                    <a
                      className="text-club-link font-semibold hover:underline"
                      href={`mailto:${links.contactEmail}`}
                    >
                      {links.contactEmail}
                    </a>
                  </>
                ) : null}
                . We answer within a day in term time.
              </p>
              {links.discordUrl ? (
                <p className="pt-1.5">
                  <a
                    className={siteButton({ variant: 'outline', size: 'sm' })}
                    href={links.discordUrl}
                    rel="noreferrer noopener"
                    target="_blank"
                  >
                    Ask in Discord ↗
                  </a>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
