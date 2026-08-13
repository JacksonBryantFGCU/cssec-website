import type { Capability } from '@/auth/permissions'

/**
 * The `/admin` navigation, defined once and rendered by both the desktop
 * sidebar and the mobile drawer.
 *
 * Authorization lives in `capability`, resolved through `can()` at render time.
 * No component compares roles directly — when a later phase makes, say, officer
 * management admin-only, this file is the only place that changes.
 */

export type AdminNavItem = {
  href: string
  label: string
  /** Required to see the link at all. Defaults to `admin:access`. */
  capability?: Capability
  /** Marks a module whose management screens land in a later phase. */
  comingSoon?: boolean
  /** Leaves the admin app (opens the Studio). */
  external?: boolean
}

export type AdminNavSection = {
  title: string
  items: AdminNavItem[]
}

export const ADMIN_NAV: AdminNavSection[] = [
  {
    title: 'Overview',
    items: [{ href: '/admin', label: 'Dashboard' }],
  },
  {
    title: 'Content',
    items: [
      { href: '/admin/events', label: 'Events', capability: 'content:write' },
      { href: '/admin/projects', label: 'Projects', capability: 'content:write', comingSoon: true },
      { href: '/admin/resources', label: 'Resources', capability: 'content:write', comingSoon: true },
      {
        href: '/admin/opportunities',
        label: 'Opportunities',
        capability: 'content:write',
        comingSoon: true,
      },
    ],
  },
  {
    title: 'Club',
    items: [
      { href: '/admin/people', label: 'People', capability: 'content:write', comingSoon: true },
      { href: '/admin/settings', label: 'Site settings', capability: 'content:write', comingSoon: true },
    ],
  },
  {
    title: 'Advanced',
    items: [{ href: '/studio', label: 'Advanced CMS', external: true }],
  },
]

/** True when `href` is the current section (so `/admin` does not match everything). */
export function isActiveNavItem(href: string, pathname: string): boolean {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(`${href}/`)
}
