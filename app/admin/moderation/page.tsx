import type { Metadata } from 'next'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  AlertTriangle,
  Flag,
  Filter,
  ShieldAlert,
  ShieldCheck,
  Users,
} from 'lucide-react'

import { reviewModerationIncident } from '@/app/admin/actions'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/ui/Card'
import { getServerAuthSession } from '@/lib/auth'
import type { ModerationQueueFilters } from '@/lib/admin/moderation'
import {
  loadModerationQueue,
  moderationCategoryOptions,
  moderationReviewReasonCodeOptions,
  moderationSenderRoleOptions,
  moderationSeverityOptions,
  moderationStatusOptions,
} from '@/lib/admin/moderation'
import {
  isModerationReviewReasonCode,
  isReviewableModerationStatus,
} from '@/lib/angel/moderation'

export const metadata: Metadata = {
  title: 'Moderation Queue | Angel AI',
  description:
    'Admin-only moderation queue for redacted message safety review, critical-only enforcement visibility, and append-only review history.',
}

const adminDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
})

export default async function AdminModerationPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await getServerAuthSession()

  if (!session?.user?.id) {
    redirect('/onboarding')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/chat')
  }

  const resolvedSearchParams = searchParams ? await searchParams : {}
  const moderationQueue = await loadModerationQueue({
    status: readSearchParam(resolvedSearchParams.status),
    category: readSearchParam(resolvedSearchParams.category),
    severity: readSearchParam(resolvedSearchParams.severity),
    senderRole: readSearchParam(resolvedSearchParams.senderRole),
    userId: readSearchParam(resolvedSearchParams.userId),
  })
  const activeUserRollup =
    moderationQueue.filters.userId === null
      ? null
      : (moderationQueue.rollups.find(
          (rollup) => rollup.userId === moderationQueue.filters.userId
        ) ?? null)

  async function submitModerationReview(formData: FormData) {
    'use server'

    const incidentId = String(formData.get('incidentId') ?? '').trim()
    const status = String(formData.get('status') ?? '').trim()
    const reasonCode = String(formData.get('reasonCode') ?? '').trim()
    const reviewerNote = String(formData.get('reviewerNote') ?? '')

    if (
      !incidentId ||
      !isReviewableModerationStatus(status) ||
      !isModerationReviewReasonCode(reasonCode)
    ) {
      throw new Error('Invalid moderation review payload.')
    }

    await reviewModerationIncident({
      incidentId,
      status,
      reasonCode,
      reviewerNote,
    })
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-midnight" />
      <div className="pointer-events-none absolute left-[-10rem] top-0 -z-10 h-80 w-80 rounded-full bg-accent-error/12 blur-3xl motion-safe:animate-drift" />
      <div className="pointer-events-none absolute right-[-8rem] top-24 -z-10 h-72 w-72 rounded-full bg-accent-primary/10 blur-3xl motion-safe:animate-ambient-shift" />

      <section className="angel-shell py-10 sm:py-12">
        <div className="angel-chat-arrival animate-enter">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <span className="angel-eyebrow">
                Angel AI / Admin / Moderation
              </span>
              <h1 className="mt-5 max-w-3xl font-display text-[clamp(2rem,4vw,3.3rem)] leading-[0.96] tracking-[-0.05em] text-text-primary">
                Redacted moderation review with critical-only enforcement.
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
                Critical user inputs can now trigger a deterministic safety
                reply in the live thread. Operators still review only redacted
                previews, policy metadata, and append-only review history.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="quiet">
                <Link href="/admin">Back to admin</Link>
              </Button>
              <Button asChild variant="quiet">
                <Link href="/admin/moderation/analytics">Open analytics</Link>
              </Button>
              <Button asChild variant="link">
                <Link href="/updates">View shipped updates</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {moderationQueue.summary.map((stat) => (
            <Card key={stat.label} variant="soft" padding="lg" hover>
              <p className="angel-kicker">{stat.label}</p>
              <p className="mt-4 font-display text-[2.4rem] leading-none tracking-[-0.05em] text-text-primary">
                {stat.value}
              </p>
              <p className="mt-3 text-sm leading-7 text-text-secondary">
                {stat.helper}
              </p>
            </Card>
          ))}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {moderationQueue.needsAttention.map((stat) => (
            <Card key={stat.label} variant="frosted" padding="lg" hover>
              <p className="angel-kicker">{stat.label}</p>
              <p className="mt-4 font-display text-[2.4rem] leading-none tracking-[-0.05em] text-text-primary">
                {stat.value}
              </p>
              <p className="mt-3 text-sm leading-7 text-text-secondary">
                {stat.helper}
              </p>
            </Card>
          ))}
        </div>

        <Card variant="frosted" padding="lg" className="mt-8 animate-enter">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-accent-primary/20 bg-accent-primary/10 text-accent-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="angel-kicker">User risk rollups</p>
                <h2 className="mt-2 font-display text-[1.9rem] tracking-[-0.045em] text-text-primary">
                  Unresolved risk, grouped by user
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-text-secondary">
                  These rollups stay redacted and unresolved-only so operators
                  can see repeat pressure and urgency before drilling into the
                  incident list.
                </p>
              </div>
            </div>
          </div>

          {moderationQueue.filters.userId ? (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-accent-primary/12 bg-black/10 px-4 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-text-tertiary">
                  Active user focus
                </p>
                <p className="mt-2 text-sm leading-7 text-text-primary">
                  Focused on {activeUserRollup?.userLabel ?? 'a selected user'}{' '}
                  so the incident list stays drill-in friendly.
                </p>
              </div>
              <Button asChild variant="quiet">
                <Link
                  href={buildModerationHref(moderationQueue.filters, {
                    userId: null,
                  })}
                >
                  Clear user focus
                </Link>
              </Button>
            </div>
          ) : null}

          {moderationQueue.rollups.length === 0 ? (
            <div className="mt-6 rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-5 text-sm leading-7 text-text-secondary">
              No unresolved user rollups match the current scope.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {moderationQueue.rollups.map((rollup) => (
                <article
                  key={rollup.userId}
                  className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-[1.45rem] tracking-[-0.04em] text-text-primary">
                        {rollup.userLabel}
                      </h3>
                      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-text-tertiary">
                        Last incident {formatDateTime(rollup.lastIncidentAt)}
                      </p>
                    </div>
                    <span className="angel-chat-chip">
                      {formatRelationshipStage(rollup.latestRelationshipStage)}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="angel-chat-chip">
                      {rollup.unresolvedCount} unresolved
                    </span>
                    <span className="angel-chat-chip">
                      {rollup.criticalCount} critical
                    </span>
                    <span className="angel-chat-chip">
                      {rollup.escalatedCount} escalated
                    </span>
                    {moderationQueue.filters.userId === rollup.userId ? (
                      <span className="angel-chat-chip">Focused user</span>
                    ) : null}
                  </div>

                  <div className="mt-4 space-y-3 text-sm leading-7 text-text-secondary">
                    <p>
                      Categories:{' '}
                      {formatBreakdown(
                        rollup.categoryBreakdown,
                        formatModerationCategory
                      )}
                    </p>
                    <p>
                      Sender mix:{' '}
                      {formatBreakdown(
                        rollup.senderBreakdown,
                        formatSenderRole
                      )}
                    </p>
                  </div>

                  <div className="mt-5">
                    <Button asChild variant="quiet">
                      <Link
                        href={buildModerationHref(
                          moderationQueue.filters,
                          {
                            userId: rollup.userId,
                          },
                          { clearStatus: true }
                        )}
                      >
                        Show incidents
                      </Link>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Card>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(18rem,0.72fr)_minmax(0,1.28fr)]">
          <Card variant="rail" padding="lg" className="animate-enter">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-accent-primary/20 bg-accent-primary/10 text-accent-primary">
                <Filter className="h-5 w-5" />
              </div>
              <div>
                <p className="angel-kicker">Filters</p>
                <h2 className="mt-2 font-display text-[1.9rem] tracking-[-0.045em] text-text-primary">
                  Keep the queue reviewable
                </h2>
                <p className="mt-3 text-sm leading-7 text-text-secondary">
                  Generated {formatDateTime(moderationQueue.generatedAt)} UTC.
                </p>
              </div>
            </div>

            <form method="get" className="mt-6 space-y-4">
              {moderationQueue.filters.userId ? (
                <input
                  type="hidden"
                  name="userId"
                  value={moderationQueue.filters.userId}
                />
              ) : null}

              <label className="block text-sm text-text-secondary">
                <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-text-tertiary">
                  Status
                </span>
                <select
                  name="status"
                  defaultValue={moderationQueue.filters.status}
                  className="w-full rounded-[1.1rem] border border-white/10 bg-black/10 px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-primary/40"
                >
                  <option value="ALL">All statuses</option>
                  {moderationStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {formatModerationStatus(status)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm text-text-secondary">
                <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-text-tertiary">
                  Category
                </span>
                <select
                  name="category"
                  defaultValue={moderationQueue.filters.category}
                  className="w-full rounded-[1.1rem] border border-white/10 bg-black/10 px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-primary/40"
                >
                  <option value="ALL">All categories</option>
                  {moderationCategoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {formatModerationCategory(category)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm text-text-secondary">
                <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-text-tertiary">
                  Severity
                </span>
                <select
                  name="severity"
                  defaultValue={moderationQueue.filters.severity}
                  className="w-full rounded-[1.1rem] border border-white/10 bg-black/10 px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-primary/40"
                >
                  <option value="ALL">All severities</option>
                  {moderationSeverityOptions.map((severity) => (
                    <option key={severity} value={severity}>
                      {formatModerationSeverity(severity)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm text-text-secondary">
                <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-text-tertiary">
                  Sender
                </span>
                <select
                  name="senderRole"
                  defaultValue={moderationQueue.filters.senderRole}
                  className="w-full rounded-[1.1rem] border border-white/10 bg-black/10 px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-primary/40"
                >
                  <option value="ALL">All senders</option>
                  {moderationSenderRoleOptions.map((senderRole) => (
                    <option key={senderRole} value={senderRole}>
                      {formatSenderRole(senderRole)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button type="submit" variant="default">
                  Apply filters
                </Button>
                <Button asChild type="button" variant="quiet">
                  <Link href="/admin/moderation">Reset</Link>
                </Button>
              </div>
            </form>
          </Card>

          <Card variant="soft" padding="lg" className="animate-enter">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-accent-error/20 bg-accent-error/10 text-accent-error">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <p className="angel-kicker">Queue</p>
                <h2 className="mt-2 font-display text-[1.9rem] tracking-[-0.045em] text-text-primary">
                  Open-first incident review
                </h2>
                <p className="mt-3 text-sm leading-7 text-text-secondary">
                  {activeUserRollup
                    ? `Focused on ${activeUserRollup.userLabel}. Raw message bodies stay hidden by design.`
                    : 'Showing the most recent incidents first within each status band. Raw message bodies stay hidden by design.'}
                </p>
              </div>
            </div>

            {moderationQueue.incidents.length === 0 ? (
              <div className="mt-6 rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-5 text-sm leading-7 text-text-secondary">
                No incidents match the current filters.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {moderationQueue.incidents.map((incident) => (
                  <article
                    key={incident.id}
                    className="rounded-[1.7rem] border border-white/8 bg-white/[0.03] p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span className="angel-chat-chip">
                            {formatModerationCategory(incident.category)}
                          </span>
                          <span className="angel-chat-chip">
                            {formatModerationSeverity(incident.severity)}
                          </span>
                          <span className="angel-chat-chip">
                            {formatModerationStatus(incident.status)}
                          </span>
                          {incident.enforcementAction !== 'NONE' ? (
                            <span className="angel-chat-chip">
                              {formatEnforcementAction(
                                incident.enforcementAction
                              )}
                            </span>
                          ) : null}
                        </div>
                        <h3 className="mt-3 font-display text-[1.4rem] tracking-[-0.04em] text-text-primary">
                          {incident.userLabel}
                        </h3>
                      </div>

                      <div className="text-right text-xs uppercase tracking-[0.22em] text-text-tertiary">
                        <p>{formatDateTime(incident.createdAt)}</p>
                        <p className="mt-2">
                          {formatSenderRole(incident.senderRoleSnapshot)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-[1.4rem] border border-accent-error/10 bg-black/10 px-4 py-4">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-text-tertiary">
                        <Flag className="h-3.5 w-3.5" />
                        Redacted preview
                      </div>
                      <p className="mt-3 text-sm leading-7 text-text-primary">
                        {incident.redactedPreview}
                      </p>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm leading-7 text-text-secondary md:grid-cols-2">
                      <p>
                        Relationship stage:{' '}
                        {formatRelationshipStage(
                          incident.relationshipStageSnapshot
                        )}
                      </p>
                      <p>
                        Content type:{' '}
                        {formatContentType(incident.contentTypeSnapshot)}
                      </p>
                      <p>
                        Enforcement:{' '}
                        {formatEnforcementAction(incident.enforcementAction)}
                      </p>
                      <p>
                        Enforced at:{' '}
                        {formatDateTime(incident.enforcedAt, 'Not enforced')}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {incident.matchedSignals.map((signal) => (
                        <span key={signal} className="angel-chat-chip">
                          {signal}
                        </span>
                      ))}
                    </div>

                    {incident.reviewedAt ||
                    incident.reviewedByLabel ||
                    incident.reviewerNote ? (
                      <div className="mt-4 rounded-[1.3rem] border border-white/8 bg-black/10 px-4 py-4 text-sm leading-7 text-text-secondary">
                        <p>
                          Reviewed:{' '}
                          {incident.reviewedAt
                            ? formatDateTime(incident.reviewedAt)
                            : 'Not yet stamped'}
                          {incident.reviewedByLabel
                            ? ` by ${incident.reviewedByLabel}`
                            : ''}
                        </p>
                        <p>
                          Reviewer note:{' '}
                          {incident.reviewerNote || 'No note saved yet.'}
                        </p>
                      </div>
                    ) : null}

                    <div className="mt-4 rounded-[1.3rem] border border-white/8 bg-black/10 px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent-primary/20 bg-accent-primary/10 text-accent-primary">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-[0.24em] text-text-tertiary">
                            Review history
                          </p>
                          {incident.reviewHistory.length === 0 ? (
                            <p className="mt-2 text-sm leading-7 text-text-secondary">
                              No review events have been appended yet.
                            </p>
                          ) : (
                            <div className="mt-3 space-y-3">
                              {incident.reviewHistory.map((event) => (
                                <div
                                  key={event.id}
                                  className="rounded-[1.1rem] border border-white/8 bg-white/[0.03] px-3 py-3"
                                >
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-semibold text-text-primary">
                                        {formatActorType(event.actorType)} to{' '}
                                        {formatModerationStatus(event.toStatus)}
                                      </p>
                                      <p className="mt-1 text-sm leading-7 text-text-secondary">
                                        {event.actorLabel}
                                      </p>
                                    </div>
                                    <p className="text-xs uppercase tracking-[0.22em] text-text-tertiary">
                                      {formatDateTime(event.createdAt)}
                                    </p>
                                  </div>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <span className="angel-chat-chip">
                                      {formatReasonCode(event.reasonCode)}
                                    </span>
                                    {event.fromStatus ? (
                                      <span className="angel-chat-chip">
                                        From{' '}
                                        {formatModerationStatus(
                                          event.fromStatus
                                        )}
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className="mt-2 text-sm leading-7 text-text-secondary">
                                    {event.note ||
                                      'No note saved for this event.'}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <form
                      action={submitModerationReview}
                      className="mt-5 space-y-3"
                    >
                      <input
                        type="hidden"
                        name="incidentId"
                        value={incident.id}
                      />
                      <div className="grid gap-3 md:grid-cols-[minmax(0,0.3fr)_minmax(0,0.34fr)_minmax(0,0.36fr)]">
                        <label className="block text-sm text-text-secondary">
                          <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-text-tertiary">
                            Review status
                          </span>
                          <select
                            name="status"
                            defaultValue={
                              incident.status === 'OPEN'
                                ? 'UNDER_REVIEW'
                                : incident.status
                            }
                            className="w-full rounded-[1.1rem] border border-white/10 bg-black/10 px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-primary/40"
                          >
                            <option value="UNDER_REVIEW">Under review</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="DISMISSED">Dismissed</option>
                            <option value="ESCALATED">Escalated</option>
                          </select>
                        </label>

                        <label className="block text-sm text-text-secondary">
                          <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-text-tertiary">
                            Reason code
                          </span>
                          <select
                            name="reasonCode"
                            defaultValue="POLICY_CONFIRMED"
                            className="w-full rounded-[1.1rem] border border-white/10 bg-black/10 px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-primary/40"
                          >
                            {moderationReviewReasonCodeOptions.map(
                              (reasonCode) => (
                                <option key={reasonCode} value={reasonCode}>
                                  {formatReasonCode(reasonCode)}
                                </option>
                              )
                            )}
                          </select>
                        </label>

                        <label className="block text-sm text-text-secondary">
                          <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-text-tertiary">
                            Reviewer note
                          </span>
                          <input
                            name="reviewerNote"
                            defaultValue={incident.reviewerNote ?? ''}
                            placeholder="Add an optional operator note"
                            className="w-full rounded-[1.1rem] border border-white/10 bg-black/10 px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-tertiary focus:border-accent-primary/40"
                          />
                        </label>
                      </div>

                      <Button type="submit" variant="quiet">
                        Save review state
                      </Button>
                    </form>
                  </article>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card variant="rail" padding="lg" className="mt-8 animate-enter">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-accent-error/20 bg-accent-error/10 text-accent-error">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="angel-kicker">Analytics next step</p>
              <h2 className="mt-2 font-display text-[1.9rem] tracking-[-0.045em] text-text-primary">
                Redacted safety trends
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-text-secondary">
                Use the analytics view for 7-day and 30-day incident volume,
                review reasons, false-positive rate, and moderation SLA trends.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <Button asChild variant="quiet">
              <Link href="/admin/moderation/analytics">
                Open moderation analytics
              </Link>
            </Button>
          </div>
        </Card>
      </section>
    </main>
  )
}

function buildModerationHref(
  filters: ModerationQueueFilters,
  overrides: Partial<ModerationQueueFilters>,
  options?: {
    clearStatus?: boolean
  }
) {
  const nextFilters: ModerationQueueFilters = {
    status: options?.clearStatus ? 'ALL' : filters.status,
    category: filters.category,
    severity: filters.severity,
    senderRole: filters.senderRole,
    userId: filters.userId,
    ...overrides,
  }
  const searchParams = new URLSearchParams()

  if (nextFilters.status !== 'ALL') {
    searchParams.set('status', nextFilters.status)
  }

  if (nextFilters.category !== 'ALL') {
    searchParams.set('category', nextFilters.category)
  }

  if (nextFilters.severity !== 'ALL') {
    searchParams.set('severity', nextFilters.severity)
  }

  if (nextFilters.senderRole !== 'ALL') {
    searchParams.set('senderRole', nextFilters.senderRole)
  }

  if (nextFilters.userId) {
    searchParams.set('userId', nextFilters.userId)
  }

  const query = searchParams.toString()
  return query ? `/admin/moderation?${query}` : '/admin/moderation'
}

function readSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function formatDateTime(value: string | null, fallback = 'Not available') {
  if (!value) {
    return fallback
  }

  return adminDateTimeFormatter.format(new Date(value))
}

function formatBreakdown<T extends string>(
  values: Array<{ value: T; count: number }>,
  formatter: (value: T) => string
) {
  if (values.length === 0) {
    return 'None'
  }

  return values
    .map((entry) => `${formatter(entry.value)} ${entry.count}`)
    .join(', ')
}

function formatModerationCategory(value: string) {
  switch (value) {
    case 'EXPLICIT_SEXUAL':
      return 'Explicit sexual'
    case 'MINOR_SAFETY':
      return 'Minor safety'
    case 'ROMANCE_ESCALATION':
      return 'Romance escalation'
    case 'POLICY_BYPASS':
      return 'Policy bypass'
    default:
      return value
  }
}

function formatModerationSeverity(value: string) {
  switch (value) {
    case 'CRITICAL':
      return 'Critical'
    default:
      return value.charAt(0) + value.slice(1).toLowerCase()
  }
}

function formatModerationStatus(value: string) {
  switch (value) {
    case 'UNDER_REVIEW':
      return 'Under review'
    default:
      return value
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/^\w/, (letter) => letter.toUpperCase())
  }
}

function formatRelationshipStage(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatContentType(value: string) {
  switch (value) {
    case 'VOICE_NOTE':
      return 'Voice note'
    default:
      return value
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/^\w/, (letter) => letter.toUpperCase())
  }
}

function formatSenderRole(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase()
}

function formatActorType(value: string) {
  return value === 'SYSTEM' ? 'System automation' : 'Admin review'
}

function formatReasonCode(value: string) {
  switch (value) {
    case 'FALSE_POSITIVE':
      return 'False positive'
    case 'POLICY_CONFIRMED':
      return 'Policy confirmed'
    case 'ESCALATED_FOR_SECOND_PASS':
      return 'Escalated for second pass'
    case 'SAFETY_LOCK_APPLIED':
      return 'Safety lock applied'
    case 'MODEL_OUTPUT_CORRECTED':
      return 'Model output corrected'
    case 'OTHER':
      return 'Other'
    default:
      return value
  }
}

function formatEnforcementAction(value: string) {
  switch (value) {
    case 'BLOCKED_INPUT':
      return 'Blocked input'
    default:
      return 'None'
  }
}
