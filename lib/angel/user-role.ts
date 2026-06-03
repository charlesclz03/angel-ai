export type UserRole = 'USER' | 'BETA_TESTER' | 'ADMIN'

export function isBetaTester(role: string | null | undefined): boolean {
  return role === 'BETA_TESTER'
}

export function isPrivilegedRole(role: string | null | undefined): boolean {
  return role === 'BETA_TESTER' || role === 'ADMIN'
}
