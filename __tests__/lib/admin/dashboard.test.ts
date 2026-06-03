import { beforeEach, describe, expect, it, vi } from 'vitest'

const prismaMock = vi.hoisted(() => ({
  user: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
  conversation: {
    count: vi.fn(),
  },
  memoryEntry: {
    count: vi.fn(),
  },
  connectedSocialAccount: {
    count: vi.fn(),
  },
  pushSubscription: {
    count: vi.fn(),
  },
  touchpoint: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
  socialScanJob: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
  subscription: {
    count: vi.fn(),
  },
  photoMemory: {
    count: vi.fn(),
    groupBy: vi.fn(),
  },
}))

const {
  loadModerationDashboardSummaryMock,
  loadModerationDashboardAlertsMock,
  loadModerationNeedsAttentionSummaryMock,
} = vi.hoisted(() => ({
  loadModerationDashboardSummaryMock: vi.fn(),
  loadModerationDashboardAlertsMock: vi.fn(),
  loadModerationNeedsAttentionSummaryMock: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

vi.mock('@/lib/admin/moderation', () => ({
  loadModerationDashboardSummary: loadModerationDashboardSummaryMock,
  loadModerationDashboardAlerts: loadModerationDashboardAlertsMock,
  loadModerationNeedsAttentionSummary: loadModerationNeedsAttentionSummaryMock,
}))

import { loadAdminDashboard } from '@/lib/admin/dashboard'

describe('admin dashboard service', () => {
  beforeEach(() => {
    loadModerationDashboardSummaryMock.mockReset()
    loadModerationDashboardAlertsMock.mockReset()
    loadModerationNeedsAttentionSummaryMock.mockReset()
  })

  it('builds metadata-first operational summaries and merges moderation alerts', async () => {
    loadModerationDashboardSummaryMock.mockResolvedValue([
      {
        label: 'Open',
        value: 4,
        helper: 'First-pass incident review still pending',
      },
      {
        label: 'Critical',
        value: 1,
        helper: 'Unresolved incidents with the highest severity',
      },
      {
        label: 'Escalated',
        value: 1,
        helper: 'Queued for deeper operator follow-up',
      },
    ])
    loadModerationDashboardAlertsMock.mockResolvedValue([
      {
        id: 'moderation-user-2',
        kind: 'MODERATION_ESCALATED',
        title: 'Escalated moderation review pending',
        detail: '1 escalated incident waiting for deeper review.',
        userLabel: 'alex@example.com',
        occurredAt: '2026-03-24T12:15:00.000Z',
      },
      {
        id: 'moderation-user-1',
        kind: 'MODERATION_CRITICAL',
        title: 'Critical moderation review needed',
        detail: '1 critical unresolved incident across 2 unresolved total.',
        userLabel: 'Charlie',
        occurredAt: '2026-03-24T12:05:00.000Z',
      },
    ])
    loadModerationNeedsAttentionSummaryMock.mockResolvedValue([
      {
        label: 'Critical unresolved',
        value: 1,
        helper: 'Critical incidents still waiting on a full operator pass',
      },
      {
        label: 'Stale review',
        value: 2,
        helper: 'Open or under-review incidents older than 24 hours',
      },
      {
        label: 'Auto-escalated',
        value: 1,
        helper: 'Escalated by system automation after review SLAs were missed',
      },
    ])
    prismaMock.user.count
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(9)
      .mockResolvedValueOnce(3)
    prismaMock.conversation.count
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(6)
    prismaMock.memoryEntry.count.mockResolvedValue(42)
    prismaMock.connectedSocialAccount.count.mockResolvedValue(5)
    prismaMock.pushSubscription.count.mockResolvedValue(4)
    prismaMock.touchpoint.count
      .mockResolvedValueOnce(6)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1)
    prismaMock.socialScanJob.count
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1)
    prismaMock.subscription.count
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2)
    prismaMock.photoMemory.count
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(2)
    prismaMock.photoMemory.groupBy.mockResolvedValue([
      { userId: 'user-1' },
      { userId: 'user-2' },
    ])
    prismaMock.user.findMany.mockResolvedValue([
      {
        id: 'user-1',
        name: 'Charlie',
        email: 'charlie@example.com',
        role: 'USER',
        createdAt: new Date('2026-03-23T10:00:00.000Z'),
        companionProfile: { preferredName: 'Charlie' },
        soulProfile: { relationshipStage: 'WARM_FRIEND' },
        subscription: { tier: 'CORE' },
        conversations: [
          { lastMessageAt: new Date('2026-03-24T09:00:00.000Z') },
        ],
        touchpoints: [
          {
            scheduledFor: new Date('2026-03-24T18:00:00.000Z'),
            type: 'FOLLOWUP',
          },
        ],
        _count: {
          connectedSocialAccounts: 1,
          pushSubscriptions: 1,
        },
      },
    ])
    prismaMock.socialScanJob.findMany.mockResolvedValue([
      {
        id: 'scan-1',
        platform: 'INSTAGRAM',
        lastErrorCode: 'TOKEN_EXPIRED',
        updatedAt: new Date('2026-03-24T11:00:00.000Z'),
        user: {
          name: 'Charlie',
          email: 'charlie@example.com',
          companionProfile: { preferredName: 'Charlie' },
        },
      },
    ])
    prismaMock.touchpoint.findMany.mockResolvedValue([
      {
        id: 'touchpoint-1',
        type: 'EMOTIONAL_CHECKIN',
        scheduledFor: new Date('2026-03-24T08:30:00.000Z'),
        user: {
          name: null,
          email: 'ops@example.com',
          companionProfile: null,
        },
      },
    ])

    const dashboard = await loadAdminDashboard(
      new Date('2026-03-24T12:00:00.000Z')
    )

    expect(dashboard.overview[0]).toMatchObject({
      label: 'Users',
      value: 12,
    })
    expect(dashboard.funnel).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Users created', value: 12 }),
        expect.objectContaining({ label: 'Onboarding complete', value: 9 }),
        expect.objectContaining({ label: 'First thread active', value: 6 }),
        expect.objectContaining({ label: 'Push-enabled', value: 3 }),
        expect.objectContaining({ label: 'Photo memory adopters', value: 2 }),
      ])
    )
    expect(dashboard.continuityHealth).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Tier mix', value: 6 }),
        expect.objectContaining({ label: 'Overdue touchpoints', value: 2 }),
        expect.objectContaining({ label: 'Push coverage', value: 3 }),
        expect.objectContaining({ label: 'Photo memories this month', value: 2 }),
      ])
    )
    expect(dashboard.subscriptionBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Free', value: 6 }),
        expect.objectContaining({ label: 'Core', value: 4 }),
        expect.objectContaining({ label: 'Pro', value: 2 }),
      ])
    )
    expect(dashboard.moderationSummary).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Open', value: 4 }),
        expect.objectContaining({ label: 'Critical', value: 1 }),
        expect.objectContaining({ label: 'Escalated', value: 1 }),
      ])
    )
    expect(dashboard.moderationNeedsAttention).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Critical unresolved', value: 1 }),
        expect.objectContaining({ label: 'Stale review', value: 2 }),
        expect.objectContaining({ label: 'Auto-escalated', value: 1 }),
      ])
    )
    expect(dashboard.recentUsers[0]).toMatchObject({
      displayLabel: 'Charlie',
      onboardingComplete: true,
      subscriptionTier: 'CORE',
      relationshipStage: 'WARM_FRIEND',
      socialConnectionCount: 1,
    })
    expect(dashboard.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'MODERATION_ESCALATED',
          title: 'Escalated moderation review pending',
        }),
        expect.objectContaining({
          kind: 'MODERATION_CRITICAL',
          title: 'Critical moderation review needed',
        }),
        expect.objectContaining({
          kind: 'SOCIAL_SCAN_FAILED',
          title: 'INSTAGRAM scan failed',
        }),
        expect.objectContaining({
          kind: 'TOUCHPOINT_OVERDUE',
          title: 'Emotional check-in is overdue',
        }),
      ])
    )
    expect(dashboard.alerts[0]).toMatchObject({
      kind: 'MODERATION_ESCALATED',
      occurredAt: '2026-03-24T12:15:00.000Z',
    })
  })
})
