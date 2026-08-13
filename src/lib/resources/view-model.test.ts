import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  isMaintainedGuide,
  resourceLevelLabel,
  resourceTypeLabel,
  sourceEventHref,
  sourceEventLabel,
} from './view-model.ts'

const formatDate = (iso: string) => `formatted(${iso})`

describe('sourceEventLabel', () => {
  it('names the session and its date', () => {
    assert.equal(
      sourceEventLabel(
        { event: { title: 'Git & GitHub', startsAt: '2026-09-18T22:00:00Z' } },
        formatDate,
      ),
      'Git & GitHub — formatted(2026-09-18T22:00:00Z)',
    )
  })

  it('degrades to the title alone when the event has no date', () => {
    assert.equal(sourceEventLabel({ event: { title: 'Git & GitHub' } }, formatDate), 'Git & GitHub')
  })

  it('returns null for a standalone resource', () => {
    assert.equal(sourceEventLabel({ event: null }, formatDate), null)
    assert.equal(sourceEventLabel({}, formatDate), null)
  })
})

describe('sourceEventHref', () => {
  it('links to the event when it has a slug', () => {
    assert.equal(sourceEventHref({ event: { title: 'x', slug: 'intro-git' } }), '/events/intro-git')
  })

  it('returns null rather than a broken link when the slug is missing', () => {
    assert.equal(sourceEventHref({ event: { title: 'x' } }), null)
    assert.equal(sourceEventHref({}), null)
  })
})

describe('resourceTypeLabel', () => {
  it('maps schema values to their titles', () => {
    assert.equal(resourceTypeLabel('cheatSheet'), 'Cheat sheet')
    assert.equal(resourceTypeLabel(null), 'Resource')
  })
})

describe('resourceLevelLabel', () => {
  it('shows a dash for the default level, which says nothing in a column', () => {
    assert.equal(resourceLevelLabel('any'), '—')
    assert.equal(resourceLevelLabel(null), '—')
  })

  it('names a real level', () => {
    assert.equal(resourceLevelLabel('beginner'), 'Beginner')
  })
})

describe('isMaintainedGuide', () => {
  it('is true for a standalone guide with no source event', () => {
    assert.equal(isMaintainedGuide({ resourceType: 'guide' }), true)
    assert.equal(isMaintainedGuide({ resourceType: 'cheatSheet', event: null }), true)
  })

  it('is false once it belongs to a session, whatever its type', () => {
    // Material from a meeting is that meeting's record, not a maintained guide.
    assert.equal(isMaintainedGuide({ resourceType: 'guide', event: { title: 'Workshop' } }), false)
  })

  it('is false for session-shaped types', () => {
    assert.equal(isMaintainedGuide({ resourceType: 'slides' }), false)
    assert.equal(isMaintainedGuide({ resourceType: 'recording' }), false)
    assert.equal(isMaintainedGuide({}), false)
  })
})
