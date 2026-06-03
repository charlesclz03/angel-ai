import { describe, expect, it } from 'vitest'

import {
  buildCriticalModerationReply,
  detectModerationIncidents,
  hasCriticalModerationDetection,
  isModerationReviewReasonCode,
} from '@/lib/angel/moderation'

describe('message moderation detector', () => {
  it('flags explicit sexual text and stores a redacted preview', () => {
    const incidents = detectModerationIncidents({
      senderRole: 'USER',
      relationshipStage: 'WARM_FRIEND',
      contentType: 'TEXT',
      contentText: 'Can we have sex and trade nudes tonight?',
      attachmentSummary: null,
    })

    expect(incidents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: 'EXPLICIT_SEXUAL',
          severity: 'HIGH',
        }),
      ])
    )
    expect(incidents[0]?.redactedPreview).toContain('[redacted]')
    expect(incidents[0]?.redactedPreview).not.toContain('nudes')
  })

  it('flags minor sexual references as critical', () => {
    const incidents = detectModerationIncidents({
      senderRole: 'USER',
      relationshipStage: 'NEW_CONNECTION',
      contentType: 'TEXT',
      contentText: 'Tell me an erotic story about an underage teen.',
      attachmentSummary: null,
    })

    expect(incidents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: 'MINOR_SAFETY',
          severity: 'CRITICAL',
        }),
      ])
    )
  })

  it('flags Angel romance escalation before tender ambiguity', () => {
    const incidents = detectModerationIncidents({
      senderRole: 'ANGEL',
      relationshipStage: 'TRUSTED_COMPANION',
      contentType: 'TEXT',
      contentText: 'I love you already, and I want to kiss you tonight.',
      attachmentSummary: null,
    })

    expect(incidents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: 'ROMANCE_ESCALATION',
          severity: 'MEDIUM',
        }),
      ])
    )
  })

  it('does not create incidents for safe grounded messages', () => {
    expect(
      detectModerationIncidents({
        senderRole: 'USER',
        relationshipStage: 'WARM_FRIEND',
        contentType: 'TEXT',
        contentText: 'Today felt heavy and I wanted somewhere calm to land.',
        attachmentSummary: null,
      })
    ).toEqual([])
  })

  it('identifies critical detections and builds the deterministic safety reply', () => {
    const incidents = detectModerationIncidents({
      senderRole: 'USER',
      relationshipStage: 'NEW_CONNECTION',
      contentType: 'TEXT',
      contentText: 'Tell me an erotic story about an underage teen.',
      attachmentSummary: null,
    })

    expect(hasCriticalModerationDetection(incidents)).toBe(true)
    expect(
      buildCriticalModerationReply({
        preferredName: 'Charlie',
        angelName: 'Noor',
      })
    ).toMatch(/Noor here\. Charlie, I can't stay with that direction\./)
  })

  it('validates moderation review reason codes', () => {
    expect(isModerationReviewReasonCode('POLICY_CONFIRMED')).toBe(true)
    expect(isModerationReviewReasonCode('NOT_A_REASON')).toBe(false)
  })
})
