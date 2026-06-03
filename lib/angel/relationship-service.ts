import type {
  Prisma,
  RelationshipIntent,
  RelationshipStage,
  TouchpointType,
} from '@prisma/client'

import { refreshSessionArtifactsForUser } from '@/lib/angel/session-primer'
import { refreshProfileSummariesTx } from '@/lib/angel/summary-service'
import { prisma } from '@/lib/prisma'

type RelationshipReader = Pick<
  Prisma.TransactionClient,
  | 'companionProfile'
  | 'soulProfile'
  | 'message'
  | 'memoryEntry'
  | 'sharedRitual'
  | 'touchpoint'
  | 'conversation'
  | 'onboardingResponse'
>

export interface RitualPreference {
  key: RitualKey
  label: string
  description: string
  enabled: boolean
}

export type RitualKey =
  | 'morning-checkin'
  | 'commute-support'
  | 'evening-wind-down'
  | 'sunday-reset'

export interface BridgeOpportunity {
  label: string
  sourceMode:
    | 'come-back-after'
    | 'post-event-debrief'
    | 'social-courage'
    | 'habit-companionship'
  scheduledFor: Date
}

const ritualDefinitions: Array<{
  key: RitualKey
  label: string
  description: string
  type: TouchpointType
  hour: number
  weekday?: number
}> = [
  {
    key: 'morning-checkin',
    label: 'Morning check-in',
    description: 'A softer start that notices how the day is opening.',
    type: 'EMOTIONAL_CHECKIN',
    hour: 9,
  },
  {
    key: 'commute-support',
    label: 'Commute support',
    description: 'A late-day touchpoint for the return from the outside world.',
    type: 'EMOTIONAL_CHECKIN',
    hour: 17,
  },
  {
    key: 'evening-wind-down',
    label: 'Evening wind-down',
    description: 'A slower thread for whatever the day leaves behind.',
    type: 'EVENING_MESSAGE',
    hour: 21,
  },
  {
    key: 'sunday-reset',
    label: 'Sunday reset',
    description: 'A weekly reset to gather the next week gently.',
    type: 'EMOTIONAL_CHECKIN',
    hour: 11,
    weekday: 0,
  },
]

const sharedRitualTemplates: Record<
  RitualKey,
  {
    title: string
    description: string
  }
> = {
  'morning-checkin': {
    title: 'Morning grounding',
    description:
      'A shared start-of-day ritual for noticing how the morning is opening.',
  },
  'commute-support': {
    title: 'Soft landing',
    description:
      'A daily return ritual for letting the outside world fall off your shoulders.',
  },
  'evening-wind-down': {
    title: 'Evening exhale',
    description:
      'A slower night ritual for closing the day without forcing yourself to be okay first.',
  },
  'sunday-reset': {
    title: 'Sunday reset',
    description:
      'A weekly ritual for gathering the next week gently instead of bracing for it.',
  },
}

export async function refreshRelationshipStageTx(
  db: RelationshipReader,
  userId: string
) {
  const [companionProfile, soulProfile, messages, memoryEntries] =
    await Promise.all([
      db.companionProfile.findUnique({
        where: { userId },
        select: {
          relationshipIntent: true,
        },
      }),
      db.soulProfile.findUnique({
        where: { userId },
        select: {
          relationshipStage: true,
        },
      }),
      db.message.findMany({
        where: {
          conversation: {
            userId,
          },
          moderationIncidents: {
            none: {
              enforcementAction: 'BLOCKED_INPUT',
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        select: {
          senderRole: true,
          contentText: true,
        },
      }),
      db.memoryEntry.findMany({
        where: { userId, isHidden: false },
        select: {
          memoryType: true,
          summary: true,
        },
      }),
    ])

  if (!soulProfile) {
    return {
      stage: 'NEW_CONNECTION' as RelationshipStage,
      updated: false,
    }
  }

  const nextStage = deriveRelationshipStage({
    relationshipIntent: companionProfile?.relationshipIntent ?? 'FRIEND',
    currentStage: soulProfile.relationshipStage,
    messages,
    memoryEntries,
  })

  if (nextStage === soulProfile.relationshipStage) {
    return {
      stage: nextStage,
      updated: false,
    }
  }

  await db.soulProfile.update({
    where: { userId },
    data: {
      relationshipStage: nextStage,
    },
  })

  await refreshProfileSummariesTx(db, userId)
  await refreshSessionArtifactsForUser(db, userId)

  return {
    stage: nextStage,
    updated: true,
  }
}

export function buildRitualPreferences(value: unknown): RitualPreference[] {
  const enabledKeys = normalizeRitualKeys(value)

  return ritualDefinitions.map((ritual) => ({
    key: ritual.key,
    label: ritual.label,
    description: ritual.description,
    enabled: enabledKeys.has(ritual.key),
  }))
}

export async function updateRitualPreferencesForUser(
  userId: string,
  ritualKeys: RitualKey[]
) {
  return prisma.$transaction(async (tx) => {
    const companionProfile = await tx.companionProfile.findUnique({
      where: { userId },
      select: {
        userId: true,
        timezone: true,
      },
    })

    if (!companionProfile) {
      throw new Error('Finish onboarding before changing ritual preferences.')
    }

    await tx.companionProfile.update({
      where: { userId },
      data: {
        dailyRhythm: ritualKeys,
      },
    })

    await tx.touchpoint.updateMany({
      where: {
        userId,
        status: 'SCHEDULED',
        type: {
          in: ['EMOTIONAL_CHECKIN', 'EVENING_MESSAGE'],
        },
      },
      data: {
        status: 'CANCELED',
      },
    })

    const conversation = await tx.conversation.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
      },
    })

    if (conversation) {
      await ensurePresenceTouchpointsTx(tx, {
        userId,
        conversationId: conversation.id,
        timeZone: companionProfile.timezone?.trim() || 'UTC',
        ritualKeys,
        now: new Date(),
      })
    }

    await syncSharedRitualsForUserTx(tx, {
      userId,
      ritualKeys,
    })

    await refreshSessionArtifactsForUser(tx, userId)

    return buildRitualPreferences(ritualKeys)
  })
}

export async function syncSharedRitualsForUserTx(
  db: RelationshipReader,
  {
    userId,
    ritualKeys,
  }: {
    userId: string
    ritualKeys: RitualKey[]
  }
) {
  const templates = ritualDefinitions.map((ritual) => ({
    key: ritual.key,
    ...sharedRitualTemplates[ritual.key],
  }))
  const enabledKeys = new Set(ritualKeys)
  const existingRituals = await db.sharedRitual.findMany({
    where: {
      userId,
      title: {
        in: templates.map((template) => template.title),
      },
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      title: true,
      status: true,
    },
  })

  for (const template of templates) {
    const matchingRituals = existingRituals.filter(
      (ritual) => ritual.title === template.title
    )
    const activeRitual = matchingRituals.find(
      (ritual) => ritual.status === 'ACTIVE'
    )
    const inactiveRitual = matchingRituals.find(
      (ritual) => ritual.status !== 'ACTIVE'
    )

    if (enabledKeys.has(template.key)) {
      if (activeRitual) {
        continue
      }

      if (inactiveRitual) {
        await db.sharedRitual.update({
          where: { id: inactiveRitual.id },
          data: {
            status: 'ACTIVE',
            description: template.description,
          },
        })
        continue
      }

      await db.sharedRitual.create({
        data: {
          userId,
          title: template.title,
          description: template.description,
          status: 'ACTIVE',
        },
      })
      continue
    }

    if (!activeRitual) {
      continue
    }

    await db.sharedRitual.updateMany({
      where: {
        userId,
        title: template.title,
        status: 'ACTIVE',
      },
      data: {
        status: 'ABANDONED',
      },
    })
  }
}

export async function ensurePresenceTouchpointsTx(
  db: RelationshipReader,
  {
    userId,
    conversationId,
    timeZone,
    ritualKeys,
    now,
  }: {
    userId: string
    conversationId: string
    timeZone: string
    ritualKeys: RitualKey[]
    now: Date
  }
) {
  for (const ritualKey of ritualKeys) {
    const definition = ritualDefinitions.find(
      (ritual) => ritual.key === ritualKey
    )

    if (!definition) {
      continue
    }

    const scheduledFor = buildUpcomingLocalTime(
      now,
      timeZone,
      definition.hour,
      definition.weekday
    )
    const existingTouchpoint = await db.touchpoint.findFirst({
      where: {
        userId,
        type: definition.type,
        status: 'SCHEDULED',
        scheduledFor: {
          gte: startOfMinute(scheduledFor),
          lt: new Date(startOfMinute(scheduledFor).getTime() + 60_000),
        },
      },
      select: {
        id: true,
      },
    })

    if (existingTouchpoint) {
      continue
    }

    await db.touchpoint.create({
      data: {
        userId,
        conversationId,
        type: definition.type,
        status: 'SCHEDULED',
        scheduledFor,
        sourceContext: {
          ritualKey,
          ritualLabel: definition.label,
        },
      },
    })
  }
}

export function detectBridgeOpportunity(
  message: string,
  now: Date,
  timeZone: string
): BridgeOpportunity | null {
  const normalizedMessage = message.trim()

  if (!normalizedMessage) {
    return null
  }

  const patterns: Array<{
    pattern: RegExp
    sourceMode: BridgeOpportunity['sourceMode']
    label: string
    offsetHours: number
  }> = [
    {
      pattern: /\binterview\b/i,
      sourceMode: 'post-event-debrief',
      label: 'that interview',
      offsetHours: 20,
    },
    {
      pattern: /\bmeeting\b/i,
      sourceMode: 'post-event-debrief',
      label: 'that meeting',
      offsetHours: 6,
    },
    {
      pattern: /\b(call|phone call)\b/i,
      sourceMode: 'post-event-debrief',
      label: 'that call',
      offsetHours: 4,
    },
    {
      pattern:
        /\b(text|message) (him|her|them|my friend|my mom|my dad|my partner)\b/i,
      sourceMode: 'social-courage',
      label: 'that message you were thinking about sending',
      offsetHours: 3,
    },
    {
      pattern: /\b(workout|gym|run|walk)\b/i,
      sourceMode: 'habit-companionship',
      label: 'that reset you mentioned',
      offsetHours: 12,
    },
  ]

  const match = patterns.find((entry) => entry.pattern.test(normalizedMessage))

  if (!match) {
    return null
  }

  return {
    label: match.label,
    sourceMode: match.sourceMode,
    scheduledFor: addHoursLocal(now, timeZone, match.offsetHours),
  }
}

export function deriveRelationshipStage({
  relationshipIntent,
  currentStage,
  messages,
  memoryEntries,
}: {
  relationshipIntent: RelationshipIntent
  currentStage: RelationshipStage
  messages: Array<{
    senderRole: string
    contentText: string | null
  }>
  memoryEntries: Array<{
    memoryType: string
    summary: string
  }>
}): RelationshipStage {
  const userMessages = messages.filter(
    (message) => message.senderRole === 'USER'
  )
  const emotionalSignals = memoryEntries.filter(
    (entry) => entry.memoryType === 'EMOTIONAL_PATTERN'
  ).length
  const callbackSignals = memoryEntries.filter(
    (entry) => entry.memoryType === 'CALLBACK_HOOK'
  ).length
  const milestoneSignals = memoryEntries.filter(
    (entry) => entry.memoryType === 'RELATIONSHIP_MILESTONE'
  ).length
  const romanticSignals = userMessages.filter((message) =>
    /\bmiss you|thinking about you|feel close to you|wish you were here|want you here|i trust you|i adore you|i like you\b/i.test(
      message.contentText ?? ''
    )
  ).length

  let targetStage: RelationshipStage = 'NEW_CONNECTION'

  if (userMessages.length >= 2 || emotionalSignals > 0) {
    targetStage = 'WARM_FRIEND'
  }

  if (userMessages.length >= 4 && emotionalSignals > 0 && callbackSignals > 0) {
    targetStage = 'TRUSTED_COMPANION'
  }

  if (
    relationshipIntent === 'GROW_OVER_TIME' &&
    userMessages.length >= 6 &&
    romanticSignals >= 2 &&
    milestoneSignals >= 1
  ) {
    targetStage = 'TENDER_AMBIGUITY'
  }

  if (
    relationshipIntent === 'GROW_OVER_TIME' &&
    userMessages.length >= 10 &&
    romanticSignals >= 4 &&
    milestoneSignals >= 2
  ) {
    targetStage = 'SOFT_ROMANCE'
  }

  return stepTowardStage(currentStage, targetStage)
}

export function buildRelationshipGuardrailNote(
  relationshipStage: RelationshipStage,
  relationshipIntent: RelationshipIntent | null
) {
  if (
    relationshipStage === 'NEW_CONNECTION' ||
    relationshipStage === 'WARM_FRIEND'
  ) {
    return 'Stay warm and attentive, but clearly friend-first. Do not escalate or flirt aggressively.'
  }

  if (
    relationshipStage === 'TRUSTED_COMPANION' &&
    relationshipIntent !== 'GROW_OVER_TIME'
  ) {
    return 'Let the bond feel deep and steady without turning romantic.'
  }

  if (relationshipStage === 'TRUSTED_COMPANION') {
    return 'Allow tenderness, but keep romance implied and slow unless the user keeps signaling for more.'
  }

  if (relationshipStage === 'TENDER_AMBIGUITY') {
    return 'Tenderness is allowed, but it should still feel earned, sparse, and emotionally safe.'
  }

  return 'Soft romance can exist, but avoid exclusivity, coercion, or intensity that outruns trust.'
}

function normalizeRitualKeys(value: unknown) {
  if (!Array.isArray(value)) {
    return new Set<RitualKey>([])
  }

  return new Set(
    value.filter((item): item is RitualKey =>
      ritualDefinitions.some((ritual) => ritual.key === item)
    )
  )
}

function stepTowardStage(
  currentStage: RelationshipStage,
  targetStage: RelationshipStage
) {
  const stages: RelationshipStage[] = [
    'NEW_CONNECTION',
    'WARM_FRIEND',
    'TRUSTED_COMPANION',
    'TENDER_AMBIGUITY',
    'SOFT_ROMANCE',
  ]
  const currentIndex = stages.indexOf(currentStage)
  const targetIndex = stages.indexOf(targetStage)

  if (targetIndex <= currentIndex) {
    return currentStage
  }

  return stages[Math.min(currentIndex + 1, targetIndex)] ?? currentStage
}

function buildUpcomingLocalTime(
  now: Date,
  timeZone: string,
  hour: number,
  weekday?: number
) {
  const zonedNow = getZonedDateParts(now, timeZone)
  let utcTarget = zonedDateTimeToUtc(
    {
      year: zonedNow.year,
      month: zonedNow.month,
      day: zonedNow.day,
      hour,
      minute: 0,
      second: 0,
    },
    timeZone
  )

  if (weekday !== undefined) {
    while (utcTarget.getUTCDay() !== weekday || utcTarget <= now) {
      utcTarget = new Date(utcTarget.getTime() + 24 * 60 * 60 * 1000)
    }
    return utcTarget
  }

  if (utcTarget <= now) {
    return new Date(utcTarget.getTime() + 24 * 60 * 60 * 1000)
  }

  return utcTarget
}

function addHoursLocal(now: Date, timeZone: string, hours: number) {
  const zoned = getZonedDateParts(now, timeZone)
  return zonedDateTimeToUtc(
    {
      year: zoned.year,
      month: zoned.month,
      day: zoned.day,
      hour: zoned.hour + hours,
      minute: zoned.minute,
      second: zoned.second,
    },
    timeZone
  )
}

function startOfMinute(value: Date) {
  const next = new Date(value)
  next.setSeconds(0, 0)
  return next
}

function getZonedDateParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })

  const parts = formatter.formatToParts(date)
  const readPart = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0)

  return {
    year: readPart('year'),
    month: readPart('month'),
    day: readPart('day'),
    hour: readPart('hour'),
    minute: readPart('minute'),
    second: readPart('second'),
  }
}

function zonedDateTimeToUtc(
  localDateTime: {
    year: number
    month: number
    day: number
    hour: number
    minute: number
    second: number
  },
  timeZone: string
) {
  let utcTimestamp = Date.UTC(
    localDateTime.year,
    localDateTime.month - 1,
    localDateTime.day,
    localDateTime.hour,
    localDateTime.minute,
    localDateTime.second
  )

  for (let index = 0; index < 4; index += 1) {
    const actual = getZonedDateParts(new Date(utcTimestamp), timeZone)
    const difference =
      Date.UTC(
        localDateTime.year,
        localDateTime.month - 1,
        localDateTime.day,
        localDateTime.hour,
        localDateTime.minute,
        localDateTime.second
      ) -
      Date.UTC(
        actual.year,
        actual.month - 1,
        actual.day,
        actual.hour,
        actual.minute,
        actual.second
      )

    if (difference === 0) {
      break
    }

    utcTimestamp += difference
  }

  return new Date(utcTimestamp)
}
