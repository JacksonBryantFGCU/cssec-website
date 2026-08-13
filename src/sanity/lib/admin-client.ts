import 'server-only'

import { createClient, type SanityClient } from 'next-sanity'

import { requireEnv } from '@/lib/env/server'
import { apiVersion, dataset, projectId } from '../env'

/**
 * Server-only Sanity client for reading in `/admin`.
 *
 * Distinct from the two clients either side of it, on purpose:
 *
 * - `client` (public reads) is CDN-cached, so an officer would see their own
 *   edit up to a minute late — unacceptable right after saving.
 * - `getWriteClient()` uses `perspective: 'raw'`, which is correct for patching
 *   an exact document id but would list Studio *drafts* alongside their
 *   published versions, showing every in-progress document twice.
 *
 * So: no CDN, and the `published` perspective. `/admin` therefore shows exactly
 * what the public site would show. Documents left as unpublished drafts in the
 * Studio are invisible here — see the README's draft/publish note.
 *
 * Created lazily so a build without `SANITY_API_WRITE_TOKEN` only fails when
 * `/admin` is actually used.
 */
let adminClient: SanityClient | undefined

export function getAdminClient(): SanityClient {
  adminClient ??= createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: requireEnv('SANITY_API_WRITE_TOKEN'),
    perspective: 'published',
  })

  return adminClient
}
