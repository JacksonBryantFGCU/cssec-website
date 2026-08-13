import { BookIcon } from '@sanity/icons/Book'
import { CalendarIcon } from '@sanity/icons/Calendar'
import { CaseIcon } from '@sanity/icons/Case'
import { CogIcon } from '@sanity/icons/Cog'
import { RocketIcon } from '@sanity/icons/Rocket'
import { UsersIcon } from '@sanity/icons/Users'
import type { ComponentType } from 'react'
import type { StructureBuilder, StructureResolver } from 'sanity/structure'

import { SINGLETON_TYPES } from './schemaTypes'

/**
 * Studio navigation for CSSEC officers.
 *
 * Grouped by the thing being managed rather than by schema name, with the most
 * common views (upcoming events, active opportunities, current officers) as
 * their own entries so nobody has to build a filter by hand.
 */

/** Types that already have a home in the structure below. */
const PLACED_TYPES: string[] = [
  ...SINGLETON_TYPES,
  'event',
  'project',
  'resource',
  'opportunity',
  'person',
  'officerRole',
]

/** Locks a document type to a single fixed document id. */
function singleton(
  S: StructureBuilder,
  type: string,
  title: string,
  icon: ComponentType = CogIcon,
) {
  return S.listItem()
    .id(type)
    .title(title)
    .icon(icon)
    .child(S.document().schemaType(type).documentId(type).title(title))
}

const eventList = (S: StructureBuilder) =>
  S.list()
    .title('Events')
    .items([
      S.listItem()
        .title('Upcoming')
        .icon(CalendarIcon)
        .child(
          S.documentTypeList('event')
            .title('Upcoming events')
            .filter('_type == "event" && status != "completed" && dateTime(startsAt) >= dateTime(now())')
            .defaultOrdering([{ field: 'startsAt', direction: 'asc' }]),
        ),
      S.listItem()
        .title('Past')
        .icon(CalendarIcon)
        .child(
          S.documentTypeList('event')
            .title('Past events')
            .filter('_type == "event" && (status == "completed" || dateTime(startsAt) < dateTime(now()))')
            .defaultOrdering([{ field: 'startsAt', direction: 'desc' }]),
        ),
      S.divider(),
      S.documentTypeListItem('event').title('All events'),
    ])

const projectList = (S: StructureBuilder) =>
  S.list()
    .title('Projects')
    .items([
      ...(
        [
          ['recruiting', 'Recruiting'],
          ['active', 'Active'],
          ['shipped', 'Shipped'],
          ['archived', 'Archived'],
        ] as const
      ).map(([status, title]) =>
        S.listItem()
          .id(`project-${status}`)
          .title(title)
          .icon(RocketIcon)
          .child(
            S.documentTypeList('project')
              .title(`${title} projects`)
              .filter('_type == "project" && status == $status')
              .params({ status }),
          ),
      ),
      S.divider(),
      S.documentTypeListItem('project').title('All projects'),
    ])

const resourceList = (S: StructureBuilder) =>
  S.list()
    .title('Resources')
    .items([
      ...(
        [
          ['workshop', 'Workshops'],
          ['guide', 'Guides'],
          ['slides', 'Slides'],
          ['cheatSheet', 'Cheat sheets'],
          ['recording', 'Recordings'],
          ['repository', 'Repositories'],
        ] as const
      ).map(([resourceType, title]) =>
        S.listItem()
          .id(`resource-${resourceType}`)
          .title(title)
          .icon(BookIcon)
          .child(
            S.documentTypeList('resource')
              .title(title)
              .filter('_type == "resource" && resourceType == $resourceType')
              .params({ resourceType })
              .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }]),
          ),
      ),
      S.divider(),
      S.documentTypeListItem('resource').title('All resources'),
    ])

const opportunityList = (S: StructureBuilder) =>
  S.list()
    .title('Opportunities')
    .items([
      S.listItem()
        .id('opportunity-open')
        .title('Open')
        .icon(CaseIcon)
        .child(
          S.documentTypeList('opportunity')
            .title('Open opportunities')
            .filter('_type == "opportunity" && (!defined(deadline) || dateTime(deadline + "T23:59:59Z") >= dateTime(now()))')
            .defaultOrdering([{ field: 'deadline', direction: 'asc' }]),
        ),
      S.listItem()
        .id('opportunity-expired')
        .title('Expired')
        .icon(CaseIcon)
        .child(
          S.documentTypeList('opportunity')
            .title('Expired opportunities')
            .filter('_type == "opportunity" && defined(deadline) && dateTime(deadline + "T23:59:59Z") < dateTime(now())')
            .defaultOrdering([{ field: 'deadline', direction: 'desc' }]),
        ),
      S.divider(),
      ...(
        [
          ['internship', 'Internships'],
          ['hackathon', 'Hackathons'],
          ['research', 'Research'],
          ['scholarship', 'Scholarships'],
        ] as const
      ).map(([opportunityType, title]) =>
        S.listItem()
          .id(`opportunity-${opportunityType}`)
          .title(title)
          .icon(CaseIcon)
          .child(
            S.documentTypeList('opportunity')
              .title(title)
              .filter('_type == "opportunity" && opportunityType == $opportunityType')
              .params({ opportunityType })
              .defaultOrdering([{ field: 'deadline', direction: 'asc' }]),
          ),
      ),
      S.divider(),
      S.documentTypeListItem('opportunity').title('All opportunities'),
    ])

const peopleList = (S: StructureBuilder) =>
  S.list()
    .title('People')
    .items([
      S.listItem()
        .id('officers-current')
        .title('Current officers')
        .icon(UsersIcon)
        .child(
          S.documentTypeList('officerRole')
            .title('Current officers')
            .filter('_type == "officerRole" && isCurrent == true')
            .defaultOrdering([{ field: 'displayOrder', direction: 'asc' }]),
        ),
      S.documentTypeListItem('officerRole').title('All officer terms'),
      S.divider(),
      S.documentTypeListItem('person').title('All people'),
    ])

export const structure: StructureResolver = (S) =>
  S.list()
    .title('CSSEC Content')
    .items([
      singleton(S, 'siteSettings', 'Site settings'),
      S.divider(),
      S.listItem().title('Events').icon(CalendarIcon).child(eventList(S)),
      S.listItem().title('Projects').icon(RocketIcon).child(projectList(S)),
      S.listItem().title('Resources').icon(BookIcon).child(resourceList(S)),
      S.listItem().title('Opportunities').icon(CaseIcon).child(opportunityList(S)),
      S.listItem().title('People').icon(UsersIcon).child(peopleList(S)),
      S.divider(),
      // Anything added to the schema later still shows up, minus what is
      // already placed above.
      ...S.documentTypeListItems().filter((listItem) => {
        const id = listItem.getId()
        return !!id && !PLACED_TYPES.includes(id)
      }),
    ])
