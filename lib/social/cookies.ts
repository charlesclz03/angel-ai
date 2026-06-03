import type { SocialPlatformKey } from '@/lib/social/types'

export function getSocialStateCookieName(platform: SocialPlatformKey) {
  return `angel-social-state-${platform}`
}

export function getSocialPkceCookieName(platform: SocialPlatformKey) {
  return `angel-social-pkce-${platform}`
}
