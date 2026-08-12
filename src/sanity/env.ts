import { publicEnv } from '../lib/env/public'

/**
 * Browser-safe Sanity configuration. These are re-exported from the validated
 * public env module so the Studio config, the read client and the image builder
 * all read from one source.
 *
 * Imported with a relative path (not `@/`) because `sanity.config.ts` is
 * bundled by the Sanity CLI as well as by Next.js.
 */
export const projectId = publicEnv.NEXT_PUBLIC_SANITY_PROJECT_ID
export const dataset = publicEnv.NEXT_PUBLIC_SANITY_DATASET
export const apiVersion = publicEnv.NEXT_PUBLIC_SANITY_API_VERSION
