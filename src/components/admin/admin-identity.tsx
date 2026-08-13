import { SignOutButton } from '@clerk/nextjs'

import type { OfficerIdentity } from '@/auth/require-officer'
import { roleLabel } from '@/auth/roles'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Who is signed in, and how to stop being signed in.
 *
 * Purely informational — the role shown here is the one the server already
 * used to authorize the page; it is never read back for a decision.
 */
export function AdminIdentity({ officer }: { officer: OfficerIdentity }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{officer.name}</p>
        <p className="text-muted-foreground truncate text-xs">
          {roleLabel(officer.role)}
          {officer.email ? ` · ${officer.email}` : ''}
        </p>
      </div>
      <SignOutButton redirectUrl="/">
        <button className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full')} type="button">
          Sign out
        </button>
      </SignOutButton>
    </div>
  )
}
