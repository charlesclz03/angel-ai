import type { MemoryType, Prisma, RelationshipStage } from '@prisma/client'

import { refreshSessionArtifactsForUser } from '@/lib/angel/session-primer'
import { refreshProfileSummariesTx } from '@/lib/angel/summary-service'
import { prisma } from '@/lib/prisma'

type MemoryReader = Pick<
  Prisma.TransactionClient,
  | 'memoryEntry'
  | 'message'
  | 'soulProfile'
  | 'companionProfile'
  | 'conversation'
  | 'onboardingResponse'
>

export interface ChatMemoryEntryRecord {
  id: string
  memoryType: MemoryType
  summary: string
  confidence: number | null
  isPinned: boolean
  isHidden: boolean
  sourceMessageId: string | null
  sourcePreview: string | null
  createdAt: string
  updatedAt: string
}

export interface RelationshipDossierSection {
  title: string
  items: string[]
}

export interface RelationshipDossier {
  relationshipStage: RelationshipStage
  sections: RelationshipDossierSection[]
}

const memorySelect = {
  id: true,
  memoryType: true,
  summary: true,
  confidence: true,
  isPinned: true,
  isHidden: true,
  sourceMessageId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.MemoryEntrySelect

export async function loadChatMemoryForUser(userId: string) {
  return prisma.$transaction((tx) => loadChatMemoryForUserTx(tx, userId))
}

export async function loadChatMemoryForUserTx(
  db: MemoryReader,
  userId: string
): Promise<{
  memoryEntries: ChatMemoryEntryRecord[]
  relationshipDossier: RelationshipDossier
}> {
  const [memoryEntries, soulProfile, companionProfile] = await Promise.all([
    db.memoryEntry.findMany({
      where: { userId },
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
      select: memorySelect,
    }),
    db.soulProfile.findUnique({
      where: { userId },
      select: {
        relationshipStage: true,
        summaryMarkdown: true,
      },
    }),
    db.companionProfile.findUnique({
      where: { userId },
      select: {
        summaryMarkdown: true,
      },
    }),
  ])

  const sourceMessageIds = memoryEntries
    .map((entry) => entry.sourceMessageId)
    .filter((value): value is string => Boolean(value))

  const sourceMessages = sourceMessageIds.length
    ? await db.message.findMany({
        where: {
          id: {
            in: sourceMessageIds,
          },
        },
        select: {
          id: true,
          contentText: true,
          contentType: true,
        },
      })
    : []

  const sourcePreviewByMessageId = new Map(
    sourceMessages.map((message) => [
      message.id,
      message.contentText?.trim() ||
        `[${message.contentType.toLowerCase()} message]`,
    ])
  )

  return {
    memoryEntries: memoryEntries.map((entry) => ({
      id: entry.id,
      memoryType: entry.memoryType,
      summary: entry.summary,
      confidence: entry.confidence,
      isPinned: entry.isPinned,
      isHidden: entry.isHidden,
      sourceMessageId: entry.sourceMessageId,
      sourcePreview: entry.sourceMessageId
        ? (sourcePreviewByMessageId.get(entry.sourceMessageId) ?? null)
        : null,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    })),
    relationshipDossier: buildRelationshipDossier({
      relationshipStage: soulProfile?.relationshipStage ?? 'NEW_CONNECTION',
      companionSummaryMarkdown: companionProfile?.summaryMarkdown ?? null,
      soulSummaryMarkdown: soulProfile?.summaryMarkdown ?? null,
    }),
  }
}

export async function updateMemoryEntryForUser(
  userId: string,
  memoryEntryId: string,
  input: {
    summary?: string
    isPinned?: boolean
    isHidden?: boolean
  }
) {
  return prisma.$transaction(async (tx) => {
    const memoryEntry = await tx.memoryEntry.findFirst({
      where: {
        id: memoryEntryId,
        userId,
      },
      select: {
        id: true,
      },
    })

    if (!memoryEntry) {
      throw new Error('That memory could not be found for this relationship.')
    }

    await tx.memoryEntry.update({
      where: { id: memoryEntryId },
      data: {
        summary: input.summary?.trim() || undefined,
        isPinned:
          typeof input.isPinned === 'boolean' ? input.isPinned : undefined,
        isHidden:
          typeof input.isHidden === 'boolean' ? input.isHidden : undefined,
      },
    })

    await refreshProfileSummariesTx(tx, userId)
    await refreshSessionArtifactsForUser(tx, userId)

    return loadChatMemoryForUserTx(tx, userId)
  })
}

export async function deleteMemoryEntryForUser(
  userId: string,
  memoryEntryId: string
) {
  return prisma.$transaction(async (tx) => {
    const deleted = await tx.memoryEntry.deleteMany({
      where: {
        id: memoryEntryId,
        userId,
      },
    })

    if (deleted.count === 0) {
      throw new Error(
        'That memory could not be deleted because it no longer exists.'
      )
    }

    await refreshProfileSummariesTx(tx, userId)
    await refreshSessionArtifactsForUser(tx, userId)

    return loadChatMemoryForUserTx(tx, userId)
  })
}

function buildRelationshipDossier({
  relationshipStage,
  companionSummaryMarkdown,
  soulSummaryMarkdown,
}: {
  relationshipStage: RelationshipStage
  companionSummaryMarkdown: string | null
  soulSummaryMarkdown: string | null
}): RelationshipDossier {
  return {
    relationshipStage,
    sections: [
      {
        title: 'User portrait',
        items: extractBullets(companionSummaryMarkdown).slice(0, 5),
      },
      {
        title: 'Angel with this user',
        items: extractBullets(soulSummaryMarkdown).slice(0, 5),
      },
    ].filter((section) => section.items.length > 0),
  }
}

function extractBullets(markdown: string | null) {
  if (!markdown) {
    return []
  }

  return markdown
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).trim())
}
