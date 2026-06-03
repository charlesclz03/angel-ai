import type { Metadata } from 'next'
import Link from 'next/link'
import { Compass, Sparkles, TimerReset } from 'lucide-react'

import { Button } from '@/components/atoms/Button'
import { AngelOnboardingFlow } from '@/components/organisms/AngelOnboardingFlow'
import { Card } from '@/components/ui/Card'
import { getServerAuthSession } from '@/lib/auth'
import { loadOnboardingStateForUser } from '@/lib/angel/onboarding-service'
import { buildPreAuthOnboardingState } from '@/lib/angel/onboarding-state'

export const metadata: Metadata = {
  title: 'Onboarding | Angel AI',
  description:
    'Chat-shaped onboarding for Angel AI with resumable memory seeding, companion identity, and next-day continuity.',
}

const onboardingNotes = [
  {
    title: 'One conversation at a time',
    description:
      'The flow should feel like a guided first meeting, not an account setup wizard.',
    icon: Compass,
  },
  {
    title: 'Memory forms quietly',
    description:
      'Every meaningful step maps into durable context that the thread can use later.',
    icon: Sparkles,
  },
  {
    title: 'Tomorrow is already in view',
    description:
      'This first session is designed to hand off into a real next-day return.',
    icon: TimerReset,
  },
] as const

export default async function OnboardingPage(props: OnboardingPageProps) {
  return renderOnboardingPage(props)
}

interface OnboardingPageProps {
  searchParams?: Promise<{
    social?: string | string[]
    social_status?: string | string[]
    social_error?: string | string[]
  }>
}

async function renderOnboardingPage({
  searchParams,
}: OnboardingPageProps = {}) {
  const session = await getServerAuthSession()
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const initialState = session?.user?.id
    ? await loadOnboardingStateForUser({
        id: session.user.id,
        name: session.user.name,
      })
    : buildPreAuthOnboardingState()
  const initialNotice = getSocialFlashNotice(resolvedSearchParams)
  const initialError = getSocialFlashError(resolvedSearchParams)

  return (
    <main className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-midnight" />
      <div className="pointer-events-none absolute left-[-12rem] top-[-3rem] -z-10 h-80 w-80 rounded-full bg-accent-primary/14 blur-3xl motion-safe:animate-drift" />
      <div className="pointer-events-none absolute right-[-10rem] top-28 -z-10 h-80 w-80 rounded-full bg-accent-brand/10 blur-3xl motion-safe:animate-ambient-shift" />

      <section className="angel-shell py-16 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="animate-enter">
            <span className="angel-eyebrow">Angel AI / Onboarding</span>
            <h1 className="mt-7 max-w-4xl font-display text-[clamp(3.1rem,7vw,5.8rem)] leading-[0.94] tracking-[-0.055em] text-text-primary">
              The first conversation should feel like being met, not being
              configured.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-text-secondary">
              This flow seeds the tone, boundaries, and shared memory that make
              Angel’s return feel emotionally continuous. The product logic is
              durable underneath it. The experience should stay human on the
              surface.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Button asChild variant="brand">
                <Link href="/">Back to the vision</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/chat">Open the thread</Link>
              </Button>
            </div>
          </div>

          <Card className="animate-enter" style={{ animationDelay: '100ms' }}>
            <p className="angel-kicker">What this flow is protecting</p>
            <div className="mt-6 grid gap-4">
              {onboardingNotes.map((item) => {
                const Icon = item.icon

                return (
                  <article
                    key={item.title}
                    className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-5"
                  >
                    <div className="flex gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-accent-primary/20 bg-accent-primary/10">
                        <Icon className="h-4.5 w-4.5 text-accent-primary" />
                      </div>
                      <div>
                        <h2 className="font-display text-[1.55rem] tracking-[-0.04em] text-text-primary">
                          {item.title}
                        </h2>
                        <p className="mt-2 text-sm leading-7 text-text-secondary">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </Card>
        </div>

        <div className="mt-10">
          <AngelOnboardingFlow
            initialState={initialState}
            isAuthenticated={Boolean(session?.user?.id)}
            userDisplayName={
              session?.user?.name ?? session?.user?.email ?? null
            }
            initialNotice={initialNotice}
            initialError={initialError}
          />
        </div>
      </section>
    </main>
  )
}

function getSingleValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value
}

function getSocialFlashNotice(
  searchParams?: Awaited<OnboardingPageProps['searchParams']>
) {
  const platform = getSingleValue(searchParams?.social)
  const status = getSingleValue(searchParams?.social_status)

  if (!platform || !status) {
    return null
  }

  const label = platform.charAt(0).toUpperCase() + platform.slice(1)

  if (status === 'limited') {
    return `${label} connected with official limitations. Angel will use whatever context the approved API actually exposed.`
  }

  if (status === 'connected') {
    return `${label} connected. Angel can queue that context scan as soon as onboarding finishes.`
  }

  return null
}

function getSocialFlashError(
  searchParams?: Awaited<OnboardingPageProps['searchParams']>
) {
  const error = getSingleValue(searchParams?.social_error)
  return error ? decodeURIComponent(error) : null
}
