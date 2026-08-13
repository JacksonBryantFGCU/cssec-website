import { SignOutButton } from '@clerk/nextjs'

import type { OfficerIdentity } from '@/auth/require-officer'
import { roleLabel } from '@/auth/roles'

/**
 * Who is signed in, and how to stop being signed in.
 *
 * Purely informational — the role shown here is the one the server already
 * used to authorize the page; it is never read back for a decision. Nothing
 * beyond name, role and email is shown: the rest of the Clerk user object is
 * none of the interface's business.
 *
 * Rendered on the navy rail, so it carries its own colours rather than the
 * shadcn button variants, which are built for light surfaces.
 */
export function AdminIdentity({ officer }: { officer: OfficerIdentity }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="bg-navy-raised text-navy-bright border-navy-edge grid size-8 shrink-0 place-items-center rounded-full border font-mono text-[11px] font-semibold"
        >
          {initials(officer.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-navy-fg truncate text-[13px] font-semibold">{officer.name}</p>
          <p className="text-navy-whisper truncate font-mono text-[10px] tracking-[0.1em] uppercase">
            {roleLabel(officer.role)}
          </p>
        </div>
      </div>

      {officer.email ? (
        <p className="text-navy-whisper truncate text-[11.5px]" title={officer.email}>
          {officer.email}
        </p>
      ) : null}

      <SignOutButton redirectUrl="/">
        <button
          className="border-navy-border text-navy-dim hover:border-navy-border-hover hover:text-navy-bright min-h-11 w-full rounded-md border text-[13px] font-medium transition-colors"
          type="button"
        >
          Sign out
        </button>
      </SignOutButton>
    </div>
  )
}

/** Up to two initials, so the avatar stays legible at 32px. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '—'
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
