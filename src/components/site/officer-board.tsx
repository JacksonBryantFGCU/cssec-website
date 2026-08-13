import { PersonAvatar } from './person-avatar'
import type { FacultyAdvisor } from './site-links'
import type { SanityImageValue } from '@/sanity/lib/image'
import type { CURRENT_OFFICERS_QUERY_RESULT } from '@/sanity/types'

/**
 * "Who runs it" — the current officer board.
 *
 * Reads `officerRole` documents where `isCurrent` is true, joined to the person
 * they name. Past terms are deliberately absent: they are kept in Sanity as the
 * club's leadership history and are a matter for `/admin`, not for the page a
 * prospective member reads to find out who to talk to.
 *
 * The approved design shows a name, a position and one line about the person,
 * and does not link out to anyone's GitHub or LinkedIn — so neither does this,
 * even though the schema carries them. A portrait is the one addition: the
 * design predates the photo field, and a face makes a board of five strangers
 * approachable in a way a list of names does not.
 */
export type OfficerTerm = CURRENT_OFFICERS_QUERY_RESULT[number]

/** One row: portrait, name and position, and the short bio underneath. */
function BoardMember({
  name,
  position,
  note,
  photo,
}: {
  name: string
  position: string | null
  note: string | null
  photo: SanityImageValue
}) {
  return (
    <li className="border-rule flex gap-3.5 border-b py-3.5 last:border-b-0 sm:gap-4">
      <PersonAvatar name={name} photo={photo} size={52} />
      <div className="flex min-w-0 flex-col gap-1 pt-0.5">
        <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
          <span className="text-ink text-[15px] font-semibold">{name}</span>
          {position ? (
            <span className="text-ink-label font-mono text-[10.5px] tracking-[0.12em] uppercase">
              {position}
            </span>
          ) : null}
        </p>
        {note ? (
          <p className="text-ink-soft text-[13.5px] leading-relaxed">{note}</p>
        ) : null}
      </div>
    </li>
  )
}

export function OfficerBoard({
  officers,
  advisor,
}: {
  officers: OfficerTerm[]
  advisor: FacultyAdvisor | null
}) {
  // A term whose person reference has been emptied cannot be rendered as a
  // card without inventing a name, so it is skipped rather than shown broken.
  const board = officers.filter((term) => term.person?.name)

  // The website has to work before anyone has filled the board in. This is the
  // quiet version of that: one sentence, no dashed empty-state box, because a
  // prominent "no officers" panel would read as though the club had none.
  if (board.length === 0 && !advisor) {
    return (
      <p className="text-ink-soft mt-4 text-[14.5px] leading-relaxed">
        The officer board for this year is being published shortly. In the meantime, an officer
        will answer in Discord or by email.
      </p>
    )
  }

  return (
    <>
      <ul className="mt-4 flex flex-col">
        {board.map((term) => (
          <BoardMember
            key={term._id}
            name={term.person!.name!}
            note={term.person!.shortBio}
            photo={term.person!.photo}
            position={term.position}
          />
        ))}

        {/* The advisor is not an elected officer and holds no term, so they are
            listed after the board and labelled rather than folded into it. */}
        {advisor ? (
          <BoardMember
            name={advisor.name}
            note={advisor.shortBio}
            photo={advisor.photo}
            position="Faculty advisor"
          />
        ) : null}
      </ul>

      <p className="text-ink-faint mt-3.5 text-[13px] leading-relaxed">
        Officer elections are held every April. Anyone who has been to a few meetings can run.
      </p>
    </>
  )
}
