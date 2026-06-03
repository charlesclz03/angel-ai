import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { decryptSocialToken, encryptSocialToken } from '@/lib/social/crypto'
import {
  createPkceVerifier,
  createSocialAuthState,
  getSocialCallbackUrl,
  getSocialConnector,
  isSocialConnectorConfigured,
} from '@/lib/social/connectors'
import { buildSocialMemoryCandidates } from '@/lib/social/memory'
import {
  buildDefaultSocialScanState,
  fromSocialPlatformEnum,
  socialPlatformDefinitionMap,
  socialPlatformOrder,
  toSocialPlatformEnum,
  type SocialActionResult,
  type SocialConnectStartResult,
  type SocialPlatformKey,
  type SocialScanResult,
  type SocialScanStateRecord,
  type SocialTokenBundle,
} from '@/lib/social/types'
import { refreshSessionArtifactsForUser } from '@/lib/angel/session-primer'
import { refreshProfileSummariesTx } from '@/lib/angel/summary-service'

const SOCIAL_SCAN_MAX_ITEMS = 50
const DEFAULT_JOB_LIMIT = 3
const WORKER_STALE_MS = 5 * 60 * 1000

type SocialStateReader = Pick<
  Prisma.TransactionClient,
  'connectedSocialAccount' | 'socialProfileSnapshot' | 'socialContentSnapshot'
>

type SocialMutationReader = Pick<
  Prisma.TransactionClient,
  | 'connectedSocialAccount'
  | 'socialScanJob'
  | 'socialProfileSnapshot'
  | 'socialContentSnapshot'
  | 'memoryEntry'
  | 'companionProfile'
  | 'soulProfile'
  | 'conversation'
  | 'touchpoint'
  | 'onboardingResponse'
  | 'message'
>

type ScanQueueReader = Pick<
  Prisma.TransactionClient,
  | 'connectedSocialAccount'
  | 'socialScanJob'
  | 'socialProfileSnapshot'
  | 'socialContentSnapshot'
  | 'memoryEntry'
  | 'companionProfile'
  | 'soulProfile'
  | 'conversation'
  | 'touchpoint'
  | 'onboardingResponse'
>

export interface PreparedSocialConnect {
  result: SocialConnectStartResult
  state?: string
  codeVerifier?: string
}

export interface SocialCallbackResult {
  status: 'connected' | 'limited'
  platform: SocialPlatformKey
  message: string
}

export interface SocialScanRunSummary {
  processed: number
  succeeded: number
  failed: number
}

export async function loadSocialScanStateForUser(
  userId: string
): Promise<SocialScanStateRecord[]> {
  return prisma.$transaction((tx) => loadSocialScanStateForUserTx(tx, userId))
}

export async function loadSocialScanStateForUserTx(
  db: SocialStateReader,
  userId: string
): Promise<SocialScanStateRecord[]> {
  if (
    !('connectedSocialAccount' in db) ||
    !db.connectedSocialAccount ||
    !('socialProfileSnapshot' in db) ||
    !db.socialProfileSnapshot ||
    !('socialContentSnapshot' in db) ||
    !db.socialContentSnapshot
  ) {
    return buildDefaultSocialScanState()
  }

  const [connectedAccounts, profileSnapshots, contentSnapshots] =
    await Promise.all([
      db.connectedSocialAccount.findMany({
        where: { userId },
        select: {
          platform: true,
          status: true,
          grantedScopes: true,
          lastSuccessfulScanAt: true,
          lastErrorMessage: true,
        },
      }),
      db.socialProfileSnapshot.findMany({
        where: { userId },
        select: {
          platform: true,
          id: true,
        },
      }),
      db.socialContentSnapshot.findMany({
        where: { userId },
        select: {
          platform: true,
          id: true,
        },
      }),
    ])

  const accountByPlatform = new Map(
    connectedAccounts.map((account) => [
      fromSocialPlatformEnum(account.platform),
      account,
    ])
  )
  const profileCountByPlatform = countByPlatform(profileSnapshots)
  const contentCountByPlatform = countByPlatform(contentSnapshots)

  return socialPlatformOrder.map((platform) => {
    const definition = socialPlatformDefinitionMap[platform]
    const account = accountByPlatform.get(platform)
    const grantedScopes =
      account?.grantedScopes &&
      typeof account.grantedScopes === 'object' &&
      Array.isArray(account.grantedScopes)
        ? account.grantedScopes.map((scope) => String(scope))
        : []
    const hasImportedData =
      (profileCountByPlatform.get(platform) ?? 0) > 0 ||
      (contentCountByPlatform.get(platform) ?? 0) > 0

    return {
      platform,
      label: definition.label,
      status: account ? account.status : 'NOT_CONNECTED',
      importSummary: definition.importSummary,
      description: definition.description,
      isConfigured: isSocialConnectorConfigured(platform),
      grantedScopes,
      lastScannedAt: account?.lastSuccessfulScanAt?.toISOString() ?? null,
      lastErrorMessage: account?.lastErrorMessage ?? null,
      limitedReason:
        account?.status === 'LIMITED'
          ? (account.lastErrorMessage ?? null)
          : null,
      hasImportedData,
    } satisfies SocialScanStateRecord
  })
}

export function prepareSocialConnect(
  platform: SocialPlatformKey
): PreparedSocialConnect {
  const connector = getSocialConnector(platform)

  if (!connector.isConfigured()) {
    return {
      result: {
        status: 'unavailable',
        message: `${socialPlatformDefinitionMap[platform].label} is not configured in this environment yet.`,
      },
    }
  }

  const state = createSocialAuthState()
  const codeVerifier = platform === 'x' ? createPkceVerifier() : undefined
  const result = connector.getAuthorizationUrl({
    state,
    redirectUri: getSocialCallbackUrl(platform),
    codeVerifier,
  })

  if (result.status !== 'redirect') {
    return { result }
  }

  return {
    result,
    state,
    codeVerifier,
  }
}

export async function connectSocialAccountForUser(input: {
  userId: string
  platform: SocialPlatformKey
  code: string
  codeVerifier?: string
}): Promise<SocialCallbackResult> {
  const connector = getSocialConnector(input.platform)
  const tokenBundle = await connector.exchangeCode(
    input.code,
    getSocialCallbackUrl(input.platform),
    {
      codeVerifier: input.codeVerifier,
    }
  )

  const connectedStatus = await prisma.$transaction(async (tx) => {
    const account = await upsertConnectedSocialAccountTx(tx, {
      userId: input.userId,
      platform: input.platform,
      tokens: tokenBundle,
    })

    const isComplete = await isOnboardingCompleteForUserTx(tx, input.userId)

    if (isComplete) {
      await enqueueInitialSocialScansTx(
        tx,
        input.userId,
        [input.platform],
        account.id
      )
    }

    return {
      status: account.status,
      accountId: account.id,
      isComplete,
    }
  })

  if (connectedStatus.isComplete) {
    void kickSocialScanWorker()
  }

  return {
    status: connectedStatus.status === 'LIMITED' ? 'limited' : 'connected',
    platform: input.platform,
    message:
      connectedStatus.status === 'LIMITED'
        ? `${socialPlatformDefinitionMap[input.platform].label} connected with official limitations.`
        : `${socialPlatformDefinitionMap[input.platform].label} connected. Angel can start building context from it now.`,
  }
}

export async function enqueueInitialSocialScans(userId: string) {
  const count = await prisma.$transaction((tx) =>
    enqueueInitialSocialScansTx(tx, userId)
  )

  if (count > 0) {
    void kickSocialScanWorker()
  }

  return count
}

export async function enqueueInitialSocialScansTx(
  tx: ScanQueueReader,
  userId: string,
  platforms?: SocialPlatformKey[],
  connectedAccountId?: string
) {
  const platformFilter = platforms?.map(toSocialPlatformEnum)
  const accounts = await tx.connectedSocialAccount.findMany({
    where: {
      userId,
      ...(platformFilter
        ? {
            platform: {
              in: platformFilter,
            },
          }
        : {}),
    },
    select: {
      id: true,
      platform: true,
      status: true,
    },
  })

  let created = 0

  for (const account of accounts) {
    const jobCreated = await ensureSocialScanJobQueuedTx(tx, {
      userId,
      platform: fromSocialPlatformEnum(account.platform),
      connectedAccountId: connectedAccountId ?? account.id,
    })

    if (jobCreated) {
      created += 1
    }
  }

  return created
}

export async function rescanSocialAccountForUser(
  userId: string,
  platform: SocialPlatformKey
): Promise<SocialActionResult> {
  const queued = await prisma.$transaction(async (tx) => {
    const account = await tx.connectedSocialAccount.findUnique({
      where: {
        userId_platform: {
          userId,
          platform: toSocialPlatformEnum(platform),
        },
      },
      select: {
        id: true,
      },
    })

    if (!account) {
      throw new Error('Connect the account before asking Angel to rescan it.')
    }

    await tx.connectedSocialAccount.update({
      where: {
        userId_platform: {
          userId,
          platform: toSocialPlatformEnum(platform),
        },
      },
      data: {
        status: 'CONNECTED',
        lastErrorCode: null,
        lastErrorMessage: null,
      },
    })

    return ensureSocialScanJobQueuedTx(tx, {
      userId,
      platform,
      connectedAccountId: account.id,
    })
  })

  if (queued) {
    void kickSocialScanWorker()
  }

  return {
    status: 'ok',
    message: queued
      ? `${socialPlatformDefinitionMap[platform].label} is rescanning now.`
      : `${socialPlatformDefinitionMap[platform].label} already has a pending scan.`,
  }
}

export async function deleteImportedSocialDataForUser(
  userId: string,
  platform: SocialPlatformKey
): Promise<SocialActionResult> {
  await prisma.$transaction(async (tx) => {
    await purgeSocialPlatformArtifactsTx(tx, userId, platform)

    await tx.connectedSocialAccount.updateMany({
      where: {
        userId,
        platform: toSocialPlatformEnum(platform),
      },
      data: {
        status: 'CONNECTED',
        lastSuccessfulScanAt: null,
        lastErrorCode: null,
        lastErrorMessage: null,
      },
    })

    await refreshProfileSummariesTx(tx, userId)
    await refreshSessionArtifactsForUser(tx, userId)
  })

  return {
    status: 'ok',
    message: `${socialPlatformDefinitionMap[platform].label} imports were removed, but the connection is still available for a future rescan.`,
  }
}

export async function disconnectSocialAccountForUser(
  userId: string,
  platform: SocialPlatformKey
): Promise<SocialActionResult> {
  await prisma.$transaction(async (tx) => {
    await purgeSocialPlatformArtifactsTx(tx, userId, platform)

    await tx.socialScanJob.deleteMany({
      where: {
        userId,
        platform: toSocialPlatformEnum(platform),
      },
    })

    await tx.connectedSocialAccount.deleteMany({
      where: {
        userId,
        platform: toSocialPlatformEnum(platform),
      },
    })

    await refreshProfileSummariesTx(tx, userId)
    await refreshSessionArtifactsForUser(tx, userId)
  })

  return {
    status: 'ok',
    message: `${socialPlatformDefinitionMap[platform].label} was disconnected and its imported context was removed.`,
  }
}

export async function runPendingSocialScanJobs(options?: {
  userId?: string
  limit?: number
}) {
  const claimedJobs = await claimPendingSocialScanJobs(
    options?.userId,
    options?.limit ?? DEFAULT_JOB_LIMIT
  )

  let succeeded = 0
  let failed = 0

  for (const job of claimedJobs) {
    try {
      await processSocialScanJob(job.id)
      succeeded += 1
    } catch {
      failed += 1
    }
  }

  return {
    processed: claimedJobs.length,
    succeeded,
    failed,
  } satisfies SocialScanRunSummary
}

export async function maybeRunPendingSocialScansInline(userId: string) {
  if (process.env.SOCIAL_SCAN_WORKER_SECRET?.trim()) {
    return
  }

  await runPendingSocialScanJobs({
    userId,
    limit: 1,
  })
}

export function getSocialWorkerSecretConfigured() {
  return Boolean(process.env.SOCIAL_SCAN_WORKER_SECRET?.trim())
}

export async function getSocialReturnPathForUser(userId: string) {
  const isComplete = await prisma.$transaction((tx) =>
    isOnboardingCompleteForUserTx(tx, userId)
  )

  return isComplete ? '/chat' : '/onboarding'
}

export async function kickSocialScanWorker() {
  const workerSecret = process.env.SOCIAL_SCAN_WORKER_SECRET?.trim()
  const siteUrl =
    process.env.NEXTAUTH_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim()

  if (!workerSecret || !siteUrl) {
    return
  }

  try {
    await fetch(new URL('/api/internal/social-scan', siteUrl), {
      method: 'POST',
      headers: {
        'x-angel-worker-secret': workerSecret,
      },
      cache: 'no-store',
    })
  } catch {
    // Worker kicking is best-effort.
  }
}

async function claimPendingSocialScanJobs(
  userId: string | undefined,
  limit: number
) {
  const now = new Date()
  const staleCutoff = new Date(now.getTime() - WORKER_STALE_MS)
  const candidates = await prisma.socialScanJob.findMany({
    where: {
      ...(userId ? { userId } : {}),
      attemptCount: {
        lt: 5,
      },
      OR: [
        {
          status: 'QUEUED',
        },
        {
          status: 'FAILED',
          claimedAt: {
            lt: staleCutoff,
          },
        },
      ],
    },
    orderBy: {
      createdAt: 'asc',
    },
    take: limit,
    select: {
      id: true,
      status: true,
      attemptCount: true,
    },
  })

  const claimed: Array<{ id: string }> = []

  for (const candidate of candidates) {
    const updated = await prisma.socialScanJob.updateMany({
      where: {
        id: candidate.id,
        status: candidate.status,
        attemptCount: candidate.attemptCount,
      },
      data: {
        status: 'RUNNING',
        claimedAt: now,
        attemptCount: candidate.attemptCount + 1,
        lastErrorCode: null,
        lastErrorMessage: null,
      },
    })

    if (updated.count > 0) {
      claimed.push({ id: candidate.id })
    }
  }

  return claimed
}

async function processSocialScanJob(jobId: string) {
  const job = await prisma.socialScanJob.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      userId: true,
      platform: true,
      connectedAccountId: true,
      attemptCount: true,
      maxAttempts: true,
    },
  })

  if (!job) {
    return
  }

  const platform = fromSocialPlatformEnum(job.platform)
  const account = await prisma.connectedSocialAccount.findUnique({
    where: {
      userId_platform: {
        userId: job.userId,
        platform: job.platform,
      },
    },
    select: {
      id: true,
      accessTokenEncrypted: true,
      refreshTokenEncrypted: true,
      tokenType: true,
      expiresAt: true,
    },
  })

  if (!account?.accessTokenEncrypted) {
    await markSocialScanJobFailed(job.id, {
      code: 'MISSING_TOKEN',
      message: 'The social account no longer has a usable access token.',
      userId: job.userId,
      platform,
    })
    return
  }

  await prisma.connectedSocialAccount.updateMany({
    where: {
      userId: job.userId,
      platform: job.platform,
    },
    data: {
      status: 'SCANNING',
      lastErrorCode: null,
      lastErrorMessage: null,
    },
  })

  try {
    const connector = getSocialConnector(platform)
    const result = await connector.scan({
      tokens: {
        accessToken: decryptSocialToken(account.accessTokenEncrypted),
        refreshToken: account.refreshTokenEncrypted
          ? decryptSocialToken(account.refreshTokenEncrypted)
          : null,
        tokenType: account.tokenType ?? null,
        expiresInSeconds:
          account.expiresAt != null
            ? Math.max(
                0,
                Math.floor((account.expiresAt.getTime() - Date.now()) / 1000)
              )
            : null,
      },
      maxItems: SOCIAL_SCAN_MAX_ITEMS,
    })

    await prisma.$transaction(async (tx) => {
      await persistSocialScanResultTx(tx, {
        userId: job.userId,
        platform,
        connectedAccountId: account.id,
        result,
      })

      await tx.socialScanJob.update({
        where: { id: job.id },
        data: {
          status: 'SUCCEEDED',
          claimedAt: null,
          lastErrorCode: result.status === 'LIMITED' ? 'LIMITED' : null,
          lastErrorMessage: result.limitedReason ?? null,
        },
      })
    })
  } catch (cause) {
    await markSocialScanJobFailed(job.id, {
      code: 'SCAN_FAILED',
      message:
        cause instanceof Error ? cause.message : 'The provider scan failed.',
      userId: job.userId,
      platform,
    })
  }
}

async function persistSocialScanResultTx(
  tx: SocialMutationReader,
  input: {
    userId: string
    platform: SocialPlatformKey
    connectedAccountId: string
    result: SocialScanResult
  }
) {
  const now = new Date()
  const platformEnum = toSocialPlatformEnum(input.platform)

  await tx.connectedSocialAccount.update({
    where: {
      userId_platform: {
        userId: input.userId,
        platform: platformEnum,
      },
    },
    data: {
      providerUserId: input.result.profile?.providerUserId ?? undefined,
      handle: input.result.profile?.handle ?? undefined,
      displayName: input.result.profile?.displayName ?? undefined,
      grantedScopes: input.result.grantedScopes,
      status: input.result.status,
      lastSuccessfulScanAt: now,
      lastErrorCode: input.result.status === 'LIMITED' ? 'LIMITED' : null,
      lastErrorMessage: input.result.limitedReason ?? null,
    },
  })

  if (input.result.profile) {
    await tx.socialProfileSnapshot.upsert({
      where: {
        userId_platform: {
          userId: input.userId,
          platform: platformEnum,
        },
      },
      create: {
        userId: input.userId,
        connectedAccountId: input.connectedAccountId,
        platform: platformEnum,
        platformUserId: input.result.profile.providerUserId,
        handle: input.result.profile.handle,
        displayName: input.result.profile.displayName,
        bio: input.result.profile.bio,
        headline: input.result.profile.headline,
        avatarUrl: input.result.profile.avatarUrl,
        profileUrl: input.result.profile.profileUrl,
        metadata: toInputJsonValue(input.result.profile.metadata),
        scannedAt: now,
      },
      update: {
        connectedAccountId: input.connectedAccountId,
        platformUserId: input.result.profile.providerUserId,
        handle: input.result.profile.handle,
        displayName: input.result.profile.displayName,
        bio: input.result.profile.bio,
        headline: input.result.profile.headline,
        avatarUrl: input.result.profile.avatarUrl,
        profileUrl: input.result.profile.profileUrl,
        metadata: toInputJsonValue(input.result.profile.metadata),
        scannedAt: now,
      },
    })
  }

  const contentIds = input.result.content.map((item) => item.externalId)

  await tx.socialContentSnapshot.deleteMany({
    where: {
      userId: input.userId,
      platform: platformEnum,
      ...(contentIds.length > 0
        ? {
            externalId: {
              notIn: contentIds,
            },
          }
        : {}),
    },
  })

  for (const item of input.result.content) {
    await tx.socialContentSnapshot.upsert({
      where: {
        userId_platform_externalId: {
          userId: input.userId,
          platform: platformEnum,
          externalId: item.externalId,
        },
      },
      create: {
        userId: input.userId,
        connectedAccountId: input.connectedAccountId,
        platform: platformEnum,
        externalId: item.externalId,
        contentType: item.contentType,
        title: item.title,
        textContent: item.textContent,
        permalink: item.permalink,
        mediaUrl: item.mediaUrl,
        postedAt: item.postedAt ?? undefined,
        metadata: toInputJsonValue(item.metadata),
        scannedAt: now,
      },
      update: {
        connectedAccountId: input.connectedAccountId,
        contentType: item.contentType,
        title: item.title,
        textContent: item.textContent,
        permalink: item.permalink,
        mediaUrl: item.mediaUrl,
        postedAt: item.postedAt ?? undefined,
        metadata: toInputJsonValue(item.metadata),
        scannedAt: now,
      },
    })
  }

  await purgeSocialPlatformMemoryTx(tx, input.userId, input.platform)

  const memoryCandidates = buildSocialMemoryCandidates({
    platform: input.platform,
    profile: input.result.profile,
    content: input.result.content,
  })

  if (memoryCandidates.length > 0) {
    await tx.memoryEntry.createMany({
      data: memoryCandidates.map((candidate) => ({
        userId: input.userId,
        sourceMessageId: null,
        memoryType: candidate.memoryType,
        summary: candidate.summary,
        confidence: candidate.confidence,
        isPinned: false,
        isHidden: false,
        sourceContext: toInputJsonValue(candidate.sourceContext),
      })),
    })
  }

  await refreshProfileSummariesTx(tx, input.userId)
  await refreshSessionArtifactsForUser(tx, input.userId)
}

async function markSocialScanJobFailed(
  jobId: string,
  input: {
    code: string
    message: string
    userId: string
    platform: SocialPlatformKey
  }
) {
  await prisma.$transaction(async (tx) => {
    await tx.socialScanJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        claimedAt: null,
        lastErrorCode: input.code,
        lastErrorMessage: input.message,
      },
    })

    await tx.connectedSocialAccount.updateMany({
      where: {
        userId: input.userId,
        platform: toSocialPlatformEnum(input.platform),
      },
      data: {
        status: 'FAILED',
        lastErrorCode: input.code,
        lastErrorMessage: input.message,
      },
    })
  })
}

async function upsertConnectedSocialAccountTx(
  tx: ScanQueueReader,
  input: {
    userId: string
    platform: SocialPlatformKey
    tokens: SocialTokenBundle
  }
) {
  const platformEnum = toSocialPlatformEnum(input.platform)
  const expiresAt =
    input.tokens.expiresInSeconds != null
      ? new Date(Date.now() + input.tokens.expiresInSeconds * 1000)
      : undefined

  return tx.connectedSocialAccount.upsert({
    where: {
      userId_platform: {
        userId: input.userId,
        platform: platformEnum,
      },
    },
    create: {
      userId: input.userId,
      platform: platformEnum,
      grantedScopes: input.tokens.scopes ?? [],
      status: 'CONNECTED',
      tokenType: input.tokens.tokenType ?? undefined,
      accessTokenEncrypted: encryptSocialToken(input.tokens.accessToken),
      refreshTokenEncrypted: input.tokens.refreshToken
        ? encryptSocialToken(input.tokens.refreshToken)
        : undefined,
      expiresAt,
    },
    update: {
      grantedScopes: input.tokens.scopes ?? [],
      status: 'CONNECTED',
      tokenType: input.tokens.tokenType ?? undefined,
      accessTokenEncrypted: encryptSocialToken(input.tokens.accessToken),
      refreshTokenEncrypted: input.tokens.refreshToken
        ? encryptSocialToken(input.tokens.refreshToken)
        : null,
      expiresAt,
      lastErrorCode: null,
      lastErrorMessage: null,
    },
  })
}

async function ensureSocialScanJobQueuedTx(
  tx: ScanQueueReader,
  input: {
    userId: string
    platform: SocialPlatformKey
    connectedAccountId: string
  }
) {
  const platformEnum = toSocialPlatformEnum(input.platform)
  const existing = await tx.socialScanJob.findFirst({
    where: {
      userId: input.userId,
      platform: platformEnum,
      connectedAccountId: input.connectedAccountId,
      status: {
        in: ['QUEUED', 'RUNNING'],
      },
    },
    select: {
      id: true,
    },
  })

  if (existing) {
    return false
  }

  await tx.socialScanJob.create({
    data: {
      userId: input.userId,
      platform: platformEnum,
      connectedAccountId: input.connectedAccountId,
      status: 'QUEUED',
    },
  })

  return true
}

async function isOnboardingCompleteForUserTx(
  tx: Pick<
    Prisma.TransactionClient,
    'companionProfile' | 'soulProfile' | 'conversation' | 'touchpoint'
  >,
  userId: string
) {
  const [companionProfile, soulProfile, conversation, touchpoint] =
    await Promise.all([
      tx.companionProfile.findUnique({
        where: { userId },
        select: { id: true },
      }),
      tx.soulProfile.findUnique({
        where: { userId },
        select: { id: true },
      }),
      tx.conversation.findFirst({
        where: { userId, status: 'ACTIVE' },
        select: { id: true },
      }),
      tx.touchpoint.findFirst({
        where: { userId, type: 'FOLLOWUP' },
        select: { id: true },
      }),
    ])

  return Boolean(companionProfile && soulProfile && conversation && touchpoint)
}

async function purgeSocialPlatformArtifactsTx(
  tx: SocialMutationReader,
  userId: string,
  platform: SocialPlatformKey
) {
  await tx.socialContentSnapshot.deleteMany({
    where: {
      userId,
      platform: toSocialPlatformEnum(platform),
    },
  })

  await tx.socialProfileSnapshot.deleteMany({
    where: {
      userId,
      platform: toSocialPlatformEnum(platform),
    },
  })

  await purgeSocialPlatformMemoryTx(tx, userId, platform)
}

async function purgeSocialPlatformMemoryTx(
  tx: Pick<Prisma.TransactionClient, 'memoryEntry'>,
  userId: string,
  platform: SocialPlatformKey
) {
  await tx.memoryEntry.deleteMany({
    where: {
      userId,
      sourceContext: {
        path: ['origin'],
        equals: 'social_scan',
      },
      AND: [
        {
          sourceContext: {
            path: ['platform'],
            equals: platform,
          },
        },
      ],
    },
  })
}

function countByPlatform(rows: Array<{ platform: Prisma.JsonValue | string }>) {
  const counts = new Map<SocialPlatformKey, number>()

  for (const row of rows) {
    const platform =
      typeof row.platform === 'string'
        ? (row.platform.toLowerCase() as SocialPlatformKey)
        : null

    if (!platform || !socialPlatformOrder.includes(platform)) {
      continue
    }

    counts.set(platform, (counts.get(platform) ?? 0) + 1)
  }

  return counts
}

function toInputJsonValue(value: Record<string, unknown> | null | undefined) {
  return value == null ? undefined : (value as Prisma.InputJsonValue)
}
