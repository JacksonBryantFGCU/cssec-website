import Link from 'next/link'
import { notFound } from 'next/navigation'

import { requireOfficer } from '@/auth/require-officer'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { MetaBadge } from '@/components/admin/status-badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getAdminClient } from '@/sanity/lib/admin-client'
import { ADMIN_OFFICER_TERM_BY_ID_QUERY } from '@/sanity/queries/admin'

import { RemoveOfficerTermForms } from './remove-forms'

export const metadata = { title: 'Remove officer term' }

export default async function RemoveOfficerTermPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireOfficer({
    capability: 'officers:manage',
    returnTo: `/admin/people/officers/${id}/remove`,
  })

  const term = await getAdminClient().fetch(ADMIN_OFFICER_TERM_BY_ID_QUERY, { id })

  if (!term) notFound()

  return (
    <>
      <AdminPageHeader
        description="Ending a term keeps the history. Deleting it does not."
        kicker="Officer terms"
        title="Remove officer term"
      />

      <div className="flex max-w-2xl flex-col gap-5 px-4 py-6 sm:px-6">
        <section className="border-rule-card flex flex-col gap-2 rounded-lg border bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-ink text-[15px] font-semibold">{term.position ?? 'Officer'}</h2>
            <MetaBadge>{term.term ?? 'Unknown year'}</MetaBadge>
            <MetaBadge>{term.isCurrent ? 'Current' : 'Past'}</MetaBadge>
          </div>
          <p className="text-ink-soft font-mono text-[11.5px]">
            {term.personName ?? 'Person no longer exists'}
          </p>
        </section>

        <RemoveOfficerTermForms
          isCurrent={Boolean(term.isCurrent)}
          termId={term._id}
          termName={term.position ?? 'Officer'}
        />

        <Link
          className={cn(buttonVariants({ variant: 'ghost' }), 'self-start')}
          href="/admin/people/officers"
        >
          Back to officer terms
        </Link>
      </div>
    </>
  )
}
