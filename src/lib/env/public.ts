/**
 * Browser-safe environment values.
 *
 * Everything in here is inlined into the client bundle by Next.js, so it must
 * never contain secrets. Server-only values live in `./server`.
 *
 * Deliberately dependency-free: `sanity.config.ts` is a Client Component, so
 * anything this module imports ends up in the Studio's browser bundle. Zod is
 * used for the server-side secrets in `./server`, where bundle size does not
 * matter; here a handful of string checks does the same job for free.
 *
 * Each variable is read as a literal `process.env.NEXT_PUBLIC_*` expression
 * because that is what Next.js statically replaces at build time.
 */

type Check = {
  value: string | undefined
  required: boolean
  /** Optional extra constraint; return an error message when it fails. */
  validate?: (value: string) => string | undefined
}

const isApiDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) ? undefined : 'must be a YYYY-MM-DD date'

const checks = {
  NEXT_PUBLIC_SANITY_PROJECT_ID: {
    value: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    required: true,
  },
  NEXT_PUBLIC_SANITY_DATASET: {
    value: process.env.NEXT_PUBLIC_SANITY_DATASET,
    required: true,
  },
  NEXT_PUBLIC_SANITY_API_VERSION: {
    value: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
    required: true,
    validate: isApiDate,
  },
  // Clerk is wired up: officer sign-in cannot work without this.
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: {
    value: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    required: true,
  },
} satisfies Record<string, Check>

function parsePublicEnv() {
  const problems: string[] = []

  for (const [name, check] of Object.entries(checks) as [string, Check][]) {
    const value = check.value?.trim()

    if (!value) {
      if (check.required) problems.push(`  - ${name}: missing`)
      continue
    }

    const problem = check.validate?.(value)
    if (problem) problems.push(`  - ${name}: ${problem}`)
  }

  if (problems.length > 0) {
    throw new Error(
      `Invalid environment configuration:\n${problems.join('\n')}\n\nSee .env.example for the required variables.`,
    )
  }

  return {
    NEXT_PUBLIC_SANITY_PROJECT_ID: checks.NEXT_PUBLIC_SANITY_PROJECT_ID.value!,
    NEXT_PUBLIC_SANITY_DATASET: checks.NEXT_PUBLIC_SANITY_DATASET.value!,
    NEXT_PUBLIC_SANITY_API_VERSION: checks.NEXT_PUBLIC_SANITY_API_VERSION.value!,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: checks.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.value!,
  }
}

export const publicEnv = parsePublicEnv()
