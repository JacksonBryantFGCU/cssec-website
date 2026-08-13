/**
 * The public navigation, in the order the approved design shows it.
 *
 * `hint` is the secondary line the mobile drawer renders next to each item —
 * it exists in the design reference, and it is what makes the drawer read as a
 * menu of destinations rather than a list of words.
 *
 * Shared by the desktop bar and the mobile drawer so the two cannot drift.
 */
export type SiteNavItem = {
  label: string
  href: string
  hint: string
}

export const SITE_NAV: SiteNavItem[] = [
  { label: 'Home', href: '/', hint: 'What is happening now' },
  { label: 'Events', href: '/events', hint: 'Meetings and archive' },
  { label: 'Projects', href: '/projects', hint: 'Build with a team' },
  { label: 'Resources', href: '/resources', hint: 'Workshop archive' },
  { label: 'Opportunities', href: '/opportunities', hint: 'Internships and deadlines' },
  { label: 'About', href: '/about', hint: 'Join CSSEC' },
]

/**
 * Is this nav item the current section?
 *
 * Detail routes keep their parent lit: `/events/git-and-github` is still
 * "Events". Home is exact, or every item would match at once.
 */
export function isActiveNavItem(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}
