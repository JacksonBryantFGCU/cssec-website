/**
 * What `/admin` will accept as an upload, decided before any bytes move.
 *
 * The upload path is: officer's browser → Server Action (multipart) → Sanity's
 * asset API, using the server-only write token. The token never leaves the
 * server and there is no "get a signed URL and POST from the browser" step,
 * which is the pattern that most often ends up as an open upload endpoint.
 *
 * The trade is that every byte passes through the Next.js server, so the sizes
 * below are real limits rather than advice — `serverActions.bodySizeLimit` in
 * `next.config.ts` is set just above the largest of them, and a submission over
 * that limit is rejected by the framework before the action runs. Anything
 * bigger (long recordings, raw video) belongs on YouTube or Drive with a link,
 * which is what the resource schema's `externalUrl` is for.
 *
 * Pure and dependency-free: the rules are unit tested, and both the Server
 * Action and the form's `accept` attribute are generated from the same lists.
 */

export type UploadKind = 'image' | 'document'

export type UploadRules = {
  /** MIME types Sanity will be handed. */
  mimeTypes: readonly string[]
  /** Extensions, for the file picker and for the officer-facing message. */
  extensions: readonly string[]
  maxBytes: number
  /** Human size for error messages and help text, e.g. "5 MB". */
  maxLabel: string
}

const MB = 1024 * 1024

export const IMAGE_UPLOAD: UploadRules = {
  mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
  extensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'],
  maxBytes: 5 * MB,
  maxLabel: '5 MB',
}

export const DOCUMENT_UPLOAD: UploadRules = {
  mimeTypes: [
    'application/pdf',
    'application/zip',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/msword',
    'text/plain',
    'text/markdown',
    'text/csv',
  ],
  extensions: ['.pdf', '.zip', '.pptx', '.docx', '.xlsx', '.ppt', '.doc', '.txt', '.md', '.csv'],
  maxBytes: 10 * MB,
  maxLabel: '10 MB',
}

export function rulesFor(kind: UploadKind): UploadRules {
  return kind === 'image' ? IMAGE_UPLOAD : DOCUMENT_UPLOAD
}

/** The `accept` attribute for a file input, so the picker matches the rules. */
export function acceptAttribute(rules: UploadRules): string {
  return [...rules.extensions, ...rules.mimeTypes].join(',')
}

/** The minimum a `File` has to look like — kept structural so tests need no DOM. */
export type UploadCandidate = {
  name: string
  size: number
  type: string
}

export type UploadCheck =
  | { outcome: 'empty' }
  | { outcome: 'rejected'; message: string }
  | { outcome: 'accepted'; filename: string; contentType: string }

/** Strips directory components and anything awkward out of a browser filename. */
export function safeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? ''
  const cleaned = base
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^[-.]+/, '')
    .slice(0, 120)

  return cleaned || 'upload'
}

/**
 * Decides whether an upload may proceed.
 *
 * An unfilled file input still submits a zero-byte `File`, so "empty" is a
 * normal outcome meaning "the officer did not choose a file" — not an error.
 */
export function checkUpload(
  file: UploadCandidate | null | undefined,
  kind: UploadKind,
): UploadCheck {
  if (!file || file.size === 0 || !file.name) return { outcome: 'empty' }

  const rules = rulesFor(kind)

  if (file.size > rules.maxBytes) {
    return {
      outcome: 'rejected',
      message: `That file is larger than ${rules.maxLabel}. ${
        kind === 'image'
          ? 'Resize or compress it and try again.'
          : 'Link to it instead, or upload it in the Advanced CMS.'
      }`,
    }
  }

  const filename = safeFilename(file.name)
  const extension = filename.includes('.') ? filename.slice(filename.lastIndexOf('.')).toLowerCase() : ''
  const declaredType = file.type.split(';')[0].trim().toLowerCase()

  // Either signal is enough: browsers send an empty `type` for some formats,
  // and send `application/octet-stream` for others, but the extension survives.
  const typeAllowed = declaredType !== '' && rules.mimeTypes.includes(declaredType)
  const extensionAllowed = extension !== '' && rules.extensions.includes(extension)

  if (!typeAllowed && !extensionAllowed) {
    return {
      outcome: 'rejected',
      message: `That file type is not supported. Allowed: ${rules.extensions.join(', ')}.`,
    }
  }

  return {
    outcome: 'accepted',
    filename,
    // Prefer the browser's type when we recognise it; otherwise let Sanity
    // sniff, rather than asserting a type from the extension alone.
    contentType: typeAllowed ? declaredType : 'application/octet-stream',
  }
}
