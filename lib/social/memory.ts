import type { MemoryType } from '@prisma/client'

import type {
  NormalizedSocialContent,
  NormalizedSocialProfile,
  SocialPlatformKey,
} from '@/lib/social/types'

interface SocialMemoryCandidate {
  memoryType: MemoryType
  summary: string
  confidence: number
  sourceContext: {
    origin: 'social_scan'
    platform: SocialPlatformKey
    permalink?: string | null
    postedAt?: string | null
  }
}

const stopWords = new Set([
  'about',
  'after',
  'again',
  'also',
  'because',
  'being',
  'from',
  'have',
  'just',
  'like',
  'really',
  'that',
  'their',
  'them',
  'there',
  'they',
  'this',
  'with',
  'your',
])

export function buildSocialMemoryCandidates(input: {
  platform: SocialPlatformKey
  profile: NormalizedSocialProfile | null
  content: NormalizedSocialContent[]
}) {
  const candidates: SocialMemoryCandidate[] = []
  const bioFragments = extractBioFragments(input.profile)

  for (const fragment of bioFragments.slice(0, 3)) {
    candidates.push({
      memoryType: 'PROFILE_FACT',
      summary: `User publicly describes themselves around ${fragment}.`,
      confidence: 0.82,
      sourceContext: {
        origin: 'social_scan',
        platform: input.platform,
      },
    })
  }

  const repeatedThemes = extractRepeatedThemes(input.content)
  for (const theme of repeatedThemes.slice(0, 3)) {
    candidates.push({
      memoryType: 'PROFILE_FACT',
      summary: `User returns often to ${theme} in ${input.platform} posts.`,
      confidence: 0.79,
      sourceContext: {
        origin: 'social_scan',
        platform: input.platform,
      },
    })
  }

  const timeRoutine = extractRoutineSignal(input.content)
  if (timeRoutine) {
    candidates.push({
      memoryType: 'PROFILE_FACT',
      summary: timeRoutine,
      confidence: 0.76,
      sourceContext: {
        origin: 'social_scan',
        platform: input.platform,
      },
    })
  }

  for (const contentItem of input.content.slice(0, 12)) {
    const callbackPhrase = extractCallbackSignal(contentItem)
    if (!callbackPhrase) {
      continue
    }

    candidates.push({
      memoryType: 'CALLBACK_HOOK',
      summary: `Follow up about ${callbackPhrase}.`,
      confidence: 0.72,
      sourceContext: {
        origin: 'social_scan',
        platform: input.platform,
        permalink: contentItem.permalink ?? null,
        postedAt: contentItem.postedAt?.toISOString() ?? null,
      },
    })
  }

  return dedupeSocialMemoryCandidates(candidates)
}

function extractBioFragments(profile: NormalizedSocialProfile | null) {
  const source = [profile?.headline, profile?.bio]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(' | ')

  if (!source) {
    return []
  }

  return source
    .split(/[|•/]/)
    .map((fragment) => fragment.trim())
    .filter((fragment) => fragment.length >= 4 && fragment.length <= 60)
    .filter((fragment) => !/^https?:\/\//i.test(fragment))
}

function extractRepeatedThemes(content: NormalizedSocialContent[]) {
  const counts = new Map<string, number>()

  for (const item of content) {
    const text = `${item.title ?? ''} ${item.textContent ?? ''}`
      .toLowerCase()
      .replace(/https?:\/\/\S+/g, ' ')

    const hashtags = Array.from(
      text.matchAll(/#([a-z0-9][a-z0-9-]{2,30})/gi)
    ).map((match) => match[1].toLowerCase())
    const keywords = text
      .split(/[^a-z0-9]+/i)
      .map((token) => token.trim().toLowerCase())
      .filter((token) => token.length >= 4 && !stopWords.has(token))

    for (const token of [...hashtags, ...keywords.slice(0, 10)]) {
      counts.set(token, (counts.get(token) ?? 0) + 1)
    }
  }

  return Array.from(counts.entries())
    .filter(([, count]) => count >= 2)
    .sort((left, right) => right[1] - left[1])
    .map(([token]) => token.replace(/-/g, ' '))
}

function extractRoutineSignal(content: NormalizedSocialContent[]) {
  const hours = content
    .map((item) => item.postedAt?.getUTCHours())
    .filter((hour): hour is number => typeof hour === 'number')

  if (hours.length < 3) {
    return null
  }

  const buckets = {
    mornings: hours.filter((hour) => hour >= 5 && hour < 12).length,
    afternoons: hours.filter((hour) => hour >= 12 && hour < 18).length,
    evenings: hours.filter((hour) => hour >= 18 && hour < 24).length,
    nights: hours.filter((hour) => hour < 5).length,
  }

  const [dominantBucket, count] =
    Object.entries(buckets).sort((left, right) => right[1] - left[1])[0] ?? []

  if (!dominantBucket || !count || count < 3) {
    return null
  }

  const label = dominantBucket.slice(0, -1)
  return `User often shares publicly during the ${label}.`
}

function extractCallbackSignal(content: NormalizedSocialContent) {
  const text = `${content.title ?? ''} ${content.textContent ?? ''}`.trim()

  if (!text) {
    return null
  }

  const futureMatch = text.match(
    /\b(?:tomorrow|tonight|later today|this week|this weekend|next week|launch|interview|trip|meeting|show|event)\b[^.?!]*/i
  )

  if (!futureMatch) {
    return null
  }

  return futureMatch[0].trim().replace(/[.?!]+$/, '')
}

function dedupeSocialMemoryCandidates(candidates: SocialMemoryCandidate[]) {
  const seen = new Set<string>()

  return candidates.filter((candidate) => {
    const key = `${candidate.memoryType}:${candidate.summary.toLowerCase()}`

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}
