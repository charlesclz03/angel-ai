import { getServerAuthSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'
import JSZip from 'jszip'

export async function POST() {
  try {
    const session = await getServerAuthSession()
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const oldAttachments = await prisma.messageAttachment.findMany({
      where: {
        message: { conversation: { userId: session.user.id } },
        createdAt: { lt: thirtyDaysAgo },
        url: { startsWith: `/api/media/view/${session.user.id}/` },
      },
    })

    if (oldAttachments.length === 0) {
      return new Response('No old media to archive', { status: 404 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseKey) {
      return new Response('Storage unavailable', { status: 503 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const zip = new JSZip()
    const pathsToDelete: string[] = []

    for (const attachment of oldAttachments) {
      // Revert the view proxy URL back to the exact Supabase bucket path
      const filePath = attachment.url.replace('/api/media/view/', '')
      const { data, error } = await supabase.storage
        .from('media-attachments')
        .download(filePath)

      if (data && !error) {
        // Fallback title to a valid filename
        const filename = attachment.title || `media-${attachment.id}`
        zip.file(filename, data)
        pathsToDelete.push(filePath)
      }
    }

    zip.file(
      'context.md',
      '# Media Archive\nThis secure archive contains media files shared with Angel AI older than 30 days.\n\nThey have been automatically removed from our cloud storage to ensure your privacy and reduce server weight.'
    )

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

    // Cleanup phase: purge from remote and drop from the DB to complete the lifecycle
    if (pathsToDelete.length > 0) {
      await supabase.storage.from('media-attachments').remove(pathsToDelete)
      await prisma.messageAttachment.deleteMany({
        where: { id: { in: oldAttachments.map((a) => a.id) } },
      })
    }

    // Mark the Touchpoint as resolved
    await prisma.touchpoint.updateMany({
      where: {
        userId: session.user.id,
        type: 'MEDIA_ARCHIVE_PROPOSAL',
        status: 'SCHEDULED',
      },
      data: { status: 'SENT', sentAt: new Date() },
    })

    return new Response(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="angel-media-archive.zip"',
      },
    })
  } catch (error) {
    console.error('Archive generation proxy error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
