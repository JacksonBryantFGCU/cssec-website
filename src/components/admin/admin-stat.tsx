import Link from 'next/link'

/** A single dashboard number, optionally linking to the screen that manages it. */
export function AdminStat({
  label,
  value,
  hint,
  href,
}: {
  label: string
  value: number
  hint?: string
  href?: string
}) {
  const body = (
    <>
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-3xl font-semibold tabular-nums">{value}</span>
      {hint ? <span className="text-muted-foreground text-xs">{hint}</span> : null}
    </>
  )

  if (href) {
    return (
      <Link
        className="hover:bg-muted/50 focus-visible:ring-ring flex flex-col gap-1 rounded-lg border p-4 transition-colors focus-visible:ring-3 focus-visible:outline-none"
        href={href}
      >
        {body}
      </Link>
    )
  }

  return <div className="flex flex-col gap-1 rounded-lg border p-4">{body}</div>
}
