import {
  type AngelReplyContext,
  type ChatRuntimeAdapter,
  type MemoryCandidate,
  type MemoryExtractionContext,
} from '@/lib/angel/chat-runtime'

interface OpenClawGenerateResponse {
  content?: unknown
  message?: {
    content?: unknown
  }
  reply?: unknown
  text?: unknown
}

export interface OpenClawGeneratePayload {
  command: 'generate'
  context: {
    runtimeContract: 'angel-v1-bounded'
    preferredName: string | null
    angelName: string | null
    tonePreference: string | null
    coreTone: string | null
    humorStyle: string | null
    checkinPreference: string | null
    relationshipIntent: string | null
    relationshipStage: string
    relationshipSeed: string | null
    sessionBrief: string | null
    soulSummary: string | null
    userSummary: string | null
    recentMessages: AngelReplyContext['recentMessages']
    memorySnippets: AngelReplyContext['memorySnippets']
    lastUserMessage: string
    lastUserContentType: string
    lastAttachmentSummary: string | null
    safetyGuidance: string[]
  }
}

export function createOpenClawRuntime(
  fallbackRuntime: ChatRuntimeAdapter
): ChatRuntimeAdapter {
  return {
    generateAngelReply: async (context: AngelReplyContext): Promise<string> => {
      try {
        const response = await fetch(buildOpenClawGenerateUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildOpenClawGeneratePayload(context)),
        })

        if (!response.ok) {
          throw new Error(`OpenClaw Gateway Error: Http ${response.status}`)
        }

        const data = (await response.json()) as OpenClawGenerateResponse
        const text = extractOpenClawReplyText(data)

        if (!text) {
          throw new Error('Empty response from OpenClaw Gateway')
        }

        return text
      } catch (error) {
        console.warn(
          '[OpenClawRuntime] generateAngelReply failed. Transparently falling back to secondary runtime.',
          error
        )
        return fallbackRuntime.generateAngelReply(context)
      }
    },
    extractMemoryCandidates: async (
      context: MemoryExtractionContext
    ): Promise<MemoryCandidate[]> => {
      return fallbackRuntime.extractMemoryCandidates(context)
    },
  }
}

export function buildOpenClawGeneratePayload(
  context: AngelReplyContext
): OpenClawGeneratePayload {
  return {
    command: 'generate',
    context: {
      runtimeContract: 'angel-v1-bounded',
      preferredName: context.preferredName,
      angelName: context.angelName,
      tonePreference: context.tonePreference,
      coreTone: context.coreTone,
      humorStyle: context.humorStyle,
      checkinPreference: context.checkinPreference,
      relationshipIntent: context.relationshipIntent,
      relationshipStage: context.relationshipStage,
      relationshipSeed: context.relationshipSeedMarkdown,
      sessionBrief: context.sessionBriefMarkdown,
      soulSummary: context.soulSummaryMarkdown,
      userSummary: context.userSummaryMarkdown,
      recentMessages: context.recentMessages,
      memorySnippets: context.memorySnippets,
      lastUserMessage: context.lastUserMessage,
      lastUserContentType: context.lastUserContentType,
      lastAttachmentSummary: context.lastAttachmentSummary,
      safetyGuidance: [
        'Keep the reply bounded to the provided context only.',
        'Stay friend-first unless repeated evidence supports deeper tenderness.',
        'Never generate explicit sexual content, erotica, or anything involving minors.',
      ],
    },
  }
}

export function extractOpenClawReplyText(
  data: OpenClawGenerateResponse
): string | null {
  const directFields = [
    data.reply,
    data.text,
    data.content,
    data.message?.content,
  ]

  for (const value of directFields) {
    const extracted = readResponseText(value)

    if (extracted) {
      return extracted
    }
  }

  return null
}

function buildOpenClawGenerateUrl() {
  const baseUrl =
    process.env.OPENCLAW_GATEWAY_URL?.trim() || 'http://127.0.0.1:18789'

  return `${baseUrl.replace(/\/+$/, '')}/api/v1/generate`
}

function readResponseText(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || null
  }

  if (!Array.isArray(value)) {
    return null
  }

  const text = value
    .map((part) => {
      if (typeof part === 'string') {
        return part
      }

      if (
        part &&
        typeof part === 'object' &&
        'text' in part &&
        typeof part.text === 'string'
      ) {
        return part.text
      }

      return ''
    })
    .join('\n')
    .trim()

  return text || null
}
