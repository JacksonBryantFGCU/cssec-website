import assert from 'node:assert/strict'
import { test } from 'node:test'

import { personRemovalPolicy, personUsageGroups } from './delete-policy.ts'

test('a person credited nowhere can be deleted', () => {
  const policy = personRemovalPolicy({})

  assert.equal(policy.canHardDelete, true)
  assert.equal(policy.blockedReason, undefined)
  assert.deepEqual(personUsageGroups({}), [])
})

test('empty arrays are the same as no usage at all', () => {
  const usage = {
    officerTerms: [],
    eventsPresented: [],
    projectsLed: [],
    projectsMentored: [],
    projectsContributed: [],
    resourcesAuthored: [],
    advisorOf: [],
  }

  assert.deepEqual(personUsageGroups(usage), [])
  assert.equal(personRemovalPolicy(usage).canHardDelete, true)
})

test('a past officer term is still history worth keeping', () => {
  const usage = {
    officerTerms: [{ _id: 'term-1', position: 'President', term: '2024–2025', isCurrent: false }],
  }

  assert.equal(personRemovalPolicy(usage).canHardDelete, false)

  const groups = personUsageGroups(usage)
  assert.equal(groups[0].role, 'Officer term')
  assert.deepEqual(groups[0].items, ['President, 2024–2025'])
  assert.equal(groups[0].href, '/admin/people/officers')
})

test('a current term is marked as such in the list', () => {
  const groups = personUsageGroups({
    officerTerms: [{ _id: 'term-1', position: 'Treasurer', term: '2025–2026', isCurrent: true }],
  })

  assert.deepEqual(groups[0].items, ['Treasurer, 2025–2026 (current)'])
})

test('every kind of credit is reported, with somewhere to go and fix it', () => {
  const groups = personUsageGroups({
    eventsPresented: [{ _id: 'event-1', title: 'Intro to Git' }],
    projectsLed: [{ _id: 'project-1', name: 'Scheduling app' }],
    projectsMentored: [{ _id: 'project-2', name: 'Study bot' }],
    projectsContributed: [{ _id: 'project-3', name: 'Club site' }],
    resourcesAuthored: [{ _id: 'resource-1', title: 'Git cheat sheet' }],
    advisorOf: [{ _id: 'siteSettings' }],
  })

  assert.deepEqual(
    groups.map((group) => group.role),
    [
      'Event presenter',
      'Project lead',
      'Project mentor',
      'Project contributor',
      'Resource author',
      'Faculty advisor',
    ],
  )
  assert.equal(groups[0].href, '/admin/events')
  assert.equal(groups[1].href, '/admin/projects')
  assert.equal(groups[4].href, '/admin/resources')
  assert.equal(groups[5].href, '/admin/settings')
})

test('the refusal counts every credit, not every kind of credit', () => {
  const policy = personRemovalPolicy({
    projectsLed: [{ _id: 'project-1', name: 'Scheduling app' }],
    projectsMentored: [{ _id: 'project-2', name: 'Study bot' }],
    resourcesAuthored: [{ _id: 'resource-1', title: 'Git cheat sheet' }],
  })

  assert.equal(policy.canHardDelete, false)
  assert.match(policy.blockedReason ?? '', /in 3 places/)
})

test('one credit is described in the singular', () => {
  const policy = personRemovalPolicy({ projectsLed: [{ _id: 'project-1', name: 'App' }] })
  assert.match(policy.blockedReason ?? '', /credited somewhere/)
})

test('untitled documents still get a usable label', () => {
  const groups = personUsageGroups({
    eventsPresented: [{ _id: 'event-1', title: null }],
    officerTerms: [{ _id: 'term-1', position: null, term: null, isCurrent: false }],
  })

  assert.deepEqual(groups[0].items, ['Officer, unknown year'])
  assert.deepEqual(groups[1].items, ['Untitled event'])
})
