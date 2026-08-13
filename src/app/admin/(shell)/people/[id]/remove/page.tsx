import Link from 'next/link'
import { notFound } from 'next/navigation'

import { requireOfficer } from '@/auth/require-officer'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { buttonVariants } from '@/components/ui/button'
import { personRemovalPolicy, personUsageGroups } from '@/lib/people/delete-policy'
import { cn } from '@/lib/utils'
import { getAdminClient } from '@/sanity/lib/admin-client'
import { ADMIN_PERSON_BY_ID_QUERY, ADMIN_PERSON_USAGE_QUERY } from '@/sanity/queries/admin'

import { RemovePersonForms } from './remove-forms'

export const metadata = { title: 'Remove person' }

/**
 * The one place a person record can be deleted.
 *
 * Most of this screen is the usage list, not the delete button. A person is the
 * hub every credit on the site points at, so the useful question is never "are
 * you sure?" — it is "here is everywhere this name appears, and here is where
 * to go and change it".
 */
export default async function RemovePersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireOfficer({ capability: 'content:write', returnTo: `/admin/people/${id}/remove` })

  const sanity = getAdminClient()

  const [person, usage] = await Promise.all([
    sanity.fetch(ADMIN_PERSON_BY_ID_QUERY, { id }),
    sanity.fetch(ADMIN_PERSON_USAGE_QUERY, { id }),
  ])

  if (!person || !usage) notFound()

  const groups = personUsageGroups(usage)
  const policy = personRemovalPolicy(usage)

  return (
    <>
      <AdminPageHeader
        description="Deleting a person removes them from every credit at once."
        kicker="People"
        title="Remove person"
      />

      <div className="flex max-w-2xl flex-col gap-5 px-4 py-6 sm:px-6">
        <section className="border-rule-card flex flex-col gap-2 rounded-lg border bg-white p-4">
          <h2 className="text-ink text-[15px] font-semibold">{person.name ?? 'Unnamed person'}</h2>
          {person.shortBio ? (
            <p className="text-ink-soft text-[13px] leading-relaxed">{person.shortBio}</p>
          ) : null}
        </section>

        <section className="border-rule-card flex flex-col gap-3 rounded-lg border bg-white p-4">
          <h2 className="text-ink-label font-mono text-[10.5px] tracking-[0.16em] uppercase">
            Where this person is used
          </h2>

          {groups.length === 0 ? (
            <p className="text-ink-soft text-[13px]">
              <span aria-hidden="true" className="text-club-link">
                ✓
              </span>{' '}
              Nothing on the website credits this person, so removing them changes nothing else.
            </p>
          ) : (
            <ul className="divide-rule divide-y">
              {groups.map((group) => (
                <li className="flex flex-col gap-1 py-2.5 first:pt-0 last:pb-0" key={group.role}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-ink text-[13.5px] font-semibold">{group.role}</p>
                    <Link
                      className="text-club-link hover:text-club-link-hover text-[12.5px] font-semibold hover:underline"
                      href={group.href}
                    >
                      Go and edit →
                    </Link>
                  </div>
                  <ul className="text-ink-soft flex list-disc flex-col gap-0.5 pl-5 text-[12.5px]">
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </section>

        <RemovePersonForms
          blockedReason={policy.blockedReason}
          canHardDelete={policy.canHardDelete}
          personId={person._id}
          personName={person.name ?? 'Unnamed person'}
        />

        <Link className={cn(buttonVariants({ variant: 'ghost' }), 'self-start')} href="/admin/people">
          Back to people
        </Link>
      </div>
    </>
  )
}
