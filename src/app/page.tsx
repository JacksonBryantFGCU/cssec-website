import Link from 'next/link'

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-4 px-6 py-24">
      <h1 className="text-3xl font-semibold tracking-tight">
        Computer Science &amp; Software Engineering Club
      </h1>
      <p className="text-muted-foreground">
        Florida Gulf Coast University. The public site is under construction —
        content is managed in Sanity.
      </p>
      <p className="text-muted-foreground text-sm">
        Officers can edit content at{' '}
        <Link className="underline underline-offset-4" href="/studio">
          /studio
        </Link>
        .
      </p>
    </main>
  )
}
