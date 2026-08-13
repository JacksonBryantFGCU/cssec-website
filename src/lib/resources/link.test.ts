import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { resourceKindLabel, resourceLink } from './link.ts'

describe('resourceKindLabel', () => {
  it('uppercases the stored type title', () => {
    assert.equal(resourceKindLabel('cheatSheet'), 'CHEAT SHEET')
    assert.equal(resourceKindLabel('slides'), 'SLIDES')
  })

  it('falls back for an unknown or missing type', () => {
    assert.equal(resourceKindLabel(null), 'RESOURCE')
  })
})

describe('resourceLink', () => {
  it('prefers the uploaded file and marks it as a download', () => {
    const link = resourceLink({
      slug: 'http-cheat-sheet',
      fileUrl: 'https://cdn.sanity.io/files/x/y/cheat.pdf',
      githubUrl: 'https://github.com/example/repo',
    })!

    assert.equal(link.href, 'https://cdn.sanity.io/files/x/y/cheat.pdf')
    assert.equal(link.action, 'Download')
    assert.equal(link.download, true)
  })

  it('falls through file → github → external → our own page', () => {
    assert.equal(resourceLink({ githubUrl: 'https://github.com/a/b' })!.action, 'GitHub ↗')
    assert.equal(resourceLink({ externalUrl: 'https://example.com' })!.action, 'Open ↗')
    assert.equal(resourceLink({ slug: 'first-pr' })!.href, '/resources/first-pr')
  })

  it('names the action for a recording', () => {
    const link = resourceLink({ resourceType: 'recording', externalUrl: 'https://youtu.be/x' })!
    assert.equal(link.action, 'Watch ↗')
  })

  it('marks only off-site destinations external', () => {
    assert.equal(resourceLink({ githubUrl: 'https://github.com/a/b' })!.external, true)
    assert.equal(resourceLink({ slug: 'first-pr' })!.external, false)
  })

  it('returns null when there is nowhere to go', () => {
    assert.equal(resourceLink({}), null)
  })
})
