import type {
  SocialConnectionStatus,
  SocialPlatform,
  SocialScanJobStatus,
} from '@prisma/client'

export type SocialPlatformKey = Lowercase<SocialPlatform>
export type SocialConnectionStatusKey = SocialConnectionStatus | 'NOT_CONNECTED'
export type SocialScanJobStatusKey = SocialScanJobStatus

export interface SocialPlatformDefinition {
  platform: SocialPlatformKey
  label: string
  importSummary: string
  description: string
}

export interface SocialScanStateRecord {
  platform: SocialPlatformKey
  label: string
  status: SocialConnectionStatusKey
  importSummary: string
  description: string
  isConfigured: boolean
  grantedScopes: string[]
  lastScannedAt: string | null
  lastErrorMessage: string | null
  limitedReason: string | null
  hasImportedData: boolean
}

export interface SocialConnectStartResult {
  status: 'redirect' | 'unavailable'
  url?: string
  message?: string
}

export interface SocialActionResult {
  status: 'ok' | 'error'
  message?: string
}

export interface SocialConnectorAuthContext {
  state: string
  redirectUri: string
  codeVerifier?: string
}

export interface SocialTokenBundle {
  accessToken: string
  refreshToken?: string | null
  expiresInSeconds?: number | null
  tokenType?: string | null
  scopes?: string[]
}

export interface NormalizedSocialProfile {
  providerUserId: string | null
  handle: string | null
  displayName: string | null
  bio: string | null
  headline: string | null
  avatarUrl: string | null
  profileUrl: string | null
  metadata?: Record<string, unknown> | null
}

export interface NormalizedSocialContent {
  externalId: string
  contentType: string
  title?: string | null
  textContent?: string | null
  permalink?: string | null
  mediaUrl?: string | null
  postedAt?: Date | null
  metadata?: Record<string, unknown> | null
}

export interface SocialScanResult {
  status: Extract<SocialConnectionStatusKey, 'READY' | 'LIMITED'>
  limitedReason?: string | null
  profile: NormalizedSocialProfile | null
  content: NormalizedSocialContent[]
  grantedScopes: string[]
}

export interface SocialConnector {
  platform: SocialPlatformKey
  getAuthorizationUrl: (
    context: SocialConnectorAuthContext
  ) => SocialConnectStartResult
  exchangeCode: (
    code: string,
    redirectUri: string,
    options?: { codeVerifier?: string }
  ) => Promise<SocialTokenBundle>
  scan: (input: {
    tokens: SocialTokenBundle
    maxItems: number
  }) => Promise<SocialScanResult>
  isConfigured: () => boolean
  getScopes: () => string[]
}

export interface SocialCapabilitySnapshot {
  profile: boolean
  recentContent: boolean
  limitations: string[]
}

export const socialPlatformDefinitions: SocialPlatformDefinition[] = [
  {
    platform: 'instagram',
    label: 'Instagram',
    importSummary:
      'Bio, profile metadata, and recent official Instagram media when the connected account type supports it.',
    description:
      'Uses Meta OAuth only. Personal accounts that do not expose official Instagram data stay limited instead of being scraped.',
  },
  {
    platform: 'facebook',
    label: 'Facebook',
    importSummary:
      'Profile metadata plus recent posts when the granted Meta permissions officially allow it.',
    description:
      'Uses Facebook Login + Graph API. Coverage depends on the granted permissions and approved account capabilities.',
  },
  {
    platform: 'x',
    label: 'X',
    importSummary:
      'Profile metadata and a bounded recent post timeline through user-context OAuth.',
    description:
      'Uses official X OAuth and recent timeline APIs only. No graph scraping or private data collection.',
  },
  {
    platform: 'linkedin',
    label: 'LinkedIn',
    importSummary:
      'Member profile import first, with posts only when the app actually has the necessary LinkedIn product access.',
    description:
      'Defaults to profile-safe import. Unsupported member-post access becomes limited instead of using unofficial scraping.',
  },
  {
    platform: 'tiktok',
    label: 'TikTok',
    importSummary:
      'Basic profile signals and recent public videos through TikTok Login Kit and Display API access.',
    description:
      'Uses official TikTok OAuth and public-content APIs only. No scraping, no DMs, no follower-graph extraction.',
  },
]

export const socialPlatformDefinitionMap = Object.fromEntries(
  socialPlatformDefinitions.map((definition) => [
    definition.platform,
    definition,
  ])
) as Record<SocialPlatformKey, SocialPlatformDefinition>

export const socialPlatformOrder = socialPlatformDefinitions.map(
  (definition) => definition.platform
)

export function buildDefaultSocialScanState(): SocialScanStateRecord[] {
  return socialPlatformOrder.map((platform) => ({
    platform,
    label: socialPlatformDefinitionMap[platform].label,
    status: 'NOT_CONNECTED',
    importSummary: socialPlatformDefinitionMap[platform].importSummary,
    description: socialPlatformDefinitionMap[platform].description,
    isConfigured: false,
    grantedScopes: [],
    lastScannedAt: null,
    lastErrorMessage: null,
    limitedReason: null,
    hasImportedData: false,
  }))
}

export function toSocialPlatformKey(value: string): SocialPlatformKey | null {
  const normalized = value.trim().toLowerCase()

  return socialPlatformOrder.includes(normalized as SocialPlatformKey)
    ? (normalized as SocialPlatformKey)
    : null
}

export function toSocialPlatformEnum(
  platform: SocialPlatformKey
): SocialPlatform {
  return platform.toUpperCase() as SocialPlatform
}

export function fromSocialPlatformEnum(
  platform: SocialPlatform
): SocialPlatformKey {
  return platform.toLowerCase() as SocialPlatformKey
}
