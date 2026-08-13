import { requireOfficer } from '@/auth/require-officer'
import { ComingSoon } from '@/components/admin/coming-soon'

export const metadata = { title: 'People' }

export default async function AdminPeoplePage() {
  // Every admin page authorizes itself: layouts and pages render concurrently,
  // so the layout boundary alone would not stop a page from running.
  await requireOfficer({ capability: 'content:write' })

  return (
    <ComingSoon
      description="Members, presenters and the officer roster for each term."
      title="People"
    />
  )
}
