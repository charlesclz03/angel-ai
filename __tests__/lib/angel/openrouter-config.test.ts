import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getModelForTier,
  isOpenRouterConfigured,
  OPENROUTER_CORE_MODEL,
  OPENROUTER_PRO_MODEL,
} from '@/lib/angel/openrouter-config'

describe('openrouter-config', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.stubEnv('OPENROUTER_API_KEY', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    process.env = originalEnv
  })

  it('getModelForTier returns PRO model for PRO tier', () => {
    expect(getModelForTier('PRO')).toBe(OPENROUTER_PRO_MODEL)
  })

  it('getModelForTier returns CORE model for CORE tier', () => {
    expect(getModelForTier('CORE')).toBe(OPENROUTER_CORE_MODEL)
  })

  it('getModelForTier returns CORE model for FREE tier', () => {
    expect(getModelForTier('FREE')).toBe(OPENROUTER_CORE_MODEL)
  })

  it('getModelForTier returns CORE model for null', () => {
    expect(getModelForTier(null)).toBe(OPENROUTER_CORE_MODEL)
  })

  it('isOpenRouterConfigured returns false without API key', () => {
    expect(isOpenRouterConfigured()).toBe(false)
  })

  it('isOpenRouterConfigured returns true with API key', () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'sk-or-test-123')
    expect(isOpenRouterConfigured()).toBe(true)
  })
})
