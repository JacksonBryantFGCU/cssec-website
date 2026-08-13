import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { nextResultIndex, shouldOpenSearch, type ShortcutEvent } from './keyboard.ts'

describe('nextResultIndex', () => {
  test('moves down and up through the list', () => {
    assert.equal(nextResultIndex(0, 5, 'down'), 1)
    assert.equal(nextResultIndex(3, 5, 'up'), 2)
  })

  test('wraps past the end and before the start', () => {
    assert.equal(nextResultIndex(4, 5, 'down'), 0)
    assert.equal(nextResultIndex(0, 5, 'up'), 4)
  })

  test('a single result stays put in both directions', () => {
    assert.equal(nextResultIndex(0, 1, 'down'), 0)
    assert.equal(nextResultIndex(0, 1, 'up'), 0)
  })

  test('an empty list has no selection to move', () => {
    assert.equal(nextResultIndex(0, 0, 'down'), 0)
    assert.equal(nextResultIndex(3, 0, 'up'), 0)
  })

  test('an index left over from a longer list restarts instead of wrapping oddly', () => {
    assert.equal(nextResultIndex(9, 3, 'down'), 1)
    assert.equal(nextResultIndex(-2, 3, 'down'), 1)
  })
})

describe('shouldOpenSearch', () => {
  const event = (over: Partial<ShortcutEvent> = {}): ShortcutEvent => ({
    key: 'k',
    metaKey: true,
    ctrlKey: false,
    targetTag: 'BODY',
    ...over,
  })

  test('opens on Cmd+K and on Ctrl+K', () => {
    assert.equal(shouldOpenSearch(event()), true)
    assert.equal(shouldOpenSearch(event({ metaKey: false, ctrlKey: true })), true)
  })

  test('is case-insensitive about the key', () => {
    assert.equal(shouldOpenSearch(event({ key: 'K' })), true)
  })

  test('ignores K without a modifier, and other modified keys', () => {
    assert.equal(shouldOpenSearch(event({ metaKey: false, ctrlKey: false })), false)
    assert.equal(shouldOpenSearch(event({ key: 'j' })), false)
  })

  test('does not steal the shortcut from a text field', () => {
    for (const tag of ['INPUT', 'TEXTAREA', 'SELECT']) {
      assert.equal(shouldOpenSearch(event({ targetTag: tag })), false, tag)
    }
  })

  test('does not steal the shortcut from a contenteditable region', () => {
    assert.equal(
      shouldOpenSearch(event({ targetTag: 'DIV', targetIsContentEditable: true })),
      false,
    )
  })

  test('still opens from an ordinary element or with no focus at all', () => {
    assert.equal(shouldOpenSearch(event({ targetTag: 'DIV' })), true)
    assert.equal(shouldOpenSearch(event({ targetTag: null })), true)
  })
})
