import { type Prisma } from '@prisma/client'

import { isPrivilegedRole } from '@/lib/angel/user-role'
import { uploadMediaBuffer } from '@/lib/media/storage'
import { prisma } from '@/lib/prisma'

const OPENAI_SPEECH_URL = 'https://api.openai.com/v1/audio/speech'
const DEFAULT_TTS_MODEL = 'gpt-4o-mini-tts'
const DEFAULT_TTS_VOICE = 'verse'

export const ANGEL_VOICE_REPLY_LIMITS: Record<string, number> = {
  FREE: 0,
  CORE: 5,
  PRO: 25,
}

export interface AngelVoiceReplyResult {
  status: 'created' | 'already-exists'
  remainingThisMonth: number | null
}

export async function generateAngelVoiceReplyForUser(
  userId: string,
  messageId: string
): Promise<AngelVoiceReplyResult> {
  const [message, subscription, user, soulProfile] = await Promise.all([
    prisma.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        contentText: true,
        senderRole: true,
        conversation: {
          select: {
            userId: true,
          },
        },
        attachments: {
          select: {
            id: true,
            type: true,
            metadata: true,
          },
        },
      },
    }),
    prisma.subscription.findUnique({
      where: { userId },
      select: { tier: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    }),
    prisma.soulProfile.findUnique({
      where: { userId },
      select: {
        angelName: true,
        coreTone: true,
        voiceStyle: true,
      },
    }),
  ])

  if (!message || message.conversation.userId !== userId) {
    throw new Error('That Angel message is not available in this thread.')
  }

  if (message.senderRole !== 'ANGEL' || !message.contentText?.trim()) {
    throw new Error('Only saved Angel text replies can be turned into voice.')
  }

  const hasExistingVoice = message.attachments.some((attachment) => {
    if (attachment.type !== 'VOICE_AUDIO') {
      return false
    }

    if (
      !attachment.metadata ||
      typeof attachment.metadata !== 'object' ||
      Array.isArray(attachment.metadata)
    ) {
      return false
    }

    return (attachment.metadata as Record<string, unknown>).aiGenerated === true
  })

  if (hasExistingVoice) {
    const remainingThisMonth = await resolveRemainingVoiceRepliesThisMonth({
      userId,
      tier: resolveVoiceTier(subscription?.tier, user?.role),
    })

    return {
      status: 'already-exists',
      remainingThisMonth,
    }
  }

  const tier = resolveVoiceTier(subscription?.tier, user?.role)
  const remainingThisMonth = await resolveRemainingVoiceRepliesThisMonth({
    userId,
    tier,
  })

  if (remainingThisMonth !== null && remainingThisMonth <= 0) {
    throw new Error(
      'This month’s Angel voice replies are already used up for this tier.'
    )
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim()

  if (!apiKey) {
    throw new Error(
      'Angel voice replies need OPENAI_API_KEY before they can be generated.'
    )
  }

  const model = process.env.OPENAI_TTS_MODEL?.trim() || DEFAULT_TTS_MODEL
  const voice = process.env.OPENAI_TTS_VOICE?.trim() || DEFAULT_TTS_VOICE
  const text = buildSpeechSafeInput(message.contentText)

  const response = await fetch(OPENAI_SPEECH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      voice,
      input: text,
      instructions: buildVoiceInstructions(soulProfile),
      response_format: 'mp3',
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'unknown error')
    throw new Error(
      `Angel voice reply generation failed (${response.status}): ${errorBody}`
    )
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const storedAsset = await uploadMediaBuffer({
    userId,
    fileName: `angel-voice-${message.id}.mp3`,
    buffer,
    contentType: 'audio/mpeg',
  })
  const attachmentMetadata = {
    aiGenerated: true,
    provider: 'openai',
    model,
    voice,
    ...(storedAsset.storagePath
      ? { storagePath: storedAsset.storagePath }
      : {}),
  } satisfies Prisma.InputJsonValue

  await prisma.messageAttachment.create({
    data: {
      messageId: message.id,
      type: 'VOICE_AUDIO',
      url: storedAsset.url,
      mimeType: 'audio/mpeg',
      title: 'Angel voice reply',
      metadata: attachmentMetadata,
    },
  })

  return {
    status: 'created',
    remainingThisMonth:
      remainingThisMonth === null ? null : Math.max(remainingThisMonth - 1, 0),
  }
}

async function resolveRemainingVoiceRepliesThisMonth({
  userId,
  tier,
}: {
  userId: string
  tier: string
}) {
  const limit = ANGEL_VOICE_REPLY_LIMITS[tier.toUpperCase()] ?? 0

  if (limit <= 0) {
    return 0
  }

  const monthStart = new Date()
  monthStart.setUTCDate(1)
  monthStart.setUTCHours(0, 0, 0, 0)

  const usedThisMonth = await prisma.messageAttachment.count({
    where: {
      type: 'VOICE_AUDIO',
      createdAt: {
        gte: monthStart,
      },
      message: {
        senderRole: 'ANGEL',
        conversation: {
          userId,
        },
      },
    },
  })

  return Math.max(limit - usedThisMonth, 0)
}

function resolveVoiceTier(
  tier: string | null | undefined,
  role?: string | null
) {
  if (isPrivilegedRole(role)) {
    return 'PRO'
  }

  return tier?.trim().toUpperCase() || 'FREE'
}

function buildSpeechSafeInput(text: string) {
  return text.replace(/\s+/g, ' ').trim().slice(0, 2000)
}

function buildVoiceInstructions(
  soulProfile: {
    angelName: string | null
    coreTone: string | null
    voiceStyle: string | null
  } | null
) {
  const angelName = soulProfile?.angelName?.trim() || 'Angel'
  const tonalNotes = [
    soulProfile?.coreTone?.trim(),
    soulProfile?.voiceStyle?.trim(),
  ]
    .filter(Boolean)
    .join(' ')

  if (!tonalNotes) {
    return `${angelName} should sound warm, calm, intimate, and clearly AI-generated.`
  }

  return `${angelName} should sound warm, calm, intimate, and clearly AI-generated. Keep the delivery aligned with: ${tonalNotes}`.slice(
    0,
    400
  )
}
