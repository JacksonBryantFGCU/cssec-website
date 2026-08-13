import Link from 'next/link'

import { formatClubDateLong } from '@/lib/time'
import { resourceLink } from '@/lib/resources/link'
import {
  resourceLevelLabel,
  resourceTypeLabel,
  sourceEventLabel,
} from '@/lib/resources/view-model'

/**
 * The library's ruled index.
 *
 * Three columns on desktop — title and source, type, level — and stacked rows
 * below `md`, using `md:contents` so one list produces both layouts without
 * duplicating the markup. Rows, not cards: the archive is scanned for one
 * specific thing, and comparable rows scan far better than tiles.
 */

export type ResourceRowData = {
  _id: string
  title?: string | null
  slug?: string | null
  resourceType?: string | null
  description?: string | null
  experienceLevel?: string | null
  fileUrl?: string | null
  githubUrl?: string | null
  externalUrl?: string | null
  event?: { title?: string | null; slug?: string | null; startsAt?: string | null } | null
}

export function ResourceArchiveTable({ resources }: { resources: ResourceRowData[] }) {
  return (
    <div className="md:grid md:grid-cols-[1fr_130px_118px] md:gap-[18px]">
      <div
        aria-hidden="true"
        className="text-ink-label hidden border-b border-[#11201B] pb-2.5 font-mono text-[10px] tracking-[0.14em] md:contents"
      >
        <span className="border-b border-[#11201B] pb-2.5">TITLE &amp; SOURCE</span>
        <span className="border-b border-[#11201B] pb-2.5">TYPE</span>
        <span className="border-b border-[#11201B] pb-2.5">LEVEL</span>
      </div>

      <ul className="md:contents">
        {resources.map((resource) => {
          const source = sourceEventLabel(resource, formatClubDateLong)
          // Falls back to the library page when there is no artefact to open,
          // so a row is never a dead end.
          const target = resourceLink(resource)
          const href = resource.slug ? `/resources/${resource.slug}` : target?.href

          const body = (
            <>
              <span className="flex flex-col gap-[3px] py-3.5 md:border-b md:border-[#E2E0D6]">
                <span className="flex items-baseline gap-2 md:hidden">
                  <span className="text-ink-muted font-mono text-[10px]">
                    {resourceTypeLabel(resource.resourceType).toUpperCase()}
                  </span>
                  <span className="text-ink-label text-[12.5px]">
                    {resourceLevelLabel(resource.experienceLevel)}
                  </span>
                </span>
                <span className="text-ink text-[15px] font-semibold sm:text-[15.5px]">
                  {resource.title}
                </span>
                {resource.description ? (
                  <span className="text-ink-soft text-[13px] leading-snug">
                    {resource.description}
                  </span>
                ) : null}
                {source ? (
                  <span className="text-club-link text-[12.5px] font-medium">From: {source}</span>
                ) : null}
              </span>

              <span className="text-ink-muted hidden items-center py-3.5 font-mono text-[11px] md:flex md:border-b md:border-[#E2E0D6]">
                {resourceTypeLabel(resource.resourceType)}
              </span>
              <span className="text-ink-muted hidden items-center py-3.5 text-[13px] md:flex md:border-b md:border-[#E2E0D6]">
                {resourceLevelLabel(resource.experienceLevel)}
              </span>
            </>
          )

          return (
            <li
              className="border-t border-[#E2E0D6] first:border-t-0 md:contents"
              key={resource._id}
            >
              {href ? (
                <Link
                  className="hover:bg-paper grid min-h-11 transition-colors md:contents"
                  href={href}
                >
                  {body}
                </Link>
              ) : (
                <div className="grid md:contents">{body}</div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
