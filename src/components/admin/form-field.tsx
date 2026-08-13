import Link from 'next/link'

import { Button, buttonVariants } from '@/components/ui/button'
import { acceptAttribute, rulesFor, type UploadKind } from '@/lib/admin/assets'
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

/**
 * The banner a rejected save puts above the form.
 *
 * `role="alert"` so the reason is announced rather than only appearing; the
 * per-field messages under each control say *where*, this says *what*.
 */
export function FormAlert({ message }: { message?: string }) {
  if (!message) return null

  return (
    <p
      className="border-destructive/30 bg-destructive/5 text-destructive flex items-start gap-2 rounded-md border px-4 py-3 text-[13.5px] font-semibold"
      role="alert"
    >
      <span aria-hidden="true">✕</span>
      {message}
    </p>
  )
}

/**
 * The submit / cancel row every admin form ends with.
 *
 * One component so the primary action is always first, cancel is always a link
 * (never a button that could be mistaken for a submit), and the pending label
 * is consistent across six forms.
 */
export function FormFooter({
  cancelHref,
  isPending,
  note,
  submitLabel,
}: {
  cancelHref: string
  isPending: boolean
  /** Optional aside on the right, e.g. the timezone reminder. */
  note?: React.ReactNode
  submitLabel: string
}) {
  return (
    <div className="border-rule-card flex flex-wrap items-center gap-3 border-t pt-4">
      <Button disabled={isPending} type="submit">
        {isPending ? 'Saving…' : submitLabel}
      </Button>
      <Link className={cn(buttonVariants({ variant: 'ghost' }))} href={cancelHref}>
        Cancel
      </Link>
      {note ? <span className="text-ink-faint ml-auto font-mono text-[11px]">{note}</span> : null}
    </div>
  )
}

/**
 * Points at the Studio for the fields this form deliberately does not manage.
 *
 * Used once per form, at the end — a Studio link beside every control would
 * suggest the admin is a lesser copy of Studio rather than the place routine
 * work happens.
 */
export function StudioNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-ink-faint text-[12px] leading-relaxed">
      {children}{' '}
      <Link
        className="text-club-link font-medium underline underline-offset-4"
        href="/studio"
        rel="noreferrer"
        target="_blank"
      >
        Advanced CMS
      </Link>
      . Saving here leaves them untouched.
    </p>
  )
}

/**
 * A file input paired with what is already stored.
 *
 * Uploading is additive by default — choosing nothing keeps the current file —
 * so replacing and removing are two separate, explicitly labelled choices. That
 * matters because an admin form that silently dropped an asset on every save
 * would quietly destroy content the officer never touched.
 *
 * The `accept` list and the size sentence come from the same rules the Server
 * Action enforces, so the picker and the validation can never disagree.
 */
export function FileField({
  current,
  description,
  error,
  htmlFor,
  kind,
  label,
  removeName,
}: {
  /** What is stored today: a label and, where there is one, a link to it. */
  current?: { label: string; href?: string } | null
  description?: string
  error?: string
  htmlFor: string
  kind: UploadKind
  label: string
  /** Name of the "remove the existing file" checkbox. */
  removeName?: string
}) {
  const rules = rulesFor(kind)
  const help = [description, `Up to ${rules.maxLabel}. ${rules.extensions.join(', ')}.`]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-ink text-[13px] font-semibold" htmlFor={htmlFor}>
        {label}
      </label>
      <p className="text-ink-faint text-[12px] leading-snug" id={`${htmlFor}-description`}>
        {help}
      </p>

      {current ? (
        <p className="border-rule bg-paper-warm text-ink-body flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-[12.5px]">
          <span className="text-ink-label font-mono text-[10.5px] tracking-[0.12em] uppercase">
            Current
          </span>
          {current.href ? (
            <a
              className="text-club-link font-medium underline underline-offset-4"
              href={current.href}
              rel="noreferrer"
              target="_blank"
            >
              {current.label}
              <span aria-hidden="true"> ↗</span>
            </a>
          ) : (
            <span>{current.label}</span>
          )}
        </p>
      ) : null}

      <input
        accept={acceptAttribute(rules)}
        aria-describedby={`${htmlFor}-description${error ? ` ${htmlFor}-error` : ''}`}
        aria-invalid={error ? true : undefined}
        className="text-ink file:border-input file:text-ink hover:file:bg-rule-fill min-h-11 w-full rounded-md border border-dashed border-input bg-background px-3 py-2 text-sm file:mr-3 file:min-h-8 file:rounded-md file:border file:bg-white file:px-3 file:text-[13px] file:font-semibold"
        id={htmlFor}
        name={htmlFor}
        type="file"
      />

      {current && removeName ? (
        <label className="text-ink-soft flex min-h-11 items-center gap-2.5 text-[12.5px]">
          <input
            className="accent-destructive size-[18px]"
            name={removeName}
            type="checkbox"
            value="on"
          />
          Remove the current {kind === 'image' ? 'image' : 'file'} when saving
        </label>
      ) : null}

      <FieldError error={error} id={`${htmlFor}-error`} />
    </div>
  )
}
