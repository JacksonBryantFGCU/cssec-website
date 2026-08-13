import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  MAX_QUERY_LENGTH,
  MIN_QUERY_LENGTH,
  matchPatterns,
  parseSearchQuery,
} from './query.ts'

describe('parseSearchQuery', () => {
  test('rejects an empty or whitespace-only box', () => {
    for (const input of ['', '   ', '\t\n']) {
      const parsed = parseSearchQuery(input)
      assert.equal(parsed.ok, false)
      assert.equal(parsed.ok === false && parsed.reason, 'empty')
    }
  })

  test('rejects anything that is not a string', () => {
    for (const input of [null, undefined, 42, {}, []]) {
      assert.equal(parseSearchQuery(input).ok, false)
    }
  })

  test('rejects a single character rather than matching the whole dataset', () => {
    const parsed = parseSearchQuery('g')
    assert.equal(parsed.ok, false)
    assert.equal(parsed.ok === false && parsed.reason, 'too-short')
  })

  test('accepts a query at exactly the minimum length', () => {
    const parsed = parseSearchQuery('gi')
    assert.equal(parsed.ok, true)
    assert.equal(parsed.ok && parsed.text.length, MIN_QUERY_LENGTH)
  })

  test('collapses internal whitespace and trims the edges', () => {
    const parsed = parseSearchQuery('   git    and   github  ')
    assert.equal(parsed.ok, true)
    assert.equal(parsed.ok && parsed.text, 'git and github')
    assert.deepEqual(parsed.ok && parsed.terms, ['git', 'and', 'github'])
  })

  test('truncates an over-long query instead of rejecting it', () => {
    const parsed = parseSearchQuery('a'.repeat(MAX_QUERY_LENGTH + 200))
    assert.equal(parsed.ok, true)
    assert.equal(parsed.ok && parsed.text.length, MAX_QUERY_LENGTH)
  })

  test('strips the characters GROQ match treats as syntax', () => {
    const parsed = parseSearchQuery('git*  "deploy"  [x]')
    assert.equal(parsed.ok, true)
    assert.deepEqual(parsed.ok && parsed.terms, ['git', 'deploy', 'x'])
  })

  test('splits on the separators inside a compound term', () => {
    const parsed = parseSearchQuery('node.js react-router snake_case')
    assert.equal(parsed.ok, true)
    assert.deepEqual(parsed.ok && parsed.terms, [
      'node',
      'js',
      'react',
      'router',
      'snake',
      'case',
    ])
  })

  test('a query made only of punctuation has nothing to match on', () => {
    const parsed = parseSearchQuery('***')
    assert.equal(parsed.ok, false)
    assert.equal(parsed.ok === false && parsed.reason, 'too-short')
  })

  test('keeps digits, so a query like "2026" still searches', () => {
    const parsed = parseSearchQuery('fall 2026')
    assert.equal(parsed.ok, true)
    assert.deepEqual(parsed.ok && parsed.terms, ['fall', '2026'])
  })
})

describe('matchPatterns', () => {
  test('gives every term a prefix wildcard', () => {
    assert.deepEqual(matchPatterns(['git', 'deploy']), ['git*', 'deploy*'])
  })

  test('produces nothing for no terms', () => {
    assert.deepEqual(matchPatterns([]), [])
  })
})
