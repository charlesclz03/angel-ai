import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AngelReplyContext, ChatRuntimeAdapter, MemoryExtractionContext } from '@/lib/angel/chat-runtime'
import {
  buildOpenClawGeneratePayload,
  createOpenClawRuntime,
  extractOpenClawReplyText,
} from '@/lib/angel/openclaw-client'

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
    userSummaryMarkdown: '# user.md\n- User enjoys late-night walks.',
    soulSummaryMarkdown: '# soul.md\n- Keep things steady and close.',
    relationshipSeedMarkdown: '# relationship_seed.md\n- Friend first.',
    sessionBriefMarkdown: '# session-brief.md\n- Hold the thread gently.',
    recentMessages: [
      {
        senderRole: 'USER',
        contentText: 'Earlier user context',
        contentType: 'TEXT',
        attachmentSummary: null,
      },
    ],
    memorySnippets: [
      {
        memoryType: 'PROFILE_FACT',
        summary: 'User enjoys late-night walks.',
        confidence: 0.84,
        isPinned: true,
      },
    ],
    lastUserMessage: 'This is the newest turn.',
    lastUserContentType: 'IMAGE',
    lastAttachmentSummary: 'A moonlit street after a long walk.',
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
    userMessageText: 'I made it home.',
    userContentType: 'TEXT',
    attachmentSummary: null,
    angelReplyText: 'I am glad you made it back.',
    ...overrides,
  }
}

describe('openclaw-client', () => {
  beforeEach(() => {
    vi.stubEnv('OPENCLAW_GATEWAY_URL', 'http://localhost:18789/')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('builds a bounded OpenClaw payload with the curated runtime context', () => {
    const payload = buildOpenClawGeneratePayload(createMinimalContext())

    expect(payload).toEqual({
      command: 'generate',
      context: expect.objectContaining({
        runtimeContract: 'angel-v1-bounded',
        preferredName: 'Charlie',
        angelName: 'Noor',
        relationshipStage: 'NEW_CONNECTION',
        relationshipSeed: '# relationship_seed.md\n- Friend first.',
        sessionBrief: '# session-brief.md\n- Hold the thread gently.',
        lastUserMessage: 'This is the newest turn.',
        lastUserContentType: 'IMAGE',
        lastAttachmentSummary: 'A moonlit street after a long walk.',
      }),
    })
    expect(payload.context.recentMessages).toHaveLength(1)
    expect(payload.context.memorySnippets).toHaveLength(1)
    expect(payload.context.safetyGuidance).toHaveLength(3)
  })

  it('posts to the gateway and returns the parsed reply when OpenClaw responds', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        reply: 'OpenClaw answered from the gateway.',
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const fallbackRuntime: ChatRuntimeAdapter = {
      generateAngelReply: vi.fn().mockResolvedValue('fallback reply'),
      extractMemoryCandidates: vi.fn().mockResolvedValue([]),
    }

    const runtime = createOpenClawRuntime(fallbackRuntime)
    const reply = await runtime.generateAngelReply(createMinimalContext())

    expect(reply).toBe('OpenClaw answered from the gateway.')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'http://localhost:18789/api/v1/generate'
    )

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(request.method).toBe('POST')
    expect(request.headers).toEqual({ 'Content-Type': 'application/json' })

    const body = JSON.parse(String(request.body))
    expect(body.context.runtimeContract).toBe('angel-v1-bounded')
    expect(body.context.recentMessages[0].contentText).toBe(
      'Earlier user context'
    )
  })

  it('falls back to the secondary runtime when the gateway fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({}),
    })
    vi.stubGlobal('fetch', fetchMock)

    const fallbackRuntime: ChatRuntimeAdapter = {
      generateAngelReply: vi.fn().mockResolvedValue('fallback reply'),
      extractMemoryCandidates: vi.fn().mockResolvedValue([]),
    }

    const runtime = createOpenClawRuntime(fallbackRuntime)
    const reply = await runtime.generateAngelReply(createMinimalContext())

    expect(reply).toBe('fallback reply')
    expect(fallbackRuntime.generateAngelReply).toHaveBeenCalledTimes(1)
  })

  it('delegates memory extraction to the secondary runtime unchanged', async () => {
    const fallbackRuntime: ChatRuntimeAdapter = {
      generateAngelReply: vi.fn().mockResolvedValue('fallback reply'),
      extractMemoryCandidates: vi.fn().mockResolvedValue([
        {
          memoryType: 'CALLBACK_HOOK',
          summary: "Follow up about tomorrow's interview.",
          confidence: 0.79,
        },
      ]),
    }

    const runtime = createOpenClawRuntime(fallbackRuntime)
    const candidates = await runtime.extractMemoryCandidates(
      createExtractionContext()
    )

    expect(candidates).toEqual([
      {
        memoryType: 'CALLBACK_HOOK',
        summary: "Follow up about tomorrow's interview.",
        confidence: 0.79,
      },
    ])
    expect(fallbackRuntime.extractMemoryCandidates).toHaveBeenCalledTimes(1)
  })

  it('extracts reply text from multiple gateway response shapes', () => {
    expect(
      extractOpenClawReplyText({
        message: {
          content: [{ text: 'First line.' }, { text: 'Second line.' }],
        },
      })
    ).toBe('First line.\nSecond line.')

    expect(
      extractOpenClawReplyText({
        content: 'Direct content field.',
      })
    ).toBe('Direct content field.')
  })
})
