import { beforeEach, describe, expect, it, vi } from 'vitest'

const prismaMock = vi.hoisted(() => ({
  moderationIncident: {
    count: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  moderationReviewEvent: {
    create: vi.fn(),
  },
  $transaction: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

import {
  loadModerationAnalyticsDashboard,
  loadModerationDashboardAlerts,
  loadModerationQueue,
  runModerationEscalationSweep,
  updateModerationIncidentReview,
} from '@/lib/admin/moderation'

function buildReviewEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: 'review-event-1',
    actorType: 'ADMIN',
    fromStatus: 'OPEN',
    toStatus: 'UNDER_REVIEW',
    reasonCode: 'POLICY_CONFIRMED',
    note: 'Confirmed by manual review.',
    createdAt: new Date('2026-03-25T10:15:00.000Z'),
    actorUser: {
      id: 'admin-1',
      name: 'Morgan',
      email: 'morgan@example.com',
      companionProfile: null,
    },
    ...overrides,
  }
}

function buildIncidentRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'incident-default',
    category: 'POLICY_BYPASS',
    severity: 'HIGH',
    status: 'OPEN',
    enforcementAction: 'NONE',
    redactedPreview: 'Please [redacted] the rules.',
    matchedSignals: ['policy:bypass'],
    relationshipStageSnapshot: 'WARM_FRIEND',
    contentTypeSnapshot: 'TEXT',
    senderRoleSnapshot: 'USER',
    reviewerNote: null,
    createdAt: new Date('2026-03-25T10:00:00.000Z'),
    enforcedAt: null,
    reviewedAt: null,
    user: {
      id: 'user-1',
      name: 'Charlie',
      email: 'charlie@example.com',
      companionProfile: { preferredName: 'Charlie' },
    },
    reviewedBy: null,
    reviewEvents: [] as ReturnType<typeof buildReviewEvent>[],
    ...overrides,
  }
}

describe('admin moderation service', () => {
  beforeEach(() => {
    prismaMock.moderationIncident.count.mockReset()
    prismaMock.moderationIncident.findMany.mockReset()
    prismaMock.moderationIncident.findUnique.mockReset()
    prismaMock.moderationIncident.update.mockReset()
    prismaMock.moderationReviewEvent.create.mockReset()
    prismaMock.$transaction.mockReset()
    prismaMock.$transaction.mockImplementation(
      async (callback: (tx: typeof prismaMock) => unknown) => callback(prismaMock)
    )
  })

  it('builds unresolved user rollups, urgency stats, and review history in the queue', async () => {
    prismaMock.moderationIncident.count
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
    prismaMock.moderationIncident.findMany
      .mockResolvedValueOnce([
        buildIncidentRecord({
          id: 'incident-u1-critical',
          category: 'MINOR_SAFETY',
          severity: 'CRITICAL',
          enforcementAction: 'BLOCKED_INPUT',
          enforcedAt: new Date('2026-03-25T10:02:00.000Z'),
          matchedSignals: ['minor:underage', 'explicit:sex'],
          createdAt: new Date('2026-03-25T10:00:00.000Z'),
        }),
        buildIncidentRecord({
          id: 'incident-u2-escalated',
          user: {
            id: 'user-2',
            name: null,
            email: 'alex@example.com',
            companionProfile: null,
          },
          category: 'ROMANCE_ESCALATION',
          severity: 'HIGH',
          status: 'ESCALATED',
          senderRoleSnapshot: 'ANGEL',
          relationshipStageSnapshot: 'NEW_CONNECTION',
          createdAt: new Date('2026-03-25T09:45:00.000Z'),
        }),
        buildIncidentRecord({
          id: 'incident-u2-open',
          user: {
            id: 'user-2',
            name: null,
            email: 'alex@example.com',
            companionProfile: null,
          },
          category: 'EXPLICIT_SEXUAL',
          severity: 'MEDIUM',
          senderRoleSnapshot: 'USER',
          relationshipStageSnapshot: 'NEW_CONNECTION',
          createdAt: new Date('2026-03-25T09:30:00.000Z'),
        }),
      ])
      .mockResolvedValueOnce([
        buildIncidentRecord({
          id: 'incident-under-review',
          status: 'UNDER_REVIEW',
          reviewEvents: [
            buildReviewEvent({
              id: 'review-1',
              actorType: 'SYSTEM',
              actorUser: null,
              fromStatus: null,
              toStatus: 'OPEN',
              reasonCode: 'SAFETY_LOCK_APPLIED',
              note: 'Critical-only moderation enforcement blocked the input.',
              createdAt: new Date('2026-03-25T10:02:00.000Z'),
            }),
            buildReviewEvent({
              id: 'review-2',
              fromStatus: 'OPEN',
              toStatus: 'UNDER_REVIEW',
              reasonCode: 'POLICY_CONFIRMED',
              createdAt: new Date('2026-03-25T10:15:00.000Z'),
            }),
          ],
          reviewerNote: 'Watching for repetition.',
          reviewedAt: new Date('2026-03-25T10:15:00.000Z'),
          reviewedBy: {
            id: 'admin-1',
            name: 'Morgan',
            email: 'morgan@example.com',
            companionProfile: null,
          },
        }),
        buildIncidentRecord({
          id: 'incident-open',
          category: 'MINOR_SAFETY',
          severity: 'CRITICAL',
          enforcementAction: 'BLOCKED_INPUT',
          enforcedAt: new Date('2026-03-25T10:20:00.000Z'),
          reviewEvents: [
            buildReviewEvent({
              id: 'review-3',
              actorType: 'SYSTEM',
              actorUser: null,
              fromStatus: null,
              toStatus: 'OPEN',
              reasonCode: 'SAFETY_LOCK_APPLIED',
              note: 'Critical-only moderation enforcement blocked the input.',
              createdAt: new Date('2026-03-25T10:20:00.000Z'),
            }),
          ],
          createdAt: new Date('2026-03-25T10:20:00.000Z'),
        }),
      ])

    const queue = await loadModerationQueue({}, new Date('2026-03-26T10:30:00Z'))

    expect(queue.summary).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Open', value: 4 }),
        expect.objectContaining({ label: 'Critical', value: 1 }),
        expect.objectContaining({ label: 'Escalated', value: 1 }),
      ])
    )
    expect(queue.needsAttention).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Critical unresolved', value: 1 }),
        expect.objectContaining({ label: 'Stale review', value: 2 }),
        expect.objectContaining({ label: 'Auto-escalated', value: 1 }),
      ])
    )
    expect(queue.rollups[0]).toMatchObject({
      userId: 'user-1',
      userLabel: 'Charlie',
      unresolvedCount: 1,
      criticalCount: 1,
      escalatedCount: 0,
      latestRelationshipStage: 'WARM_FRIEND',
    })
    expect(queue.rollups[1]).toMatchObject({
      userId: 'user-2',
      userLabel: 'alex@example.com',
      unresolvedCount: 2,
      criticalCount: 0,
      escalatedCount: 1,
      latestRelationshipStage: 'NEW_CONNECTION',
    })
    expect(queue.incidents[0]).toMatchObject({
      id: 'incident-open',
      enforcementAction: 'BLOCKED_INPUT',
      matchedSignals: ['policy:bypass'],
    })
    expect(queue.incidents[0].reviewHistory[0]).toMatchObject({
      actorType: 'SYSTEM',
      actorLabel: 'System automation',
      reasonCode: 'SAFETY_LOCK_APPLIED',
    })
  })

  it('applies user drill-in filters to both unresolved rollups and incident rows', async () => {
    prismaMock.moderationIncident.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
    prismaMock.moderationIncident.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    await loadModerationQueue({
      status: 'UNDER_REVIEW',
      category: 'POLICY_BYPASS',
      severity: 'HIGH',
      senderRole: 'USER',
      userId: 'user-2',
    })

    expect(prismaMock.moderationIncident.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: {
          category: 'POLICY_BYPASS',
          severity: 'HIGH',
          senderRoleSnapshot: 'USER',
          userId: 'user-2',
          status: {
            in: ['OPEN', 'UNDER_REVIEW', 'ESCALATED'],
          },
        },
      })
    )
    expect(prismaMock.moderationIncident.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: {
          category: 'POLICY_BYPASS',
          severity: 'HIGH',
          senderRoleSnapshot: 'USER',
          userId: 'user-2',
          status: 'UNDER_REVIEW',
        },
      })
    )
  })

  it('emits one dashboard alert per affected user, ordered by recency', async () => {
    prismaMock.moderationIncident.findMany.mockResolvedValue([
      buildIncidentRecord({
        id: 'incident-critical',
        category: 'MINOR_SAFETY',
        severity: 'CRITICAL',
        createdAt: new Date('2026-03-25T10:10:00.000Z'),
      }),
      buildIncidentRecord({
        id: 'incident-escalated',
        user: {
          id: 'user-2',
          name: null,
          email: 'alex@example.com',
          companionProfile: null,
        },
        category: 'ROMANCE_ESCALATION',
        status: 'ESCALATED',
        senderRoleSnapshot: 'ANGEL',
        createdAt: new Date('2026-03-25T10:20:00.000Z'),
      }),
    ])

    const alerts = await loadModerationDashboardAlerts()

    expect(alerts).toHaveLength(2)
    expect(alerts[0]).toMatchObject({
      kind: 'MODERATION_ESCALATED',
      userLabel: 'alex@example.com',
      occurredAt: '2026-03-25T10:20:00.000Z',
    })
    expect(alerts[1]).toMatchObject({
      kind: 'MODERATION_CRITICAL',
      userLabel: 'Charlie',
      occurredAt: '2026-03-25T10:10:00.000Z',
    })
  })

  it('writes append-only review events and syncs latest-state review metadata', async () => {
    const now = new Date('2026-03-25T13:00:00.000Z')
    prismaMock.moderationIncident.findUnique.mockResolvedValue({
      id: 'incident-1',
      status: 'OPEN',
    })
    prismaMock.moderationReviewEvent.create.mockResolvedValue({
      id: 'review-1',
    })
    prismaMock.moderationIncident.update.mockResolvedValue({
      id: 'incident-1',
    })

    await updateModerationIncidentReview({
      incidentId: 'incident-1',
      status: 'RESOLVED',
      reasonCode: 'FALSE_POSITIVE',
      reviewerNote: 'False alarm after manual review.',
      reviewedByUserId: 'admin-1',
      now,
    })

    expect(prismaMock.moderationReviewEvent.create).toHaveBeenCalledWith({
      data: {
        incidentId: 'incident-1',
        actorType: 'ADMIN',
        actorUserId: 'admin-1',
        fromStatus: 'OPEN',
        toStatus: 'RESOLVED',
        reasonCode: 'FALSE_POSITIVE',
        note: 'False alarm after manual review.',
        createdAt: now,
      },
    })
    expect(prismaMock.moderationIncident.update).toHaveBeenCalledWith({
      where: { id: 'incident-1' },
      data: {
        status: 'RESOLVED',
        reviewerNote: 'False alarm after manual review.',
        reviewedAt: now,
        reviewedByUserId: 'admin-1',
      },
    })
  })

  it('builds analytics ranges with enforcement counts, review reasons, false positives, and repeat users', async () => {
    prismaMock.moderationIncident.findMany.mockResolvedValue([
      buildIncidentRecord({
        id: 'incident-1',
        category: 'MINOR_SAFETY',
        severity: 'CRITICAL',
        status: 'OPEN',
        enforcementAction: 'BLOCKED_INPUT',
        createdAt: new Date('2026-03-24T12:00:00.000Z'),
        reviewEvents: [
          buildReviewEvent({
            id: 'review-1',
            actorType: 'SYSTEM',
            actorUser: null,
            fromStatus: null,
            toStatus: 'OPEN',
            reasonCode: 'SAFETY_LOCK_APPLIED',
            createdAt: new Date('2026-03-24T12:05:00.000Z'),
          }),
        ],
      }),
      buildIncidentRecord({
        id: 'incident-2',
        category: 'POLICY_BYPASS',
        status: 'DISMISSED',
        createdAt: new Date('2026-03-24T14:00:00.000Z'),
        reviewEvents: [
          buildReviewEvent({
            id: 'review-2',
            fromStatus: 'OPEN',
            toStatus: 'DISMISSED',
            reasonCode: 'FALSE_POSITIVE',
            createdAt: new Date('2026-03-24T18:00:00.000Z'),
          }),
        ],
      }),
      buildIncidentRecord({
        id: 'incident-3',
        user: {
          id: 'user-2',
          name: 'Alex',
          email: 'alex@example.com',
          companionProfile: null,
        },
        category: 'EXPLICIT_SEXUAL',
        status: 'UNDER_REVIEW',
        createdAt: new Date('2026-03-25T09:00:00.000Z'),
        reviewEvents: [
          buildReviewEvent({
            id: 'review-3',
            fromStatus: 'OPEN',
            toStatus: 'UNDER_REVIEW',
            reasonCode: 'POLICY_CONFIRMED',
            createdAt: new Date('2026-03-25T12:00:00.000Z'),
          }),
        ],
      }),
      buildIncidentRecord({
        id: 'incident-4',
        user: {
          id: 'user-2',
          name: 'Alex',
          email: 'alex@example.com',
          companionProfile: null,
        },
        category: 'ROMANCE_ESCALATION',
        status: 'ESCALATED',
        senderRoleSnapshot: 'ANGEL',
        createdAt: new Date('2026-03-25T10:00:00.000Z'),
        reviewEvents: [
          buildReviewEvent({
            id: 'review-4',
            actorType: 'SYSTEM',
            actorUser: null,
            fromStatus: 'UNDER_REVIEW',
            toStatus: 'ESCALATED',
            reasonCode: 'ESCALATED_FOR_SECOND_PASS',
            createdAt: new Date('2026-03-25T15:00:00.000Z'),
          }),
        ],
      }),
    ])

    const analytics = await loadModerationAnalyticsDashboard(
      new Date('2026-03-25T16:00:00.000Z')
    )

    const sevenDayRange = analytics.ranges.find((range) => range.days === 7)
    expect(sevenDayRange).toBeDefined()
    expect(sevenDayRange).toMatchObject({
      totalIncidents: 4,
      falsePositiveRate: 25,
      medianTimeToFirstReviewHours: 3.5,
      medianTimeToResolutionHours: 4,
    })
    expect(sevenDayRange?.byEnforcementAction).toEqual([
      { value: 'BLOCKED_INPUT', count: 1 },
    ])
    expect(sevenDayRange?.byReasonCode).toEqual(
      expect.arrayContaining([
        { value: 'FALSE_POSITIVE', count: 1 },
        { value: 'POLICY_CONFIRMED', count: 1 },
        { value: 'ESCALATED_FOR_SECOND_PASS', count: 1 },
        { value: 'SAFETY_LOCK_APPLIED', count: 1 },
      ])
    )
    expect(sevenDayRange?.repeatUsers).toEqual([
      {
        userId: 'user-2',
        userLabel: 'Alex',
        unresolvedCount: 2,
      },
    ])
  })

  it('auto-escalates critical and stale unresolved incidents with system review events', async () => {
    prismaMock.moderationIncident.findMany.mockResolvedValue([
      {
        id: 'incident-critical',
        status: 'OPEN',
        severity: 'CRITICAL',
        createdAt: new Date('2026-03-25T09:00:00.000Z'),
        reviewedAt: null,
      },
      {
        id: 'incident-stale',
        status: 'UNDER_REVIEW',
        severity: 'HIGH',
        createdAt: new Date('2026-03-24T07:00:00.000Z'),
        reviewedAt: new Date('2026-03-24T09:00:00.000Z'),
      },
    ])
    prismaMock.moderationIncident.findUnique.mockImplementation(
      async ({ where }: { where: { id: string } }) => ({
        id: where.id,
        status: where.id === 'incident-stale' ? 'UNDER_REVIEW' : 'OPEN',
      })
    )
    prismaMock.moderationReviewEvent.create.mockResolvedValue({})
    prismaMock.moderationIncident.update.mockResolvedValue({})

    const result = await runModerationEscalationSweep(
      new Date('2026-03-25T10:00:00.000Z')
    )

    expect(result).toMatchObject({
      scannedCount: 2,
      escalatedCount: 2,
      criticalEscalatedCount: 1,
      staleEscalatedCount: 1,
    })
    expect(prismaMock.moderationReviewEvent.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          incidentId: 'incident-critical',
          actorType: 'SYSTEM',
          toStatus: 'ESCALATED',
          reasonCode: 'ESCALATED_FOR_SECOND_PASS',
        }),
      })
    )
    expect(prismaMock.moderationIncident.update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { id: 'incident-stale' },
        data: expect.objectContaining({
          status: 'ESCALATED',
          reviewedByUserId: null,
        }),
      })
    )
  })
})
