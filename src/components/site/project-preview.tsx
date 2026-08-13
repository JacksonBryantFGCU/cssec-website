import Link from 'next/link'

import {
  isBeginnerFriendly,
  openRolesLabel,
  projectLevelLabel,
  projectStatusLabel,
  rolesSummary,
} from '@/lib/projects/view-model'

import { siteButton } from './button'
import { StatusBadge, LevelBadge, TechTag } from './primitives'

/**
 * A project looking for contributors.
 *
 * The design is a two-panel row with a green left rule: the pitch and what you
 * will learn on the left, the roles and team on the right. It is deliberately
 * not a card in a grid — the point is to compare open roles across projects,
 * and rows compare better than tiles.
 */
export type ProjectPreviewData = {
  _id: string
  name?: string | null
  slug?: string | null
  status?: string | null
  shortDescription?: string | null
  techStack?: string[] | null
  experienceLevel?: string | null
  noExperienceRequired?: boolean | null
  openRoleCount?: number | null
  learningOutcomes?: string[] | null
  githubUrl?: string | null
  openRoles?: Array<{ _key: string; title?: string | null }> | null
  lead?: { _id: string; name?: string | null } | null
  mentors?: Array<{ _id: string; name?: string | null }> | null
}

export function ProjectPreview({ project }: { project: ProjectPreviewData }) {
  const status = project.status ?? 'idea'
  const openRoles = project.openRoleCount ?? project.openRoles?.length ?? 0
  const href = `/projects/${project.slug}`
  const mentorNames = (project.mentors ?? [])
    .map((mentor) => mentor.name)
    .filter((name): name is string => Boolean(name))

  return (
    <li className="border-rule-card bg-paper-card hover:border-club-border rounded-[10px] border border-l-[3px] border-l-club-green transition-colors">
      <div className="flex flex-col gap-4 p-4 sm:p-[22px_24px] lg:grid lg:grid-cols-[1fr_250px] lg:gap-[30px]">
        <div className="flex min-w-0 flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="font-display text-ink m-0 text-[18px] font-semibold sm:text-[21px]">
              <Link className="hover:underline" href={href}>
                {project.name}
              </Link>
            </h3>
            <StatusBadge label={projectStatusLabel(status)} status={status} />
            <LevelBadge
              label={projectLevelLabel(project)}
              tone={isBeginnerFriendly(project) ? 'beginner' : 'experienced'}
            />
          </div>

          {project.shortDescription ? (
            <p className="text-ink-body max-w-[600px] text-[13.5px] leading-relaxed sm:text-[14.5px]">
              {project.shortDescription}
            </p>
          ) : null}

          {project.learningOutcomes?.length ? (
            <div className="bg-club-surface-soft border-club-border-soft rounded-lg border p-[13px_15px]">
              <p className="text-club-link mb-[5px] font-mono text-[10px] tracking-[0.14em]">
                WHAT YOU&rsquo;LL LEARN
              </p>
              <p className="text-ink-body text-[13.5px] leading-relaxed">
                {project.learningOutcomes.slice(0, 3).join(' · ')}
              </p>
            </div>
          ) : null}

          {project.techStack?.length ? (
            <ul className="flex flex-wrap gap-[7px]">
              {project.techStack.map((tech) => (
                <li key={tech}>
                  <TechTag>{tech}</TechTag>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="border-rule flex flex-col gap-3 border-t pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-[26px]">
          <div>
            <p className="text-ink-label mb-1 font-mono text-[10px] tracking-[0.14em]">
              {openRolesLabel(openRoles)}
            </p>
            <p className="text-ink-strong text-[13.5px] leading-snug">
              {rolesSummary(project.openRoles, project.openRoleCount) ?? 'No open roles right now'}
            </p>
          </div>

          {project.lead?.name || mentorNames.length ? (
            <div>
              <p className="text-ink-label mb-1 font-mono text-[10px] tracking-[0.14em]">TEAM</p>
              <p className="text-ink-strong text-[13.5px] leading-snug">
                {project.lead?.name ? <>Lead: {project.lead.name}</> : null}
                {project.lead?.name && mentorNames.length ? <br /> : null}
                {mentorNames.length ? <>Mentor: {mentorNames.join(', ')}</> : null}
              </p>
            </div>
          ) : null}

          <div className="mt-auto flex flex-wrap gap-2">
            <Link className={siteButton({ variant: 'secondary', size: 'sm' })} href={href}>
              View project
            </Link>
            {project.githubUrl ? (
              <a
                className={siteButton({ variant: 'outline', size: 'sm' })}
                href={project.githubUrl}
                rel="noreferrer noopener"
                target="_blank"
              >
                GitHub ↗
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  )
}
