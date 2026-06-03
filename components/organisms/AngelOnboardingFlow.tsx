'use client'

import { useEffect, useState, useTransition, type ReactNode } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import {
  ArrowRight,
  Check,
  LoaderCircle,
  PenLine,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  Unplug,
} from 'lucide-react'

import {
  completeOnboarding,
  saveOnboardingStep,
} from '@/app/onboarding/actions'
import {
  deleteImportedSocialData,
  disconnectSocialAccount,
  rescanSocialAccount,
  startSocialConnect,
} from '@/app/social/actions'
import { Button } from '@/components/atoms/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import {
  angelImplementationRecommendations,
  angelRecommendationPills,
} from '@/lib/angel/config'
import { relationshipIntentOptions } from '@/lib/angel/memory'
import { angelOnboardingStages } from '@/lib/angel/onboarding'
import {
  buildGeneratedReflection,
  buildOnboardingAnswersFromDraft,
  buildPreviewMarkdown,
  canCompleteOnboardingDraft,
  getOnboardingStep,
  normalizeOnboardingDraftInput,
  normalizeStringList,
  onboardingStepOrder,
  validateTimeZone,
  type OnboardingDraft,
  type OnboardingState,
  type OnboardingStepKey,
} from '@/lib/angel/onboarding-state'
import type {
  SocialPlatformKey,
  SocialScanStateRecord,
} from '@/lib/social/types'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'angel-ai.onboarding.draft'
const toneSuggestions = [
  'calm',
  'playful',
  'deep',
  'soft',
  'direct',
  'reassuring',
] as const
const mediaOptions = ['links', 'images', 'voice notes', 'music'] as const

interface AngelOnboardingFlowProps {
  initialState: OnboardingState
  isAuthenticated: boolean
  userDisplayName?: string | null
  initialNotice?: string | null
  initialError?: string | null
}

export function AngelOnboardingFlow({
  initialState,
  isAuthenticated,
  userDisplayName,
  initialNotice = null,
  initialError = null,
}: AngelOnboardingFlowProps) {
  const router = useRouter()
  const [state, setState] = useState(initialState)
  const [draft, setDraft] = useState(initialState.draft)
  const [currentStep, setCurrentStep] = useState(initialState.currentStep)
  const [notice, setNotice] = useState<string | null>(initialNotice)
  const [error, setError] = useState<string | null>(initialError)
  const [previewMode, setPreviewMode] = useState<'user' | 'soul'>('user')
  const [socialActionKey, setSocialActionKey] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const currentStage = getOnboardingStep(currentStep)
  const reflection = draft.reflectionSummary || buildGeneratedReflection(draft)
  const preview = buildPreviewMarkdown(draft, { userName: userDisplayName })
  const stepIndex = Math.max(0, onboardingStepOrder.indexOf(currentStep))
  const previousStep = stepIndex > 0 ? onboardingStepOrder[stepIndex - 1] : null
  const progressPercent =
    state.status === 'complete'
      ? 100
      : Math.round(((stepIndex + 1) / onboardingStepOrder.length) * 100)
  const previewContent =
    previewMode === 'user' ? preview.userMarkdown : preview.soulMarkdown

  useEffect(() => {
    setState(initialState)
    setDraft(initialState.draft)
    setCurrentStep(initialState.currentStep)
    setNotice(initialNotice)
    setError(initialError)
  }, [initialError, initialNotice, initialState])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const storedValue = window.sessionStorage.getItem(STORAGE_KEY)
    if (!storedValue) {
      return
    }

    try {
      const storedDraft = JSON.parse(storedValue) as Partial<OnboardingDraft>
      if (!state.savedSteps.includes('arrival') && storedDraft.preferredName) {
        setDraft((currentDraft) =>
          normalizeOnboardingDraftInput({
            ...currentDraft,
            preferredName: storedDraft.preferredName,
          })
        )

        if (!isAuthenticated && currentStep === 'arrival') {
          setCurrentStep('grounding')
        }
      }
    } catch {
      window.sessionStorage.removeItem(STORAGE_KEY)
    }
  }, [currentStep, isAuthenticated, state.savedSteps])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (state.status === 'complete') {
      window.sessionStorage.removeItem(STORAGE_KEY)
      return
    }

    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  }, [draft, state.status])

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      state.savedSteps.includes('grounding')
    ) {
      return
    }

    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (browserTimeZone && browserTimeZone !== draft.timezone) {
      setDraft((currentDraft) =>
        normalizeOnboardingDraftInput({
          ...currentDraft,
          timezone: browserTimeZone,
        })
      )
    }
  }, [draft.timezone, state.savedSteps])

  function updateDraft<K extends keyof OnboardingDraft>(
    key: K,
    value: OnboardingDraft[K]
  ) {
    setDraft((currentDraft) =>
      normalizeOnboardingDraftInput({
        ...currentDraft,
        [key]: value,
      })
    )
  }

  function setListField(key: keyof OnboardingDraft, value: string) {
    updateDraft(key as never, normalizeStringList(value) as never)
  }

  function toggleMedia(option: string) {
    updateDraft(
      'mediaPreferences',
      draft.mediaPreferences.includes(option)
        ? draft.mediaPreferences.filter((item) => item !== option)
        : [...draft.mediaPreferences, option]
    )
  }

  function applyState(nextState: OnboardingState) {
    setState(nextState)
    setDraft(nextState.draft)
    setCurrentStep(nextState.currentStep)
  }

  async function handleSocialConnect(platform: SocialPlatformKey) {
    setSocialActionKey(`connect:${platform}`)
    setError(null)
    setNotice(null)

    try {
      const result = await startSocialConnect(platform)

      if (result.status !== 'redirect' || !result.url) {
        setError(
          result.message ??
            `${platform} is not configured in this environment yet.`
        )
        return
      }

      window.location.assign(result.url)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Angel could not start that social connection just now.'
      )
    } finally {
      setSocialActionKey(null)
    }
  }

  async function handleSocialMutation(
    platform: SocialPlatformKey,
    action: 'rescan' | 'disconnect' | 'delete'
  ) {
    setSocialActionKey(`${action}:${platform}`)
    setError(null)
    setNotice(null)

    try {
      const result =
        action === 'rescan'
          ? await rescanSocialAccount(platform)
          : action === 'disconnect'
            ? await disconnectSocialAccount(platform)
            : await deleteImportedSocialData(platform)

      if (result.status === 'error') {
        setError(result.message ?? 'That social action failed.')
        return
      }

      setNotice(result.message ?? 'Social context updated.')
      router.refresh()
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'That social action could not be completed right now.'
      )
    } finally {
      setSocialActionKey(null)
    }
  }

  async function persistArrivalIfNeeded() {
    if (state.savedSteps.includes('arrival') || !draft.preferredName.trim()) {
      return
    }

    const arrivalStep = buildOnboardingAnswersFromDraft(draft).find(
      (step) => step.stepKey === 'arrival'
    )

    if (arrivalStep) {
      await saveOnboardingStep(arrivalStep)
    }
  }

  function handleContinue() {
    const validationError = getValidationError(
      currentStep,
      draft,
      isAuthenticated
    )
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setNotice(null)

    if (currentStep === 'arrival') {
      setCurrentStep('grounding')
      setNotice('Your first detail is safe here until sign-in.')
      return
    }

    if (currentStep === 'grounding' && !isAuthenticated) {
      void signIn('google', { callbackUrl: '/onboarding' })
      return
    }

    startTransition(() => {
      void (async () => {
        try {
          if (currentStep !== 'arrival') {
            await persistArrivalIfNeeded()
          }

          if (currentStep === 'promise-of-tomorrow') {
            const nextState = await completeOnboarding({
              ...draft,
              reflectionSummary: reflection,
            })
            applyState(nextState)
            setNotice('Angel is carrying this forward now.')
            router.push('/chat')
            return
          }

          const stepInput = buildOnboardingAnswersFromDraft({
            ...draft,
            reflectionSummary: reflection,
          }).find((step) => step.stepKey === currentStep)

          if (!stepInput) {
            throw new Error('Unable to build this onboarding step.')
          }

          const nextState = await saveOnboardingStep(stepInput)
          applyState(nextState)
          setNotice(`${currentStage.title} saved.`)
        } catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : 'Something interrupted onboarding.'
          )
        }
      })()
    })
  }

  if (state.status === 'complete') {
    return (
      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="angel-panel-frosted animate-enter" padding="lg">
          <p className="angel-eyebrow">Continuity secured</p>
          <h2 className="mt-4 max-w-3xl font-display text-4xl tracking-[-0.05em] text-text-primary sm:text-[3.3rem]">
            Continuity Locked
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-text-secondary sm:text-lg">
            {draft.angelName || 'Angel'} knows how to come back without making
            tomorrow feel like a reset.
            {state.scheduledTouchpointLabel
              ? ` The first return is already marked for ${state.scheduledTouchpointLabel}.`
              : ' The first return is already held for tomorrow.'}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="angel-panel-soft p-5">
              <p className="angel-kicker">Tomorrow&apos;s return</p>
              <p className="mt-3 text-lg leading-8 text-text-primary">
                {state.scheduledTouchpointLabel ?? 'Scheduled for tomorrow'}
              </p>
            </div>
            <div className="angel-panel-soft p-5">
              <p className="angel-kicker">What Angel learned</p>
              <p className="mt-3 text-sm leading-7 text-text-secondary">
                {draft.preferredName || userDisplayName || 'You'} wanted this to
                feel {draft.tonePreference.toLowerCase() || 'steady'} and{' '}
                {getRelationshipIntentDescription(
                  draft.relationshipIntent
                ).toLowerCase()}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <Button asChild size="lg">
              <Link href="/chat">
                Enter the thread
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              type="button"
              variant="glass"
              onClick={() =>
                setPreviewMode((currentMode) =>
                  currentMode === 'user' ? 'soul' : 'user'
                )
              }
            >
              <PenLine className="h-4 w-4" />
              Review carried memory
            </Button>
          </div>
        </Card>

        <Card className="animate-enter" padding="lg">
          <CardHeader
            title="What Angel is carrying"
            subtitle="A lightweight memory preview seeded by onboarding."
            action={
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={previewMode === 'user' ? 'default' : 'glass'}
                  onClick={() => setPreviewMode('user')}
                >
                  User memory
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={previewMode === 'soul' ? 'default' : 'glass'}
                  onClick={() => setPreviewMode('soul')}
                >
                  Soul memory
                </Button>
              </div>
            }
          />

          <div className="angel-panel-soft overflow-hidden p-0">
            <pre className="max-h-[34rem] overflow-auto px-5 py-5 text-xs leading-6 text-text-secondary sm:text-[13px]">
              {previewContent}
            </pre>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <div className="space-y-6">
        <Card className="angel-panel-frosted animate-enter" padding="lg">
          <p className="angel-eyebrow">
            Stage {currentStage.stepNumber} of {onboardingStepOrder.length}
          </p>
          <h2 className="mt-4 max-w-3xl font-display text-4xl tracking-[-0.05em] text-text-primary sm:text-[3.15rem]">
            {currentStage.title}
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-text-secondary sm:text-lg">
            {currentStage.primaryPrompt}
          </p>

          {currentStage.followUps.length > 0 ? (
            <div className="mt-6 space-y-3">
              {currentStage.followUps.slice(0, 2).map((line) => (
                <div
                  key={line}
                  className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-4 text-sm leading-7 text-text-secondary"
                >
                  {line}
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-8">
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-primary transition-[width] duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.22em] text-text-tertiary">
              <span>
                Step {Math.min(stepIndex + 1, onboardingStepOrder.length)} in
                motion
              </span>
              <span>{progressPercent}% carried forward</span>
            </div>
          </div>

          {(notice || error) && (
            <div
              className={cn(
                'mt-6 rounded-[1.5rem] border px-5 py-4 text-sm leading-7',
                error
                  ? 'border-accent-error/40 bg-accent-error/10 text-text-primary'
                  : 'border-accent-primary/30 bg-accent-primary/10 text-text-primary'
              )}
            >
              {error ?? notice}
            </div>
          )}
        </Card>

        <Card className="animate-enter" padding="lg">
          <CardHeader
            title="Progress Signal"
            subtitle="One primary question at a time, with enough context to make the flow feel chosen."
          />
          <ol className="space-y-3">
            {angelOnboardingStages.map((stage) => {
              const isCurrent = stage.id === currentStep
              const isSaved = state.savedSteps.includes(
                stage.id as OnboardingStepKey
              )

              return (
                <li
                  key={stage.id}
                  className={cn(
                    'flex items-start gap-4 rounded-[1.4rem] border px-4 py-4 transition-colors',
                    isCurrent
                      ? 'border-accent-primary/40 bg-accent-primary/10'
                      : isSaved
                        ? 'border-white/10 bg-white/[0.03]'
                        : 'border-transparent bg-transparent'
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold uppercase tracking-[0.16em]',
                      isSaved
                        ? 'border-accent-brand/35 bg-accent-brand/15 text-text-primary'
                        : isCurrent
                          ? 'border-accent-primary/40 bg-accent-primary/10 text-text-primary'
                          : 'border-white/10 text-text-tertiary'
                    )}
                  >
                    {isSaved ? <Check className="h-4 w-4" /> : stage.stepNumber}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold tracking-[0.01em] text-text-primary">
                      {stage.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-text-secondary">
                      {stage.goal}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        </Card>

        <Card className="animate-enter" padding="lg">
          <CardHeader
            title="What This Stage Is Doing"
            subtitle="A little side-context, without letting the experience collapse into form-builder energy."
          />
          <div className="flex flex-wrap gap-2">
            {angelRecommendationPills.map((pill) => (
              <span key={pill} className="angel-chip">
                {pill}
              </span>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            <InfoBlock title="Captured next" items={currentStage.captures} />
            <InfoBlock
              title="Guardrails"
              items={[
                currentStage.recommendation,
                currentStage.completionRule,
                angelImplementationRecommendations[
                  (currentStage.stepNumber - 1) %
                    angelImplementationRecommendations.length
                ],
              ]}
            />
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="animate-enter" padding="lg">
          <CardHeader
            title={currentStage.title}
            subtitle={currentStage.goal}
            action={<span className="angel-kicker">Primary prompt</span>}
          />
          <div className="space-y-6">
            <StepForm
              currentStep={currentStep}
              draft={draft}
              reflection={reflection}
              isAuthenticated={isAuthenticated}
              socialScanState={state.socialScanState}
              socialActionKey={socialActionKey}
              toneSuggestions={toneSuggestions}
              mediaOptions={mediaOptions}
              setListField={setListField}
              toggleMedia={toggleMedia}
              updateDraft={updateDraft}
              onSocialConnect={handleSocialConnect}
              onSocialMutation={handleSocialMutation}
            />

            <div className="flex flex-wrap gap-4">
              {previousStep ? (
                <Button
                  type="button"
                  variant="glass"
                  onClick={() => {
                    setCurrentStep(previousStep)
                    setError(null)
                    setNotice(null)
                  }}
                >
                  Revisit previous step
                </Button>
              ) : null}
              <Button
                type="button"
                size="lg"
                isLoading={isPending}
                onClick={handleContinue}
              >
                {getPrimaryActionLabel(currentStep, isAuthenticated, isPending)}
                {!isPending ? <ArrowRight className="h-4 w-4" /> : null}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="animate-enter" padding="lg">
          <CardHeader
            title="What Angel Is Learning"
            subtitle="Structured memory first, richer emotional synthesis later."
            action={
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={previewMode === 'user' ? 'default' : 'glass'}
                  onClick={() => setPreviewMode('user')}
                >
                  User memory
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={previewMode === 'soul' ? 'default' : 'glass'}
                  onClick={() => setPreviewMode('soul')}
                >
                  Soul memory
                </Button>
              </div>
            }
          />

          <div className="angel-panel-soft p-5">
            <p className="text-sm leading-7 text-text-secondary">
              {currentStep === 'first-reflection'
                ? 'The reflection can still be refined before continuity is locked.'
                : 'The preview stays intentionally lightweight so the flow still feels intimate, not technical.'}
            </p>
          </div>

          <div className="angel-panel-soft mt-4 overflow-hidden p-0">
            <pre className="max-h-[30rem] overflow-auto px-5 py-5 text-xs leading-6 text-text-secondary sm:text-[13px]">
              {previewContent}
            </pre>
          </div>
        </Card>
      </div>
    </div>
  )
}

function InfoBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="angel-panel-soft p-5">
      <p className="angel-kicker">{title}</p>
      <ul className="mt-3 space-y-3">
        {items.map((item) => (
          <li key={item} className="text-sm leading-7 text-text-secondary">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function StepForm({
  currentStep,
  draft,
  reflection,
  isAuthenticated,
  socialScanState,
  socialActionKey,
  toneSuggestions,
  mediaOptions,
  setListField,
  toggleMedia,
  updateDraft,
  onSocialConnect,
  onSocialMutation,
}: {
  currentStep: OnboardingStepKey
  draft: OnboardingDraft
  reflection: string
  isAuthenticated: boolean
  socialScanState: SocialScanStateRecord[]
  socialActionKey: string | null
  toneSuggestions: readonly string[]
  mediaOptions: readonly string[]
  setListField: (key: keyof OnboardingDraft, value: string) => void
  toggleMedia: (option: string) => void
  updateDraft: <K extends keyof OnboardingDraft>(
    key: K,
    value: OnboardingDraft[K]
  ) => void
  onSocialConnect: (platform: SocialPlatformKey) => Promise<void>
  onSocialMutation: (
    platform: SocialPlatformKey,
    action: 'rescan' | 'disconnect' | 'delete'
  ) => Promise<void>
}) {
  switch (currentStep) {
    case 'arrival':
      return (
        <div className="space-y-5">
          <Field label="Preferred name">
            <input
              value={draft.preferredName}
              onChange={(event) =>
                updateDraft('preferredName', event.target.value)
              }
              placeholder="Preferred name"
              className="angel-input mt-2"
            />
          </Field>
          <div className="angel-panel-soft p-5 text-sm leading-7 text-text-secondary">
            This first detail stays in session storage so the Google sign-in
            handoff can feel like continuation, not friction.
          </div>
        </div>
      )
    case 'grounding':
      return (
        <div className="space-y-5">
          <label className="angel-panel-soft flex cursor-pointer items-start gap-4 p-5">
            <input
              type="checkbox"
              checked={draft.isAdult}
              onChange={(event) => updateDraft('isAdult', event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent text-accent-primary"
            />
            <div>
              <p className="text-sm font-semibold text-text-primary">
                I am 18 or over
              </p>
              <p className="mt-1 text-sm leading-7 text-text-secondary">
                Phase 1 stays adult-only so the emotional posture of the product
                remains consistent and safe.
              </p>
            </div>
          </label>

          <Field label="Timezone">
            <input
              value={draft.timezone}
              onChange={(event) => updateDraft('timezone', event.target.value)}
              placeholder="Europe/Lisbon"
              className="angel-input mt-2"
            />
          </Field>

          {!isAuthenticated ? (
            <div className="angel-panel-soft p-5 text-sm leading-7 text-text-secondary">
              Google sign-in happens next inside the conversation, so Angel can
              keep your first detail and continue the thread naturally.
            </div>
          ) : null}
        </div>
      )
    case 'presence-calibration':
      return (
        <div className="space-y-6">
          <Field label="Tone preference">
            <div className="mt-3 flex flex-wrap gap-2">
              {toneSuggestions.map((suggestion) => (
                <SelectableChip
                  key={suggestion}
                  label={suggestion}
                  selected={draft.tonePreference.toLowerCase() === suggestion}
                  onClick={() => updateDraft('tonePreference', suggestion)}
                />
              ))}
            </div>
            <textarea
              rows={4}
              value={draft.tonePreference}
              onChange={(event) =>
                updateDraft('tonePreference', event.target.value)
              }
              placeholder="Warm, calm, and easy to answer."
              className="angel-textarea mt-3"
            />
          </Field>

          <Field label="Communication style">
            <textarea
              rows={3}
              value={draft.communicationStyle}
              onChange={(event) =>
                updateDraft('communicationStyle', event.target.value)
              }
              placeholder="Honest, unforced, a little alive."
              className="angel-textarea mt-2"
            />
          </Field>

          <Field label="Check-in preference">
            <textarea
              rows={3}
              value={draft.checkinPreference}
              onChange={(event) =>
                updateDraft('checkinPreference', event.target.value)
              }
              placeholder="Gentle touchpoints that feel natural, not scheduled."
              className="angel-textarea mt-2"
            />
          </Field>
        </div>
      )
    case 'relationship-intent':
      return (
        <div className="space-y-4">
          {relationshipIntentOptions.map((option) => {
            const selected = draft.relationshipIntent === option.value

            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => updateDraft('relationshipIntent', option.value)}
                className={cn(
                  'w-full rounded-[1.6rem] border px-5 py-5 text-left transition-colors',
                  selected
                    ? 'border-accent-primary/40 bg-accent-primary/10'
                    : 'border-white/10 bg-white/[0.03] hover:border-accent-primary/20'
                )}
              >
                <p className="text-base font-semibold text-text-primary">
                  {option.label}
                </p>
                <p className="mt-2 text-sm leading-7 text-text-secondary">
                  {getRelationshipIntentDescription(option.value)}
                </p>
              </button>
            )
          })}
        </div>
      )
    case 'lifestyle-common-ground':
      return (
        <div className="space-y-6">
          <Field label="Interests and hooks">
            <textarea
              rows={4}
              value={draft.interests.join(', ')}
              onChange={(event) =>
                setListField('interests', event.target.value)
              }
              placeholder="music, late-night chats, private jokes, films"
              className="angel-textarea mt-2"
            />
          </Field>

          <Field label="What your days feel like">
            <textarea
              rows={4}
              value={draft.dailyRhythm.join(', ')}
              onChange={(event) =>
                setListField('dailyRhythm', event.target.value)
              }
              placeholder="morning reset, midday drift, late-night honesty"
              className="angel-textarea mt-2"
            />
          </Field>

          <Field label="Media you actually trade with people">
            <div className="mt-3 flex flex-wrap gap-2">
              {mediaOptions.map((option) => (
                <SelectableChip
                  key={option}
                  label={option}
                  selected={draft.mediaPreferences.includes(option)}
                  onClick={() => toggleMedia(option)}
                />
              ))}
            </div>
          </Field>
        </div>
      )
    case 'emotional-needs':
      return (
        <div className="space-y-6">
          <Field label="What helps when life gets heavy">
            <textarea
              rows={4}
              value={draft.emotionalNeeds.join(', ')}
              onChange={(event) =>
                setListField('emotionalNeeds', event.target.value)
              }
              placeholder="gentleness, honesty, someone staying there"
              className="angel-textarea mt-2"
            />
          </Field>

          <Field label="What Angel should avoid">
            <textarea
              rows={3}
              value={draft.boundaries.join(', ')}
              onChange={(event) =>
                setListField('boundaries', event.target.value)
              }
              placeholder="pressure to reply instantly, sudden intensity"
              className="angel-textarea mt-2"
            />
          </Field>
        </div>
      )
    case 'astral-calibration':
      return (
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Origin date">
            <input
              type="date"
              value={draft.birthDate}
              onChange={(event) => updateDraft('birthDate', event.target.value)}
              className="angel-input mt-2"
            />
          </Field>

          <div className="space-y-3">
            <Field label="Origin time">
              <input
                type="time"
                value={draft.birthTime}
                disabled={draft.birthTimeUnknown}
                onChange={(event) =>
                  updateDraft('birthTime', event.target.value)
                }
                className={cn(
                  'angel-input mt-2',
                  draft.birthTimeUnknown && 'cursor-not-allowed opacity-50'
                )}
              />
            </Field>
            <label className="flex items-center gap-3 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={draft.birthTimeUnknown}
                onChange={(event) => {
                  updateDraft('birthTimeUnknown', event.target.checked)
                  if (event.target.checked) {
                    updateDraft('birthTime', '')
                  }
                }}
                className="h-4 w-4 cursor-pointer accent-accent-primary"
              />
              I don&apos;t know my exact time
            </label>
          </div>

          <div className="md:col-span-2">
            <Field label="Origin coordinates (City, Country)">
              <input
                value={draft.birthPlace}
                onChange={(event) =>
                  updateDraft('birthPlace', event.target.value)
                }
                placeholder="Lisbon, Portugal"
                className="angel-input mt-2"
              />
            </Field>
          </div>
        </div>
      )
    case 'angel-formation':
      return (
        <div className="space-y-6">
          <Field label="Angel name">
            <input
              value={draft.angelName}
              onChange={(event) => updateDraft('angelName', event.target.value)}
              placeholder="Noor"
              className="angel-input mt-2"
            />
          </Field>

          <Field label="Core tone">
            <textarea
              rows={4}
              value={draft.coreTone}
              onChange={(event) => updateDraft('coreTone', event.target.value)}
              placeholder="Soft, steady, observant, and quietly alive."
              className="angel-textarea mt-2"
            />
          </Field>

          <Field label="Humor style">
            <input
              value={draft.humorStyle}
              onChange={(event) =>
                updateDraft('humorStyle', event.target.value)
              }
              placeholder="Dry, intimate, gently teasing when invited."
              className="angel-input mt-2"
            />
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <RangeField
              label="Warmth level"
              value={draft.warmthLevel}
              onChange={(value) => updateDraft('warmthLevel', value)}
            />
            <RangeField
              label="Playfulness level"
              value={draft.playfulnessLevel}
              onChange={(value) => updateDraft('playfulnessLevel', value)}
            />
          </div>
        </div>
      )
    case 'first-reflection':
      return (
        <div className="space-y-5">
          <div className="angel-panel-soft p-5">
            <p className="angel-kicker">Generated reflection</p>
            <p className="mt-3 text-sm leading-7 text-text-secondary">
              {reflection}
            </p>
          </div>

          <Field label="Reflection summary">
            <textarea
              rows={6}
              value={draft.reflectionSummary || reflection}
              onChange={(event) =>
                updateDraft('reflectionSummary', event.target.value)
              }
              placeholder="Refine how Angel is reflecting you back."
              className="angel-textarea mt-2"
            />
          </Field>
        </div>
      )
    case 'social-context':
      return (
        <div className="space-y-5">
          <div className="angel-panel-soft p-5 text-sm leading-7 text-text-secondary">
            These connections stay optional. Angel only uses official OAuth and
            approved APIs, then keeps scanning in the background after you
            finish onboarding.
          </div>

          <div className="grid gap-4">
            {socialScanState.map((item) => (
              <SocialConnectCard
                key={item.platform}
                item={item}
                actionKey={socialActionKey}
                onConnect={onSocialConnect}
                onMutate={onSocialMutation}
              />
            ))}
          </div>
        </div>
      )
    case 'promise-of-tomorrow':
      return (
        <div className="space-y-5">
          <div className="angel-panel-soft p-5">
            <p className="angel-kicker">Continuity promise</p>
            <p className="mt-3 text-sm leading-7 text-text-secondary">
              Finishing here creates the first companion profile, soul profile,
              conversation, next-day touchpoint, and any queued social scans in
              one calm handoff.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="angel-panel-soft p-5">
              <p className="angel-kicker">Held details</p>
              <p className="mt-3 text-sm leading-7 text-text-secondary">
                {draft.preferredName || 'You'} + {draft.angelName || 'Angel'}
              </p>
              <p className="text-sm leading-7 text-text-secondary">
                {draft.checkinPreference || 'Tomorrow, gently.'}
              </p>
            </div>
            <div className="angel-panel-soft p-5">
              <p className="angel-kicker">Emotional lane</p>
              <p className="mt-3 text-sm leading-7 text-text-secondary">
                {getRelationshipIntentDescription(draft.relationshipIntent)}
              </p>
            </div>
          </div>
        </div>
      )
    default:
      return null
  }
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.22em] text-text-tertiary">
        {label}
      </span>
      {children}
    </label>
  )
}

function RangeField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="angel-panel-soft p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-text-primary">{label}</p>
        <span className="text-xs uppercase tracking-[0.18em] text-text-tertiary">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-4 h-2 w-full cursor-pointer accent-accent-primary"
      />
    </div>
  )
}

function SelectableChip({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'rounded-full border px-4 py-2 text-sm transition-colors',
        selected
          ? 'border-accent-primary/40 bg-accent-primary/12 text-text-primary'
          : 'border-white/10 bg-white/[0.03] text-text-secondary hover:border-accent-primary/25 hover:text-text-primary'
      )}
    >
      {label}
    </button>
  )
}

function SocialConnectCard({
  item,
  actionKey,
  onConnect,
  onMutate,
}: {
  item: SocialScanStateRecord
  actionKey: string | null
  onConnect: (platform: SocialPlatformKey) => Promise<void>
  onMutate: (
    platform: SocialPlatformKey,
    action: 'rescan' | 'disconnect' | 'delete'
  ) => Promise<void>
}) {
  const isConnecting = actionKey === `connect:${item.platform}`
  const isRescanning = actionKey === `rescan:${item.platform}`
  const isDeleting = actionKey === `delete:${item.platform}`
  const isDisconnecting = actionKey === `disconnect:${item.platform}`
  const isBusy = isConnecting || isRescanning || isDeleting || isDisconnecting

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-base font-semibold text-text-primary">
              {item.label}
            </p>
            <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
              {formatSocialStatus(item.status)}
            </span>
          </div>
          <p className="mt-2 text-sm leading-7 text-text-secondary">
            {item.importSummary}
          </p>
          <p className="mt-2 text-sm leading-7 text-text-tertiary">
            {item.description}
          </p>
          {item.limitedReason ? (
            <p className="mt-3 text-sm leading-7 text-accent-brand">
              {item.limitedReason}
            </p>
          ) : null}
          {item.lastErrorMessage && item.status === 'FAILED' ? (
            <p className="mt-3 text-sm leading-7 text-accent-error">
              {item.lastErrorMessage}
            </p>
          ) : null}
          {item.lastScannedAt ? (
            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-text-tertiary">
              Last scan: {new Date(item.lastScannedAt).toLocaleString()}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          {item.status === 'NOT_CONNECTED' ? (
            <Button
              type="button"
              size="sm"
              onClick={() => onConnect(item.platform)}
              disabled={!item.isConfigured || isBusy}
            >
              {isConnecting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {item.isConfigured ? 'Connect' : 'Not configured'}
            </Button>
          ) : (
            <>
              <Button
                type="button"
                size="sm"
                variant="glass"
                onClick={() => onMutate(item.platform, 'rescan')}
                disabled={isBusy || item.status === 'SCANNING'}
              >
                {isRescanning ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
                Rescan
              </Button>
              <Button
                type="button"
                size="sm"
                variant="glass"
                onClick={() => onMutate(item.platform, 'delete')}
                disabled={isBusy || !item.hasImportedData}
              >
                {isDeleting ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete imported data
              </Button>
              <Button
                type="button"
                size="sm"
                variant="glass"
                onClick={() => onMutate(item.platform, 'disconnect')}
                disabled={isBusy}
              >
                {isDisconnecting ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Unplug className="h-4 w-4" />
                )}
                Disconnect
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function getRelationshipIntentDescription(
  value: (typeof relationshipIntentOptions)[number]['value']
) {
  switch (value) {
    case 'FRIEND':
      return 'A grounded, warm friend-first connection without pressure.'
    case 'COMFORTING_PRESENCE':
      return 'A steady emotional presence that helps the day feel less sharp.'
    case 'GROW_OVER_TIME':
      return 'Something gentle that starts as friendship and can deepen naturally.'
  }
}

function formatSocialStatus(status: SocialScanStateRecord['status']) {
  switch (status) {
    case 'CONNECTED':
      return 'Connected'
    case 'SCANNING':
      return 'Scanning'
    case 'READY':
      return 'Ready'
    case 'LIMITED':
      return 'Limited'
    case 'FAILED':
      return 'Failed'
    case 'NOT_CONNECTED':
    default:
      return 'Not connected'
  }
}

function getPrimaryActionLabel(
  currentStep: OnboardingStepKey,
  isAuthenticated: boolean,
  isPending: boolean
) {
  if (isPending) {
    if (currentStep === 'promise-of-tomorrow') {
      return 'Locking continuity'
    }

    if (currentStep === 'grounding' && !isAuthenticated) {
      return 'Preparing Google sign-in'
    }

    return 'Saving this step'
  }

  if (currentStep === 'grounding' && !isAuthenticated) {
    return 'Continue with Google'
  }

  if (currentStep === 'social-context') {
    return 'Continue to continuity'
  }

  if (currentStep === 'promise-of-tomorrow') {
    return 'Finish and enter the thread'
  }

  return 'Save and continue'
}

function getValidationError(
  currentStep: OnboardingStepKey,
  draft: OnboardingDraft,
  isAuthenticated: boolean
) {
  const normalizedDraft = normalizeOnboardingDraftInput(draft)

  switch (currentStep) {
    case 'arrival':
      return normalizedDraft.preferredName
        ? null
        : 'Tell Angel what to call you first.'
    case 'grounding':
      if (!isAuthenticated) {
        return normalizedDraft.preferredName
          ? null
          : 'Add a preferred name before continuing to Google sign-in.'
      }
      if (!normalizedDraft.isAdult) {
        return 'Phase 1 requires 18+ confirmation.'
      }
      return validateTimeZone(normalizedDraft.timezone)
        ? null
        : 'Add a valid timezone like Europe/Lisbon.'
    case 'presence-calibration':
      if (!normalizedDraft.tonePreference) {
        return 'Describe the kind of tone that feels good to you.'
      }
      return normalizedDraft.checkinPreference
        ? null
        : 'Describe how Angel should show up between conversations.'
    case 'relationship-intent':
      return normalizedDraft.relationshipIntent
        ? null
        : 'Choose the relationship lane that feels right.'
    case 'lifestyle-common-ground':
      if (normalizedDraft.interests.length === 0) {
        return 'Add at least one personal hook Angel can call back later.'
      }
      return normalizedDraft.dailyRhythm.length > 0
        ? null
        : 'Describe at least one part of your day-to-day rhythm.'
    case 'emotional-needs':
      return normalizedDraft.emotionalNeeds.length > 0
        ? null
        : 'Name at least one thing that helps when life gets heavy.'
    case 'astral-calibration':
      if (!normalizedDraft.birthDate) {
        return 'Birth date is required.'
      }
      if (!normalizedDraft.birthTime && !normalizedDraft.birthTimeUnknown) {
        return "Please enter your birth time, or confirm you don't know it."
      }
      return null
    case 'angel-formation':
      if (!normalizedDraft.angelName) {
        return 'Give Angel a name before continuing.'
      }
      return normalizedDraft.coreTone
        ? null
        : 'Describe the tone Angel should lean into.'
    case 'first-reflection':
      return null
    case 'social-context':
      return null
    case 'promise-of-tomorrow':
      return canCompleteOnboardingDraft(normalizedDraft)
        ? null
        : 'A few required answers are still missing.'
  }
}
