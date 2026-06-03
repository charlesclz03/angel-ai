import { describe, expect, it } from 'vitest'

import {
  buildProfileSeedsFromDraft,
  getDefaultOnboardingDraft,
  getLatestStepResponses,
  scheduleNextDayTouchpoint,
} from '@/lib/angel/onboarding-state'

describe('onboarding state helpers', () => {
  it('keeps the latest response for each onboarding step', () => {
    const latest = getLatestStepResponses([
      {
        stepKey: 'arrival',
        promptText: 'Before we go any further, what should I call you?',
        responseText: 'Old name',
        responseJson: { preferredName: 'Old name' },
        createdAt: new Date('2026-03-18T09:00:00Z'),
      },
      {
        stepKey: 'arrival',
        promptText: 'Before we go any further, what should I call you?',
        responseText: 'Charlie',
        responseJson: { preferredName: 'Charlie' },
        createdAt: new Date('2026-03-18T10:00:00Z'),
      },
      {
        stepKey: 'grounding',
        promptText: 'First, are you 18 or over?',
        responseText: '18+ confirmed',
        responseJson: { isAdult: true, timezone: 'Europe/Lisbon' },
        createdAt: new Date('2026-03-18T10:05:00Z'),
      },
    ])

    expect(latest.arrival?.responseText).toBe('Charlie')
    expect(latest.grounding?.responseText).toBe('18+ confirmed')
  })

  it('maps an onboarding draft into companion and soul seeds', () => {
    const draft = getDefaultOnboardingDraft({
      preferredName: 'Charlie',
      isAdult: true,
      timezone: 'Europe/Lisbon',
      tonePreference: 'Warm and grounded.',
      communicationStyle: 'Honest and low-pressure.',
      checkinPreference: 'Gentle follow-ups that feel natural.',
      relationshipIntent: 'GROW_OVER_TIME',
      interests: ['music', 'late-night chats', 'private humor'],
      mediaPreferences: ['links', 'images'],
      dailyRhythm: ['slow mornings', 'honest nights'],
      emotionalNeeds: ['gentleness', 'continuity'],
      boundaries: ['no pressure to reply instantly'],
      birthDate: '1997-07-24',
      angelName: 'Noor',
      coreTone: 'Soft, steady, and observant.',
      humorStyle: 'Dry and intimate.',
      warmthLevel: 76,
      playfulnessLevel: 58,
    })

    const { companionSeed, soulSeed } = buildProfileSeedsFromDraft(draft, {
      userName: 'Charles',
    })

    expect(companionSeed.displayName).toBe('Charles')
    expect(companionSeed.tonePreference).toContain('Warm and grounded.')
    expect(companionSeed.tonePreference).toContain('Communication style:')
    expect(companionSeed.relationshipIntent).toBe('GROW_OVER_TIME')
    expect(soulSeed.angelName).toBe('Noor')
    expect(soulSeed.sharedInterests).toEqual([
      'music',
      'late-night chats',
      'private humor',
    ])
    expect(soulSeed.relationshipStage).toBe('NEW_CONNECTION')
  })

  it('schedules the next-day touchpoint in the user timezone and clamps late hours', () => {
    const scheduled = scheduleNextDayTouchpoint(
      new Date('2026-03-18T22:45:00Z'),
      'Europe/Lisbon'
    )

    const localParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Lisbon',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(scheduled)

    const readPart = (type: string) =>
      Number(localParts.find((part) => part.type === type)?.value ?? 0)

    expect(readPart('day')).toBe(19)
    expect(readPart('hour')).toBe(18)
    expect(readPart('minute')).toBe(45)
  })

  it('schedules early completions no earlier than 10:00 local time', () => {
    const scheduled = scheduleNextDayTouchpoint(
      new Date('2026-03-18T07:15:00Z'),
      'Europe/Lisbon'
    )

    const localParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Lisbon',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(scheduled)

    const readPart = (type: string) =>
      Number(localParts.find((part) => part.type === type)?.value ?? 0)

    expect(readPart('hour')).toBe(10)
    expect(readPart('minute')).toBe(15)
  })
})
