import type { Capability } from '@/auth/permissions'

/**
 * The `/admin` navigation, defined once and rendered by both the desktop
 * sidebar and the mobile drawer.
 *
 * Authorization lives in `capability`, resolved through `can()` at render time.
 * No component compares roles directly — when a later phase makes, say, officer
 * management admin-only, this file is the only place that changes.
 */

/**
 * Icons are named here and resolved to components inside `AdminNav`.
 *
 * The sections are built on the server and handed to a Client Component, so
 * every field has to be serializable — a component reference cannot cross that
 * boundary. Keeping this module free of React also keeps it unit-testable.
 */
export type AdminNavIcon =
  | 'dashboard'
  | 'events'
  | 'projects'
  | 'resources'
  | 'opportunities'
  | 'people'
  | 'settings'
  | 'studio'

export type AdminNavItem = {
  href: string
  label: string
  /** Decorative: the label is always present, so the icon is `aria-hidden`. */
  icon: AdminNavIcon
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
    items: [{ href: '/admin', label: 'Dashboard', icon: 'dashboard' }],
  },
  {
    title: 'Content',
    items: [
      { href: '/admin/events', label: 'Events', icon: 'events', capability: 'content:write' },
      {
        href: '/admin/projects',
        label: 'Projects',
        icon: 'projects',
        capability: 'content:write',
        comingSoon: true,
      },
      {
        href: '/admin/resources',
        label: 'Resources',
        icon: 'resources',
        capability: 'content:write',
        comingSoon: true,
      },
      {
        href: '/admin/opportunities',
        label: 'Opportunities',
        icon: 'opportunities',
        capability: 'content:write',
        comingSoon: true,
      },
    ],
  },
  {
    title: 'Club',
    items: [
      { href: '/admin/people', label: 'People', icon: 'people', capability: 'content:write', comingSoon: true },
      {
        href: '/admin/settings',
        label: 'Site settings',
        icon: 'settings',
        capability: 'content:write',
        comingSoon: true,
      },
    ],
  },
  {
    title: 'Advanced',
    items: [{ href: '/studio', label: 'Advanced CMS', icon: 'studio', external: true }],
  },
]

/** True when `href` is the current section (so `/admin` does not match everything). */
export function isActiveNavItem(href: string, pathname: string): boolean {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(`${href}/`)
}
