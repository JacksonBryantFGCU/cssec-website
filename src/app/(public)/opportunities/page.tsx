import type { Metadata } from 'next'

import { SectionPlaceholder } from '@/components/site/section-placeholder'

export const metadata: Metadata = {
  title: 'Opportunities',
  description:
    'Internships, research positions, scholarships and hackathons open to CSSEC members at Florida Gulf Coast University.',
  alternates: { canonical: '/opportunities' },
}

export default function OpportunitiesPage() {
  return (
    <SectionPlaceholder
      emptyBody="The full board — filterable by type, with the requirements and deadline on every listing — is next. The three closest deadlines already appear on the homepage."
      emptyTitle="The opportunity board is being built"
      standfirst="Internships, research positions, scholarships and hackathons, with the deadline on every one and officers who will read your application before you send it."
      title="Opportunities"
    />
  )
}
