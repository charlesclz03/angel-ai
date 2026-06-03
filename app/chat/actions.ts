'use server'

import { revalidatePath } from 'next/cache'

import {
  createBillingPortalSessionForUser,
  createCheckoutSessionForUser,
} from '@/lib/billing/stripe'
import type { CheckoutPlan, CheckoutSessionResult } from '@/lib/billing/types'
import { requireServerAuthSession } from '@/lib/auth'
import {
  deleteMemoryEntryForUser,
  updateMemoryEntryForUser,
} from '@/lib/angel/memory-service'
import {
  updateRitualPreferencesForUser,
  type RitualKey,
} from '@/lib/angel/relationship-service'
import { sendChatMessageForUser } from '@/lib/angel/chat-service'
import { generatePhotoMemoryForUser } from '@/lib/angel/photo-memory-service'
import { generateAngelVoiceReplyForUser } from '@/lib/angel/voice-service'
import type { ChatMessageInput, ChatState } from '@/lib/angel/chat-state'
import { updateNotificationPreferencesForUser } from '@/lib/push/preferences'

export async function sendChatMessage(
  input: ChatMessageInput
): Promise<ChatState> {
  const session = await requireServerAuthSession(
    'Please sign in before sending a message.'
  )
  const state = await sendChatMessageForUser(session.user.id, input)

  revalidatePath('/chat')
  revalidatePath('/onboarding')

  return state
}

export async function createCheckoutSession(
  plan: CheckoutPlan
): Promise<CheckoutSessionResult> {
  const session = await requireServerAuthSession(
    'Please sign in before opening checkout.'
  )

  return createCheckoutSessionForUser({
    userId: session.user.id,
    userEmail: session.user.email ?? null,
    plan,
  })
}

export async function createBillingPortalSession(): Promise<CheckoutSessionResult> {
  const session = await requireServerAuthSession(
    'Please sign in before opening billing.'
  )

  return createBillingPortalSessionForUser({
    userId: session.user.id,
  })
}

export async function updateMemoryEntry(
  memoryEntryId: string,
  input: {
    summary?: string
    isPinned?: boolean
    isHidden?: boolean
  }
): Promise<ChatState> {
  const session = await requireServerAuthSession(
    'Please sign in before updating memory.'
  )

  await updateMemoryEntryForUser(session.user.id, memoryEntryId, input)
  revalidatePath('/chat')

  const { loadChatStateForUser } = await import('@/lib/angel/chat-service')
  return loadChatStateForUser(session.user.id)
}

export async function deleteMemoryEntry(
  memoryEntryId: string
): Promise<ChatState> {
  const session = await requireServerAuthSession(
    'Please sign in before deleting memory.'
  )

  await deleteMemoryEntryForUser(session.user.id, memoryEntryId)
  revalidatePath('/chat')

  const { loadChatStateForUser } = await import('@/lib/angel/chat-service')
  return loadChatStateForUser(session.user.id)
}

export async function setRitualPreferences(
  ritualKeys: RitualKey[]
): Promise<ChatState> {
  const session = await requireServerAuthSession(
    'Please sign in before changing ritual preferences.'
  )

  await updateRitualPreferencesForUser(session.user.id, ritualKeys)
  revalidatePath('/chat')

  const { loadChatStateForUser } = await import('@/lib/angel/chat-service')
  return loadChatStateForUser(session.user.id)
}

export async function logRitualCheckIn(ritualId: string): Promise<{
  success: boolean
  streakCount: number
  alreadyCheckedIn: boolean
  state?: ChatState
}> {
  const session = await requireServerAuthSession(
    'Please sign in before checking in.'
  )

  const { prisma } = await import('@/lib/prisma')

  const ritual = await prisma.sharedRitual.findFirst({
    where: {
      id: ritualId,
      userId: session.user.id,
      status: 'ACTIVE',
    },
  })

  if (!ritual) {
    return { success: false, streakCount: 0, alreadyCheckedIn: false }
  }

  // Prevent double check-ins on the same calendar day (user's local timezone)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (ritual.lastCheckInDate && ritual.lastCheckInDate >= today) {
    const { loadChatStateForUser } = await import('@/lib/angel/chat-service')

    return {
      success: false,
      streakCount: ritual.streakCount,
      alreadyCheckedIn: true,
      state: await loadChatStateForUser(session.user.id),
    }
  }

  // Determine if the streak continues or resets
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const streakContinues =
    ritual.lastCheckInDate && ritual.lastCheckInDate >= yesterday

  const newStreak = streakContinues ? ritual.streakCount + 1 : 1
  const newLongestStreak = Math.max(newStreak, ritual.longestStreak)

  await prisma.sharedRitual.update({
    where: { id: ritualId },
    data: {
      streakCount: newStreak,
      longestStreak: newLongestStreak,
      lastCheckInDate: new Date(),
    },
  })

  revalidatePath('/chat')

  const { loadChatStateForUser } = await import('@/lib/angel/chat-service')

  return {
    success: true,
    streakCount: newStreak,
    alreadyCheckedIn: false,
    state: await loadChatStateForUser(session.user.id),
  }
}

export async function generateAngelVoiceReply(
  messageId: string
): Promise<ChatState> {
  const session = await requireServerAuthSession(
    'Please sign in before generating an Angel voice reply.'
  )

  await generateAngelVoiceReplyForUser(session.user.id, messageId)
  revalidatePath('/chat')

  const { loadChatStateForUser } = await import('@/lib/angel/chat-service')
  return loadChatStateForUser(session.user.id)
}

export async function generatePhotoMemory(
  messageId: string
): Promise<ChatState> {
  const session = await requireServerAuthSession(
    'Please sign in before generating a memory snapshot.'
  )

  await generatePhotoMemoryForUser(session.user.id, messageId)
  revalidatePath('/chat')

  const { loadChatStateForUser } = await import('@/lib/angel/chat-service')
  return loadChatStateForUser(session.user.id)
}

export async function updateNotificationPreferences(input: {
  enabled: boolean
  quietHoursStart: string | null
  quietHoursEnd: string | null
}): Promise<ChatState> {
  const session = await requireServerAuthSession(
    'Please sign in before changing notification settings.'
  )

  await updateNotificationPreferencesForUser(session.user.id, input)
  revalidatePath('/chat')

  const { loadChatStateForUser } = await import('@/lib/angel/chat-service')
  return loadChatStateForUser(session.user.id)
}
