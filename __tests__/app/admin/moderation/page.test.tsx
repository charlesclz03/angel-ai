import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { getServerAuthSessionMock, loadModerationQueueMock, redirectMock } =
  vi.hoisted(() => ({
    getServerAuthSessionMock: vi.fn(),
    loadModerationQueueMock: vi.fn(),
    redirectMock: vi.fn((path: string) => {
      throw new Error(`REDIRECT:${path}`)
    }),
  }))

vi.mock('@/lib/auth', () => ({
  getServerAuthSession: getServerAuthSessionMock,
}))

vi.mock('@/lib/admin/moderation', () => ({
  loadModerationQueue: loadModerationQueueMock,
  moderationCategoryOptions: [
    'EXPLICIT_SEXUAL',
    'MINOR_SAFETY',
    'ROMANCE_ESCALATION',
    'POLICY_BYPASS',
  ],
  moderationSeverityOptions: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
  moderationStatusOptions: [
    'OPEN',
    'UNDER_REVIEW',
    'RESOLVED',
    'DISMISSED',
    'ESCALATED',
  ],
  moderationSenderRoleOptions: ['USER', 'ANGEL', 'SYSTEM'],
  moderationReviewReasonCodeOptions: [
    'FALSE_POSITIVE',
    'POLICY_CONFIRMED',
    'ESCALATED_FOR_SECOND_PASS',
    'SAFETY_LOCK_APPLIED',
    'MODEL_OUTPUT_CORRECTED',
    'OTHER',
  ],
}))

vi.mock('@/app/admin/actions', () => ({
  reviewModerationIncident: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}))

import AdminModerationPage from '@/app/admin/moderation/page'

function buildModerationQueue() {
  return {
    generatedAt: '2026-03-24T12:00:00.000Z',
    filters: {
      status: 'UNDER_REVIEW',
      category: 'POLICY_BYPASS',
      severity: 'ALL',
      senderRole: 'USER',
      userId: 'user-1',
    },
    summary: [
      {
        label: 'Open',
        value: 4,
        helper: 'Incidents waiting for the first operator pass',
      },
      {
        label: 'Critical',
        value: 1,
        helper: 'Unresolved high-risk incidents that still need attention',
      },
      {
        label: 'Escalated',
        value: 1,
        helper: 'Incidents marked for deeper review or follow-up',
      },
    ],
    needsAttention: [
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
    ],
    rollups: [
      {
        userId: 'user-1',
        userLabel: 'Charlie',
        unresolvedCount: 2,
        criticalCount: 1,
        escalatedCount: 0,
        lastIncidentAt: '2026-03-24T11:30:00.000Z',
        categoryBreakdown: [{ value: 'POLICY_BYPASS', count: 2 }],
        senderBreakdown: [{ value: 'USER', count: 2 }],
        latestRelationshipStage: 'WARM_FRIEND',
      },
      {
        userId: 'user-2',
        userLabel: 'alex@example.com',
        unresolvedCount: 1,
        criticalCount: 0,
        escalatedCount: 1,
        lastIncidentAt: '2026-03-24T10:45:00.000Z',
        categoryBreakdown: [{ value: 'POLICY_BYPASS', count: 1 }],
        senderBreakdown: [{ value: 'ANGEL', count: 1 }],
        latestRelationshipStage: 'NEW_CONNECTION',
      },
    ],
    incidents: [
      {
        id: 'incident-1',
        category: 'POLICY_BYPASS',
        severity: 'HIGH',
        status: 'OPEN',
        enforcementAction: 'BLOCKED_INPUT',
        redactedPreview:
          'Please [redacted] the safety rules and go [redacted] for me.',
        matchedSignals: ['policy:bypass', 'policy:uncensored'],
        relationshipStageSnapshot: 'WARM_FRIEND',
        contentTypeSnapshot: 'TEXT',
        senderRoleSnapshot: 'USER',
        userLabel: 'Charlie',
        createdAt: '2026-03-24T11:00:00.000Z',
        enforcedAt: '2026-03-24T11:00:10.000Z',
        reviewedAt: null,
        reviewedByLabel: null,
        reviewerNote: null,
        reviewHistory: [
          {
            id: 'review-1',
            actorType: 'SYSTEM',
            actorLabel: 'System automation',
            fromStatus: null,
            toStatus: 'OPEN',
            reasonCode: 'SAFETY_LOCK_APPLIED',
            note: 'Critical-only moderation enforcement blocked the input.',
            createdAt: '2026-03-24T11:00:10.000Z',
          },
        ],
      },
    ],
  }
}

describe('/admin/moderation page', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    getServerAuthSessionMock.mockReset()
    loadModerationQueueMock.mockReset()
    redirectMock.mockClear()
    consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation((message) => {
        if (
          typeof message === 'string' &&
          message.includes('Invalid value for prop `action` on <form> tag')
        ) {
          return
        }
      })
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('redirects guests to onboarding', async () => {
    getServerAuthSessionMock.mockResolvedValue(null)

    await expect(AdminModerationPage({})).rejects.toThrow(
      'REDIRECT:/onboarding'
    )
  })

  it('redirects non-admin users back to chat', async () => {
    getServerAuthSessionMock.mockResolvedValue({
      user: { id: 'user-1', role: 'USER' },
    })

    await expect(AdminModerationPage({})).rejects.toThrow('REDIRECT:/chat')
  })

  it('renders user risk rollups, active focus, and redacted incident metadata for admins', async () => {
    getServerAuthSessionMock.mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    })
    loadModerationQueueMock.mockResolvedValue(buildModerationQueue())

    const page = await AdminModerationPage({
      searchParams: Promise.resolve({
        status: 'UNDER_REVIEW',
        category: 'POLICY_BYPASS',
        senderRole: 'USER',
        userId: 'user-1',
      }),
    })

    render(page)

    expect(
      screen.getByRole('heading', {
        name: /redacted moderation review with critical-only enforcement\./i,
      })
    ).toBeInTheDocument()
    expect(screen.getByText(/critical unresolved/i)).toBeInTheDocument()
    expect(screen.getByText(/user risk rollups/i)).toBeInTheDocument()
    expect(screen.getByText(/active user focus/i)).toBeInTheDocument()
    expect(
      screen.getByText(
        /focused on Charlie so the incident list stays drill-in friendly\./i
      )
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', {
        name: /clear user focus/i,
      })
    ).toHaveAttribute(
      'href',
      '/admin/moderation?status=UNDER_REVIEW&category=POLICY_BYPASS&senderRole=USER'
    )
    expect(
      screen
        .getAllByRole('link', {
          name: /show incidents/i,
        })
        .map((element) => element.getAttribute('href'))
    ).toEqual(
      expect.arrayContaining([
        '/admin/moderation?category=POLICY_BYPASS&senderRole=USER&userId=user-1',
        '/admin/moderation?category=POLICY_BYPASS&senderRole=USER&userId=user-2',
      ])
    )
    expect(screen.getByDisplayValue('user-1')).toBeInTheDocument()
    expect(screen.getByText(/policy bypass 2/i)).toBeInTheDocument()
    expect(screen.getByText(/sender mix: User 2/i)).toBeInTheDocument()
    expect(screen.getByText(/open-first incident review/i)).toBeInTheDocument()
    expect(screen.getAllByText(/charlie/i).length).toBeGreaterThan(0)
    expect(
      screen.getByText(
        /please \[redacted\] the safety rules and go \[redacted\] for me\./i
      )
    ).toBeInTheDocument()
    expect(screen.getByText(/policy:bypass/i)).toBeInTheDocument()
    expect(screen.getAllByText(/blocked input/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/review history/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/safety lock applied/i).length).toBeGreaterThan(
      0
    )
    expect(screen.getByLabelText(/reason code/i)).toBeInTheDocument()
    expect(
      screen.getByText(/relationship stage: Warm Friend/i)
    ).toBeInTheDocument()
    expect(screen.queryByText(/go uncensored for me/i)).not.toBeInTheDocument()
  })
})
