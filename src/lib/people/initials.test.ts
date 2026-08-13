import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { initialsFor } from './initials.ts'

describe('initialsFor', () => {
  test('takes the first and last name', () => {
    assert.equal(initialsFor('Jackson Bryant'), 'JB')
  })

  test('skips the middle of a longer name', () => {
    assert.equal(initialsFor('Maria del Carmen Rivera'), 'MR')
  })

  test('a single name gives one letter', () => {
    assert.equal(initialsFor('Prince'), 'P')
  })

  test('is upper-cased whatever the record says', () => {
    assert.equal(initialsFor('devon cole'), 'DC')
  })

  test('surrounding and repeated whitespace is ignored', () => {
    assert.equal(initialsFor('   Aisha    Nguyen  '), 'AN')
  })

  test('a missing or blank name falls back rather than rendering empty', () => {
    for (const input of [null, undefined, '', '   ']) {
      assert.equal(initialsFor(input), '?')
    }
  })

  test('a non-latin name keeps its own first characters', () => {
    assert.equal(initialsFor('Aoi Yamada'), 'AY')
  })
})
