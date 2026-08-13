import type { Metadata } from 'next'

import { siteButton } from '@/components/site/button'
import { MonoLabel, SectionHeader } from '@/components/site/primitives'
import { getSiteLinks } from '@/components/site/site-links'
import { SITE_AFFILIATION } from '@/lib/site'

export const metadata: Metadata = {
  title: 'About & join',
  description:
    'CSSEC is the Computer Science & Software Engineering Club at Florida Gulf Coast University. Free, open to every major, and there is no application.',
  alternates: { canonical: '/about' },
}

/**
 * `/about` — what the club is and how to join.
 *
 * The "Join CSSEC" button in the header, the footer and the mobile drawer all
 * land here, so this page is real rather than a placeholder: the officer
 * roster and the full FAQ come with the rest of the About build, but the
 * question the button implies is answered here today.
 */
export default async function AboutPage() {
  const links = await getSiteLinks()

  const platforms = [
    {
      name: 'This website',
      who: 'Everyone',
      what: 'Discover, reference, and learn. Events, resources and projects live here permanently.',
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
              'A student-run club for Computer Science and Software Engineering majors. We meet weekly, keep every workshop here, and build real software in mentored teams.'}
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

          <div className="border-rule bg-paper flex flex-col gap-3 rounded-[10px] border p-4 sm:p-[20px_22px]">
            <MonoLabel className="text-[10px]">WHERE THE CLUB LIVES</MonoLabel>
            <dl className="flex flex-col gap-3.5">
              {platforms.map((platform) => (
                <div className="flex flex-col gap-1" key={platform.name}>
                  <dt className="text-ink text-[14.5px] font-semibold">
                    {platform.name}{' '}
                    <span className="text-ink-label font-mono text-[10px] tracking-[0.12em] uppercase">
                      {platform.who}
                    </span>
                  </dt>
                  <dd className="text-ink-soft m-0 text-[13.5px] leading-relaxed">
                    {platform.what}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="bg-paper px-4 py-8 sm:px-7 sm:py-10">
        <SectionHeader
          standfirst="Officers, the full FAQ, and the club's history are coming with the rest of this page."
          title="Who runs CSSEC"
          variant="editorial"
        />
        {links.advisorName ? (
          <p className="text-ink-body mt-4 max-w-[720px] text-[15px] leading-[1.7]">
            The club is advised by {links.advisorName} and run by an elected student officer team.
          </p>
        ) : null}
      </section>
    </>
  )
}
