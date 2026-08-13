import { requireOfficer } from '@/auth/require-officer'
import { ComingSoon } from '@/components/admin/coming-soon'

export const metadata = { title: 'Projects' }

export default async function AdminProjectsPage() {
  // Every admin page authorizes itself: layouts and pages render concurrently,
  // so the layout boundary alone would not stop a page from running.
  await requireOfficer({ capability: 'content:write' })

  return (
    <ComingSoon
      description="Club projects, the roles they are recruiting for, and their progress."
      title="Projects"
    />
  )
}
