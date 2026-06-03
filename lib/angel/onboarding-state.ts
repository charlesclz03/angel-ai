import type {
  CompanionProfile,
  Conversation,
  OnboardingResponse,
  Prisma,
  SoulProfile,
  Touchpoint,
} from '@prisma/client'

import {
  buildSoulMarkdown,
  buildUserMarkdown,
  prototypeSoulSeed,
  type CompanionProfileSeed,
  type RelationshipIntentKey,
  type SoulProfileSeed,
} from '@/lib/angel/memory'
import { angelOnboardingStages } from '@/lib/angel/onboarding'
import {
  type SocialScanStateRecord,
  buildDefaultSocialScanState,
} from '@/lib/social/types'
import { calculateNatalChart } from '@/lib/angel/astral-service'

export type OnboardingStepKey = (typeof angelOnboardingStages)[number]['id']

export type OnboardingStatus = 'pre-auth' | 'in-progress' | 'complete'

export interface OnboardingStepInput {
  stepKey: OnboardingStepKey
  promptText?: string
  responseText?: string
  responseJson?: Prisma.InputJsonValue
}

export interface OnboardingDraft {
  preferredName: string
  isAdult: boolean
  timezone: string
  tonePreference: string
  communicationStyle: string
  checkinPreference: string
  relationshipIntent: RelationshipIntentKey
  interests: string[]
  mediaPreferences: string[]
  dailyRhythm: string[]
  emotionalNeeds: string[]
  boundaries: string[]
  birthDate: string
  birthTime: string
  birthTimeUnknown: boolean
  birthPlace: string
  angelName: string
  coreTone: string
  humorStyle: string
  warmthLevel: number
  playfulnessLevel: number
  reflectionSummary: string
}

export interface OnboardingState {
  status: OnboardingStatus
  currentStep: OnboardingStepKey
  savedSteps: OnboardingStepKey[]
  draft: OnboardingDraft
  canComplete: boolean
  scheduledTouchpointAt?: string
  scheduledTouchpointLabel?: string
  socialScanState: SocialScanStateRecord[]
}

interface LoadedOnboardingSnapshot {
  responses: Pick<
    OnboardingResponse,
    'stepKey' | 'promptText' | 'responseText' | 'responseJson' | 'createdAt'
  >[]
  companionProfile: Pick<CompanionProfile, 'id'> | null
  soulProfile: Pick<SoulProfile, 'id'> | null
  conversation: Pick<Conversation, 'id'> | null
  touchpoint: Pick<Touchpoint, 'id' | 'scheduledFor'> | null
  userName?: string | null
  socialScanState?: SocialScanStateRecord[]
}

interface BuildDraftContext {
  userName?: string | null
}

interface SeedContext {
  userName?: string | null
}

type StepResponseRecord = Pick<
  OnboardingResponse,
  'stepKey' | 'promptText' | 'responseText' | 'responseJson' | 'createdAt'
>

type JsonLikeRecord = Record<string, unknown>

const onboardingStepDefinitions = Object.fromEntries(
  angelOnboardingStages.map((stage) => [stage.id, stage])
) as Record<OnboardingStepKey, (typeof angelOnboardingStages)[number]>

export const onboardingStepOrder = angelOnboardingStages.map(
  (stage) => stage.id
) as OnboardingStepKey[]

export function getDefaultOnboardingDraft(
  overrides: Partial<OnboardingDraft> = {}
): OnboardingDraft {
  return {
    preferredName: '',
    isAdult: false,
    timezone: 'UTC',
    tonePreference: '',
    communicationStyle: '',
    checkinPreference: '',
    relationshipIntent: 'FRIEND',
    interests: [],
    mediaPreferences: ['links', 'images', 'voice notes'],
    dailyRhythm: [],
    emotionalNeeds: [],
    boundaries: [],
    birthDate: '',
    birthTime: '',
    birthTimeUnknown: false,
    birthPlace: '',
    angelName: prototypeSoulSeed.angelName,
    coreTone: prototypeSoulSeed.coreTone,
    humorStyle: prototypeSoulSeed.humorStyle,
    warmthLevel: prototypeSoulSeed.warmthLevel,
    playfulnessLevel: prototypeSoulSeed.playfulnessLevel,
    reflectionSummary: '',
    ...overrides,
  }
}

export function validateTimeZone(timeZone: string): boolean {
  if (!timeZone.trim()) {
    return false
  }

  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date())
    return true
  } catch {
    return false
  }
}

export function normalizeStringList(values: unknown): string[] {
  if (Array.isArray(values)) {
    return Array.from(
      new Set(values.map((value) => String(value).trim()).filter(Boolean))
    )
  }

  if (typeof values === 'string') {
    return Array.from(
      new Set(
        values
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
      )
    )
  }

  return []
}

export function normalizeOnboardingDraftInput(
  input: Partial<OnboardingDraft>
): OnboardingDraft {
  const draft = getDefaultOnboardingDraft(input)

  return {
    ...draft,
    preferredName: draft.preferredName.trim(),
    timezone: draft.timezone.trim() || 'UTC',
    tonePreference: draft.tonePreference.trim(),
    communicationStyle: draft.communicationStyle.trim(),
    checkinPreference: draft.checkinPreference.trim(),
    relationshipIntent: draft.relationshipIntent,
    interests: normalizeStringList(draft.interests),
    mediaPreferences: normalizeStringList(draft.mediaPreferences),
    dailyRhythm: normalizeStringList(draft.dailyRhythm),
    emotionalNeeds: normalizeStringList(draft.emotionalNeeds),
    boundaries: normalizeStringList(draft.boundaries),
    birthDate: draft.birthDate.trim(),
    birthTime: draft.birthTime.trim(),
    birthTimeUnknown: Boolean(draft.birthTimeUnknown),
    birthPlace: draft.birthPlace.trim(),
    angelName: draft.angelName.trim(),
    coreTone: draft.coreTone.trim(),
    humorStyle: draft.humorStyle.trim(),
    warmthLevel: clampPercentage(draft.warmthLevel),
    playfulnessLevel: clampPercentage(draft.playfulnessLevel),
    reflectionSummary: draft.reflectionSummary.trim(),
  }
}

export function getLatestStepResponses(
  responses: StepResponseRecord[]
): Partial<Record<OnboardingStepKey, StepResponseRecord>> {
  return responses.reduce<
    Partial<Record<OnboardingStepKey, StepResponseRecord>>
  >((latestByStep, response) => {
    const existing = latestByStep[response.stepKey as OnboardingStepKey]

    if (!existing || existing.createdAt < response.createdAt) {
      latestByStep[response.stepKey as OnboardingStepKey] = response
    }

    return latestByStep
  }, {})
}

export function buildOnboardingDraftFromResponses(
  responses: Partial<Record<OnboardingStepKey, StepResponseRecord>>,
  context: BuildDraftContext = {}
): OnboardingDraft {
  const draft = getDefaultOnboardingDraft({
    preferredName: context.userName?.trim() ?? '',
  })

  const arrival = toJsonRecord(responses.arrival?.responseJson)
  if (arrival.preferredName) {
    draft.preferredName = String(arrival.preferredName)
  }

  const grounding = toJsonRecord(responses.grounding?.responseJson)
  if (typeof grounding.isAdult === 'boolean') {
    draft.isAdult = grounding.isAdult
  }
  if (grounding.timezone) {
    draft.timezone = String(grounding.timezone)
  }

  const presenceCalibration = toJsonRecord(
    responses['presence-calibration']?.responseJson
  )
  if (presenceCalibration.tonePreference) {
    draft.tonePreference = String(presenceCalibration.tonePreference)
  }
  if (presenceCalibration.communicationStyle) {
    draft.communicationStyle = String(presenceCalibration.communicationStyle)
  }
  if (presenceCalibration.checkinPreference) {
    draft.checkinPreference = String(presenceCalibration.checkinPreference)
  }

  const relationshipIntent = toJsonRecord(
    responses['relationship-intent']?.responseJson
  )
  if (isRelationshipIntentKey(relationshipIntent.relationshipIntent)) {
    draft.relationshipIntent = relationshipIntent.relationshipIntent
  }

  const lifestyle = toJsonRecord(
    responses['lifestyle-common-ground']?.responseJson
  )
  draft.interests = normalizeStringList(lifestyle.interests)
  draft.mediaPreferences = normalizeStringList(lifestyle.mediaPreferences)
  draft.dailyRhythm = normalizeStringList(lifestyle.dailyRhythm)

  const emotionalNeeds = toJsonRecord(
    responses['emotional-needs']?.responseJson
  )
  draft.emotionalNeeds = normalizeStringList(emotionalNeeds.emotionalNeeds)
  draft.boundaries = normalizeStringList(emotionalNeeds.boundaries)

  const astral = toJsonRecord(responses['astral-calibration']?.responseJson)
  if (astral.birthDate) {
    draft.birthDate = String(astral.birthDate)
  }
  if (astral.birthTime) {
    draft.birthTime = String(astral.birthTime)
  }
  if (astral.birthTimeUnknown) {
    draft.birthTimeUnknown = Boolean(astral.birthTimeUnknown)
  }
  if (astral.birthPlace) {
    draft.birthPlace = String(astral.birthPlace)
  }

  const angelFormation = toJsonRecord(
    responses['angel-formation']?.responseJson
  )
  if (angelFormation.angelName) {
    draft.angelName = String(angelFormation.angelName)
  }
  if (angelFormation.coreTone) {
    draft.coreTone = String(angelFormation.coreTone)
  }
  if (angelFormation.humorStyle) {
    draft.humorStyle = String(angelFormation.humorStyle)
  }
  if (typeof angelFormation.warmthLevel === 'number') {
    draft.warmthLevel = clampPercentage(angelFormation.warmthLevel)
  }
  if (typeof angelFormation.playfulnessLevel === 'number') {
    draft.playfulnessLevel = clampPercentage(angelFormation.playfulnessLevel)
  }

  const reflection = toJsonRecord(responses['first-reflection']?.responseJson)
  if (reflection.reflectionSummary) {
    draft.reflectionSummary = String(reflection.reflectionSummary)
  } else if (responses['first-reflection']?.responseText) {
    draft.reflectionSummary = responses['first-reflection']?.responseText ?? ''
  }

  return normalizeOnboardingDraftInput(draft)
}

export function buildPreAuthOnboardingState(): OnboardingState {
  return {
    status: 'pre-auth',
    currentStep: 'arrival',
    savedSteps: [],
    draft: getDefaultOnboardingDraft(),
    canComplete: false,
    socialScanState: buildDefaultSocialScanState(),
  }
}

export function buildLoadedOnboardingState(
  snapshot: LoadedOnboardingSnapshot
): OnboardingState {
  const latestResponses = getLatestStepResponses(snapshot.responses)
  const savedSteps = onboardingStepOrder.filter(
    (stepKey) => latestResponses[stepKey]
  )
  const draft = buildOnboardingDraftFromResponses(latestResponses, {
    userName: snapshot.userName,
  })
  const complete =
    Boolean(snapshot.companionProfile) &&
    Boolean(snapshot.soulProfile) &&
    Boolean(snapshot.conversation) &&
    Boolean(snapshot.touchpoint)

  return {
    status: complete ? 'complete' : 'in-progress',
    currentStep: complete
      ? 'promise-of-tomorrow'
      : getNextOnboardingStep(savedSteps),
    savedSteps,
    draft,
    canComplete: canCompleteOnboardingDraft(draft),
    scheduledTouchpointAt: snapshot.touchpoint?.scheduledFor.toISOString(),
    scheduledTouchpointLabel: snapshot.touchpoint
      ? formatScheduledTouchpoint(
          snapshot.touchpoint.scheduledFor,
          draft.timezone
        )
      : undefined,
    socialScanState: snapshot.socialScanState ?? buildDefaultSocialScanState(),
  }
}

export function getNextOnboardingStep(
  savedSteps: OnboardingStepKey[]
): OnboardingStepKey {
  return (
    onboardingStepOrder.find((stepKey) => !savedSteps.includes(stepKey)) ??
    'promise-of-tomorrow'
  )
}

export function canCompleteOnboardingDraft(
  draftInput: OnboardingDraft
): boolean {
  const draft = normalizeOnboardingDraftInput(draftInput)

  return Boolean(
    draft.preferredName &&
    draft.isAdult &&
    validateTimeZone(draft.timezone) &&
    draft.tonePreference &&
    draft.checkinPreference &&
    draft.relationshipIntent &&
    draft.interests.length > 0 &&
    draft.emotionalNeeds.length > 0 &&
    draft.birthDate &&
    draft.angelName &&
    draft.coreTone
  )
}

export function buildGeneratedReflection(draftInput: OnboardingDraft): string {
  const draft = normalizeOnboardingDraftInput(draftInput)
  const interestsLead =
    draft.interests.length > 0
      ? `You feel most alive when things carry a little texture, whether that's ${draft.interests
          .slice(0, 2)
          .join(' and ')}.`
      : 'You feel a little deeper than you first let on.'
  const connectionLine = draft.checkinPreference
    ? `I can tell you like connection to feel ${draft.checkinPreference.toLowerCase()}.`
    : 'I can tell you like warmth when it feels real and not performative.'
  const angelLine = `I'm starting to understand how to be with you as ${draft.coreTone.toLowerCase()}.`

  return [interestsLead, connectionLine, angelLine].join(' ')
}

export function buildOnboardingAnswersFromDraft(
  draftInput: OnboardingDraft
): OnboardingStepInput[] {
  const draft = normalizeOnboardingDraftInput(draftInput)
  const reflectionSummary =
    draft.reflectionSummary || buildGeneratedReflection(draft)

  return [
    buildStepInput('arrival', {
      responseText: draft.preferredName,
      responseJson: {
        preferredName: draft.preferredName,
      },
    }),
    buildStepInput('grounding', {
      responseText: `${draft.isAdult ? '18+ confirmed' : '18+ not confirmed'}${draft.timezone ? ` - ${draft.timezone}` : ''}`,
      responseJson: {
        isAdult: draft.isAdult,
        timezone: draft.timezone,
      },
    }),
    buildStepInput('presence-calibration', {
      responseText: `${draft.tonePreference}${draft.communicationStyle ? ` - ${draft.communicationStyle}` : ''}`,
      responseJson: {
        tonePreference: draft.tonePreference,
        communicationStyle: draft.communicationStyle,
        checkinPreference: draft.checkinPreference,
      },
    }),
    buildStepInput('relationship-intent', {
      responseText: draft.relationshipIntent,
      responseJson: {
        relationshipIntent: draft.relationshipIntent,
      },
    }),
    buildStepInput('lifestyle-common-ground', {
      responseText: draft.interests.join(', '),
      responseJson: {
        interests: draft.interests,
        mediaPreferences: draft.mediaPreferences,
        dailyRhythm: draft.dailyRhythm,
      },
    }),
    buildStepInput('emotional-needs', {
      responseText: draft.emotionalNeeds.join(', '),
      responseJson: {
        emotionalNeeds: draft.emotionalNeeds,
        boundaries: draft.boundaries,
      },
    }),
    buildStepInput('astral-calibration', {
      responseText: draft.birthDate,
      responseJson: {
        birthDate: draft.birthDate,
        birthTime: draft.birthTime,
        birthTimeUnknown: draft.birthTimeUnknown,
        birthPlace: draft.birthPlace,
      },
    }),
    buildStepInput('angel-formation', {
      responseText: `${draft.angelName} - ${draft.coreTone}`,
      responseJson: {
        angelName: draft.angelName,
        coreTone: draft.coreTone,
        humorStyle: draft.humorStyle,
        warmthLevel: draft.warmthLevel,
        playfulnessLevel: draft.playfulnessLevel,
      },
    }),
    buildStepInput('first-reflection', {
      responseText: reflectionSummary,
      responseJson: {
        reflectionSummary,
      },
    }),
    buildStepInput('social-context', {
      responseText: 'Optional social import reviewed.',
      responseJson: {
        acknowledged: true,
      },
    }),
    buildStepInput('promise-of-tomorrow', {
      responseText: "I'll find you tomorrow.",
      responseJson: {
        promisedTomorrow: true,
        checkinPreference: draft.checkinPreference,
      },
    }),
  ]
}

export function buildProfileSeedsFromDraft(
  draftInput: OnboardingDraft,
  context: SeedContext = {}
): {
  companionSeed: CompanionProfileSeed
  soulSeed: SoulProfileSeed
} {
  const draft = normalizeOnboardingDraftInput(draftInput)

  const chart = calculateNatalChart(
    draft.birthDate,
    draft.birthTime,
    draft.birthTimeUnknown,
    draft.birthPlace
  )

  const tonePreference = [
    draft.tonePreference,
    draft.communicationStyle
      ? `Communication style: ${draft.communicationStyle}`
      : '',
  ]
    .filter(Boolean)
    .join(' ')

  const companionSeed: CompanionProfileSeed = {
    displayName: context.userName?.trim() || draft.preferredName,
    preferredName: draft.preferredName,
    timezone: draft.timezone,
    birthDate: draft.birthDate || undefined,
    birthTime: draft.birthTime || undefined,
    birthPlace: draft.birthPlace || undefined,
    tonePreference,
    relationshipIntent: draft.relationshipIntent,
    checkinPreference: draft.checkinPreference,
    emotionalNeeds: draft.emotionalNeeds,
    boundaries: draft.boundaries,
    interests: draft.interests,
    mediaPreferences: draft.mediaPreferences,
    dailyRhythm: draft.dailyRhythm,
  }

  const soulSeed: SoulProfileSeed = {
    angelName: draft.angelName,
    coreTone: draft.coreTone,
    humorStyle: draft.humorStyle || prototypeSoulSeed.humorStyle,
    warmthLevel: draft.warmthLevel,
    playfulnessLevel: draft.playfulnessLevel,
    flirtReadiness: 0,
    relationshipStage: 'NEW_CONNECTION',
    sharedInterests: draft.interests.slice(0, 4),
    signaturePhrases: ['I remember that.', "I'll find you tomorrow."],
    voiceStyle: prototypeSoulSeed.voiceStyle,
    astrologicalSunSign: chart.isValid ? chart.sunSign : undefined,
    astrologicalMoonSign: chart.isValid ? chart.moonSign : undefined,
  }

  return {
    companionSeed,
    soulSeed,
  }
}

export function buildPreviewMarkdown(
  draft: OnboardingDraft,
  context: SeedContext
) {
  const { companionSeed, soulSeed } = buildProfileSeedsFromDraft(draft, context)

  return {
    userMarkdown: buildUserMarkdown(companionSeed),
    soulMarkdown: buildSoulMarkdown(soulSeed),
  }
}

export function scheduleNextDayTouchpoint(
  completedAt: Date,
  timeZone: string
): Date {
  const localParts = getZonedDateParts(completedAt, timeZone)
  const clampedHour = Math.min(18, Math.max(10, localParts.hour))
  const nextDay = shiftCalendarDay(
    { year: localParts.year, month: localParts.month, day: localParts.day },
    1
  )

  return zonedDateTimeToUtc(
    {
      ...nextDay,
      hour: clampedHour,
      minute: localParts.minute,
      second: localParts.second,
    },
    timeZone
  )
}

export function getLocalDayUtcRange(date: Date, timeZone: string) {
  const localParts = getZonedDateParts(date, timeZone)
  const start = zonedDateTimeToUtc(
    {
      year: localParts.year,
      month: localParts.month,
      day: localParts.day,
      hour: 0,
      minute: 0,
      second: 0,
    },
    timeZone
  )

  const nextDay = shiftCalendarDay(
    { year: localParts.year, month: localParts.month, day: localParts.day },
    1
  )

  const end = zonedDateTimeToUtc(
    {
      ...nextDay,
      hour: 0,
      minute: 0,
      second: 0,
    },
    timeZone
  )

  return { start, end }
}

export function formatScheduledTouchpoint(
  scheduledFor: Date,
  timeZone: string
): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(scheduledFor)
}

export function getOnboardingStep(stepKey: OnboardingStepKey) {
  return onboardingStepDefinitions[stepKey]
}

function buildStepInput(
  stepKey: OnboardingStepKey,
  values: Omit<OnboardingStepInput, 'stepKey' | 'promptText'>
): OnboardingStepInput {
  return {
    stepKey,
    promptText: onboardingStepDefinitions[stepKey].primaryPrompt,
    ...values,
  }
}

function toJsonRecord(value: unknown): JsonLikeRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonLikeRecord)
    : {}
}

function isRelationshipIntentKey(
  value: unknown
): value is RelationshipIntentKey {
  return (
    value === 'FRIEND' ||
    value === 'COMFORTING_PRESENCE' ||
    value === 'GROW_OVER_TIME'
  )
}

function clampPercentage(value: number): number {
  return Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0))
}

function getZonedDateParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })

  const parts = formatter.formatToParts(date)
  const readPart = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0)

  return {
    year: readPart('year'),
    month: readPart('month'),
    day: readPart('day'),
    hour: readPart('hour'),
    minute: readPart('minute'),
    second: readPart('second'),
  }
}

function zonedDateTimeToUtc(
  localDateTime: {
    year: number
    month: number
    day: number
    hour: number
    minute: number
    second: number
  },
  timeZone: string
): Date {
  let utcTimestamp = Date.UTC(
    localDateTime.year,
    localDateTime.month - 1,
    localDateTime.day,
    localDateTime.hour,
    localDateTime.minute,
    localDateTime.second
  )

  for (let index = 0; index < 4; index += 1) {
    const actual = getZonedDateParts(new Date(utcTimestamp), timeZone)
    const difference =
      Date.UTC(
        localDateTime.year,
        localDateTime.month - 1,
        localDateTime.day,
        localDateTime.hour,
        localDateTime.minute,
        localDateTime.second
      ) -
      Date.UTC(
        actual.year,
        actual.month - 1,
        actual.day,
        actual.hour,
        actual.minute,
        actual.second
      )

    if (difference === 0) {
      break
    }

    utcTimestamp += difference
  }

  return new Date(utcTimestamp)
}

function shiftCalendarDay(
  localDate: {
    year: number
    month: number
    day: number
  },
  deltaDays: number
) {
  const shiftedDate = new Date(
    Date.UTC(localDate.year, localDate.month - 1, localDate.day + deltaDays)
  )

  return {
    year: shiftedDate.getUTCFullYear(),
    month: shiftedDate.getUTCMonth() + 1,
    day: shiftedDate.getUTCDate(),
  }
}
