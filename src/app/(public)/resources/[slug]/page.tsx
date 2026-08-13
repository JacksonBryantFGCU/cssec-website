import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { siteButton } from '@/components/site/button'
import { MonoLabel } from '@/components/site/primitives'
import { formatCalendarDate, formatClubDateLong } from '@/lib/time'
import { resourceKindLabel, resourceLink } from '@/lib/resources/link'
import {
  resourceLevelLabel,
  resourceTypeLabel,
  sourceEventHref,
  sourceEventLabel,
} from '@/lib/resources/view-model'
import { PUBLIC_REVALIDATE_SECONDS, publicClient } from '@/sanity/lib/public-client'
import { RESOURCE_BY_SLUG_QUERY, RESOURCE_SLUGS_QUERY } from '@/sanity/queries/resources'

const fetchOptions = { next: { revalidate: PUBLIC_REVALIDATE_SECONDS } }

export async function generateStaticParams() {
  const slugs = await publicClient.fetch(RESOURCE_SLUGS_QUERY)
  return slugs
    .map((entry) => entry.slug)
    .filter((slug): slug is string => Boolean(slug))
    .map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: PageProps<'/resources/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const resource = await publicClient.fetch(RESOURCE_BY_SLUG_QUERY, { slug }, fetchOptions)

  if (!resource) return {}

  const description = resource.description ?? undefined

  return {
    title: resource.title ?? 'Resource',
    description,
    alternates: { canonical: `/resources/${slug}` },
    openGraph: {
      title: `${resource.title} — CSSEC`,
      description,
      url: `/resources/${slug}`,
      type: 'article',
    },
  }
}

/** One row of the details rail. */
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 text-sm">
      <dt className="text-ink-label min-w-[74px] shrink-0">{label}</dt>
      <dd className="text-ink-strong m-0">{value}</dd>
    </div>
  )
}

/**
 * `/resources/[slug]` — one entry in the archive.
 *
 * The resource contract stores a plain-text `description` rather than block
 * content, so this page is what the model actually supports: what the thing
 * is, where to get it, which session produced it, and what to read next. It is
 * not a documentation renderer.
 */
export default async function ResourcePage({ params }: PageProps<'/resources/[slug]'>) {
  const { slug } = await params
  const resource = await publicClient.fetch(RESOURCE_BY_SLUG_QUERY, { slug }, fetchOptions)

  if (!resource) notFound()

  const primary = resourceLink({ ...resource, slug: null })
  const source = sourceEventLabel(resource, formatClubDateLong)
  const sourceHref = sourceEventHref(resource)
  const related = resource.relatedResources ?? []
  const updated = resource.updatedAt ?? resource.publishedAt

  // Every concrete artefact this entry carries, as the design's file table.
  const files = [
    resource.fileUrl
      ? {
          href: resource.fileUrl,
          kind: resource.fileName?.split('.').pop()?.toUpperCase() ?? 'FILE',
          label: resource.fileName ?? resource.title,
          action: 'Download',
          external: false,
        }
      : null,
    resource.githubUrl
      ? {
          href: resource.githubUrl,
          kind: 'REPOSITORY',
          label: resource.githubUrl.replace(/^https?:\/\/(www\.)?github\.com\//, ''),
          action: 'GitHub ↗',
          external: true,
        }
      : null,
    resource.externalUrl
      ? {
          href: resource.externalUrl,
          kind: resource.resourceType === 'recording' ? 'RECORDING' : 'LINK',
          label: resource.externalUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0],
          action: resource.resourceType === 'recording' ? 'Watch ↗' : 'Open ↗',
          external: true,
        }
      : null,
  ].filter((file) => file !== null)

  return (
    <div className="bg-paper-warm">
      <div className="border-b border-[#E2E0D6] px-4 py-5 sm:px-10 sm:py-[26px_24px]">
        <nav aria-label="Breadcrumb" className="text-ink-faint mb-3 text-[13px] sm:mb-3.5">
          <Link
            className="text-club-link inline-flex min-h-11 items-center font-semibold hover:underline sm:min-h-0"
            href="/resources"
          >
            <span aria-hidden="true" className="sm:hidden">
              ←{' '}
            </span>
            Resource library
          </Link>
          <span className="hidden sm:inline">
            {' '}
            · <span className="text-ink-strong">{resourceTypeLabel(resource.resourceType)}</span>
          </span>
        </nav>

        <div className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-end lg:gap-[50px]">
          <div className="flex max-w-[700px] flex-col gap-2.5">
            <h1 className="text-ink m-0 font-serif text-[28px] leading-[1.14] font-normal tracking-[-0.015em] sm:text-[38px]">
              {resource.title}
            </h1>
            {resource.description ? (
              <p className="text-ink-body text-[15px] leading-relaxed sm:text-base">
                {resource.description}
              </p>
            ) : null}
            <p className="text-ink-faint flex flex-wrap gap-x-4 gap-y-1 pt-1 font-mono text-[11px] tracking-[0.06em]">
              {resource.author?.name ? <span>{resource.author.name}</span> : null}
              {updated ? <span>UPDATED {formatCalendarDate(updated).toUpperCase()}</span> : null}
              <span>{resourceKindLabel(resource.resourceType)}</span>
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            {/* Only rendered when there is genuinely something to open. */}
            {primary ? (
              <a
                className={siteButton({ variant: 'primary', size: 'block' })}
                {...(primary.download ? { download: true } : {})}
                href={primary.href}
                {...(primary.external ? { rel: 'noreferrer noopener', target: '_blank' } : {})}
              >
                {primary.action}
              </a>
            ) : null}
            {sourceHref ? (
              <Link
                className={siteButton({ variant: 'outline', size: 'block' })}
                href={sourceHref}
              >
                Go to the session it came from
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_330px]">
        <div className="flex flex-col gap-6 border-[#E2E0D6] px-4 py-7 sm:px-10 sm:py-[32px_44px] lg:border-r">
          {files.length > 0 ? (
            <section className="flex max-w-[660px] flex-col">
              <h2 className="text-ink m-0 border-b border-[#11201B] pb-2.5 font-serif text-[22px] font-normal sm:text-2xl">
                Files and links
              </h2>
              <ul>
                {files.map((file) => (
                  <li className="border-b border-[#E2E0D6]" key={file.href}>
                    <a
                      className="hover:bg-paper grid min-h-11 grid-cols-[1fr_auto] items-center gap-3 py-3.5 transition-colors sm:grid-cols-[130px_1fr_110px]"
                      {...(file.action === 'Download' ? { download: true } : {})}
                      href={file.href}
                      {...(file.external ? { rel: 'noreferrer noopener', target: '_blank' } : {})}
                    >
                      <span className="text-club-link order-1 font-mono text-[11px] tracking-[0.1em] sm:order-none">
                        {file.kind}
                      </span>
                      <span className="text-ink order-3 col-span-2 text-[15px] font-semibold sm:order-none sm:col-span-1">
                        {file.label}
                      </span>
                      <span className="text-club-link order-2 text-right text-[13.5px] font-semibold sm:order-none">
                        {file.action}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <p className="text-ink-soft border-rule-dashed rounded-lg border border-dashed bg-white px-4 py-5 text-sm leading-relaxed">
              This entry has no file or link attached yet. If you were at the session, the officers
              can usually dig the material out — ask in Discord.
            </p>
          )}
        </div>

        <aside className="flex flex-col gap-6 px-4 py-7 sm:px-8 sm:py-[32px_44px]">
          <section className="flex flex-col gap-2.5 rounded-[10px] border border-[#E2E0D6] bg-white p-4 sm:p-[18px_20px]">
            <MonoLabel>DETAILS</MonoLabel>
            <dl className="flex flex-col gap-2.5">
              <Detail label="Type" value={resourceTypeLabel(resource.resourceType)} />
              {resource.topics?.length ? (
                <Detail label="Topic" value={resource.topics.join(', ')} />
              ) : null}
              <Detail label="Level" value={resourceLevelLabel(resource.experienceLevel)} />
              {resource.author?.name ? <Detail label="Author" value={resource.author.name} /> : null}
              {updated ? <Detail label="Updated" value={formatCalendarDate(updated)} /> : null}
            </dl>
          </section>

          {sourceHref && source ? (
            <Link
              className="border-club-border bg-club-surface-soft flex flex-col gap-1.5 rounded-[10px] border p-4 sm:p-[18px_20px]"
              href={sourceHref}
            >
              <MonoLabel tone="green">CAME FROM</MonoLabel>
              <span className="text-ink text-[15px] font-semibold">{resource.event?.title}</span>
              <span className="text-ink-body text-[13.5px]">
                {resource.event?.startsAt ? `${formatClubDateLong(resource.event.startsAt)} · ` : ''}
                see the rest of that session&rsquo;s materials
              </span>
            </Link>
          ) : null}

          {related.length > 0 ? (
            <section className="flex flex-col gap-3">
              <MonoLabel>RELATED</MonoLabel>
              <ul className="flex flex-col">
                {related.map((item) => (
                  <li className="border-b border-[#E2E0D6]" key={item._id}>
                    <Link
                      className="flex min-h-11 flex-col justify-center gap-0.5 py-2.5"
                      href={`/resources/${item.slug}`}
                    >
                      <span className="text-ink text-[14.5px] font-semibold">{item.title}</span>
                      <span className="text-ink-faint text-[12.5px]">
                        {resourceTypeLabel(item.resourceType)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
