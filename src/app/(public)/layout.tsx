import { SiteFooter } from '@/components/site/site-footer'
import { SiteHeader } from '@/components/site/site-header'
import { getSiteLinks } from '@/components/site/site-links'

/**
 * The public website shell.
 *
 * A route group, so `/admin` and `/studio` sit outside it entirely and neither
 * inherits the header, the footer, nor the `.site-root` base rules that carry
 * the public focus ring and paper background.
 *
 * Nothing here reads authentication: the public site never depends on Clerk.
 */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const links = await getSiteLinks()

  return (
    <div className="site-root bg-paper text-ink flex min-h-full flex-1 flex-col">
      <a
        className="bg-club-green text-club-green-ink sr-only rounded-lg px-4 py-2 font-semibold focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
        href="#main"
      >
        Skip to content
      </a>
      <SiteHeader links={links} />
      <main className="flex-1" id="main">
        {children}
      </main>
      <SiteFooter links={links} />
    </div>
  )
}
