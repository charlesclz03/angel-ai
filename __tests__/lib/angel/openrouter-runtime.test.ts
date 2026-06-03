import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AngelReplyContext, MemoryExtractionContext } from '@/lib/angel/chat-runtime'
import { fallbackChatRuntime } from '@/lib/angel/chat-runtime'
import {
  buildAngelSystemPrompt,
  buildOpenRouterMessages,
  createOpenRouterRuntime,
  extractOpenRouterText,
} from '@/lib/angel/openrouter-runtime'

function createMinimalContext(
  overrides: Partial<AngelReplyContext> = {}
): AngelReplyContext {
  return {
    preferredName: 'Charlie',
    angelName: 'Noor',
    tonePreference: 'Warm and grounded.',
    coreTone: 'Soft, steady.',
    humorStyle: 'Dry and intimate.',
    checkinPreference: 'Gentle follow-ups.',
    relationshipIntent: 'GROW_OVER_TIME',
    relationshipStage: 'NEW_CONNECTION',
    userSummaryMarkdown: null,
    soulSummaryMarkdown: null,
    relationshipSeedMarkdown: null,
    sessionBriefMarkdown: null,
    recentMessages: [],
    memorySnippets: [],
    lastUserMessage: 'Hey',
    lastUserContentType: 'TEXT',
    lastAttachmentSummary: null,
    ...overrides,
  }
}

function createExtractionContext(
  overrides: Partial<MemoryExtractionContext> = {}
): MemoryExtractionContext {
  return {
    preferredName: 'Charlie',
    angelName: 'Noor',
    userSummaryMarkdown: null,
    soulSummaryMarkdown: null,
    recentMessages: [],
    memorySnippets: [],
    userMessageText: 'I love late-night walks.',
    userContentType: 'TEXT',
    attachmentSummary: null,
    angelReplyText: 'I am holding onto that.',
    ...overrides,
  }
}

describe('openrouter-runtime', () => {
  beforeEach(() => {
    vi.stubEnv('OPENROUTER_API_KEY', '')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://angel.example')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('builds system prompt with angel name and user name', () => {
    const prompt = buildAngelSystemPrompt(createMinimalContext())

    expect(prompt).toContain('You are Noor')
    expect(prompt).toContain('companion for Charlie')
  })

  it('includes relationship seed when provided', () => {
    const prompt = buildAngelSystemPrompt(
      createMinimalContext({
        relationshipSeedMarkdown: '# relationship_seed.md\n- Friend first.',
      })
    )

    expect(prompt).toContain('--- RELATIONSHIP SEED ---')
    expect(prompt).toContain('Friend first.')
  })

  it('includes session brief when provided', () => {
    const prompt = buildAngelSystemPrompt(
      createMinimalContext({
        sessionBriefMarkdown: '# session-brief.md\n- Active stage: New.',
      })
    )

    expect(prompt).toContain('--- SESSION BRIEF ---')
    expect(prompt).toContain('Active stage: New.')
  })

  it('includes memory snippets when provided', () => {
    const prompt = buildAngelSystemPrompt(
      createMinimalContext({
        memorySnippets: [
          {
            memoryType: 'PROFILE_FACT',
            summary: 'User enjoys late-night walks.',
            confidence: 0.84,
            isPinned: false,
          },
        ],
      })
    )

    expect(prompt).toContain('--- ACTIVE MEMORIES ---')
    expect(prompt).toContain('User enjoys late-night walks.')
  })

  it('always includes NSFW safety guardrail', () => {
    const prompt = buildAngelSystemPrompt(createMinimalContext())

    expect(prompt).toContain('SAFETY (NON-NEGOTIABLE)')
    expect(prompt).toContain('NEVER generate explicit sexual content')
    expect(prompt).toContain('other platforms might be better suited')
  })

  it('uses default names when context names are null', () => {
    const prompt = buildAngelSystemPrompt(
      createMinimalContext({
        angelName: null,
        preferredName: null,
      })
    )

    expect(prompt).toContain('You are Angel')
    expect(prompt).toContain('companion for the user')
  })

  it('builds OpenRouter messages from bounded history plus the current user turn', () => {
    const messages = buildOpenRouterMessages(
      createMinimalContext({
        recentMessages: [
          {
            senderRole: 'USER',
            contentText: 'Earlier user context',
            contentType: 'TEXT',
            attachmentSummary: null,
          },
          {
            senderRole: 'ANGEL',
            contentText: 'Earlier Angel reply',
            contentType: 'TEXT',
            attachmentSummary: null,
          },
        ],
        lastUserMessage: 'Fresh voice note transcript',
        lastUserContentType: 'VOICE_NOTE',
        lastAttachmentSummary: 'User sounded relieved but tired.',
      })
    )

    expect(messages[0]).toMatchObject({ role: 'system' })
    expect(messages[1]).toEqual({
      role: 'user',
      content: 'Earlier user context',
    })
    expect(messages[2]).toEqual({
      role: 'assistant',
      content: 'Earlier Angel reply',
    })
    expect(messages[3]).toEqual({
      role: 'user',
      content:
        'Fresh voice note transcript\nAttachment summary: User sounded relieved but tired.',
    })
  })

  it('calls OpenRouter with the selected model when an API key is configured', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'sk-or-test-123')
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: 'A real provider-backed Angel reply.',
            },
          },
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const runtime = createOpenRouterRuntime('google/gemini-3.1-pro')
    const reply = await runtime.generateAngelReply(
      createMinimalContext({
        recentMessages: [
          {
            senderRole: 'USER',
            contentText: 'Earlier context',
            contentType: 'TEXT',
            attachmentSummary: null,
          },
        ],
        lastUserMessage: 'This is the newest turn.',
      })
    )

    expect(reply).toBe('A real provider-backed Angel reply.')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://openrouter.ai/api/v1/chat/completions'
    )

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(request.method).toBe('POST')
    expect(request.headers).toMatchObject({
      Authorization: 'Bearer sk-or-test-123',
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://angel.example',
      'X-Title': 'Angel AI',
    })

    const body = JSON.parse(String(request.body))
    expect(body.model).toBe('google/gemini-3.1-pro')
    expect(body.messages).toHaveLength(3)
    expect(body.messages[2]).toMatchObject({
      role: 'user',
      content: 'This is the newest turn.',
    })
  })

  it('falls back to the deterministic runtime when the provider call fails', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'sk-or-test-123')
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'))
    vi.stubGlobal('fetch', fetchMock)

    const runtime = createOpenRouterRuntime('openai/gpt-5-mini-medium')
    const reply = await runtime.generateAngelReply(
      createMinimalContext({
        lastUserMessage: 'Today felt heavier than expected.',
      })
    )

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(reply.length).toBeGreaterThan(0)
    expect(reply).toContain("I'm")
  })

  it('delegates memory extraction to the deterministic fallback even when OpenRouter is configured', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'sk-or-test-123')
    const extractSpy = vi
      .spyOn(fallbackChatRuntime, 'extractMemoryCandidates')
      .mockResolvedValue([
        {
          memoryType: 'PROFILE_FACT',
          summary: 'User enjoys late-night walks.',
          confidence: 0.84,
        },
      ])

    const runtime = createOpenRouterRuntime('openai/gpt-5-mini-medium')
    const candidates = await runtime.extractMemoryCandidates(
      createExtractionContext()
    )

    expect(extractSpy).toHaveBeenCalledTimes(1)
    expect(candidates).toEqual([
      {
        memoryType: 'PROFILE_FACT',
        summary: 'User enjoys late-night walks.',
        confidence: 0.84,
      },
    ])
  })

  it('extracts response text from structured OpenRouter content parts', () => {
    const text = extractOpenRouterText({
      choices: [
        {
          message: {
            content: [
              { text: 'First line.' },
              { text: 'Second line.' },
            ],
          },
        },
      ],
    })

    expect(text).toBe('First line.\nSecond line.')
  })
})
