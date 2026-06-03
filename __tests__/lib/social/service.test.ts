import { describe, expect, it } from 'vitest'

import {
  loadSocialScanStateForUserTx,
  prepareSocialConnect,
} from '@/lib/social/service'

describe('social service', () => {
  it('builds per-platform scan state from connected-account snapshots', async () => {
    const db = {
      connectedSocialAccount: {
        findMany: async () => [
          {
            platform: 'TIKTOK',
            status: 'READY',
            grantedScopes: ['user.info.basic', 'video.list'],
            lastSuccessfulScanAt: new Date('2026-03-24T10:00:00Z'),
            lastErrorMessage: null,
          },
        ],
      },
      socialProfileSnapshot: {
        findMany: async () => [
          {
            platform: 'TIKTOK',
            id: 'profile-1',
          },
        ],
      },
      socialContentSnapshot: {
        findMany: async () => [
          {
            platform: 'TIKTOK',
            id: 'content-1',
          },
          {
            platform: 'TIKTOK',
            id: 'content-2',
          },
        ],
      },
    }

    const states = await loadSocialScanStateForUserTx(db as never, 'user-1')

    expect(states).toHaveLength(5)
    expect(states.find((item) => item.platform === 'tiktok')).toMatchObject({
      status: 'READY',
      grantedScopes: ['user.info.basic', 'video.list'],
      hasImportedData: true,
      lastScannedAt: '2026-03-24T10:00:00.000Z',
    })
    expect(states.find((item) => item.platform === 'instagram')?.status).toBe(
      'NOT_CONNECTED'
    )
  })

  it('returns an unavailable connect result when provider env is missing', () => {
    const originalClientKey = process.env.TIKTOK_CLIENT_KEY
    const originalClientSecret = process.env.TIKTOK_CLIENT_SECRET

    process.env.TIKTOK_CLIENT_KEY = ''
    process.env.TIKTOK_CLIENT_SECRET = ''

    try {
      const prepared = prepareSocialConnect('tiktok')

      expect(prepared.result).toMatchObject({
        status: 'unavailable',
      })
    } finally {
      process.env.TIKTOK_CLIENT_KEY = originalClientKey
      process.env.TIKTOK_CLIENT_SECRET = originalClientSecret
    }
  })
})
