'use server'

import { revalidatePath } from 'next/cache'

import { requireServerAuthSession } from '@/lib/auth'
import { updateModerationIncidentReview } from '@/lib/admin/moderation'
import {
  isModerationReviewReasonCode,
  isReviewableModerationStatus,
  type ReviewableModerationStatus,
} from '@/lib/angel/moderation'
import type { ModerationReviewReasonCode } from '@prisma/client'

export interface ReviewModerationIncidentInput {
  incidentId: string
  status: ReviewableModerationStatus
  reasonCode: ModerationReviewReasonCode
  reviewerNote?: string
}

export async function reviewModerationIncident(
  input: ReviewModerationIncidentInput
) {
  const session = await requireServerAuthSession(
    'Please sign in before reviewing moderation incidents.'
  )

  if (session.user.role !== 'ADMIN') {
    throw new Error('Only admins can review moderation incidents.')
  }

  if (
    !input.incidentId?.trim() ||
    !isReviewableModerationStatus(input.status) ||
    !isModerationReviewReasonCode(input.reasonCode)
  ) {
    throw new Error('Invalid moderation review payload.')
  }

  await updateModerationIncidentReview({
    incidentId: input.incidentId.trim(),
    status: input.status,
    reasonCode: input.reasonCode,
    reviewerNote: input.reviewerNote,
    reviewedByUserId: session.user.id,
  })

  revalidatePath('/admin')
  revalidatePath('/admin/moderation')
  revalidatePath('/admin/moderation/analytics')

  return { success: true }
}
