import { clerkMiddleware } from '@clerk/nextjs/server'

/**
 * Clerk request integration. (Next.js 16 renamed `middleware.ts` to `proxy.ts`;
 * the mechanism is unchanged.)
 *
 * This establishes Clerk's request context so `auth()` works in Server
 * Components and Server Actions. It deliberately protects **nothing** on its
 * own: authorization is enforced at each resource by `requireOfficer()`, so a
 * matcher mistake can never silently expose admin content.
 */
export default clerkMiddleware()

export const config = {
  matcher: [
    // Everything except Next internals, static assets, and /studio — the Sanity
    // Studio keeps its own Sanity authentication and must not touch Clerk.
    '/((?!studio|_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
