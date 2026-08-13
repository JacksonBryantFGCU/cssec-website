import Link from 'next/link'

import { requireOfficer } from '@/auth/require-officer'
import { AdminPageHeader, AdminSection } from '@/components/admin/admin-page-header'
import { EmptyState } from '@/components/admin/empty-state'
import { SavedNotice } from '@/components/admin/filter-tabs'
import { MetaBadge } from '@/components/admin/status-badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getAdminClient } from '@/sanity/lib/admin-client'
import { ADMIN_OFFICER_TERMS_QUERY } from '@/sanity/queries/admin'

export const metadata = { title: 'Officer terms' }

const SAVED_MESSAGES: Record<string, string> = {
  created: 'Officer term added.',
  updated: 'Changes saved.',
  ended: 'Term ended. It stays on record as part of the club’s leadership history.',
  deleted: 'Officer term deleted.',
}

/**
 * Leadership, current and historical.
 *
 * The split into two lists is the whole model made visible: the club has one
 * current board, and an unbounded record of every board before it. A handover
 * adds terms to the top list and moves last year's into the bottom one — it
 * never edits a person, and it never overwrites a previous term.
 *
 * Gated on `officers:manage`, which only `admin` holds. Getting this wrong
 * misstates who runs the club, and the historical record is what the next
 * president inherits.
 */
export default async function AdminOfficerTermsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireOfficer({ capability: 'officers:manage', returnTo: '/admin/people/officers' })

  const params = await searchParams
  const saved = typeof params.saved === 'string' ? SAVED_MESSAGES[params.saved] : undefined
  const savedTitle = typeof params.title === 'string' ? params.title : undefined

  const terms = await getAdminClient().fetch(ADMIN_OFFICER_TERMS_QUERY)

  const current = terms.filter((term) => term.isCurrent)
  const past = terms.filter((term) => !term.isCurrent)

  const row = (term: (typeof terms)[number]) => (
    <li
      className="hover:bg-paper-warm flex flex-col gap-3 px-4 py-3.5 transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-6"
      key={term._id}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            className="text-ink text-[14.5px] font-semibold underline-offset-4 hover:underline"
            href={`/admin/people/officers/${term._id}/edit`}
          >
            {term.position ?? 'Officer'}
          </Link>
          <MetaBadge>{term.term ?? 'Unknown year'}</MetaBadge>
        </div>
        <p className="text-ink-soft font-mono text-[11.5px]">
          {term.personName ?? 'Person no longer exists'}
          {typeof term.displayOrder === 'number' ? ` · order ${term.displayOrder}` : ''}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Link
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          href={`/admin/people/officers/${term._id}/edit`}
        >
          Edit
          <span className="sr-only">
            {' '}
            {term.position ?? 'term'} {term.term ?? ''}
          </span>
        </Link>
        <Link
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
          href={`/admin/people/officers/${term._id}/remove`}
        >
          Remove
          <span className="sr-only">
            {' '}
            {term.position ?? 'term'} {term.term ?? ''}
          </span>
        </Link>
      </div>
    </li>
  )

  return (
    <>
      <AdminPageHeader
        actions={
          <>
            <Link className={cn(buttonVariants({ variant: 'ghost' }))} href="/admin/people">
              All people
            </Link>
            <Link className={cn(buttonVariants())} href="/admin/people/officers/new">
              Add officer term
            </Link>
          </>
        }
        description="Who holds which position, for which academic year. Past terms are kept as the club’s leadership history."
        kicker="Club"
        title="Officer terms"
      />

      <div className="flex flex-col gap-8 px-4 py-6 sm:px-6">
        <SavedNotice detail={savedTitle} message={saved} />

        <aside className="border-rule bg-paper-warm text-ink-body flex flex-col gap-1 rounded-lg border px-4 py-3 text-[12.5px] leading-relaxed">
          <p className="text-ink-label font-mono text-[10.5px] tracking-[0.16em] uppercase">
            Handing over
          </p>
          <p>
            Add a term for each incoming officer, then end the outgoing ones. Ending a term keeps
            the record and takes it off the public leadership list. None of this affects who can
            sign in to this admin — that is granted separately in Clerk.
          </p>
        </aside>

        <AdminSection
          action={
            <Link
              className="text-club-link hover:text-club-link-hover text-[13px] font-semibold hover:underline"
              href="/admin/people/officers/new"
            >
              Add a term →
            </Link>
          }
          id="current"
          title="Current board"
        >
          {current.length === 0 ? (
            <EmptyState
              action={
                <Link
                  className={cn(buttonVariants({ size: 'sm' }))}
                  href="/admin/people/officers/new"
                >
                  Add the first officer
                </Link>
              }
              description="The public leadership list is built from current terms, so it is empty until one is added."
              kicker="Nobody serving"
              title="No current officers"
            />
          ) : (
            <ul className="border-rule-card divide-rule divide-y rounded-lg border bg-white">
              {current.map(row)}
            </ul>
          )}
        </AdminSection>

        <AdminSection id="past" title="Past terms">
          {past.length === 0 ? (
            <p className="border-rule-dashed bg-paper-warm text-ink-soft rounded-lg border border-dashed px-4 py-5 text-center text-[13px]">
              No past terms yet. Ended terms collect here rather than being deleted.
            </p>
          ) : (
            <ul className="border-rule-card divide-rule divide-y rounded-lg border bg-white">
              {past.map(row)}
            </ul>
          )}
        </AdminSection>
      </div>
    </>
  )
}
