import { requireOfficer } from '@/auth/require-officer'
import { ComingSoon } from '@/components/admin/coming-soon'

export const metadata = { title: 'Site settings' }

export default async function AdminSettingsPage() {
  // Every admin page authorizes itself: layouts and pages render concurrently,
  // so the layout boundary alone would not stop a page from running.
  await requireOfficer({ capability: 'content:write' })

  return (
    <ComingSoon
      description="Club contact details, meeting times and social links."
      title="Site settings"
    />
  )
}
