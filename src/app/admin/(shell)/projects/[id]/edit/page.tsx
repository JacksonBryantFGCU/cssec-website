import Link from 'next/link'
import { notFound } from 'next/navigation'

import { requireOfficer } from '@/auth/require-officer'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { buttonVariants } from '@/components/ui/button'
import { projectToFormValues, projectToOpenRoleRows } from '@/lib/projects/form-values'
import { cn } from '@/lib/utils'
import { getAdminClient } from '@/sanity/lib/admin-client'
import { ADMIN_PEOPLE_OPTIONS_QUERY, ADMIN_PROJECT_BY_ID_QUERY } from '@/sanity/queries/admin'

import { updateProject } from '../../actions'
import { ProjectForm } from '../../project-form'

export const metadata = { title: 'Edit project' }

/**
 * Editing is keyed by Sanity document id, not slug.
 *
 * The slug is derived from the name and changes when the name does, so an
 * id-based URL is the one that keeps working — and a stale bookmark cannot
 * silently open the wrong project.
 */
export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireOfficer({ capability: 'content:write', returnTo: `/admin/projects/${id}/edit` })

  const sanity = getAdminClient()

  const [project, people] = await Promise.all([
    sanity.fetch(ADMIN_PROJECT_BY_ID_QUERY, { id }),
    sanity.fetch(ADMIN_PEOPLE_OPTIONS_QUERY),
  ])

  // Covers a deleted project and a mistyped id alike.
  if (!project) notFound()

  return (
    <>
      <AdminPageHeader
        actions={
          <>
            {project.slug ? (
              <a
                className={cn(buttonVariants({ variant: 'ghost' }))}
                href={`/projects/${project.slug}`}
                rel="noreferrer"
                target="_blank"
              >
                View<span aria-hidden="true"> ↗</span>
                <span className="sr-only"> on the website (opens in a new tab)</span>
              </a>
            ) : null}
            <Link
              className={cn(buttonVariants({ variant: 'outline' }))}
              href={`/admin/projects/${project._id}/remove`}
            >
              Archive or delete
            </Link>
          </>
        }
        description={project.name ?? undefined}
        kicker="Projects"
        title="Edit project"
      />
      <ProjectForm
        action={updateProject}
        cancelHref="/admin/projects"
        coverImage={
          project.coverImageUrl
            ? { label: project.coverImageAlt || 'Current cover image', href: project.coverImageUrl }
            : null
        }
        defaults={projectToFormValues(project)}
        openRoles={projectToOpenRoleRows(project)}
        people={people.flatMap((person) =>
          person.name ? [{ _id: person._id, label: person.name }] : [],
        )}
        projectId={project._id}
        screenshotCount={project.screenshotCount}
        submitLabel="Save changes"
      />
    </>
  )
}
