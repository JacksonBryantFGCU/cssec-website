import { cva, type VariantProps } from 'class-variance-authority'

/**
 * Public-site button styling.
 *
 * Exported as class variants rather than a component because nearly every
 * button in this design is really a link — a `<Link>` or an `<a>` — and
 * wrapping those in a `<button>`-shaped component is how link semantics get
 * lost. The shadcn `Button` stays in use inside `/admin`, on its own tokens.
 *
 * The four variants are the ones the reference's component page defines, and
 * its rule holds: one green primary per view, external destinations carry ↗.
 * Mobile sizes hit the 44px minimum target the same page requires.
 */
export const siteButton = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-club-green text-club-green-ink hover:bg-club-green-hover font-bold',
        secondary: 'bg-ink text-white hover:bg-ink-strong',
        outline: 'border-rule-strong text-ink-strong border bg-white hover:bg-paper',
        onNavy: 'border-navy-border text-navy-body hover:border-navy-border-hover border',
        discord: 'bg-discord text-white hover:opacity-90',
      },
      size: {
        // 46–48px tall on touch, the tighter reference metrics from `lg` up.
        md: 'min-h-11 px-4 py-3 text-[15px] lg:min-h-0 lg:px-[17px] lg:py-2.5 lg:text-[13.5px]',
        sm: 'min-h-11 px-3.5 py-2.5 text-sm lg:min-h-0 lg:px-3.5 lg:py-[9px] lg:text-[13px]',
        block: 'w-full min-h-12 px-4 py-3.5 text-[15px] lg:text-sm',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export type SiteButtonVariants = VariantProps<typeof siteButton>
