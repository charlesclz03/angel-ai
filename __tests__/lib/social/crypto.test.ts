import { afterEach, describe, expect, it } from 'vitest'

import {
  decryptSocialToken,
  encryptSocialToken,
} from '@/lib/social/crypto'

const originalEncryptionKey = process.env.SOCIAL_TOKEN_ENCRYPTION_KEY

describe('social token crypto', () => {
  afterEach(() => {
    process.env.SOCIAL_TOKEN_ENCRYPTION_KEY = originalEncryptionKey
  })

  it('roundtrips encrypted social tokens', () => {
    process.env.SOCIAL_TOKEN_ENCRYPTION_KEY =
      'c29jaWFsLXRlc3Qta2V5LXNob3VsZC1iZS1sb25nLWVub3VnaC0xMjM0NTY='

    const encrypted = encryptSocialToken('secret-token-value')

    expect(encrypted).not.toContain('secret-token-value')
    expect(decryptSocialToken(encrypted)).toBe('secret-token-value')
  })

  it('rejects malformed payloads', () => {
    process.env.SOCIAL_TOKEN_ENCRYPTION_KEY =
      'c29jaWFsLXRlc3Qta2V5LXNob3VsZC1iZS1sb25nLWVub3VnaC0xMjM0NTY='

    expect(() => decryptSocialToken('bad.payload')).toThrow(
      /invalid social token payload/i
    )
  })
})
