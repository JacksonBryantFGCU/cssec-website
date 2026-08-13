import Image from 'next/image'

import { initialsFor } from '@/lib/people/initials'
import { sanityImageProps, type SanityImageValue } from '@/sanity/lib/image'
import { cn } from '@/lib/utils'

/**
 * A person's portrait, or their initials.
 *
 * A `person.photo` is optional in the schema and will often be missing — an
 * officer board is usually filled in before everyone has sent a picture. So the
 * absent case is a designed state rather than a gap: initials on the club's own
 * surface colour, which stays honest about there being no photograph instead of
 * substituting a stock headshot or a generic silhouette.
 *
 * The alt text is deliberately just the person's name. Their short bio is
 * rendered beside the portrait as text, and repeating it into `alt` would make
 * a screen reader read the same sentence twice while describing a picture that
 * does not contain it.
 */
export function PersonAvatar({
  name,
  photo,
  size = 56,
  className,
}: {
  name: string | null
  photo: SanityImageValue
  size?: number
  className?: string
}) {
  // Requested at 2× so the portrait stays sharp on a retina screen while still
  // being a small crop rather than the original upload.
  const image = sanityImageProps(photo, {
    width: size * 2,
    height: size * 2,
    alt: name ?? '',
  })

  const shared = 'shrink-0 overflow-hidden rounded-full'

  if (!image) {
    return (
      <span
        aria-hidden
        className={cn(
          shared,
          'bg-club-surface text-club-dark border-club-border grid place-items-center border font-mono font-semibold',
          className,
        )}
        style={{ width: size, height: size, fontSize: Math.round(size * 0.32) }}
      >
        {initialsFor(name)}
      </span>
    )
  }

  return (
    <Image
      alt={image.alt}
      blurDataURL={image.blurDataURL}
      className={cn(shared, 'border-rule border object-cover', className)}
      height={size}
      placeholder={image.blurDataURL ? 'blur' : undefined}
      sizes={`${size}px`}
      src={image.src}
      width={size}
    />
  )
}
