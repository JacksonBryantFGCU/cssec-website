import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  acceptAttribute,
  checkUpload,
  DOCUMENT_UPLOAD,
  IMAGE_UPLOAD,
  safeFilename,
} from './assets.ts'

/**
 * Upload rules are the security-relevant half of the file feature: everything
 * these accept is written to the club's Sanity project with the write token.
 */

const file = (name: string, size: number, type: string) => ({ name, size, type })

test('an untouched file input is "empty", not an error', () => {
  assert.equal(checkUpload(null, 'document').outcome, 'empty')
  assert.equal(checkUpload(undefined, 'image').outcome, 'empty')
  // Browsers submit a zero-byte File when nothing was chosen.
  assert.equal(checkUpload(file('', 0, ''), 'document').outcome, 'empty')
  assert.equal(checkUpload(file('slides.pdf', 0, 'application/pdf'), 'document').outcome, 'empty')
})

test('ordinary officer uploads are accepted', () => {
  const slides = checkUpload(file('Week 3 Slides.pdf', 2_000_000, 'application/pdf'), 'document')
  assert.equal(slides.outcome, 'accepted')
  assert.equal(slides.outcome === 'accepted' && slides.contentType, 'application/pdf')

  const photo = checkUpload(file('headshot.jpg', 400_000, 'image/jpeg'), 'image')
  assert.equal(photo.outcome, 'accepted')
})

test('files over the limit are rejected with a size message', () => {
  const big = checkUpload(file('recording.zip', DOCUMENT_UPLOAD.maxBytes + 1, 'application/zip'), 'document')
  assert.equal(big.outcome, 'rejected')
  assert.match(big.outcome === 'rejected' ? big.message : '', /10 MB/)

  const bigImage = checkUpload(file('poster.png', IMAGE_UPLOAD.maxBytes + 1, 'image/png'), 'image')
  assert.equal(bigImage.outcome, 'rejected')
  assert.match(bigImage.outcome === 'rejected' ? bigImage.message : '', /5 MB/)
})

test('executables and scripts are rejected whatever they claim to be', () => {
  for (const candidate of [
    file('payload.exe', 1000, 'application/x-msdownload'),
    file('payload.sh', 1000, 'text/x-shellscript'),
    file('payload.html', 1000, 'text/html'),
    file('payload.svg', 1000, 'image/svg+xml'),
  ]) {
    assert.equal(checkUpload(candidate, 'document').outcome, 'rejected', candidate.name)
    assert.equal(checkUpload(candidate, 'image').outcome, 'rejected', candidate.name)
  }
})

test('an image cannot be uploaded where a document is expected, and vice versa', () => {
  assert.equal(checkUpload(file('slides.pdf', 1000, 'application/pdf'), 'image').outcome, 'rejected')
  assert.equal(checkUpload(file('photo.jpg', 1000, 'image/jpeg'), 'document').outcome, 'rejected')
})

test('a recognised extension carries a file the browser typed vaguely', () => {
  // Windows often sends application/octet-stream for .pptx.
  const check = checkUpload(file('deck.pptx', 1000, 'application/octet-stream'), 'document')
  assert.equal(check.outcome, 'accepted')
  // We do not assert a type we only inferred from the name.
  assert.equal(check.outcome === 'accepted' && check.contentType, 'application/octet-stream')
})

test('filenames are stripped of paths and anything awkward', () => {
  assert.equal(safeFilename('C:\\Users\\officer\\Desktop\\Git Slides.pdf'), 'Git-Slides.pdf')
  assert.equal(safeFilename('../../etc/passwd'), 'passwd')
  assert.equal(safeFilename('...'), 'upload')
  assert.equal(safeFilename(''), 'upload')
  assert.ok(safeFilename(`${'a'.repeat(300)}.pdf`).length <= 120)
})

test('the picker offers exactly what the server accepts', () => {
  const accept = acceptAttribute(DOCUMENT_UPLOAD)
  for (const extension of DOCUMENT_UPLOAD.extensions) assert.ok(accept.includes(extension))
  for (const mime of DOCUMENT_UPLOAD.mimeTypes) assert.ok(accept.includes(mime))
})
