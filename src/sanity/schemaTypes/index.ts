import { type SchemaTypeDefinition } from 'sanity'

import { adminWriteCheck } from './documents/adminWriteCheck'
import { event } from './documents/event'
import { officerRole } from './documents/officerRole'
import { opportunity } from './documents/opportunity'
import { person } from './documents/person'
import { project } from './documents/project'
import { resource } from './documents/resource'
import { siteSettings } from './documents/siteSettings'
import { eventLocation } from './objects/eventLocation'
import { openRole } from './objects/openRole'
import { seo } from './objects/seo'
import { socialLink } from './objects/socialLink'

/** Document types that may only ever have one instance. */
export const SINGLETON_TYPES = ['siteSettings', 'adminWriteCheck'] as const

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    // Documents
    siteSettings,
    event,
    project,
    resource,
    opportunity,
    person,
    officerRole,
    // Diagnostics
    adminWriteCheck,
    // Objects
    seo,
    socialLink,
    eventLocation,
    openRole,
  ],
}
