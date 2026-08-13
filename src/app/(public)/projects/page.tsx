import type { Metadata } from 'next'

import { SectionPlaceholder } from '@/components/site/section-placeholder'

export const metadata: Metadata = {
  title: 'Projects',
  description:
    'Real software built by CSSEC teams, with a lead and a mentor on every one. Roles are labelled by how much experience they actually assume.',
  alternates: { canonical: '/projects' },
}

export default function ProjectsPage() {
  return (
    <SectionPlaceholder
      emptyBody="The full project index — filters by status and experience level, and a page per project with its roles, stack and team — is next. The recruiting teams already appear on the homepage."
      emptyTitle="The project index is being built"
      standfirst="Real software, built by club teams, with a lead and a mentor on every one. Joining is not a competition — if a role is open and you want it, tell us."
      title="Projects"
    />
  )
}
