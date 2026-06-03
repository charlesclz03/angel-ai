import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getServerAuthSessionMock, pushSubscriptionUpsertMock, pushSubscriptionDeleteManyMock } =
  vi.hoisted(() => ({
    getServerAuthSessionMock: vi.fn(),
    pushSubscriptionUpsertMock: vi.fn(),
    pushSubscriptionDeleteManyMock: vi.fn(),
  }))

vi.mock('@/lib/auth', () => ({
  getServerAuthSession: getServerAuthSessionMock,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    pushSubscription: {
      upsert: pushSubscriptionUpsertMock,
      deleteMany: pushSubscriptionDeleteManyMock,
    },
  },
}))

import { DELETE, POST } from '@/app/api/push/subscribe/route'

describe('/api/push/subscribe', () => {
  beforeEach(() => {
    getServerAuthSessionMock.mockReset()
    pushSubscriptionUpsertMock.mockReset()
    pushSubscriptionDeleteManyMock.mockReset()
  })

  it('stores a push subscription for the signed-in user', async () => {
    getServerAuthSessionMock.mockResolvedValue({
      user: { id: 'user-1' },
    })

    const response = await POST(
      new Request('http://localhost/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          endpoint: 'https://push.example/subscription',
          keys: {
            p256dh: 'p256dh-key',
            auth: 'auth-key',
          },
        }),
      })
    )

    expect(response.status).toBe(200)
    expect(pushSubscriptionUpsertMock).toHaveBeenCalledWith({
      where: { endpoint: 'https://push.example/subscription' },
      update: {
        userId: 'user-1',
        p256dh: 'p256dh-key',
        auth: 'auth-key',
      },
      create: {
        userId: 'user-1',
        endpoint: 'https://push.example/subscription',
        p256dh: 'p256dh-key',
        auth: 'auth-key',
      },
    })
  })

  it('removes the current device endpoint on DELETE', async () => {
    getServerAuthSessionMock.mockResolvedValue({
      user: { id: 'user-1' },
    })

    const response = await DELETE(
      new Request('http://localhost/api/push/subscribe', {
        method: 'DELETE',
        body: JSON.stringify({
          endpoint: 'https://push.example/subscription',
        }),
      })
    )

    expect(response.status).toBe(200)
    expect(pushSubscriptionDeleteManyMock).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        endpoint: 'https://push.example/subscription',
      },
    })
  })
})
