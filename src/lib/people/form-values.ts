import type { AdminFormValues } from '../admin/form-state.ts'

/** The bridge between stored people/officer-term documents and their forms. */

export type EditablePerson = {
  name?: string | null
  slug?: string | null
  shortBio?: string | null
  email?: string | null
  githubUrl?: string | null
  linkedinUrl?: string | null
  websiteUrl?: string | null
  photoAlt?: string | null
}

export type EditableOfficerTerm = {
  personId?: string | null
  position?: string | null
  term?: string | null
  isCurrent?: boolean | null
  displayOrder?: number | null
}

const checkbox = (value: boolean | null | undefined) => (value ? 'on' : '')

const text = (value: string | null | undefined) => value ?? ''

export const NEW_PERSON_VALUES: AdminFormValues = {
  name: '',
  slug: '',
  shortBio: '',
  email: '',
  githubUrl: '',
  linkedinUrl: '',
  websiteUrl: '',
  photoAlt: '',
}

export function personToFormValues(person: EditablePerson): AdminFormValues {
  return {
    name: text(person.name),
    slug: text(person.slug),
    shortBio: text(person.shortBio),
    email: text(person.email),
    githubUrl: text(person.githubUrl),
    linkedinUrl: text(person.linkedinUrl),
    websiteUrl: text(person.websiteUrl),
    photoAlt: text(person.photoAlt),
  }
}

/**
 * The academic year that runs across a given date, e.g. "2025–2026".
 *
 * The club's year starts with the fall semester, so anything from August
 * onwards belongs to the year that is beginning, and January to July belongs to
 * the year that is finishing. Used only as the *default* for a new term — an
 * officer can always type a different one.
 */
export function currentAcademicYear(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
  }).format(now)

  const [year, month] = parts.split('-').map(Number)
  const startYear = month >= 8 ? year : year - 1

  return `${startYear}–${startYear + 1}`
}

export function newOfficerTermValues(now: Date = new Date()): AdminFormValues {
  return {
    person: '',
    position: '',
    term: currentAcademicYear(now),
    // A term being added is almost always the one starting now.
    isCurrent: 'on',
    displayOrder: '100',
  }
}

export function officerTermToFormValues(term: EditableOfficerTerm): AdminFormValues {
  return {
    person: text(term.personId),
    position: text(term.position),
    term: text(term.term),
    isCurrent: checkbox(term.isCurrent),
    displayOrder: typeof term.displayOrder === 'number' ? String(term.displayOrder) : '100',
  }
}
