import { cn } from '@/lib/utils'

/**
 * Form primitives for the admin.
 *
 * Deliberately thin: a label bound to a control, an optional description, and
 * an error message wired up with `aria-describedby` / `aria-invalid`. That
 * wiring is the part worth centralising, because getting it wrong is invisible
 * until someone uses a screen reader. Everything else is a plain element, so
 * these forms keep working before JavaScript loads.
 */

// `border-input` rather than `border`: control edges carry meaning, so they use
// the stronger token that clears 3:1 against white. The hairline `--border` is
// for rules between rows.
const controlClasses =
  'w-full min-h-11 rounded-md border border-input bg-background px-3 py-2 text-sm text-ink transition-colors ' +
  'hover:border-ink-faint focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none ' +
  'aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-3 aria-[invalid=true]:ring-destructive/15 ' +
  'disabled:cursor-not-allowed disabled:opacity-50'

export function FormField({
  children,
  description,
  error,
  htmlFor,
  label,
  required,
}: {
  children: React.ReactNode
  description?: string
  error?: string
  htmlFor: string
  label: string
  required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-ink text-[13px] font-semibold" htmlFor={htmlFor}>
        {label}
        {required ? (
          <span aria-hidden="true" className="text-club-link">
            {' '}
            *
          </span>
        ) : null}
        {required ? <span className="sr-only"> (required)</span> : null}
      </label>
      {description ? (
        <p className="text-ink-faint text-[12px] leading-snug" id={`${htmlFor}-description`}>
          {description}
        </p>
      ) : null}
      {children}
      <FieldError error={error} id={`${htmlFor}-error`} />
    </div>
  )
}

/**
 * The error message for one control.
 *
 * `role="alert"` so it is announced when it appears after a failed save, and it
 * always carries the word as text — never colour alone.
 */
export function FieldError({ error, id }: { error?: string; id: string }) {
  if (!error) return null

  return (
    <p className="text-destructive flex items-start gap-1 text-xs font-semibold" id={id} role="alert">
      <span aria-hidden="true">✕</span>
      {error}
    </p>
  )
}

/** The `aria-*` attributes a control needs to be described by its help and error. */
export function describedBy(id: string, { description, error }: { description?: string; error?: string }) {
  const ids = [description ? `${id}-description` : null, error ? `${id}-error` : null].filter(Boolean)

  return {
    'aria-describedby': ids.length ? ids.join(' ') : undefined,
    'aria-invalid': error ? true : undefined,
  } as const
}

export function TextInput({ className, ...props }: React.ComponentProps<'input'>) {
  return <input className={cn(controlClasses, className)} {...props} />
}

export function TextArea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return <textarea className={cn(controlClasses, 'min-h-24', className)} {...props} />
}

export function Select({ className, ...props }: React.ComponentProps<'select'>) {
  return <select className={cn(controlClasses, className)} {...props} />
}

/** A checkbox with its label to the right, sized for touch. */
export function CheckboxField({
  defaultChecked,
  description,
  id,
  label,
  name,
}: {
  defaultChecked?: boolean
  description?: string
  id: string
  label: string
  name: string
}) {
  return (
    <div className="border-rule bg-paper-warm flex items-start gap-3 rounded-md border p-3">
      <input
        aria-describedby={description ? `${id}-description` : undefined}
        className="accent-club-green mt-px size-[18px] shrink-0"
        defaultChecked={defaultChecked}
        id={id}
        name={name}
        type="checkbox"
      />
      <div className="flex flex-col gap-0.5">
        <label className="text-ink text-[13px] font-semibold" htmlFor={id}>
          {label}
        </label>
        {description ? (
          <p className="text-ink-faint text-[12px] leading-snug" id={`${id}-description`}>
            {description}
          </p>
        ) : null}
      </div>
    </div>
  )
}

/** Groups related controls under a legend, e.g. location or presenters. */
export function FieldSet({
  children,
  className,
  description,
  legend,
}: {
  children: React.ReactNode
  className?: string
  description?: string
  legend: string
}) {
  return (
    <fieldset
      className={cn(
        'border-rule-card flex flex-col gap-4 rounded-lg border bg-white p-4 sm:p-5',
        className,
      )}
    >
      <legend className="text-ink-label -ml-1 px-1 font-mono text-[10.5px] tracking-[0.16em] uppercase">
        {legend}
      </legend>
      {description ? (
        <p className="text-ink-faint -mt-2 text-[12px] leading-snug">{description}</p>
      ) : null}
      {children}
    </fieldset>
  )
}
