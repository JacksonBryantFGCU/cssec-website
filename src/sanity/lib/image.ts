import { createImageUrlBuilder, type SanityImageSource } from '@sanity/image-url'

import { dataset, projectId } from '../env'

// https://www.sanity.io/docs/image-url
const builder = createImageUrlBuilder({ projectId, dataset })

export const urlFor = (source: SanityImageSource) => {
  return builder.image(source)
}

/**
 * The shape every image in the GROQ layer comes back as.
 *
 * This is `imageFragment` in `src/sanity/queries/fragments.ts`, written
 * structurally rather than imported from the generated types: TypeGen produces
 * one anonymous object type per query, so a nominal import would only ever fit
 * a single call site. Every field is optional because a half-filled image is a
 * real state — an officer can save a document before choosing a picture.
 */
export type SanityImageValue = {
  asset?: {
    _id?: string | null
    url?: string | null
    metadata?: {
      lqip?: string | null
      dimensions?: { width?: number | null; height?: number | null } | null
    } | null
  } | null
  alt?: string | null
  hotspot?: { x?: number; y?: number; height?: number; width?: number } | null
  crop?: { top?: number; bottom?: number; left?: number; right?: number } | null
} | null

/** What `next/image` needs, plus the alt text the document carries. */
export type SanityImageProps = {
  src: string
  width: number
  height: number
  alt: string
  blurDataURL?: string
}

/**
 * Turns a queried Sanity image into props for `next/image`.
 *
 * The single place Sanity CDN URLs are constructed. Components ask for the box
 * they intend to fill and get back a URL already cropped to it, so a page never
 * downloads a 4000px original to render a 96px portrait — `next/image` alone
 * would still fetch the full asset before resizing it.
 *
 * `fit('crop')` with `auto('format')` respects any hotspot and crop the officer
 * set in Studio, so a portrait stays centred on the face when it is squared off.
 *
 * Returns `null` when there is no asset, which is the signal for a caller to
 * render its own fallback rather than an empty box.
 */
export function sanityImageProps(
  image: SanityImageValue,
  options: {
    width: number
    /** Omit for a natural-ratio image; supply it to crop to a fixed box. */
    height?: number
    /** Falls back to the image's own alt text, then to the empty string. */
    alt?: string
    quality?: number
  },
): SanityImageProps | null {
  const assetId = image?.asset?._id
  if (!assetId) return null

  const { width, height, quality = 80 } = options

  // Built from the asset id rather than passed straight through: the query
  // dereferences the asset, and the URL builder wants a reference.
  const source = {
    _type: 'image',
    asset: { _type: 'reference', _ref: assetId },
    ...(image?.hotspot ? { hotspot: { _type: 'sanity.imageHotspot', ...image.hotspot } } : {}),
    ...(image?.crop ? { crop: { _type: 'sanity.imageCrop', ...image.crop } } : {}),
  } as SanityImageSource

  let url = urlFor(source).width(width).auto('format').quality(quality)
  if (height) url = url.height(height).fit('crop')

  const dimensions = image?.asset?.metadata?.dimensions
  const naturalWidth = dimensions?.width ?? width
  const naturalHeight = dimensions?.height ?? width

  return {
    src: url.url(),
    width,
    // A cropped request is exactly the box asked for; an uncropped one keeps
    // the asset's own ratio so `next/image` reserves the right space.
    height: height ?? Math.round((width * naturalHeight) / naturalWidth),
    alt: options.alt ?? image?.alt ?? '',
    ...(image?.asset?.metadata?.lqip ? { blurDataURL: image.asset.metadata.lqip } : {}),
  }
}

