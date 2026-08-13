'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

import { isActiveNavItem, type AdminNavSection } from './navigation'

/**
 * The navigation list, shared by the desktop sidebar and the mobile drawer.
 *
 * A Client Component only because the active link depends on the current path.
 * It receives sections that the server already filtered by capability, so it
 * makes no authorization decision of its own.
 */
export function AdminNav({
  sections,
  onNavigate,
}: {
  sections: AdminNavSection[]
  onNavigate?: () => void
}) {
  const pathname = usePathname()

  return (
    <nav aria-label="Admin sections" className="flex flex-col gap-6">
      {sections.map((section) => (
        <div key={section.title} className="flex flex-col gap-1">
          <h2 className="text-muted-foreground px-3 text-xs font-semibold tracking-wide uppercase">
            {section.title}
          </h2>
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active = !item.external && isActiveNavItem(item.href, pathname)

              return (
                <li key={item.href}>
                  <Link
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex min-h-11 items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                      'focus-visible:ring-ring focus-visible:ring-3 focus-visible:outline-none',
                      active
                        ? 'bg-secondary text-secondary-foreground font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                    href={item.href}
                    onClick={onNavigate}
                    {...(item.external ? { rel: 'noreferrer', target: '_blank' } : {})}
                  >
                    <span>{item.label}</span>
                    {item.comingSoon ? (
                      <span className="text-muted-foreground rounded border px-1.5 py-0.5 text-[0.625rem] font-medium tracking-wide uppercase">
                        Soon
                      </span>
                    ) : null}
                    {item.external ? (
                      <span className="text-muted-foreground text-xs" aria-hidden="true">
                        ↗
                      </span>
                    ) : null}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
