import { Prisma } from '@prisma/client'

import { isPrivilegedRole } from '@/lib/angel/user-role'
import {
  generateMemorySnapshot,
  PHOTO_MEMORY_LIMITS,
} from '@/lib/media/image-generation'
import { prisma } from '@/lib/prisma'

export type PhotoMemoryUnavailableReason =
  | 'UPGRADE_REQUIRED'
  | 'MISSING_API_KEY'
  | null

export interface PhotoMemoryStatus {
  available: boolean
  remainingThisMonth: number | null
  monthlyLimit: number | null
  unavailableReason: PhotoMemoryUnavailableReason
}

export interface PhotoMemoryResult {
  status: 'created' | 'already-exists'
  remainingThisMonth: number | null
}

type PhotoMemoryQuotaReader = Pick<
  Prisma.TransactionClient,
  'subscription' | 'user' | 'photoMemory'
>

class PhotoMemoryAlreadyExistsError extends Error {
  constructor() {
    super('Photo memory already exists for this message.')
  }
}

export async function generatePhotoMemoryForUser(
  userId: string,
  messageId: string
): Promise<PhotoMemoryResult> {
  const [message, subscription, user, companionProfile, soulProfile] =
    await Promise.all([
      prisma.message.findUnique({
        where: { id: messageId },
        select: {
          id: true,
          contentText: true,
          senderRole: true,
          conversation: {
            select: {
              userId: true,
            },
          },
          photoMemories: {
            select: {
              id: true,
            },
          },
        },
      }),
      prisma.subscription.findUnique({
        where: { userId },
        select: { tier: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      }),
      prisma.companionProfile.findUnique({
        where: { userId },
        select: {
          preferredName: true,
        },
      }),
      prisma.soulProfile.findUnique({
        where: { userId },
        select: {
          angelName: true,
          coreTone: true,
        },
      }),
    ])

  if (!message || message.conversation.userId !== userId) {
    throw new Error('That Angel message is not available in this thread.')
  }

  if (message.senderRole !== 'ANGEL' || !message.contentText?.trim()) {
    throw new Error(
      'Only saved Angel text replies can be turned into photo memories.'
    )
  }

  if (message.photoMemories.length > 0) {
    const status = await resolvePhotoMemoryStatusForUser(userId)
    return {
      status: 'already-exists',
      remainingThisMonth: status.remainingThisMonth,
    }
  }

  const tier = resolvePhotoMemoryTier(subscription?.tier, user?.role)
  const remainingThisMonth = await resolveRemainingPhotoMemoriesThisMonth({
    userId,
    tier,
  })

  if (remainingThisMonth !== null && remainingThisMonth <= 0) {
    throw new Error(
      "This month's memory snapshots are already used up for this tier."
    )
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim()

  if (!apiKey) {
    throw new Error(
      'Memory snapshots need OPENAI_API_KEY before they can be generated.'
    )
  }

  const snapshot = await generateMemorySnapshot({
    userId,
    visualPrompt: buildPhotoMemoryPrompt({
      messageText: message.contentText,
      angelName: soulProfile?.angelName ?? null,
      preferredName: companionProfile?.preferredName ?? null,
      coreTone: soulProfile?.coreTone ?? null,
    }),
  })

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.photoMemory.findUnique({
        where: {
          userId_messageId: {
            userId,
            messageId: message.id,
          },
        },
        select: {
          id: true,
        },
      })

      if (existing) {
        throw new PhotoMemoryAlreadyExistsError()
      }

      const attachment = await tx.messageAttachment.create({
        data: {
          messageId: message.id,
          type: 'IMAGE',
          url: snapshot.url,
          mimeType: resolveImageMimeType(snapshot.url),
          title: 'Memory snapshot',
          metadata: {
            aiGenerated: true,
            generatedKind: 'PHOTO_MEMORY',
            provider: 'openai',
            ...(snapshot.storagePath
              ? { storagePath: snapshot.storagePath }
              : {}),
          } satisfies Prisma.InputJsonValue,
        },
      })

      await tx.photoMemory.create({
        data: {
          userId,
          messageId: message.id,
          attachmentId: attachment.id,
          prompt: snapshot.prompt,
          revisedPrompt: snapshot.revisedPrompt,
        },
      })
    })
  } catch (error) {
    if (error instanceof PhotoMemoryAlreadyExistsError) {
      const status = await resolvePhotoMemoryStatusForUser(userId)
      return {
        status: 'already-exists',
        remainingThisMonth: status.remainingThisMonth,
      }
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const status = await resolvePhotoMemoryStatusForUser(userId)
      return {
        status: 'already-exists',
        remainingThisMonth: status.remainingThisMonth,
      }
    }

    throw error
  }

  return {
    status: 'created',
    remainingThisMonth:
      remainingThisMonth === null ? null : Math.max(remainingThisMonth - 1, 0),
  }
}

export async function resolvePhotoMemoryStatusForUser(
  userId: string,
  db: PhotoMemoryQuotaReader = prisma
): Promise<PhotoMemoryStatus> {
  const [subscription, user] = await Promise.all([
    db.subscription.findUnique({
      where: { userId },
      select: { tier: true },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    }),
  ])

  const tier = resolvePhotoMemoryTier(subscription?.tier, user?.role)
  const monthlyLimit = PHOTO_MEMORY_LIMITS[tier] ?? 0
  const remainingThisMonth = await resolveRemainingPhotoMemoriesThisMonth({
    userId,
    tier,
    db,
  })

  if (monthlyLimit <= 0) {
    return {
      available: false,
      remainingThisMonth,
      monthlyLimit,
      unavailableReason: 'UPGRADE_REQUIRED',
    }
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return {
      available: false,
      remainingThisMonth,
      monthlyLimit,
      unavailableReason: 'MISSING_API_KEY',
    }
  }

  return {
    available: (remainingThisMonth ?? 0) > 0,
    remainingThisMonth,
    monthlyLimit,
    unavailableReason: null,
  }
}

async function resolveRemainingPhotoMemoriesThisMonth({
  userId,
  tier,
  db = prisma,
}: {
  userId: string
  tier: string
  db?: PhotoMemoryQuotaReader
}) {
  const limit = PHOTO_MEMORY_LIMITS[tier.toUpperCase()] ?? 0

  if (limit <= 0) {
    return 0
  }

  const monthStart = new Date()
  monthStart.setUTCDate(1)
  monthStart.setUTCHours(0, 0, 0, 0)

  const usedThisMonth = await db.photoMemory.count({
    where: {
      userId,
      createdAt: {
        gte: monthStart,
      },
    },
  })

  return Math.max(limit - usedThisMonth, 0)
}

function resolvePhotoMemoryTier(
  tier: string | null | undefined,
  role?: string | null
) {
  if (isPrivilegedRole(role)) {
    return 'PRO'
  }

  return tier?.trim().toUpperCase() || 'FREE'
}

function buildPhotoMemoryPrompt({
  messageText,
  angelName,
  preferredName,
  coreTone,
}: {
  messageText: string
  angelName: string | null
  preferredName: string | null
  coreTone: string | null
}) {
  const resolvedAngelName = angelName?.trim() || 'Angel'
  const resolvedPreferredName = preferredName?.trim() || 'the user'
  const tonalLine = coreTone?.trim()
    ? ` Keep the feeling aligned with this tone: ${coreTone.trim()}.`
    : ''

  return `${resolvedAngelName} is sharing an intimate, symbolic memory snapshot inspired by this saved message for ${resolvedPreferredName}: "${messageText.trim().slice(0, 500)}". Show it as a gentle, dreamlike scene with emotional warmth and soft narrative detail, without text or explicit realism.${tonalLine}`
}

function resolveImageMimeType(url: string) {
  const normalizedUrl = url.toLowerCase()

  if (normalizedUrl.endsWith('.jpg') || normalizedUrl.endsWith('.jpeg')) {
    return 'image/jpeg'
  }

  if (normalizedUrl.endsWith('.webp')) {
    return 'image/webp'
  }

  if (normalizedUrl.endsWith('.avif')) {
    return 'image/avif'
  }

  if (normalizedUrl.endsWith('.gif')) {
    return 'image/gif'
  }

  return 'image/png'
}
