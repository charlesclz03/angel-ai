import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  getServerAuthSessionMock,
  loadModerationAnalyticsDashboardMock,
  redirectMock,
} = vi.hoisted(() => ({
  getServerAuthSessionMock: vi.fn(),
  loadModerationAnalyticsDashboardMock: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`)
  }),
}))

vi.mock('@/lib/auth', () => ({
  getServerAuthSession: getServerAuthSessionMock,
}))

vi.mock('@/lib/admin/moderation', () => ({
  loadModerationAnalyticsDashboard: loadModerationAnalyticsDashboardMock,
}))

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}))

import AdminModerationAnalyticsPage from '@/app/admin/moderation/analytics/page'

function buildAnalyticsDashboard() {
  return {
    generatedAt: '2026-03-25T16:00:00.000Z',
    ranges: [
      {
        days: 7,
        totalIncidents: 4,
        byCategory: [{ value: 'MINOR_SAFETY', count: 1 }],
        bySeverity: [{ value: 'CRITICAL', count: 1 }],
        byStatus: [{ value: 'OPEN', count: 2 }],
        bySenderRole: [{ value: 'USER', count: 3 }],
        byEnforcementAction: [{ value: 'BLOCKED_INPUT', count: 1 }],
        byReasonCode: [{ value: 'FALSE_POSITIVE', count: 1 }],
        falsePositiveRate: 25,
        medianTimeToFirstReviewHours: 3.5,
        medianTimeToResolutionHours: 4,
        repeatUsers: [
          {
            userId: 'user-2',
            userLabel: 'Alex',
            unresolvedCount: 2,
          },
        ],
      },
      {
        days: 30,
        totalIncidents: 10,
        byCategory: [{ value: 'POLICY_BYPASS', count: 4 }],
        bySeverity: [{ value: 'HIGH', count: 6 }],
        byStatus: [{ value: 'ESCALATED', count: 3 }],
        bySenderRole: [{ value: 'ANGEL', count: 2 }],
        byEnforcementAction: [{ value: 'BLOCKED_INPUT', count: 2 }],
        byReasonCode: [{ value: 'POLICY_CONFIRMED', count: 3 }],
        falsePositiveRate: 10,
        medianTimeToFirstReviewHours: 2,
        medianTimeToResolutionHours: 5,
        repeatUsers: [],
      },
    ],
  }
}

describe('/admin/moderation/analytics page', () => {
  beforeEach(() => {
    getServerAuthSessionMock.mockReset()
    loadModerationAnalyticsDashboardMock.mockReset()
    redirectMock.mockClear()
  })

  it('redirects guests to onboarding', async () => {
    getServerAuthSessionMock.mockResolvedValue(null)

    await expect(AdminModerationAnalyticsPage()).rejects.toThrow(
      'REDIRECT:/onboarding'
    )
  })

  it('redirects non-admin users back to chat', async () => {
    getServerAuthSessionMock.mockResolvedValue({
      user: { id: 'user-1', role: 'USER' },
    })

    await expect(AdminModerationAnalyticsPage()).rejects.toThrow(
      'REDIRECT:/chat'
    )
  })

  it('renders redacted moderation analytics for admins', async () => {
    getServerAuthSessionMock.mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    })
    loadModerationAnalyticsDashboardMock.mockResolvedValue(
      buildAnalyticsDashboard()
    )

    const page = await AdminModerationAnalyticsPage()

    render(page)

    expect(
      screen.getByRole('heading', {
        name: /redacted moderation trends and response timing\./i,
      })
    ).toBeInTheDocument()
    expect(screen.getAllByText(/7-day window/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/blocked input/i).length).toBeGreaterThan(0)
    expect(
      screen.getAllByText(/false-positive rate/i).length
    ).toBeGreaterThan(0)
    expect(screen.getByText(/25%/i)).toBeInTheDocument()
    expect(screen.getByText(/alex/i)).toBeInTheDocument()
    expect(screen.getAllByText(/30-day window/i).length).toBeGreaterThan(0)
  })
})
