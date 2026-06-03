import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AngelOnboardingFlow } from '@/components/organisms/AngelOnboardingFlow'
import {
  buildPreAuthOnboardingState,
  getDefaultOnboardingDraft,
  onboardingStepOrder,
  type OnboardingState,
} from '@/lib/angel/onboarding-state'
import { buildDefaultSocialScanState } from '@/lib/social/types'

const {
  signInMock,
  saveOnboardingStepMock,
  completeOnboardingMock,
  startSocialConnectMock,
  rescanSocialAccountMock,
  disconnectSocialAccountMock,
  deleteImportedSocialDataMock,
  routerPushMock,
  routerRefreshMock,
} =
  vi.hoisted(() => ({
    signInMock: vi.fn(),
    saveOnboardingStepMock: vi.fn(),
    completeOnboardingMock: vi.fn(),
    startSocialConnectMock: vi.fn(),
    rescanSocialAccountMock: vi.fn(),
    disconnectSocialAccountMock: vi.fn(),
    deleteImportedSocialDataMock: vi.fn(),
    routerPushMock: vi.fn(),
    routerRefreshMock: vi.fn(),
  }))

vi.mock('next-auth/react', () => ({
  signIn: signInMock,
}))

vi.mock('@/app/onboarding/actions', () => ({
  saveOnboardingStep: saveOnboardingStepMock,
  completeOnboarding: completeOnboardingMock,
}))

vi.mock('@/app/social/actions', () => ({
  startSocialConnect: startSocialConnectMock,
  rescanSocialAccount: rescanSocialAccountMock,
  disconnectSocialAccount: disconnectSocialAccountMock,
  deleteImportedSocialData: deleteImportedSocialDataMock,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: routerPushMock,
    refresh: routerRefreshMock,
  }),
}))

describe('AngelOnboardingFlow', () => {
  beforeEach(() => {
    signInMock.mockReset()
    saveOnboardingStepMock.mockReset()
    completeOnboardingMock.mockReset()
    startSocialConnectMock.mockReset()
    rescanSocialAccountMock.mockReset()
    disconnectSocialAccountMock.mockReset()
    deleteImportedSocialDataMock.mockReset()
    routerPushMock.mockReset()
    routerRefreshMock.mockReset()
    window.sessionStorage.clear()
  })

  it('stores the pre-auth draft and moves into the Google sign-in step', async () => {
    render(
      <AngelOnboardingFlow
        initialState={buildPreAuthOnboardingState()}
        isAuthenticated={false}
      />
    )

    fireEvent.change(screen.getByPlaceholderText('Preferred name'), {
      target: { value: 'Charlie' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save and continue/i }))

    expect(
      screen.getByRole('button', { name: /continue with google/i })
    ).toBeInTheDocument()

    await waitFor(() =>
      expect(
        window.sessionStorage.getItem('angel-ai.onboarding.draft') ?? ''
      ).toContain('Charlie')
    )
  })

  it('calls Google sign-in from the grounding step while unauthenticated', () => {
    render(
      <AngelOnboardingFlow
        initialState={{
          ...buildPreAuthOnboardingState(),
          currentStep: 'grounding',
          draft: getDefaultOnboardingDraft({ preferredName: 'Charlie' }),
        }}
        isAuthenticated={false}
      />
    )

    fireEvent.click(
      screen.getByRole('button', { name: /continue with google/i })
    )

    expect(signInMock).toHaveBeenCalledWith('google', {
      callbackUrl: '/onboarding',
    })
  })

  it('renders the continuity state once onboarding is complete', () => {
    const draft = getDefaultOnboardingDraft({
      preferredName: 'Charlie',
      isAdult: true,
      timezone: 'Europe/Lisbon',
      tonePreference: 'Warm and grounded.',
      communicationStyle: 'Honest and easy to answer.',
      checkinPreference: 'Gentle touchpoints that feel natural.',
      relationshipIntent: 'GROW_OVER_TIME',
      interests: ['music'],
      emotionalNeeds: ['gentleness'],
      birthDate: '1997-07-24',
      angelName: 'Noor',
      coreTone: 'Soft, steady, and observant.',
    })

    const completedState: OnboardingState = {
      status: 'complete',
      currentStep: 'promise-of-tomorrow',
      savedSteps: [...onboardingStepOrder],
      draft,
      canComplete: true,
      scheduledTouchpointAt: '2026-03-19T18:45:00.000Z',
      scheduledTouchpointLabel: 'Thursday, March 19 at 6:45 PM',
      socialScanState: buildDefaultSocialScanState(),
    }

    render(
      <AngelOnboardingFlow
        initialState={completedState}
        isAuthenticated={true}
        userDisplayName="Charles"
      />
    )

    expect(screen.getByText(/continuity locked/i)).toBeInTheDocument()
    expect(screen.getAllByText(/thursday, march 19 at 6:45 pm/i)).toHaveLength(
      2
    )
  })
})
