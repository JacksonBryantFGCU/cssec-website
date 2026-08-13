import type { Metadata } from 'next'

import { siteButton } from '@/components/site/button'
import { FilterBar, NoMatches, type FilterGroup } from '@/components/site/filter-bar'
import { OpportunityTable } from '@/components/site/opportunity-rows'
import { EmptyState } from '@/components/site/primitives'
import { getSiteLinks } from '@/components/site/site-links'
import { buildChips, countValues, parseFilters } from '@/lib/filters/params'
import { splitByUrgency } from '@/lib/opportunities/board'
import { PUBLIC_REVALIDATE_SECONDS, publicClient } from '@/sanity/lib/public-client'
import { ACTIVE_OPPORTUNITIES_QUERY } from '@/sanity/queries/opportunities'
import { OPPORTUNITY_TYPES } from '@/sanity/schemaTypes/shared/options'

export const metadata: Metadata = {
  title: 'Opportunities',
  description:
    'Internships, jobs, hackathons, research, scholarships and campus roles vetted by CSSEC officers and alumni. Listings drop off the board the day after they close.',
  alternates: { canonical: '/opportunities' },
  openGraph: {
    title: 'Opportunities — CSSEC',
    description: 'A curated board of opportunities for FGCU computing students.',
    url: '/opportunities',
  },
}

const fetchOptions = { next: { revalidate: PUBLIC_REVALIDATE_SECONDS } }
const BASE = '/opportunities'

/**
 * `/opportunities` — the board.
 *
 * The query returns only what is still open: a deadline that has not passed,
 * or none at all. Expired listings stay in Sanity as a record but never reach
 * the page, which is what the design means by "listings drop off the board the
 * day after they close" — nothing is deleted to achieve it.
 *
 * The design has no per-opportunity route, and the schema has no slug to build
 * one from, so a listing links straight to the organization's own application
 * page rather than to a detail page that would only repeat this row.
 */
export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [params, links, opportunities] = await Promise.all([
    searchParams,
    getSiteLinks(),
    publicClient.fetch(ACTIVE_OPPORTUNITIES_QUERY, {}, fetchOptions),
  ])

  const active = parseFilters(params, {
    type: OPPORTUNITY_TYPES.map((option) => option.value),
  })

  const visible = opportunities.filter(
    (opportunity) => !active.type || opportunity.opportunityType === active.type,
  )
  const { closingSoon, later } = splitByUrgency(visible)

  const groups: FilterGroup[] = [
    {
      label: 'Type',
      chips: buildChips({
        active,
        allLabel: 'All types',
        basePath: BASE,
        counts: countValues(opportunities, (opportunity) => opportunity.opportunityType),
        key: 'type',
        options: OPPORTUNITY_TYPES,
        total: opportunities.length,
      }),
    },
  ]

  const alertsAction = links.discordUrl ? (
    <a
      className={siteButton({ variant: 'outline', size: 'sm' })}
      href={links.discordUrl}
      rel="noreferrer noopener"
      target="_blank"
    >
      Submit a listing ↗
    </a>
  ) : null

  return (
    <>
      <div className="bg-navy border-navy-line text-navy-fg border-b px-4 py-6 sm:px-7 sm:py-[30px_28px]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-[30px]">
          <div className="flex max-w-[660px] flex-col gap-2.5">
            <h1 className="font-display m-0 text-[27px] font-semibold tracking-[-0.025em] sm:text-[34px]">
              Opportunities
            </h1>
            <p className="text-navy-muted text-[13.5px] leading-relaxed sm:text-[14.5px]">
              Internships, jobs, hackathons, research, scholarships and campus roles that officers
              and alumni have actually vetted. Listings drop off the board the day after they close.
            </p>
          </div>
          <span className="hidden flex-1 sm:block" />
          <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
            <p className="text-navy-quiet font-mono text-[11px] tracking-[0.06em]">
              {opportunities.length} OPEN
            </p>
            {links.discordUrl ? (
              <a
                className={siteButton({ variant: 'onNavy', size: 'sm' })}
                href={links.discordUrl}
                rel="noreferrer noopener"
                target="_blank"
              >
                Submit a listing ↗
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {opportunities.length > 0 ? <FilterBar groups={groups} /> : null}

      <div className="flex flex-col gap-7 bg-white px-4 py-6 sm:px-7 sm:py-[26px_36px]">
        {opportunities.length === 0 ? (
          <EmptyState
            actions={alertsAction}
            body="Deadlines cluster in September and January. Officers post listings as they land, and Discord announces each one."
            kicker="NOTHING OPEN"
            title="No opportunities are open right now"
          />
        ) : visible.length === 0 ? (
          <NoMatches
            action={alertsAction}
            body="Nothing of that kind is open at the moment. Officers post new listings weekly."
            clearHref={BASE}
            title="No listings in that category right now"
          />
        ) : (
          <>
            {closingSoon.length > 0 ? (
              <section className="flex flex-col">
                <div className="flex flex-col gap-1 pb-3 sm:flex-row sm:items-baseline sm:gap-3">
                  <h2 className="font-display text-ink m-0 text-lg font-semibold sm:text-xl">
                    Closing soon
                  </h2>
                  <p className="text-ink-soft text-[13.5px]">
                    Two weeks or less. Ask an officer if you want your application read first.
                  </p>
                </div>
                <OpportunityTable closingSoon opportunities={closingSoon} />
              </section>
            ) : null}

            {later.length > 0 ? (
              <section className="flex flex-col">
                <div className="flex flex-col gap-1 pb-3 sm:flex-row sm:items-baseline sm:gap-3">
                  <h2 className="font-display text-ink m-0 text-lg font-semibold sm:text-xl">
                    Open
                  </h2>
                  <p className="text-ink-soft text-[13.5px]">
                    Later deadlines and rolling applications.
                  </p>
                </div>
                <OpportunityTable opportunities={later} />
              </section>
            ) : null}
          </>
        )}
      </div>
    </>
  )
}
