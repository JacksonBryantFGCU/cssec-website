import { PortableText, type PortableTextComponents } from 'next-sanity'

import { cn } from '@/lib/utils'

/**
 * Portable Text rendered in the public site's typography.
 *
 * `PortableText` is re-exported by `next-sanity`, so this adds no dependency.
 * The components map is explicit rather than relying on defaults: the default
 * renderer emits bare tags that would inherit nothing, and every block here
 * needs the design's measure, colour and rhythm.
 */
const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="text-ink-body text-[15px] leading-[1.7]">{children}</p>
    ),
    h2: ({ children }) => (
      <h2 className="font-display text-ink mt-2 text-[19px] font-semibold">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="font-display text-ink mt-2 text-[17px] font-semibold">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-ink mt-2 text-[15px] font-semibold">{children}</h4>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-club-border text-ink-muted border-l-2 pl-4 font-serif text-[17px] leading-relaxed">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="text-ink-body flex list-disc flex-col gap-2 pl-5 text-[15px] leading-[1.7]">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="text-ink-body flex list-decimal flex-col gap-2 pl-5 text-[15px] leading-[1.7]">
        {children}
      </ol>
    ),
  },
  marks: {
    code: ({ children }) => (
      <code className="bg-rule-fill text-ink-strong rounded px-1.5 py-0.5 font-mono text-[13px]">
        {children}
      </code>
    ),
    link: ({ children, value }) => {
      const href = String(value?.href ?? '')
      const external = /^https?:\/\//.test(href)

      return (
        <a
          className="text-club-link hover:text-club-link-hover underline underline-offset-2"
          href={href}
          rel={external ? 'noreferrer noopener' : undefined}
          target={external ? '_blank' : undefined}
        >
          {children}
        </a>
      )
    },
  },
}

export function Prose({
  value,
  className,
}: {
  value: unknown
  className?: string
}) {
  if (!Array.isArray(value) || value.length === 0) return null

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <PortableText components={components} value={value} />
    </div>
  )
}
