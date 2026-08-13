import { requireOfficer } from '@/auth/require-officer'
import { ComingSoon } from '@/components/admin/coming-soon'

export const metadata = { title: 'Opportunities' }

export default async function AdminOpportunitiesPage() {
  // Every admin page authorizes itself: layouts and pages render concurrently,
  // so the layout boundary alone would not stop a page from running.
  await requireOfficer({ capability: 'content:write' })

  return (
    <ComingSoon
      description="Internships, hackathons, research and scholarships for members."
      title="Opportunities"
    />
  )
}
