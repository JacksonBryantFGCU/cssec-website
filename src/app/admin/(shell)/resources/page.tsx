import { requireOfficer } from '@/auth/require-officer'
import { ComingSoon } from '@/components/admin/coming-soon'

export const metadata = { title: 'Resources' }

export default async function AdminResourcesPage() {
  // Every admin page authorizes itself: layouts and pages render concurrently,
  // so the layout boundary alone would not stop a page from running.
  await requireOfficer({ capability: 'content:write' })

  return (
    <ComingSoon
      description="Slides, guides, recordings and repositories from workshops."
      title="Resources"
    />
  )
}
