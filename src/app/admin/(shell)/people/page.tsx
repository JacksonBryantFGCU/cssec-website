import Link from 'next/link'

import { can } from '@/auth/permissions'
import { requireOfficer } from '@/auth/require-officer'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { EmptyState } from '@/components/admin/empty-state'
import { SavedNotice } from '@/components/admin/filter-tabs'
import { MetaBadge } from '@/components/admin/status-badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getAdminClient } from '@/sanity/lib/admin-client'
import { ADMIN_PEOPLE_QUERY } from '@/sanity/queries/admin'

export const metadata = { title: 'People' }

const SAVED_MESSAGES: Record<string, string> = {
  created: 'Person added.',
  updated: 'Changes saved.',
  deleted: 'Person deleted.',
}

/**
 * The people index.
 *
 * Two things it goes out of its way to say, because both are easy to get wrong:
 *
 * 1. These are **website records**, not accounts. The note at the top says so
 *    in as many words, and the officer-terms link beside it is where leadership
 *    is actually managed.
 * 2. Where each person is **used**. A name with "3 credits" beside it is the
 *    difference between an officer knowing they can safely rename someone and
 *    guessing.
 */
export default async function AdminPeoplePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const identity = await requireOfficer({ capability: 'content:write', returnTo: '/admin/people' })

  const params = await searchParams
  const saved = typeof params.saved === 'string' ? SAVED_MESSAGES[params.saved] : undefined
  const savedTitle = typeof params.title === 'string' ? params.title : undefined

  const people = await getAdminClient().fetch(ADMIN_PEOPLE_QUERY)

  const canManageOfficers = can(identity.role, 'officers:manage')

  return (
    <>
      <AdminPageHeader
        actions={
          <>
            {canManageOfficers ? (
              <Link
                className={cn(buttonVariants({ variant: 'outline' }))}
                href="/admin/people/officers"
              >
                Officer terms
              </Link>
            ) : null}
            <Link className={cn(buttonVariants())} href="/admin/people/new">
              Add person
            </Link>
          </>
        }
        description="The shared record of everyone credited on the website — officers, presenters, project leads and contributors."
        kicker="Club"
        title="People"
      />

      <div className="flex flex-col gap-4 px-4 py-6 sm:px-6">
        <SavedNotice detail={savedTitle} message={saved} />

        <aside className="border-rule bg-paper-warm text-ink-body flex flex-col gap-1 rounded-lg border px-4 py-3 text-[12.5px] leading-relaxed">
          <p className="text-ink-label font-mono text-[10.5px] tracking-[0.16em] uppercase">
            Website records, not logins
          </p>
          <p>
            Adding someone here puts them on the website. It does not give them access to this
            admin — that is granted separately in Clerk.
            {canManageOfficers ? (
              <>
                {' '}
                Who the club’s current leadership is lives under{' '}
                <Link
                  className="text-club-link font-medium underline underline-offset-4"
                  href="/admin/people/officers"
                >
                  officer terms
                </Link>
                .
              </>
            ) : null}
          </p>
        </aside>

        {people.length === 0 ? (
          <EmptyState
            action={
              <Link className={cn(buttonVariants())} href="/admin/people/new">
                Add the first person
              </Link>
            }
            description="Once someone is here they can be credited as a presenter, project lead, mentor or author without being typed in again."
            kicker="Nothing yet"
            title="No people yet"
          />
        ) : (
          <ul className="border-rule-card divide-rule divide-y rounded-lg border bg-white">
            {people.map((person) => {
              const positions = (person.currentPositions ?? []).filter(Boolean)

              return (
                <li
                  className="hover:bg-paper-warm flex flex-col gap-3 px-4 py-4 transition-colors sm:flex-row sm:items-start sm:justify-between sm:gap-6"
                  key={person._id}
                >
                  <div className="flex min-w-0 gap-3">
                    {/* Sanity serves the asset; a plain <img> keeps this list a
                        Server Component with no layout shift to manage. */}
                    {person.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt=""
                        className="border-rule size-10 shrink-0 rounded-full border object-cover"
                        src={`${person.photoUrl}?w=80&h=80&fit=crop&auto=format`}
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="border-rule text-ink-faint grid size-10 shrink-0 place-items-center rounded-full border bg-white font-mono text-[13px]"
                      >
                        {(person.name ?? '?').slice(0, 1).toUpperCase()}
                      </span>
                    )}

                    <div className="flex min-w-0 flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          className="text-ink text-[15px] font-semibold underline-offset-4 hover:underline"
                          href={`/admin/people/${person._id}/edit`}
                        >
                          {person.name ?? 'Unnamed person'}
                        </Link>
                        {positions.map((position) => (
                          <MetaBadge key={position}>{position}</MetaBadge>
                        ))}
                      </div>

                      <p className="text-ink-soft font-mono text-[11.5px]">
                        {person.referenceCount > 0
                          ? `Credited in ${person.referenceCount} ${person.referenceCount === 1 ? 'place' : 'places'}`
                          : 'Not credited anywhere yet'}
                        {person.email ? ` · ${person.email}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Link
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                      href={`/admin/people/${person._id}/edit`}
                    >
                      Edit<span className="sr-only"> {person.name ?? 'person'}</span>
                    </Link>
                    <Link
                      className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                      href={`/admin/people/${person._id}/remove`}
                    >
                      Remove<span className="sr-only"> {person.name ?? 'person'}</span>
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </>
  )
}
