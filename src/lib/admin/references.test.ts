import assert from 'node:assert/strict'
import { test } from 'node:test'

import { missingReferences, referenceKey, toReference, toReferenceArray } from './references.ts'

test('every member of a reference array gets a distinct key', () => {
  const refs = toReferenceArray(['person-abc', 'drafts.person-abc-2', 'a1B2c3'])

  assert.ok(refs)
  assert.equal(new Set(refs.map((ref) => ref._key)).size, 3)
  for (const ref of refs) {
    assert.match(ref._key, /^[A-Za-z0-9]+$/)
    assert.equal(ref._type, 'reference')
  }
})

test('the stored id is never rewritten by the key derivation', () => {
  const refs = toReferenceArray(['drafts.person-abc'])
  assert.equal(refs?.[0]._ref, 'drafts.person-abc')
  assert.equal(referenceKey('drafts.person-abc'), 'draftspersonabc')
})

test('a repeated id cannot produce a duplicate key', () => {
  // Sanity refuses a document whose array members share a _key, and a
  // hand-built POST is the only way to get here.
  const refs = toReferenceArray(['person-1', 'person-1', 'person-2'])
  assert.equal(refs?.length, 2)
})

test('an empty selection is undefined, so the update unsets the field', () => {
  assert.equal(toReferenceArray([]), undefined)
  assert.equal(toReference(undefined), undefined)
  assert.deepEqual(toReference('person-1'), { _type: 'reference', _ref: 'person-1' })
})

test('references to documents that no longer exist are reported', () => {
  assert.deepEqual(missingReferences(['a', 'b', 'c'], ['a', 'c']), ['b'])
  assert.deepEqual(missingReferences([], ['a']), [])
  assert.deepEqual(missingReferences(['a'], ['a']), [])
})
