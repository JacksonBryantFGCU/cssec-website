import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { test } from 'node:test'

/**
 * Security regression guard for the `/admin` pages.
 *
 * The `(shell)` layout calls `requireOfficer()`, but that is not sufficient on
 * its own: Next.js renders layouts and pages **concurrently**, so a page that
 * relied only on the layout still runs its queries, and the rendered result is
 * serialized into the redirect response sent to a signed-out caller.
 *
 * Every page under the shell must therefore authorize itself first. This test
 * walks the directory rather than listing files, so a page added later is
 * covered automatically instead of being quietly exempt.
 */

const SHELL_DIR = fileURLToPath(new URL('../../app/admin/(shell)/', import.meta.url))

/** Screens whose capability is stronger than the default `content:write`. */
const ADMIN_ONLY_PAGES: Record<string, string> = {
  'settings/page.tsx': 'settings:manage',
  'people/officers/page.tsx': 'officers:manage',
  'people/officers/new/page.tsx': 'officers:manage',
  'people/officers/[id]/edit/page.tsx': 'officers:manage',
  'people/officers/[id]/remove/page.tsx': 'officers:manage',
}

function pageFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) return pageFiles(full)
    return entry === 'page.tsx' ? [full] : []
  })
}

const pages = pageFiles(SHELL_DIR)

test('every admin page authorizes the caller itself', () => {
  assert.ok(pages.length >= 24, `expected to find the admin pages, found ${pages.length}`)

  for (const file of pages) {
    const source = readFileSync(file, 'utf8')
    const relative = path.relative(SHELL_DIR, file)

    assert.match(
      source,
      /await requireOfficer\(/,
      `${relative} must call requireOfficer() — the layout check alone does not stop it rendering`,
    )
  }
})

test('authorization runs before the page reads from Sanity', () => {
  for (const file of pages) {
    const source = readFileSync(file, 'utf8')
    const relative = path.relative(SHELL_DIR, file)

    const authIndex = source.indexOf('await requireOfficer(')
    const fetchIndex = source.indexOf('getAdminClient()')

    if (fetchIndex !== -1) {
      assert.ok(
        authIndex !== -1 && authIndex < fetchIndex,
        `${relative} queries Sanity before authorizing the caller`,
      )
    }
  }
})

test('a page is gated at least as strongly as the action it leads to', () => {
  for (const file of pages) {
    const relative = path.relative(SHELL_DIR, file).replace(/\\/g, '/')
    const expected = ADMIN_ONLY_PAGES[relative]
    if (!expected) continue

    // Otherwise an officer would reach a form whose Save button always fails —
    // or worse, a reviewer would assume the page check was the real one.
    assert.match(
      readFileSync(file, 'utf8'),
      new RegExp(`capability: '${expected}'`),
      `${relative} must require the ${expected} capability`,
    )
  }
})

test('the shell layout is still an authorization boundary of its own', () => {
  const layout = readFileSync(path.join(SHELL_DIR, 'layout.tsx'), 'utf8')

  assert.match(layout, /await requireOfficer\(/)
  // Nothing under /admin may be prerendered: access depends on the request.
  assert.match(layout, /export const dynamic = 'force-dynamic'/)
})
