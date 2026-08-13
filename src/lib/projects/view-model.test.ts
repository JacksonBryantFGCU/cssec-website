import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  isBeginnerFriendly,
  matchesLevel,
  openRolesLabel,
  projectLevelLabel,
  projectStatusLabel,
  PROJECT_STATUS_FACET,
  rolesSummary,
} from './view-model.ts'

describe('isBeginnerFriendly', () => {
  it('trusts the explicit flag over the level', () => {
    // An advanced-looking project that says beginners are welcome is welcoming
    // beginners — the flag is the officer's deliberate statement.
    assert.equal(
      isBeginnerFriendly({ experienceLevel: 'advanced', noExperienceRequired: true }),
      true,
    )
  })

  it('treats "any" and "beginner" as beginner friendly', () => {
    assert.equal(isBeginnerFriendly({ experienceLevel: 'any' }), true)
    assert.equal(isBeginnerFriendly({ experienceLevel: 'beginner' }), true)
  })

  it('treats intermediate and advanced as assuming experience', () => {
    assert.equal(isBeginnerFriendly({ experienceLevel: 'intermediate' }), false)
    assert.equal(isBeginnerFriendly({ experienceLevel: 'advanced' }), false)
  })

  it('treats a project with no level set as not beginner-flagged', () => {
    assert.equal(isBeginnerFriendly({}), false)
  })
})

describe('matchesLevel', () => {
  const beginner = { experienceLevel: 'any' as const }
  const advanced = { experienceLevel: 'advanced' as const }

  it('matches everything when no level is selected', () => {
    assert.equal(matchesLevel(beginner, null), true)
    assert.equal(matchesLevel(advanced, null), true)
  })

  it('splits the two buckets without overlap', () => {
    assert.equal(matchesLevel(beginner, 'beginner'), true)
    assert.equal(matchesLevel(beginner, 'experienced'), false)
    assert.equal(matchesLevel(advanced, 'experienced'), true)
    assert.equal(matchesLevel(advanced, 'beginner'), false)
  })
})

describe('projectLevelLabel', () => {
  it('leads with the beginner promise when the flag is set', () => {
    assert.equal(
      projectLevelLabel({ experienceLevel: 'intermediate', noExperienceRequired: true }),
      'No experience required',
    )
  })

  it('falls back to the schema title, then to a sane default', () => {
    assert.equal(projectLevelLabel({ experienceLevel: 'advanced' }), 'Advanced')
    assert.equal(projectLevelLabel({}), 'Any experience level')
  })
})

describe('projectStatusLabel', () => {
  it('maps a known status and passes an unknown one through', () => {
    assert.equal(projectStatusLabel('recruiting'), 'Recruiting')
    assert.equal(projectStatusLabel('something-new'), 'something-new')
    assert.equal(projectStatusLabel(null), 'Project')
  })
})

describe('PROJECT_STATUS_FACET', () => {
  it('omits idea, which the index groups separately', () => {
    assert.equal(
      PROJECT_STATUS_FACET.some((option) => option.value === 'idea'),
      false,
    )
    assert.equal(
      PROJECT_STATUS_FACET.some((option) => option.value === 'recruiting'),
      true,
    )
  })
})

describe('rolesSummary', () => {
  it('lists role titles', () => {
    assert.equal(
      rolesSummary([{ title: 'Frontend' }, { title: 'Backend' }]),
      'Frontend · Backend',
    )
  })

  it('ignores blank titles and falls back to the count', () => {
    assert.equal(rolesSummary([{ title: '  ' }, { title: null }], 2), '2 open')
  })

  it('returns null when there is nothing open, so callers can drop the block', () => {
    assert.equal(rolesSummary([], 0), null)
    assert.equal(rolesSummary(null, null), null)
  })
})

describe('openRolesLabel', () => {
  it('agrees with itself about singular and plural', () => {
    assert.equal(openRolesLabel(1), '1 OPEN ROLE')
    assert.equal(openRolesLabel(3), '3 OPEN ROLES')
    assert.equal(openRolesLabel(0), 'NO OPEN ROLES')
    assert.equal(openRolesLabel(-1), 'NO OPEN ROLES')
  })
})
