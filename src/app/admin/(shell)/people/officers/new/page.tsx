import { requireOfficer } from '@/auth/require-officer'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { newOfficerTermValues } from '@/lib/people/form-values'
import { getAdminClient } from '@/sanity/lib/admin-client'
import { ADMIN_PEOPLE_OPTIONS_QUERY } from '@/sanity/queries/admin'

import { createOfficerTerm } from '../../actions'
import { OfficerTermForm } from '../officer-term-form'

export const metadata = { title: 'Add officer term' }

export default async function NewOfficerTermPage() {
  await requireOfficer({ capability: 'officers:manage', returnTo: '/admin/people/officers/new' })

  const people = await getAdminClient().fetch(ADMIN_PEOPLE_OPTIONS_QUERY)

  return (
    <>
      <AdminPageHeader
        description="One position, held by one person, for one academic year."
        kicker="Officer terms"
        title="Add officer term"
      />
      <OfficerTermForm
        action={createOfficerTerm}
        cancelHref="/admin/people/officers"
        defaults={newOfficerTermValues()}
        people={people.flatMap((person) =>
          person.name ? [{ _id: person._id, label: person.name }] : [],
        )}
        submitLabel="Add officer term"
      />
    </>
  )
}
