import Link from 'next/link'
import { notFound } from 'next/navigation'

import { requireOfficer } from '@/auth/require-officer'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { buttonVariants } from '@/components/ui/button'
import { personToFormValues } from '@/lib/people/form-values'
import { cn } from '@/lib/utils'
import { getAdminClient } from '@/sanity/lib/admin-client'
import { ADMIN_PERSON_BY_ID_QUERY } from '@/sanity/queries/admin'

import { updatePerson } from '../../actions'
import { PersonForm } from '../../person-form'

export const metadata = { title: 'Edit person' }

export default async function EditPersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireOfficer({ capability: 'content:write', returnTo: `/admin/people/${id}/edit` })

  const person = await getAdminClient().fetch(ADMIN_PERSON_BY_ID_QUERY, { id })

  if (!person) notFound()

  return (
    <>
      <AdminPageHeader
        actions={
          <Link
            className={cn(buttonVariants({ variant: 'outline' }))}
            href={`/admin/people/${person._id}/remove`}
          >
            Remove
          </Link>
        }
        description={
          person.referenceCount > 0
            ? `Credited in ${person.referenceCount} ${person.referenceCount === 1 ? 'place' : 'places'} on the site — a rename updates all of them.`
            : (person.name ?? undefined)
        }
        kicker="People"
        title="Edit person"
      />
      <PersonForm
        action={updatePerson}
        cancelHref="/admin/people"
        defaults={personToFormValues(person)}
        personId={person._id}
        photo={
          person.photoUrl
            ? { label: person.photoAlt || 'Current photo', href: person.photoUrl }
            : null
        }
        submitLabel="Save changes"
      />
    </>
  )
}
