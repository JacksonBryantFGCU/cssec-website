import Link from 'next/link'

import { requireOfficer } from '@/auth/require-officer'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { EmptyState } from '@/components/admin/empty-state'
import { FilterTabs, SavedNotice, type FilterTab } from '@/components/admin/filter-tabs'
import { FeaturedBadge, MetaBadge } from '@/components/admin/status-badge'
import { buttonVariants } from '@/components/ui/button'
import { resourceLink } from '@/lib/resources/link'
import { formatCalendarDate } from '@/lib/time'
import { cn } from '@/lib/utils'
import { getAdminClient } from '@/sanity/lib/admin-client'
import { ADMIN_RESOURCES_QUERY } from '@/sanity/queries/admin'
import { RESOURCE_TYPES, titleForValue } from '@/sanity/schemaTypes/shared/options'

export const metadata = { title: 'Resources' }

/**
 * The type views, matching the Studio structure's resource groups so an officer
 * moving between the two interfaces finds the same shelves. "All" is last.
 */
const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'workshop', label: 'Workshop materials' },
  { value: 'guide', label: 'Guides' },
  { value: 'slides', label: 'Slides' },
  { value: 'cheatSheet', label: 'Cheat sheets' },
  { value: 'repository', label: 'Repositories' },
  { value: 'recording', label: 'Recordings' },
] as const satisfies readonly FilterTab<string>[]

type Filter = (typeof FILTERS)[number]['value']

const SAVED_MESSAGES: Record<string, string> = {
  created: 'Resource added.',
  updated: 'Changes saved.',
  deleted: 'Resource deleted.',
}

function parseFilter(value: string | string[] | undefined): Filter {
  const match = FILTERS.find((filter) => filter.value === value)
  return match?.value ?? 'all'
}

export default async function AdminResourcesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireOfficer({ capability: 'content:write', returnTo: '/admin/resources' })

  const params = await searchParams
  const filter = parseFilter(params.filter)
  const saved = typeof params.saved === 'string' ? SAVED_MESSAGES[params.saved] : undefined
  const savedTitle = typeof params.title === 'string' ? params.title : undefined

  const resources = await getAdminClient().fetch(ADMIN_RESOURCES_QUERY)

  const countOf = (value: Filter) =>
    value === 'all'
      ? resources.length
      : resources.filter((resource) => resource.resourceType === value).length

  const counts = Object.fromEntries(FILTERS.map((tab) => [tab.value, countOf(tab.value)])) as Record<
    Filter,
    number
  >

  const visible =
    filter === 'all' ? resources : resources.filter((resource) => resource.resourceType === filter)

  return (
    <>
      <AdminPageHeader
        actions={
          <Link className={cn(buttonVariants())} href="/admin/resources/new">
            Add resource
          </Link>
        }
        description="Slides, recordings, cheat sheets and starter repositories — the library students learn from."
        kicker="Content"
        title="Resources"
      />

      <div className="flex flex-col gap-4 px-4 py-6 sm:px-6">
        <SavedNotice detail={savedTitle} message={saved} />

        <FilterTabs
          active={filter}
          basePath="/admin/resources"
          counts={counts}
          label="Filter resources by type"
          tabs={FILTERS}
        />

        {resources.length === 0 ? (
          <EmptyState
            action={
              <Link className={cn(buttonVariants())} href="/admin/resources/new">
                Add your first resource
              </Link>
            }
            description="Anything you add here appears in the public resource library, and on the page of the event it came from."
            kicker="Nothing yet"
            title="No resources yet"
          />
        ) : visible.length === 0 ? (
          <EmptyState
            description="Nothing of this type yet. Use the All tab to see every resource."
            kicker="Empty filter"
            title="Nothing here"
          />
        ) : (
          <ul className="border-rule-card divide-rule divide-y rounded-lg border bg-white">
            {visible.map((resource) => {
              // The same helper the public pages use, so the admin says
              // "Download" exactly where a student would see "Download".
              const target = resourceLink({
                slug: resource.slug,
                resourceType: resource.resourceType,
                fileUrl: resource.fileUrl,
                githubUrl: resource.githubUrl,
                externalUrl: resource.externalUrl,
              })
              const reviewed = resource.updatedAt ?? resource.publishedAt

              return (
                <li
                  className="hover:bg-paper-warm flex flex-col gap-3 px-4 py-4 transition-colors sm:flex-row sm:items-start sm:justify-between sm:gap-6"
                  key={resource._id}
                >
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        className="text-ink text-[15px] font-semibold underline-offset-4 hover:underline"
                        href={`/admin/resources/${resource._id}/edit`}
                      >
                        {resource.title ?? 'Untitled resource'}
                      </Link>
                      {resource.featured ? <FeaturedBadge /> : null}
                    </div>

                    <p className="text-ink-soft font-mono text-[11.5px]">
                      {resource.eventTitle ? `From ${resource.eventTitle}` : 'Standalone'}
                      {resource.authorName ? ` · ${resource.authorName}` : ''}
                      {reviewed ? ` · Updated ${formatCalendarDate(reviewed)}` : ''}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <MetaBadge>
                        {titleForValue(RESOURCE_TYPES, resource.resourceType) ?? 'Resource'}
                      </MetaBadge>
                      {/* What an officer would actually get if they clicked. */}
                      <MetaBadge>
                        {resource.fileUrl
                          ? `File${resource.fileExtension ? ` · ${resource.fileExtension.toUpperCase()}` : ''}`
                          : resource.githubUrl
                            ? 'Repository'
                            : resource.externalUrl
                              ? 'External link'
                              : 'No destination'}
                      </MetaBadge>
                      {(resource.topics ?? []).slice(0, 3).map((topic) => (
                        <MetaBadge key={topic}>{topic}</MetaBadge>
                      ))}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {target ? (
                      <a
                        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                        href={target.href}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {target.action.replace(' ↗', '')}
                        <span className="sr-only"> {resource.title ?? 'resource'}</span>
                        <span aria-hidden="true">↗</span>
                      </a>
                    ) : null}
                    <Link
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                      href={`/admin/resources/${resource._id}/edit`}
                    >
                      Edit<span className="sr-only"> {resource.title ?? 'resource'}</span>
                    </Link>
                    <Link
                      className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                      href={`/admin/resources/${resource._id}/remove`}
                    >
                      Remove<span className="sr-only"> {resource.title ?? 'resource'}</span>
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <p className="text-ink-faint text-[12px]">
          Files up to 10 MB can be uploaded here. Anything larger — long recordings especially —
          belongs on YouTube or Drive with an external link, or can be uploaded in the{' '}
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
