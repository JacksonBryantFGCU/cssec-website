import Link from 'next/link'

import { siteButton } from '@/components/site/button'
import { EmptyState } from '@/components/site/primitives'

/**
 * The public 404.
 *
 * Inside the `(public)` route group so a missing event still arrives inside
 * the site shell — header, footer, navigation — rather than on a bare page.
 * It says nothing about why the document is missing: an unpublished draft and
 * a typo look identical from out here, which is the intended behaviour.
 */
export default function NotFound() {
  return (
    <div className="px-4 py-12 sm:px-7 sm:py-16">
      <EmptyState
        actions={
          <>
            <Link className={siteButton({ variant: 'secondary', size: 'sm' })} href="/">
              Go to the homepage
            </Link>
            <Link className={siteButton({ variant: 'outline', size: 'sm' })} href="/events">
              Browse events
            </Link>
          </>
        }
        body="The page you asked for is not here. It may have moved, or it may never have been published."
        className="mx-auto max-w-[640px] bg-white"
        kicker="404 — NOT FOUND"
        title="We could not find that page"
      />
    </div>
  )
}
