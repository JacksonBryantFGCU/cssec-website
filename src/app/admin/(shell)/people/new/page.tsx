import { requireOfficer } from '@/auth/require-officer'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { NEW_PERSON_VALUES } from '@/lib/people/form-values'

import { createPerson } from '../actions'
import { PersonForm } from '../person-form'

export const metadata = { title: 'Add person' }

export default async function NewPersonPage() {
  await requireOfficer({ capability: 'content:write', returnTo: '/admin/people/new' })

  return (
    <>
      <AdminPageHeader
        description="A website record, so this person can be credited without being typed in again."
        kicker="People"
        title="Add person"
      />
      <PersonForm
        action={createPerson}
        cancelHref="/admin/people"
        defaults={NEW_PERSON_VALUES}
        submitLabel="Add person"
      />
    </>
  )
}
