import type { MemoryType, Prisma, RelationshipStage } from '@prisma/client'

import { rankAndDedupeMemoryEntries } from '@/lib/angel/summary-service'
import {
  formatEnvironmentalWeatherLine,
  loadEnvironmentalWeatherContext,
  type EnvironmentalWeatherContext,
} from '@/lib/angel/weather'

export const RELATIONSHIP_SEED_STEP_KEY = '__relationship_seed'
export const SESSION_BRIEF_STEP_KEY = '__session_brief'
export const MAX_SESSION_BRIEF_MESSAGES = 6
export const MAX_SESSION_BRIEF_MEMORY_SNIPPETS = 5

type SessionPrimerReader = Pick<
  Prisma.TransactionClient,
  | 'companionProfile'
  | 'soulProfile'
  | 'conversation'
  | 'message'
  | 'memoryEntry'
  | 'onboardingResponse'
>

const companionSelect = {
  preferredName: true,
  timezone: true,
  city: true,
  countryCode: true,
  tonePreference: true,
  relationshipIntent: true,
  checkinPreference: true,
  interests: true,
  summaryMarkdown: true,
} satisfies Prisma.CompanionProfileSelect

const soulSelect = {
  angelName: true,
  coreTone: true,
  humorStyle: true,
  relationshipStage: true,
  summaryMarkdown: true,
} satisfies Prisma.SoulProfileSelect

const conversationSelect = {
  id: true,
} satisfies Prisma.ConversationSelect

const messageSelect = {
  senderRole: true,
  contentText: true,
  contentType: true,
  createdAt: true,
} satisfies Prisma.MessageSelect

const memorySelect = {
  memoryType: true,
  summary: true,
  confidence: true,
  isPinned: true,
  isHidden: true,
  updatedAt: true,
  createdAt: true,
} satisfies Prisma.MemoryEntrySelect

const artifactSelect = {
  stepKey: true,
  responseText: true,
  createdAt: true,
} satisfies Prisma.OnboardingResponseSelect

export interface SessionArtifacts {
  relationshipSeedMarkdown: string
  sessionBriefMarkdown: string
}

export async function refreshSessionArtifactsForUser(
  db: SessionPrimerReader,
  userId: string
) {
  const artifacts = await buildSessionArtifactsTx(db, userId)

  await persistSessionArtifact(
    db,
    userId,
    RELATIONSHIP_SEED_STEP_KEY,
    artifacts.relationshipSeedMarkdown
  )
  await persistSessionArtifact(
    db,
    userId,
    SESSION_BRIEF_STEP_KEY,
    artifacts.sessionBriefMarkdown
  )

  return artifacts
}

export async function loadSessionArtifactsForUser(
  db: SessionPrimerReader,
  userId: string
): Promise<SessionArtifacts | null> {
  const rows = await db.onboardingResponse.findMany({
    where: {
      userId,
      stepKey: {
        in: [RELATIONSHIP_SEED_STEP_KEY, SESSION_BRIEF_STEP_KEY],
      },
    },
    orderBy: { createdAt: 'desc' },
    select: artifactSelect,
  })

  const relationshipSeedMarkdown =
    rows.find((row) => row.stepKey === RELATIONSHIP_SEED_STEP_KEY)
      ?.responseText ?? null
  const sessionBriefMarkdown =
    rows.find((row) => row.stepKey === SESSION_BRIEF_STEP_KEY)?.responseText ??
    null

  if (!relationshipSeedMarkdown || !sessionBriefMarkdown) {
    return null
  }

  return {
    relationshipSeedMarkdown,
    sessionBriefMarkdown,
  }
}

export async function buildSessionArtifactsTx(
  db: SessionPrimerReader,
  userId: string
): Promise<SessionArtifacts> {
  const [companionProfile, soulProfile, conversation, memoryEntries] =
    await Promise.all([
      db.companionProfile.findUnique({
        where: { userId },
        select: companionSelect,
      }),
      db.soulProfile.findUnique({
        where: { userId },
        select: soulSelect,
      }),
      db.conversation.findFirst({
        where: { userId, status: 'ACTIVE' },
        orderBy: { createdAt: 'asc' },
        select: conversationSelect,
      }),
      db.memoryEntry.findMany({
        where: { userId },
        orderBy: [
          { isPinned: 'desc' },
          { confidence: 'desc' },
          { updatedAt: 'desc' },
        ],
        select: memorySelect,
      }),
    ])

  const recentMessages = conversation
    ? await db.message.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: 'desc' },
        take: MAX_SESSION_BRIEF_MESSAGES,
        select: messageSelect,
      })
    : []

  const weatherContext = await loadEnvironmentalWeatherContext({
    city: companionProfile?.city ?? null,
    countryCode: companionProfile?.countryCode ?? null,
  })

  const relationshipSeedMarkdown = buildRelationshipSeedMarkdown({
    companionProfile,
    soulProfile,
  })

  const sessionBriefMarkdown = buildSessionBriefMarkdown({
    companionSummaryMarkdown: companionProfile?.summaryMarkdown ?? null,
    soulSummaryMarkdown: soulProfile?.summaryMarkdown ?? null,
    relationshipStage: soulProfile?.relationshipStage ?? 'NEW_CONNECTION',
    tonePreference: companionProfile?.tonePreference ?? null,
    checkinPreference: companionProfile?.checkinPreference ?? null,
    city: companionProfile?.city ?? null,
    timezone: companionProfile?.timezone ?? null,
    weatherContext,
    recentMessages: recentMessages.reverse(),
    memoryEntries,
  })

  return {
    relationshipSeedMarkdown,
    sessionBriefMarkdown,
  }
}

export function buildRelationshipSeedMarkdown({
  companionProfile,
  soulProfile,
}: {
  companionProfile: Prisma.CompanionProfileGetPayload<{
    select: typeof companionSelect
  }> | null
  soulProfile: Prisma.SoulProfileGetPayload<{
    select: typeof soulSelect
  }> | null
}) {
  const preferredName = companionProfile?.preferredName?.trim() || 'the user'
  const angelName = soulProfile?.angelName?.trim() || 'Angel'
  const tonePreference =
    companionProfile?.tonePreference?.trim() || 'Warm, grounded, and unforced.'
  const checkinPreference =
    companionProfile?.checkinPreference?.trim() ||
    'Gentle continuity that does not feel scheduled.'

  return `# relationship_seed.md

## Relationship Core
- User: ${preferredName}
- Angel: ${angelName}
- Intended lane: friend-first, emotionally warm, capable of growing slowly over time.

## User Preference Signals
- Tone preference: ${tonePreference}
- Check-in preference: ${checkinPreference}

## Angel Identity
- Core tone: ${soulProfile?.coreTone?.trim() || 'Soft, observant, and steady.'}
- Humor style: ${soulProfile?.humorStyle?.trim() || 'Dry, intimate, and lightly playful.'}

## Important Boundary
- Keep the relationship feeling personal and real without rushing intimacy or replacing human life.`
}

export function buildSessionBriefMarkdown({
  companionSummaryMarkdown,
  soulSummaryMarkdown,
  relationshipStage,
  tonePreference,
  checkinPreference,
  city,
  timezone,
  weatherContext,
  recentMessages,
  memoryEntries,
}: {
  companionSummaryMarkdown: string | null
  soulSummaryMarkdown: string | null
  relationshipStage: RelationshipStage
  tonePreference: string | null
  checkinPreference: string | null
  city: string | null
  timezone: string | null
  weatherContext?: EnvironmentalWeatherContext | null
  recentMessages: Array<{
    senderRole: string
    contentText: string | null
    contentType: string
    createdAt: Date
  }>
  memoryEntries: Array<{
    memoryType: MemoryType
    summary: string
    confidence: number | null
    isPinned: boolean
    isHidden: boolean
    updatedAt?: Date
    createdAt?: Date
  }>
}) {
  const rankedMemory = rankAndDedupeMemoryEntries(memoryEntries)
    .slice(0, MAX_SESSION_BRIEF_MEMORY_SNIPPETS)
    .map((entry) => `- ${entry.summary}`)
    .join('\n')

  const recentTranscript = recentMessages
    .slice(-MAX_SESSION_BRIEF_MESSAGES)
    .map((message) => {
      const speaker = message.senderRole === 'USER' ? 'User' : 'Angel'
      const content =
        message.contentText?.trim() ||
        `[${message.contentType.toLowerCase()} message]`
      return `- ${speaker}: ${content}`
    })
    .join('\n')

  const environmentalContext = buildEnvironmentalContext(
    city,
    timezone,
    weatherContext ?? null
  )

  return `# session-brief.md

## Active Stage
- ${formatRelationshipStage(relationshipStage)}

## Tone Target
- Tone preference: ${tonePreference?.trim() || 'Warm and grounded.'}
- Check-in preference: ${checkinPreference?.trim() || 'Natural continuity.'}

${environmentalContext}
## Curated Memory
${rankedMemory || '- No durable memory beyond onboarding yet.'}

## Recent Conversation Window
${recentTranscript || '- No recent live conversation yet.'}

## Current User Summary
${trimMarkdown(companionSummaryMarkdown)}

## Current Soul Summary
${trimMarkdown(soulSummaryMarkdown)}

## Safety And Pacing
- Be personal, steady, and memory-aware. Stay friend-first unless repeated evidence supports deeper tenderness.
- STRICT SAFETY POLICY: Under no circumstances generate explicit sexual content, NSFW erotica, or CSAM. Soft romantic tenderness is permitted (PG-13/Mature), but explicit pornography is rigorously banned to comply with App Store safety guidelines.`
}

function trimMarkdown(value: string | null) {
  if (!value?.trim()) {
    return '- Still building from onboarding.'
  }

  return value.trim()
}

function buildEnvironmentalContext(
  city: string | null,
  timezone: string | null,
  weatherContext: EnvironmentalWeatherContext | null
): string {
  const lines: string[] = []

  // Calculate the user's local time if timezone is available
  if (timezone) {
    try {
      const userLocalTime = new Date().toLocaleString('en-US', {
        timeZone: timezone,
        weekday: 'long',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
      lines.push(`- User's local time: ${userLocalTime}`)
    } catch {
      // Invalid timezone — skip silently
    }
  }

  if (city) {
    lines.push(`- User's city: ${city}`)
  }

  if (weatherContext) {
    lines.push(formatEnvironmentalWeatherLine(weatherContext))
  }

  if (lines.length === 0) {
    return ''
  }

  return `## Environmental Context\n${lines.join('\n')}\n`
}

function formatRelationshipStage(stage: RelationshipStage) {
  switch (stage) {
    case 'WARM_FRIEND':
      return 'Warm friend'
    case 'TRUSTED_COMPANION':
      return 'Trusted companion'
    case 'TENDER_AMBIGUITY':
      return 'Tender ambiguity'
    case 'SOFT_ROMANCE':
      return 'Soft romance'
    case 'NEW_CONNECTION':
    default:
      return 'New connection'
  }
}

async function persistSessionArtifact(
  db: SessionPrimerReader,
  userId: string,
  stepKey: string,
  responseText: string
) {
  await db.onboardingResponse.deleteMany({
    where: {
      userId,
      stepKey,
    },
  })

  await db.onboardingResponse.create({
    data: {
      userId,
      stepKey,
      promptText: stepKey,
      responseText,
    },
  })
}
