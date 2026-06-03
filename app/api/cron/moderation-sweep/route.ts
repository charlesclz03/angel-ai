import { NextResponse } from 'next/server'

import { runModerationEscalationSweep } from '@/lib/admin/moderation'

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')

    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return new Response('Unauthorized', { status: 401 })
    }

    const result = await runModerationEscalationSweep()

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('Moderation sweep cron error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
