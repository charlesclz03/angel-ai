import type { MessageAttachmentType, Prisma } from '@prisma/client'

import {
  downloadMediaBuffer,
  resolveAttachmentStoragePath,
} from '@/lib/media/storage'

export interface ChatAttachmentInput {
  type: MessageAttachmentType
  url: string
  mimeType?: string | null
  title?: string | null
  metadata?: Prisma.InputJsonValue
}

export interface AttachmentSummary {
  title: string | null
  detail: string
  sourceLabel: string
}

export interface LinkPreviewMetadata {
  url: string
  title: string | null
  description: string | null
  siteName: string | null
  host: string
}

export async function buildLinkPreviewAttachment(
  url: string
): Promise<ChatAttachmentInput> {
  const preview = await fetchLinkPreview(url)

  return {
    type: 'LINK_PREVIEW',
    url,
    title: preview.title ?? preview.siteName ?? preview.host,
    metadata: {
      url: preview.url,
      title: preview.title,
      description: preview.description,
      siteName: preview.siteName,
      host: preview.host,
    },
  }
}

export async function transcribeVoiceAttachment(
  attachment: ChatAttachmentInput,
  fallbackHint: string
) {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  const transcriptionModel =
    process.env.OPENAI_TRANSCRIPTION_MODEL?.trim() || 'gpt-4o-transcribe'

  if (!apiKey) {
    return buildFallbackVoiceTranscript(attachment, fallbackHint)
  }

  try {
    const audioSource = await loadVoiceAttachmentSource(attachment)

    if (!audioSource) {
      return buildFallbackVoiceTranscript(attachment, fallbackHint)
    }

    const formData = new FormData()
    const extension = guessFileExtension(audioSource.mimeType)
    const voiceFile = new File(
      [audioSource.buffer],
      `voice-note.${extension}`,
      {
        type: audioSource.mimeType,
      }
    )

    formData.append('file', voiceFile)
    formData.append('model', transcriptionModel)
    formData.append(
      'prompt',
      'Transcribe the voice note faithfully. Keep wording natural and concise.'
    )
    formData.append('response_format', 'json')

    const response = await fetch(
      'https://api.openai.com/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      }
    )

    if (!response.ok) {
      return buildFallbackVoiceTranscript(attachment, fallbackHint)
    }

    const payload = (await response.json()) as { text?: string }
    const transcript = payload.text?.trim()

    return transcript
      ? transcript
      : buildFallbackVoiceTranscript(attachment, fallbackHint)
  } catch {
    return buildFallbackVoiceTranscript(attachment, fallbackHint)
  }
}

async function loadVoiceAttachmentSource(attachment: ChatAttachmentInput) {
  if (attachment.url.startsWith('data:')) {
    return decodeDataUrl(attachment.url)
  }

  const storagePath = resolveAttachmentStoragePath(attachment)

  if (!storagePath) {
    return null
  }

  const buffer = await downloadMediaBuffer(storagePath)

  if (!buffer) {
    return null
  }

  return {
    mimeType: attachment.mimeType?.trim() || 'audio/webm',
    buffer,
  }
}

export function buildAttachmentSummary(
  contentType: 'TEXT' | 'LINK' | 'IMAGE' | 'VOICE_NOTE',
  attachments: ChatAttachmentInput[],
  contentText: string
): AttachmentSummary | null {
  if (contentType === 'LINK') {
    const previewAttachment = attachments.find(
      (attachment) => attachment.type === 'LINK_PREVIEW'
    )
    const previewMetadata = toLinkPreviewMetadata(previewAttachment?.metadata)

    if (!previewMetadata) {
      return {
        title: null,
        detail: contentText || 'A link the user wanted to share.',
        sourceLabel: 'Shared link',
      }
    }

    const detail =
      previewMetadata.description?.trim() ||
      previewMetadata.title?.trim() ||
      previewMetadata.host

    return {
      title:
        previewMetadata.title ??
        previewMetadata.siteName ??
        previewMetadata.host,
      detail,
      sourceLabel: previewMetadata.siteName ?? previewMetadata.host,
    }
  }

  if (contentType === 'IMAGE') {
    const imageAttachment = attachments.find(
      (attachment) => attachment.type === 'IMAGE'
    )
    const title = imageAttachment?.title?.trim() || 'Shared image'

    return {
      title,
      detail:
        contentText.trim() ||
        title ||
        'An image the user wanted Angel to react to.',
      sourceLabel: 'Shared image',
    }
  }

  if (contentType === 'VOICE_NOTE') {
    const voiceAttachment = attachments.find(
      (attachment) => attachment.type === 'VOICE_AUDIO'
    )

    return {
      title: voiceAttachment?.title?.trim() || 'Voice note',
      detail:
        contentText.trim() ||
        'A voice note the user sent in the middle of the conversation.',
      sourceLabel: 'Voice note',
    }
  }

  return null
}

export function extractFirstUrl(value: string) {
  const urlMatch = value.match(/https?:\/\/[^\s)]+/i)
  return urlMatch?.[0] ?? null
}

function buildFallbackVoiceTranscript(
  attachment: ChatAttachmentInput,
  fallbackHint: string
) {
  const title = attachment.title?.trim()
  const hint = fallbackHint.trim()

  if (hint) {
    return hint
  }

  if (title) {
    return `Voice note about ${title.replace(/\.[a-z0-9]+$/i, '')}.`
  }

  return 'The user sent a voice note and wanted Angel to stay close to it.'
}

async function fetchLinkPreview(url: string): Promise<LinkPreviewMetadata> {
  const parsedUrl = new URL(url)
  const preview: LinkPreviewMetadata = {
    url,
    title: null,
    description: null,
    siteName: parsedUrl.hostname.replace(/^www\./, ''),
    host: parsedUrl.hostname.replace(/^www\./, ''),
  }

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; AngelAI/0.1; +https://angel.local)',
      },
      next: { revalidate: 60 * 60 },
    })

    const html = await response.text()
    preview.title =
      extractMetaContent(
        html,
        /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i
      ) ??
      extractMetaContent(
        html,
        /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i
      ) ??
      extractMetaContent(html, /<title>([^<]+)<\/title>/i)
    preview.description =
      extractMetaContent(
        html,
        /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i
      ) ??
      extractMetaContent(
        html,
        /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i
      )
    preview.siteName =
      extractMetaContent(
        html,
        /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i
      ) ?? preview.siteName
  } catch {
    return preview
  }

  return preview
}

function extractMetaContent(html: string, pattern: RegExp) {
  const match = html.match(pattern)
  return match?.[1]?.trim() ?? null
}

function toLinkPreviewMetadata(value: Prisma.InputJsonValue | undefined) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  const record = value as Record<string, unknown>

  return {
    url: String(record.url ?? ''),
    title: record.title ? String(record.title) : null,
    description: record.description ? String(record.description) : null,
    siteName: record.siteName ? String(record.siteName) : null,
    host: record.host ? String(record.host) : '',
  } satisfies LinkPreviewMetadata
}

function decodeDataUrl(dataUrl: string) {
  const [header, body] = dataUrl.split(',', 2)
  const mimeType = header.match(/^data:([^;]+);base64$/i)?.[1] ?? 'audio/webm'
  const buffer = Buffer.from(body ?? '', 'base64')

  return {
    mimeType,
    buffer,
  }
}

function guessFileExtension(mimeType: string) {
  if (mimeType.includes('mpeg')) {
    return 'mp3'
  }

  if (mimeType.includes('wav')) {
    return 'wav'
  }

  if (mimeType.includes('ogg')) {
    return 'ogg'
  }

  return 'webm'
}
