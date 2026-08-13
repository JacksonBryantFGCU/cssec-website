import Link from 'next/link'

import { SITE_AFFILIATION, SITE_FULL_NAME } from '@/lib/site'
import { cn } from '@/lib/utils'

import type { SiteLinks } from './site-links'

/**
 * The platform footer.
 *
 * Its job in the approved design is to explain the club's four surfaces and
 * what each one is *for*, so a member knows where to go rather than guessing.
 *
 * Microsoft Teams is described but never linked: it holds officer planning and
 * internal documents, and this is an unauthenticated page.
 */
type Platform = {
  name: string
  dotClass: string
  blurb: string
  href?: string | null
  linkLabel?: string
}

function platforms(links: SiteLinks): Platform[] {
  return [
    {
      name: 'This website',
      dotClass: 'bg-club-green',
      blurb:
        'Discover, reference, and learn. Every event, resource, and project stays here permanently.',
    },
    {
      name: 'Discord',
      dotClass: 'bg-discord',
      blurb: 'Discuss, ask questions, and socialize. Announcements arrive here first.',
      href: links.discordUrl,
      linkLabel: 'Join the server ↗',
    },
    {
      name: 'GitHub',
      dotClass: 'bg-github',
      blurb: 'Build and collaborate. Project repositories, issues, and code review.',
      href: links.githubUrl,
      linkLabel: 'Open our repositories ↗',
    },
    {
      name: 'Microsoft Teams',
      dotClass: 'bg-teams',
      blurb: 'Officer planning and internal documents. Officers only.',
    },
  ]
}

export function SiteFooter({ links }: { links: SiteLinks }) {
  const rows = platforms(links)

  return (
    <footer className="bg-navy-footer border-navy-line text-navy-body border-t px-4 pt-6 pb-6 sm:px-7 sm:pt-[38px] sm:pb-[22px]">
      <div className="border-b border-[#16344F] pb-6 sm:pb-[30px]">
        <ul className="grid gap-6 sm:grid-cols-2 sm:gap-[30px] lg:grid-cols-4">
          {rows.map((platform) => (
            <li className="flex flex-col gap-[7px]" key={platform.name}>
              <p className="flex items-center gap-[9px]">
                <span
                  aria-hidden
                  className={cn('size-[7px] rounded-[2px]', platform.dotClass)}
                />
                <span
                  className={cn(
                    'font-display text-[15.5px] font-bold',
                    platform.name === 'This website' ? 'text-club-green-bright' : 'text-white',
                  )}
                >
                  {platform.name}
                </span>
              </p>
              <p className="text-navy-dim text-[13.5px] leading-relaxed">{platform.blurb}</p>
              {platform.href ? (
                <a
                  className="text-navy-link text-[13.5px] font-semibold hover:underline"
                  href={platform.href}
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  {platform.linkLabel}
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-4 pt-[18px] sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
        <p className="text-navy-quiet text-[13px]">
          CSSEC — {links.clubName || SITE_FULL_NAME} · {SITE_AFFILIATION}
        </p>
        {links.advisor ? (
          <p className="text-navy-whisper font-mono text-[11px] tracking-[0.05em] uppercase">
            Advisor {links.advisor.name}
          </p>
        ) : null}
        {links.footerNote ? (
          <p className="text-navy-whisper text-[12px] leading-relaxed">{links.footerNote}</p>
        ) : null}

        <span className="hidden flex-1 sm:block" />

        <nav aria-label="Footer">
          <ul className="text-navy-soft flex flex-wrap gap-5 text-[13px]">
            <li>
              <Link className="hover:text-white hover:underline" href="/about">
                About
              </Link>
            </li>
            <li>
              <Link className="hover:text-white hover:underline" href="/about#join">
                Join
              </Link>
            </li>
            {links.contactEmail ? (
              <li>
                <a className="hover:text-white hover:underline" href={`mailto:${links.contactEmail}`}>
                  Contact
                </a>
              </li>
            ) : null}
            {links.discordUrl ? (
              <li>
                <a
                  className="hover:text-white hover:underline"
                  href={links.discordUrl}
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  Discord ↗
                </a>
              </li>
            ) : null}
            {links.githubUrl ? (
              <li>
                <a
                  className="hover:text-white hover:underline"
                  href={links.githubUrl}
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  GitHub ↗
                </a>
              </li>
            ) : null}
          </ul>
        </nav>
      </div>
    </footer>
  )
}
