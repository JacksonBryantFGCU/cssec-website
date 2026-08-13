import Link from 'next/link'

import { requireOfficer } from '@/auth/require-officer'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { EmptyState } from '@/components/admin/empty-state'
import { FilterTabs, SavedNotice, type FilterTab } from '@/components/admin/filter-tabs'
import { FeaturedBadge, MetaBadge, ProjectStatusBadge } from '@/components/admin/status-badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getAdminClient } from '@/sanity/lib/admin-client'
import { ADMIN_PROJECTS_QUERY } from '@/sanity/queries/admin'
import { EXPERIENCE_LEVELS, titleForValue } from '@/sanity/schemaTypes/shared/options'

export const metadata = { title: 'Projects' }

/**
 * The status views, in the order a project moves through them, with "All" last.
 *
 * Every project status gets a tab rather than a curated subset: an officer
 * looking for an archived project should not have to know that "All" is where
 * it hides.
 */
const FILTERS = [
  { value: 'active', label: 'Live' },
  { value: 'recruiting', label: 'Recruiting' },
  { value: 'idea', label: 'Ideas' },
  { value: 'testing', label: 'Testing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'archived', label: 'Archived' },
  { value: 'all', label: 'All' },
] as const satisfies readonly FilterTab<string>[]

type Filter = (typeof FILTERS)[number]['value']

const SAVED_MESSAGES: Record<string, string> = {
  created: 'Project created.',
  updated: 'Changes saved.',
  archived: 'Project archived. It stays on record but sinks to the bottom of the list.',
  deleted: 'Project deleted.',
}

function parseFilter(value: string | string[] | undefined): Filter {
  const match = FILTERS.find((filter) => filter.value === value)
  return match?.value ?? 'active'
}

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  // Before any query: see the note in the dashboard page — layouts and pages
  // render concurrently, so the layout's check alone would not stop the fetch.
  await requireOfficer({ capability: 'content:write', returnTo: '/admin/projects' })

  const params = await searchParams
  const filter = parseFilter(params.filter)
  const saved = typeof params.saved === 'string' ? SAVED_MESSAGES[params.saved] : undefined
  const savedTitle = typeof params.title === 'string' ? params.title : undefined

  // One query and a partition in the page: the club runs a handful of projects,
  // so this is cheaper than seven queries and keeps the tab counts honest.
  const projects = await getAdminClient().fetch(ADMIN_PROJECTS_QUERY)

  const counts = {
    active: projects.filter((project) => project.status === 'active').length,
    recruiting: projects.filter((project) => project.status === 'recruiting').length,
    idea: projects.filter((project) => project.status === 'idea').length,
    testing: projects.filter((project) => project.status === 'testing').length,
    shipped: projects.filter((project) => project.status === 'shipped').length,
    archived: projects.filter((project) => project.status === 'archived').length,
    all: projects.length,
  }

  const visible =
    filter === 'all' ? projects : projects.filter((project) => project.status === filter)

  return (
    <>
      <AdminPageHeader
        actions={
          <Link className={cn(buttonVariants())} href="/admin/projects/new">
            New project
          </Link>
        }
        description="Club projects, the roles they are recruiting for, and their progress."
        kicker="Content"
        title="Projects"
      />

      <div className="flex flex-col gap-4 px-4 py-6 sm:px-6">
        <SavedNotice detail={savedTitle} message={saved} />

        <FilterTabs
          active={filter}
          basePath="/admin/projects"
          counts={counts}
          label="Filter projects"
          tabs={FILTERS}
        />

        {projects.length === 0 ? (
          <EmptyState
            action={
              <Link className={cn(buttonVariants())} href="/admin/projects/new">
                Create your first project
              </Link>
            }
            description="Projects created here appear on the public projects page and in the Advanced CMS."
            kicker="Nothing yet"
            title="No projects yet"
          />
        ) : visible.length === 0 ? (
          <EmptyState
            description="Nothing has this status right now. Use the All tab to see every project."
            kicker="Empty filter"
            title="Nothing here"
          />
        ) : (
          <ul className="border-rule-card divide-rule divide-y rounded-lg border bg-white">
            {visible.map((project) => {
              const technologies = (project.techStack ?? []).filter(Boolean)

              return (
                <li
                  className="hover:bg-paper-warm flex flex-col gap-3 px-4 py-4 transition-colors sm:flex-row sm:items-start sm:justify-between sm:gap-6"
                  key={project._id}
                >
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        className="text-ink text-[15px] font-semibold underline-offset-4 hover:underline"
                        href={`/admin/projects/${project._id}/edit`}
                      >
                        {project.name ?? 'Untitled project'}
                      </Link>
                      <ProjectStatusBadge status={project.status} />
                      {project.featured ? <FeaturedBadge /> : null}
                    </div>

                    <p className="text-ink-soft font-mono text-[11.5px]">
                      {project.leadName ? `Led by ${project.leadName}` : 'No lead yet'}
                      {project.mentorCount > 0
                        ? ` · ${project.mentorCount} ${project.mentorCount === 1 ? 'mentor' : 'mentors'}`
                        : ''}
                      {technologies.length > 0 ? ` · ${technologies.slice(0, 4).join(', ')}` : ''}
                      {technologies.length > 4 ? ` +${technologies.length - 4}` : ''}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <MetaBadge>
                        {project.openRoleCount > 0
                          ? `${project.openRoleCount} open ${project.openRoleCount === 1 ? 'role' : 'roles'}`
                          : 'No open roles'}
                      </MetaBadge>
                      <MetaBadge>
                        {titleForValue(EXPERIENCE_LEVELS, project.experienceLevel) ?? 'Any level'}
                      </MetaBadge>
                      {project.noExperienceRequired ? (
                        <MetaBadge>Beginner friendly</MetaBadge>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {project.slug ? (
                      <a
                        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                        href={`/projects/${project.slug}`}
                        rel="noreferrer"
                        target="_blank"
                      >
                        View
                        <span className="sr-only"> {project.name ?? 'project'} on the website</span>
                        <span aria-hidden="true">↗</span>
                      </a>
                    ) : null}
                    <Link
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                      href={`/admin/projects/${project._id}/edit`}
                    >
                      Edit<span className="sr-only"> {project.name ?? 'project'}</span>
                    </Link>
                    <Link
                      className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                      href={`/admin/projects/${project._id}/remove`}
                    >
                      Remove<span className="sr-only"> {project.name ?? 'project'}</span>
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <p className="text-ink-faint text-[12px]">
          Saving here updates the public site straight away. Full descriptions, screenshots and SEO
          live in the{' '}
          <Link
            className="text-club-link font-medium underline underline-offset-4"
            href="/studio"
            rel="noreferrer"
            target="_blank"
          >
            Advanced CMS
          </Link>
          .
        </p>
      </div>
    </>
  )
}
