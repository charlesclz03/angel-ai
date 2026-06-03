import type { Prisma } from '@prisma/client'

import {
  buildCompanionProfileCreateData,
  buildInitialConversationCreateData,
  buildNextDayTouchpointCreateData,
  buildOnboardingResponseCreateManyData,
  buildSoulProfileCreateData,
} from '@/lib/angel/persistence'
import {
  buildLoadedOnboardingState,
  buildOnboardingAnswersFromDraft,
  buildProfileSeedsFromDraft,
  getLocalDayUtcRange,
  normalizeOnboardingDraftInput,
  scheduleNextDayTouchpoint,
  type OnboardingDraft,
  type OnboardingState,
  type OnboardingStepInput,
} from '@/lib/angel/onboarding-state'
import { refreshSessionArtifactsForUser } from '@/lib/angel/session-primer'
import {
  enqueueInitialSocialScans,
  loadSocialScanStateForUserTx,
} from '@/lib/social/service'
import { prisma } from '@/lib/prisma'

type OnboardingReader = Pick<
  Prisma.TransactionClient,
  | 'onboardingResponse'
  | 'companionProfile'
  | 'soulProfile'
  | 'conversation'
  | 'touchpoint'
  | 'message'
  | 'memoryEntry'
  | 'connectedSocialAccount'
  | 'socialProfileSnapshot'
  | 'socialContentSnapshot'
>

interface OnboardingUserContext {
  id: string
  name?: string | null
}

export async function loadOnboardingStateForUser(
  user: OnboardingUserContext,
  db: OnboardingReader = prisma
): Promise<OnboardingState> {
  const [
    responses,
    companionProfile,
    soulProfile,
    conversation,
    touchpoint,
    socialScanState,
  ] = await Promise.all([
    db.onboardingResponse.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    }),
    db.companionProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    }),
    db.soulProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    }),
    db.conversation.findFirst({
      where: { userId: user.id, status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    }),
    db.touchpoint.findFirst({
      where: { userId: user.id, type: 'FOLLOWUP' },
      orderBy: { scheduledFor: 'asc' },
      select: { id: true, scheduledFor: true },
    }),
    loadSocialScanStateForUserTx(db, user.id),
  ])

  return buildLoadedOnboardingState({
    responses,
    companionProfile,
    soulProfile,
    conversation,
    touchpoint,
    userName: user.name,
    socialScanState,
  })
}

export async function persistOnboardingStep(
  userId: string,
  input: OnboardingStepInput
): Promise<void> {
  await prisma.$transaction((tx) => persistOnboardingStepTx(tx, userId, input))
}

export async function persistOnboardingStepTx(
  tx: Pick<Prisma.TransactionClient, 'onboardingResponse'>,
  userId: string,
  input: OnboardingStepInput
) {
  await tx.onboardingResponse.deleteMany({
    where: {
      userId,
      stepKey: input.stepKey,
    },
  })

  return tx.onboardingResponse.create({
    data: {
      userId,
      stepKey: input.stepKey,
      promptText: input.promptText,
      responseText: input.responseText,
      responseJson: input.responseJson,
    },
  })
}

export async function completeOnboardingForUser(
  user: OnboardingUserContext,
  draftInput: OnboardingDraft,
  completedAt = new Date()
) {
  const draft = normalizeOnboardingDraftInput(draftInput)

  const result = await prisma.$transaction((tx) =>
    completeOnboardingTx(tx, user, draft, completedAt)
  )

  void enqueueInitialSocialScans(user.id)

  return result
}

export async function completeOnboardingTx(
  tx: OnboardingReader,
  user: OnboardingUserContext,
  draftInput: OnboardingDraft,
  completedAt: Date
) {
  const draft = normalizeOnboardingDraftInput(draftInput)
  const answers = buildOnboardingAnswersFromDraft(draft)
  const answerCreateData = buildOnboardingResponseCreateManyData(
    user.id,
    answers.map((answer) => ({
      stepKey: answer.stepKey,
      promptText: answer.promptText,
      responseText: answer.responseText,
      responseJson: answer.responseJson,
    }))
  )
  const { companionSeed, soulSeed } = buildProfileSeedsFromDraft(draft, {
    userName: user.name,
  })
  const companionCreateData = buildCompanionProfileCreateData(
    user.id,
    companionSeed
  )
  const soulCreateData = buildSoulProfileCreateData(user.id, soulSeed)
  const { userId: _companionUserId, ...companionUpdateData } =
    companionCreateData
  const { userId: _soulUserId, ...soulUpdateData } = soulCreateData

  await tx.onboardingResponse.deleteMany({
    where: {
      userId: user.id,
      stepKey: {
        in: answers.map((answer) => answer.stepKey),
      },
    },
  })

  if (answerCreateData.length > 0) {
    await tx.onboardingResponse.createMany({
      data: answerCreateData,
    })
  }

  await tx.companionProfile.upsert({
    where: { userId: user.id },
    create: companionCreateData,
    update: companionUpdateData,
  })

  await tx.soulProfile.upsert({
    where: { userId: user.id },
    create: soulCreateData,
    update: soulUpdateData,
  })

  let conversation = await tx.conversation.findFirst({
    where: {
      userId: user.id,
      status: 'ACTIVE',
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  if (!conversation) {
    conversation = await tx.conversation.create({
      data: buildInitialConversationCreateData(user.id),
    })
  }

  const scheduledFor = scheduleNextDayTouchpoint(completedAt, draft.timezone)
  const scheduledRange = getLocalDayUtcRange(scheduledFor, draft.timezone)
  let touchpoint = await tx.touchpoint.findFirst({
    where: {
      userId: user.id,
      conversationId: conversation.id,
      type: 'FOLLOWUP',
      scheduledFor: {
        gte: scheduledRange.start,
        lt: scheduledRange.end,
      },
    },
  })

  if (!touchpoint) {
    touchpoint = await tx.touchpoint.create({
      data: buildNextDayTouchpointCreateData({
        userId: user.id,
        conversationId: conversation.id,
        scheduledFor,
        sourceContext: {
          checkinPreference: draft.checkinPreference,
          preferredName: draft.preferredName,
          relationshipIntent: draft.relationshipIntent,
        },
      }),
    })
  }

  await refreshSessionArtifactsForUser(tx, user.id)

  return {
    conversationId: conversation.id,
    touchpointId: touchpoint.id,
    scheduledFor: touchpoint.scheduledFor,
  }
}
