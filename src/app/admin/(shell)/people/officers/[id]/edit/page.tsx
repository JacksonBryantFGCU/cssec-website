import Link from 'next/link'
import { notFound } from 'next/navigation'

import { requireOfficer } from '@/auth/require-officer'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { buttonVariants } from '@/components/ui/button'
import { officerTermToFormValues } from '@/lib/people/form-values'
import { cn } from '@/lib/utils'
import { getAdminClient } from '@/sanity/lib/admin-client'
import { ADMIN_OFFICER_TERM_BY_ID_QUERY, ADMIN_PEOPLE_OPTIONS_QUERY } from '@/sanity/queries/admin'

import { updateOfficerTerm } from '../../../actions'
import { OfficerTermForm } from '../../officer-term-form'

export const metadata = { title: 'Edit officer term' }

export default async function EditOfficerTermPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireOfficer({
    capability: 'officers:manage',
    returnTo: `/admin/people/officers/${id}/edit`,
  })

  const sanity = getAdminClient()

  const [term, people] = await Promise.all([
    sanity.fetch(ADMIN_OFFICER_TERM_BY_ID_QUERY, { id }),
    sanity.fetch(ADMIN_PEOPLE_OPTIONS_QUERY),
  ])

  if (!term) notFound()

  return (
    <>
      <AdminPageHeader
        actions={
          <Link
            className={cn(buttonVariants({ variant: 'outline' }))}
            href={`/admin/people/officers/${term._id}/remove`}
          >
            End or delete
          </Link>
        }
        description={
          [term.personName, term.position, term.term].filter(Boolean).join(' · ') || undefined
        }
        kicker="Officer terms"
        title="Edit officer term"
      />
      <OfficerTermForm
        action={updateOfficerTerm}
        cancelHref="/admin/people/officers"
        defaults={officerTermToFormValues(term)}
        people={people.flatMap((person) =>
          person.name ? [{ _id: person._id, label: person.name }] : [],
        )}
        submitLabel="Save changes"
        termId={term._id}
      />
    </>
  )
}
