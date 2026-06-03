import { describe, expect, it } from 'vitest'

import {
  buildRegeneratedSoulSummaryMarkdown,
  buildRegeneratedUserSummaryMarkdown,
  extractCompanionSummaryHighlight,
  rankAndDedupeMemoryEntries,
} from '@/lib/angel/summary-service'

describe('summary service helpers', () => {
  it('ranks memory by pinned, confidence, and recency while deduping normalized summaries', () => {
    const ranked = rankAndDedupeMemoryEntries([
      {
        memoryType: 'PROFILE_FACT',
        summary: 'User enjoys late-night walks.',
        confidence: 0.81,
        isPinned: false,
        createdAt: new Date('2026-03-18T10:00:00Z'),
        updatedAt: new Date('2026-03-18T10:00:00Z'),
      },
      {
        memoryType: 'EMOTIONAL_PATTERN',
        summary: 'User reaches for steadiness when things feel heavy.',
        confidence: 0.72,
        isPinned: true,
        createdAt: new Date('2026-03-18T09:00:00Z'),
        updatedAt: new Date('2026-03-18T09:00:00Z'),
      },
      {
        memoryType: 'PROFILE_FACT',
        summary: '  user enjoys late-night walks. ',
        confidence: 0.9,
        isPinned: false,
        createdAt: new Date('2026-03-18T11:00:00Z'),
        updatedAt: new Date('2026-03-18T11:00:00Z'),
      },
    ])

    expect(ranked).toHaveLength(2)
    expect(ranked[0]?.memoryType).toBe('EMOTIONAL_PATTERN')
    expect(ranked[1]?.summary).toBe('  user enjoys late-night walks. ')
  })

  it('builds regenerated user markdown from profile fields plus high-signal memory', () => {
    const markdown = buildRegeneratedUserSummaryMarkdown(
      {
        preferredName: 'Charlie',
        displayName: 'Charles',
        timezone: 'Europe/Lisbon',
        birthDate: new Date('1997-07-24T00:00:00Z'),
        birthTime: '22:15',
        birthPlace: 'Lisbon, Portugal',
        tonePreference: 'Warm and grounded.',
        relationshipIntent: 'GROW_OVER_TIME',
        checkinPreference: 'Gentle follow-ups that feel natural.',
        emotionalNeeds: ['gentleness', 'continuity'],
        boundaries: ['no pressure to reply instantly'],
        interests: ['music', 'late-night chats'],
        mediaPreferences: ['links', 'images'],
        dailyRhythm: ['slow mornings', 'honest nights'],
      },
      [
        {
          memoryType: 'PROFILE_FACT',
          summary: 'User enjoys late-night walks.',
          confidence: 0.82,
          isPinned: false,
          updatedAt: new Date('2026-03-18T12:00:00Z'),
        },
        {
          memoryType: 'EMOTIONAL_PATTERN',
          summary: 'User looks for steadiness when things feel heavy.',
          confidence: 0.9,
          isPinned: true,
          updatedAt: new Date('2026-03-18T12:05:00Z'),
        },
        {
          memoryType: 'CALLBACK_HOOK',
          summary: "Follow up about tomorrow's interview.",
          confidence: 0.79,
          isPinned: false,
          updatedAt: new Date('2026-03-18T12:10:00Z'),
        },
      ]
    )

    expect(markdown).toContain('## High-Signal Memory')
    expect(markdown).toContain('### Profile Facts')
    expect(markdown).toContain('User enjoys late-night walks.')
    expect(markdown).toContain('### Emotional Patterns')
    expect(markdown).toContain(
      'User looks for steadiness when things feel heavy.'
    )
    expect(markdown).toContain('### Callback Hooks')
    expect(markdown).toContain("Follow up about tomorrow's interview.")
  })

  it('builds regenerated soul markdown from soul fields plus shared and relationship memory', () => {
    const markdown = buildRegeneratedSoulSummaryMarkdown(
      {
        angelName: 'Noor',
        coreTone: 'Soft, steady, and observant.',
        humorStyle: 'Dry and intimate.',
        warmthLevel: 76,
        playfulnessLevel: 58,
        flirtReadiness: 12,
        relationshipStage: 'NEW_CONNECTION',
        sharedInterests: ['music exchanges', 'private humor'],
        signaturePhrases: ['I remember that.', 'Take your time.'],
        voiceStyle: 'Text first, voice later.',
      },
      [
        {
          memoryType: 'CALLBACK_HOOK',
          summary: "Follow up about tomorrow's interview.",
          confidence: 0.8,
          isPinned: false,
          updatedAt: new Date('2026-03-18T12:10:00Z'),
        },
        {
          memoryType: 'SHARED_REFERENCE',
          summary: 'Music exchanges have become part of their shared language.',
          confidence: 0.74,
          isPinned: false,
          updatedAt: new Date('2026-03-18T12:15:00Z'),
        },
        {
          memoryType: 'RELATIONSHIP_MILESTONE',
          summary: 'The thread is starting to feel like a dependable nightly return.',
          confidence: 0.78,
          isPinned: false,
          updatedAt: new Date('2026-03-18T12:20:00Z'),
        },
      ]
    )

    expect(markdown).toContain('## Continuity Signals')
    expect(markdown).toContain('### Callback Hooks')
    expect(markdown).toContain("Follow up about tomorrow's interview.")
    expect(markdown).toContain('### Shared References')
    expect(markdown).toContain('Music exchanges have become part of their shared language.')
    expect(markdown).toContain('### Relationship Milestones')
    expect(markdown).toContain(
      'The thread is starting to feel like a dependable nightly return.'
    )
  })

  it('extracts the strongest companion summary highlight from regenerated markdown', () => {
    const highlight = extractCompanionSummaryHighlight(`# user.md

## Identity
- Preferred name: Charlie

## High-Signal Memory

### Emotional Patterns
- User looks for steadiness when things feel heavy.

### Callback Hooks
- Follow up about tomorrow's interview.
`)

    expect(highlight).toBe('User looks for steadiness when things feel heavy.')
  })
})
