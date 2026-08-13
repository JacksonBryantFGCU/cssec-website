import type { Metadata } from 'next'

import { SectionPlaceholder } from '@/components/site/section-placeholder'

export const metadata: Metadata = {
  title: 'Resources',
  description:
    'Slides, guides, cheat sheets and starter code from every CSSEC session, kept permanently and maintained after the meeting.',
  alternates: { canonical: '/resources' },
}

export default function ResourcesPage() {
  return (
    <SectionPlaceholder
      emptyBody="The searchable library — every guide, cheat sheet, recording and repository, filterable by topic and level — is next. In the meantime, each session's materials are attached to its own event page and are already permanent."
      emptyTitle="The resource library is being built"
      standfirst="Everything we have taught, kept permanently. Slides and code stay attached to the session they came from; the written guides are maintained separately so they stay current."
      title="Resources"
    />
  )
}
