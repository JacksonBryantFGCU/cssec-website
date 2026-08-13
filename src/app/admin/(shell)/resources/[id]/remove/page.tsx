import Link from 'next/link'
import { notFound } from 'next/navigation'

import { requireOfficer } from '@/auth/require-officer'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { MetaBadge } from '@/components/admin/status-badge'
import { buttonVariants } from '@/components/ui/button'
import { resourceRemovalPolicy } from '@/lib/resources/delete-policy'
import { cn } from '@/lib/utils'
import { getAdminClient } from '@/sanity/lib/admin-client'
import { ADMIN_RESOURCE_BY_ID_QUERY } from '@/sanity/queries/admin'
import { RESOURCE_TYPES, titleForValue } from '@/sanity/schemaTypes/shared/options'

import { RemoveResourceForms } from './remove-forms'

export const metadata = { title: 'Delete resource' }

/**
 * The one place a resource can be deleted.
 *
 * The card below is deliberately preceded by the alternatives, because the two
 * most common reasons an officer arrives here — a dead link, or material that
 * feels out of date — are both better answered by an edit. A workshop's slides
 * from two years ago are still evidence the workshop happened.
 */
export default async function RemoveResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireOfficer({ capability: 'content:write', returnTo: `/admin/resources/${id}/remove` })

  const resource = await getAdminClient().fetch(ADMIN_RESOURCE_BY_ID_QUERY, { id })

  if (!resource) notFound()

  const policy = resourceRemovalPolicy({
    referenceCount: resource.referenceCount,
    relatedByCount: resource.relatedByCount,
  })

  return (
    <>
      <AdminPageHeader
        description="Deleting is permanent. Most reasons for being here are better fixed by an edit."
        kicker="Resources"
        title="Delete resource"
      />

      <div className="flex max-w-2xl flex-col gap-5 px-4 py-6 sm:px-6">
        <section className="border-rule-card flex flex-col gap-2 rounded-lg border bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-ink text-[15px] font-semibold">
              {resource.title ?? 'Untitled resource'}
            </h2>
            <MetaBadge>
              {titleForValue(RESOURCE_TYPES, resource.resourceType) ?? 'Resource'}
            </MetaBadge>
          </div>
          {resource.description ? (
            <p className="text-ink-soft text-[13px] leading-relaxed">{resource.description}</p>
          ) : null}
        </section>

        <section className="border-rule bg-paper-warm flex flex-col gap-2 rounded-lg border p-4">
          <h2 className="text-ink-label font-mono text-[10.5px] tracking-[0.16em] uppercase">
            Before you delete
          </h2>
          <ul className="text-ink-body flex list-disc flex-col gap-1 pl-5 text-[13px] leading-relaxed">
            <li>
              If the link has died, <Link className="text-club-link font-medium underline underline-offset-4" href={`/admin/resources/${resource._id}/edit`}>edit the resource</Link>{' '}
              and point it somewhere new, or attach the file. The record of the session stays useful
              either way.
            </li>
            <li>
              If it is simply old, clear the “Feature in the resource library” checkbox instead — it
              stops being promoted without disappearing.
            </li>
          </ul>
        </section>

        <RemoveResourceForms
          blockedReason={policy.blockedReason}
          canHardDelete={policy.canHardDelete}
          resourceId={resource._id}
          resourceTitle={resource.title ?? 'Untitled resource'}
        />

        <Link
          className={cn(buttonVariants({ variant: 'ghost' }), 'self-start')}
          href="/admin/resources"
        >
          Back to resources
        </Link>
      </div>
    </>
  )
}
