import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

import { rowErrorsFrom } from '../admin/fields.ts'
import {
  fieldErrorsFrom,
  parseSiteSettingsForm,
  SITE_SETTINGS_ID,
  SOCIAL_LINK_FIELDS,
} from './input-schema.ts'

function form(values: Record<string, string> = {}): FormData {
  const data = new FormData()
  const defaults: Record<string, string> = {
    clubName: 'Computer Science & Software Engineering Club',
    shortName: 'CSSEC',
    description: 'The student club for computing at Florida Gulf Coast University.',
    contactEmail: 'cssec@fgcu.edu',
  }

  for (const [key, value] of Object.entries({ ...defaults, ...values })) data.set(key, value)

  return data
}

function addLink(
  data: FormData,
  row: { platform?: string; label?: string; url?: string } = {},
): FormData {
  data.append(SOCIAL_LINK_FIELDS.platform, row.platform ?? 'instagram')
  data.append(SOCIAL_LINK_FIELDS.label, row.label ?? '')
  data.append(SOCIAL_LINK_FIELDS.url, row.url ?? 'https://instagram.com/cssec')
  return data
}

const errors = (data: FormData) => {
  const parsed = parseSiteSettingsForm(data)
  assert.equal(parsed.success, false)
  return parsed.success ? {} : fieldErrorsFrom(parsed.error)
}

test('the minimum a club needs on every page is required', () => {
  assert.equal(parseSiteSettingsForm(form()).success, true)

  assert.ok(errors(form({ clubName: '' })).clubName)
  assert.ok(errors(form({ shortName: '' })).shortName)
  assert.ok(errors(form({ description: 'too short' })).description)
  assert.ok(errors(form({ contactEmail: '' })).contactEmail)
  assert.ok(errors(form({ contactEmail: 'cssec@fgcu' })).contactEmail)
})

test('the short name is kept short enough to fit the wordmark', () => {
  assert.ok(errors(form({ shortName: 'Computing Club' })).shortName)
})

test('club links are optional but must be real when present', () => {
  assert.equal(parseSiteSettingsForm(form({ discordUrl: '', githubUrl: '' })).success, true)
  assert.ok(errors(form({ discordUrl: 'discord.gg/abc' })).discordUrl)
  assert.ok(errors(form({ teamsUrl: 'javascript:alert(1)' })).teamsUrl)
})

test('social links are read as rows and validated individually', () => {
  const data = form()
  addLink(data, { platform: 'instagram', url: 'https://instagram.com/cssec' })
  addLink(data, { platform: 'youtube', url: 'not-a-url' })

  const parsed = parseSiteSettingsForm(data)
  assert.equal(parsed.success, false)
  if (parsed.success) return

  assert.deepEqual(rowErrorsFrom(parsed.error, 'socialLinks'), {
    'socialLinks.1': 'Add the full link, starting with https://',
  })
})

test('a link row added and never filled in is dropped, not rejected', () => {
  const data = form()
  addLink(data, { platform: '', label: '', url: '' })

  const parsed = parseSiteSettingsForm(data)
  assert.equal(parsed.success, true)
  assert.deepEqual(parsed.success && parsed.data.socialLinks, [])
})

test('a link needs both a known platform and a destination', () => {
  const withoutUrl = form()
  addLink(withoutUrl, { platform: 'youtube', url: '' })
  assert.ok(errors(withoutUrl).socialLinks)

  const unknownPlatform = form()
  addLink(unknownPlatform, { platform: 'myspace', url: 'https://example.com' })
  assert.ok(errors(unknownPlatform).socialLinks)
})

test('SEO overrides are optional and length-limited', () => {
  assert.equal(parseSiteSettingsForm(form({ metaTitle: '', metaDescription: '' })).success, true)
  assert.ok(errors(form({ metaTitle: 'x'.repeat(71) })).metaTitle)
  assert.ok(errors(form({ metaDescription: 'x'.repeat(161) })).metaDescription)
})

test('nothing about the application itself is accepted from this form', () => {
  const data = form()
  // Fields a hand-built POST might try to smuggle in.
  data.set('projectId', 'someone-elses-project')
  data.set('dataset', 'production')
  data.set('_id', 'not-the-singleton')
  data.set('_type', 'person')

  const parsed = parseSiteSettingsForm(data)
  assert.equal(parsed.success, true)
  if (!parsed.success) return

  const keys = Object.keys(parsed.data)
  for (const smuggled of ['projectId', 'dataset', '_id', '_type']) {
    assert.equal(keys.includes(smuggled), false, smuggled)
  }
})

test('the singleton id is the one the public query and Studio both use', () => {
  assert.equal(SITE_SETTINGS_ID, 'siteSettings')

  // The public site fetches settings by this exact id, and Studio pins editing
  // to it. A second settings document would be invisible to both.
  const publicQuery = readFileSync(
    new URL('../../sanity/queries/siteSettings.ts', import.meta.url),
    'utf8',
  )
  assert.ok(publicQuery.includes(`_id == "${SITE_SETTINGS_ID}"`))

  const structure = readFileSync(new URL('../../sanity/structure.ts', import.meta.url), 'utf8')
  assert.match(structure, /documentId\(type\)/)
  assert.ok(structure.includes(`singleton(S, '${SITE_SETTINGS_ID}'`))
})

test('the settings action targets the fixed id and never creates a second document', () => {
  const action = readFileSync(
    new URL('../../app/admin/(shell)/settings/actions.ts', import.meta.url),
    'utf8',
  )

  // createIfNotExists + patch on the fixed id is what guarantees exactly one.
  assert.match(action, /createIfNotExists\(\{\s*_id: SITE_SETTINGS_ID/)
  assert.match(action, /\.patch\(SITE_SETTINGS_ID/)
  // A bare create() would mint a new random id on every save.
  assert.equal(/\.create\(\{/.test(action), false)
})

test('site settings are admin-only', () => {
  const action = readFileSync(
    new URL('../../app/admin/(shell)/settings/actions.ts', import.meta.url),
    'utf8',
  )
  const page = readFileSync(
    new URL('../../app/admin/(shell)/settings/page.tsx', import.meta.url),
    'utf8',
  )

  assert.match(action, /requireOfficer\(\{ capability: 'settings:manage' \}\)/)
  assert.match(page, /capability: 'settings:manage'/)
})
