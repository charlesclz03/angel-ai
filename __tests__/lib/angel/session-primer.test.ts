import { describe, expect, it } from 'vitest'

import {
  buildSessionBriefMarkdown,
  MAX_SESSION_BRIEF_MESSAGES,
} from '@/lib/angel/session-primer'

describe('session primer', () => {
  it('includes the live-use stage, tone, memory, recent conversation, and safety pacing note', () => {
    const markdown = buildSessionBriefMarkdown({
      companionSummaryMarkdown: '# user.md\n- User likes grounded support.',
      soulSummaryMarkdown: '# soul.md\n- Angel stays steady and observant.',
      relationshipStage: 'TRUSTED_COMPANION',
      tonePreference: 'Warm and grounded.',
      checkinPreference: 'Gentle check-ins that feel natural.',
      city: 'Lisbon',
      timezone: 'Europe/Lisbon',
      weatherContext: {
        locationLabel: 'Lisbon',
        condition: 'clear sky',
        temperatureC: 18.4,
        feelsLikeC: 17.8,
        isDaytime: true,
      },
      recentMessages: [
        {
          senderRole: 'USER',
          contentText: 'Today felt heavier than expected.',
          contentType: 'TEXT',
          createdAt: new Date('2026-03-24T10:00:00Z'),
        },
        {
          senderRole: 'ANGEL',
          contentText: 'I am with you in it.',
          contentType: 'TEXT',
          createdAt: new Date('2026-03-24T10:01:00Z'),
        },
      ],
      memoryEntries: [
        {
          memoryType: 'CALLBACK_HOOK',
          summary: "Follow up about tomorrow's interview.",
          confidence: 0.88,
          isPinned: true,
          isHidden: false,
          createdAt: new Date('2026-03-24T09:00:00Z'),
          updatedAt: new Date('2026-03-24T09:00:00Z'),
        },
      ],
    })

    expect(markdown).toContain('## Active Stage')
    expect(markdown).toContain('Trusted companion')
    expect(markdown).toContain('## Tone Target')
    expect(markdown).toContain('Gentle check-ins that feel natural.')
    expect(markdown).toContain("User's city: Lisbon")
    expect(markdown).toContain('Current weather in Lisbon: clear sky')
    expect(markdown).toContain('## Curated Memory')
    expect(markdown).toContain("Follow up about tomorrow's interview.")
    expect(markdown).toContain('## Recent Conversation Window')
    expect(markdown).toContain('User: Today felt heavier than expected.')
    expect(markdown).toContain('Angel: I am with you in it.')
    expect(markdown).toContain('## Safety And Pacing')
    expect(markdown).toContain('STRICT SAFETY POLICY')
  })

  it('caps the recent transcript at six messages and stays deterministic', () => {
    const recentMessages = Array.from({ length: 8 }, (_, index) => ({
      senderRole: index % 2 === 0 ? 'USER' : 'ANGEL',
      contentText: `message ${index + 1}`,
      contentType: 'TEXT',
      createdAt: new Date(`2026-03-24T10:0${index}:00Z`),
    }))

    const memoryEntries = Array.from({ length: 7 }, (_, index) => ({
      memoryType: 'PROFILE_FACT' as const,
      summary: `memory ${index + 1}`,
      confidence: 0.95 - index * 0.01,
      isPinned: index === 0,
      isHidden: false,
      createdAt: new Date(`2026-03-24T09:0${index}:00Z`),
      updatedAt: new Date(`2026-03-24T09:0${index}:00Z`),
    }))

    const first = buildSessionBriefMarkdown({
      companionSummaryMarkdown: null,
      soulSummaryMarkdown: null,
      relationshipStage: 'NEW_CONNECTION',
      tonePreference: null,
      checkinPreference: null,
      city: null,
      timezone: null,
      weatherContext: null,
      recentMessages,
      memoryEntries,
    })

    const second = buildSessionBriefMarkdown({
      companionSummaryMarkdown: null,
      soulSummaryMarkdown: null,
      relationshipStage: 'NEW_CONNECTION',
      tonePreference: null,
      checkinPreference: null,
      city: null,
      timezone: null,
      weatherContext: null,
      recentMessages,
      memoryEntries,
    })

    expect(first).toBe(second)
    expect(first).not.toContain('message 1')
    expect(first).not.toContain('message 2')

    for (let index = 3; index <= MAX_SESSION_BRIEF_MESSAGES + 2; index += 1) {
      expect(first).toContain(`message ${index}`)
    }

    expect(first).toContain('memory 1')
    expect(first).toContain('memory 5')
    expect(first).not.toContain('memory 6')
    expect(first).not.toContain('memory 7')
  })
})
