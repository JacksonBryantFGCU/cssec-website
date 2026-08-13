import { resourceKindLabel, resourceLink } from '@/lib/resources/link'

/**
 * The materials attached to a finished session.
 *
 * This is what turns an event page into a permanent archive entry: after the
 * meeting, the same URL carries the slides, the recording and the repositories.
 * Rendered as a ruled table for the same reason the archive is — these are
 * comparable things and the kind column is what you scan.
 */
export type MaterialItem = {
  _id: string
  title?: string | null
  slug?: string | null
  resourceType?: string | null
  description?: string | null
  fileUrl?: string | null
  githubUrl?: string | null
  externalUrl?: string | null
}

export function MaterialsList({ materials }: { materials: MaterialItem[] }) {
  return (
    <ul>
      {materials.map((material) => {
        const link = resourceLink(material)

        const row = (
          <>
            <span className="text-club-link font-mono text-[11px] tracking-[0.1em]">
              {resourceKindLabel(material.resourceType)}
            </span>
            <span className="text-ink text-[14.5px] font-semibold sm:text-[15px]">
              {material.title}
              {material.description ? (
                <span className="text-ink-soft font-normal"> — {material.description}</span>
              ) : null}
            </span>
            {link ? (
              <span className="text-club-link text-[13.5px] font-semibold sm:text-right">
                {link.action}
              </span>
            ) : null}
          </>
        )

        return (
          <li
            className="border-rule border-b sm:grid sm:grid-cols-[150px_1fr_120px] sm:items-center sm:gap-5"
            key={material._id}
          >
            {link ? (
              <a
                className="flex min-h-11 flex-col gap-1.5 py-3.5 hover:bg-[#FAFBF9] sm:contents"
                download={link.download || undefined}
                href={link.href}
                rel={link.external ? 'noreferrer noopener' : undefined}
                target={link.external ? '_blank' : undefined}
              >
                {row}
              </a>
            ) : (
              <div className="flex flex-col gap-1.5 py-3.5 sm:contents">{row}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
