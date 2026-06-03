import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getTierForStripePriceId,
  getTierForStripeStatus,
} from '@/lib/billing/subscription-sync'

describe('subscription-sync tier resolution', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.stubEnv('STRIPE_PRICE_ID_MONTHLY_PRO', 'price_pro_123')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    process.env = originalEnv
  })

  it('getTierForStripePriceId returns PRO for pro price ID', () => {
    expect(getTierForStripePriceId('price_pro_123')).toBe('PRO')
  })

  it('getTierForStripePriceId returns CORE for core price ID', () => {
    expect(getTierForStripePriceId('price_core_456')).toBe('CORE')
  })

  it('getTierForStripePriceId returns CORE for null', () => {
    expect(getTierForStripePriceId(null)).toBe('CORE')
  })

  it('getTierForStripePriceId returns CORE for undefined', () => {
    expect(getTierForStripePriceId(undefined)).toBe('CORE')
  })

  it('getTierForStripeStatus returns FREE for null status', () => {
    expect(getTierForStripeStatus(null)).toBe('FREE')
  })

  it('getTierForStripeStatus returns FREE for canceled status', () => {
    expect(getTierForStripeStatus('canceled')).toBe('FREE')
  })

  it('getTierForStripeStatus returns CORE for active with core price', () => {
    expect(getTierForStripeStatus('active', 'price_core_456')).toBe(
      'CORE'
    )
  })

  it('getTierForStripeStatus returns PRO for active with pro price', () => {
    expect(getTierForStripeStatus('active', 'price_pro_123')).toBe('PRO')
  })

  it('getTierForStripeStatus returns CORE for trialing without price', () => {
    expect(getTierForStripeStatus('trialing')).toBe('CORE')
  })

  it('getTierForStripeStatus returns CORE for past_due with unknown price', () => {
    expect(getTierForStripeStatus('past_due', 'price_unknown')).toBe(
      'CORE'
    )
  })
})
