import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  NEW_SITE_SETTINGS_VALUES,
  siteSettingsToFormValues,
  socialLinkRows,
  socialLinkRowsFromValues,
} from './form-values.ts'

test('stored settings round-trip into the values the form renders', () => {
  const values = siteSettingsToFormValues({
    clubName: 'Computer Science & Software Engineering Club',
    shortName: 'CSSEC',
    description: 'The student club for computing at FGCU.',
    contactEmail: 'cssec@fgcu.edu',
    discordUrl: 'https://discord.gg/cssec',
    facultyAdvisorId: 'person-1',
    seo: { metaTitle: 'CSSEC at FGCU', metaDescription: 'Workshops, projects and career prep.' },
  })

  assert.equal(values.shortName, 'CSSEC')
  assert.equal(values.facultyAdvisor, 'person-1')
  assert.equal(values.metaTitle, 'CSSEC at FGCU')
  assert.equal(values.teamsUrl, '')
})

test('a dataset with no settings yet falls back to the schema defaults', () => {
  // Not an error state: a club that has never opened Studio still gets a
  // usable form rather than empty required fields.
  assert.deepEqual(siteSettingsToFormValues(null), NEW_SITE_SETTINGS_VALUES)
  assert.equal(NEW_SITE_SETTINGS_VALUES.shortName, 'CSSEC')
  assert.deepEqual(socialLinkRows(null), [])
})

test('a partially filled document keeps its defaults for the names', () => {
  const values = siteSettingsToFormValues({ description: 'Just a description so far.' })

  assert.equal(values.clubName, NEW_SITE_SETTINGS_VALUES.clubName)
  assert.equal(values.shortName, 'CSSEC')
  assert.equal(values.contactEmail, '')
})

test('stored social links become editor rows', () => {
  const rows = socialLinkRows({
    socialLinks: [
      { platform: 'instagram', url: 'https://instagram.com/cssec' },
      null,
      { url: 'https://example.com' },
    ],
  })

  assert.equal(rows.length, 2)
  assert.equal(rows[0].label, '')
  // A link saved without a platform still gets a usable select value.
  assert.equal(rows[1].platform, 'other')
})

test('a rejected submission rebuilds its own link rows rather than losing them', () => {
  const rows = socialLinkRowsFromValues({
    socialPlatform: ['instagram', 'youtube'],
    socialLabel: ['', 'Recordings'],
    socialUrl: ['https://instagram.com/cssec', 'https://youtube.com/@cssec'],
  })

  assert.deepEqual(rows, [
    { platform: 'instagram', label: '', url: 'https://instagram.com/cssec' },
    { platform: 'youtube', label: 'Recordings', url: 'https://youtube.com/@cssec' },
  ])
})

test('a submission with no link rows rebuilds to none', () => {
  assert.deepEqual(socialLinkRowsFromValues({ clubName: 'CSSEC' }), [])
})
