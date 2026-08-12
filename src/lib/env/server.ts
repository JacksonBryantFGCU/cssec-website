import 'server-only'

import { z } from 'zod'

/**
 * Server-only secrets.
 *
 * The `server-only` import makes this module a build error if it is ever
 * imported (directly or transitively) from a Client Component, so these values
 * — and Zod itself — never reach the browser bundle.
 *
 * Both values are optional at parse time so that `next build` and the public
 * site keep working without them. Consumers that genuinely need a secret call
 * `requireEnv` and fail loudly at the point of use instead.
 */
const serverEnvSchema = z.object({
  SANITY_API_WRITE_TOKEN: z.string().min(1).optional(),
  CLERK_SECRET_KEY: z.string().min(1).optional(),
})

const parsed = serverEnvSchema.safeParse({
  SANITY_API_WRITE_TOKEN: process.env.SANITY_API_WRITE_TOKEN,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
})

if (!parsed.success) {
  const problems = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n')

  throw new Error(
    `Invalid server environment configuration:\n${problems}\n\nSee .env.example for the required variables.`,
  )
}

export const serverEnv = parsed.data

/** Reads a server-only value, throwing if it is not configured. */
export function requireEnv(name: keyof typeof serverEnv): string {
  const value = serverEnv[name]

  if (!value) {
    throw new Error(
      `Missing required server environment variable: ${name}. See .env.example.`,
    )
  }

  return value
}
