'use server'

import { revalidatePath } from 'next/cache'

import { requireServerAuthSession } from '@/lib/auth'
import {
  completeOnboardingForUser,
  loadOnboardingStateForUser,
  persistOnboardingStep,
} from '@/lib/angel/onboarding-service'
import {
  canCompleteOnboardingDraft,
  normalizeOnboardingDraftInput,
  type OnboardingDraft,
  type OnboardingState,
  type OnboardingStepInput,
} from '@/lib/angel/onboarding-state'

export async function saveOnboardingStep(
  input: OnboardingStepInput
): Promise<OnboardingState> {
  const session = await requireServerAuthSession(
    'Please sign in before continuing onboarding.'
  )

  await persistOnboardingStep(session.user.id, input)
  revalidatePath('/onboarding')

  return loadOnboardingStateForUser({
    id: session.user.id,
    name: session.user.name,
  })
}

export async function completeOnboarding(
  input: OnboardingDraft
): Promise<OnboardingState> {
  const session = await requireServerAuthSession(
    'Please sign in before continuing onboarding.'
  )
  const draft = normalizeOnboardingDraftInput(input)

  if (!canCompleteOnboardingDraft(draft)) {
    throw new Error('The onboarding draft is still missing required answers.')
  }

  await completeOnboardingForUser(
    {
      id: session.user.id,
      name: session.user.name,
    },
    draft
  )
  revalidatePath('/onboarding')
  revalidatePath('/chat')

  return loadOnboardingStateForUser({
    id: session.user.id,
    name: session.user.name,
  })
}
