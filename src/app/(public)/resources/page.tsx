import type { Metadata } from 'next'
import Link from 'next/link'

import { siteButton } from '@/components/site/button'
import { FilterBar, FilterList, NoMatches, type FilterGroup } from '@/components/site/filter-bar'
import { EmptyState } from '@/components/site/primitives'
import { ResourceArchiveTable } from '@/components/site/resource-rows'
import { getSiteLinks } from '@/components/site/site-links'
import {
  buildChips,
  countValues,
  hasActiveFilters,
  optionsFromCounts,
  parseFilters,
} from '@/lib/filters/params'
import { isMaintainedGuide } from '@/lib/resources/view-model'
import { PUBLIC_REVALIDATE_SECONDS, publicClient } from '@/sanity/lib/public-client'
import { RESOURCES_QUERY } from '@/sanity/queries/resources'
import { EXPERIENCE_LEVELS, RESOURCE_TYPES } from '@/sanity/schemaTypes/shared/options'

export const metadata: Metadata = {
  title: 'Resource library',
  description:
    'Slides, guides, cheat sheets and starter code from every CSSEC meeting. Each entry stays attached to the session that produced it.',
  alternates: { canonical: '/resources' },
  openGraph: {
    title: 'Resource library — CSSEC',
    description: 'Everything CSSEC has taught, kept — with the session that produced it.',
    url: '/resources',
  },
}

const fetchOptions = { next: { revalidate: PUBLIC_REVALIDATE_SECONDS } }
const BASE = '/resources'

/**
 * `/resources` — the permanent archive.
 *
 * Deliberately a ruled index rather than a grid of cards: the library is meant
 * to be scanned years later for one specific thing, and a table compares
 * titles, types and levels far better than tiles do.
 *
 * Topics are free text in Sanity, so that facet is derived from what the
 * documents actually carry rather than from a fixed list — a topic chip can
 * only exist if something is filed under it.
 */
export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [params, links, resources] = await Promise.all([
    searchParams,
    getSiteLinks(),
    publicClient.fetch(RESOURCES_QUERY, {}, fetchOptions),
  ])

  const topicCounts = countValues(resources, (resource) => resource.topics)
  const topicOptions = optionsFromCounts(topicCounts)

  const active = parseFilters(params, {
    type: RESOURCE_TYPES.map((option) => option.value),
    topic: topicOptions.map((option) => option.value),
    level: EXPERIENCE_LEVELS.map((option) => option.value),
  })

  const matches = (resource: (typeof resources)[number], skip?: 'type' | 'topic' | 'level') =>
    (skip === 'type' || !active.type || resource.resourceType === active.type) &&
    (skip === 'topic' || !active.topic || (resource.topics ?? []).includes(active.topic)) &&
    (skip === 'level' || !active.level || resource.experienceLevel === active.level)

  const visible = resources.filter((resource) => matches(resource))
  const forType = resources.filter((resource) => matches(resource, 'type'))
  const forTopic = resources.filter((resource) => matches(resource, 'topic'))
  const forLevel = resources.filter((resource) => matches(resource, 'level'))

  // The design splits the library: dated session material, and the guides
  // officers maintain independently of any one meeting.
  const guides = visible.filter(isMaintainedGuide)
  const archive = visible.filter((resource) => !isMaintainedGuide(resource))

  const groups: FilterGroup[] = [
    {
      label: 'Topics',
      chips: buildChips({
        active,
        allLabel: 'Everything',
        basePath: BASE,
        counts: countValues(forTopic, (resource) => resource.topics),
        key: 'topic',
        options: topicOptions,
        total: forTopic.length,
      }),
    },
    {
      label: 'Type',
      chips: buildChips({
        active,
        allLabel: 'All types',
        basePath: BASE,
        counts: countValues(forType, (resource) => resource.resourceType),
        key: 'type',
        options: RESOURCE_TYPES,
        total: forType.length,
      }),
    },
    {
      label: 'Level',
      chips: buildChips({
        active,
        allLabel: 'Any level',
        basePath: BASE,
        counts: countValues(forLevel, (resource) => resource.experienceLevel),
        key: 'level',
        options: EXPERIENCE_LEVELS,
        total: forLevel.length,
      }),
    },
  ]

  const requestAction = links.discordUrl ? (
    <a
      className={siteButton({ variant: 'outline', size: 'sm' })}
      href={links.discordUrl}
      rel="noreferrer noopener"
      target="_blank"
    >
      Request a topic ↗
    </a>
  ) : null

  return (
    <div className="bg-paper-warm">
      <div className="border-ink border-b px-4 py-6 sm:px-10 sm:py-[34px_26px]">
        <div className="flex flex-col gap-2 sm:gap-[11px]">
          <p className="text-club-link font-mono text-[10.5px] tracking-[0.16em]">
            THE CSSEC LIBRARY
          </p>
          <h1 className="text-ink m-0 max-w-[760px] font-serif text-[30px] leading-[1.12] font-normal tracking-[-0.015em] sm:text-[42px]">
            Everything we have taught, kept.
          </h1>
          <p className="text-ink-body max-w-[620px] text-[13.5px] leading-relaxed sm:text-[15px]">
            Slides, guides, cheat sheets and starter code from our meetings. Each entry stays
            attached to the session that produced it, so material does not go missing when officers
            change.
          </p>
        </div>
      </div>

      {/* Mobile: the same facets as a scrolling chip row. */}
      {resources.length > 0 ? (
        <FilterBar className="lg:hidden" groups={groups} />
      ) : null}

      <div className="lg:grid lg:grid-cols-[250px_1fr]">
        {resources.length > 0 ? (
          <div className="hidden border-r border-[#E2E0D6] px-6 py-7 lg:block">
            <FilterList groups={groups} />
          </div>
        ) : null}

        <div className="flex flex-col gap-8 px-4 py-7 sm:px-8 sm:py-[28px_40px]">
          {resources.length === 0 ? (
            <EmptyState
              actions={requestAction}
              body="Once a session has run, its slides, recording and starter code are filed here and stay permanently — along with the guides officers write between meetings."
              kicker="EMPTY SHELF"
              title="The library is empty for now"
            />
          ) : visible.length === 0 ? (
            <NoMatches
              action={requestAction}
              body="We have not run a session on this yet. Requests turn into workshops surprisingly often — ask in Discord."
              clearHref={BASE}
              title="Nothing filed under that"
            />
          ) : (
            <>
              <section className="flex flex-col gap-3">
                <div className="flex items-baseline gap-3.5">
                  <h2 className="text-ink m-0 font-serif text-2xl font-normal sm:text-[27px]">
                    {hasActiveFilters(active) ? 'Matching entries' : 'Recently added'}
                  </h2>
                  <span className="flex-1" />
                  <span className="text-ink-faint font-mono text-[11px]">
                    {archive.length + guides.length} SHOWING
                  </span>
                </div>
                {archive.length > 0 ? (
                  <ResourceArchiveTable resources={archive} />
                ) : (
                  <p className="text-ink-soft border-t border-[#E2E0D6] pt-3.5 text-sm">
                    No session material matches — the guides below do.
                  </p>
                )}
              </section>

              {guides.length > 0 ? (
                <section className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3.5">
                    <h2 className="text-ink m-0 font-serif text-2xl font-normal sm:text-[27px]">
                      Guides we maintain
                    </h2>
                    <p className="text-ink-soft text-[13.5px]">
                      Written by officers, updated independently of any one meeting.
                    </p>
                  </div>
                  <ul className="grid gap-3.5 sm:grid-cols-2">
                    {guides.map((guide) => (
                      <li key={guide._id}>
                        <Link
                          className="hover:border-club-border flex h-full flex-col gap-1.5 rounded-[9px] border border-[#E2E0D6] bg-white p-4 transition-colors sm:p-[18px_20px]"
                          href={`/resources/${guide.slug}`}
                        >
                          <span className="text-club-link font-mono text-[10px] tracking-[0.14em] uppercase">
                            {guide.topics?.[0] ?? 'Guide'}
                          </span>
                          <span className="text-ink text-base font-semibold">{guide.title}</span>
                          {guide.description ? (
                            <span className="text-ink-body text-[13.5px] leading-relaxed">
                              {guide.description}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
