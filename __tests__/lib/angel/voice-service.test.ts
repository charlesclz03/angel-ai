import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const {
  messageFindUniqueMock,
  subscriptionFindUniqueMock,
  userFindUniqueMock,
  soulProfileFindUniqueMock,
  messageAttachmentCountMock,
  messageAttachmentCreateMock,
  uploadMediaBufferMock,
} = vi.hoisted(() => ({
  messageFindUniqueMock: vi.fn(),
  subscriptionFindUniqueMock: vi.fn(),
  userFindUniqueMock: vi.fn(),
  soulProfileFindUniqueMock: vi.fn(),
  messageAttachmentCountMock: vi.fn(),
  messageAttachmentCreateMock: vi.fn(),
  uploadMediaBufferMock: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    message: {
      findUnique: messageFindUniqueMock,
    },
    subscription: {
      findUnique: subscriptionFindUniqueMock,
    },
    user: {
      findUnique: userFindUniqueMock,
    },
    soulProfile: {
      findUnique: soulProfileFindUniqueMock,
    },
    messageAttachment: {
      count: messageAttachmentCountMock,
      create: messageAttachmentCreateMock,
    },
  },
}))

vi.mock('@/lib/media/storage', () => ({
  uploadMediaBuffer: uploadMediaBufferMock,
}))

import { generateAngelVoiceReplyForUser } from '@/lib/angel/voice-service'

describe('angel voice service', () => {
  beforeEach(() => {
    vi.stubEnv('OPENAI_API_KEY', 'sk-test')
    messageFindUniqueMock.mockReset()
    subscriptionFindUniqueMock.mockReset()
    userFindUniqueMock.mockReset()
    soulProfileFindUniqueMock.mockReset()
    messageAttachmentCountMock.mockReset()
    messageAttachmentCreateMock.mockReset()
    uploadMediaBufferMock.mockReset()

    messageFindUniqueMock.mockResolvedValue({
      id: 'message-1',
      contentText: 'Stay with this for a minute.',
      senderRole: 'ANGEL',
      conversation: { userId: 'user-1' },
      attachments: [],
    })
    subscriptionFindUniqueMock.mockResolvedValue({ tier: 'CORE' })
    userFindUniqueMock.mockResolvedValue({ role: 'USER' })
    soulProfileFindUniqueMock.mockResolvedValue({
      angelName: 'Noor',
      coreTone: 'Soft, steady, observant.',
      voiceStyle: 'Low, calm, midnight.',
    })
    messageAttachmentCountMock.mockResolvedValue(1)
    uploadMediaBufferMock.mockResolvedValue({
      url: '/api/media/view/user-1/angel-voice-message-1.mp3',
      storagePath: 'user-1/angel-voice-message-1.mp3',
    })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('creates an AI voice attachment for an Angel message under quota', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(Buffer.from([1, 2, 3, 4]), {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
        },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await generateAngelVoiceReplyForUser('user-1', 'message-1')

    expect(result).toEqual({
      status: 'created',
      remainingThisMonth: 3,
    })
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(uploadMediaBufferMock).toHaveBeenCalledOnce()
    expect(messageAttachmentCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        messageId: 'message-1',
        type: 'VOICE_AUDIO',
        title: 'Angel voice reply',
      }),
    })
  })

  it('returns early when the Angel message already has a generated voice reply', async () => {
    messageFindUniqueMock.mockResolvedValue({
      id: 'message-1',
      contentText: 'Stay with this for a minute.',
      senderRole: 'ANGEL',
      conversation: { userId: 'user-1' },
      attachments: [
        {
          id: 'attachment-1',
          type: 'VOICE_AUDIO',
          metadata: { aiGenerated: true },
        },
      ],
    })

    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const result = await generateAngelVoiceReplyForUser('user-1', 'message-1')

    expect(result.status).toBe('already-exists')
    expect(fetchMock).not.toHaveBeenCalled()
    expect(messageAttachmentCreateMock).not.toHaveBeenCalled()
  })

  it('rejects free-tier users before generation starts', async () => {
    subscriptionFindUniqueMock.mockResolvedValue({ tier: 'FREE' })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      generateAngelVoiceReplyForUser('user-1', 'message-1')
    ).rejects.toThrow(/voice replies are already used up/i)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(messageAttachmentCreateMock).not.toHaveBeenCalled()
  })
})
