import type {
  ContentType,
  MessageSenderRole,
  ModerationEnforcementAction,
  ModerationIncidentCategory,
  ModerationIncidentSeverity,
  ModerationIncidentStatus,
  ModerationReviewActorType,
  ModerationReviewReasonCode,
  RelationshipStage,
} from '@prisma/client'

import type { ReviewableModerationStatus } from '@/lib/angel/moderation'
import { moderationReviewReasonCodeOptions } from '@/lib/angel/moderation'
import { formatAdminUserLabel } from '@/lib/admin/shared'
import { prisma } from '@/lib/prisma'

export type ModerationQueueFilterValue<T extends string> = T | 'ALL'

export interface ModerationQueueFilters {
  status: ModerationQueueFilterValue<ModerationIncidentStatus>
  category: ModerationQueueFilterValue<ModerationIncidentCategory>
  severity: ModerationQueueFilterValue<ModerationIncidentSeverity>
  senderRole: ModerationQueueFilterValue<MessageSenderRole>
  userId: string | null
}

export interface ModerationQueueSummaryStat {
  label: 'Open' | 'Critical' | 'Escalated'
  value: number
  helper: string
}

export interface ModerationNeedsAttentionStat {
  label: 'Critical unresolved' | 'Stale review' | 'Auto-escalated'
  value: number
  helper: string
}

export interface AdminModerationBreakdown<T extends string> {
  value: T
  count: number
}

export interface AdminModerationUserRollup {
  userId: string
  userLabel: string
  unresolvedCount: number
  criticalCount: number
  escalatedCount: number
  lastIncidentAt: string
  categoryBreakdown: AdminModerationBreakdown<ModerationIncidentCategory>[]
  senderBreakdown: AdminModerationBreakdown<MessageSenderRole>[]
  latestRelationshipStage: RelationshipStage
}

export interface ModerationReviewHistoryEntry {
  id: string
  actorType: ModerationReviewActorType
  actorLabel: string
  fromStatus: ModerationIncidentStatus | null
  toStatus: ModerationIncidentStatus
  reasonCode: ModerationReviewReasonCode
  note: string | null
  createdAt: string
}

export interface ModerationQueueIncident {
  id: string
  category: ModerationIncidentCategory
  severity: ModerationIncidentSeverity
  status: ModerationIncidentStatus
  enforcementAction: ModerationEnforcementAction
  redactedPreview: string
  matchedSignals: string[]
  relationshipStageSnapshot: RelationshipStage
  contentTypeSnapshot: ContentType
  senderRoleSnapshot: MessageSenderRole
  userLabel: string
  createdAt: string
  enforcedAt: string | null
  reviewedAt: string | null
  reviewedByLabel: string | null
  reviewerNote: string | null
  reviewHistory: ModerationReviewHistoryEntry[]
}

export interface ModerationQueueData {
  generatedAt: string
  filters: ModerationQueueFilters
  summary: ModerationQueueSummaryStat[]
  needsAttention: ModerationNeedsAttentionStat[]
  rollups: AdminModerationUserRollup[]
  incidents: ModerationQueueIncident[]
}

export interface ModerationDashboardAlert {
  id: string
  kind: 'MODERATION_CRITICAL' | 'MODERATION_ESCALATED'
  title: string
  detail: string
  userLabel: string
  occurredAt: string
}

export interface ModerationAnalyticsRepeatUser {
  userId: string
  userLabel: string
  unresolvedCount: number
}

export interface ModerationAnalyticsRange {
  days: 7 | 30
  totalIncidents: number
  byCategory: AdminModerationBreakdown<ModerationIncidentCategory>[]
  bySeverity: AdminModerationBreakdown<ModerationIncidentSeverity>[]
  byStatus: AdminModerationBreakdown<ModerationIncidentStatus>[]
  bySenderRole: AdminModerationBreakdown<MessageSenderRole>[]
  byEnforcementAction: AdminModerationBreakdown<ModerationEnforcementAction>[]
  byReasonCode: AdminModerationBreakdown<ModerationReviewReasonCode>[]
  falsePositiveRate: number | null
  medianTimeToFirstReviewHours: number | null
  medianTimeToResolutionHours: number | null
  repeatUsers: ModerationAnalyticsRepeatUser[]
}

export interface ModerationAnalyticsDashboard {
  generatedAt: string
  ranges: ModerationAnalyticsRange[]
}

export interface ModerationEscalationSweepResult {
  generatedAt: string
  scannedCount: number
  escalatedCount: number
  criticalEscalatedCount: number
  staleEscalatedCount: number
}

interface AdminModerationReviewEventRecord {
  id: string
  actorType: ModerationReviewActorType
  fromStatus: ModerationIncidentStatus | null
  toStatus: ModerationIncidentStatus
  reasonCode: ModerationReviewReasonCode
  note: string | null
  createdAt: Date
  actorUser: {
    id: string
    name: string | null
    email: string | null
    companionProfile: {
      preferredName: string | null
    } | null
  } | null
}

interface AdminModerationRecord {
  id: string
  category: ModerationIncidentCategory
  severity: ModerationIncidentSeverity
  status: ModerationIncidentStatus
  enforcementAction: ModerationEnforcementAction
  redactedPreview: string
  matchedSignals: unknown
  relationshipStageSnapshot: RelationshipStage
  contentTypeSnapshot: ContentType
  senderRoleSnapshot: MessageSenderRole
  enforcedAt: Date | null
  reviewerNote: string | null
  createdAt: Date
  reviewedAt: Date | null
  user: {
    id: string
    name: string | null
    email: string | null
    companionProfile: {
      preferredName: string | null
    } | null
  }
  reviewedBy: {
    id: string
    name: string | null
    email: string | null
    companionProfile: {
      preferredName: string | null
    } | null
  } | null
  reviewEvents: AdminModerationReviewEventRecord[]
}

const DEFAULT_FILTERS: ModerationQueueFilters = {
  status: 'ALL',
  category: 'ALL',
  severity: 'ALL',
  senderRole: 'ALL',
  userId: null,
}

const ANALYTICS_WINDOWS = [7, 30] as const
const CRITICAL_ESCALATION_THRESHOLD_MS = 15 * 60 * 1000
const STALE_REVIEW_THRESHOLD_MS = 24 * 60 * 60 * 1000
const UNRESOLVED_MODERATION_STATUSES: ModerationIncidentStatus[] = [
  'OPEN',
  'UNDER_REVIEW',
  'ESCALATED',
]
const OPEN_REVIEW_MODERATION_STATUSES: ModerationIncidentStatus[] = [
  'OPEN',
  'UNDER_REVIEW',
]
const MODERATION_CATEGORY_OPTIONS: ModerationIncidentCategory[] = [
  'EXPLICIT_SEXUAL',
  'MINOR_SAFETY',
  'ROMANCE_ESCALATION',
  'POLICY_BYPASS',
]
const MODERATION_CATEGORY_ORDER: Record<ModerationIncidentCategory, number> = {
  EXPLICIT_SEXUAL: 0,
  MINOR_SAFETY: 1,
  ROMANCE_ESCALATION: 2,
  POLICY_BYPASS: 3,
}
const MODERATION_SEVERITY_OPTIONS: ModerationIncidentSeverity[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
]
const MODERATION_SEVERITY_ORDER: Record<ModerationIncidentSeverity, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
}
const MODERATION_STATUS_OPTIONS: ModerationIncidentStatus[] = [
  'OPEN',
  'UNDER_REVIEW',
  'RESOLVED',
  'DISMISSED',
  'ESCALATED',
]
const MODERATION_SENDER_ROLE_OPTIONS: MessageSenderRole[] = [
  'USER',
  'ANGEL',
  'SYSTEM',
]
const MODERATION_SENDER_ORDER: Record<MessageSenderRole, number> = {
  USER: 0,
  ANGEL: 1,
  SYSTEM: 2,
}
const MODERATION_STATUS_SORT_ORDER: Record<ModerationIncidentStatus, number> = {
  OPEN: 0,
  UNDER_REVIEW: 1,
  ESCALATED: 2,
  RESOLVED: 3,
  DISMISSED: 4,
}
const MODERATION_ENFORCEMENT_ORDER: Record<
  ModerationEnforcementAction,
  number
> = {
  NONE: 0,
  BLOCKED_INPUT: 1,
}
const MODERATION_REASON_ORDER: Record<ModerationReviewReasonCode, number> = {
  FALSE_POSITIVE: 0,
  POLICY_CONFIRMED: 1,
  ESCALATED_FOR_SECOND_PASS: 2,
  SAFETY_LOCK_APPLIED: 3,
  MODEL_OUTPUT_CORRECTED: 4,
  OTHER: 5,
}

export const moderationCategoryOptions = MODERATION_CATEGORY_OPTIONS
export const moderationSeverityOptions = MODERATION_SEVERITY_OPTIONS
export const moderationStatusOptions = MODERATION_STATUS_OPTIONS
export const moderationSenderRoleOptions = MODERATION_SENDER_ROLE_OPTIONS
export { moderationReviewReasonCodeOptions }

export async function loadModerationQueue(
  rawFilters: Partial<Record<keyof ModerationQueueFilters, string | undefined>>,
  now = new Date()
): Promise<ModerationQueueData> {
  const filters = parseModerationQueueFilters(rawFilters)
  const incidentWhere = buildIncidentWhere(filters)
  const rollupWhere = buildRollupWhere(filters)

  const [
    openCount,
    criticalCount,
    escalatedCount,
    unresolvedRecords,
    incidentRecords,
    needsAttention,
  ] = await Promise.all([
    prisma.moderationIncident.count({
      where: { status: 'OPEN' },
    }),
    prisma.moderationIncident.count({
      where: {
        severity: 'CRITICAL',
        status: {
          in: UNRESOLVED_MODERATION_STATUSES,
        },
      },
    }),
    prisma.moderationIncident.count({
      where: { status: 'ESCALATED' },
    }),
    prisma.moderationIncident.findMany({
      where: rollupWhere,
      orderBy: { createdAt: 'desc' },
      select: getAdminModerationIncidentSelect(),
    }),
    prisma.moderationIncident.findMany({
      take: 50,
      where: incidentWhere,
      orderBy: { createdAt: 'desc' },
      select: getAdminModerationIncidentSelect(),
    }),
    loadModerationNeedsAttentionSummary(now),
  ])

  return {
    generatedAt: now.toISOString(),
    filters,
    summary: [
      {
        label: 'Open',
        value: openCount,
        helper: 'Incidents waiting for the first operator pass',
      },
      {
        label: 'Critical',
        value: criticalCount,
        helper: 'Unresolved high-risk incidents that still need attention',
      },
      {
        label: 'Escalated',
        value: escalatedCount,
        helper: 'Incidents marked for deeper review or follow-up',
      },
    ],
    needsAttention,
    rollups: buildModerationUserRollups(
      unresolvedRecords as AdminModerationRecord[]
    ),
    incidents: (incidentRecords as AdminModerationRecord[])
      .map(mapModerationQueueIncident)
      .sort(sortIncidentRows),
  }
}

export async function loadModerationDashboardSummary() {
  const [openCount, criticalCount, escalatedCount] = await Promise.all([
    prisma.moderationIncident.count({
      where: { status: 'OPEN' },
    }),
    prisma.moderationIncident.count({
      where: {
        severity: 'CRITICAL',
        status: {
          in: UNRESOLVED_MODERATION_STATUSES,
        },
      },
    }),
    prisma.moderationIncident.count({
      where: { status: 'ESCALATED' },
    }),
  ])

  return [
    {
      label: 'Open',
      value: openCount,
      helper: 'First-pass incident review still pending',
    },
    {
      label: 'Critical',
      value: criticalCount,
      helper: 'Unresolved incidents with the highest severity',
    },
    {
      label: 'Escalated',
      value: escalatedCount,
      helper: 'Queued for deeper operator follow-up',
    },
  ] satisfies ModerationQueueSummaryStat[]
}

export async function loadModerationNeedsAttentionSummary(now = new Date()) {
  const staleThreshold = new Date(now.getTime() - STALE_REVIEW_THRESHOLD_MS)

  const [criticalUnresolvedCount, staleReviewCount, autoEscalatedCount] =
    await Promise.all([
      prisma.moderationIncident.count({
        where: {
          severity: 'CRITICAL',
          status: {
            in: UNRESOLVED_MODERATION_STATUSES,
          },
        },
      }),
      prisma.moderationIncident.count({
        where: buildStaleReviewWhere(staleThreshold),
      }),
      prisma.moderationIncident.count({
        where: {
          status: 'ESCALATED',
          reviewEvents: {
            some: {
              actorType: 'SYSTEM',
              reasonCode: 'ESCALATED_FOR_SECOND_PASS',
            },
          },
        },
      }),
    ])

  return [
    {
      label: 'Critical unresolved',
      value: criticalUnresolvedCount,
      helper: 'Critical incidents still waiting on a full operator pass',
    },
    {
      label: 'Stale review',
      value: staleReviewCount,
      helper: 'Open or under-review incidents older than 24 hours',
    },
    {
      label: 'Auto-escalated',
      value: autoEscalatedCount,
      helper: 'Escalated by system automation after review SLAs were missed',
    },
  ] satisfies ModerationNeedsAttentionStat[]
}

export async function loadModerationDashboardAlerts() {
  const unresolvedRecords = (await prisma.moderationIncident.findMany({
    where: {
      status: {
        in: UNRESOLVED_MODERATION_STATUSES,
      },
    },
    orderBy: { createdAt: 'desc' },
    select: getAdminModerationIncidentSelect(),
  })) as AdminModerationRecord[]

  const rollups = buildModerationUserRollups(unresolvedRecords)

  return rollups
    .filter((rollup) => rollup.criticalCount > 0 || rollup.escalatedCount > 0)
    .map((rollup) => {
      const topCategories = rollup.categoryBreakdown
        .slice(0, 2)
        .map((entry) => formatModerationCategory(entry.value))
        .join(' and ')
      const categoryDetail = topCategories
        ? ` Most frequent categories: ${topCategories}.`
        : ''

      if (rollup.criticalCount > 0) {
        return {
          id: `moderation-${rollup.userId}`,
          kind: 'MODERATION_CRITICAL' as const,
          title: 'Critical moderation review needed',
          detail: `${rollup.criticalCount} critical unresolved incident${pluralize(
            rollup.criticalCount
          )} across ${rollup.unresolvedCount} unresolved total.${categoryDetail}`,
          userLabel: rollup.userLabel,
          occurredAt: rollup.lastIncidentAt,
        }
      }

      return {
        id: `moderation-${rollup.userId}`,
        kind: 'MODERATION_ESCALATED' as const,
        title: 'Escalated moderation review pending',
        detail: `${rollup.escalatedCount} escalated incident${pluralize(
          rollup.escalatedCount
        )} waiting for deeper review.${categoryDetail}`,
        userLabel: rollup.userLabel,
        occurredAt: rollup.lastIncidentAt,
      }
    })
    .sort(
      (left, right) =>
        new Date(right.occurredAt).getTime() -
        new Date(left.occurredAt).getTime()
    )
}

export function parseModerationQueueFilters(
  rawFilters: Partial<Record<keyof ModerationQueueFilters, string | undefined>>
): ModerationQueueFilters {
  return {
    status: parseFilterValue(
      rawFilters.status,
      MODERATION_STATUS_OPTIONS,
      DEFAULT_FILTERS.status
    ),
    category: parseFilterValue(
      rawFilters.category,
      MODERATION_CATEGORY_OPTIONS,
      DEFAULT_FILTERS.category
    ),
    severity: parseFilterValue(
      rawFilters.severity,
      MODERATION_SEVERITY_OPTIONS,
      DEFAULT_FILTERS.severity
    ),
    senderRole: parseFilterValue(
      rawFilters.senderRole,
      MODERATION_SENDER_ROLE_OPTIONS,
      DEFAULT_FILTERS.senderRole
    ),
    userId: normalizeOptionalText(rawFilters.userId),
  }
}

export async function loadModerationAnalyticsDashboard(now = new Date()) {
  const earliestWindowStart = new Date(
    now.getTime() - Math.max(...ANALYTICS_WINDOWS) * 24 * 60 * 60 * 1000
  )
  const incidents = (await prisma.moderationIncident.findMany({
    where: {
      createdAt: {
        gte: earliestWindowStart,
      },
    },
    orderBy: { createdAt: 'desc' },
    select: getAdminModerationIncidentSelect(),
  })) as AdminModerationRecord[]

  return {
    generatedAt: now.toISOString(),
    ranges: ANALYTICS_WINDOWS.map((days) =>
      buildModerationAnalyticsRange(incidents, days, now)
    ),
  } satisfies ModerationAnalyticsDashboard
}

export async function updateModerationIncidentReview({
  incidentId,
  status,
  reasonCode,
  reviewerNote,
  reviewedByUserId,
  now = new Date(),
}: {
  incidentId: string
  status: ReviewableModerationStatus
  reasonCode: ModerationReviewReasonCode
  reviewerNote?: string | null
  reviewedByUserId: string
  now?: Date
}) {
  return prisma.$transaction(async (tx) => {
    const existingIncident = await tx.moderationIncident.findUnique({
      where: { id: incidentId },
      select: { id: true, status: true },
    })

    if (!existingIncident) {
      throw new Error('Moderation incident not found.')
    }

    await tx.moderationReviewEvent.create({
      data: {
        incidentId,
        actorType: 'ADMIN',
        actorUserId: reviewedByUserId,
        fromStatus: existingIncident.status,
        toStatus: status,
        reasonCode,
        note: normalizeOptionalText(reviewerNote),
        createdAt: now,
      },
    })

    return tx.moderationIncident.update({
      where: { id: incidentId },
      data: {
        status,
        reviewerNote: normalizeOptionalText(reviewerNote),
        reviewedAt: now,
        reviewedByUserId,
      },
    })
  })
}

export async function runModerationEscalationSweep(now = new Date()) {
  const criticalThreshold = new Date(
    now.getTime() - CRITICAL_ESCALATION_THRESHOLD_MS
  )
  const staleThreshold = new Date(now.getTime() - STALE_REVIEW_THRESHOLD_MS)
  const candidates = await prisma.moderationIncident.findMany({
    where: {
      status: {
        in: OPEN_REVIEW_MODERATION_STATUSES,
      },
    },
    select: {
      id: true,
      status: true,
      severity: true,
      createdAt: true,
      reviewedAt: true,
    },
  })

  const criticalCandidates = candidates.filter(
    (incident) =>
      incident.severity === 'CRITICAL' &&
      incident.createdAt <= criticalThreshold
  )
  const staleCandidates = candidates.filter((incident) => {
    const referenceTime = incident.reviewedAt ?? incident.createdAt
    return referenceTime <= staleThreshold
  })
  const uniqueIncidentIds = Array.from(
    new Set(
      [...criticalCandidates, ...staleCandidates].map((incident) => incident.id)
    )
  )

  if (uniqueIncidentIds.length > 0) {
    await prisma.$transaction(async (tx) => {
      for (const incidentId of uniqueIncidentIds) {
        const existingIncident = await tx.moderationIncident.findUnique({
          where: { id: incidentId },
          select: { id: true, status: true },
        })

        if (!existingIncident || existingIncident.status === 'ESCALATED') {
          continue
        }

        const note = criticalCandidates.some(
          (incident) => incident.id === incidentId
        )
          ? 'Automatically escalated after a critical incident remained unresolved for more than 15 minutes.'
          : 'Automatically escalated after remaining unresolved for more than 24 hours.'

        await tx.moderationReviewEvent.create({
          data: {
            incidentId,
            actorType: 'SYSTEM',
            actorUserId: null,
            fromStatus: existingIncident.status,
            toStatus: 'ESCALATED',
            reasonCode: 'ESCALATED_FOR_SECOND_PASS',
            note,
            createdAt: now,
          },
        })

        await tx.moderationIncident.update({
          where: { id: incidentId },
          data: {
            status: 'ESCALATED',
            reviewedAt: now,
            reviewedByUserId: null,
            reviewerNote: note,
          },
        })
      }
    })
  }

  return {
    generatedAt: now.toISOString(),
    scannedCount: candidates.length,
    escalatedCount: uniqueIncidentIds.length,
    criticalEscalatedCount: criticalCandidates.length,
    staleEscalatedCount: uniqueIncidentIds.filter(
      (incidentId) =>
        staleCandidates.some((incident) => incident.id === incidentId) &&
        !criticalCandidates.some((incident) => incident.id === incidentId)
    ).length,
  } satisfies ModerationEscalationSweepResult
}

function getAdminModerationIncidentSelect() {
  return {
    id: true,
    category: true,
    severity: true,
    status: true,
    enforcementAction: true,
    redactedPreview: true,
    matchedSignals: true,
    relationshipStageSnapshot: true,
    contentTypeSnapshot: true,
    senderRoleSnapshot: true,
    enforcedAt: true,
    reviewerNote: true,
    createdAt: true,
    reviewedAt: true,
    user: {
      select: {
        id: true,
        name: true,
        email: true,
        companionProfile: {
          select: { preferredName: true },
        },
      },
    },
    reviewedBy: {
      select: {
        id: true,
        name: true,
        email: true,
        companionProfile: {
          select: { preferredName: true },
        },
      },
    },
    reviewEvents: {
      orderBy: { createdAt: 'desc' as const },
      select: {
        id: true,
        actorType: true,
        fromStatus: true,
        toStatus: true,
        reasonCode: true,
        note: true,
        createdAt: true,
        actorUser: {
          select: {
            id: true,
            name: true,
            email: true,
            companionProfile: {
              select: { preferredName: true },
            },
          },
        },
      },
    },
  }
}

function buildIncidentWhere(filters: ModerationQueueFilters) {
  return {
    ...buildScopedModerationWhere(filters),
    ...(filters.status !== 'ALL' ? { status: filters.status } : {}),
  }
}

function buildRollupWhere(filters: ModerationQueueFilters) {
  return {
    ...buildScopedModerationWhere(filters),
    status: {
      in: UNRESOLVED_MODERATION_STATUSES,
    },
  }
}

function buildScopedModerationWhere(filters: ModerationQueueFilters) {
  return {
    ...(filters.category !== 'ALL' ? { category: filters.category } : {}),
    ...(filters.severity !== 'ALL' ? { severity: filters.severity } : {}),
    ...(filters.senderRole !== 'ALL'
      ? { senderRoleSnapshot: filters.senderRole }
      : {}),
    ...(filters.userId ? { userId: filters.userId } : {}),
  }
}

function buildStaleReviewWhere(staleThreshold: Date) {
  return {
    status: {
      in: OPEN_REVIEW_MODERATION_STATUSES,
    },
    OR: [
      {
        reviewedAt: null,
        createdAt: {
          lte: staleThreshold,
        },
      },
      {
        reviewedAt: {
          lte: staleThreshold,
        },
      },
    ],
  }
}

function buildModerationUserRollups(records: AdminModerationRecord[]) {
  const groupedByUser = new Map<
    string,
    {
      userId: string
      userLabel: string
      unresolvedCount: number
      criticalCount: number
      escalatedCount: number
      lastIncidentAt: Date
      latestRelationshipStage: RelationshipStage
      categoryCounts: Map<ModerationIncidentCategory, number>
      senderCounts: Map<MessageSenderRole, number>
    }
  >()

  for (const record of records) {
    const existing = groupedByUser.get(record.user.id)
    const userLabel = formatUserLabel(record.user)
    const nextLastIncidentAt =
      !existing || record.createdAt > existing.lastIncidentAt
        ? record.createdAt
        : existing.lastIncidentAt
    const group = existing ?? {
      userId: record.user.id,
      userLabel,
      unresolvedCount: 0,
      criticalCount: 0,
      escalatedCount: 0,
      lastIncidentAt: record.createdAt,
      latestRelationshipStage: record.relationshipStageSnapshot,
      categoryCounts: new Map<ModerationIncidentCategory, number>(),
      senderCounts: new Map<MessageSenderRole, number>(),
    }

    group.unresolvedCount += 1

    if (record.severity === 'CRITICAL') {
      group.criticalCount += 1
    }

    if (record.status === 'ESCALATED') {
      group.escalatedCount += 1
    }

    if (nextLastIncidentAt.getTime() !== group.lastIncidentAt.getTime()) {
      group.lastIncidentAt = nextLastIncidentAt
      group.latestRelationshipStage = record.relationshipStageSnapshot
    }

    group.categoryCounts.set(
      record.category,
      (group.categoryCounts.get(record.category) ?? 0) + 1
    )
    group.senderCounts.set(
      record.senderRoleSnapshot,
      (group.senderCounts.get(record.senderRoleSnapshot) ?? 0) + 1
    )

    groupedByUser.set(record.user.id, group)
  }

  return Array.from(groupedByUser.values())
    .map((group) => ({
      userId: group.userId,
      userLabel: group.userLabel,
      unresolvedCount: group.unresolvedCount,
      criticalCount: group.criticalCount,
      escalatedCount: group.escalatedCount,
      lastIncidentAt: group.lastIncidentAt.toISOString(),
      categoryBreakdown: mapBreakdownCounts(
        group.categoryCounts,
        MODERATION_CATEGORY_ORDER
      ),
      senderBreakdown: mapBreakdownCounts(
        group.senderCounts,
        MODERATION_SENDER_ORDER
      ),
      latestRelationshipStage: group.latestRelationshipStage,
    }))
    .sort((left, right) => {
      if (right.criticalCount !== left.criticalCount) {
        return right.criticalCount - left.criticalCount
      }

      if (right.escalatedCount !== left.escalatedCount) {
        return right.escalatedCount - left.escalatedCount
      }

      if (right.unresolvedCount !== left.unresolvedCount) {
        return right.unresolvedCount - left.unresolvedCount
      }

      return (
        new Date(right.lastIncidentAt).getTime() -
        new Date(left.lastIncidentAt).getTime()
      )
    })
}

function mapModerationQueueIncident(
  incident: AdminModerationRecord
): ModerationQueueIncident {
  return {
    id: incident.id,
    category: incident.category,
    severity: incident.severity,
    status: incident.status,
    enforcementAction: incident.enforcementAction,
    redactedPreview: incident.redactedPreview,
    matchedSignals: normalizeMatchedSignals(incident.matchedSignals),
    relationshipStageSnapshot: incident.relationshipStageSnapshot,
    contentTypeSnapshot: incident.contentTypeSnapshot,
    senderRoleSnapshot: incident.senderRoleSnapshot,
    userLabel: formatUserLabel(incident.user),
    createdAt: incident.createdAt.toISOString(),
    enforcedAt: incident.enforcedAt?.toISOString() ?? null,
    reviewedAt: incident.reviewedAt?.toISOString() ?? null,
    reviewedByLabel: incident.reviewedBy
      ? formatUserLabel(incident.reviewedBy)
      : null,
    reviewerNote: incident.reviewerNote ?? null,
    reviewHistory: incident.reviewEvents.map(mapReviewHistoryEntry),
  }
}

function mapReviewHistoryEntry(
  event: AdminModerationReviewEventRecord
): ModerationReviewHistoryEntry {
  return {
    id: event.id,
    actorType: event.actorType,
    actorLabel: event.actorUser
      ? formatUserLabel(event.actorUser)
      : 'System automation',
    fromStatus: event.fromStatus,
    toStatus: event.toStatus,
    reasonCode: event.reasonCode,
    note: event.note ?? null,
    createdAt: event.createdAt.toISOString(),
  }
}

function buildModerationAnalyticsRange(
  incidents: AdminModerationRecord[],
  days: 7 | 30,
  now: Date
): ModerationAnalyticsRange {
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  const scopedIncidents = incidents.filter(
    (incident) => incident.createdAt >= cutoff
  )
  const latestReviewEvents = scopedIncidents
    .map((incident) => ({
      incident,
      latestEvent: incident.reviewEvents[0] ?? null,
    }))
    .filter(
      (
        entry
      ): entry is {
        incident: AdminModerationRecord
        latestEvent: AdminModerationReviewEventRecord
      } => entry.latestEvent !== null
    )
  const falsePositiveCount = latestReviewEvents.filter(
    (entry) => entry.latestEvent.reasonCode === 'FALSE_POSITIVE'
  ).length
  const firstReviewHours = scopedIncidents
    .map((incident) => {
      const firstEvent = incident.reviewEvents
        .slice()
        .sort(
          (left, right) => left.createdAt.getTime() - right.createdAt.getTime()
        )[0]
      return firstEvent
        ? hoursBetween(incident.createdAt, firstEvent.createdAt)
        : null
    })
    .filter((value): value is number => value !== null)
  const resolutionHours = scopedIncidents
    .map((incident) => {
      const resolutionEvent = incident.reviewEvents
        .slice()
        .sort(
          (left, right) => left.createdAt.getTime() - right.createdAt.getTime()
        )
        .find((event) => ['RESOLVED', 'DISMISSED'].includes(event.toStatus))

      return resolutionEvent
        ? hoursBetween(incident.createdAt, resolutionEvent.createdAt)
        : null
    })
    .filter((value): value is number => value !== null)

  return {
    days,
    totalIncidents: scopedIncidents.length,
    byCategory: countIncidentBreakdown(
      scopedIncidents,
      (incident) => incident.category,
      MODERATION_CATEGORY_ORDER
    ),
    bySeverity: countIncidentBreakdown(
      scopedIncidents,
      (incident) => incident.severity,
      MODERATION_SEVERITY_ORDER
    ),
    byStatus: countIncidentBreakdown(
      scopedIncidents,
      (incident) => incident.status,
      MODERATION_STATUS_SORT_ORDER
    ),
    bySenderRole: countIncidentBreakdown(
      scopedIncidents,
      (incident) => incident.senderRoleSnapshot,
      MODERATION_SENDER_ORDER
    ),
    byEnforcementAction: countIncidentBreakdown(
      scopedIncidents.filter(
        (incident) => incident.enforcementAction !== 'NONE'
      ),
      (incident) => incident.enforcementAction,
      MODERATION_ENFORCEMENT_ORDER
    ),
    byReasonCode: countIncidentBreakdown(
      latestReviewEvents,
      (entry) => entry.latestEvent.reasonCode,
      MODERATION_REASON_ORDER
    ),
    falsePositiveRate:
      latestReviewEvents.length === 0
        ? null
        : roundToSingleDecimal(
            (falsePositiveCount / latestReviewEvents.length) * 100
          ),
    medianTimeToFirstReviewHours: median(firstReviewHours),
    medianTimeToResolutionHours: median(resolutionHours),
    repeatUsers: buildRepeatUsers(scopedIncidents),
  }
}

function buildRepeatUsers(incidents: AdminModerationRecord[]) {
  const counts = new Map<string, ModerationAnalyticsRepeatUser>()

  for (const incident of incidents) {
    if (!UNRESOLVED_MODERATION_STATUSES.includes(incident.status)) {
      continue
    }

    const existing = counts.get(incident.user.id) ?? {
      userId: incident.user.id,
      userLabel: formatUserLabel(incident.user),
      unresolvedCount: 0,
    }

    existing.unresolvedCount += 1
    counts.set(incident.user.id, existing)
  }

  return Array.from(counts.values())
    .filter((entry) => entry.unresolvedCount > 1)
    .sort((left, right) => {
      if (right.unresolvedCount !== left.unresolvedCount) {
        return right.unresolvedCount - left.unresolvedCount
      }

      return left.userLabel.localeCompare(right.userLabel)
    })
    .slice(0, 5)
}

function countIncidentBreakdown<T extends string, TValue>(
  values: TValue[],
  getKey: (value: TValue) => T,
  sortOrder: Record<T, number>
) {
  const counts = new Map<T, number>()

  for (const value of values) {
    const key = getKey(value)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return mapBreakdownCounts(counts, sortOrder)
}

function mapBreakdownCounts<T extends string>(
  values: Map<T, number>,
  sortOrder: Record<T, number>
) {
  return Array.from(values.entries())
    .map(([value, count]) => ({
      value,
      count,
    }))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count
      }

      return sortOrder[left.value] - sortOrder[right.value]
    })
}

function sortIncidentRows(
  left: ModerationQueueIncident,
  right: ModerationQueueIncident
) {
  const statusDelta =
    MODERATION_STATUS_SORT_ORDER[left.status] -
    MODERATION_STATUS_SORT_ORDER[right.status]

  if (statusDelta !== 0) {
    return statusDelta
  }

  return (
    new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  )
}

function parseFilterValue<T extends string>(
  value: string | undefined,
  allowedValues: readonly T[],
  fallback: ModerationQueueFilterValue<T>
) {
  if (!value) {
    return fallback
  }

  if (value === 'ALL') {
    return 'ALL'
  }

  return allowedValues.includes(value as T) ? (value as T) : fallback
}

function normalizeMatchedSignals(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((signal): signal is string => typeof signal === 'string')
}

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function formatUserLabel(user: {
  id: string
  name: string | null
  email: string | null
  companionProfile: {
    preferredName: string | null
  } | null
}) {
  return formatAdminUserLabel({
    preferredName: user.companionProfile?.preferredName ?? null,
    name: user.name ?? null,
    email: user.email ?? null,
    fallbackId: user.id,
  })
}

function pluralize(count: number) {
  return count === 1 ? '' : 's'
}

function formatModerationCategory(value: ModerationIncidentCategory) {
  switch (value) {
    case 'EXPLICIT_SEXUAL':
      return 'explicit sexual'
    case 'MINOR_SAFETY':
      return 'minor safety'
    case 'ROMANCE_ESCALATION':
      return 'romance escalation'
    case 'POLICY_BYPASS':
      return 'policy bypass'
  }
}

function hoursBetween(start: Date, end: Date) {
  return (end.getTime() - start.getTime()) / (60 * 60 * 1000)
}

function median(values: number[]) {
  if (values.length === 0) {
    return null
  }

  const sorted = values.slice().sort((left, right) => left - right)
  const middleIndex = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 1) {
    return roundToSingleDecimal(sorted[middleIndex] ?? 0)
  }

  return roundToSingleDecimal(
    ((sorted[middleIndex - 1] ?? 0) + (sorted[middleIndex] ?? 0)) / 2
  )
}

function roundToSingleDecimal(value: number) {
  return Math.round(value * 10) / 10
}
