import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'

/**
 * Read client for the public website.
 *
 * The fourth and last client, and the only one the unauthenticated site uses:
 *
 * - `client` backs `defineLive` and is CDN-cached with no perspective pinned.
 * - `getAdminClient()` is `server-only` and token-authenticated.
 * - `getWriteClient()` mutates.
 *
 * `useCdn: false` on purpose. Public pages are cached by Next.js and
 * invalidated by `revalidatePath` when an officer saves — the CDN's own cache
 * would sit *in front* of that and keep serving the old event for up to a
 * minute after the revalidation already happened. Next's cache is the one
 * cache we can invalidate, so it is the only one we keep.
 *
 * `perspective: 'published'` means a document left as an unpublished draft in
 * the Studio is invisible here, which is what `/admin` already shows officers.
 */
export const publicClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: 'published',
  stega: false,
})

/**
 * How long a public page may serve stale content before Next.js refetches.
 *
 * This is only the backstop. The normal path is immediate: event mutations
 * call `revalidatePath` for every affected public route, so an officer's save
 * is visible on the next request rather than up to an hour later.
 */
export const PUBLIC_REVALIDATE_SECONDS = 3600
