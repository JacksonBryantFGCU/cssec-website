'use client'

/**
 * Configuration for the Sanity Studio embedded at `/studio`.
 *
 * `/studio` is the advanced CMS and fallback editor. The simplified officer
 * workflow will live at `/admin` in a later phase.
 */

import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import {apiVersion, dataset, projectId} from './src/sanity/env'
import {SINGLETON_TYPES, schema} from './src/sanity/schemaTypes'
import {structure} from './src/sanity/structure'

const singletonTypes: string[] = [...SINGLETON_TYPES]

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  // Add and edit the content schema in the './src/sanity/schemaTypes' folder
  schema,
  plugins: [
    structureTool({structure}),
    // Vision is for querying with GROQ from inside the Studio
    // https://www.sanity.io/docs/the-vision-plugin
    visionTool({defaultApiVersion: apiVersion}),
  ],
  document: {
    // Singletons are reachable only through their fixed entry in the structure,
    // so they must not appear in any "create new document" menu.
    newDocumentOptions: (prev) =>
      prev.filter((template) => !singletonTypes.includes(template.templateId)),
    // ...and they must not be deleted or duplicated into a second copy.
    actions: (prev, {schemaType}) =>
      singletonTypes.includes(schemaType)
        ? prev.filter(
            (action) =>
              !['delete', 'duplicate', 'unpublish'].includes(action.action as string),
          )
        : prev,
  },
})
