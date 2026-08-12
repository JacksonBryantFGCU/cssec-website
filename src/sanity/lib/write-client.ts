import 'server-only'

import { createClient, type SanityClient } from 'next-sanity'

import { requireEnv } from '@/lib/env/server'
import { apiVersion, dataset, projectId } from '../env'

/**
 * Server-only Sanity client with write access.
 *
 * Use this for mutations from Server Actions / route handlers in the future
 * `/admin` officer interface — never for public reads (use `client` instead,
 * which is CDN-cached and token-free).
 *
 * The `server-only` import above turns any client-component import of this
 * module into a build error, so the write token can never reach the browser.
 *
 * The client is created lazily so that a build without `SANITY_API_WRITE_TOKEN`
 * fails only when a mutation is actually attempted, not at import time.
 */
let writeClient: SanityClient | undefined

export function getWriteClient(): SanityClient {
  writeClient ??= createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: requireEnv('SANITY_API_WRITE_TOKEN'),
    perspective: 'raw',
  })

  return writeClient
}
