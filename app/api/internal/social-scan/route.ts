import { NextResponse } from 'next/server'

import {
  getSocialWorkerSecretConfigured,
  runPendingSocialScanJobs,
} from '@/lib/social/service'

export async function POST(request: Request) {
  const expectedSecret = process.env.SOCIAL_SCAN_WORKER_SECRET?.trim()
  const receivedSecret =
    request.headers.get('x-angel-worker-secret')?.trim() ?? ''

  if (!getSocialWorkerSecretConfigured() || !expectedSecret) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Worker secret not configured.',
      },
      { status: 503 }
    )
  }

  if (!receivedSecret || receivedSecret !== expectedSecret) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Unauthorized worker request.',
      },
      { status: 401 }
    )
  }

  const summary = await runPendingSocialScanJobs()

  return NextResponse.json({
    ok: true,
    ...summary,
  })
}
