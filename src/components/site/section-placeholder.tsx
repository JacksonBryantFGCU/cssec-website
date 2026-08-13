import Link from 'next/link'

import { siteButton } from './button'
import { EmptyState } from './primitives'

/**
 * The early state for a section whose full index is still being built.
 *
 * These routes exist because the approved navigation links to them, and a nav
 * item that 404s is worse than one that explains itself. Each page states
 * plainly what is coming and sends the reader to the part of the site that is
 * finished, in the site's own visual language rather than as a bare "coming
 * soon" line.
 */
export function SectionPlaceholder({
  title,
  standfirst,
  emptyTitle,
  emptyBody,
  action,
}: {
  title: string
  standfirst: string
  emptyTitle: string
  emptyBody: string
  action?: React.ReactNode
}) {
  return (
    <>
      <div className="bg-navy border-navy-line text-navy-fg border-b px-4 py-6 sm:px-7 sm:py-[30px]">
        <div className="flex max-w-[640px] flex-col gap-2 sm:gap-[9px]">
          <h1 className="font-display m-0 text-[27px] font-semibold tracking-[-0.025em] sm:text-[34px]">
            {title}
          </h1>
          <p className="text-navy-body font-serif text-[18px] leading-[1.5] sm:text-[20px]">
            {standfirst}
          </p>
        </div>
      </div>

      <div className="px-4 py-10 sm:px-7 sm:py-14">
        <EmptyState
          actions={
            <>
              {action}
              <Link className={siteButton({ variant: 'outline', size: 'sm' })} href="/events">
                Browse events
              </Link>
            </>
          }
          body={emptyBody}
          className="mx-auto max-w-[720px] bg-white"
          kicker="IN PROGRESS"
          title={emptyTitle}
        />
      </div>
    </>
  )
}
