'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

import { SITE_NAV, isActiveNavItem } from './navigation'

/**
 * The desktop navigation bar.
 *
 * A Client Component only because the active section depends on the current
 * URL. It renders real anchors, so it works before hydration and the current
 * page is marked with `aria-current` as well as the green underline — the
 * design's own rule is that a state is never carried by colour alone.
 */
export function SiteNavBar() {
  const pathname = usePathname()

  return (
    <nav aria-label="Main" className="hidden h-16 min-w-0 items-stretch gap-0.5 lg:flex">
      {SITE_NAV.map((item) => {
        const active = isActiveNavItem(item.href, pathname)

        return (
          <Link
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex shrink-0 items-center px-2.5 text-sm whitespace-nowrap',
              'transition-colors hover:text-white',
              active
                ? 'font-semibold text-white shadow-[inset_0_-2px_0_var(--color-club-green)]'
                : 'text-navy-dim font-medium',
            )}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
