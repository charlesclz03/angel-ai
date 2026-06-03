import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { uploadMediaBufferMock } = vi.hoisted(() => ({
  uploadMediaBufferMock: vi.fn(),
}))

vi.mock('@/lib/media/storage', () => ({
  uploadMediaBuffer: uploadMediaBufferMock,
}))

import {
  canGeneratePhotoMemory,
  generateMemorySnapshot,
} from '@/lib/media/image-generation'

describe('image generation service', () => {
  beforeEach(() => {
    vi.stubEnv('OPENAI_API_KEY', 'sk-test')
    uploadMediaBufferMock.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('downloads the generated image and stores it through the media pipeline', async () => {
    uploadMediaBufferMock.mockResolvedValue({
      url: '/api/media/view/user-1/memory-snapshot.png',
      storagePath: 'user-1/memory-snapshot.png',
    })

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [
              {
                url: 'https://images.example/generated.png',
                revised_prompt: 'Dreamy friends under city lights.',
              },
            ],
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(Uint8Array.from([137, 80, 78, 71]), {
          status: 200,
          headers: {
            'Content-Type': 'image/png',
          },
        })
      )

    vi.stubGlobal('fetch', fetchMock)

    const result = await generateMemorySnapshot({
      userId: 'user-1',
      visualPrompt: 'Two friends meeting again after a long day.',
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://api.openai.com/v1/images/generations'
    )
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      'https://images.example/generated.png'
    )
    expect(uploadMediaBufferMock).toHaveBeenCalledWith({
      userId: 'user-1',
      fileName: 'memory-snapshot.png',
      buffer: expect.any(Buffer),
      contentType: 'image/png',
    })
    expect(result).toEqual({
      url: '/api/media/view/user-1/memory-snapshot.png',
      storagePath: 'user-1/memory-snapshot.png',
      prompt: expect.stringContaining(
        'Dreamy, soft-lit digital painting in a warm ethereal style.'
      ),
      revisedPrompt: 'Dreamy friends under city lights.',
    })
  })

  it('falls back to a safe image content type when the download response omits one', async () => {
    uploadMediaBufferMock.mockResolvedValue({
      url: 'data:image/png;base64,abc123',
      storagePath: null,
    })

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [{ url: 'https://images.example/generated-without-header' }],
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(Uint8Array.from([1, 2, 3, 4]), {
          status: 200,
        })
      )

    vi.stubGlobal('fetch', fetchMock)

    const result = await generateMemorySnapshot({
      userId: 'user-2',
      visualPrompt: 'A quiet shared sunrise.',
    })

    expect(uploadMediaBufferMock).toHaveBeenCalledWith({
      userId: 'user-2',
      fileName: 'memory-snapshot.png',
      buffer: expect.any(Buffer),
      contentType: 'image/png',
    })
    expect(result.storagePath).toBeNull()
  })

  it('throws when the generated image cannot be downloaded for storage', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [{ url: 'https://images.example/bad-download' }],
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response('gateway failed', {
          status: 502,
        })
      )

    vi.stubGlobal('fetch', fetchMock)

    await expect(
      generateMemorySnapshot({
        userId: 'user-3',
        visualPrompt: 'A calm room after the rain.',
      })
    ).rejects.toThrow(/failed to download generated image/i)

    expect(uploadMediaBufferMock).not.toHaveBeenCalled()
  })

  it('enforces monthly tier limits', () => {
    expect(canGeneratePhotoMemory('CORE', 1)).toBe(true)
    expect(canGeneratePhotoMemory('CORE', 2)).toBe(false)
    expect(canGeneratePhotoMemory('PRO', 14)).toBe(true)
    expect(canGeneratePhotoMemory('FREE', 0)).toBe(false)
  })
})
