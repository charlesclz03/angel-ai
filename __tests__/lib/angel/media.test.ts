import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { downloadMediaBufferMock } = vi.hoisted(() => ({
  downloadMediaBufferMock: vi.fn(),
}))

vi.mock('@/lib/media/storage', () => ({
  downloadMediaBuffer: downloadMediaBufferMock,
  resolveAttachmentStoragePath: (input: { metadata?: unknown; url: string }) => {
    if (
      input.metadata &&
      typeof input.metadata === 'object' &&
      !Array.isArray(input.metadata) &&
      typeof (input.metadata as Record<string, unknown>).storagePath === 'string'
    ) {
      return String((input.metadata as Record<string, unknown>).storagePath)
    }

    const match = input.url.match(/\/api\/media\/view\/(.+)$/)
    return match?.[1] ?? null
  },
}))

import { transcribeVoiceAttachment } from '@/lib/angel/media'

describe('angel media', () => {
  beforeEach(() => {
    downloadMediaBufferMock.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('calls the higher-quality OpenAI transcription model for data-url voice notes', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'sk-test')
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ text: 'I made it home.' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const transcript = await transcribeVoiceAttachment(
      {
        type: 'VOICE_AUDIO',
        url: `data:audio/webm;base64,${Buffer.from('voice').toString('base64')}`,
        mimeType: 'audio/webm',
        title: 'voice-note.webm',
      },
      ''
    )

    expect(transcript).toBe('I made it home.')
    const request = fetchMock.mock.calls[0]?.[1] as { body: FormData }
    expect(request.body.get('model')).toBe('gpt-4o-transcribe')
  })

  it('downloads stored voice-note media before transcribing it', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'sk-test')
    downloadMediaBufferMock.mockResolvedValue(Buffer.from('stored-audio'))
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ text: 'The real transcript.' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const transcript = await transcribeVoiceAttachment(
      {
        type: 'VOICE_AUDIO',
        url: '/api/media/view/user-1/voice-note.webm',
        mimeType: 'audio/webm',
        title: 'voice-note.webm',
        metadata: {
          storagePath: 'user-1/voice-note.webm',
        },
      },
      ''
    )

    expect(downloadMediaBufferMock).toHaveBeenCalledWith(
      'user-1/voice-note.webm'
    )
    expect(transcript).toBe('The real transcript.')
  })

  it('falls back to the provided hint when live transcription is unavailable', async () => {
    const transcript = await transcribeVoiceAttachment(
      {
        type: 'VOICE_AUDIO',
        url: '/api/media/view/user-1/voice-note.webm',
        mimeType: 'audio/webm',
        title: 'voice-note.webm',
      },
      'Keep the closeness of the voice note.'
    )

    expect(transcript).toBe('Keep the closeness of the voice note.')
  })
})
