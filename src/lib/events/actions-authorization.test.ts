import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

/**
 * Security regression guard for the event mutations.
 *
 * A Server Action is its own entry point: it can be POSTed directly, so the
 * `/admin` layout's check does not protect it. Every exported action must
 * therefore authorize itself, and must do so *before* it touches Sanity.
 *
 * This reads the source rather than executing it — running an action would need
 * a Clerk session, a Sanity token and a request context, and the property worth
 * protecting ("nobody deleted the auth line") is visible statically.
 */

const ACTIONS_PATH = new URL(
  '../../app/admin/(shell)/events/actions.ts',
  import.meta.url,
)

const source = readFileSync(ACTIONS_PATH, 'utf8')

/** The exported Server Actions, discovered rather than hard-coded. */
function exportedActions(): Array<{ name: string; body: string }> {
  const actions: Array<{ name: string; body: string }> = []
  const signature = /export async function (\w+)\(/g

  for (const match of source.matchAll(signature)) {
    const start = match.index
    const nextIndex = source.slice(start + 1).search(/\nexport async function /)
    const body = nextIndex === -1 ? source.slice(start) : source.slice(start, start + 1 + nextIndex)
    actions.push({ name: match[1], body })
  }

  return actions
}

test('the expected mutations exist', () => {
  const names = exportedActions().map((action) => action.name)
  assert.deepEqual(names.sort(), ['cancelEvent', 'createEvent', 'deleteEvent', 'updateEvent'])
})

test('every exported action authorizes the caller itself', () => {
  for (const action of exportedActions()) {
    assert.match(
      action.body,
      /await requireOfficer\(\{ capability: 'content:write' \}\)/,
      `${action.name} must call requireOfficer() with the content:write capability`,
    )
  }
})

test('authorization happens before any Sanity access', () => {
  for (const action of exportedActions()) {
    const authIndex = action.body.indexOf('requireOfficer')
    const clientIndex = Math.min(
      ...['getWriteClient', 'getAdminClient', 'resolveSlug', 'unknownPresenters']
        .map((token) => action.body.indexOf(token))
        .filter((index) => index !== -1),
    )

    assert.ok(authIndex !== -1, `${action.name} has no authorization call`)
    if (Number.isFinite(clientIndex)) {
      assert.ok(
        authIndex < clientIndex,
        `${action.name} touches Sanity before authorizing the caller`,
      )
    }
  }
})

test('the write token is only reached through the server-only client', () => {
  // A direct token read here would bypass the `server-only` guard entirely.
  assert.equal(source.includes('SANITY_API_WRITE_TOKEN'), false)
  assert.equal(source.includes('process.env'), false)
})

test('validated input, not raw form data, reaches the mutation', () => {
  // `parsed.data` is the Zod output; a `formData.get(...)` flowing straight into
  // a document would mean an unvalidated write.
  assert.match(source, /parseEventForm\(formData\)/)
  assert.match(source, /if \(!parsed\.success\)/)
  assert.equal(/\.(create|patch)\([^)]*formData\.get/.test(source), false)
})
