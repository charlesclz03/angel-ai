import type {
  MemoryType,
  Prisma,
  RelationshipIntent,
  RelationshipStage,
} from '@prisma/client'

import { normalizeStringList } from '@/lib/angel/onboarding-state'
import { prisma } from '@/lib/prisma'

type SummaryReader = Pick<
  Prisma.TransactionClient,
  'companionProfile' | 'soulProfile' | 'memoryEntry'
>

export interface SummaryMemoryEntry {
  memoryType: MemoryType
  summary: string
  confidence: number | null
  isPinned: boolean
  isHidden?: boolean
  createdAt?: Date
  updatedAt?: Date
}

interface CompanionSummarySource {
  preferredName: string | null
  displayName: string | null
  timezone: string | null
  birthDate: Date | null
  birthTime: string | null
  birthPlace: string | null
  tonePreference: string | null
  relationshipIntent: RelationshipIntent | null
  checkinPreference: string | null
  emotionalNeeds: unknown
  boundaries: unknown
  interests: unknown
  mediaPreferences: unknown
  dailyRhythm: unknown
}

interface SoulSummarySource {
  angelName: string | null
  coreTone: string | null
  humorStyle: string | null
  warmthLevel: number
  playfulnessLevel: number
  flirtReadiness: number
  relationshipStage: RelationshipStage
  sharedInterests: unknown
  signaturePhrases: unknown
  voiceStyle: string | null
}

const companionSummarySelect = {
  preferredName: true,
  displayName: true,
  timezone: true,
  birthDate: true,
  birthTime: true,
  birthPlace: true,
  tonePreference: true,
  relationshipIntent: true,
  checkinPreference: true,
  emotionalNeeds: true,
  boundaries: true,
  interests: true,
  mediaPreferences: true,
  dailyRhythm: true,
  summaryMarkdown: true,
} satisfies Prisma.CompanionProfileSelect

const soulSummarySelect = {
  angelName: true,
  coreTone: true,
  humorStyle: true,
  warmthLevel: true,
  playfulnessLevel: true,
  flirtReadiness: true,
  relationshipStage: true,
  sharedInterests: true,
  signaturePhrases: true,
  voiceStyle: true,
  summaryMarkdown: true,
} satisfies Prisma.SoulProfileSelect

const memorySummarySelect = {
  memoryType: true,
  summary: true,
  confidence: true,
  isPinned: true,
  isHidden: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.MemoryEntrySelect

export async function refreshProfileSummariesForUser(userId: string) {
  return prisma.$transaction((tx) => refreshProfileSummariesTx(tx, userId))
}

export async function refreshProfileSummariesTx(
  db: SummaryReader,
  userId: string
) {
  const [companionProfile, soulProfile, memoryEntries] = await Promise.all([
    db.companionProfile.findUnique({
      where: { userId },
      select: companionSummarySelect,
    }),
    db.soulProfile.findUnique({
      where: { userId },
      select: soulSummarySelect,
    }),
    db.memoryEntry.findMany({
      where: { userId },
      select: memorySummarySelect,
    }),
  ])

  const rankedMemory = rankAndDedupeMemoryEntries(memoryEntries)
  let companionUpdated = false
  let soulUpdated = false

  if (companionProfile) {
    const nextCompanionSummary = buildRegeneratedUserSummaryMarkdown(
      companionProfile,
      rankedMemory
    )

    if (nextCompanionSummary !== companionProfile.summaryMarkdown) {
      await db.companionProfile.update({
        where: { userId },
        data: {
          summaryMarkdown: nextCompanionSummary,
        },
      })
      companionUpdated = true
    }
  }

  if (soulProfile) {
    const nextSoulSummary = buildRegeneratedSoulSummaryMarkdown(
      soulProfile,
      rankedMemory
    )

    if (nextSoulSummary !== soulProfile.summaryMarkdown) {
      await db.soulProfile.update({
        where: { userId },
        data: {
          summaryMarkdown: nextSoulSummary,
        },
      })
      soulUpdated = true
    }
  }

  return {
    didRefresh: companionUpdated || soulUpdated,
    companionUpdated,
    soulUpdated,
  }
}

export function normalizeMemorySummary(summary: string): string {
  return summary.trim().replace(/\s+/g, ' ').toLowerCase()
}

export function rankAndDedupeMemoryEntries<T extends SummaryMemoryEntry>(
  entries: T[]
): T[] {
  const rankedEntries = entries
    .filter((entry) => !entry.isHidden)
    .sort((left, right) => {
      if (Number(right.isPinned) !== Number(left.isPinned)) {
        return Number(right.isPinned) - Number(left.isPinned)
      }

      const confidenceDelta = (right.confidence ?? -1) - (left.confidence ?? -1)
      if (confidenceDelta !== 0) {
        return confidenceDelta
      }

      const rightTimestamp =
        (right.updatedAt ?? right.createdAt)?.getTime() ?? 0
      const leftTimestamp = (left.updatedAt ?? left.createdAt)?.getTime() ?? 0

      return rightTimestamp - leftTimestamp
    })

  const seen = new Set<string>()

  return rankedEntries.filter((entry) => {
    const key = `${entry.memoryType}:${normalizeMemorySummary(entry.summary)}`

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

export function buildRegeneratedUserSummaryMarkdown(
  source: CompanionSummarySource,
  entries: SummaryMemoryEntry[]
) {
  const profileFacts = pickMemorySummaries(entries, ['PROFILE_FACT'], 3)
  const emotionalPatterns = pickMemorySummaries(
    entries,
    ['EMOTIONAL_PATTERN'],
    3
  )
  const callbackHooks = pickMemorySummaries(entries, ['CALLBACK_HOOK'], 3)

  const sections = [
    '# user.md',
    ['## Identity', formatList(identityLines(source))].join('\n'),
    [
      '## How They Like To Be Met',
      formatList([
        `Tone preference: ${source.tonePreference?.trim() || 'Still taking shape'}`,
        `Relationship intent: ${formatRelationshipIntent(source.relationshipIntent)}`,
        `Check-in preference: ${source.checkinPreference?.trim() || 'Still taking shape'}`,
      ]),
    ].join('\n'),
    ['## Emotional Needs', formatJsonList(source.emotionalNeeds)].join('\n'),
    ['## Boundaries and Signals', formatJsonList(source.boundaries)].join('\n'),
    [
      '## Interests and Media',
      ['### Interests', formatJsonList(source.interests)].join('\n'),
      ['### Media Preferences', formatJsonList(source.mediaPreferences)].join(
        '\n'
      ),
      ['### Daily Rhythm', formatJsonList(source.dailyRhythm)].join('\n'),
    ].join('\n\n'),
    buildMemorySection('## High-Signal Memory', [
      ['### Profile Facts', profileFacts],
      ['### Emotional Patterns', emotionalPatterns],
      ['### Callback Hooks', callbackHooks],
    ]),
  ].filter(Boolean)

  return sections.join('\n\n')
}

export function buildRegeneratedSoulSummaryMarkdown(
  source: SoulSummarySource,
  entries: SummaryMemoryEntry[]
) {
  const callbackHooks = pickMemorySummaries(entries, ['CALLBACK_HOOK'], 3)
  const sharedReferences = pickMemorySummaries(entries, ['SHARED_REFERENCE'], 3)
  const relationshipMilestones = pickMemorySummaries(
    entries,
    ['RELATIONSHIP_MILESTONE'],
    3
  )

  const sections = [
    '# soul.md',
    [
      '## Identity',
      formatList([
        `Angel name: ${source.angelName?.trim() || 'Angel'}`,
        `Core tone: ${source.coreTone?.trim() || 'Still taking shape'}`,
        `Humor style: ${source.humorStyle?.trim() || 'Still taking shape'}`,
      ]),
    ].join('\n'),
    [
      '## How Angel Shows Up',
      formatList([
        `Warmth level: ${source.warmthLevel}`,
        `Playfulness level: ${source.playfulnessLevel}`,
        `Flirt readiness: ${source.flirtReadiness}`,
      ]),
    ].join('\n'),
    ['## Shared Affinities', formatJsonList(source.sharedInterests)].join('\n'),
    ['## Signature Phrases', formatJsonList(source.signaturePhrases)].join(
      '\n'
    ),
    buildMemorySection('## Continuity Signals', [
      ['### Callback Hooks', callbackHooks],
      ['### Shared References', sharedReferences],
      ['### Relationship Milestones', relationshipMilestones],
    ]),
    [
      '## Relationship Stage',
      formatList([
        `Stage: ${formatRelationshipStage(source.relationshipStage)}`,
      ]),
    ].join('\n'),
    [
      '## Voice',
      formatList([
        `Voice style: ${source.voiceStyle?.trim() || 'Text first, voice to come later'}`,
      ]),
    ].join('\n'),
  ].filter(Boolean)

  return sections.join('\n\n')
}

export function extractCompanionSummaryHighlight(
  summaryMarkdown: string | null
) {
  return (
    extractSectionBullets(summaryMarkdown, '### Emotional Patterns')[0] ??
    extractSectionBullets(summaryMarkdown, '### Profile Facts')[0] ??
    extractSectionBullets(summaryMarkdown, '### Callback Hooks')[0] ??
    null
  )
}

function pickMemorySummaries(
  entries: SummaryMemoryEntry[],
  memoryTypes: MemoryType[],
  limit: number
) {
  return rankAndDedupeMemoryEntries(entries)
    .filter((entry) => memoryTypes.includes(entry.memoryType))
    .slice(0, limit)
    .map((entry) => entry.summary.trim())
}

function buildMemorySection(
  heading: string,
  groups: Array<[string, string[]]>
) {
  const populatedGroups = groups
    .filter(([, items]) => items.length > 0)
    .map(([title, items]) => [title, formatList(items)].join('\n'))

  if (populatedGroups.length === 0) {
    return ''
  }

  return [heading, ...populatedGroups].join('\n\n')
}

function identityLines(source: CompanionSummarySource) {
  return [
    `Preferred name: ${source.preferredName?.trim() || 'Not shared yet'}`,
    `Display name: ${source.displayName?.trim() || source.preferredName?.trim() || 'Not shared yet'}`,
    `Timezone: ${source.timezone?.trim() || 'UTC'}`,
    `Birth date: ${source.birthDate ? source.birthDate.toISOString().slice(0, 10) : 'Not shared yet'}`,
    `Birth time: ${source.birthTime?.trim() || 'Optional / not shared'}`,
    `Birth place: ${source.birthPlace?.trim() || 'Optional / not shared'}`,
  ]
}

function formatJsonList(value: unknown) {
  const items = normalizeStringList(value)
  return formatList(items.length > 0 ? items : ['None yet'])
}

function formatList(items: string[]) {
  return items.map((item) => `- ${item}`).join('\n')
}

function formatRelationshipIntent(value: RelationshipIntent | null) {
  if (value === 'GROW_OVER_TIME') {
    return 'Starts as a friend and can grow naturally'
  }

  if (value === 'COMFORTING_PRESENCE') {
    return 'Comforting presence'
  }

  return 'Friend first'
}

function formatRelationshipStage(value: RelationshipStage) {
  switch (value) {
    case 'NEW_CONNECTION':
      return 'New connection'
    case 'WARM_FRIEND':
      return 'Warm friend'
    case 'TRUSTED_COMPANION':
      return 'Trusted companion'
    case 'TENDER_AMBIGUITY':
      return 'Tender ambiguity'
    case 'SOFT_ROMANCE':
      return 'Soft romance'
  }
}

function extractSectionBullets(markdown: string | null, heading: string) {
  if (!markdown) {
    return []
  }

  const lines = markdown.split('\n')
  const startIndex = lines.findIndex((line) => line.trim() === heading)

  if (startIndex === -1) {
    return []
  }

  const bullets: string[] = []

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index]?.trim() ?? ''

    if (line.startsWith('#')) {
      break
    }

    if (line.startsWith('- ')) {
      const bullet = line.slice(2).trim()

      if (
        bullet &&
        bullet.toLowerCase() !== 'none yet' &&
        bullet.toLowerCase() !== 'not shared yet'
      ) {
        bullets.push(bullet)
      }
    }
  }

  return bullets
}
