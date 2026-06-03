import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  requireServerAuthSessionMock,
  updateModerationIncidentReviewMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  requireServerAuthSessionMock: vi.fn(),
  updateModerationIncidentReviewMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  requireServerAuthSession: requireServerAuthSessionMock,
}))

vi.mock('@/lib/admin/moderation', () => ({
  updateModerationIncidentReview: updateModerationIncidentReviewMock,
}))

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
}))

import { reviewModerationIncident } from '@/app/admin/actions'

describe('admin moderation actions', () => {
  beforeEach(() => {
    requireServerAuthSessionMock.mockReset()
    updateModerationIncidentReviewMock.mockReset()
    revalidatePathMock.mockReset()
  })

  it('updates the moderation status, note, reviewer, and timestamps for admins', async () => {
    requireServerAuthSessionMock.mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    })
    updateModerationIncidentReviewMock.mockResolvedValue({
      id: 'incident-1',
    })

    const result = await reviewModerationIncident({
      incidentId: 'incident-1',
      status: 'ESCALATED',
      reasonCode: 'ESCALATED_FOR_SECOND_PASS',
      reviewerNote: 'Needs a deeper policy pass.',
    })

    expect(result).toEqual({ success: true })
    expect(updateModerationIncidentReviewMock).toHaveBeenCalledTimes(1)
    expect(updateModerationIncidentReviewMock).toHaveBeenCalledWith(
      expect.objectContaining({
        incidentId: 'incident-1',
        status: 'ESCALATED',
        reasonCode: 'ESCALATED_FOR_SECOND_PASS',
        reviewerNote: 'Needs a deeper policy pass.',
        reviewedByUserId: 'admin-1',
      })
    )
    expect(revalidatePathMock).toHaveBeenCalledWith('/admin')
    expect(revalidatePathMock).toHaveBeenCalledWith('/admin/moderation')
    expect(revalidatePathMock).toHaveBeenCalledWith(
      '/admin/moderation/analytics'
    )
  })

  it('rejects non-admin reviewers', async () => {
    requireServerAuthSessionMock.mockResolvedValue({
      user: { id: 'user-1', role: 'USER' },
    })

    await expect(
      reviewModerationIncident({
        incidentId: 'incident-1',
        status: 'UNDER_REVIEW',
        reasonCode: 'POLICY_CONFIRMED',
      })
    ).rejects.toThrow(/only admins can review moderation incidents/i)
  })
})
