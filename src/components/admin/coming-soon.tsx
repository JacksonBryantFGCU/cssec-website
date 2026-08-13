import Link from 'next/link'

import { AdminPageHeader } from './admin-page-header'

/**
 * Placeholder for a module whose management screens arrive in a later phase.
 *
 * It exists so the navigation is complete and nothing dead-ends, and it is
 * honest about what it is: no fake buttons, and a working route to the Studio,
 * where this content can genuinely be edited today.
 */
export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <>
      <AdminPageHeader description={description} title={title} />
      <div className="px-6 py-6">
        <div className="flex max-w-2xl flex-col gap-3 rounded-lg border border-dashed p-6">
          <p className="font-medium">Managed in the Advanced CMS for now</p>
          <p className="text-muted-foreground text-sm">
            {title} can be created and edited today in Sanity Studio. A dedicated screen here will
            follow the same pattern as Events in a later phase.
          </p>
          <Link
            className="text-sm underline underline-offset-4"
            href="/studio"
            rel="noreferrer"
            target="_blank"
          >
            Open Advanced CMS
          </Link>
        </div>
      </div>
    </>
  )
}
