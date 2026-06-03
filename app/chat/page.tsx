import type { Metadata } from 'next'

import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Button } from '@/components/atoms/Button'
import { AngelChat } from '@/components/organisms/AngelChat'
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

      <section className="angel-shell py-10 sm:py-12">
        <div className="angel-chat-arrival animate-enter">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <span className="angel-eyebrow">Angel AI / Chat</span>
              <h1 className="mt-5 max-w-3xl font-display text-[clamp(2rem,4vw,3.4rem)] leading-[0.96] tracking-[-0.05em] text-text-primary">
                One calm place to pick the thread back up.
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
                Memory, tomorrow&apos;s return, and renewal all stay inside the
                conversation now. The page should feel like arrival, then get
                out of the way.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="quiet">
                <Link href="/onboarding">Review onboarding memory</Link>
              </Button>
              <Button asChild variant="link">
                <Link href="/">Back home</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6 sm:mt-8">
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
