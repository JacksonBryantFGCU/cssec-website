import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { siteButton } from '@/components/site/button'
import { LevelBadge, MonoLabel, TechTag } from '@/components/site/primitives'
import { Prose } from '@/components/site/prose'
import { getSiteLinks } from '@/components/site/site-links'
import { formatCalendarDate } from '@/lib/time'
import {
  isBeginnerFriendly,
  projectLevelLabel,
  projectStatusLabel,
  PROJECT_STATUS_FACET,
} from '@/lib/projects/view-model'
import { PUBLIC_REVALIDATE_SECONDS, publicClient } from '@/sanity/lib/public-client'
import { PROJECT_BY_SLUG_QUERY, PROJECT_SLUGS_QUERY } from '@/sanity/queries/projects'
import { EXPERIENCE_LEVELS, titleForValue } from '@/sanity/schemaTypes/shared/options'

const fetchOptions = { next: { revalidate: PUBLIC_REVALIDATE_SECONDS } }

export async function generateStaticParams() {
  const slugs = await publicClient.fetch(PROJECT_SLUGS_QUERY)
  return slugs
    .map((entry) => entry.slug)
    .filter((slug): slug is string => Boolean(slug))
    .map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: PageProps<'/projects/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const project = await publicClient.fetch(PROJECT_BY_SLUG_QUERY, { slug }, fetchOptions)

  // A missing project gets no invented metadata — the page itself 404s.
  if (!project) return {}

  const description = project.seo?.metaDescription ?? project.shortDescription ?? undefined

  return {
    title: project.seo?.metaTitle ?? project.name ?? 'Project',
    description,
    alternates: { canonical: `/projects/${slug}` },
    openGraph: {
      title: `${project.name} — CSSEC`,
      description,
      url: `/projects/${slug}`,
      type: 'article',
    },
  }
}

/**
 * `/projects/[slug]` — one project, written for someone deciding whether to
 * join it.
 *
 * The order is the approved design's and it is deliberate: what it is, then
 * what you would learn, then the roles. The stack sits in the rail rather than
 * the body so it reads as context rather than as a list of prerequisites —
 * that misreading is the single thing this page exists to prevent.
 */
export default async function ProjectPage({ params }: PageProps<'/projects/[slug]'>) {
  const { slug } = await params
  const [links, project] = await Promise.all([
    getSiteLinks(),
    publicClient.fetch(PROJECT_BY_SLUG_QUERY, { slug }, fetchOptions),
  ])

  if (!project) notFound()

  const beginner = isBeginnerFriendly(project)
  const status = project.status ?? 'idea'
  const openRoles = project.openRoles ?? []
  const mentors = project.mentors ?? []
  const contributors = project.contributors ?? []
  const joinUrl = project.discussionUrl ?? links.discordUrl

  return (
    <>
      <div className="bg-navy border-navy-line text-navy-fg border-b px-4 py-5 sm:px-7 sm:py-[22px_30px]">
        <nav aria-label="Breadcrumb" className="mb-3 text-[13px] sm:mb-4">
          <Link className="text-navy-faint hover:text-navy-bright inline-flex min-h-11 items-center sm:min-h-0" href="/projects">
            <span aria-hidden="true" className="sm:hidden">
              ←{' '}
            </span>
            Projects
          </Link>
          <span aria-hidden="true" className="text-navy-whisper hidden sm:inline">
            {' '}
            ·{' '}
          </span>
          <span className="text-navy-body hidden sm:inline">{project.name}</span>
        </nav>

        <div className="grid gap-5 lg:grid-cols-[1fr_330px] lg:items-end lg:gap-10">
          <div className="flex flex-col gap-2.5 sm:gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-club-green-bright rounded border border-[rgba(47,163,107,0.4)] bg-[rgba(47,163,107,0.15)] px-2 py-[3px] font-mono text-[10px] tracking-[0.14em] uppercase">
                {projectStatusLabel(status)}
              </span>
              <span className="text-club-green-ink bg-club-green-bright rounded-[20px] px-2.5 py-1 text-[12.5px] font-bold">
                <span aria-hidden="true">{beginner ? '✓ ' : '◆ '}</span>
                {projectLevelLabel(project)}
              </span>
            </div>

            <h1 className="font-display m-0 text-[30px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[40px]">
              {project.name}
            </h1>

            {project.shortDescription ? (
              <p className="text-navy-body max-w-[640px] font-serif text-[18px] leading-[1.45] sm:text-[21px]">
                {project.shortDescription}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2.5">
            {joinUrl ? (
              <a
                className={siteButton({ variant: 'primary', size: 'block' })}
                href={joinUrl}
                rel="noreferrer noopener"
                target="_blank"
              >
                Join this project ↗
              </a>
            ) : null}
            {project.githubUrl || project.demoUrl ? (
              <div className="flex gap-2.5">
                {project.githubUrl ? (
                  <a
                    className={siteButton({ variant: 'onNavy', size: 'block' })}
                    href={project.githubUrl}
                    rel="noreferrer noopener"
                    target="_blank"
                  >
                    GitHub ↗
                  </a>
                ) : null}
                {project.demoUrl ? (
                  <a
                    className={siteButton({ variant: 'onNavy', size: 'block' })}
                    href={project.demoUrl}
                    rel="noreferrer noopener"
                    target="_blank"
                  >
                    Demo ↗
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid bg-white lg:grid-cols-[1fr_356px]">
        <div className="border-rule flex flex-col gap-7 px-4 py-7 sm:px-8 sm:py-[30px_40px] lg:border-r">
          {project.description ? (
            <section className="flex flex-col gap-3">
              <h2 className="font-display text-ink m-0 text-[19px] font-semibold">
                About the project
              </h2>
              <Prose value={project.description} />
            </section>
          ) : null}

          {project.learningOutcomes?.length ? (
            <section className="bg-club-surface-soft border-club-border flex flex-col gap-3 rounded-[10px] border p-4 sm:p-[22px_24px]">
              <h2 className="font-display text-club-dark m-0 text-[19px] font-semibold sm:text-[21px]">
                What you&rsquo;ll learn
              </h2>
              <ul className="grid gap-2.5 sm:grid-cols-2 sm:gap-x-6">
                {project.learningOutcomes.map((outcome) => (
                  <li className="flex gap-2.5 text-[14.5px] leading-relaxed text-[#25352C]" key={outcome}>
                    <span aria-hidden="true" className="text-club-link">
                      →
                    </span>
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
              {beginner ? (
                <p className="border-club-rule text-ink-body border-t pt-3 text-[13.5px] leading-relaxed">
                  If you have only taken your first programming course, this is a fine place to
                  start. Pair-programming and a mentor come with the role.
                </p>
              ) : null}
            </section>
          ) : null}

          {openRoles.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="font-display text-ink m-0 text-[19px] font-semibold">Open roles</h2>
              <ul className="flex flex-col gap-3">
                {openRoles.map((role) => (
                  <li
                    className="border-rule grid gap-4 rounded-[9px] border p-4 sm:grid-cols-[1fr_150px] sm:items-start sm:p-[16px_18px]"
                    key={role._key}
                  >
                    <div className="flex flex-col gap-1.5">
                      <h3 className="text-ink m-0 text-[15px] font-semibold sm:text-base">
                        {role.title}
                      </h3>
                      {role.description ? (
                        <p className="text-ink-body text-sm leading-relaxed">{role.description}</p>
                      ) : null}
                      {role.learningOutcome ? (
                        <p className="text-ink-soft text-[13.5px] leading-relaxed">
                          <strong className="text-ink-strong font-semibold">
                            You&rsquo;ll pick up:
                          </strong>{' '}
                          {role.learningOutcome}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5 sm:flex-col sm:items-end">
                      <LevelBadge
                        label={
                          titleForValue(EXPERIENCE_LEVELS, role.experienceLevel) ?? 'Any level'
                        }
                        tone={
                          role.experienceLevel === 'any' || role.experienceLevel === 'beginner'
                            ? 'beginner'
                            : 'experienced'
                        }
                      />
                      {joinUrl ? (
                        <a
                          className={siteButton({ variant: 'outline', size: 'sm' })}
                          href={joinUrl}
                          rel="noreferrer noopener"
                          target="_blank"
                        >
                          I&rsquo;m interested ↗
                          <span className="sr-only"> in the {role.title} role</span>
                        </a>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="bg-paper flex flex-col gap-6 px-4 py-7 sm:px-7 sm:py-[30px_40px]">
          <section className="flex flex-col gap-2">
            <MonoLabel>LIFECYCLE</MonoLabel>
            <ol className="flex flex-col">
              {PROJECT_STATUS_FACET.map((phase) => {
                const current = phase.value === status
                return (
                  <li className="flex items-center gap-3 py-1.5" key={phase.value}>
                    <span
                      aria-hidden="true"
                      className={
                        current
                          ? 'bg-club-green size-2.5 shrink-0 rounded-full'
                          : 'border-rule-strong size-2.5 shrink-0 rounded-full border bg-white'
                      }
                    />
                    <span
                      className={
                        current
                          ? 'text-ink text-sm font-bold'
                          : 'text-ink-faint text-sm'
                      }
                    >
                      {phase.title}
                      {current ? <span className="sr-only"> (current phase)</span> : null}
                    </span>
                  </li>
                )
              })}
            </ol>
            {project.startedAt ? (
              <p className="text-ink-soft pt-1 text-[13px] leading-relaxed">
                Started {formatCalendarDate(project.startedAt)}
                {project.completedAt ? ` · Shipped ${formatCalendarDate(project.completedAt)}` : ''}
              </p>
            ) : null}
          </section>

          {project.latestMilestone || project.currentFocus ? (
            <section className="border-rule flex flex-col gap-3 rounded-[10px] border bg-white p-4 sm:p-[18px_20px]">
              <MonoLabel>ACTIVITY</MonoLabel>
              {project.latestMilestone ? (
                <p className="text-ink-strong text-sm leading-relaxed">
                  <span className="text-ink-label block">Latest milestone</span>
                  {project.latestMilestone}
                </p>
              ) : null}
              {project.currentFocus ? (
                <p className="text-ink-strong text-sm leading-relaxed">
                  <span className="text-ink-label block">Current focus</span>
                  {project.currentFocus}
                </p>
              ) : null}
              {project.githubUrl ? (
                <a
                  className="text-club-link hover:text-club-link-hover text-[13px] font-semibold hover:underline"
                  href={project.githubUrl}
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  Issues and commits on GitHub ↗
                </a>
              ) : null}
            </section>
          ) : null}

          {project.lead || mentors.length > 0 || contributors.length > 0 ? (
            <section className="border-rule flex flex-col gap-3 rounded-[10px] border bg-white p-4 sm:p-[18px_20px]">
              <MonoLabel>TEAM</MonoLabel>
              {project.lead ? (
                <p className="text-sm">
                  <span className="text-ink block font-semibold">{project.lead.name}</span>
                  <span className="text-ink-soft text-[13px]">Project lead</span>
                </p>
              ) : null}
              {mentors.map((mentor) => (
                <p className="text-sm" key={mentor._id}>
                  <span className="text-ink block font-semibold">{mentor.name}</span>
                  <span className="text-ink-soft text-[13px]">Mentor</span>
                </p>
              ))}
              {contributors.length > 0 ? (
                <div className="border-rule flex flex-col gap-1 border-t pt-2.5">
                  <p className="text-ink-label text-[13px]">Contributors</p>
                  {contributors.map((person) => (
                    <p className="text-ink-strong text-sm" key={person._id}>
                      {person.name}
                    </p>
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}

          {project.techStack?.length ? (
            <section className="flex flex-col gap-2.5">
              <MonoLabel>TECHNOLOGY</MonoLabel>
              <ul className="flex flex-wrap gap-[7px]">
                {project.techStack.map((tech) => (
                  <li key={tech}>
                    <TechTag>{tech}</TechTag>
                  </li>
                ))}
              </ul>
              {/* The stack is context, not a checklist — said plainly, because
                  reading it as prerequisites is why people do not apply. */}
              <p className="text-ink-soft text-[13px] leading-relaxed">
                You will not be tested on any of this. Pick a role and we point you at what to read
                first.
              </p>
            </section>
          ) : null}

          {joinUrl ? (
            <section className="bg-navy flex flex-col gap-2.5 rounded-[10px] p-4 sm:p-[18px_20px]">
              <h2 className="font-display text-navy-fg m-0 text-base font-semibold">
                Not sure it&rsquo;s for you?
              </h2>
              <p className="text-navy-soft text-[13.5px] leading-relaxed">
                Come to one standup and watch. No commitment, and it is the fastest way to see what
                the work looks like.
              </p>
              <a
                className={siteButton({ variant: 'onNavy', size: 'block' })}
                href={joinUrl}
                rel="noreferrer noopener"
                target="_blank"
              >
                Ask in Discord ↗
              </a>
            </section>
          ) : null}
        </aside>
      </div>
    </>
  )
}
