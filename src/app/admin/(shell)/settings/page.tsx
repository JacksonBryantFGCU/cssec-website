import { requireOfficer } from '@/auth/require-officer'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { SavedNotice } from '@/components/admin/filter-tabs'
import { siteSettingsToFormValues, socialLinkRows } from '@/lib/settings/form-values'
import { getAdminClient } from '@/sanity/lib/admin-client'
import { ADMIN_PEOPLE_OPTIONS_QUERY, ADMIN_SITE_SETTINGS_QUERY } from '@/sanity/queries/admin'

import { updateSiteSettings } from './actions'
import { SettingsForm } from './settings-form'

export const metadata = { title: 'Site settings' }

/**
 * The club's global content.
 *
 * Gated on `settings:manage`, which only `admin` holds: one save here changes
 * the header, the footer and the page titles of every route at once, which is a
 * different kind of mistake from getting one event's date wrong.
 *
 * The settings document may not exist yet on a fresh dataset. That is a normal
 * first-run state rather than an error — the form falls back to the schema's
 * initial values, and the first save creates the singleton at its fixed id.
 */
export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireOfficer({ capability: 'settings:manage', returnTo: '/admin/settings' })

  const params = await searchParams
  const saved = params.saved === 'updated' ? 'Site settings saved.' : undefined

  const sanity = getAdminClient()

  const [settings, people] = await Promise.all([
    sanity.fetch(ADMIN_SITE_SETTINGS_QUERY),
    sanity.fetch(ADMIN_PEOPLE_OPTIONS_QUERY),
  ])

  return (
    <>
      <AdminPageHeader
        description="The club’s name, contact details and links. These appear on every page of the website."
        kicker="Club"
        title="Site settings"
      />

      <div className="px-4 pt-6 sm:px-6">
        <SavedNotice message={saved} />
        {settings ? null : (
          <p
            className="border-rule bg-paper-warm text-ink-body rounded-lg border px-4 py-3 text-[12.5px] leading-relaxed"
            role="note"
          >
            These settings have not been filled in yet. Saving this form creates them.
          </p>
        )}
      </div>

      <SettingsForm
        action={updateSiteSettings}
        defaults={siteSettingsToFormValues(settings)}
        people={people.flatMap((person) =>
          person.name ? [{ _id: person._id, label: person.name }] : [],
        )}
        socialLinks={socialLinkRows(settings)}
      />
    </>
  )
}
