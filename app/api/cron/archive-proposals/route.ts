import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return new Response('Unauthorized', { status: 401 })
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    // Find users with attachments older than 30 days that don't already have a scheduled or sent archive proposal
    const usersWithOldMedia = await prisma.user.findMany({
      where: {
        conversations: {
          some: {
            messages: {
              some: {
                attachments: { some: { createdAt: { lt: thirtyDaysAgo } } },
              },
            },
          },
        },
        touchpoints: {
          none: {
            type: 'MEDIA_ARCHIVE_PROPOSAL',
            status: { in: ['SCHEDULED', 'SENT'] },
          },
        },
      },
      select: { id: true },
    })

    const touchpoints = await Promise.all(
      usersWithOldMedia.map((user) =>
        prisma.touchpoint.create({
          data: {
            userId: user.id,
            type: 'MEDIA_ARCHIVE_PROPOSAL',
            // Schedule it for current time so it fires immediately or next wake
            scheduledFor: new Date(),
            status: 'SCHEDULED',
          },
        })
      )
    )

    return NextResponse.json({ success: true, created: touchpoints.length })
  } catch (error) {
    console.error('Archive proposal cron error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
