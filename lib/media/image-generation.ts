import { uploadMediaBuffer } from '@/lib/media/storage'

/**
 * AI Photo Memories - Image Generation Service
 *
 * Generates "Memory Snapshot" images via DALL-E 3 (or compatible provider)
 * and stores them through the app's media pipeline for durable hosting.
 *
 * Quota enforcement:
 *  - Angel Core: 2 images / month
 *  - Angel Pro:  15 images / month
 */

const DALLE_API_URL = 'https://api.openai.com/v1/images/generations'
const DALLE_MODEL = 'dall-e-3'
const IMAGE_SIZE = '1024x1024' as const

/** Monthly generation caps per subscription tier */
export const PHOTO_MEMORY_LIMITS: Record<string, number> = {
  CORE: 2,
  PRO: 15,
  FREE: 0,
}

export interface GeneratedMemorySnapshot {
  /** Durable app URL, or a local data URL fallback when storage is unavailable */
  url: string
  /** Backing storage path when durable storage is configured */
  storagePath: string | null
  /** The visual prompt that was sent to the model */
  prompt: string
  /** Revised prompt returned by DALL-E (if available) */
  revisedPrompt: string | null
}

export interface GenerateMemorySnapshotInput {
  userId: string
  visualPrompt: string
}

/**
 * Generate a memory snapshot image from a visual prompt.
 *
 * The prompt should describe the emotional memory, dream, or inside joke
 * that Angel wants to share with the user. The session-primer safety
 * policy is inherited - DALL-E's own content policy provides an additional
 * guardrail against explicit imagery.
 */
export async function generateMemorySnapshot({
  userId,
  visualPrompt,
}: GenerateMemorySnapshotInput): Promise<GeneratedMemorySnapshot> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error(
      '[image-generation] OPENAI_API_KEY is not set. Cannot generate memory snapshots.'
    )
  }

  const safePrompt = buildSafePrompt(visualPrompt)

  const response = await fetch(DALLE_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: DALLE_MODEL,
      prompt: safePrompt,
      n: 1,
      size: IMAGE_SIZE,
      quality: 'standard',
      response_format: 'url',
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'unknown error')
    throw new Error(
      `[image-generation] DALL-E API error ${response.status}: ${errorBody}`
    )
  }

  const json = (await response.json()) as {
    data: Array<{ url: string; revised_prompt?: string }>
  }

  const result = json.data[0]
  if (!result?.url) {
    throw new Error('[image-generation] DALL-E returned no image data.')
  }

  const storedAsset = await persistGeneratedImage({
    sourceUrl: result.url,
    userId,
  })

  return {
    url: storedAsset.url,
    storagePath: storedAsset.storagePath,
    prompt: safePrompt,
    revisedPrompt: result.revised_prompt ?? null,
  }
}

/**
 * Check whether the user has remaining photo memory credits this month.
 */
export function canGeneratePhotoMemory(
  tier: string,
  generatedThisMonth: number
): boolean {
  const limit = PHOTO_MEMORY_LIMITS[tier.toUpperCase()] ?? 0
  return generatedThisMonth < limit
}

/**
 * Wrap the raw visual prompt with Angel-specific style guidance and safety.
 */
function buildSafePrompt(rawPrompt: string): string {
  const stylePrefix =
    'Dreamy, soft-lit digital painting in a warm ethereal style. ' +
    'No text, no logos, no watermarks. Safe for all audiences. '

  return `${stylePrefix}${rawPrompt.trim().slice(0, 800)}`
}

async function persistGeneratedImage({
  sourceUrl,
  userId,
}: {
  sourceUrl: string
  userId: string
}) {
  const response = await fetch(sourceUrl)
  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'unknown error')
    throw new Error(
      `[image-generation] Failed to download generated image ${response.status}: ${errorBody}`
    )
  }

  const contentType = normalizeImageContentType(
    response.headers.get('Content-Type')
  )
  const buffer = Buffer.from(await response.arrayBuffer())

  return uploadMediaBuffer({
    userId,
    fileName: `memory-snapshot.${resolveImageExtension(contentType)}`,
    buffer,
    contentType,
  })
}

function normalizeImageContentType(contentTypeHeader: string | null) {
  const normalized = contentTypeHeader?.split(';')[0]?.trim().toLowerCase()

  if (normalized && normalized.startsWith('image/')) {
    return normalized
  }

  return 'image/png'
}

function resolveImageExtension(contentType: string) {
  switch (contentType) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/webp':
      return 'webp'
    case 'image/gif':
      return 'gif'
    case 'image/avif':
      return 'avif'
    default:
      return 'png'
  }
}
