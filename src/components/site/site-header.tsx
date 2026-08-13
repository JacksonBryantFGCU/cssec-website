import Link from 'next/link'

import { MobileNav } from './mobile-nav'
import { SiteNavBar } from './site-nav-bar'
import { SiteSearch } from './site-search'
import { SiteWordmark } from './site-wordmark'
import type { SiteLinks } from './site-links'

/**
 * The navy application shell header.
 *
 * Server-rendered; only the three pieces that genuinely need the browser are
 * Client Components — the active-route bar, the search dialog, and the mobile
 * drawer. There are deliberately no authentication controls here: officers
 * reach `/admin` directly, and the public site never depends on Clerk.
 *
 * Three widths, matching the reference:
 *
 *   < lg   wordmark, search icon, menu button
 *   lg     full nav, search icon, Join
 *   xl     the search field opens out and Discord / GitHub appear
 */
export function SiteHeader({ links }: { links: SiteLinks }) {
  return (
    <header className="bg-navy border-navy-line text-navy-fg sticky top-0 z-30 border-b">
      <div className="flex h-14 items-center gap-2.5 px-3.5 lg:h-16 lg:gap-[18px] lg:px-7">
        <SiteWordmark />
        <SiteNavBar />

        <span className="flex-1" />

        <SiteSearch />

        {links.discordUrl || links.githubUrl ? (
          <div className="text-navy-soft hidden shrink-0 gap-3.5 text-[13.5px] whitespace-nowrap xl:flex">
            {links.discordUrl ? (
              <a
                className="transition-colors hover:text-white"
                href={links.discordUrl}
                rel="noreferrer noopener"
                target="_blank"
              >
                Discord ↗
              </a>
            ) : null}
            {links.githubUrl ? (
              <a
                className="transition-colors hover:text-white"
                href={links.githubUrl}
                rel="noreferrer noopener"
                target="_blank"
              >
                GitHub ↗
              </a>
            ) : null}
          </div>
        ) : null}

        <Link
          className="bg-club-green text-club-green-ink hover:bg-club-green-hover hidden shrink-0 rounded-lg px-4 py-[9px] text-[13.5px] font-bold whitespace-nowrap transition-colors lg:inline-flex"
          // There is no `/join` route by design; the About page's join section
          // is the destination every "Join CSSEC" control shares.
          href="/about#join"
        >
          Join CSSEC
        </Link>

        <MobileNav discordUrl={links.discordUrl} githubUrl={links.githubUrl} />
      </div>
    </header>
  )
}
