import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  buildChips,
  countValues,
  filterHref,
  hasActiveFilters,
  optionsFromCounts,
  parseFilterParam,
  parseFilters,
} from './params.ts'

const STATUSES = ['recruiting', 'active', 'shipped'] as const

describe('parseFilterParam', () => {
  it('accepts a known value', () => {
    assert.equal(parseFilterParam('recruiting', STATUSES), 'recruiting')
  })

  it('treats an unknown value as no filter rather than erroring', () => {
    assert.equal(parseFilterParam('nonsense', STATUSES), null)
    assert.equal(parseFilterParam('', STATUSES), null)
    assert.equal(parseFilterParam(undefined, STATUSES), null)
  })

  it('takes the first of a repeated parameter', () => {
    assert.equal(parseFilterParam(['active', 'shipped'], STATUSES), 'active')
  })

  it('ignores a repeated parameter whose first value is unknown', () => {
    assert.equal(parseFilterParam(['nope', 'active'], STATUSES), null)
  })

  it('tolerates surrounding whitespace from a hand-edited URL', () => {
    assert.equal(parseFilterParam(' active ', STATUSES), 'active')
  })
})

describe('parseFilters', () => {
  it('parses several facets at once and keeps unknown ones null', () => {
    const active = parseFilters(
      { status: 'active', level: 'wrong', unrelated: 'x' },
      { status: STATUSES, level: ['beginner'] },
    )

    assert.deepEqual(active, { status: 'active', level: null })
  })
})

describe('filterHref', () => {
  const active = { status: 'recruiting', level: null }

  it('sets a facet while keeping the others', () => {
    assert.equal(
      filterHref('/projects', active, 'level', 'beginner'),
      '/projects?level=beginner&status=recruiting',
    )
  })

  it('clears the facet when the active value is chosen again', () => {
    assert.equal(filterHref('/projects', active, 'status', 'recruiting'), '/projects')
  })

  it('clearing one facet leaves the other in place', () => {
    const both = { status: 'recruiting', level: 'beginner' }
    assert.equal(filterHref('/projects', both, 'status', 'recruiting'), '/projects?level=beginner')
  })

  it('returns the bare path when nothing is filtered', () => {
    assert.equal(filterHref('/projects', {}, 'status', null), '/projects')
  })

  it('orders parameters so one filter state has one URL', () => {
    const a = filterHref('/resources', { type: 'guide' }, 'topic', 'git')
    const b = filterHref('/resources', { topic: 'git' }, 'type', 'guide')
    assert.equal(a, b)
  })

  it('encodes values that are not URL-safe', () => {
    assert.equal(filterHref('/resources', {}, 'topic', 'c++ & more'), '/resources?topic=c%2B%2B+%26+more')
  })
})

describe('hasActiveFilters', () => {
  it('is false only when every facet is empty', () => {
    assert.equal(hasActiveFilters({ status: null, level: null }), false)
    assert.equal(hasActiveFilters({ status: null, level: 'beginner' }), true)
    assert.equal(hasActiveFilters({}), false)
  })
})

describe('countValues', () => {
  it('counts a single-valued field', () => {
    const counts = countValues([{ s: 'a' }, { s: 'b' }, { s: 'a' }], (item) => item.s)
    assert.equal(counts.get('a'), 2)
    assert.equal(counts.get('b'), 1)
  })

  it('counts array fields and ignores empty values', () => {
    const counts = countValues(
      [{ t: ['git', 'cli'] }, { t: ['git'] }, { t: null }],
      (item) => item.t,
    )
    assert.equal(counts.get('git'), 2)
    assert.equal(counts.get('cli'), 1)
    assert.equal(counts.size, 2)
  })

  it('counts a value repeated on one item only once', () => {
    const counts = countValues([{ t: ['git', 'git'] }], (item) => item.t)
    assert.equal(counts.get('git'), 1)
  })
})

describe('buildChips', () => {
  const options = [
    { value: 'recruiting', title: 'Recruiting' },
    { value: 'active', title: 'Active' },
    { value: 'shipped', title: 'Shipped' },
  ]

  it('drops options that would return nothing', () => {
    const chips = buildChips({
      active: { status: null },
      basePath: '/projects',
      counts: new Map([['recruiting', 2]]),
      key: 'status',
      options,
      total: 2,
    })

    assert.deepEqual(
      chips.map((chip) => chip.label),
      ['All', 'Recruiting'],
    )
    assert.equal(chips[0].active, true)
  })

  it('keeps the active chip visible even when it now matches nothing', () => {
    // Otherwise the filter that emptied the page cannot be cleared from the row.
    const chips = buildChips({
      active: { status: 'shipped' },
      basePath: '/projects',
      counts: new Map([['recruiting', 2]]),
      key: 'status',
      options,
      total: 2,
    })

    const shipped = chips.find((chip) => chip.value === 'shipped')
    assert.ok(shipped, 'the active chip should still be rendered')
    assert.equal(shipped.active, true)
    assert.equal(shipped.count, 0)
    assert.equal(shipped.href, '/projects', 'clicking it clears the filter')
  })

  it('marks All active when no filter is set', () => {
    const chips = buildChips({
      active: {},
      basePath: '/projects',
      counts: new Map([['active', 1]]),
      key: 'status',
      options,
      total: 1,
    })

    assert.equal(chips[0].active, true)
  })
})

describe('optionsFromCounts', () => {
  it('orders by frequency, then alphabetically, and caps the row', () => {
    const counts = new Map([
      ['react', 1],
      ['git', 5],
      ['node', 1],
    ])

    assert.deepEqual(
      optionsFromCounts(counts, 2).map((option) => option.value),
      ['git', 'node'],
    )
  })
})
