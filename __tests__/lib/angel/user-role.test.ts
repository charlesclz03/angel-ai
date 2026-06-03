import { describe, expect, it } from 'vitest'

import { isBetaTester, isPrivilegedRole } from '@/lib/angel/user-role'

describe('user-role', () => {
  it('isBetaTester returns true for BETA_TESTER role', () => {
    expect(isBetaTester('BETA_TESTER')).toBe(true)
  })

  it('isBetaTester returns false for USER role', () => {
    expect(isBetaTester('USER')).toBe(false)
  })

  it('isBetaTester returns false for null', () => {
    expect(isBetaTester(null)).toBe(false)
  })

  it('isBetaTester returns false for undefined', () => {
    expect(isBetaTester(undefined)).toBe(false)
  })

  it('isPrivilegedRole returns true for BETA_TESTER', () => {
    expect(isPrivilegedRole('BETA_TESTER')).toBe(true)
  })

  it('isPrivilegedRole returns true for ADMIN', () => {
    expect(isPrivilegedRole('ADMIN')).toBe(true)
  })

  it('isPrivilegedRole returns false for USER', () => {
    expect(isPrivilegedRole('USER')).toBe(false)
  })
})
