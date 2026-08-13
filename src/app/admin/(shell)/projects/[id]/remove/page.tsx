import Link from 'next/link'
import { notFound } from 'next/navigation'

import { requireOfficer } from '@/auth/require-officer'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { ProjectStatusBadge } from '@/components/admin/status-badge'
import { buttonVariants } from '@/components/ui/button'
import { hasProjectWork, projectRemovalPolicy } from '@/lib/projects/delete-policy'
import { cn } from '@/lib/utils'
import { getAdminClient } from '@/sanity/lib/admin-client'
import { ADMIN_PROJECT_BY_ID_QUERY } from '@/sanity/queries/admin'

import { RemoveProjectForms } from './remove-forms'

export const metadata = { title: 'Remove project' }

/**
 * The one place a project can be archived or deleted.
 *
 * Removal is never a single click from a list: it gets its own screen that
 * names the project, says what each option does, and offers the safe option
 * first. Projects are the club's record of what it has actually built, so
 * archiving is the default and deletion is reserved for ideas typed in by
 * mistake — see `@/lib/projects/delete-policy`.
 */
export default async function RemoveProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireOfficer({ capability: 'content:write', returnTo: `/admin/projects/${id}/remove` })

  const project = await getAdminClient().fetch(ADMIN_PROJECT_BY_ID_QUERY, { id })

  if (!project) notFound()

  const policy = projectRemovalPolicy({
    status: project.status,
    referenceCount: project.referenceCount,
    hasWork: hasProjectWork(project),
  })

  return (
    <>
      <AdminPageHeader
        description="Archiving keeps the record. Deleting does not."
        kicker="Projects"
        title="Remove project"
      />

      <div className="flex max-w-2xl flex-col gap-5 px-4 py-6 sm:px-6">
        <section className="border-rule-card flex flex-col gap-2 rounded-lg border bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-ink text-[15px] font-semibold">
              {project.name ?? 'Untitled project'}
            </h2>
            <ProjectStatusBadge status={project.status} />
          </div>
          {project.shortDescription ? (
            <p className="text-ink-soft text-[13px] leading-relaxed">{project.shortDescription}</p>
          ) : null}
          {project.referenceCount > 0 ? (
            <p className="text-ink-body text-[13px]">
              {project.referenceCount} other{' '}
              {project.referenceCount === 1 ? 'document links' : 'documents link'} to this project.
            </p>
          ) : null}
        </section>

        <RemoveProjectForms
          blockedReason={policy.blockedReason}
          canArchive={policy.canArchive}
          canHardDelete={policy.canHardDelete}
          projectId={project._id}
          projectName={project.name ?? 'Untitled project'}
        />

        <Link
          className={cn(buttonVariants({ variant: 'ghost' }), 'self-start')}
          href="/admin/projects"
        >
          Back to projects
        </Link>
      </div>
    </>
  )
}
