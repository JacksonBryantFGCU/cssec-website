import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

/**
 * Security regression guard for every admin mutation.
 *
 * A Server Action is its own entry point: it can be POSTed directly, so the
 * `/admin` layout's check does not protect it. Every exported action must
 * therefore authorize itself, and must do so *before* it touches Sanity.
 *
 * This reads the source rather than executing it — running an action would need
 * a Clerk session, a Sanity token and a request context, and the property worth
 * protecting ("nobody deleted the auth line") is visible statically.
 *
 * It walks the route tree rather than listing files, so a module added later is
 * covered automatically instead of being quietly exempt. That is the whole
 * point: the guard has to be the thing that notices, not a reviewer.
 */

const SHELL_DIR = fileURLToPath(new URL('../../app/admin/(shell)/', import.meta.url))

/** Every `actions.ts` under the admin shell. */
function actionFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) return actionFiles(full)
    return entry === 'actions.ts' ? [full] : []
  })
}

const files = actionFiles(SHELL_DIR)

/** The exported Server Actions in one file, discovered rather than hard-coded. */
function exportedActions(source: string): Array<{ name: string; body: string }> {
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

type Action = { moduleName: string; name: string; body: string; source: string }

const allActions: Action[] = files.flatMap((file) => {
  const source = readFileSync(file, 'utf8')
  const moduleName = path.relative(SHELL_DIR, file).replace(/\\/g, '/')

  return exportedActions(source).map((action) => ({ ...action, moduleName, source }))
})

test('every content module has a mutation module', () => {
  const modules = files.map((file) => path.relative(SHELL_DIR, file).replace(/\\/g, '/')).sort()

  assert.deepEqual(modules, [
    'events/actions.ts',
    'opportunities/actions.ts',
    'people/actions.ts',
    'projects/actions.ts',
    'resources/actions.ts',
    'settings/actions.ts',
  ])
})

test('the expected mutations exist', () => {
  const names = allActions.map((action) => `${action.moduleName}:${action.name}`).sort()

  assert.deepEqual(names, [
    'events/actions.ts:cancelEvent',
    'events/actions.ts:createEvent',
    'events/actions.ts:deleteEvent',
    'events/actions.ts:updateEvent',
    'opportunities/actions.ts:createOpportunity',
    'opportunities/actions.ts:deleteOpportunity',
    'opportunities/actions.ts:updateOpportunity',
    'people/actions.ts:createOfficerTerm',
    'people/actions.ts:createPerson',
    'people/actions.ts:deleteOfficerTerm',
    'people/actions.ts:deletePerson',
    'people/actions.ts:endOfficerTerm',
    'people/actions.ts:updateOfficerTerm',
    'people/actions.ts:updatePerson',
    'settings/actions.ts:updateSiteSettings',
    'projects/actions.ts:archiveProject',
    'projects/actions.ts:createProject',
    'projects/actions.ts:deleteProject',
    'projects/actions.ts:updateProject',
    'resources/actions.ts:createResource',
    'resources/actions.ts:deleteResource',
    'resources/actions.ts:updateResource',
  ].sort())
})

test('every exported action authorizes the caller itself', () => {
  assert.ok(allActions.length >= 20, `expected to find the admin actions, found ${allActions.length}`)

  for (const action of allActions) {
    assert.match(
      action.body,
      /await requireOfficer\(\{ capability: '(content:write|officers:manage|settings:manage)' \}\)/,
      `${action.moduleName}:${action.name} must call requireOfficer() with a named capability`,
    )
  }
})

test('authorization happens before any Sanity access', () => {
  // Helpers that reach Sanity indirectly count too — a mutation that resolves a
  // slug before authorizing has still queried the Content Lake for a stranger.
  const sanityTokens = [
    'getWriteClient',
    'getAdminClient',
    'resolveSlug',
    'unknownPeople',
    'unknownReferences',
    'personExists',
    'uploadFile',
    'uploadPhoto',
    'uploadCoverImage',
  ]

  for (const action of allActions) {
    const authIndex = action.body.indexOf('requireOfficer')
    const clientIndex = Math.min(
      ...sanityTokens
        .map((token) => action.body.indexOf(token))
        .filter((index) => index !== -1),
    )

    assert.ok(authIndex !== -1, `${action.moduleName}:${action.name} has no authorization call`)
    if (Number.isFinite(clientIndex)) {
      assert.ok(
        authIndex < clientIndex,
        `${action.moduleName}:${action.name} touches Sanity before authorizing the caller`,
      )
    }
  }
})

test('the capability required matches the sensitivity of the module', () => {
  const capabilityOf = (action: Action) =>
    /capability: '([^']+)'/.exec(action.body)?.[1] ?? 'none'

  for (const action of allActions) {
    const capability = capabilityOf(action)

    if (action.moduleName === 'settings/actions.ts') {
      // One save changes every page on the site.
      assert.equal(capability, 'settings:manage', `${action.name} must be admin-only`)
    } else if (action.name.toLowerCase().includes('officerterm')) {
      // Who the club says its leadership is, and the historical record of it.
      assert.equal(capability, 'officers:manage', `${action.name} must be admin-only`)
    } else {
      assert.equal(capability, 'content:write', `${action.name} should be ordinary content work`)
    }
  }
})

test('the write token is only reached through the server-only client', () => {
  for (const file of files) {
    const source = readFileSync(file, 'utf8')
    const moduleName = path.relative(SHELL_DIR, file).replace(/\\/g, '/')

    // A direct token read here would bypass the `server-only` guard entirely.
    assert.equal(source.includes('SANITY_API_WRITE_TOKEN'), false, moduleName)
    assert.equal(source.includes('process.env'), false, moduleName)
  }
})

test('validated input, not raw form data, reaches the mutation', () => {
  for (const file of files) {
    const source = readFileSync(file, 'utf8')
    const moduleName = path.relative(SHELL_DIR, file).replace(/\\/g, '/')

    // `parsed.data` is the Zod output; a `formData.get(...)` flowing straight
    // into a document would mean an unvalidated write.
    assert.match(source, /if \(!parsed\.success\)/, moduleName)
    assert.equal(
      /\.(create|createIfNotExists|patch)\([^)]*formData\.get/.test(source),
      false,
      moduleName,
    )
  }
})

test('no module offers a generic "mutate any document" entry point', () => {
  for (const action of allActions) {
    // A `type` parameter would make the authorization and validation of each
    // document type impossible to review — the property this whole file exists
    // to protect.
    assert.equal(
      /export async function \w+\([^)]*\btype\s*:/.test(action.body),
      false,
      `${action.moduleName}:${action.name} takes a document type as input`,
    )
  }
})

test('uploads are size- and type-checked before anything reaches Sanity', () => {
  const uploaders = files.filter((file) => readFileSync(file, 'utf8').includes('assets.upload'))

  // The three modules that accept a file: projects (cover image), resources
  // (the file itself) and people (photo).
  assert.equal(uploaders.length, 3)

  for (const file of uploaders) {
    const source = readFileSync(file, 'utf8')
    const moduleName = path.relative(SHELL_DIR, file).replace(/\\/g, '/')

    assert.ok(
      source.includes('checkUpload'),
      `${moduleName} uploads to Sanity without checking the file first`,
    )
    // The check has to gate the upload, not merely appear in the file.
    assert.ok(
      source.indexOf('checkUpload') < source.indexOf('assets.upload'),
      `${moduleName} uploads before checking the file`,
    )
  }
})
