import type { NextConfig } from "next";

/**
 * Sanity serves every asset from one host, under a path segment that is the
 * project id. Scoping the pattern to *this* project's path rather than to the
 * whole host means a URL from someone else's Sanity project cannot be proxied
 * through our image optimizer.
 */
const sanityProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: sanityProjectId
      ? [
          {
            protocol: "https",
            hostname: "cdn.sanity.io",
            pathname: `/images/${sanityProjectId}/**`,
          },
        ]
      : [],
  },
  experimental: {
    serverActions: {
      // Officers upload slide decks and cheat sheets through `/admin`, and the
      // bytes travel inside the Server Action's multipart body. The default 1MB
      // would reject an ordinary PDF. This sits just above the largest limit in
      // `src/lib/admin/assets.ts` (10MB) to leave room for multipart overhead;
      // the per-file rules there are what actually decide what is accepted.
      bodySizeLimit: '12mb',
    },
  },
};

export default nextConfig;
