import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const {
  messageFindUniqueMock,
  subscriptionFindUniqueMock,
  userFindUniqueMock,
  companionProfileFindUniqueMock,
  soulProfileFindUniqueMock,
  photoMemoryCountMock,
  photoMemoryFindUniqueMock,
  photoMemoryCreateMock,
  messageAttachmentCreateMock,
  prismaTransactionMock,
  generateMemorySnapshotMock,
} = vi.hoisted(() => ({
  messageFindUniqueMock: vi.fn(),
  subscriptionFindUniqueMock: vi.fn(),
  userFindUniqueMock: vi.fn(),
  companionProfileFindUniqueMock: vi.fn(),
  soulProfileFindUniqueMock: vi.fn(),
  photoMemoryCountMock: vi.fn(),
  photoMemoryFindUniqueMock: vi.fn(),
  photoMemoryCreateMock: vi.fn(),
  messageAttachmentCreateMock: vi.fn(),
  prismaTransactionMock: vi.fn(),
  generateMemorySnapshotMock: vi.fn(),
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
    companionProfile: {
      findUnique: companionProfileFindUniqueMock,
    },
    soulProfile: {
      findUnique: soulProfileFindUniqueMock,
    },
    photoMemory: {
      count: photoMemoryCountMock,
      findUnique: photoMemoryFindUniqueMock,
      create: photoMemoryCreateMock,
    },
    messageAttachment: {
      create: messageAttachmentCreateMock,
    },
    $transaction: prismaTransactionMock,
  },
}))

vi.mock('@/lib/media/image-generation', async () => {
  const actual = await vi.importActual<typeof import('@/lib/media/image-generation')>(
    '@/lib/media/image-generation'
  )

  return {
    ...actual,
    generateMemorySnapshot: generateMemorySnapshotMock,
  }
})

import {
  generatePhotoMemoryForUser,
  resolvePhotoMemoryStatusForUser,
} from '@/lib/angel/photo-memory-service'

describe('photo memory service', () => {
  beforeEach(() => {
    vi.stubEnv('OPENAI_API_KEY', 'sk-test')
    messageFindUniqueMock.mockReset()
    subscriptionFindUniqueMock.mockReset()
    userFindUniqueMock.mockReset()
    companionProfileFindUniqueMock.mockReset()
    soulProfileFindUniqueMock.mockReset()
    photoMemoryCountMock.mockReset()
    photoMemoryFindUniqueMock.mockReset()
    photoMemoryCreateMock.mockReset()
    messageAttachmentCreateMock.mockReset()
    prismaTransactionMock.mockReset()
    generateMemorySnapshotMock.mockReset()

    messageFindUniqueMock.mockResolvedValue({
      id: 'message-1',
      contentText: 'Stay with this moment for a little longer.',
      senderRole: 'ANGEL',
      conversation: { userId: 'user-1' },
      photoMemories: [],
    })
    subscriptionFindUniqueMock.mockResolvedValue({ tier: 'CORE' })
    userFindUniqueMock.mockResolvedValue({ role: 'USER' })
    companionProfileFindUniqueMock.mockResolvedValue({
      preferredName: 'Charlie',
    })
    soulProfileFindUniqueMock.mockResolvedValue({
      angelName: 'Noor',
      coreTone: 'Soft and calm.',
    })
    photoMemoryCountMock.mockResolvedValue(1)
    photoMemoryFindUniqueMock.mockResolvedValue(null)
    messageAttachmentCreateMock.mockResolvedValue({
      id: 'attachment-1',
    })
    photoMemoryCreateMock.mockResolvedValue({
      id: 'photo-memory-1',
    })
    prismaTransactionMock.mockImplementation(async (callback) =>
      callback({
        photoMemory: {
          findUnique: photoMemoryFindUniqueMock,
          create: photoMemoryCreateMock,
        },
        messageAttachment: {
          create: messageAttachmentCreateMock,
        },
      })
    )
    generateMemorySnapshotMock.mockResolvedValue({
      url: '/api/media/view/user-1/memory-snapshot.png',
      storagePath: 'user-1/memory-snapshot.png',
      prompt: 'Dreamy snapshot.',
      revisedPrompt: 'Dreamy snapshot, refined.',
    })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('creates a generated image attachment and photo memory record for an Angel message', async () => {
    const result = await generatePhotoMemoryForUser('user-1', 'message-1')

    expect(result).toEqual({
      status: 'created',
      remainingThisMonth: 0,
    })
    expect(generateMemorySnapshotMock).toHaveBeenCalledOnce()
    expect(messageAttachmentCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        messageId: 'message-1',
        type: 'IMAGE',
        title: 'Memory snapshot',
      }),
    })
    expect(photoMemoryCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        messageId: 'message-1',
        attachmentId: 'attachment-1',
      }),
    })
  })

  it('returns early when the message already has a generated photo memory', async () => {
    messageFindUniqueMock.mockResolvedValue({
      id: 'message-1',
      contentText: 'Stay with this moment for a little longer.',
      senderRole: 'ANGEL',
      conversation: { userId: 'user-1' },
      photoMemories: [{ id: 'photo-memory-1' }],
    })

    const result = await generatePhotoMemoryForUser('user-1', 'message-1')

    expect(result).toEqual({
      status: 'already-exists',
      remainingThisMonth: 1,
    })
    expect(generateMemorySnapshotMock).not.toHaveBeenCalled()
    expect(messageAttachmentCreateMock).not.toHaveBeenCalled()
  })

  it('surfaces a local-dev unavailable state when OPENAI_API_KEY is missing', async () => {
    vi.stubEnv('OPENAI_API_KEY', '')

    await expect(
      generatePhotoMemoryForUser('user-1', 'message-1')
    ).rejects.toThrow(/OPENAI_API_KEY/i)

    await expect(resolvePhotoMemoryStatusForUser('user-1')).resolves.toEqual({
      available: false,
      remainingThisMonth: 1,
      monthlyLimit: 2,
      unavailableReason: 'MISSING_API_KEY',
    })
  })
})
