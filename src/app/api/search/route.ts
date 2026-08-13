import {
  FETCH_LIMIT,
  MIN_QUERY_LENGTH,
  matchPatterns,
  parseSearchQuery,
} from '@/lib/search/query'
import { toSearchResults, type SearchDocument } from '@/lib/search/results'
import { publicClient } from '@/sanity/lib/public-client'
import { SEARCH_QUERY } from '@/sanity/queries/search'

/**
 * `GET /api/search?q=…` — the only endpoint the search dialog talks to.
 *
 * A route handler rather than a Server Action, deliberately. Search is a read
 * that any visitor may perform, it needs no session, and it must be cancellable
 * as the user keeps typing — an action is a privileged mutation entry point and
 * modelling a public read as one would put an unauthenticated caller on the
 * same path as the officer mutations, which is exactly the boundary the rest of
 * this codebase works to keep clear.
 *
 * It uses `publicClient`: no token, no CDN, `published` perspective. There is
 * no way for this handler to write, and nothing it returns is not already on a
 * public page.
 */
export async function GET(request: Request) {
  const parsed = parseSearchQuery(new URL(request.url).searchParams.get('q'))

  if (!parsed.ok) {
    return Response.json(
      {
        results: [],
        reason: parsed.reason,
        minLength: MIN_QUERY_LENGTH,
      },
      // Not an error: an empty or one-character box is a normal state of a
      // search field, and the dialog renders its own copy for it.
      { status: 200 },
    )
  }

  try {
    const documents = await publicClient.fetch(
      SEARCH_QUERY,
      { terms: matchPatterns(parsed.terms), limit: FETCH_LIMIT },
      // Queries are unpredictable and results must reflect a save immediately,
      // so this is the one public read that is deliberately uncached.
      { cache: 'no-store' },
    )

    return Response.json({
      results: toSearchResults(documents as SearchDocument[], parsed.terms),
      query: parsed.text,
    })
  } catch (error) {
    // The detail stays on the server. A GROQ or network failure must not reach
    // the browser as a message, and the dialog only needs to know it failed.
    console.error('[search] query failed', error)

    return Response.json({ error: 'search-failed' }, { status: 500 })
  }
}
