import assert from 'node:assert/strict'
import { test } from 'node:test'

import { readRows, rowKey, withoutBlankRows } from './rows.ts'

const FIELDS = {
  title: 'openRoleTitle',
  description: 'openRoleDescription',
} as const

function form(entries: Array<[string, string]>): FormData {
  const data = new FormData()
  for (const [name, value] of entries) data.append(name, value)
  return data
}

test('parallel controls become one object per row, in order', () => {
  const rows = readRows(
    form([
      ['openRoleTitle', 'Frontend contributor'],
      ['openRoleDescription', 'Build the UI'],
      ['openRoleTitle', 'API developer'],
      ['openRoleDescription', 'Build the API'],
    ]),
    FIELDS,
  )

  assert.deepEqual(rows, [
    { title: 'Frontend contributor', description: 'Build the UI' },
    { title: 'API developer', description: 'Build the API' },
  ])
})

test('a row whose optional field is empty stays aligned with its neighbours', () => {
  const rows = readRows(
    form([
      ['openRoleTitle', 'Designer'],
      ['openRoleDescription', ''],
      ['openRoleTitle', 'Tester'],
      ['openRoleDescription', 'Write test plans'],
    ]),
    FIELDS,
  )

  assert.equal(rows[0].title, 'Designer')
  assert.equal(rows[0].description, '')
  assert.equal(rows[1].description, 'Write test plans')
})

test('a short column pads rather than shifting later rows up', () => {
  const rows = readRows(
    form([
      ['openRoleTitle', 'Designer'],
      ['openRoleTitle', 'Tester'],
      ['openRoleDescription', 'Only one description arrived'],
    ]),
    FIELDS,
  )

  assert.equal(rows.length, 2)
  assert.equal(rows[1].title, 'Tester')
  assert.equal(rows[1].description, '')
})

test('no controls at all means no rows', () => {
  assert.deepEqual(readRows(form([]), FIELDS), [])
})

test('rows the officer left completely empty are dropped', () => {
  const rows = [
    { title: 'Frontend contributor', description: '' },
    { title: '   ', description: '  ' },
    { title: '', description: 'Orphaned description' },
  ]

  assert.deepEqual(withoutBlankRows(rows), [
    { title: 'Frontend contributor', description: '' },
    { title: '', description: 'Orphaned description' },
  ])
})

test('array keys are unique within the array', () => {
  const keys = [0, 1, 2].map((index) => rowKey('role', index))
  assert.equal(new Set(keys).size, keys.length)
})
