import type { AdminFormValues } from '../admin/form-state.ts'

/**
 * The bridge between a stored resource and the admin form.
 *
 * Calendar dates (`publishedAt`, `updatedAt`) are passed through untouched:
 * `<input type="date">` speaks the same `YYYY-MM-DD` Sanity stores, and routing
 * one through `Date` would move it a day — the Phase 5 bug.
 *
 * Pure and free of Sanity imports so it can be unit tested; the same shape is
 * echoed back by the Server Action after a rejected save.
 */

export type EditableResource = {
  title?: string | null
  slug?: string | null
  resourceType?: string | null
  description?: string | null
  topics?: Array<string | null> | null
  experienceLevel?: string | null
  featured?: boolean | null
  externalUrl?: string | null
  githubUrl?: string | null
  authorId?: string | null
  eventId?: string | null
  relatedResourceIds?: Array<string | null> | null
  publishedAt?: string | null
  updatedAt?: string | null
}

const checkbox = (value: boolean | null | undefined) => (value ? 'on' : '')

const text = (value: string | null | undefined) => value ?? ''

const ids = (value: Array<string | null> | null | undefined) =>
  (value ?? []).filter((id): id is string => typeof id === 'string')

const strings = (value: Array<string | null> | null | undefined) =>
  (value ?? []).filter((entry): entry is string => typeof entry === 'string' && entry.trim() !== '')

/** Today in club time, as the `YYYY-MM-DD` a date input wants. */
export function todayInClubTime(now: Date = new Date()): string {
  // `en-CA` formats as YYYY-MM-DD, which is exactly the Sanity `date` shape.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/**
 * Sensible starting point for a brand new resource.
 *
 * A function rather than a constant because it defaults the published date to
 * today, matching the Sanity schema's `initialValue`.
 */
export function newResourceValues(now: Date = new Date()): AdminFormValues {
  return {
    title: '',
    slug: '',
    resourceType: 'workshop',
    description: '',
    topics: '',
    experienceLevel: 'any',
    featured: '',
    externalUrl: '',
    githubUrl: '',
    author: '',
    event: '',
    relatedResources: [],
    publishedAt: todayInClubTime(now),
    updatedAt: '',
  }
}

export function resourceToFormValues(resource: EditableResource): AdminFormValues {
  return {
    title: text(resource.title),
    slug: text(resource.slug),
    resourceType: text(resource.resourceType) || 'workshop',
    description: text(resource.description),
    topics: strings(resource.topics).join(', '),
    experienceLevel: text(resource.experienceLevel) || 'any',
    featured: checkbox(resource.featured),
    externalUrl: text(resource.externalUrl),
    githubUrl: text(resource.githubUrl),
    author: text(resource.authorId),
    event: text(resource.eventId),
    relatedResources: ids(resource.relatedResourceIds),
    publishedAt: text(resource.publishedAt),
    updatedAt: text(resource.updatedAt),
  }
}
