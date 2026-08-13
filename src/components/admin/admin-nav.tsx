'use client'

import {
  BookOpen,
  Briefcase,
  CalendarDays,
  Database,
  FolderGit2,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

import { isActiveNavItem, type AdminNavIcon, type AdminNavSection } from './navigation'

/**
 * Icon names resolved to components on the client.
 *
 * The nav data is built on the server, and a component reference cannot cross
 * the server/client boundary — so the sections carry names and the mapping
 * lives here, inside the boundary that renders them.
 */
const ICONS: Record<AdminNavIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  events: CalendarDays,
  projects: FolderGit2,
  resources: BookOpen,
  opportunities: Briefcase,
  people: Users,
  settings: Settings,
  studio: Database,
}

/**
 * The navigation list, shared by the desktop sidebar and the mobile drawer.
 *
 * A Client Component only because the active link depends on the current path.
 * It receives sections that the server already filtered by capability, so it
 * makes no authorization decision of its own.
 *
 * The active item is marked three ways — a green rule, a raised panel and
 * `aria-current` — so it never depends on colour alone.
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
    <nav aria-label="Admin sections" className="flex flex-col gap-5">
      {sections.map((section) => (
        <div key={section.title} className="flex flex-col gap-1">
          <h2 className="text-navy-whisper px-3 pb-1 font-mono text-[10px] font-medium tracking-[0.16em] uppercase">
            {section.title}
          </h2>
          <ul className="flex flex-col gap-px">
            {section.items.map((item) => {
              const active = !item.external && isActiveNavItem(item.href, pathname)
              const Icon = ICONS[item.icon]

              return (
                <li key={item.href}>
                  <Link
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative flex min-h-11 items-center gap-2.5 rounded-md py-2 pr-2.5 pl-3 text-[13.5px] transition-colors',
                      active
                        ? 'bg-navy-raised text-navy-bright font-semibold'
                        : 'text-navy-dim hover:bg-navy-raised/70 hover:text-navy-bright',
                    )}
                    href={item.href}
                    onClick={onNavigate}
                    {...(item.external ? { rel: 'noreferrer', target: '_blank' } : {})}
                  >
                    {active ? (
                      <span
                        aria-hidden="true"
                        className="bg-club-green absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-sm"
                      />
                    ) : null}
                    <Icon
                      aria-hidden="true"
                      className={cn('size-4 shrink-0', active ? 'text-club-green-bright' : 'text-navy-quiet')}
                    />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.comingSoon ? (
                      <span className="border-navy-edge text-navy-whisper rounded border px-1.5 py-px font-mono text-[9px] tracking-[0.1em] uppercase">
                        Soon
                      </span>
                    ) : null}
                    {item.external ? (
                      <span className="text-navy-quiet text-xs" aria-hidden="true">
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
