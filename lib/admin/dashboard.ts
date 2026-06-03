import type {
  RelationshipStage,
  SocialPlatform,
  TouchpointType,
} from '@prisma/client'

import {
  loadModerationDashboardAlerts,
  loadModerationDashboardSummary,
  loadModerationNeedsAttentionSummary,
} from '@/lib/admin/moderation'
import { formatAdminUserLabel } from '@/lib/admin/shared'
import { prisma } from '@/lib/prisma'

export interface AdminDashboardStat {
  label: string
  value: number
  helper: string
}

export interface AdminDashboardRecentUser {
  id: string
  displayLabel: string
  role: string
  createdAt: string
  onboardingComplete: boolean
  relationshipStage: RelationshipStage | null
  subscriptionTier: string
  socialConnectionCount: number
  pushSubscriptionCount: number
  lastMessageAt: string | null
  nextTouchpointAt: string | null
  nextTouchpointType: TouchpointType | null
}

export interface AdminDashboardAlert {
  id: string
  kind:
    | 'SOCIAL_SCAN_FAILED'
    | 'TOUCHPOINT_OVERDUE'
    | 'MODERATION_CRITICAL'
    | 'MODERATION_ESCALATED'
  title: string
  detail: string
  userLabel: string
  occurredAt: string
}

export interface AdminDashboard {
  generatedAt: string
  overview: AdminDashboardStat[]
  funnel: AdminDashboardStat[]
  queueHealth: AdminDashboardStat[]
  continuityHealth: AdminDashboardStat[]
  subscriptionBreakdown: AdminDashboardStat[]
  moderationSummary: AdminDashboardStat[]
  moderationNeedsAttention: AdminDashboardStat[]
  recentUsers: AdminDashboardRecentUser[]
  alerts: AdminDashboardAlert[]
}

export async function loadAdminDashboard(
  now = new Date()
): Promise<AdminDashboard> {
  const moderationSummaryPromise = loadModerationDashboardSummary()
  const moderationAlertsPromise = loadModerationDashboardAlerts()
  const moderationNeedsAttentionPromise =
    loadModerationNeedsAttentionSummary(now)

  const [
    totalUsers,
    adminCount,
    betaTesterCount,
    onboardingCompleteCount,
    activeConversationCount,
    activeThreadUserCount,
    memoryEntryCount,
    connectedSocialAccountCount,
    pushSubscriptionCount,
    pushEnabledUserCount,
    scheduledTouchpointCount,
    overdueTouchpointCount,
    continuityExposureCount,
    pendingArchiveProposalCount,
    queuedSocialScanCount,
    failedSocialScanCount,
    coreSubscriberCount,
    proSubscriberCount,
    photoMemoryCount,
    photoMemoryThisMonthCount,
    photoMemoryAdopterGroups,
    recentUsers,
    failedSocialScans,
    overdueTouchpoints,
    moderationSummary,
    moderationNeedsAttention,
    moderationAlerts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.user.count({ where: { role: 'BETA_TESTER' } }),
    prisma.user.count({
      where: {
        companionProfile: { isNot: null },
        soulProfile: { isNot: null },
      },
    }),
    prisma.conversation.count({ where: { status: 'ACTIVE' } }),
    prisma.conversation.count({
      where: {
        status: 'ACTIVE',
        messages: {
          some: {},
        },
      },
    }),
    prisma.memoryEntry.count({ where: { isHidden: false } }),
    prisma.connectedSocialAccount.count(),
    prisma.pushSubscription.count(),
    prisma.user.count({
      where: {
        pushSubscriptions: {
          some: {},
        },
        OR: [
          {
            preferences: {
              is: null,
            },
          },
          {
            preferences: {
              is: {
                pushNotificationsEnabled: true,
              },
            },
          },
        ],
      },
    }),
    prisma.touchpoint.count({ where: { status: 'SCHEDULED' } }),
    prisma.touchpoint.count({
      where: {
        status: 'SCHEDULED',
        scheduledFor: { lte: now },
      },
    }),
    prisma.touchpoint.count({
      where: {
        type: 'FOLLOWUP',
        status: 'SENT',
      },
    }),
    prisma.touchpoint.count({
      where: {
        status: 'SCHEDULED',
        type: 'MEDIA_ARCHIVE_PROPOSAL',
      },
    }),
    prisma.socialScanJob.count({
      where: { status: { in: ['QUEUED', 'RUNNING'] } },
    }),
    prisma.socialScanJob.count({ where: { status: 'FAILED' } }),
    prisma.subscription.count({ where: { tier: 'CORE' } }),
    prisma.subscription.count({ where: { tier: 'PRO' } }),
    prisma.photoMemory.count(),
    prisma.photoMemory.count({
      where: {
        createdAt: {
          gte: getMonthStart(now),
        },
      },
    }),
    prisma.photoMemory.groupBy({
      by: ['userId'],
    }),
    prisma.user.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        companionProfile: {
          select: { preferredName: true },
        },
        soulProfile: {
          select: { relationshipStage: true },
        },
        subscription: {
          select: { tier: true },
        },
        conversations: {
          where: { status: 'ACTIVE' },
          orderBy: { lastMessageAt: 'desc' },
          take: 1,
          select: { lastMessageAt: true },
        },
        touchpoints: {
          where: { status: 'SCHEDULED' },
          orderBy: { scheduledFor: 'asc' },
          take: 1,
          select: {
            scheduledFor: true,
            type: true,
          },
        },
        _count: {
          select: {
            connectedSocialAccounts: true,
            pushSubscriptions: true,
          },
        },
      },
    }),
    prisma.socialScanJob.findMany({
      take: 4,
      where: { status: 'FAILED' },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        platform: true,
        lastErrorCode: true,
        updatedAt: true,
        user: {
          select: {
            name: true,
            email: true,
            companionProfile: {
              select: { preferredName: true },
            },
          },
        },
      },
    }),
    prisma.touchpoint.findMany({
      take: 4,
      where: {
        status: 'SCHEDULED',
        scheduledFor: { lte: now },
      },
      orderBy: { scheduledFor: 'asc' },
      select: {
        id: true,
        type: true,
        scheduledFor: true,
        user: {
          select: {
            name: true,
            email: true,
            companionProfile: {
              select: { preferredName: true },
            },
          },
        },
      },
    }),
    moderationSummaryPromise,
    moderationNeedsAttentionPromise,
    moderationAlertsPromise,
  ])

  const freeUserCount = Math.max(
    totalUsers - coreSubscriberCount - proSubscriberCount,
    0
  )
  const paidSubscriberCount = coreSubscriberCount + proSubscriberCount
  const photoMemoryAdopterCount = photoMemoryAdopterGroups.length

  return {
    generatedAt: now.toISOString(),
    overview: [
      {
        label: 'Users',
        value: totalUsers,
        helper: `${onboardingCompleteCount} onboarding complete - ${adminCount} admins - ${betaTesterCount} beta testers`,
      },
      {
        label: 'Paid subscriptions',
        value: paidSubscriberCount,
        helper: `${coreSubscriberCount} Core - ${proSubscriberCount} Pro`,
      },
      {
        label: 'Relationship records',
        value: memoryEntryCount,
        helper: `${activeConversationCount} active threads - ${connectedSocialAccountCount} connected social accounts - ${photoMemoryCount} photo memories`,
      },
      {
        label: 'Continuity pressure',
        value: overdueTouchpointCount + failedSocialScanCount,
        helper: `${overdueTouchpointCount} overdue touchpoints - ${failedSocialScanCount} failed scans`,
      },
    ],
    funnel: [
      {
        label: 'Users created',
        value: totalUsers,
        helper: 'Accounts created so far.',
      },
      {
        label: 'Onboarding complete',
        value: onboardingCompleteCount,
        helper: `${formatPercent(onboardingCompleteCount, totalUsers)} of created users reached a saved relationship profile.`,
      },
      {
        label: 'First thread active',
        value: activeThreadUserCount,
        helper: 'Users with an active relationship thread and saved messages.',
      },
      {
        label: 'Continuity exposed',
        value: continuityExposureCount,
        helper: 'Users who already received a follow-up continuity wake-up.',
      },
      {
        label: 'Paid Core + Pro',
        value: paidSubscriberCount,
        helper: `${formatPercent(paidSubscriberCount, totalUsers)} conversion from created accounts.`,
      },
      {
        label: 'Push-enabled',
        value: pushEnabledUserCount,
        helper:
          'Users with at least one device endpoint and app-level alerts still enabled.',
      },
      {
        label: 'Photo memory adopters',
        value: photoMemoryAdopterCount,
        helper: `${photoMemoryCount} snapshots generated across the current launch cohort.`,
      },
    ],
    queueHealth: [
      {
        label: 'Scheduled touchpoints',
        value: scheduledTouchpointCount,
        helper: `${pushSubscriptionCount} registered push endpoints`,
      },
      {
        label: 'Overdue touchpoints',
        value: overdueTouchpointCount,
        helper: 'Still waiting to deliver or resolve',
      },
      {
        label: 'Queued social scans',
        value: queuedSocialScanCount,
        helper: 'Waiting or currently running',
      },
      {
        label: 'Archive proposals pending',
        value: pendingArchiveProposalCount,
        helper: 'Media offload prompts still scheduled',
      },
    ],
    continuityHealth: [
      {
        label: 'Tier mix',
        value: paidSubscriberCount,
        helper: `${freeUserCount} Free - ${coreSubscriberCount} Core - ${proSubscriberCount} Pro`,
      },
      {
        label: 'Overdue touchpoints',
        value: overdueTouchpointCount,
        helper: 'Still waiting to deliver or resolve.',
      },
      {
        label: 'Push coverage',
        value: pushEnabledUserCount,
        helper: `${pushSubscriptionCount} active endpoints across users still opted in.`,
      },
      {
        label: 'Photo memories this month',
        value: photoMemoryThisMonthCount,
        helper: `${photoMemoryCount} total snapshots - ${photoMemoryAdopterCount} adopters so far.`,
      },
    ],
    subscriptionBreakdown: [
      {
        label: 'Free',
        value: freeUserCount,
        helper: 'No active paid continuity tier',
      },
      {
        label: 'Core',
        value: coreSubscriberCount,
        helper: 'GPT-5 mini continuity tier',
      },
      {
        label: 'Pro',
        value: proSubscriberCount,
        helper: 'Highest-fidelity continuity tier',
      },
    ],
    moderationSummary,
    moderationNeedsAttention,
    recentUsers: recentUsers.map((user) => ({
      id: user.id,
      displayLabel: formatAdminUserLabel({
        preferredName: user.companionProfile?.preferredName ?? null,
        name: user.name ?? null,
        email: user.email ?? null,
        fallbackId: user.id,
      }),
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      onboardingComplete: Boolean(user.companionProfile && user.soulProfile),
      relationshipStage: user.soulProfile?.relationshipStage ?? null,
      subscriptionTier: user.subscription?.tier ?? 'FREE',
      socialConnectionCount: user._count.connectedSocialAccounts,
      pushSubscriptionCount: user._count.pushSubscriptions,
      lastMessageAt:
        user.conversations[0]?.lastMessageAt?.toISOString() ?? null,
      nextTouchpointAt:
        user.touchpoints[0]?.scheduledFor?.toISOString() ?? null,
      nextTouchpointType: user.touchpoints[0]?.type ?? null,
    })),
    alerts: buildAdminAlerts({
      moderationAlerts,
      failedSocialScans,
      overdueTouchpoints,
    }),
  }
}

function buildAdminAlerts({
  moderationAlerts,
  failedSocialScans,
  overdueTouchpoints,
}: {
  moderationAlerts: AdminDashboardAlert[]
  failedSocialScans: Array<{
    id: string
    platform: SocialPlatform
    lastErrorCode: string | null
    updatedAt: Date
    user: {
      name: string | null
      email: string | null
      companionProfile: {
        preferredName: string | null
      } | null
    }
  }>
  overdueTouchpoints: Array<{
    id: string
    type: TouchpointType
    scheduledFor: Date
    user: {
      name: string | null
      email: string | null
      companionProfile: {
        preferredName: string | null
      } | null
    }
  }>
}) {
  const scanAlerts: AdminDashboardAlert[] = failedSocialScans.map((job) => ({
    id: `scan-${job.id}`,
    kind: 'SOCIAL_SCAN_FAILED',
    title: `${formatSocialPlatform(job.platform)} scan failed`,
    detail: job.lastErrorCode
      ? `Last provider code: ${job.lastErrorCode}`
      : 'No provider error code was stored.',
    userLabel: formatAdminUserLabel({
      preferredName: job.user.companionProfile?.preferredName ?? null,
      name: job.user.name,
      email: job.user.email,
      fallbackId: job.id,
    }),
    occurredAt: job.updatedAt.toISOString(),
  }))

  const touchpointAlerts: AdminDashboardAlert[] = overdueTouchpoints.map(
    (touchpoint) => ({
      id: `touchpoint-${touchpoint.id}`,
      kind: 'TOUCHPOINT_OVERDUE',
      title: `${formatTouchpointType(touchpoint.type)} is overdue`,
      detail: 'The touchpoint is still scheduled past its intended send time.',
      userLabel: formatAdminUserLabel({
        preferredName: touchpoint.user.companionProfile?.preferredName ?? null,
        name: touchpoint.user.name,
        email: touchpoint.user.email,
        fallbackId: touchpoint.id,
      }),
      occurredAt: touchpoint.scheduledFor.toISOString(),
    })
  )

  return [...moderationAlerts, ...scanAlerts, ...touchpointAlerts]
    .sort(
      (left, right) =>
        new Date(right.occurredAt).getTime() -
        new Date(left.occurredAt).getTime()
    )
    .slice(0, 8)
}

function formatSocialPlatform(platform: SocialPlatform) {
  switch (platform) {
    case 'LINKEDIN':
      return 'LinkedIn'
    case 'TIKTOK':
      return 'TikTok'
    default:
      return platform
  }
}

function formatTouchpointType(type: TouchpointType) {
  switch (type) {
    case 'EMOTIONAL_CHECKIN':
      return 'Emotional check-in'
    case 'FOLLOWUP':
      return 'Follow-up'
    case 'EVENING_MESSAGE':
      return 'Evening message'
    case 'POST_PAYWALL_READ_ONLY':
      return 'Read-only continuity prompt'
    case 'MEDIA_ARCHIVE_PROPOSAL':
      return 'Media archive proposal'
  }
}

function formatPercent(value: number, total: number) {
  if (total <= 0) {
    return '0%'
  }

  return `${Math.round((value / total) * 100)}%`
}

function getMonthStart(now: Date) {
  const monthStart = new Date(now)
  monthStart.setUTCDate(1)
  monthStart.setUTCHours(0, 0, 0, 0)
  return monthStart
}
