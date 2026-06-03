import { describe, expect, it, vi } from 'vitest'

import {
  completeOnboardingTx,
  loadOnboardingStateForUser,
  persistOnboardingStepTx,
} from '@/lib/angel/onboarding-service'
import { getDefaultOnboardingDraft } from '@/lib/angel/onboarding-state'

function createFakeOnboardingDb() {
  let responseCounter = 0
  let conversationCounter = 0
  let touchpointCounter = 0

  const state = {
    responses: [] as Array<Record<string, unknown>>,
    companionProfile: null as Record<string, unknown> | null,
    soulProfile: null as Record<string, unknown> | null,
    conversations: [] as Array<Record<string, unknown>>,
    touchpoints: [] as Array<Record<string, unknown>>,
    messages: [] as Array<Record<string, unknown>>,
    memoryEntries: [] as Array<Record<string, unknown>>,
  }

  const db = {
    onboardingResponse: {
      deleteMany: vi.fn(
        async ({ where }: { where: Record<string, unknown> }) => {
          const originalLength = state.responses.length
          const stepKey = where.stepKey

          state.responses = state.responses.filter((response) => {
            if (response.userId !== where.userId) {
              return true
            }

            if (typeof stepKey === 'string') {
              return response.stepKey !== stepKey
            }

            if (
              stepKey &&
              typeof stepKey === 'object' &&
              Array.isArray((stepKey as { in?: string[] }).in)
            ) {
              return !(stepKey as { in: string[] }).in.includes(
                String(response.stepKey)
              )
            }

            return false
          })

          return { count: originalLength - state.responses.length }
        }
      ),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const record = {
          id: `resp-${++responseCounter}`,
          createdAt: new Date(
            `2026-03-18T10:${String(responseCounter).padStart(2, '0')}:00Z`
          ),
          ...data,
        }
        state.responses.push(record)
        return record
      }),
      createMany: vi.fn(
        async ({ data }: { data: Array<Record<string, unknown>> }) => {
          data.forEach((row) => {
            state.responses.push({
              id: `resp-${++responseCounter}`,
              createdAt: new Date(
                `2026-03-18T11:${String(responseCounter).padStart(2, '0')}:00Z`
              ),
              ...row,
            })
          })

          return { count: data.length }
        }
      ),
      findMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) =>
        state.responses
          .filter((response) => response.userId === where.userId)
          .sort(
            (left, right) =>
              new Date(String(right.createdAt)).getTime() -
              new Date(String(left.createdAt)).getTime()
          )
      ),
    },
    companionProfile: {
      findUnique: vi.fn(
        async ({ where }: { where: Record<string, unknown> }) => {
          if (
            state.companionProfile &&
            state.companionProfile.userId === where.userId
          ) {
            return { id: String(state.companionProfile.id) }
          }

          return null
        }
      ),
      upsert: vi.fn(
        async ({
          where,
          create,
          update,
        }: {
          where: Record<string, unknown>
          create: Record<string, unknown>
          update: Record<string, unknown>
        }) => {
          if (state.companionProfile?.userId === where.userId) {
            state.companionProfile = {
              ...state.companionProfile,
              ...update,
            }
          } else {
            state.companionProfile = {
              id: 'companion-1',
              ...create,
            }
          }

          return state.companionProfile
        }
      ),
    },
    soulProfile: {
      findUnique: vi.fn(
        async ({ where }: { where: Record<string, unknown> }) => {
          if (state.soulProfile && state.soulProfile.userId === where.userId) {
            return { id: String(state.soulProfile.id) }
          }

          return null
        }
      ),
      upsert: vi.fn(
        async ({
          where,
          create,
          update,
        }: {
          where: Record<string, unknown>
          create: Record<string, unknown>
          update: Record<string, unknown>
        }) => {
          if (state.soulProfile?.userId === where.userId) {
            state.soulProfile = {
              ...state.soulProfile,
              ...update,
            }
          } else {
            state.soulProfile = {
              id: 'soul-1',
              ...create,
            }
          }

          return state.soulProfile
        }
      ),
    },
    conversation: {
      findFirst: vi.fn(
        async ({ where }: { where: Record<string, unknown> }) =>
          state.conversations.find(
            (conversation) =>
              conversation.userId === where.userId &&
              conversation.status === where.status
          ) ?? null
      ),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const record = {
          id: `conversation-${++conversationCounter}`,
          createdAt: new Date(`2026-03-18T12:00:0${conversationCounter}Z`),
          ...data,
        }
        state.conversations.push(record)
        return record
      }),
    },
    touchpoint: {
      findFirst: vi.fn(
        async ({ where }: { where: Record<string, unknown> }) => {
          const scheduledFor = where.scheduledFor as
            | { gte?: Date; lt?: Date }
            | undefined

          return (
            state.touchpoints.find((touchpoint) => {
              const scheduledTime = new Date(
                String(touchpoint.scheduledFor)
              ).getTime()

              return (
                touchpoint.userId === where.userId &&
                (!where.conversationId ||
                  touchpoint.conversationId === where.conversationId) &&
                touchpoint.type === where.type &&
                (!scheduledFor?.gte ||
                  scheduledTime >= scheduledFor.gte.getTime()) &&
                (!scheduledFor?.lt || scheduledTime < scheduledFor.lt.getTime())
              )
            }) ?? null
          )
        }
      ),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const record = {
          id: `touchpoint-${++touchpointCounter}`,
          ...data,
        }
        state.touchpoints.push(record)
        return record
      }),
    },
    message: {
      findMany: vi.fn(
        async ({
          where,
        }: {
          where: Record<string, unknown>
        }) =>
          state.messages.filter((message) => {
            if (where.conversationId && message.conversationId !== where.conversationId) {
              return false
            }

            if (
              where.id &&
              typeof where.id === 'object' &&
              Array.isArray((where.id as { in?: string[] }).in)
            ) {
              return (where.id as { in: string[] }).in.includes(String(message.id))
            }

            return true
          })
      ),
    },
    memoryEntry: {
      findMany: vi.fn(
        async ({ where }: { where: Record<string, unknown> }) =>
          state.memoryEntries.filter((entry) => entry.userId === where.userId)
      ),
    },
  }

  return { db, state }
}

function buildPhaseOneDraft() {
  return getDefaultOnboardingDraft({
    preferredName: 'Charlie',
    isAdult: true,
    timezone: 'Europe/Lisbon',
    tonePreference: 'Warm and grounded.',
    communicationStyle: 'Honest and easy to answer.',
    checkinPreference: 'A couple of gentle touchpoints that feel natural.',
    relationshipIntent: 'GROW_OVER_TIME',
    interests: ['music', 'late-night chats'],
    mediaPreferences: ['links', 'images'],
    dailyRhythm: ['slow mornings', 'quiet nights'],
    emotionalNeeds: ['gentleness', 'continuity'],
    boundaries: ['no pressure to reply instantly'],
    birthDate: '1997-07-24',
    angelName: 'Noor',
    coreTone: 'Soft, steady, and observant.',
    humorStyle: 'Dry and intimate.',
    warmthLevel: 74,
    playfulnessLevel: 58,
  })
}

describe('onboarding service', () => {
  it('replaces older step rows when saving the same step again', async () => {
    const { db, state } = createFakeOnboardingDb()

    await persistOnboardingStepTx(db as never, 'user-1', {
      stepKey: 'arrival',
      promptText: 'Before we go any further, what should I call you?',
      responseText: 'Old name',
      responseJson: { preferredName: 'Old name' },
    })

    await persistOnboardingStepTx(db as never, 'user-1', {
      stepKey: 'arrival',
      promptText: 'Before we go any further, what should I call you?',
      responseText: 'Charlie',
      responseJson: { preferredName: 'Charlie' },
    })

    expect(state.responses).toHaveLength(1)
    expect(state.responses[0]?.responseText).toBe('Charlie')
  })

  it('completes Phase 1 idempotently without duplicating conversation or touchpoints', async () => {
    const { db, state } = createFakeOnboardingDb()
    const draft = buildPhaseOneDraft()
    const completedAt = new Date('2026-03-18T22:45:00Z')

    await completeOnboardingTx(
      db as never,
      { id: 'user-1', name: 'Charles' },
      draft,
      completedAt
    )

    await completeOnboardingTx(
      db as never,
      { id: 'user-1', name: 'Charles' },
      draft,
      completedAt
    )

    expect(state.responses).toHaveLength(13)
    expect(state.companionProfile).not.toBeNull()
    expect(state.soulProfile).not.toBeNull()
    expect(state.conversations).toHaveLength(1)
    expect(state.touchpoints).toHaveLength(1)
  })

  it('loads a completed onboarding state from the persisted records', async () => {
    const { db } = createFakeOnboardingDb()
    const draft = buildPhaseOneDraft()

    await completeOnboardingTx(
      db as never,
      { id: 'user-1', name: 'Charles' },
      draft,
      new Date('2026-03-18T22:45:00Z')
    )

    const loaded = await loadOnboardingStateForUser(
      { id: 'user-1', name: 'Charles' },
      db as never
    )

    expect(loaded.status).toBe('complete')
    expect(loaded.savedSteps).toContain('promise-of-tomorrow')
    expect(loaded.scheduledTouchpointLabel).toBeTruthy()
  })
})
