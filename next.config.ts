import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
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
