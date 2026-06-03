import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolvePushDeliveryDeferral } from '@/lib/push/delivery'
import webpush from 'web-push'

// Configure standard VAPID details
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@angel.ai'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

export async function GET(req: Request) {
  try {
    // 1. Authenticate the cron job (Vercel sets the Authorization header for CRON_SECRET)
    const authHeader = req.headers.get('authorization')
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return new Response('Unauthorized', { status: 401 })
    }

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.warn(
        'VAPID keys not configured, skipping push notification delivery.'
      )
      return NextResponse.json({ success: true, skipped: true })
    }

    // 2. Find pending touchpoints
    const now = new Date()
    const scheduledTouchpoints = await prisma.touchpoint.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledFor: { lte: now },
      },
      include: {
        user: {
          include: {
            pushSubscriptions: true,
            companionProfile: {
              select: {
                timezone: true,
              },
            },
            preferences: {
              select: {
                pushNotificationsEnabled: true,
                pushQuietHoursStart: true,
                pushQuietHoursEnd: true,
              },
            },
            soulProfile: { select: { angelName: true } },
          },
        },
      },
      take: 50, // Process in batches
    })

    if (scheduledTouchpoints.length === 0) {
      return NextResponse.json({ success: true, sentCount: 0 })
    }

    let sentCount = 0

    // 3. Process dispatching
    for (const touchpoint of scheduledTouchpoints) {
      const { user } = touchpoint
      if (!user || user.pushSubscriptions.length === 0) {
        continue
      }

      const deferralReason = resolvePushDeliveryDeferral({
        preferences: user.preferences,
        timeZone: user.companionProfile?.timezone ?? null,
        now,
      })

      if (deferralReason) {
        continue
      }

      // Mark touchpoint as delivered to prevent resending (actual generation of message happens transparently on login)
      // For now, we just want to wake them up.
      await prisma.touchpoint.update({
        where: { id: touchpoint.id },
        data: { status: 'SENT', sentAt: now },
      })

      const angelName = user.soulProfile?.angelName?.trim() || 'Angel'

      const payload = JSON.stringify({
        title: angelName,
        body: `${angelName} sent you a message.`,
        url: '/chat',
      })

      // We resolve the agreed Edge Case 1 & 2:
      // Multi-device -> Since we iterate all subscriptions, broadcast to all (Pro behavior assumed active here).
      // Revoked Permissions -> Delete subscription on 410 Gone.
      const sendPromises = user.pushSubscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payload
          )
        } catch (error: unknown) {
          const err = error as { statusCode?: number }
          if (err.statusCode === 404 || err.statusCode === 410) {
            console.warn(
              'Subscription has expired or is no longer valid: ',
              err
            )
            await prisma.pushSubscription.delete({ where: { id: sub.id } })
          } else {
            console.error('Push notification failed to send: ', err)
          }
        }
      })

      await Promise.all(sendPromises)
      sentCount++
    }

    return NextResponse.json({ success: true, sentCount })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
