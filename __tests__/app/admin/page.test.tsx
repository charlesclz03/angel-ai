import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getServerAuthSessionMock, loadAdminDashboardMock, redirectMock } =
  vi.hoisted(() => ({
    getServerAuthSessionMock: vi.fn(),
    loadAdminDashboardMock: vi.fn(),
    redirectMock: vi.fn((path: string) => {
      throw new Error(`REDIRECT:${path}`)
    }),
  }))

vi.mock('@/lib/auth', () => ({
  getServerAuthSession: getServerAuthSessionMock,
}))

vi.mock('@/lib/admin/dashboard', () => ({
  loadAdminDashboard: loadAdminDashboardMock,
}))

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}))

import AdminPage from '@/app/admin/page'

function buildDashboard() {
  return {
    generatedAt: '2026-03-24T12:00:00.000Z',
    overview: [
      {
        label: 'Users',
        value: 12,
        helper: '9 onboarding complete - 1 admins - 2 beta testers',
      },
      {
        label: 'Paid subscriptions',
        value: 6,
        helper: '4 Core - 2 Pro',
      },
      {
        label: 'Relationship records',
        value: 42,
        helper: '7 active threads - 5 connected social accounts',
      },
      {
        label: 'Continuity pressure',
        value: 3,
        helper: '2 overdue touchpoints - 1 failed scans',
      },
    ],
    funnel: [
      {
        label: 'Users created',
        value: 12,
        helper: 'Accounts created so far.',
      },
      {
        label: 'Push-enabled',
        value: 3,
        helper: 'Users with at least one device endpoint and app-level alerts still enabled.',
      },
    ],
    queueHealth: [
      {
        label: 'Scheduled touchpoints',
        value: 6,
        helper: '4 registered push endpoints',
      },
    ],
    continuityHealth: [
      {
        label: 'Tier mix',
        value: 6,
        helper: '6 Free - 4 Core - 2 Pro',
      },
      {
        label: 'Photo memories this month',
        value: 2,
        helper: '5 total snapshots - 2 adopters so far.',
      },
    ],
    subscriptionBreakdown: [
      {
        label: 'Free',
        value: 6,
        helper: 'No active paid continuity tier',
      },
    ],
    moderationSummary: [
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
    ],
    moderationNeedsAttention: [
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
    recentUsers: [
      {
        id: 'user-1',
        displayLabel: 'Charlie',
        role: 'USER',
        createdAt: '2026-03-23T10:00:00.000Z',
        onboardingComplete: true,
        relationshipStage: 'WARM_FRIEND',
        subscriptionTier: 'CORE',
        socialConnectionCount: 1,
        pushSubscriptionCount: 1,
        lastMessageAt: '2026-03-24T09:00:00.000Z',
        nextTouchpointAt: '2026-03-24T18:00:00.000Z',
        nextTouchpointType: 'FOLLOWUP',
      },
    ],
    alerts: [
      {
        id: 'moderation-1',
        kind: 'MODERATION_CRITICAL',
        title: 'Critical moderation review needed',
        detail: '1 critical unresolved incident across 2 unresolved total.',
        userLabel: 'Charlie',
        occurredAt: '2026-03-24T11:30:00.000Z',
      },
      {
        id: 'scan-1',
        kind: 'SOCIAL_SCAN_FAILED',
        title: 'INSTAGRAM scan failed',
        detail: 'Last provider code: TOKEN_EXPIRED',
        userLabel: 'Charlie',
        occurredAt: '2026-03-24T11:00:00.000Z',
      },
    ],
  }
}

describe('/admin page', () => {
  beforeEach(() => {
    getServerAuthSessionMock.mockReset()
    loadAdminDashboardMock.mockReset()
    redirectMock.mockClear()
  })

  it('redirects guests to onboarding', async () => {
    getServerAuthSessionMock.mockResolvedValue(null)

    await expect(AdminPage()).rejects.toThrow('REDIRECT:/onboarding')
  })

  it('redirects non-admin users back to chat', async () => {
    getServerAuthSessionMock.mockResolvedValue({
      user: { id: 'user-1', role: 'USER' },
    })

    await expect(AdminPage()).rejects.toThrow('REDIRECT:/chat')
  })

  it('renders the admin dashboard for admins, including moderation alerts', async () => {
    getServerAuthSessionMock.mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    })
    loadAdminDashboardMock.mockResolvedValue(buildDashboard())

    const page = await AdminPage()

    render(page)

    expect(
      screen.getByRole('heading', {
        name: /internal operations, kept metadata-first\./i,
      })
    ).toBeInTheDocument()
    expect(
      screen.getByText(/continuity and ingestion pressure/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/metadata-first conversion checkpoints/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/delivery posture at a glance/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/critical-only enforcement with redacted review/i)
    ).toBeInTheDocument()
    expect(screen.getAllByText(/critical unresolved/i).length).toBeGreaterThan(
      0
    )
    expect(screen.getAllByText(/charlie/i).length).toBeGreaterThan(0)
    expect(
      screen.getByText(/critical moderation review needed/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/moderation \/ critical/i)).toBeInTheDocument()
    expect(screen.getByText(/instagram scan failed/i)).toBeInTheDocument()
  })
})
