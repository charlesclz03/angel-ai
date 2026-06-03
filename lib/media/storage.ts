import { createClient } from '@supabase/supabase-js'

const MEDIA_BUCKET = 'media-attachments'

export interface StoredMediaAsset {
  url: string
  storagePath: string | null
}

export async function uploadMediaBuffer({
  userId,
  fileName,
  buffer,
  contentType,
}: {
  userId: string
  fileName: string
  buffer: Buffer
  contentType: string
}): Promise<StoredMediaAsset> {
  const supabase = createMediaStorageClient()

  if (!supabase) {
    return {
      url: buildDataUrl(buffer, contentType),
      storagePath: null,
    }
  }

  const normalizedFileName = sanitizeFileName(fileName)
  const storagePath = `${userId}/${Date.now()}-${normalizedFileName}`

  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(storagePath, buffer, {
      upsert: true,
      contentType,
    })

  if (error) {
    throw new Error(`Media upload failed: ${error.message}`)
  }

  return {
    url: buildMediaProxyUrl(storagePath),
    storagePath,
  }
}

export async function downloadMediaBuffer(storagePath: string) {
  const supabase = createMediaStorageClient()

  if (!supabase) {
    return null
  }

  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .download(storagePath)

  if (error || !data) {
    return null
  }

  const arrayBuffer = await data.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export function buildMediaProxyUrl(storagePath: string) {
  return `/api/media/view/${storagePath.replace(/^\/+/, '')}`
}

export function resolveAttachmentStoragePath(input: {
  url: string
  metadata?: unknown
}) {
  if (
    input.metadata &&
    typeof input.metadata === 'object' &&
    !Array.isArray(input.metadata) &&
    typeof (input.metadata as Record<string, unknown>).storagePath === 'string'
  ) {
    return String((input.metadata as Record<string, unknown>).storagePath)
  }

  const directProxyMatch = input.url.match(/\/api\/media\/view\/(.+)$/)
  if (directProxyMatch?.[1]) {
    return decodeURIComponent(directProxyMatch[1])
  }

  return null
}

function createMediaStorageClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!supabaseUrl || !supabaseKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseKey)
}

function buildDataUrl(buffer: Buffer, contentType: string) {
  return `data:${contentType};base64,${buffer.toString('base64')}`
}

function sanitizeFileName(fileName: string) {
  return fileName
    .trim()
    .replace(/[^a-z0-9._-]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
