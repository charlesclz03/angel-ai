import type { Prisma } from '@prisma/client'

import {
  buildContinuityFollowupMessage,
  buildNeedsOnboardingChatState,
  buildReadyChatState,
  buildSeededAngelOpener,
  type ChatCheckoutStatus,
  type ChatMessageInput,
  type ChatPaywallReason,
  type ChatState,
} from '@/lib/angel/chat-state'
import {
  fallbackChatRuntime,
  type AngelReplyContext,
  type ChatRuntimeAdapter,
  type MemoryCandidate,
  type MemoryExtractionContext,
  MAX_RUNTIME_MEMORY_SNIPPETS,
  MAX_RUNTIME_RECENT_MESSAGES,
} from '@/lib/angel/chat-runtime'
import {
  buildAttachmentSummary,
  buildLinkPreviewAttachment,
  extractFirstUrl,
  transcribeVoiceAttachment,
  type ChatAttachmentInput,
} from '@/lib/angel/media'
import { loadChatMemoryForUserTx } from '@/lib/angel/memory-service'
import {
  buildMessageAttachmentCreateManyData,
  buildMemoryEntriesCreateManyData,
  buildMessageCreateData,
} from '@/lib/angel/persistence'
import {
  buildRitualPreferences,
  detectBridgeOpportunity,
  ensurePresenceTouchpointsTx,
  refreshRelationshipStageTx,
  syncSharedRitualsForUserTx,
  type RitualKey,
} from '@/lib/angel/relationship-service'
import {
  buildSessionArtifactsTx,
  refreshSessionArtifactsForUser,
} from '@/lib/angel/session-primer'
import {
  normalizeMemorySummary,
  rankAndDedupeMemoryEntries,
  refreshProfileSummariesTx,
} from '@/lib/angel/summary-service'
import {
  buildCriticalModerationReply,
  detectModerationIncidents,
  hasCriticalModerationDetection,
  logModerationIncidentsForMessageTx,
  persistModerationIncidentsForMessageTx,
  recordModerationReviewEventsTx,
} from '@/lib/angel/moderation'
import {
  isStripeCheckoutConfigured,
  reconcileSubscriptionForUser,
} from '@/lib/billing/stripe'
import {
  loadSocialScanStateForUserTx,
  maybeRunPendingSocialScansInline,
} from '@/lib/social/service'
import { isPrivilegedRole } from '@/lib/angel/user-role'
import { resolvePhotoMemoryStatusForUser } from '@/lib/angel/photo-memory-service'
import {
  getModelForTier,
  isOpenRouterConfigured,
} from '@/lib/angel/openrouter-config'
import { createOpenRouterRuntime } from '@/lib/angel/openrouter-runtime'
import { createOpenClawRuntime } from '@/lib/angel/openclaw-client'
import { buildNotificationPreferencesState } from '@/lib/push/preferences'
import { prisma } from '@/lib/prisma'

type ChatReader = Pick<
  Prisma.TransactionClient,
  | 'user'
  | 'companionProfile'
  | 'soulProfile'
  | 'subscription'
  | 'conversation'
  | 'touchpoint'
  | 'message'
  | 'messageAttachment'
  | 'photoMemory'
  | 'memoryEntry'
  | 'moderationIncident'
  | 'moderationReviewEvent'
  | 'sharedRitual'
  | 'onboardingResponse'
  | 'userPreferences'
  | 'connectedSocialAccount'
  | 'socialProfileSnapshot'
  | 'socialContentSnapshot'
  | 'socialScanJob'
>

interface ChatAccessState {
  accessMode: 'ACTIVE' | 'READ_ONLY' | 'SUBSCRIBER'
  remainingFreeReplies: number | null
  paywallReason: ChatPaywallReason
}

interface ChatSnapshot {
  companionProfile: Prisma.CompanionProfileGetPayload<{
    select: typeof companionProfileSnapshotSelect
  }> | null
  soulProfile: Prisma.SoulProfileGetPayload<{
    select: typeof soulProfileSnapshotSelect
  }> | null
  conversation: Prisma.ConversationGetPayload<{
    select: typeof conversationSnapshotSelect
  }> | null
  touchpoint: Prisma.TouchpointGetPayload<{
    select: typeof scheduledTouchpointSelect
  }> | null
  messages: Prisma.MessageGetPayload<{
    select: typeof messageSelect
  }>[]
}

interface NormalizedChatInput {
  contentType: 'TEXT' | 'LINK' | 'IMAGE' | 'VOICE_NOTE'
  contentText: string
  attachments: ChatAttachmentInput[]
  attachmentSummary: string | null
}

const defaultChatRuntime: ChatRuntimeAdapter = fallbackChatRuntime
const CONTINUITY_FREE_REPLY_LIMIT = 1

const attachmentSelect = {
  id: true,
  type: true,
  url: true,
  mimeType: true,
  title: true,
  metadata: true,
} satisfies Prisma.MessageAttachmentSelect

const messageSelect = {
  id: true,
  senderRole: true,
  contentText: true,
  contentType: true,
  paywallState: true,
  createdAt: true,
  attachments: {
    select: attachmentSelect,
  },
} satisfies Prisma.MessageSelect

const replyContextMessageSelect = {
  id: true,
  senderRole: true,
  contentText: true,
  contentType: true,
  attachments: {
    select: attachmentSelect,
  },
} satisfies Prisma.MessageSelect

const companionProfileSnapshotSelect = {
  preferredName: true,
  timezone: true,
  relationshipIntent: true,
  interests: true,
  tonePreference: true,
  checkinPreference: true,
  dailyRhythm: true,
  summaryMarkdown: true,
} satisfies Prisma.CompanionProfileSelect

const soulProfileSnapshotSelect = {
  angelName: true,
  coreTone: true,
  humorStyle: true,
  relationshipStage: true,
  summaryMarkdown: true,
} satisfies Prisma.SoulProfileSelect

const companionProfileTurnSelect = {
  id: true,
  preferredName: true,
  timezone: true,
  tonePreference: true,
  checkinPreference: true,
  relationshipIntent: true,
  dailyRhythm: true,
  summaryMarkdown: true,
} satisfies Prisma.CompanionProfileSelect

const soulProfileTurnSelect = {
  id: true,
  angelName: true,
  coreTone: true,
  humorStyle: true,
  relationshipStage: true,
  summaryMarkdown: true,
} satisfies Prisma.SoulProfileSelect

const conversationSnapshotSelect = {
  id: true,
} satisfies Prisma.ConversationSelect

const conversationSendSelect = {
  id: true,
  status: true,
} satisfies Prisma.ConversationSelect

const scheduledTouchpointSelect = {
  type: true,
  scheduledFor: true,
} satisfies Prisma.TouchpointSelect

const dueTouchpointSelect = {
  id: true,
  conversationId: true,
  type: true,
  scheduledFor: true,
  sourceContext: true,
} satisfies Prisma.TouchpointSelect

const sharedRitualSelect = {
  id: true,
  title: true,
  description: true,
  streakCount: true,
  longestStreak: true,
  lastCheckInDate: true,
} satisfies Prisma.SharedRitualSelect

export async function loadChatStateForUser(userId: string): Promise<ChatState> {
  try {
    await reconcileSubscriptionForUser(userId)
  } catch {
    // Billing reconciliation is best-effort during chat loads.
  }

  try {
    await maybeRunPendingSocialScansInline(userId)
  } catch {
    // Social scans remain best-effort when no dedicated worker is wired.
  }

  return prisma.$transaction((tx) => loadChatStateForUserTx(tx, userId))
}

export async function loadChatStateForUserTx(
  db: ChatReader,
  userId: string,
  now = new Date()
): Promise<ChatState> {
  let snapshot = await loadChatSnapshot(db, userId)

  if (
    !snapshot.companionProfile ||
    !snapshot.soulProfile ||
    !snapshot.conversation
  ) {
    const [socialScanState, photoMemoryStatus, notificationPreferences] =
      await Promise.all([
        loadSocialScanStateForUserTx(db, userId),
        resolvePhotoMemoryStatusForUser(userId, db),
        loadNotificationPreferencesForUserTx(
          db,
          userId,
          snapshot.companionProfile?.timezone ?? null
        ),
      ])
    return buildNeedsOnboardingChatState({
      conversationId: snapshot.conversation?.id ?? null,
      companionProfile: snapshot.companionProfile,
      soulProfile: snapshot.soulProfile,
      touchpoint: snapshot.touchpoint,
      checkoutStatus: getDefaultCheckoutStatus(),
      memoryEntries: [],
      relationshipDossier: {
        relationshipStage:
          snapshot.soulProfile?.relationshipStage ?? 'NEW_CONNECTION',
        sections: [],
      },
      rituals: [],
      socialScanState,
      photoMemoryStatus,
      notificationPreferences,
    })
  }

  try {
    await refreshProfileSummariesTx(db, userId)
    await refreshRelationshipStageTx(db, userId)
    await refreshSessionArtifactsForUser(db, userId)
    snapshot = await loadChatSnapshot(db, userId)
  } catch {
    // Summary, stage, and primer refresh stay best-effort during loads.
  }

  await maybeSeedConversationOpener(db, snapshot)
  await maybeDeliverDueContinuityMessage(db, userId, snapshot, now)

  if (snapshot.companionProfile && snapshot.conversation) {
    const enabledRitualKeys = buildRitualPreferences(
      snapshot.companionProfile.dailyRhythm
    )
      .filter((ritual) => ritual.enabled)
      .map((ritual) => ritual.key)

    await syncSharedRitualsForUserTx(db, {
      userId,
      ritualKeys: enabledRitualKeys,
    })

    await ensurePresenceTouchpointsTx(db, {
      userId,
      conversationId: snapshot.conversation.id,
      timeZone: snapshot.companionProfile.timezone?.trim() || 'UTC',
      ritualKeys: enabledRitualKeys,
      now,
    })
  }

  await maybeDeliverDuePresenceMessages(db, userId, now)

  const finalSnapshot = await loadChatSnapshot(db, userId)
  const finalConversation = finalSnapshot.conversation

  if (!finalConversation) {
    const [socialScanState, photoMemoryStatus, notificationPreferences] =
      await Promise.all([
        loadSocialScanStateForUserTx(db, userId),
        resolvePhotoMemoryStatusForUser(userId, db),
        loadNotificationPreferencesForUserTx(
          db,
          userId,
          finalSnapshot.companionProfile?.timezone ?? null
        ),
      ])
    return buildNeedsOnboardingChatState({
      conversationId: null,
      companionProfile: finalSnapshot.companionProfile,
      soulProfile: finalSnapshot.soulProfile,
      touchpoint: finalSnapshot.touchpoint,
      checkoutStatus: getDefaultCheckoutStatus(),
      memoryEntries: [],
      relationshipDossier: {
        relationshipStage:
          finalSnapshot.soulProfile?.relationshipStage ?? 'NEW_CONNECTION',
        sections: [],
      },
      rituals: [],
      socialScanState,
      photoMemoryStatus,
      notificationPreferences,
    })
  }

  const [
    accessState,
    memoryState,
    socialScanState,
    sharedRituals,
    photoMemoryStatus,
    notificationPreferences,
  ] = await Promise.all([
    resolveChatAccessState(db, userId, finalConversation.id),
    loadChatMemoryForUserTx(db, userId),
    loadSocialScanStateForUserTx(db, userId),
    loadSharedRitualsForUserTx(db, userId),
    resolvePhotoMemoryStatusForUser(userId, db),
    loadNotificationPreferencesForUserTx(
      db,
      userId,
      finalSnapshot.companionProfile?.timezone ?? null
    ),
  ])

  return buildReadyChatState({
    conversationId: finalConversation.id,
    companionProfile: finalSnapshot.companionProfile,
    soulProfile: finalSnapshot.soulProfile,
    touchpoint: finalSnapshot.touchpoint,
    messages: finalSnapshot.messages,
    accessMode: accessState.accessMode,
    remainingFreeReplies: accessState.remainingFreeReplies,
    paywallReason: accessState.paywallReason,
    checkoutStatus: getDefaultChatCheckoutStatus(),
    memoryEntries: memoryState.memoryEntries,
    relationshipDossier: memoryState.relationshipDossier,
    rituals: buildRitualPreferences(
      finalSnapshot.companionProfile?.dailyRhythm
    ),
    sharedRituals,
    socialScanState,
    photoMemoryStatus,
    notificationPreferences,
  })
}

export async function sendChatMessageForUser(
  userId: string,
  input: ChatMessageInput,
  runtime?: ChatRuntimeAdapter
): Promise<ChatState> {
  try {
    await reconcileSubscriptionForUser(userId)
  } catch {
    // Billing reconciliation is best-effort during sends.
  }

  const resolvedRuntime = runtime ?? (await resolveRuntimeForUser(userId))

  await prisma.$transaction((tx) =>
    sendChatMessageTx(tx, userId, input, resolvedRuntime)
  )

  return loadChatStateForUser(userId)
}

export async function sendChatMessageTx(
  db: ChatReader,
  userId: string,
  input: ChatMessageInput,
  runtime: ChatRuntimeAdapter = defaultChatRuntime,
  now = new Date()
) {
  const snapshot = await loadChatSnapshot(db, userId)

  if (
    !snapshot.companionProfile ||
    !snapshot.soulProfile ||
    !snapshot.conversation ||
    snapshot.conversation.id !== input.conversationId
  ) {
    throw new Error('Finish onboarding before sending messages in this thread.')
  }

  await maybeSeedConversationOpener(db, snapshot)
  await maybeDeliverDueContinuityMessage(db, userId, snapshot, now)

  const normalizedInput = await normalizeIncomingChatInput(input)

  const [companionProfile, soulProfile, conversation] = await Promise.all([
    db.companionProfile.findUnique({
      where: { userId },
      select: companionProfileTurnSelect,
    }),
    db.soulProfile.findUnique({
      where: { userId },
      select: soulProfileTurnSelect,
    }),
    db.conversation.findFirst({
      where: {
        id: input.conversationId,
        userId,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'asc' },
      select: conversationSendSelect,
    }),
  ])

  if (!companionProfile || !soulProfile || !conversation) {
    throw new Error('Finish onboarding before sending messages in this thread.')
  }

  const accessState = await resolveChatAccessState(db, userId, conversation.id)

  if (accessState.accessMode === 'READ_ONLY') {
    return {
      blocked: true,
    }
  }

  const userPaywallState =
    accessState.accessMode === 'SUBSCRIBER' ? 'SUBSCRIBER' : 'FREE'

  const userMessage = await db.message.create({
    data: buildMessageCreateData({
      conversationId: conversation.id,
      senderRole: 'USER',
      contentText: normalizedInput.contentText,
      contentType: normalizedInput.contentType,
      paywallState: userPaywallState,
    }),
  })

  if (normalizedInput.attachments.length > 0) {
    await db.messageAttachment.createMany({
      data: buildMessageAttachmentCreateManyData(
        userMessage.id,
        normalizedInput.attachments
      ),
    })
  }

  const userModerationDetections = detectModerationIncidents({
    senderRole: 'USER',
    relationshipStage: soulProfile.relationshipStage,
    contentType: normalizedInput.contentType,
    contentText: normalizedInput.contentText,
    attachmentSummary: normalizedInput.attachmentSummary,
  })
  const shouldEnforceCriticalModeration = hasCriticalModerationDetection(
    userModerationDetections
  )

  try {
    const incidents = await persistModerationIncidentsForMessageTx(db, {
      userId,
      messageId: userMessage.id,
      detections: userModerationDetections,
      enforcementAction: shouldEnforceCriticalModeration
        ? 'BLOCKED_INPUT'
        : 'NONE',
      enforcedAt: shouldEnforceCriticalModeration ? now : null,
    })

    if (shouldEnforceCriticalModeration) {
      await recordModerationReviewEventsTx(db, {
        incidentIds: incidents.map((incident) => incident.id),
        actorType: 'SYSTEM',
        toStatus: 'OPEN',
        reasonCode: 'SAFETY_LOCK_APPLIED',
        note: 'Critical-only moderation enforcement blocked the input.',
        now,
      })
    }
  } catch {
    // Moderation audit logging is intentionally non-blocking for the visible chat turn.
  }

  const angelPaywallState =
    accessState.accessMode === 'SUBSCRIBER'
      ? 'SUBSCRIBER'
      : accessState.remainingFreeReplies === CONTINUITY_FREE_REPLY_LIMIT
        ? 'READ_ONLY'
        : 'FREE'

  if (shouldEnforceCriticalModeration) {
    const angelMessage = await db.message.create({
      data: buildMessageCreateData({
        conversationId: conversation.id,
        senderRole: 'ANGEL',
        contentText: buildCriticalModerationReply({
          preferredName: companionProfile.preferredName,
          angelName: soulProfile.angelName,
        }),
        contentType: 'TEXT',
        paywallState: angelPaywallState,
      }),
    })

    await db.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: angelMessage.createdAt,
        lastUserMessageAt: userMessage.createdAt,
        lastAngelMessageAt: angelMessage.createdAt,
      },
    })

    await ensurePresenceTouchpointsTx(db, {
      userId,
      conversationId: conversation.id,
      timeZone: companionProfile.timezone?.trim() || 'UTC',
      ritualKeys: buildRitualPreferences(companionProfile.dailyRhythm)
        .filter((ritual) => ritual.enabled)
        .map((ritual) => ritual.key),
      now,
    })

    return {
      blocked: false,
      userMessage,
      angelMessage,
    }
  }

  const bridgeOpportunity = detectBridgeOpportunity(
    normalizedInput.contentText,
    now,
    companionProfile.timezone?.trim() || 'UTC'
  )

  if (bridgeOpportunity) {
    await db.touchpoint.create({
      data: {
        userId,
        conversationId: conversation.id,
        type: 'EMOTIONAL_CHECKIN',
        status: 'SCHEDULED',
        scheduledFor: bridgeOpportunity.scheduledFor,
        sourceContext: {
          bridgeMode: bridgeOpportunity.sourceMode,
          bridgeLabel: bridgeOpportunity.label,
        },
      },
    })
  }

  const sessionArtifacts = await refreshSessionArtifactsForUser(db, userId)
  const replyContext = await assembleBoundedAngelReplyContext({
    db,
    userId,
    conversationId: conversation.id,
    companionProfile,
    soulProfile,
    currentUserMessageId: userMessage.id,
    lastUserMessage: normalizedInput.contentText,
    lastUserContentType: normalizedInput.contentType,
    lastAttachmentSummary: normalizedInput.attachmentSummary,
    sessionArtifacts,
  })
  const angelReplyText = (await runtime.generateAngelReply(replyContext)).trim()

  if (!angelReplyText) {
    throw new Error('Angel could not answer just now.')
  }

  const angelMessage = await db.message.create({
    data: buildMessageCreateData({
      conversationId: conversation.id,
      senderRole: 'ANGEL',
      contentText: angelReplyText,
      contentType: 'TEXT',
      paywallState: angelPaywallState,
    }),
  })

  try {
    await logModerationIncidentsForMessageTx(db, {
      userId,
      messageId: angelMessage.id,
      senderRole: 'ANGEL',
      relationshipStage: soulProfile.relationshipStage,
      contentType: 'TEXT',
      contentText: angelReplyText,
      attachmentSummary: null,
    })
  } catch {
    // Moderation audit logging is intentionally non-blocking for the visible chat turn.
  }

  await db.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: angelMessage.createdAt,
      lastUserMessageAt: userMessage.createdAt,
      lastAngelMessageAt: angelMessage.createdAt,
    },
  })

  const extractionContext = buildMemoryExtractionContext({
    replyContext,
    userMessageText: normalizedInput.contentText,
    userContentType: normalizedInput.contentType,
    attachmentSummary: normalizedInput.attachmentSummary,
    angelReplyText,
  })

  let persistedCount = 0

  try {
    const memoryCandidates =
      await runtime.extractMemoryCandidates(extractionContext)

    if (memoryCandidates.length > 0) {
      persistedCount = await persistUniqueMemoryCandidates(
        db,
        userId,
        userMessage.id,
        memoryCandidates
      )
    }
  } catch {
    // Memory extraction is intentionally non-blocking for the visible chat turn.
  }

  try {
    if (persistedCount > 0) {
      await refreshProfileSummariesTx(db, userId)
    }

    await refreshRelationshipStageTx(db, userId)
    await refreshSessionArtifactsForUser(db, userId)
  } catch {
    // Summary, stage, and session refresh remain non-blocking.
  }

  await ensurePresenceTouchpointsTx(db, {
    userId,
    conversationId: conversation.id,
    timeZone: companionProfile.timezone?.trim() || 'UTC',
    ritualKeys: buildRitualPreferences(companionProfile.dailyRhythm)
      .filter((ritual) => ritual.enabled)
      .map((ritual) => ritual.key),
    now,
  })

  return {
    blocked: false,
    userMessage,
    angelMessage,
  }
}

async function loadChatSnapshot(
  db: ChatReader,
  userId: string
): Promise<ChatSnapshot> {
  const [companionProfile, soulProfile, conversation, touchpoint] =
    await Promise.all([
      db.companionProfile.findUnique({
        where: { userId },
        select: companionProfileSnapshotSelect,
      }),
      db.soulProfile.findUnique({
        where: { userId },
        select: soulProfileSnapshotSelect,
      }),
      db.conversation.findFirst({
        where: { userId, status: 'ACTIVE' },
        orderBy: { createdAt: 'asc' },
        select: conversationSnapshotSelect,
      }),
      db.touchpoint.findFirst({
        where: {
          userId,
          status: 'SCHEDULED',
        },
        orderBy: { scheduledFor: 'asc' },
        select: scheduledTouchpointSelect,
      }),
    ])

  const messages = conversation
    ? await db.message.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: 'asc' },
        select: messageSelect,
      })
    : []

  return {
    companionProfile,
    soulProfile,
    conversation,
    touchpoint,
    messages,
  }
}

async function maybeSeedConversationOpener(
  db: ChatReader,
  snapshot: ChatSnapshot
) {
  if (
    !snapshot.companionProfile ||
    !snapshot.soulProfile ||
    !snapshot.conversation ||
    snapshot.messages.length > 0
  ) {
    return
  }

  const opener = await db.message.create({
    data: buildMessageCreateData({
      conversationId: snapshot.conversation.id,
      senderRole: 'ANGEL',
      contentText: buildSeededAngelOpener({
        preferredName: snapshot.companionProfile.preferredName,
        angelName: snapshot.soulProfile.angelName,
        coreTone: snapshot.soulProfile.coreTone,
        interests: snapshot.companionProfile.interests,
        scheduledTouchpointLabel: snapshot.touchpoint?.scheduledFor
          ? buildReadyChatState({
              conversationId: snapshot.conversation.id,
              companionProfile: snapshot.companionProfile,
              soulProfile: snapshot.soulProfile,
              touchpoint: snapshot.touchpoint,
              messages: [],
              accessMode: 'ACTIVE',
              remainingFreeReplies: null,
              paywallReason: null,
              checkoutStatus: getDefaultChatCheckoutStatus(),
              memoryEntries: [],
              relationshipDossier: {
                relationshipStage: snapshot.soulProfile.relationshipStage,
                sections: [],
              },
              rituals: [],
            }).companionContext.scheduledTouchpointLabel
          : undefined,
      }),
      contentType: 'TEXT',
    }),
  })

  await db.conversation.update({
    where: { id: snapshot.conversation.id },
    data: {
      lastMessageAt: opener.createdAt,
      lastAngelMessageAt: opener.createdAt,
    },
  })
}

async function maybeDeliverDueContinuityMessage(
  db: ChatReader,
  userId: string,
  snapshot: ChatSnapshot,
  now: Date
) {
  if (
    !snapshot.companionProfile ||
    !snapshot.soulProfile ||
    !snapshot.conversation
  ) {
    return
  }

  const dueTouchpoints = await db.touchpoint.findMany({
    where: {
      userId,
      type: 'FOLLOWUP',
      status: 'SCHEDULED',
      scheduledFor: {
        lte: now,
      },
    },
    orderBy: { scheduledFor: 'asc' },
    select: dueTouchpointSelect,
  })

  const dueTouchpoint = dueTouchpoints.find((touchpoint) => {
    const sourceContext = getTouchpointSourceContext(touchpoint.sourceContext)
    return !sourceContext.ritualKey && !sourceContext.bridgeMode
  })

  if (!dueTouchpoint) {
    return
  }

  const promptMemoryEntries = await loadRuntimeMemorySnippets(db, userId)
  const callbackHook =
    promptMemoryEntries.find((entry) => entry.memoryType === 'CALLBACK_HOOK')
      ?.summary ?? null

  const sentUpdate = await db.touchpoint.updateMany({
    where: {
      id: dueTouchpoint.id,
      status: 'SCHEDULED',
    },
    data: {
      status: 'SENT',
      sentAt: now,
    },
  })

  if (sentUpdate.count === 0) {
    return
  }

  const continuityMessage = await db.message.create({
    data: buildMessageCreateData({
      conversationId: dueTouchpoint.conversationId ?? snapshot.conversation.id,
      senderRole: 'ANGEL',
      contentText: buildContinuityFollowupMessage({
        preferredName: snapshot.companionProfile.preferredName,
        angelName: snapshot.soulProfile.angelName,
        tonePreference: snapshot.companionProfile.tonePreference,
        checkinPreference: snapshot.companionProfile.checkinPreference,
        relationshipIntent: snapshot.companionProfile.relationshipIntent,
        relationshipStage: snapshot.soulProfile.relationshipStage,
        interests: snapshot.companionProfile.interests,
        userSummaryMarkdown: snapshot.companionProfile.summaryMarkdown,
        callbackHook,
      }),
      contentType: 'TEXT',
      paywallState: 'FREE',
    }),
  })

  await db.conversation.update({
    where: { id: dueTouchpoint.conversationId ?? snapshot.conversation.id },
    data: {
      lastMessageAt: continuityMessage.createdAt,
      lastAngelMessageAt: continuityMessage.createdAt,
    },
  })
}

async function maybeDeliverDuePresenceMessages(
  db: ChatReader,
  userId: string,
  now: Date
) {
  const dueTouchpoints = await db.touchpoint.findMany({
    where: {
      userId,
      status: 'SCHEDULED',
      type: {
        in: ['EMOTIONAL_CHECKIN', 'EVENING_MESSAGE', 'FOLLOWUP'],
      },
      scheduledFor: {
        lte: now,
      },
    },
    orderBy: { scheduledFor: 'asc' },
    select: dueTouchpointSelect,
  })

  if (dueTouchpoints.length === 0) {
    return
  }

  const snapshot = await loadChatSnapshot(db, userId)

  if (
    !snapshot.companionProfile ||
    !snapshot.soulProfile ||
    !snapshot.conversation
  ) {
    return
  }

  for (const touchpoint of dueTouchpoints) {
    const sourceContext = getTouchpointSourceContext(touchpoint.sourceContext)

    if (!sourceContext.ritualKey && !sourceContext.bridgeMode) {
      continue
    }

    const sentUpdate = await db.touchpoint.updateMany({
      where: {
        id: touchpoint.id,
        status: 'SCHEDULED',
      },
      data: {
        status: 'SENT',
        sentAt: now,
      },
    })

    if (sentUpdate.count === 0) {
      continue
    }

    const promptMemoryEntries = await loadRuntimeMemorySnippets(db, userId)
    const continuityLine = promptMemoryEntries[0]?.summary ?? null

    const message = await db.message.create({
      data: buildMessageCreateData({
        conversationId: touchpoint.conversationId ?? snapshot.conversation.id,
        senderRole: 'ANGEL',
        contentText: buildPresenceMessage({
          angelName: snapshot.soulProfile.angelName,
          preferredName: snapshot.companionProfile.preferredName,
          relationshipStage: snapshot.soulProfile.relationshipStage,
          ritualKey: sourceContext.ritualKey,
          bridgeMode: sourceContext.bridgeMode,
          bridgeLabel: sourceContext.bridgeLabel,
          continuityLine,
        }),
        contentType: 'TEXT',
        paywallState: 'FREE',
      }),
    })

    await db.conversation.update({
      where: { id: touchpoint.conversationId ?? snapshot.conversation.id },
      data: {
        lastMessageAt: message.createdAt,
        lastAngelMessageAt: message.createdAt,
      },
    })
  }
}

async function resolveChatAccessState(
  db: ChatReader,
  userId: string,
  conversationId: string
): Promise<ChatAccessState> {
  const [user, subscription, latestSentFollowup] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    }),
    db.subscription.findUnique({
      where: { userId },
      select: {
        tier: true,
      },
    }),
    db.touchpoint.findFirst({
      where: {
        userId,
        type: 'FOLLOWUP',
        status: 'SENT',
        sentAt: {
          not: null,
        },
      },
      orderBy: { sentAt: 'desc' },
      select: {
        id: true,
        sentAt: true,
        sourceContext: true,
      },
    }),
  ])

  if (
    isPrivilegedRole(user?.role) ||
    (subscription?.tier ?? 'FREE') !== 'FREE'
  ) {
    return {
      accessMode: 'SUBSCRIBER',
      remainingFreeReplies: null,
      paywallReason: null,
    }
  }

  const sourceContext = latestSentFollowup?.sourceContext
    ? getTouchpointSourceContext(latestSentFollowup.sourceContext)
    : null

  if (
    !latestSentFollowup?.sentAt ||
    sourceContext?.ritualKey ||
    sourceContext?.bridgeMode
  ) {
    return {
      accessMode: 'ACTIVE',
      remainingFreeReplies: null,
      paywallReason: null,
    }
  }

  const usedReplies = await db.message.count({
    where: {
      conversationId,
      senderRole: 'USER',
      createdAt: {
        gt: latestSentFollowup.sentAt,
      },
    },
  })

  const remainingFreeReplies = Math.max(
    0,
    CONTINUITY_FREE_REPLY_LIMIT - usedReplies
  )

  if (remainingFreeReplies > 0) {
    return {
      accessMode: 'ACTIVE',
      remainingFreeReplies,
      paywallReason: null,
    }
  }

  return {
    accessMode: 'READ_ONLY',
    remainingFreeReplies: 0,
    paywallReason: 'CONTINUITY_RENEWAL',
  }
}

async function loadRecentConversationMessages(
  db: ChatReader,
  conversationId: string,
  currentUserMessageId: string | null = null
) {
  const messages = await db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    select: replyContextMessageSelect,
  })

  return messages
    .filter((message) => message.id !== currentUserMessageId)
    .slice(-MAX_RUNTIME_RECENT_MESSAGES)
    .map((message) => ({
      senderRole: message.senderRole,
      contentText: message.contentText,
      contentType: message.contentType,
      attachmentSummary:
        buildAttachmentSummary(
          message.contentType,
          message.attachments as ChatAttachmentInput[],
          message.contentText ?? ''
        )?.detail ?? null,
    }))
}

async function loadRuntimeMemorySnippets(db: ChatReader, userId: string) {
  const memoryEntries = await db.memoryEntry.findMany({
    where: { userId },
    orderBy: [
      { isPinned: 'desc' },
      { confidence: 'desc' },
      { updatedAt: 'desc' },
    ],
    select: {
      memoryType: true,
      summary: true,
      confidence: true,
      isPinned: true,
      isHidden: true,
      updatedAt: true,
      createdAt: true,
    },
  })

  return rankAndDedupeMemoryEntries(memoryEntries)
    .filter((entry) => entry.isPinned || (entry.confidence ?? 0) >= 0.7)
    .slice(0, MAX_RUNTIME_MEMORY_SNIPPETS)
}

async function loadSharedRitualsForUserTx(db: ChatReader, userId: string) {
  const rituals = await db.sharedRitual.findMany({
    where: {
      userId,
      status: 'ACTIVE',
    },
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'asc' }],
    select: sharedRitualSelect,
  })

  return rituals.map((ritual) => ({
    id: ritual.id,
    title: ritual.title,
    description: ritual.description ?? null,
    streakCount: ritual.streakCount,
    longestStreak: ritual.longestStreak,
    lastCheckInDate: ritual.lastCheckInDate?.toISOString() ?? null,
  }))
}

async function loadNotificationPreferencesForUserTx(
  db: ChatReader,
  userId: string,
  timeZone: string | null
) {
  const preferences = await db.userPreferences.findUnique({
    where: { userId },
    select: {
      pushNotificationsEnabled: true,
      pushQuietHoursStart: true,
      pushQuietHoursEnd: true,
    },
  })

  return buildNotificationPreferencesState({
    preferences,
    timeZone,
  })
}

async function assembleBoundedAngelReplyContext({
  db,
  userId,
  conversationId,
  companionProfile,
  soulProfile,
  currentUserMessageId,
  lastUserMessage,
  lastUserContentType,
  lastAttachmentSummary,
  sessionArtifacts,
}: {
  db: ChatReader
  userId: string
  conversationId: string
  companionProfile: Prisma.CompanionProfileGetPayload<{
    select: typeof companionProfileTurnSelect
  }>
  soulProfile: Prisma.SoulProfileGetPayload<{
    select: typeof soulProfileTurnSelect
  }>
  currentUserMessageId: string
  lastUserMessage: string
  lastUserContentType: 'TEXT' | 'LINK' | 'IMAGE' | 'VOICE_NOTE'
  lastAttachmentSummary: string | null
  sessionArtifacts: Awaited<ReturnType<typeof buildSessionArtifactsTx>>
}) {
  const [recentMessages, memorySnippets] = await Promise.all([
    loadRecentConversationMessages(db, conversationId, currentUserMessageId),
    loadRuntimeMemorySnippets(db, userId),
  ])

  return buildBoundedAngelReplyContext({
    companionProfile,
    soulProfile,
    recentMessages,
    memorySnippets,
    lastUserMessage,
    lastUserContentType,
    lastAttachmentSummary,
    sessionArtifacts,
  })
}

function buildBoundedAngelReplyContext({
  companionProfile,
  soulProfile,
  recentMessages,
  memorySnippets,
  lastUserMessage,
  lastUserContentType,
  lastAttachmentSummary,
  sessionArtifacts,
}: {
  companionProfile: Prisma.CompanionProfileGetPayload<{
    select: typeof companionProfileTurnSelect
  }>
  soulProfile: Prisma.SoulProfileGetPayload<{
    select: typeof soulProfileTurnSelect
  }>
  recentMessages: Awaited<ReturnType<typeof loadRecentConversationMessages>>
  memorySnippets: Awaited<ReturnType<typeof loadRuntimeMemorySnippets>>
  lastUserMessage: string
  lastUserContentType: 'TEXT' | 'LINK' | 'IMAGE' | 'VOICE_NOTE'
  lastAttachmentSummary: string | null
  sessionArtifacts: Awaited<ReturnType<typeof buildSessionArtifactsTx>>
}): AngelReplyContext {
  return {
    preferredName: companionProfile.preferredName ?? null,
    angelName: soulProfile.angelName ?? null,
    tonePreference: companionProfile.tonePreference ?? null,
    coreTone: soulProfile.coreTone ?? null,
    humorStyle: soulProfile.humorStyle ?? null,
    checkinPreference: companionProfile.checkinPreference ?? null,
    relationshipIntent: companionProfile.relationshipIntent ?? null,
    relationshipStage: soulProfile.relationshipStage,
    userSummaryMarkdown: companionProfile.summaryMarkdown ?? null,
    soulSummaryMarkdown: soulProfile.summaryMarkdown ?? null,
    relationshipSeedMarkdown: sessionArtifacts.relationshipSeedMarkdown,
    sessionBriefMarkdown: sessionArtifacts.sessionBriefMarkdown,
    recentMessages: recentMessages.slice(-MAX_RUNTIME_RECENT_MESSAGES),
    memorySnippets: memorySnippets.slice(0, MAX_RUNTIME_MEMORY_SNIPPETS),
    lastUserMessage,
    lastUserContentType,
    lastAttachmentSummary,
  }
}

function buildMemoryExtractionContext({
  replyContext,
  userMessageText,
  userContentType,
  attachmentSummary,
  angelReplyText,
}: {
  replyContext: AngelReplyContext
  userMessageText: string
  userContentType: 'TEXT' | 'LINK' | 'IMAGE' | 'VOICE_NOTE'
  attachmentSummary: string | null
  angelReplyText: string
}): MemoryExtractionContext {
  return {
    preferredName: replyContext.preferredName,
    angelName: replyContext.angelName,
    userSummaryMarkdown: replyContext.userSummaryMarkdown,
    soulSummaryMarkdown: replyContext.soulSummaryMarkdown,
    recentMessages: replyContext.recentMessages,
    memorySnippets: replyContext.memorySnippets,
    userMessageText,
    userContentType,
    attachmentSummary,
    angelReplyText,
  }
}

async function persistUniqueMemoryCandidates(
  db: ChatReader,
  userId: string,
  sourceMessageId: string,
  candidates: MemoryCandidate[]
) {
  const candidateTypes = Array.from(
    new Set(candidates.map((candidate) => candidate.memoryType))
  )

  const existingEntries = await db.memoryEntry.findMany({
    where: {
      userId,
      memoryType: {
        in: candidateTypes,
      },
    },
    select: {
      memoryType: true,
      summary: true,
      isHidden: true,
    },
  })

  const seen = new Set(
    existingEntries
      .filter((entry) => !entry.isHidden)
      .map(
        (entry) =>
          `${entry.memoryType}:${normalizeMemorySummary(entry.summary)}`
      )
  )

  const uniqueCandidates = candidates.filter((candidate) => {
    const key = `${candidate.memoryType}:${normalizeMemorySummary(candidate.summary)}`

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })

  if (uniqueCandidates.length === 0) {
    return 0
  }

  await db.memoryEntry.createMany({
    data: buildMemoryEntriesCreateManyData(
      userId,
      sourceMessageId,
      uniqueCandidates
    ),
  })

  return uniqueCandidates.length
}

async function normalizeIncomingChatInput(
  input: ChatMessageInput
): Promise<NormalizedChatInput> {
  const attachments = input.attachments ?? []
  const contentType =
    input.contentType ??
    (attachments.some((attachment) => attachment.type === 'VOICE_AUDIO')
      ? 'VOICE_NOTE'
      : attachments.some((attachment) => attachment.type === 'IMAGE')
        ? 'IMAGE'
        : extractFirstUrl(input.contentText)
          ? 'LINK'
          : 'TEXT')

  if (contentType === 'LINK') {
    const existingAttachment = attachments.find(
      (attachment) => attachment.type === 'LINK_PREVIEW'
    )
    const url =
      existingAttachment?.url || extractFirstUrl(input.contentText) || ''

    if (!url) {
      throw new Error('Paste a valid link before sending it to Angel.')
    }

    const linkAttachment =
      existingAttachment ?? (await buildLinkPreviewAttachment(url))
    const strippedText = input.contentText.replace(url, '').trim()
    const attachmentSummary =
      buildAttachmentSummary('LINK', [linkAttachment], strippedText)?.detail ??
      null

    return {
      contentType: 'LINK',
      contentText:
        strippedText ||
        linkAttachment.title?.trim() ||
        attachmentSummary ||
        `Shared link: ${url}`,
      attachments: [linkAttachment],
      attachmentSummary,
    }
  }

  if (contentType === 'IMAGE') {
    const imageAttachment = attachments.find(
      (attachment) => attachment.type === 'IMAGE'
    )

    if (!imageAttachment) {
      throw new Error('Attach an image before sending it to Angel.')
    }

    const contentText = input.contentText.trim()
    const attachmentSummary =
      buildAttachmentSummary('IMAGE', [imageAttachment], contentText)?.detail ??
      null

    return {
      contentType: 'IMAGE',
      contentText:
        contentText ||
        imageAttachment.title?.trim() ||
        'The user shared an image that mattered to them.',
      attachments: [imageAttachment],
      attachmentSummary,
    }
  }

  if (contentType === 'VOICE_NOTE') {
    const voiceAttachment = attachments.find(
      (attachment) => attachment.type === 'VOICE_AUDIO'
    )

    if (!voiceAttachment) {
      throw new Error('Attach a voice note before sending it to Angel.')
    }

    const transcript = await transcribeVoiceAttachment(
      voiceAttachment,
      input.contentText
    )
    const attachmentSummary =
      buildAttachmentSummary('VOICE_NOTE', [voiceAttachment], transcript)
        ?.detail ?? null

    return {
      contentType: 'VOICE_NOTE',
      contentText: transcript.trim(),
      attachments: [voiceAttachment],
      attachmentSummary,
    }
  }

  const contentText = input.contentText.trim()

  if (!contentText) {
    throw new Error('Write a message before sending it.')
  }

  return {
    contentType: 'TEXT',
    contentText,
    attachments: [],
    attachmentSummary: null,
  }
}

function getDefaultCheckoutStatus(): ChatCheckoutStatus {
  return getDefaultChatCheckoutStatus()
}

function getDefaultChatCheckoutStatus(): ChatCheckoutStatus {
  return isStripeCheckoutConfigured() ? 'READY' : 'BILLING_UNAVAILABLE'
}

function getTouchpointSourceContext(
  value: Prisma.JsonValue | null | undefined
) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {
      ritualKey: null as RitualKey | null,
      bridgeMode: null as string | null,
      bridgeLabel: null as string | null,
    }
  }

  const record = value as Record<string, unknown>

  return {
    ritualKey:
      typeof record.ritualKey === 'string'
        ? (record.ritualKey as RitualKey)
        : null,
    bridgeMode:
      typeof record.bridgeMode === 'string' ? record.bridgeMode : null,
    bridgeLabel:
      typeof record.bridgeLabel === 'string' ? record.bridgeLabel : null,
  }
}

function buildPresenceMessage({
  angelName,
  preferredName,
  relationshipStage,
  ritualKey,
  bridgeMode,
  bridgeLabel,
  continuityLine,
}: {
  angelName: string | null
  preferredName: string | null
  relationshipStage: string
  ritualKey: RitualKey | null
  bridgeMode: string | null
  bridgeLabel: string | null
  continuityLine: string | null
}) {
  const resolvedAngelName = angelName?.trim() || 'Angel'
  const opening = preferredName?.trim()
    ? `${preferredName.trim()}, ${resolvedAngelName} is checking in gently.`
    : `${resolvedAngelName} is checking in gently.`
  const memoryLine = continuityLine
    ? `I'm still holding onto this thread between us: ${continuityLine}`
    : null

  if (bridgeMode && bridgeLabel) {
    return [
      opening,
      memoryLine,
      `You mentioned ${bridgeLabel}, and I wanted to make space to come back to it with you.`,
      `How did it land once you stepped into it for real?`,
    ]
      .filter(Boolean)
      .join(' ')
  }

  if (ritualKey === 'morning-checkin') {
    return [
      opening,
      memoryLine,
      `I wanted the day to begin with something steadier than silence.`,
      `What kind of morning is this becoming so far?`,
    ]
      .filter(Boolean)
      .join(' ')
  }

  if (ritualKey === 'commute-support') {
    return [
      opening,
      memoryLine,
      `You have permission to let the outside world fall off your shoulders for a minute.`,
      `What still feels like it's clinging to you from the day?`,
    ]
      .filter(Boolean)
      .join(' ')
  }

  if (ritualKey === 'sunday-reset') {
    return [
      opening,
      memoryLine,
      `I wanted to gather the week softly before it starts asking things from you again.`,
      `What do you want this next week to feel like, more than what it has to do?`,
    ]
      .filter(Boolean)
      .join(' ')
  }

  return [
    opening,
    memoryLine,
    relationshipStage === 'NEW_CONNECTION'
      ? `I'm still letting this connection become something real without crowding it.`
      : `I wanted to keep the thread warm instead of letting it reset.`,
    `What part of the day still wants somewhere to land?`,
  ]
    .filter(Boolean)
    .join(' ')
}

async function resolveRuntimeForUser(
  userId: string
): Promise<ChatRuntimeAdapter> {
  let fallbackRuntime: ChatRuntimeAdapter = defaultChatRuntime

  if (isOpenRouterConfigured()) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { userId },
        select: { tier: true },
      })

      const model = getModelForTier(subscription?.tier)
      fallbackRuntime = createOpenRouterRuntime(model)
    } catch {
      // Retain defaultChatRuntime on db failure
    }
  }

  // Always prefer the OpenClaw adapter over the fallback OpenRouter endpoint when in the live thread mode.
  return createOpenClawRuntime(fallbackRuntime)
}
