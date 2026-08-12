import { defineQuery } from 'next-sanity'

/**
 * Diagnostic read for the `/admin` write check. Not website content — see
 * `schemaTypes/documents/adminWriteCheck.ts`.
 */
export const ADMIN_WRITE_CHECK_QUERY = defineQuery(/* groq */ `
  *[_id == "adminWriteCheck"][0]{
    note,
    lastCheckedAt,
    lastCheckedBy
  }
`)
