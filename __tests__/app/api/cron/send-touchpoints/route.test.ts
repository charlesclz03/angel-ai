import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const {
  touchpointFindManyMock,
  touchpointUpdateMock,
  pushSubscriptionDeleteMock,
  sendNotificationMock,
  setVapidDetailsMock,
} = vi.hoisted(() => ({
  touchpointFindManyMock: vi.fn(),
  touchpointUpdateMock: vi.fn(),
  pushSubscriptionDeleteMock: vi.fn(),
  sendNotificationMock: vi.fn(),
  setVapidDetailsMock: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    touchpoint: {
      findMany: touchpointFindManyMock,
      update: touchpointUpdateMock,
    },
    pushSubscription: {
      delete: pushSubscriptionDeleteMock,
    },
  },
}))

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: setVapidDetailsMock,
    sendNotification: sendNotificationMock,
  },
}))

describe('/api/cron/send-touchpoints', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-28T23:30:00.000Z'))
    vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'public-key')
    vi.stubEnv('VAPID_PRIVATE_KEY', 'private-key')
    vi.stubEnv('VAPID_SUBJECT', 'mailto:test@example.com')
    touchpointFindManyMock.mockReset()
    touchpointUpdateMock.mockReset()
    pushSubscriptionDeleteMock.mockReset()
    sendNotificationMock.mockReset()
    setVapidDetailsMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  it('defers push delivery during quiet hours instead of marking the touchpoint as sent', async () => {
    touchpointFindManyMock.mockResolvedValue([
      {
        id: 'touchpoint-1',
        user: {
          pushSubscriptions: [
            {
              id: 'subscription-1',
              endpoint: 'https://push.example/subscription',
              p256dh: 'p256dh-key',
              auth: 'auth-key',
            },
          ],
          preferences: {
            pushNotificationsEnabled: true,
            pushQuietHoursStart: '22:00',
            pushQuietHoursEnd: '07:00',
          },
          companionProfile: {
            timezone: 'Europe/Lisbon',
          },
          soulProfile: {
            angelName: 'Noor',
          },
        },
      },
    ])

    const { GET } = await import('@/app/api/cron/send-touchpoints/route')
    const response = await GET(
      new Request('http://localhost/api/cron/send-touchpoints')
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      sentCount: 0,
    })
    expect(touchpointUpdateMock).not.toHaveBeenCalled()
    expect(sendNotificationMock).not.toHaveBeenCalled()
  })

  it('marks touchpoints as sent and pushes notifications when delivery is eligible', async () => {
    vi.setSystemTime(new Date('2026-03-28T12:00:00.000Z'))
    touchpointFindManyMock.mockResolvedValue([
      {
        id: 'touchpoint-1',
        user: {
          pushSubscriptions: [
            {
              id: 'subscription-1',
              endpoint: 'https://push.example/subscription',
              p256dh: 'p256dh-key',
              auth: 'auth-key',
            },
          ],
          preferences: {
            pushNotificationsEnabled: true,
            pushQuietHoursStart: null,
            pushQuietHoursEnd: null,
          },
          companionProfile: {
            timezone: 'UTC',
          },
          soulProfile: {
            angelName: 'Noor',
          },
        },
      },
    ])
    sendNotificationMock.mockResolvedValue(undefined)

    const { GET } = await import('@/app/api/cron/send-touchpoints/route')
    const response = await GET(
      new Request('http://localhost/api/cron/send-touchpoints')
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      sentCount: 1,
    })
    expect(touchpointUpdateMock).toHaveBeenCalledOnce()
    expect(sendNotificationMock).toHaveBeenCalledOnce()
  })
})
