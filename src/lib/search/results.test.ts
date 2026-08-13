import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { RESULT_LIMIT } from './query.ts'
import {
  flattenGroups,
  groupSearchResults,
  toSearchResults,
  type SearchDocument,
} from './results.ts'

const event = (over: Partial<SearchDocument> = {}): SearchDocument => ({
  _id: 'e1',
  _type: 'event',
  slug: 'git-and-github',
  title: 'Git and GitHub',
  summary: 'Version control from scratch.',
  keywords: ['git', 'tooling'],
  kind: 'workshop',
  ...over,
})

describe('destinations', () => {
  test('events, projects and resources use their detail route', () => {
    const results = toSearchResults(
      [
        event(),
        { _id: 'p1', _type: 'project', slug: 'eaglefind', title: 'EagleFind' },
        { _id: 'r1', _type: 'resource', slug: 'git-cheat-sheet', title: 'Git cheat sheet' },
      ],
      ['git'],
    )

    const hrefs = Object.fromEntries(results.map((result) => [result.type, result.href]))
    assert.equal(hrefs.event, '/events/git-and-github')
    assert.equal(hrefs.project, '/projects/eaglefind')
    assert.equal(hrefs.resource, '/resources/git-cheat-sheet')
    assert.ok(results.every((result) => result.external === false))
  })

  test('an opportunity links out to the application, marked external', () => {
    const [result] = toSearchResults(
      [
        {
          _id: 'o1',
          _type: 'opportunity',
          title: 'Software intern',
          organization: 'Arthrex',
          applicationUrl: 'https://example.com/apply',
        },
      ],
      ['intern'],
    )

    assert.equal(result!.href, 'https://example.com/apply')
    assert.equal(result!.external, true)
  })

  test('an opportunity with no application URL falls back to the board', () => {
    const [result] = toSearchResults(
      [{ _id: 'o2', _type: 'opportunity', title: 'Research assistant' }],
      ['research'],
    )

    assert.equal(result!.href, '/opportunities')
    assert.equal(result!.external, false)
    // Never invented, because the schema models no such route.
    assert.ok(!result!.href.startsWith('/opportunities/'))
  })

  test('a document with no slug is dropped rather than linked nowhere', () => {
    const results = toSearchResults([event({ slug: null })], ['git'])
    assert.equal(results.length, 0)
  })

  test('a document with no title is dropped', () => {
    const results = toSearchResults([event({ title: null })], ['git'])
    assert.equal(results.length, 0)
  })

  test('an unknown document type is ignored', () => {
    const results = toSearchResults(
      [{ _id: 'x', _type: 'person', slug: 'someone', title: 'Someone' }],
      ['someone'],
    )
    assert.equal(results.length, 0)
  })
})

describe('ranking', () => {
  test('a title match outranks a description match', () => {
    const results = toSearchResults(
      [
        event({ _id: 'body', title: 'Deployment day', summary: 'We will also cover git.' }),
        event({ _id: 'title', title: 'Git', summary: 'Unrelated.' , keywords: []}),
      ],
      ['git'],
    )

    assert.deepEqual(
      results.map((result) => result.id),
      ['title', 'body'],
    )
  })

  test('an exact title beats a title that merely starts with the term', () => {
    const results = toSearchResults(
      [
        event({ _id: 'prefix', title: 'Git and GitHub', keywords: [] }),
        event({ _id: 'exact', title: 'Git', keywords: [] }),
      ],
      ['git'],
    )

    assert.equal(results[0]!.id, 'exact')
  })

  test('metadata outranks body text', () => {
    const results = toSearchResults(
      [
        event({ _id: 'body', title: 'Session', summary: 'about docker', keywords: [] }),
        event({ _id: 'meta', title: 'Session', summary: 'nothing', keywords: ['docker'] }),
      ],
      ['docker'],
    )

    assert.equal(results[0]!.id, 'meta')
  })

  test('a document matching both terms outranks one matching either', () => {
    const results = toSearchResults(
      [
        event({ _id: 'one', title: 'Git basics', keywords: [] }),
        event({ _id: 'both', title: 'Git and GitHub', keywords: [] }),
      ],
      ['git', 'github'],
    )

    assert.equal(results[0]!.id, 'both')
  })

  test('ranking is case-insensitive', () => {
    const [result] = toSearchResults([event({ title: 'GIT' })], ['git'])
    assert.equal(result!.title, 'GIT')
  })
})

describe('limits and mapping', () => {
  test('results are capped at the shown limit', () => {
    const many = Array.from({ length: RESULT_LIMIT + 15 }, (_, index) =>
      event({ _id: `e${index}`, slug: `event-${index}` }),
    )

    assert.equal(toSearchResults(many, ['git']).length, RESULT_LIMIT)
  })

  test('an explicit limit is honoured', () => {
    const many = Array.from({ length: 10 }, (_, index) =>
      event({ _id: `e${index}`, slug: `event-${index}` }),
    )

    assert.equal(toSearchResults(many, ['git'], 3).length, 3)
  })

  test('the kind badge is humanised from the stored option value', () => {
    const [result] = toSearchResults([event({ kind: 'studySession' })], ['git'])
    assert.equal(result!.kind, 'STUDY SESSION')
  })

  test('an opportunity meta line leads with the organization', () => {
    const [result] = toSearchResults(
      [
        {
          _id: 'o1',
          _type: 'opportunity',
          title: 'Intern',
          organization: 'Arthrex',
          summary: 'Summer role.',
          applicationUrl: 'https://example.com',
        },
      ],
      ['intern'],
    )

    assert.equal(result!.meta, 'Arthrex · Summer role.')
  })

  test('a long summary is truncated with an ellipsis', () => {
    const [result] = toSearchResults([event({ summary: 'x'.repeat(200) })], ['git'])
    assert.ok(result!.meta.length <= 96)
    assert.ok(result!.meta.endsWith('…'))
  })
})

describe('grouping', () => {
  test('groups keep rank order and flatten back to the same sequence', () => {
    const results = toSearchResults(
      [
        event({ _id: 'e1', title: 'Git', keywords: [] }),
        { _id: 'p1', _type: 'project', slug: 'p', title: 'Git viewer' },
        event({ _id: 'e2', slug: 'e2', title: 'Git advanced', keywords: [] }),
      ],
      ['git'],
    )

    const groups = groupSearchResults(results)
    assert.deepEqual(
      flattenGroups(groups).map((result) => result.id),
      results.map((result) => result.id),
    )
    // Each type appears once, however scattered the ranking left it.
    assert.equal(new Set(groups.map((group) => group.type)).size, groups.length)
  })

  test('no results produce no groups', () => {
    assert.deepEqual(groupSearchResults([]), [])
    assert.deepEqual(flattenGroups([]), [])
  })
})
