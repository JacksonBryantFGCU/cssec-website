import type { Metadata } from 'next'

import { siteButton } from '@/components/site/button'
import { FilterBar, NoMatches, type FilterGroup } from '@/components/site/filter-bar'
import { EmptyState } from '@/components/site/primitives'
import { ProjectPreview } from '@/components/site/project-preview'
import { getSiteLinks } from '@/components/site/site-links'
import { buildChips, countValues, filterHref, hasActiveFilters, parseFilters } from '@/lib/filters/params'
import { LEVEL_FACET, matchesLevel, PROJECT_STATUS_FACET } from '@/lib/projects/view-model'
import { PUBLIC_REVALIDATE_SECONDS, publicClient } from '@/sanity/lib/public-client'
import { PROJECTS_QUERY } from '@/sanity/queries/projects'

export const metadata: Metadata = {
  title: 'Projects',
  description:
    'Real software built by CSSEC teams, with a lead and a mentor on every one. See what is being built, which roles are open, and what you would learn.',
  alternates: { canonical: '/projects' },
  openGraph: {
    title: 'Projects — CSSEC',
    description: 'Club project teams, the roles they are recruiting for, and what you would learn.',
    url: '/projects',
  },
}

const fetchOptions = { next: { revalidate: PUBLIC_REVALIDATE_SECONDS } }
const BASE = '/projects'

/**
 * `/projects` — every club project, ordered so the ones taking people lead.
 *
 * Filtering happens here rather than in GROQ. The club runs a handful of
 * projects at a time, so one query and two partitions is simpler than four
 * parameterised queries, and it is what keeps the chip counts honest: each
 * count is measured against the set the *other* facet already narrowed, so a
 * chip never promises results it cannot deliver.
 */
export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [params, links, projects] = await Promise.all([
    searchParams,
    getSiteLinks(),
    publicClient.fetch(PROJECTS_QUERY, {}, fetchOptions),
  ])

  const active = parseFilters(params, {
    status: PROJECT_STATUS_FACET.map((option) => option.value),
    level: LEVEL_FACET.map((option) => option.value),
  })

  // Ideas have no team, no roles and nothing to view yet, so the design keeps
  // them out of the list and the chips, and names them in their own block.
  const ideas = projects.filter((project) => project.status === 'idea')
  const listed = projects.filter((project) => project.status !== 'idea')

  // Each facet counts against the set the *other* facet has already narrowed,
  // so a chip's number is what that chip would actually show.
  const byLevel = listed.filter((project) => matchesLevel(project, active.level))
  const byStatus = listed.filter((project) => !active.status || project.status === active.status)
  const visible = byStatus.filter((project) => matchesLevel(project, active.level))

  const groups: FilterGroup[] = [
    {
      label: 'Status',
      greenValue: 'recruiting',
      chips: buildChips({
        active,
        allLabel: 'All projects',
        basePath: BASE,
        counts: countValues(byLevel, (project) => project.status),
        key: 'status',
        options: PROJECT_STATUS_FACET,
        total: byLevel.length,
      }),
    },
    {
      label: 'Experience',
      chips: buildChips({
        active,
        allLabel: 'Any level',
        basePath: BASE,
        counts: countValues(byStatus, (project) =>
          LEVEL_FACET.filter((option) => matchesLevel(project, option.value)).map(
            (option) => option.value,
          ),
        ),
        key: 'level',
        options: LEVEL_FACET,
        total: byStatus.length,
      }),
    },
  ]

  const pitchAction = links.discordUrl ? (
    <a
      className={siteButton({ variant: 'outline', size: 'sm' })}
      href={links.discordUrl}
      rel="noreferrer noopener"
      target="_blank"
    >
      Pitch a project ↗
    </a>
  ) : null

  return (
    <>
      <div className="bg-navy border-navy-line text-navy-fg border-b px-4 py-6 sm:px-7 sm:py-[30px]">
        <div className="grid gap-5 lg:grid-cols-[1fr_380px] lg:items-end lg:gap-10">
          <div className="flex flex-col gap-2 sm:gap-[11px]">
            <h1 className="font-display m-0 text-[27px] font-semibold tracking-[-0.025em] sm:text-[34px]">
              Projects
            </h1>
            <p className="text-navy-body max-w-[640px] font-serif text-[17px] leading-[1.5] sm:text-xl">
              Real software, built by club teams, with a lead and a mentor on every one. Joining is
              not a competition — if a role is open and you want it, tell us.
            </p>
          </div>

          {/* The design explains its own vocabulary here rather than leaving
              "Beginner" to be guessed at. */}
          <dl className="border-navy-edge hidden flex-col gap-[9px] border-l pl-[26px] lg:flex">
            <dt className="text-navy-quiet font-mono text-[10px] tracking-[0.16em]">
              EXPERIENCE LEVELS
            </dt>
            {[
              ['No experience', 'we teach you on the job', 'text-club-green-bright'],
              ['Some experience', 'one course or a side project', 'text-navy-link'],
              ['Experienced', 'you have shipped something', 'text-github'],
            ].map(([level, meaning, tone]) => (
              <dd className="flex items-baseline gap-2.5 text-[13.5px]" key={level}>
                <span className={`min-w-[132px] font-bold ${tone}`}>{level}</span>
                <span className="text-navy-soft">{meaning}</span>
              </dd>
            ))}
          </dl>
        </div>
      </div>

      {listed.length > 0 ? <FilterBar action={pitchAction} groups={groups} /> : null}

      <section className="flex flex-col gap-3.5 bg-white px-4 py-7 sm:px-7 sm:py-[28px_34px]">
        {listed.length === 0 && ideas.length === 0 ? (
          <EmptyState
            actions={pitchAction}
            body="The project programme starts as soon as a team forms. If there is something you actually want to build, say so — that is how every one of ours began."
            kicker="NO PROJECTS YET"
            title="No projects have been published yet"
          />
        ) : visible.length === 0 ? (
          <NoMatches
            action={pitchAction}
            body="Clear the filters, or pitch the thing you actually want to build — the programme is still young."
            clearHref={hasActiveFilters(active) ? BASE : filterHref(BASE, {}, 'status', null)}
            title="Nothing at that combination yet"
          />
        ) : (
          <ul className="flex flex-col gap-3.5">
            {visible.map((project) => (
              <ProjectPreview key={project._id} project={project} />
            ))}
          </ul>
        )}

        {/* Ideas waiting for someone to lead them. Shown only unfiltered — they
            are not part of any status the chips offer. */}
        {ideas.length > 0 && !hasActiveFilters(active) ? (
          <div className="border-rule-dashed grid gap-5 rounded-[10px] border border-dashed bg-[#F4F7F4] p-4 sm:p-[22px_24px] lg:grid-cols-[1fr_250px] lg:items-center">
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="font-display text-ink m-0 text-[17px] font-semibold sm:text-[19px]">
                  {ideas.length === 1
                    ? 'One idea is waiting for a lead'
                    : `${ideas.length} ideas are waiting for a lead`}
                </h2>
                <span className="text-ink-soft rounded bg-[#E4E8E3] px-2 py-[3px] font-mono text-[10px] tracking-[0.12em]">
                  <span aria-hidden="true">○</span> IDEA STAGE
                </span>
              </div>
              <ul className="flex flex-col gap-1.5">
                {ideas.map((idea) => (
                  <li className="flex flex-col gap-1 text-sm leading-relaxed sm:flex-row sm:gap-2.5" key={idea._id}>
                    <strong className="text-ink min-w-[200px] font-semibold">{idea.name}</strong>
                    {idea.shortDescription ? (
                      <span className="text-ink-body">{idea.shortDescription}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
            {links.discordUrl ? (
              <div className="flex flex-col gap-[7px]">
                <a
                  className={siteButton({ variant: 'primary', size: 'block' })}
                  href={links.discordUrl}
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  Ask about leading one ↗
                </a>
                <a
                  className={siteButton({ variant: 'outline', size: 'block' })}
                  href={links.discordUrl}
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  Pitch your own ↗
                </a>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </>
  )
}
