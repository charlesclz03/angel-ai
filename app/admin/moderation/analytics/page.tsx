import type { Metadata } from 'next'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { BarChart3, Clock3, ShieldAlert, Users } from 'lucide-react'

import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/ui/Card'
import { getServerAuthSession } from '@/lib/auth'
import { loadModerationAnalyticsDashboard } from '@/lib/admin/moderation'

export const metadata: Metadata = {
  title: 'Moderation Analytics | Angel AI',
  description:
    'Admin-only redacted moderation analytics for incident volume, review reasons, false positives, and moderation response timing.',
}

const adminDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
})

export default async function AdminModerationAnalyticsPage() {
  const session = await getServerAuthSession()

  if (!session?.user?.id) {
    redirect('/onboarding')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/chat')
  }

  const analytics = await loadModerationAnalyticsDashboard()

  return (
    <main className="relative isolate min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-midnight" />
      <div className="pointer-events-none absolute left-[-10rem] top-0 -z-10 h-80 w-80 rounded-full bg-accent-primary/12 blur-3xl motion-safe:animate-drift" />
      <div className="pointer-events-none absolute right-[-8rem] top-24 -z-10 h-72 w-72 rounded-full bg-accent-brand/10 blur-3xl motion-safe:animate-ambient-shift" />

      <section className="angel-shell py-10 sm:py-12">
        <div className="angel-chat-arrival animate-enter">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <span className="angel-eyebrow">
                Angel AI / Admin / Moderation Analytics
              </span>
              <h1 className="mt-5 max-w-3xl font-display text-[clamp(2rem,4vw,3.3rem)] leading-[0.96] tracking-[-0.05em] text-text-primary">
                Redacted moderation trends and response timing.
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
                This view stays metadata-first. It surfaces only aggregated
                moderation volume, enforcement counts, review reasons, and SLA
                patterns across the 7-day and 30-day windows.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="quiet">
                <Link href="/admin/moderation">Back to moderation</Link>
              </Button>
              <Button asChild variant="quiet">
                <Link href="/admin">Back to admin</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          {analytics.ranges.map((range) => (
            <Card
              key={range.days}
              variant="soft"
              padding="lg"
              className="animate-enter"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="angel-kicker">{range.days}-day window</p>
                  <h2 className="mt-2 font-display text-[1.9rem] tracking-[-0.045em] text-text-primary">
                    {range.totalIncidents} total incidents
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-text-secondary">
                    Generated {formatDateTime(analytics.generatedAt)} UTC.
                  </p>
                </div>
                <span className="angel-chat-chip">Redacted only</span>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <MetricCard
                  icon={<ShieldAlert className="h-5 w-5" />}
                  label="Blocked input"
                  value={String(sumBreakdown(range.byEnforcementAction))}
                  helper="Critical-only live enforcement events"
                />
                <MetricCard
                  icon={<BarChart3 className="h-5 w-5" />}
                  label="False-positive rate"
                  value={
                    range.falsePositiveRate === null
                      ? 'N/A'
                      : `${range.falsePositiveRate}%`
                  }
                  helper="Latest review reason marked false positive"
                />
                <MetricCard
                  icon={<Clock3 className="h-5 w-5" />}
                  label="Median first review"
                  value={formatHours(range.medianTimeToFirstReviewHours)}
                  helper="Hours from incident creation to first review event"
                />
                <MetricCard
                  icon={<Users className="h-5 w-5" />}
                  label="Median resolution"
                  value={formatHours(range.medianTimeToResolutionHours)}
                  helper="Hours from incident creation to resolved or dismissed"
                />
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <BreakdownCard
                  title="By category"
                  values={range.byCategory}
                  formatter={formatCategory}
                />
                <BreakdownCard
                  title="By severity"
                  values={range.bySeverity}
                  formatter={formatGeneric}
                />
                <BreakdownCard
                  title="By status"
                  values={range.byStatus}
                  formatter={formatGeneric}
                />
                <BreakdownCard
                  title="By sender role"
                  values={range.bySenderRole}
                  formatter={formatGeneric}
                />
                <BreakdownCard
                  title="Enforcement"
                  values={range.byEnforcementAction}
                  formatter={formatGeneric}
                />
                <BreakdownCard
                  title="Review reasons"
                  values={range.byReasonCode}
                  formatter={formatReasonCode}
                />
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-white/8 bg-black/10 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-text-tertiary">
                  Repeat-user unresolved counts
                </p>
                {range.repeatUsers.length === 0 ? (
                  <p className="mt-3 text-sm leading-7 text-text-secondary">
                    No repeat unresolved users in this range.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {range.repeatUsers.map((user) => (
                      <div
                        key={user.userId}
                        className="flex items-center justify-between gap-4 rounded-[1.1rem] border border-white/8 bg-white/[0.03] px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-text-primary">
                            {user.userLabel}
                          </p>
                          <p className="text-sm leading-7 text-text-secondary">
                            Repeated unresolved risk within the {range.days}-day
                            window.
                          </p>
                        </div>
                        <span className="angel-chat-chip">
                          {user.unresolvedCount} unresolved
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>
    </main>
  )
}

function MetricCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: ReactNode
  label: string
  value: string
  helper: string
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-accent-primary/20 bg-accent-primary/10 text-accent-primary">
          {icon}
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-text-tertiary">
            {label}
          </p>
          <p className="mt-3 font-display text-[2rem] tracking-[-0.04em] text-text-primary">
            {value}
          </p>
          <p className="mt-2 text-sm leading-7 text-text-secondary">{helper}</p>
        </div>
      </div>
    </div>
  )
}

function BreakdownCard<T extends string>({
  title,
  values,
  formatter,
}: {
  title: string
  values: Array<{ value: T; count: number }>
  formatter: (value: T) => string
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/8 bg-black/10 p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-text-tertiary">
        {title}
      </p>
      {values.length === 0 ? (
        <p className="mt-3 text-sm leading-7 text-text-secondary">None</p>
      ) : (
        <div className="mt-4 space-y-3">
          {values.map((entry) => (
            <div
              key={entry.value}
              className="flex items-center justify-between gap-4 rounded-[1.1rem] border border-white/8 bg-white/[0.03] px-4 py-3"
            >
              <p className="text-sm font-semibold text-text-primary">
                {formatter(entry.value)}
              </p>
              <span className="angel-chat-chip">{entry.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function sumBreakdown(values: Array<{ count: number }>) {
  return values.reduce((sum, entry) => sum + entry.count, 0)
}

function formatHours(value: number | null) {
  return value === null ? 'N/A' : `${value}h`
}

function formatDateTime(value: string) {
  return adminDateTimeFormatter.format(new Date(value))
}

function formatCategory(value: string) {
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
      return formatGeneric(value)
  }
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
      return formatGeneric(value)
  }
}

function formatGeneric(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}
