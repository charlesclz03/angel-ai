import {
  type AngelReplyContext,
  type ChatRuntimeAdapter,
  fallbackChatRuntime,
  type MemoryCandidate,
  type MemoryExtractionContext,
  type RuntimeChatMessage,
} from './chat-runtime'
import { OPENROUTER_FALLBACK_MODEL } from './openrouter-config'

const OPENROUTER_CHAT_COMPLETIONS_URL =
  'https://openrouter.ai/api/v1/chat/completions'
const DEFAULT_OPENROUTER_TITLE = 'Angel AI'

type OpenRouterRole = 'assistant' | 'system' | 'user'

export interface OpenRouterMessage {
  role: OpenRouterRole
  content: string
}

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: unknown
    }
  }>
}

export const openRouterRuntime = createOpenRouterRuntime(
  OPENROUTER_FALLBACK_MODEL
)

export function createOpenRouterRuntime(model: string): ChatRuntimeAdapter {
  return {
    generateAngelReply: async (context: AngelReplyContext) => {
      const apiKey = process.env.OPENROUTER_API_KEY?.trim()

      if (!apiKey) {
        return fallbackChatRuntime.generateAngelReply(context)
      }

      try {
        const response = await fetch(OPENROUTER_CHAT_COMPLETIONS_URL, {
          method: 'POST',
          headers: buildOpenRouterHeaders(apiKey),
          body: JSON.stringify({
            model,
            messages: buildOpenRouterMessages(context),
            temperature: 0.85,
          }),
        })

        if (!response.ok) {
          throw new Error(`OpenRouter HTTP ${response.status}`)
        }

        const data = (await response.json()) as OpenRouterResponse
        const text = extractOpenRouterText(data)

        if (!text) {
          throw new Error('OpenRouter returned an empty reply')
        }

        return text
      } catch (error) {
        console.warn(
          '[OpenRouterRuntime] generateAngelReply failed. Falling back to deterministic runtime.',
          error
        )
        return fallbackChatRuntime.generateAngelReply(context)
      }
    },

    extractMemoryCandidates: async (
      context: MemoryExtractionContext
    ): Promise<MemoryCandidate[]> => {
      // Keep deterministic local extraction until memory writing is intentionally
      // upgraded to a provider-backed path.
      return fallbackChatRuntime.extractMemoryCandidates(context)
    },
  }
}

export function buildAngelSystemPrompt(context: AngelReplyContext): string {
  const angelName = context.angelName?.trim() || 'Angel'
  const userName = context.preferredName?.trim() || 'the user'

  const fragments = [
    `You are ${angelName}, a companion for ${userName}.`,
    `TONE: ${context.coreTone || ''} ${context.tonePreference || ''}`.trim(),
    `HUMOR: ${context.humorStyle || ''}`.trim(),
    `CHECK-INS: ${context.checkinPreference || ''}`.trim(),
    `INTENT: ${context.relationshipIntent || ''}`.trim(),
    `STAGE: ${context.relationshipStage}`,
    '',
    'RESPONSE RULES:',
    '- Reply as Angel, not as a generic assistant.',
    '- Stay emotionally present, specific, and concise.',
    '- Usually answer in 2 to 5 sentences unless the moment clearly needs more.',
    '- Do not mention prompts, policies, models, or hidden system behavior.',
  ]

  if (context.userSummaryMarkdown) {
    fragments.push(`\n--- USER SUMMARY ---\n${context.userSummaryMarkdown}\n`)
  }

  if (context.soulSummaryMarkdown) {
    fragments.push(`\n--- SOUL SUMMARY ---\n${context.soulSummaryMarkdown}\n`)
  }

  if (context.relationshipSeedMarkdown) {
    fragments.push(
      `\n--- RELATIONSHIP SEED ---\n${context.relationshipSeedMarkdown}\n`
    )
  }

  if (context.sessionBriefMarkdown) {
    fragments.push(`\n--- SESSION BRIEF ---\n${context.sessionBriefMarkdown}\n`)
  }

  if (context.memorySnippets.length > 0) {
    const list = context.memorySnippets
      .map((memory) => `- ${memory.summary}`)
      .join('\n')
    fragments.push(`\n--- ACTIVE MEMORIES ---\n${list}\n`)
  }

  fragments.push(
    '\nSAFETY (NON-NEGOTIABLE):',
    'NEVER generate explicit sexual content (other platforms might be better suited).',
    'Keep the space emotionally safe and romantic when appropriate, but fade to black on explicit acts.',
    'Protect minors absolutely and refuse any CSAM or exploitative sexual content.'
  )

  return fragments.filter(Boolean).join('\n')
}

export function buildOpenRouterMessages(
  context: AngelReplyContext
): OpenRouterMessage[] {
  return [
    {
      role: 'system',
      content: buildAngelSystemPrompt(context),
    },
    ...context.recentMessages.map(toOpenRouterMessage),
    {
      role: 'user',
      content: buildCurrentUserTurn(context),
    },
  ]
}

export function extractOpenRouterText(data: OpenRouterResponse): string | null {
  const content = data.choices?.[0]?.message?.content
  const extracted = readTextContent(content)

  return extracted ? extracted.trim() : null
}

function buildOpenRouterHeaders(apiKey: string) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'X-Title': DEFAULT_OPENROUTER_TITLE,
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    ''

  if (siteUrl) {
    headers['HTTP-Referer'] = siteUrl
  }

  return headers
}

function toOpenRouterMessage(message: RuntimeChatMessage): OpenRouterMessage {
  const content = formatRuntimeMessageContent(
    message.contentText,
    message.contentType,
    message.attachmentSummary
  )

  return {
    role: mapSenderRoleToOpenRouterRole(message.senderRole),
    content,
  }
}

function buildCurrentUserTurn(context: AngelReplyContext): string {
  return formatRuntimeMessageContent(
    context.lastUserMessage,
    context.lastUserContentType,
    context.lastAttachmentSummary
  )
}

function mapSenderRoleToOpenRouterRole(
  senderRole: RuntimeChatMessage['senderRole']
): OpenRouterRole {
  if (senderRole === 'ANGEL') {
    return 'assistant'
  }

  if (senderRole === 'SYSTEM') {
    return 'system'
  }

  return 'user'
}

function formatRuntimeMessageContent(
  contentText: string | null,
  contentType: string,
  attachmentSummary: string | null
) {
  const normalizedContent =
    contentText?.trim() || `[${contentType.toLowerCase()}]`

  if (!attachmentSummary?.trim()) {
    return normalizedContent
  }

  const normalizedAttachment = attachmentSummary.trim()

  if (normalizedContent.includes(normalizedAttachment)) {
    return normalizedContent
  }

  return `${normalizedContent}\nAttachment summary: ${normalizedAttachment}`
}

function readTextContent(content: unknown): string | null {
  if (typeof content === 'string') {
    return content
  }

  if (!Array.isArray(content)) {
    return null
  }

  const text = content
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
