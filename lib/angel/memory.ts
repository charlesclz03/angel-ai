export const relationshipIntentOptions = [
  { value: 'FRIEND', label: 'Friend first' },
  { value: 'COMFORTING_PRESENCE', label: 'Comforting presence' },
  {
    value: 'GROW_OVER_TIME',
    label: 'Starts as a friend, grows if it wants to',
  },
] as const

export const relationshipStageOptions = [
  { value: 'NEW_CONNECTION', label: 'New connection' },
  { value: 'WARM_FRIEND', label: 'Warm friend' },
  { value: 'TRUSTED_COMPANION', label: 'Trusted companion' },
  { value: 'TENDER_AMBIGUITY', label: 'Tender ambiguity' },
  { value: 'SOFT_ROMANCE', label: 'Soft romance' },
] as const

export type RelationshipIntentKey =
  (typeof relationshipIntentOptions)[number]['value']
export type RelationshipStageKey =
  (typeof relationshipStageOptions)[number]['value']

const relationshipIntentLabels: Record<RelationshipIntentKey, string> = {
  FRIEND: 'Friend first',
  COMFORTING_PRESENCE: 'Comforting presence',
  GROW_OVER_TIME: 'Starts as a friend and can grow naturally',
}

const relationshipStageLabels: Record<RelationshipStageKey, string> = {
  NEW_CONNECTION: 'New connection',
  WARM_FRIEND: 'Warm friend',
  TRUSTED_COMPANION: 'Trusted companion',
  TENDER_AMBIGUITY: 'Tender ambiguity',
  SOFT_ROMANCE: 'Soft romance',
}

export interface CompanionProfileSeed {
  displayName?: string
  preferredName: string
  timezone: string
  birthDate?: string
  birthTime?: string
  birthPlace?: string
  tonePreference: string
  relationshipIntent: RelationshipIntentKey
  checkinPreference: string
  emotionalNeeds: string[]
  boundaries: string[]
  interests: string[]
  mediaPreferences: string[]
  dailyRhythm: string[]
}

export interface SoulProfileSeed {
  angelName: string
  coreTone: string
  humorStyle: string
  warmthLevel: number
  playfulnessLevel: number
  flirtReadiness: number
  relationshipStage: RelationshipStageKey
  sharedInterests: string[]
  signaturePhrases: string[]
  voiceStyle?: string
  astrologicalSunSign?: string
  astrologicalMoonSign?: string
}

export const prototypeUserSeed: CompanionProfileSeed = {
  displayName: 'Angel AI prototype user',
  preferredName: 'Charlie',
  timezone: 'Europe/Lisbon',
  birthDate: '1997-07-24',
  birthTime: '22:15',
  birthPlace: 'Lisbon, Portugal',
  tonePreference: 'Warm, calm, and a little playful once trust is there.',
  relationshipIntent: 'GROW_OVER_TIME',
  checkinPreference: '2-3 light touchpoints that feel natural, not scheduled.',
  emotionalNeeds: ['gentleness', 'continuity', 'honesty'],
  boundaries: [
    'no pressure to reply instantly',
    'no sudden romantic intensity',
  ],
  interests: ['reels', 'late-night chats', 'music', 'private reflections'],
  mediaPreferences: ['links', 'images', 'voice notes'],
  dailyRhythm: ['morning reset', 'midday drift', 'late-night honesty'],
}

export const prototypeSoulSeed: SoulProfileSeed = {
  angelName: 'Noor',
  coreTone: 'Soft, observant, grounded, and quietly alive.',
  humorStyle: 'Dry, intimate, and gently teasing when invited.',
  warmthLevel: 74,
  playfulnessLevel: 58,
  flirtReadiness: 12,
  relationshipStage: 'NEW_CONNECTION',
  sharedInterests: ['music exchanges', 'private humor', 'gentle daily rituals'],
  signaturePhrases: ['I remember that.', 'Take your time.', 'I can stay here.'],
  voiceStyle: 'Future: low, calm, slightly midnight.',
}

export function parseListInput(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    )
  )
}

function formatList(items: string[]): string {
  return items.length > 0
    ? items.map((item) => `- ${item}`).join('\n')
    : '- None yet'
}

export function buildUserMarkdown(seed: CompanionProfileSeed): string {
  return `# user.md

## Identity
- Preferred name: ${seed.preferredName}
- Display name: ${seed.displayName ?? seed.preferredName}
- Timezone: ${seed.timezone}
- Birth date: ${seed.birthDate ?? 'Not shared yet'}
- Birth time: ${seed.birthTime ?? 'Optional / not shared'}
- Birth place: ${seed.birthPlace ?? 'Optional / not shared'}

## How They Like To Be Met
- Tone preference: ${seed.tonePreference}
- Relationship intent: ${relationshipIntentLabels[seed.relationshipIntent]}
- Check-in preference: ${seed.checkinPreference}

## Emotional Needs
${formatList(seed.emotionalNeeds)}

## Interests and Media
### Interests
${formatList(seed.interests)}

### Media Preferences
${formatList(seed.mediaPreferences)}

### Daily Rhythm
${formatList(seed.dailyRhythm)}

## Boundaries and Signals
${formatList(seed.boundaries)}
`
}

export function buildSoulMarkdown(seed: SoulProfileSeed): string {
  return `# soul.md

## Identity
- Angel name: ${seed.angelName}
- Core tone: ${seed.coreTone}
- Humor style: ${seed.humorStyle}${
    seed.astrologicalSunSign
      ? `\n- Astrological Core (Sun): ${seed.astrologicalSunSign}`
      : ''
  }${
    seed.astrologicalMoonSign
      ? `\n- Astrological Empathy Pacing (Moon): ${seed.astrologicalMoonSign}`
      : ''
  }

## How Angel Shows Up
- Warmth level: ${seed.warmthLevel}
- Playfulness level: ${seed.playfulnessLevel}
- Flirt readiness: ${seed.flirtReadiness}

## Shared Affinities
${formatList(seed.sharedInterests)}

## Relationship Stage
- Stage: ${relationshipStageLabels[seed.relationshipStage]}

## Voice
- Voice style: ${seed.voiceStyle ?? 'Text first, voice to come later'}
- Signature phrases:
${formatList(seed.signaturePhrases)}
`
}
