import {
  type ContentType,
  type MessageAttachmentType,
  Prisma,
  type MemoryType,
  type MessageSenderRole,
  type PaywallState,
} from '@prisma/client'

import {
  type CompanionProfileSeed,
  type SoulProfileSeed,
  buildSoulMarkdown,
  buildUserMarkdown,
} from '@/lib/angel/memory'

export interface OnboardingAnswerInput {
  stepKey: string
  promptText?: string
  responseText?: string
  responseJson?: Prisma.InputJsonValue
}

export function buildCompanionProfileCreateData(
  userId: string,
  seed: CompanionProfileSeed
): Prisma.CompanionProfileUncheckedCreateInput {
  return {
    userId,
    displayName: seed.displayName,
    preferredName: seed.preferredName,
    timezone: seed.timezone,
    birthDate: seed.birthDate ? new Date(seed.birthDate) : undefined,
    birthTime: seed.birthTime,
    birthPlace: seed.birthPlace,
    tonePreference: seed.tonePreference,
    relationshipIntent: seed.relationshipIntent,
    checkinPreference: seed.checkinPreference,
    emotionalNeeds: seed.emotionalNeeds,
    boundaries: seed.boundaries,
    interests: seed.interests,
    mediaPreferences: seed.mediaPreferences,
    dailyRhythm: seed.dailyRhythm,
    summaryMarkdown: buildUserMarkdown(seed),
  }
}

export function buildSoulProfileCreateData(
  userId: string,
  seed: SoulProfileSeed
): Prisma.SoulProfileUncheckedCreateInput {
  return {
    userId,
    angelName: seed.angelName,
    coreTone: seed.coreTone,
    humorStyle: seed.humorStyle,
    warmthLevel: seed.warmthLevel,
    playfulnessLevel: seed.playfulnessLevel,
    flirtReadiness: seed.flirtReadiness,
    relationshipStage: seed.relationshipStage,
    sharedInterests: seed.sharedInterests,
    signaturePhrases: seed.signaturePhrases,
    voiceStyle: seed.voiceStyle,
    summaryMarkdown: buildSoulMarkdown(seed),
  }
}

export function buildOnboardingResponseCreateManyData(
  userId: string,
  answers: OnboardingAnswerInput[]
): Prisma.OnboardingResponseCreateManyInput[] {
  return answers.map((answer) => ({
    userId,
    stepKey: answer.stepKey,
    promptText: answer.promptText,
    responseText: answer.responseText,
    responseJson: answer.responseJson,
  }))
}

export function buildInitialConversationCreateData(
  userId: string
): Prisma.ConversationUncheckedCreateInput {
  return {
    userId,
    status: 'ACTIVE',
  }
}

interface NextDayTouchpointInput {
  userId: string
  conversationId?: string
  scheduledFor: Date
  sourceContext?: Prisma.InputJsonValue
}

export function buildNextDayTouchpointCreateData({
  userId,
  conversationId,
  scheduledFor,
  sourceContext,
}: NextDayTouchpointInput): Prisma.TouchpointUncheckedCreateInput {
  return {
    userId,
    conversationId,
    type: 'FOLLOWUP',
    status: 'SCHEDULED',
    scheduledFor,
    sourceContext,
  }
}

export function buildTextMessageCreateData(
  conversationId: string,
  senderRole: MessageSenderRole,
  contentText: string,
  paywallState: PaywallState = 'FREE'
): Prisma.MessageUncheckedCreateInput {
  return buildMessageCreateData({
    conversationId,
    senderRole,
    contentText,
    contentType: 'TEXT',
    paywallState,
  })
}

export function buildMessageCreateData({
  conversationId,
  senderRole,
  contentText,
  contentType,
  paywallState = 'FREE',
}: {
  conversationId: string
  senderRole: MessageSenderRole
  contentText: string
  contentType: ContentType
  paywallState?: PaywallState
}): Prisma.MessageUncheckedCreateInput {
  return {
    conversationId,
    senderRole,
    contentText,
    contentType,
    paywallState,
  }
}

interface MessageAttachmentInput {
  type: MessageAttachmentType
  url: string
  mimeType?: string | null
  title?: string | null
  metadata?: Prisma.InputJsonValue
}

export function buildMessageAttachmentCreateManyData(
  messageId: string,
  attachments: MessageAttachmentInput[]
): Prisma.MessageAttachmentCreateManyInput[] {
  return attachments.map((attachment) => ({
    messageId,
    type: attachment.type,
    url: attachment.url,
    mimeType: attachment.mimeType,
    title: attachment.title,
    metadata: attachment.metadata,
  }))
}

interface MemoryEntryInput {
  memoryType: MemoryType
  summary: string
  confidence?: number
  isPinned?: boolean
  isHidden?: boolean
  sourceContext?: Prisma.InputJsonValue
}

export function buildMemoryEntriesCreateManyData(
  userId: string,
  sourceMessageId: string,
  entries: MemoryEntryInput[]
): Prisma.MemoryEntryCreateManyInput[] {
  return entries.map((entry) => ({
    userId,
    sourceMessageId,
    memoryType: entry.memoryType,
    summary: entry.summary,
    confidence: entry.confidence,
    isPinned: entry.isPinned ?? false,
    isHidden: entry.isHidden ?? false,
    sourceContext: entry.sourceContext,
  }))
}
