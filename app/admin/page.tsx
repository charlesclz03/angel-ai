import type { Metadata } from 'next'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'

import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/ui/Card'
import { getServerAuthSession } from '@/lib/auth'
import { loadAdminDashboard } from '@/lib/admin/dashboard'

export const metadata: Metadata = {
  title: 'Admin | Angel AI',
  description:
    'Internal Angel AI operations dashboard for metadata-first user, continuity, and queue health review.',
}

const adminDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
})

export default async function AdminPage() {
  const session = await getServerAuthSession()

  if (!session?.user?.id) {
    redirect('/onboarding')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/chat')
  }

  const dashboard = await loadAdminDashboard()

  return (
    <main className="relative isolate min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-midnight" />
      <div className="pointer-events-none absolute left-[-10rem] top-0 -z-10 h-80 w-80 rounded-full bg-accent-primary/14 blur-3xl motion-safe:animate-drift" />
      <div className="pointer-events-none absolute right-[-8rem] top-24 -z-10 h-72 w-72 rounded-full bg-accent-brand/10 blur-3xl motion-safe:animate-ambient-shift" />

      <section className="angel-shell py-10 sm:py-12">
        <div className="angel-chat-arrival animate-enter">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <span className="angel-eyebrow">Angel AI / Admin</span>
              <h1 className="mt-5 max-w-3xl font-display text-[clamp(2rem,4vw,3.4rem)] leading-[0.96] tracking-[-0.05em] text-text-primary">
                Internal operations, kept metadata-first.
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
                This surface is intentionally summary-led. It helps operators
                understand continuity health, subscription shape, and queue
                pressure without browsing raw private conversation content.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="quiet">
                <Link href="/chat">Open chat</Link>
              </Button>
              <Button asChild variant="quiet">
                <Link href="/admin/moderation">Open moderation queue</Link>
              </Button>
              <Button asChild variant="quiet">
                <Link href="/admin/moderation/analytics">
                  Open moderation analytics
                </Link>
              </Button>
              <Button asChild variant="link">
                <Link href="/updates">View shipped updates</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboard.overview.map((stat) => (
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

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(19rem,0.85fr)]">
          <Card variant="soft" padding="lg" className="animate-enter">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-accent-brand/20 bg-accent-brand/10 text-accent-brand">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="angel-kicker">Commercial funnel</p>
                <h2 className="mt-2 font-display text-[1.9rem] tracking-[-0.045em] text-text-primary">
                  Metadata-first conversion checkpoints
                </h2>
                <p className="mt-3 text-sm leading-7 text-text-secondary">
                  The funnel stays DB-derived and summary-led so operators can
                  see continuity flow without dipping into raw thread content.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {dashboard.funnel.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-5"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-text-tertiary">
                    {stat.label}
                  </p>
                  <p className="mt-3 font-display text-[2rem] tracking-[-0.04em] text-text-primary">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-text-secondary">
                    {stat.helper}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card variant="frosted" padding="lg" className="animate-enter">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-accent-primary/20 bg-accent-primary/10 text-accent-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="angel-kicker">Billing and continuity health</p>
                <h2 className="mt-2 font-display text-[1.9rem] tracking-[-0.045em] text-text-primary">
                  Delivery posture at a glance
                </h2>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {dashboard.continuityHealth.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[1.4rem] border border-white/8 bg-black/10 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {stat.label}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-text-secondary">
                        {stat.helper}
                      </p>
                    </div>
                    <span className="angel-chat-chip shrink-0">
                      {stat.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(19rem,0.85fr)]">
          <Card variant="rail" padding="lg" className="animate-enter">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-accent-primary/20 bg-accent-primary/10 text-accent-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="angel-kicker">Queue health</p>
                <h2 className="mt-2 font-display text-[1.9rem] tracking-[-0.045em] text-text-primary">
                  Continuity and ingestion pressure
                </h2>
                <p className="mt-3 text-sm leading-7 text-text-secondary">
                  Last generated {formatDateTime(dashboard.generatedAt)} UTC.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {dashboard.queueHealth.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-5"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-text-tertiary">
                    {stat.label}
                  </p>
                  <p className="mt-3 font-display text-[2rem] tracking-[-0.04em] text-text-primary">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-text-secondary">
                    {stat.helper}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card variant="frosted" padding="lg" className="animate-enter">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-accent-brand/20 bg-accent-brand/10 text-accent-brand">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="angel-kicker">Continuity tiers</p>
                <h2 className="mt-2 font-display text-[1.9rem] tracking-[-0.045em] text-text-primary">
                  Subscription shape
                </h2>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {dashboard.subscriptionBreakdown.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[1.4rem] border border-white/8 bg-black/10 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {stat.label}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-text-secondary">
                        {stat.helper}
                      </p>
                    </div>
                    <span className="angel-chat-chip shrink-0">
                      {stat.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card variant="frosted" padding="lg" className="mt-8 animate-enter">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-accent-error/20 bg-accent-error/10 text-accent-error">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <p className="angel-kicker">Moderation queue</p>
                <h2 className="mt-2 font-display text-[1.9rem] tracking-[-0.045em] text-text-primary">
                  Critical-only enforcement with redacted review
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-text-secondary">
                  Critical incidents can now trigger a deterministic safety
                  reply in the live thread, while the admin surfaces stay
                  metadata-first and redacted by design.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="quiet">
                <Link href="/admin/moderation">Review incidents</Link>
              </Button>
              <Button asChild variant="quiet">
                <Link href="/admin/moderation/analytics">Review analytics</Link>
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {dashboard.moderationSummary.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[1.4rem] border border-white/8 bg-black/10 px-4 py-4"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-text-tertiary">
                  {stat.label}
                </p>
                <p className="mt-3 font-display text-[2rem] tracking-[-0.04em] text-text-primary">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm leading-7 text-text-secondary">
                  {stat.helper}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {dashboard.moderationNeedsAttention.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[1.4rem] border border-accent-error/10 bg-accent-error/5 px-4 py-4"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-text-tertiary">
                  {stat.label}
                </p>
                <p className="mt-3 font-display text-[2rem] tracking-[-0.04em] text-text-primary">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm leading-7 text-text-secondary">
                  {stat.helper}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
          <Card variant="soft" padding="lg" className="animate-enter">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-accent-primary/20 bg-accent-primary/10 text-accent-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="angel-kicker">Recent user state</p>
                <h2 className="mt-2 font-display text-[1.9rem] tracking-[-0.045em] text-text-primary">
                  The latest accounts, without raw content
                </h2>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {dashboard.recentUsers.map((user) => (
                <article
                  key={user.id}
                  className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-[1.45rem] tracking-[-0.04em] text-text-primary">
                        {user.displayLabel}
                      </h3>
                      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-text-tertiary">
                        {user.role}
                      </p>
                    </div>
                    <span className="angel-chat-chip">
                      {user.subscriptionTier}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="angel-chat-chip">
                      {user.onboardingComplete
                        ? 'Onboarding complete'
                        : 'Onboarding incomplete'}
                    </span>
                    <span className="angel-chat-chip">
                      {user.relationshipStage ?? 'No stage yet'}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm leading-7 text-text-secondary">
                    <p>Joined: {formatDateTime(user.createdAt)}</p>
                    <p>
                      Last thread activity:{' '}
                      {formatDateTime(user.lastMessageAt, 'No message yet')}
                    </p>
                    <p>
                      Next touchpoint:{' '}
                      {user.nextTouchpointAt
                        ? `${formatDateTime(user.nextTouchpointAt)} (${formatTouchpointLabel(
                            user.nextTouchpointType
                          )})`
                        : 'None scheduled'}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="angel-chat-chip">
                      {user.socialConnectionCount} social
                    </span>
                    <span className="angel-chat-chip">
                      {user.pushSubscriptionCount} push
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </Card>

          <Card variant="rail" padding="lg" className="animate-enter">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-accent-error/20 bg-accent-error/10 text-accent-error">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="angel-kicker">Needs review</p>
                <h2 className="mt-2 font-display text-[1.9rem] tracking-[-0.045em] text-text-primary">
                  Recent operational alerts
                </h2>
              </div>
            </div>

            {dashboard.alerts.length === 0 ? (
              <div className="mt-6 rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-5 text-sm leading-7 text-text-secondary">
                No immediate queue or continuity alerts are visible right now.
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {dashboard.alerts.map((alert) => (
                  <article
                    key={alert.id}
                    className="rounded-[1.4rem] border border-white/8 bg-black/10 px-4 py-4"
                  >
                    <p className="text-xs uppercase tracking-[0.24em] text-text-tertiary">
                      {formatAlertKind(alert.kind)}
                    </p>
                    <h3 className="mt-2 text-sm font-semibold text-text-primary">
                      {alert.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-text-secondary">
                      {alert.userLabel}
                    </p>
                    <p className="text-sm leading-7 text-text-secondary">
                      {alert.detail}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.22em] text-text-tertiary">
                      {formatDateTime(alert.occurredAt)}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </Card>
        </div>
      </section>
    </main>
  )
}

function formatDateTime(value: string | null, fallback = 'Not available') {
  if (!value) {
    return fallback
  }

  return adminDateTimeFormatter.format(new Date(value))
}

function formatTouchpointLabel(value: string | null) {
  if (!value) {
    return 'No touchpoint queued'
  }

  switch (value) {
    case 'EMOTIONAL_CHECKIN':
      return 'Emotional check-in'
    case 'FOLLOWUP':
      return 'Follow-up'
    case 'EVENING_MESSAGE':
      return 'Evening message'
    case 'POST_PAYWALL_READ_ONLY':
      return 'Read-only prompt'
    case 'MEDIA_ARCHIVE_PROPOSAL':
      return 'Archive proposal'
    default:
      return value
  }
}

function formatAlertKind(kind: string) {
  switch (kind) {
    case 'SOCIAL_SCAN_FAILED':
      return 'Social scan'
    case 'TOUCHPOINT_OVERDUE':
      return 'Touchpoint'
    case 'MODERATION_CRITICAL':
      return 'Moderation / Critical'
    case 'MODERATION_ESCALATED':
      return 'Moderation / Escalated'
    default:
      return 'Alert'
  }
}
