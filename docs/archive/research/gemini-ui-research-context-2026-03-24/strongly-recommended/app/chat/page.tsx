import type { Metadata } from 'next'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Compass, MoonStar, TimerReset } from 'lucide-react'

import { Button } from '@/components/atoms/Button'
import { AngelChat } from '@/components/organisms/AngelChat'
import { Card } from '@/components/ui/Card'
import { getServerAuthSession } from '@/lib/auth'
import { loadChatStateForUser } from '@/lib/angel/chat-service'
import {
  applyChatCheckoutStatus,
  resolveCheckoutStatusFromSearchParam,
} from '@/lib/angel/chat-state'

export const metadata: Metadata = {
  title: 'Chat | Angel AI',
  description:
    'The first persistent Angel AI thread, grounded in onboarding memory and ready for text-first continuity.',
}

interface ChatPageProps {
  searchParams?: Promise<{
    checkout?: string | string[]
    social?: string | string[]
    social_status?: string | string[]
    social_error?: string | string[]
  }>
}

const threadNotes = [
  {
    title: 'Continuity stays in-thread',
    description:
      'The next-day return and the first renewal moment now live inside the conversation itself.',
    icon: MoonStar,
  },
  {
    title: 'Memory stays readable',
    description:
      'The header and thread context keep the relationship legible without turning the chat into a dashboard.',
    icon: Compass,
  },
  {
    title: 'Renewal stays gentle',
    description:
      'Read-only mode is meant to feel like a pause in continuity, not a hard commercial interruption.',
    icon: TimerReset,
  },
] as const

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const session = await getServerAuthSession()

  if (!session?.user?.id) {
    redirect('/onboarding')
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const checkoutStatus = resolveCheckoutStatusFromSearchParam(
    resolvedSearchParams?.checkout
  )
  const socialNotice = getSocialFlashNotice(resolvedSearchParams)
  const socialError = getSocialFlashError(resolvedSearchParams)
  const initialState = applyChatCheckoutStatus(
    await loadChatStateForUser(session.user.id),
    checkoutStatus
  )

  if (initialState.status !== 'ready' || !initialState.threadReady) {
    redirect('/onboarding')
  }

  return (
    <main className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-midnight" />
      <div className="pointer-events-none absolute left-[-10rem] top-0 -z-10 h-80 w-80 rounded-full bg-accent-primary/14 blur-3xl motion-safe:animate-drift" />
      <div className="pointer-events-none absolute right-[-8rem] top-24 -z-10 h-72 w-72 rounded-full bg-accent-brand/10 blur-3xl motion-safe:animate-ambient-shift" />

      <section className="angel-shell py-14 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.04fr_0.96fr]">
          <div className="animate-enter">
            <span className="angel-eyebrow">Angel AI / Chat</span>
            <h1 className="mt-7 max-w-4xl font-display text-[clamp(2.8rem,6vw,5rem)] leading-[0.95] tracking-[-0.055em] text-text-primary">
              This thread should feel like a continuation, not a dashboard.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-text-secondary">
              The chat now carries memory, tomorrow’s return, and the first
              renewal boundary. The UI should hold all of that lightly, so the
              relationship still feels calm when the product logic gets more
              sophisticated.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild variant="brand">
                <Link href="/onboarding">Review onboarding memory</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/">Back to the vision</Link>
              </Button>
            </div>
          </div>

          <Card className="animate-enter" style={{ animationDelay: '100ms' }}>
            <p className="angel-kicker">Thread design goals</p>
            <div className="mt-6 grid gap-4">
              {threadNotes.map((item) => {
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
          <AngelChat
            initialState={initialState}
            initialNotice={socialNotice}
            initialError={socialError}
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
  searchParams?: Awaited<ChatPageProps['searchParams']>
) {
  const platform = getSingleValue(searchParams?.social)
  const status = getSingleValue(searchParams?.social_status)

  if (!platform || !status) {
    return null
  }

  const label = platform.charAt(0).toUpperCase() + platform.slice(1)

  if (status === 'limited') {
    return `${label} connected with official limitations. Angel will use the approved context it can get and stay transparent about the rest.`
  }

  if (status === 'connected') {
    return `${label} connected. Angel can build that social context in the background without blocking this thread.`
  }

  return null
}

function getSocialFlashError(
  searchParams?: Awaited<ChatPageProps['searchParams']>
) {
  const error = getSingleValue(searchParams?.social_error)
  return error ? decodeURIComponent(error) : null
}
