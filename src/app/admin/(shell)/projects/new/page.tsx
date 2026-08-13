import { requireOfficer } from '@/auth/require-officer'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { NEW_PROJECT_VALUES } from '@/lib/projects/form-values'
import { getAdminClient } from '@/sanity/lib/admin-client'
import { ADMIN_PEOPLE_OPTIONS_QUERY } from '@/sanity/queries/admin'

import { createProject } from '../actions'
import { ProjectForm } from '../project-form'

export const metadata = { title: 'New project' }

export default async function NewProjectPage() {
  await requireOfficer({ capability: 'content:write', returnTo: '/admin/projects/new' })

  const people = await getAdminClient().fetch(ADMIN_PEOPLE_OPTIONS_QUERY)

  return (
    <>
      <AdminPageHeader
        description="It appears on the public projects page as soon as you save."
        kicker="Projects"
        title="Create project"
      />
      <ProjectForm
        action={createProject}
        cancelHref="/admin/projects"
        defaults={NEW_PROJECT_VALUES}
        openRoles={[]}
        people={people.flatMap((person) =>
          person.name ? [{ _id: person._id, label: person.name }] : [],
        )}
        submitLabel="Create project"
      />
    </>
  )
}
