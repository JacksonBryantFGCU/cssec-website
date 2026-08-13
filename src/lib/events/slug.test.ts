import assert from 'node:assert/strict'
import { test } from 'node:test'

import { isValidSlug, SLUG_MAX_LENGTH, slugify, uniqueSlug } from './slug.ts'

test('titles become readable slugs', () => {
  assert.equal(slugify('Intro to Git & GitHub'), 'intro-to-git-github')
  assert.equal(slugify('  Résumé Workshop  '), 'resume-workshop')
  assert.equal(slugify('C++ / Data Structures 101'), 'c-data-structures-101')
})

test('slugs never start, end or double up on hyphens', () => {
  assert.equal(slugify('--- hello --- world ---'), 'hello-world')
  assert.equal(slugify('!!!'), '')
})

test('slugs respect the schema length limit', () => {
  const slug = slugify('a'.repeat(200))
  assert.equal(slug.length, SLUG_MAX_LENGTH)
  assert.ok(isValidSlug(slug))
})

test('a long title truncated mid-word does not keep a trailing hyphen', () => {
  const slug = slugify(`${'a'.repeat(SLUG_MAX_LENGTH - 1)} bbb`)
  assert.ok(!slug.endsWith('-'))
  assert.ok(isValidSlug(slug))
})

test('invalid slugs are rejected', () => {
  for (const value of ['', 'Has Spaces', 'UPPER', 'trailing-', '-leading', 'double--hyphen', 'sym$bol']) {
    assert.equal(isValidSlug(value), false, `expected ${value} to be invalid`)
  }
  assert.equal(isValidSlug('git-workshop-2026'), true)
})

test('collisions get a readable numeric suffix', () => {
  assert.equal(uniqueSlug('git-workshop', []), 'git-workshop')
  assert.equal(uniqueSlug('git-workshop', ['git-workshop']), 'git-workshop-2')
  assert.equal(uniqueSlug('git-workshop', ['git-workshop', 'git-workshop-2']), 'git-workshop-3')
})

test('a suffixed collision still fits the length limit', () => {
  const desired = 'a'.repeat(SLUG_MAX_LENGTH)
  const result = uniqueSlug(desired, [desired])
  assert.ok(result.length <= SLUG_MAX_LENGTH)
  assert.ok(isValidSlug(result))
})
