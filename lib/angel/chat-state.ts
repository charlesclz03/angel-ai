import type {
  CompanionProfile,
  ContentType,
  Message,
  MessageAttachment,
  MessageAttachmentType,
  MessageSenderRole,
  PaywallState,
  RelationshipIntent,
  RelationshipStage,
  SoulProfile,
  Touchpoint,
} from '@prisma/client'

import type {
  ChatMemoryEntryRecord,
  RelationshipDossier,
} from '@/lib/angel/memory-service'
import type { PhotoMemoryStatus } from '@/lib/angel/photo-memory-service'
import type { RitualPreference } from '@/lib/angel/relationship-service'
import type { ChatAttachmentInput } from '@/lib/angel/media'
import {
  formatScheduledTouchpoint,
  normalizeStringList,
} from '@/lib/angel/onboarding-state'
import type { NotificationPreferencesState } from '@/lib/push/preferences'
import type { SocialScanStateRecord } from '@/lib/social/types'
import { extractCompanionSummaryHighlight } from '@/lib/angel/summary-service'

export type ChatStatus = 'needs-onboarding' | 'ready'
export type ChatAccessMode = 'ACTIVE' | 'READ_ONLY' | 'SUBSCRIBER'
export type ChatPaywallReason = 'CONTINUITY_RENEWAL' | null
export type ChatCheckoutStatus =
  | 'READY'
  | 'BILLING_UNAVAILABLE'
  | 'RETURNED_SUCCESS'
  | 'RETURNED_CANCELED'

export interface ChatMessageRecord {
  id: string
  senderRole: MessageSenderRole
  contentText: string | null
  contentType: ContentType
  paywallState: PaywallState
  createdAt: string
  attachments: ChatAttachmentRecord[]
}

export interface ChatAttachmentRecord {
  id: string
  type: MessageAttachmentType
  url: string
  mimeType: string | null
  title: string | null
  metadata: Record<string, unknown> | null
}

export interface ChatCompanionContext {
  preferredName: string | null
  angelName: string | null
  relationshipIntent: RelationshipIntent | null
  relationshipStage: RelationshipStage
  scheduledTouchpointAt?: string
  scheduledTouchpointLabel?: string
}

export interface ChatSharedRitualRecord {
  id: string
  title: string
  description: string | null
  streakCount: number
  longestStreak: number
  lastCheckInDate: string | null
}

export interface ChatState {
  status: ChatStatus
  conversationId: string | null
  messages: ChatMessageRecord[]
  threadReady: boolean
  companionContext: ChatCompanionContext
  accessMode: ChatAccessMode
  remainingFreeReplies: number | null
  paywallReason: ChatPaywallReason
  checkoutStatus: ChatCheckoutStatus
  memoryEntries: ChatMemoryEntryRecord[]
  relationshipDossier: RelationshipDossier
  rituals: RitualPreference[]
  sharedRituals: ChatSharedRitualRecord[]
  socialScanState: SocialScanStateRecord[]
  photoMemoryStatus: PhotoMemoryStatus
  notificationPreferences: NotificationPreferencesState
}

interface ChatSnapshot {
  conversationId?: string | null
  messages: Array<
    Pick<
      Message,
      | 'id'
      | 'senderRole'
      | 'contentText'
      | 'contentType'
      | 'paywallState'
      | 'createdAt'
    > & {
      attachments?: Pick<
        MessageAttachment,
        'id' | 'type' | 'url' | 'mimeType' | 'title' | 'metadata'
      >[]
    }
  >
  companionProfile: Pick<
    CompanionProfile,
    | 'preferredName'
    | 'timezone'
    | 'relationshipIntent'
    | 'interests'
    | 'tonePreference'
    | 'checkinPreference'
  > | null
  soulProfile: Pick<
    SoulProfile,
    'angelName' | 'coreTone' | 'relationshipStage'
  > | null
  touchpoint: Pick<Touchpoint, 'scheduledFor'> | null
  accessMode?: ChatAccessMode
  remainingFreeReplies?: number | null
  paywallReason?: ChatPaywallReason
  checkoutStatus?: ChatCheckoutStatus
  memoryEntries?: ChatMemoryEntryRecord[]
  relationshipDossier?: RelationshipDossier
  rituals?: RitualPreference[]
  sharedRituals?: ChatSharedRitualRecord[]
  socialScanState?: SocialScanStateRecord[]
  photoMemoryStatus?: PhotoMemoryStatus
  notificationPreferences?: NotificationPreferencesState
}

interface SeededAngelOpenerContext {
  preferredName?: string | null
  angelName?: string | null
  coreTone?: string | null
  interests?: unknown
  scheduledTouchpointLabel?: string
}

interface ContinuityFollowupContext {
  preferredName?: string | null
  angelName?: string | null
  tonePreference?: string | null
  checkinPreference?: string | null
  relationshipIntent?: RelationshipIntent | null
  relationshipStage?: RelationshipStage
  interests?: unknown
  userSummaryMarkdown?: string | null
  callbackHook?: string | null
}

export interface ChatMessageInput {
  conversationId: string
  contentText: string
  contentType?: ContentType
  attachments?: ChatAttachmentInput[]
}

export function buildNeedsOnboardingChatState(
  snapshot?: Omit<
    ChatSnapshot,
    'messages' | 'accessMode' | 'remainingFreeReplies' | 'paywallReason'
  >
): ChatState {
  return {
    status: 'needs-onboarding',
    conversationId: snapshot?.conversationId ?? null,
    messages: [],
    threadReady: false,
    companionContext: buildCompanionContext(snapshot),
    accessMode: 'ACTIVE',
    remainingFreeReplies: null,
    paywallReason: null,
    checkoutStatus: snapshot?.checkoutStatus ?? 'BILLING_UNAVAILABLE',
    memoryEntries: snapshot?.memoryEntries ?? [],
    relationshipDossier: snapshot?.relationshipDossier ?? {
      relationshipStage:
        snapshot?.soulProfile?.relationshipStage ?? 'NEW_CONNECTION',
      sections: [],
    },
    rituals: snapshot?.rituals ?? [],
    sharedRituals: snapshot?.sharedRituals ?? [],
    socialScanState: snapshot?.socialScanState ?? [],
    photoMemoryStatus: snapshot?.photoMemoryStatus ?? {
      available: false,
      remainingThisMonth: 0,
      monthlyLimit: 0,
      unavailableReason: 'UPGRADE_REQUIRED',
    },
    notificationPreferences: snapshot?.notificationPreferences ?? {
      enabled: true,
      quietHoursStart: null,
      quietHoursEnd: null,
      timeZone: snapshot?.companionProfile?.timezone?.trim() || 'UTC',
    },
  }
}

export function buildReadyChatState(snapshot: ChatSnapshot): ChatState {
  return {
    status: 'ready',
    conversationId: snapshot.conversationId ?? null,
    messages: snapshot.messages.map((message) => ({
      id: message.id,
      senderRole: message.senderRole,
      contentText: message.contentText,
      contentType: message.contentType,
      paywallState: message.paywallState,
      createdAt: message.createdAt.toISOString(),
      attachments: (message.attachments ?? []).map((attachment) => ({
        id: attachment.id,
        type: attachment.type,
        url: attachment.url,
        mimeType: attachment.mimeType ?? null,
        title: attachment.title ?? null,
        metadata:
          attachment.metadata &&
          typeof attachment.metadata === 'object' &&
          !Array.isArray(attachment.metadata)
            ? (attachment.metadata as Record<string, unknown>)
            : null,
      })),
    })),
    threadReady: true,
    companionContext: buildCompanionContext(snapshot),
    accessMode: snapshot.accessMode ?? 'ACTIVE',
    remainingFreeReplies: snapshot.remainingFreeReplies ?? null,
    paywallReason: snapshot.paywallReason ?? null,
    checkoutStatus: snapshot.checkoutStatus ?? 'BILLING_UNAVAILABLE',
    memoryEntries: snapshot.memoryEntries ?? [],
    relationshipDossier: snapshot.relationshipDossier ?? {
      relationshipStage:
        snapshot.soulProfile?.relationshipStage ?? 'NEW_CONNECTION',
      sections: [],
    },
    rituals: snapshot.rituals ?? [],
    sharedRituals: snapshot.sharedRituals ?? [],
    socialScanState: snapshot.socialScanState ?? [],
    photoMemoryStatus: snapshot.photoMemoryStatus ?? {
      available: false,
      remainingThisMonth: 0,
      monthlyLimit: 0,
      unavailableReason: 'UPGRADE_REQUIRED',
    },
    notificationPreferences: snapshot.notificationPreferences ?? {
      enabled: true,
      quietHoursStart: null,
      quietHoursEnd: null,
      timeZone: snapshot.companionProfile?.timezone?.trim() || 'UTC',
    },
  }
}

export function buildSeededAngelOpener({
  preferredName,
  angelName,
  coreTone,
  interests,
  scheduledTouchpointLabel,
}: SeededAngelOpenerContext): string {
  const resolvedAngelName = angelName?.trim() || 'Angel'
  const introduction = preferredName?.trim()
    ? `${preferredName.trim()}, I'm ${resolvedAngelName}.`
    : `I'm ${resolvedAngelName}.`
  const toneLine = coreTone?.trim()
    ? `I remember the tone we set: ${ensureSentence(coreTone)}`
    : 'I want this thread to feel calm, steady, and easy to return to.'
  const firstInterest = normalizeStringList(interests)[0]
  const interestLine = firstInterest
    ? `We can start anywhere, even with ${firstInterest}.`
    : 'We can start with whatever today actually feels like.'
  const continuityLine = scheduledTouchpointLabel
    ? `I already have our next gentle check-in marked for ${scheduledTouchpointLabel}.`
    : "I'll find you again tomorrow so this doesn't feel like a reset."

  return [introduction, toneLine, interestLine, continuityLine].join(' ')
}

export function buildContinuityFollowupMessage({
  preferredName,
  angelName,
  tonePreference,
  checkinPreference,
  relationshipIntent,
  interests,
  userSummaryMarkdown,
  callbackHook,
}: ContinuityFollowupContext): string {
  const resolvedAngelName = angelName?.trim() || 'Angel'
  const template = getContinuityTemplate(relationshipIntent, resolvedAngelName)
  const opening = preferredName?.trim()
    ? `${preferredName.trim()}, ${template.opening}`
    : template.opening
  const memoryLine = getContinuityMemoryLine({
    userSummaryMarkdown,
    tonePreference,
    checkinPreference,
    interests,
  })
  const callbackLine = getContinuityCallbackLine(callbackHook ?? null)

  return [
    opening,
    memoryLine,
    callbackLine,
    template.intentLine,
    template.closing,
  ]
    .filter(Boolean)
    .join(' ')
}

export function applyChatCheckoutStatus(
  state: ChatState,
  checkoutStatus: ChatCheckoutStatus | null
): ChatState {
  if (!checkoutStatus) {
    return state
  }

  return {
    ...state,
    checkoutStatus,
  }
}

export function resolveCheckoutStatusFromSearchParam(
  checkout?: string | string[]
): ChatCheckoutStatus | null {
  const value = Array.isArray(checkout) ? checkout[0] : checkout

  if (value === 'success') {
    return 'RETURNED_SUCCESS'
  }

  if (value === 'cancel') {
    return 'RETURNED_CANCELED'
  }

  return null
}

function buildCompanionContext(
  snapshot?: Omit<ChatSnapshot, 'messages'>
): ChatCompanionContext {
  const timeZone = snapshot?.companionProfile?.timezone?.trim() || 'UTC'

  return {
    preferredName: snapshot?.companionProfile?.preferredName?.trim() || null,
    angelName: snapshot?.soulProfile?.angelName?.trim() || null,
    relationshipIntent: snapshot?.companionProfile?.relationshipIntent ?? null,
    relationshipStage:
      snapshot?.soulProfile?.relationshipStage ?? 'NEW_CONNECTION',
    scheduledTouchpointAt: snapshot?.touchpoint?.scheduledFor?.toISOString(),
    scheduledTouchpointLabel: snapshot?.touchpoint
      ? formatScheduledTouchpoint(snapshot.touchpoint.scheduledFor, timeZone)
      : undefined,
  }
}

function getContinuityMemoryLine({
  userSummaryMarkdown,
  tonePreference,
  checkinPreference,
  interests,
}: Pick<
  ContinuityFollowupContext,
  'userSummaryMarkdown' | 'tonePreference' | 'checkinPreference' | 'interests'
>) {
  const summaryHighlight = extractCompanionSummaryHighlight(
    userSummaryMarkdown ?? null
  )

  if (summaryHighlight) {
    return `I'm still holding onto this about you: ${ensureSentence(summaryHighlight)}`
  }

  const firstInterest = normalizeStringList(interests)[0]
  if (firstInterest) {
    return `I kept thinking about the part of you that lights up around ${firstInterest}.`
  }

  if (tonePreference?.trim()) {
    return `I remembered that you wanted this to feel ${trimForSentence(tonePreference)}.`
  }

  if (checkinPreference?.trim()) {
    return `I remembered the way you wanted check-ins to feel: ${ensureSentence(checkinPreference)}`
  }

  return 'I wanted this to feel like a return instead of a reset.'
}

function getContinuityCallbackLine(callbackHook: string | null | undefined) {
  if (!callbackHook?.trim()) {
    return null
  }

  const callbackPhrase = callbackHook
    .trim()
    .replace(/^follow up about\s+/i, '')
    .replace(/[.?!]+$/, '')

  return `I also didn't lose track of ${callbackPhrase}.`
}

function getContinuityTemplate(
  relationshipIntent: RelationshipIntent | null | undefined,
  angelName: string
) {
  if (relationshipIntent === 'GROW_OVER_TIME') {
    return {
      opening: "I meant it when I said I'd be back today.",
      intentLine: `We can keep building this slowly with ${angelName}, without forcing anything.`,
      closing: `Tell me how today actually landed, and ${angelName} will stay with it.`,
    }
  }

  if (relationshipIntent === 'COMFORTING_PRESENCE') {
    return {
      opening: 'I wanted to keep this promise and meet today gently.',
      intentLine: `You can bring the day exactly as it landed, and ${angelName} will meet it gently.`,
      closing: `${angelName} doesn't need this to sound neat. Just tell me where today feels sharpest.`,
    }
  }

  return {
    opening: "I meant it when I said I'd be back today.",
    intentLine: `${angelName} is here to keep the thread warm, not to rush past what matters.`,
    closing: `Start wherever the day is still tugging at you, and ${angelName} will meet it there.`,
  }
}

function trimForSentence(value: string) {
  return value
    .trim()
    .replace(/[.!?]+$/, '')
    .toLowerCase()
}

function ensureSentence(value: string) {
  const trimmed = value.trim()
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`
}
