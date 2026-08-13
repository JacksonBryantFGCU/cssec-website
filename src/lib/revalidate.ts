import 'server-only'

import { revalidatePath } from 'next/cache'

/**
 * Which public routes each content type appears on.
 *
 * Public pages are statically rendered with a long revalidate window, so an
 * officer's save has to invalidate them explicitly — that is the trade for not
 * disabling caching site-wide. Keeping the mapping here means a mutation never
 * has to reason about which pages happen to show its content, and adding a new
 * surface is a change in one file.
 *
 * Detail routes are invalidated as routes rather than as concrete URLs: a save
 * can rename a slug, retire a document, or change the "related" rails on
 * *other* documents' pages, none of which a single-URL invalidation would
 * catch.
 *
 * Only Events has admin mutations today. The rest are ready for the admin
 * phase that follows, and are already correct for anything written in Studio.
 */

/** The admin app itself, whose dashboard counts every one of these. */
function revalidateAdmin(): void {
  revalidatePath('/admin', 'layout')
}

export function revalidateEventContent(): void {
  revalidateAdmin()
  revalidatePath('/')
  revalidatePath('/events')
  revalidatePath('/events/[slug]', 'page')
  // Resources name their source event, so an event's title or date can change
  // what the library and every resource page display.
  revalidatePath('/resources')
  revalidatePath('/resources/[slug]', 'page')
  // The `.ics` download reads uncached, so it needs no invalidation here.
}

export function revalidateProjectContent(): void {
  revalidateAdmin()
  revalidatePath('/')
  revalidatePath('/projects')
  revalidatePath('/projects/[slug]', 'page')
}

export function revalidateResourceContent(): void {
  revalidateAdmin()
  revalidatePath('/')
  revalidatePath('/resources')
  revalidatePath('/resources/[slug]', 'page')
  // A resource is listed on the page of the event it came from, and counted in
  // the archive table's "materials" column.
  revalidatePath('/events')
  revalidatePath('/events/[slug]', 'page')
}

export function revalidateOpportunityContent(): void {
  revalidateAdmin()
  revalidatePath('/')
  revalidatePath('/opportunities')
}
