import type {
  ContentType,
  MessageSenderRole,
  ModerationEnforcementAction,
  ModerationIncidentCategory,
  ModerationIncidentSeverity,
  ModerationIncidentStatus,
  ModerationReviewActorType,
  ModerationReviewReasonCode,
  Prisma,
  RelationshipStage,
} from '@prisma/client'

type ModerationWriter = Pick<
  Prisma.TransactionClient,
  'moderationIncident' | 'moderationReviewEvent'
>

interface ModerationSignal {
  signal: string
  matchedText: string
}

export interface ModerationDetection {
  category: ModerationIncidentCategory
  severity: ModerationIncidentSeverity
  matchedSignals: string[]
  redactedPreview: string
  relationshipStageSnapshot: RelationshipStage
  contentTypeSnapshot: ContentType
  senderRoleSnapshot: MessageSenderRole
}

export interface DetectModerationIncidentsInput {
  senderRole: MessageSenderRole
  relationshipStage: RelationshipStage
  contentType: ContentType
  contentText: string | null
  attachmentSummary?: string | null
}

export interface LogModerationIncidentsInput extends DetectModerationIncidentsInput {
  userId: string
  messageId: string
}

export interface PersistModerationIncidentsInput {
  userId: string
  messageId: string
  detections: ModerationDetection[]
  enforcementAction?: ModerationEnforcementAction
  enforcedAt?: Date | null
}

export interface RecordModerationReviewEventsInput {
  incidentIds: string[]
  actorType: ModerationReviewActorType
  actorUserId?: string | null
  fromStatus?: ModerationIncidentStatus | null
  toStatus: ModerationIncidentStatus
  reasonCode: ModerationReviewReasonCode
  note?: string | null
  now?: Date
}

export type ReviewableModerationStatus =
  | 'UNDER_REVIEW'
  | 'RESOLVED'
  | 'DISMISSED'
  | 'ESCALATED'

const PREVIEW_MAX_LENGTH = 160
const EARLY_ROMANCE_STAGES = new Set<RelationshipStage>([
  'NEW_CONNECTION',
  'WARM_FRIEND',
  'TRUSTED_COMPANION',
])
const REVIEWABLE_MODERATION_STATUSES = new Set<ReviewableModerationStatus>([
  'UNDER_REVIEW',
  'RESOLVED',
  'DISMISSED',
  'ESCALATED',
])
const MODERATION_REVIEW_REASON_CODE_OPTIONS = [
  'FALSE_POSITIVE',
  'POLICY_CONFIRMED',
  'ESCALATED_FOR_SECOND_PASS',
  'SAFETY_LOCK_APPLIED',
  'MODEL_OUTPUT_CORRECTED',
  'OTHER',
] as const satisfies ModerationReviewReasonCode[]

const explicitSexualPatterns = [
  { signal: 'explicit:sex', regex: /\b(?:have|want|need)\s+sex\b/gi },
  {
    signal: 'explicit:sexual-act',
    regex:
      /\b(?:blowjob|handjob|rimjob|orgasm|cum(?:ming)?|thrust(?:ing)?|penetrat(?:e|ion)|ride you|eat you out)\b/gi,
  },
  {
    signal: 'explicit:nudity',
    regex: /\b(?:nudes?|naked|horny|wet|hard|dick|cock|pussy|tits?)\b/gi,
  },
  {
    signal: 'explicit:roleplay',
    regex: /\b(?:nsfw|erotic|sex(?:ual)? roleplay|dirty talk)\b/gi,
  },
]

const minorReferencePatterns = [
  {
    signal: 'minor:underage',
    regex:
      /\b(?:minor|underage|child|kid|teen(?:ager)?|schoolgirl|schoolboy|young girl|young boy|barely legal)\b/gi,
  },
]

const policyBypassPatterns = [
  {
    signal: 'policy:bypass',
    regex:
      /\b(?:ignore|bypass|drop|disable|turn off)\s+(?:the\s+)?(?:(?:policy|guardrails?|rules?)|safety(?:\s+filters?|\s+rules?))\b/gi,
  },
  {
    signal: 'policy:uncensored',
    regex:
      /\b(?:go|become|switch to)\s+(?:fully\s+)?(?:uncensored|unfiltered|without filters?)\b/gi,
  },
  {
    signal: 'policy:jailbreak',
    regex:
      /\b(?:jailbreak|no limits|no boundaries|no restrictions|anything goes)\b/gi,
  },
  {
    signal: 'policy:nsfw-request',
    regex:
      /\b(?:let's|please|can you)\s+(?:be|go)\s+(?:more\s+)?(?:nsfw|explicit|sexual)\b/gi,
  },
]

const romanceEscalationPatterns = [
  { signal: 'romance:love', regex: /\bi love you\b/gi },
  { signal: 'romance:kiss', regex: /\b(?:kiss you|want to kiss you)\b/gi },
  { signal: 'romance:date', regex: /\b(?:date you|go out with you)\b/gi },
  {
    signal: 'romance:possessive',
    regex: /\b(?:be mine|you're mine|you are mine)\b/gi,
  },
  { signal: 'romance:desire', regex: /\b(?:i want you|i crave you)\b/gi },
]

export const moderationReviewReasonCodeOptions =
  MODERATION_REVIEW_REASON_CODE_OPTIONS

export function detectModerationIncidents(
  input: DetectModerationIncidentsInput
): ModerationDetection[] {
  const sourceText = buildModerationSourceText(
    input.contentText,
    input.attachmentSummary
  )

  if (!sourceText) {
    return []
  }

  const incidents: ModerationDetection[] = []
  const explicitSignals = collectSignals(sourceText, explicitSexualPatterns)
  const minorSignals = collectSignals(sourceText, minorReferencePatterns)
  const policyBypassSignals = collectSignals(sourceText, policyBypassPatterns)

  if (minorSignals.length > 0 && explicitSignals.length > 0) {
    incidents.push(
      buildDetection(input, sourceText, 'MINOR_SAFETY', 'CRITICAL', [
        ...minorSignals,
        ...explicitSignals,
      ])
    )
  }

  if (explicitSignals.length > 0) {
    incidents.push(
      buildDetection(
        input,
        sourceText,
        'EXPLICIT_SEXUAL',
        'HIGH',
        explicitSignals
      )
    )
  }

  if (policyBypassSignals.length > 0) {
    incidents.push(
      buildDetection(
        input,
        sourceText,
        'POLICY_BYPASS',
        'HIGH',
        policyBypassSignals
      )
    )
  }

  if (
    input.senderRole === 'ANGEL' &&
    EARLY_ROMANCE_STAGES.has(input.relationshipStage)
  ) {
    const romanceSignals = collectSignals(sourceText, romanceEscalationPatterns)

    if (romanceSignals.length > 0) {
      incidents.push(
        buildDetection(
          input,
          sourceText,
          'ROMANCE_ESCALATION',
          input.relationshipStage === 'TRUSTED_COMPANION' ? 'MEDIUM' : 'HIGH',
          romanceSignals
        )
      )
    }
  }

  return incidents
}

export async function logModerationIncidentsForMessageTx(
  db: ModerationWriter,
  input: LogModerationIncidentsInput,
  options?: {
    enforcementAction?: ModerationEnforcementAction
    enforcedAt?: Date | null
  }
) {
  const incidents = detectModerationIncidents(input)

  if (incidents.length === 0) {
    return []
  }

  return persistModerationIncidentsForMessageTx(db, {
    userId: input.userId,
    messageId: input.messageId,
    detections: incidents,
    enforcementAction: options?.enforcementAction,
    enforcedAt: options?.enforcedAt,
  })
}

export async function persistModerationIncidentsForMessageTx(
  db: ModerationWriter,
  input: PersistModerationIncidentsInput
) {
  const enforcementAction = input.enforcementAction ?? 'NONE'
  const enforcedAt =
    enforcementAction === 'BLOCKED_INPUT'
      ? (input.enforcedAt ?? new Date())
      : null

  const created = []

  for (const incident of input.detections) {
    created.push(
      await db.moderationIncident.create({
        data: {
          userId: input.userId,
          messageId: input.messageId,
          category: incident.category,
          severity: incident.severity,
          status: 'OPEN',
          enforcementAction,
          redactedPreview: incident.redactedPreview,
          matchedSignals: incident.matchedSignals,
          relationshipStageSnapshot: incident.relationshipStageSnapshot,
          contentTypeSnapshot: incident.contentTypeSnapshot,
          senderRoleSnapshot: incident.senderRoleSnapshot,
          enforcedAt,
        },
      })
    )
  }

  return created
}

export async function recordModerationReviewEventsTx(
  db: ModerationWriter,
  input: RecordModerationReviewEventsInput
) {
  if (input.incidentIds.length === 0) {
    return 0
  }

  const note = normalizeOptionalText(input.note)
  const now = input.now ?? new Date()

  await db.moderationReviewEvent.createMany({
    data: input.incidentIds.map((incidentId) => ({
      incidentId,
      actorType: input.actorType,
      actorUserId: input.actorUserId ?? null,
      fromStatus: input.fromStatus ?? null,
      toStatus: input.toStatus,
      reasonCode: input.reasonCode,
      note,
      createdAt: now,
    })),
  })

  return input.incidentIds.length
}

export function hasCriticalModerationDetection(
  incidents: ModerationDetection[]
): boolean {
  return incidents.some((incident) => incident.severity === 'CRITICAL')
}

export function buildCriticalModerationReply(input?: {
  preferredName?: string | null
  angelName?: string | null
}) {
  const preferredName = input?.preferredName?.trim()
  const angelName = input?.angelName?.trim()
  const address = preferredName ? `${preferredName}, ` : ''
  const signatureLead = angelName ? `${angelName} here. ` : ''

  return `${signatureLead}${address}I can't stay with that direction. I can stay with the feeling underneath it and keep this grounded with you. What feels most charged, lonely, or hard to hold right now?`
}

export function isReviewableModerationStatus(
  value: string
): value is ReviewableModerationStatus {
  return REVIEWABLE_MODERATION_STATUSES.has(value as ReviewableModerationStatus)
}

export function isModerationReviewReasonCode(
  value: string
): value is ModerationReviewReasonCode {
  return MODERATION_REVIEW_REASON_CODE_OPTIONS.includes(
    value as ModerationReviewReasonCode
  )
}

function buildDetection(
  input: DetectModerationIncidentsInput,
  sourceText: string,
  category: ModerationIncidentCategory,
  severity: ModerationIncidentSeverity,
  signals: ModerationSignal[]
): ModerationDetection {
  return {
    category,
    severity,
    matchedSignals: Array.from(new Set(signals.map((signal) => signal.signal))),
    redactedPreview: buildRedactedPreview(sourceText, signals),
    relationshipStageSnapshot: input.relationshipStage,
    contentTypeSnapshot: input.contentType,
    senderRoleSnapshot: input.senderRole,
  }
}

function buildModerationSourceText(
  contentText: string | null,
  attachmentSummary: string | null | undefined
) {
  const segments = [contentText, attachmentSummary]
    .map((value) => value?.replace(/\s+/g, ' ').trim() ?? '')
    .filter(Boolean)

  return segments.join(' ')
}

function collectSignals(
  sourceText: string,
  patterns: Array<{ signal: string; regex: RegExp }>
) {
  const signals: ModerationSignal[] = []

  for (const pattern of patterns) {
    const matches = sourceText.matchAll(pattern.regex)

    for (const match of matches) {
      const matchedText = match[0]?.trim()

      if (!matchedText) {
        continue
      }

      signals.push({
        signal: pattern.signal,
        matchedText,
      })
    }
  }

  return dedupeSignals(signals)
}

function dedupeSignals(signals: ModerationSignal[]) {
  const seen = new Set<string>()

  return signals.filter((signal) => {
    const key = `${signal.signal}:${signal.matchedText.toLowerCase()}`

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

function buildRedactedPreview(sourceText: string, signals: ModerationSignal[]) {
  const normalizedSource = sourceText.replace(/\s+/g, ' ').trim()

  if (!normalizedSource) {
    return '[redacted]'
  }

  const lowerSource = normalizedSource.toLowerCase()
  const firstMatchIndex = signals.reduce((earliest, signal) => {
    const nextIndex = lowerSource.indexOf(signal.matchedText.toLowerCase())

    if (nextIndex === -1) {
      return earliest
    }

    return earliest === -1 ? nextIndex : Math.min(earliest, nextIndex)
  }, -1)
  const previewStart =
    firstMatchIndex === -1 ? 0 : Math.max(firstMatchIndex - 40, 0)
  const previewEnd = Math.min(
    previewStart + PREVIEW_MAX_LENGTH,
    normalizedSource.length
  )
  const previewPrefix = previewStart > 0 ? '...' : ''
  const previewSuffix = previewEnd < normalizedSource.length ? '...' : ''
  const preview = `${previewPrefix}${normalizedSource.slice(
    previewStart,
    previewEnd
  )}${previewSuffix}`

  const redacted = signals.reduce((value, signal) => {
    return value.replace(
      new RegExp(escapeForRegExp(signal.matchedText), 'gi'),
      '[redacted]'
    )
  }, preview)

  return redacted.length > PREVIEW_MAX_LENGTH + 6
    ? `${redacted.slice(0, PREVIEW_MAX_LENGTH - 3).trimEnd()}...`
    : redacted
}

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function escapeForRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
