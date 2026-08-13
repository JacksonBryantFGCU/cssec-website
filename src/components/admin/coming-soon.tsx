import { AdminPageHeader } from './admin-page-header'
import { AdvancedCmsCard } from './advanced-cms'
import { EmptyState } from './empty-state'

/**
 * Placeholder for a module whose management screens arrive in a later phase.
 *
 * It exists so the navigation is complete and nothing dead-ends, and it is
 * honest about what it is: no fake buttons, and a working route to the Studio,
 * where this content can genuinely be edited today.
 */
export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <>
      <AdminPageHeader description={description} kicker="Not built yet" title={title} />
      <div className="flex max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6">
        <EmptyState
          description={`${title} can be created and edited today in the Advanced CMS. A dedicated screen here will follow the same pattern as Events in a later phase.`}
          kicker="No screen yet"
          title="Managed in the Advanced CMS for now"
        />
        <AdvancedCmsCard>
          Everything CSSEC stores lives in Sanity — Studio edits the same content this admin does.
        </AdvancedCmsCard>
      </div>
    </>
  )
}
