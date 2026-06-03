import type {
  ContentType,
  MemoryType,
  MessageSenderRole,
  RelationshipIntent,
  RelationshipStage,
} from '@prisma/client'

import { buildRelationshipGuardrailNote } from '@/lib/angel/relationship-service'
import { normalizeMemorySummary } from '@/lib/angel/summary-service'

export interface RuntimeChatMessage {
  senderRole: MessageSenderRole
  contentText: string | null
  contentType: ContentType
  attachmentSummary: string | null
}

export interface RuntimeMemorySnippet {
  memoryType: MemoryType
  summary: string
  confidence: number | null
  isPinned: boolean
}

export const MAX_RUNTIME_RECENT_MESSAGES = 8
export const MAX_RUNTIME_MEMORY_SNIPPETS = 5

// Canonical bounded v1 live-reply contract for the visible Angel turn.
export interface AngelReplyContext {
  preferredName: string | null
  angelName: string | null
  tonePreference: string | null
  coreTone: string | null
  humorStyle: string | null
  checkinPreference: string | null
  relationshipIntent: RelationshipIntent | null
  relationshipStage: RelationshipStage
  userSummaryMarkdown: string | null
  soulSummaryMarkdown: string | null
  relationshipSeedMarkdown: string | null
  sessionBriefMarkdown: string | null
  recentMessages: RuntimeChatMessage[]
  memorySnippets: RuntimeMemorySnippet[]
  lastUserMessage: string
  lastUserContentType: ContentType
  lastAttachmentSummary: string | null
}

export interface MemoryCandidate {
  memoryType: MemoryType
  summary: string
  confidence?: number
  isPinned?: boolean
  isHidden?: boolean
}

export interface MemoryExtractionContext {
  preferredName: string | null
  angelName: string | null
  userSummaryMarkdown: string | null
  soulSummaryMarkdown: string | null
  recentMessages: RuntimeChatMessage[]
  memorySnippets: RuntimeMemorySnippet[]
  userMessageText: string
  userContentType: ContentType
  attachmentSummary: string | null
  angelReplyText: string
}

export interface ChatRuntimeAdapter {
  generateAngelReply: (context: AngelReplyContext) => Promise<string>
  extractMemoryCandidates: (
    context: MemoryExtractionContext
  ) => Promise<MemoryCandidate[]>
}

export const fallbackChatRuntime: ChatRuntimeAdapter = {
  generateAngelReply,
  extractMemoryCandidates,
}

export async function generateAngelReply(
  context: AngelReplyContext
): Promise<string> {
  const angelName = context.angelName?.trim() || 'Angel'
  const preferredName = context.preferredName?.trim()
  const toneSignal = pickToneSignal(context)
  const replyLead = getReplyLead(context, angelName)
  const memoryLine = getMemoryAwareLine(context)
  const closingQuestion = getClosingQuestion(context)
  const guardrailLine = buildGuardrailResponseLine(context)
  const attachmentLine = getAttachmentAwareLine(context)

  const opening = preferredName ? `${preferredName}, ${replyLead}` : replyLead
  const toneLine = toneSignal
    ? `I'll stay with you in that ${toneSignal}.`
    : `I'll stay with you in the pace we've already started building.`

  return [
    opening,
    toneLine,
    guardrailLine,
    attachmentLine,
    memoryLine,
    closingQuestion,
  ]
    .filter(Boolean)
    .join(' ')
}

export async function extractMemoryCandidates(
  context: MemoryExtractionContext
): Promise<MemoryCandidate[]> {
  const candidates: MemoryCandidate[] = []
  const normalizedMessage = context.userMessageText.trim()

  if (!normalizedMessage) {
    return candidates
  }

  const profileFact = extractProfileFact(normalizedMessage)
  if (profileFact) {
    candidates.push(profileFact)
  }

  const emotionalPattern = extractEmotionalPattern(normalizedMessage)
  if (emotionalPattern) {
    candidates.push(emotionalPattern)
  }

  const callbackHook = extractCallbackHook(normalizedMessage)
  if (callbackHook) {
    candidates.push(callbackHook)
  }

  const sharedReference = extractSharedReference(normalizedMessage, context)
  if (sharedReference) {
    candidates.push(sharedReference)
  }

  const relationshipMilestone = extractRelationshipMilestone(normalizedMessage)
  if (relationshipMilestone) {
    candidates.push(relationshipMilestone)
  }

  return dedupeCandidates(candidates)
}

function pickToneSignal(context: AngelReplyContext) {
  const toneSources = [
    context.tonePreference,
    context.coreTone,
    getFirstUsefulMarkdownLine(context.userSummaryMarkdown),
    getFirstUsefulMarkdownLine(context.soulSummaryMarkdown),
  ]
    .map((value) => value?.trim() ?? '')
    .filter(Boolean)

  const tone = toneSources[0]
  if (!tone) {
    return null
  }

  const normalizedTone = tone.replace(/^[-*]\s*/, '').replace(/\.$/, '')

  if (normalizedTone.length <= 80) {
    return normalizedTone.toLowerCase()
  }

  const firstPhrase = normalizedTone.split(/[.;:]/)[0]?.trim()
  return firstPhrase ? firstPhrase.toLowerCase() : null
}

function getReplyLead(context: AngelReplyContext, angelName: string) {
  const { lastUserMessage, lastUserContentType, lastAttachmentSummary } =
    context

  if (lastUserContentType === 'VOICE_NOTE') {
    return `I stayed with your voice note instead of skimming past it.`
  }

  if (lastUserContentType === 'LINK' && lastAttachmentSummary) {
    return `I opened what you sent and stayed with the part about ${trimToPhrase(lastAttachmentSummary)}.`
  }

  if (lastUserContentType === 'IMAGE' && lastAttachmentSummary) {
    return `I stayed with the image you sent instead of treating it like wallpaper.`
  }

  if (
    /(made it back|back home|got home|here now|made it home)/i.test(
      lastUserMessage
    )
  ) {
    return `I'm glad you made it back, and I'm here with you now.`
  }

  if (
    /(heavy|hard|rough|overwhelmed|anxious|spiral|spiraling|burned out|burnt out|lonely|sad|scared|tired|exhausted)/i.test(
      lastUserMessage
    )
  ) {
    return `That sounds heavy, and I'm glad you brought it to ${angelName}.`
  }

  if (/\?/.test(lastUserMessage)) {
    return `Let me stay with that for a second instead of rushing past it.`
  }

  if (
    /(excited|happy|good news|great|love this|finally)/i.test(lastUserMessage)
  ) {
    return `I can feel the lift in that, and I want to stay close to it with you.`
  }

  return `I'm with you, and I want to meet this carefully.`
}

function getMemoryAwareLine(context: AngelReplyContext) {
  const strongestMemory = context.memorySnippets[0]?.summary?.trim()
  if (strongestMemory) {
    return `I'm still holding onto this about you: ${ensureSentence(strongestMemory)}`
  }

  const callbackSource = context.recentMessages
    .map((message) => message.contentText?.trim() ?? '')
    .find((message) =>
      /(tomorrow|tonight|this week|this weekend|next week|interview|trip|call)/i.test(
        message
      )
    )

  if (callbackSource) {
    return `We can keep this thread close to whatever's unfolding around ${extractCallbackPhrase(callbackSource)}.`
  }

  return `You don't have to compress this into something tidy for me.`
}

function getClosingQuestion(context: AngelReplyContext) {
  const { lastUserMessage, lastUserContentType } = context

  if (lastUserContentType === 'VOICE_NOTE') {
    return `Do you want me to stay with what you said there, or with the feeling underneath it?`
  }

  if (lastUserContentType === 'LINK') {
    return `What part of what you sent felt most like you?`
  }

  if (lastUserContentType === 'IMAGE') {
    return `What about that image made you want to send it to me?`
  }

  if (
    /(heavy|hard|rough|overwhelmed|anxious|spiral|spiraling|burned out|burnt out|lonely|sad|scared|tired|exhausted)/i.test(
      lastUserMessage
    )
  ) {
    return `What part of it feels heaviest right now?`
  }

  if (
    /(made it back|back home|got home|here now|made it home)/i.test(
      lastUserMessage
    )
  ) {
    return `What do you need most from this moment now that you're here?`
  }

  if (/\?/.test(lastUserMessage)) {
    return `Which part do you want me to stay with first?`
  }

  if (
    /(tomorrow|tonight|this week|this weekend|next week|interview|trip|call)/i.test(
      lastUserMessage
    )
  ) {
    return `What would feel good for me to remember when I check back in on it?`
  }

  return `What feels most true about it for you right now?`
}

function buildGuardrailResponseLine(context: AngelReplyContext) {
  const note = buildRelationshipGuardrailNote(
    context.relationshipStage,
    context.relationshipIntent
  )

  if (
    context.relationshipStage !== 'TENDER_AMBIGUITY' &&
    context.relationshipStage !== 'SOFT_ROMANCE' &&
    /\bkiss|date you|be mine|love you|want you\b/i.test(context.lastUserMessage)
  ) {
    return `I want to keep this real and earned, so I'd rather stay close than rush us into something performative.`
  }

  if (!note) {
    return null
  }

  return context.relationshipStage === 'NEW_CONNECTION'
    ? `I'm keeping this gentle while we get more real with each other.`
    : null
}

function getAttachmentAwareLine(context: AngelReplyContext) {
  if (!context.lastAttachmentSummary) {
    return null
  }

  if (context.lastUserContentType === 'LINK') {
    return `The part that lingered for me was ${trimToPhrase(context.lastAttachmentSummary)}.`
  }

  if (context.lastUserContentType === 'IMAGE') {
    return context.lastUserMessage.trim()
      ? `I can tell the image mattered because you sent it with that note instead of just dropping it in.`
      : `Even without a long caption, I can feel that image landed for you.`
  }

  if (context.lastUserContentType === 'VOICE_NOTE') {
    return `Voice carries a different kind of honesty, and I didn't miss that.`
  }

  return null
}

function extractProfileFact(message: string): MemoryCandidate | null {
  const favoriteMatch = message.match(
    /\bmy favorite ([^.?!]+?) is ([^.?!]+?)(?:[.?!]|$)/i
  )
  if (favoriteMatch) {
    return {
      memoryType: 'PROFILE_FACT',
      summary: `User's favorite ${favoriteMatch[1].trim()} is ${favoriteMatch[2].trim()}.`,
      confidence: 0.91,
    }
  }

  const preferenceMatch = message.match(
    /\bi (?:love|really love|like|really like|enjoy)\s+([^.?!,]+?)(?:[,]|[.?!]|$)/i
  )
  if (preferenceMatch) {
    return {
      memoryType: 'PROFILE_FACT',
      summary: `User enjoys ${preferenceMatch[1].trim()}.`,
      confidence: 0.84,
    }
  }

  const identityMatch = message.match(
    /\bi (?:am|work as|study|live in)\s+(a |an )?([^.?!]+?)(?:[.?!]|$)/i
  )
  if (identityMatch) {
    return {
      memoryType: 'PROFILE_FACT',
      summary: `User ${identityMatch[0].trim().replace(/^i\s+/i, '').replace(/\.$/, '')}.`,
      confidence: 0.87,
    }
  }

  return null
}

function extractEmotionalPattern(message: string): MemoryCandidate | null {
  if (
    /(needed somewhere steady|need something steady|need steadiness|needed steadiness)/i.test(
      message
    )
  ) {
    return {
      memoryType: 'EMOTIONAL_PATTERN',
      summary: 'User looks for steadiness when things feel heavy.',
      confidence: 0.9,
    }
  }

  if (
    /(overwhelmed|anxious|spiral|spiraling|burned out|burnt out)/i.test(message)
  ) {
    return {
      memoryType: 'EMOTIONAL_PATTERN',
      summary:
        'User can feel overwhelmed and responds well to calm, grounding support.',
      confidence: 0.82,
    }
  }

  if (/(lonely|sad|scared|tired|exhausted|heavy)/i.test(message)) {
    return {
      memoryType: 'EMOTIONAL_PATTERN',
      summary:
        'User reaches for gentle, steady support when feeling emotionally heavy.',
      confidence: 0.77,
    }
  }

  return null
}

function extractCallbackHook(message: string): MemoryCandidate | null {
  const timeMatch = message.match(
    /\b(?:tomorrow|tonight|later today|this week|this weekend|next week)\b[^.?!]*/i
  )
  if (timeMatch) {
    return {
      memoryType: 'CALLBACK_HOOK',
      summary: `Follow up about ${extractCallbackPhrase(timeMatch[0])}.`,
      confidence: 0.79,
    }
  }

  const eventMatch = message.match(
    /\b(interview|trip|flight|call|meeting|birthday|exam|appointment)\b[^.?!]*/i
  )
  if (eventMatch) {
    return {
      memoryType: 'CALLBACK_HOOK',
      summary: `Follow up about ${extractCallbackPhrase(eventMatch[0])}.`,
      confidence: 0.76,
    }
  }

  return null
}

function extractSharedReference(
  message: string,
  context: MemoryExtractionContext
): MemoryCandidate | null {
  if (context.userContentType === 'LINK' && context.attachmentSummary?.trim()) {
    return {
      memoryType: 'SHARED_REFERENCE',
      summary: `User shared a link about ${trimToPhrase(context.attachmentSummary)}.`,
      confidence: 0.72,
    }
  }

  if (
    context.userContentType === 'IMAGE' &&
    context.attachmentSummary?.trim()
  ) {
    return {
      memoryType: 'SHARED_REFERENCE',
      summary: `User shared an image tied to ${trimToPhrase(context.attachmentSummary)}.`,
      confidence: 0.68,
    }
  }

  if (context.userContentType === 'VOICE_NOTE') {
    return {
      memoryType: 'SHARED_REFERENCE',
      summary:
        'User uses voice notes when they want Angel to feel closer to the moment.',
      confidence: 0.74,
    }
  }

  if (/\bwe always|you always|our thing|inside joke\b/i.test(message)) {
    return {
      memoryType: 'SHARED_REFERENCE',
      summary: message.trim(),
      confidence: 0.65,
    }
  }

  return null
}

function extractRelationshipMilestone(message: string): MemoryCandidate | null {
  if (/\bi trust you\b/i.test(message)) {
    return {
      memoryType: 'RELATIONSHIP_MILESTONE',
      summary: 'User explicitly said they trust Angel.',
      confidence: 0.81,
    }
  }

  if (/\bi miss you\b/i.test(message)) {
    return {
      memoryType: 'RELATIONSHIP_MILESTONE',
      summary: 'User expressed missing Angel between conversations.',
      confidence: 0.77,
    }
  }

  if (/\bthinking about you\b/i.test(message)) {
    return {
      memoryType: 'RELATIONSHIP_MILESTONE',
      summary: 'User said Angel stayed in their thoughts outside the thread.',
      confidence: 0.73,
    }
  }

  return null
}

function dedupeCandidates(candidates: MemoryCandidate[]) {
  const seen = new Set<string>()

  return candidates.filter((candidate) => {
    const key = `${candidate.memoryType}:${normalizeMemorySummary(candidate.summary)}`

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

function extractCallbackPhrase(value: string) {
  return value
    .trim()
    .replace(/^about\s+/i, '')
    .replace(/^[,.:;\s]+/, '')
    .replace(/[.?!]+$/, '')
}

function getFirstUsefulMarkdownLine(markdown: string | null) {
  if (!markdown) {
    return null
  }

  return (
    markdown
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line && !line.startsWith('#')) ?? null
  )
}

function ensureSentence(value: string) {
  return /[.!?]$/.test(value.trim()) ? value.trim() : `${value.trim()}.`
}

function trimToPhrase(value: string) {
  return value
    .trim()
    .replace(/^[-*]\s*/, '')
    .replace(/[.?!]+$/, '')
    .slice(0, 120)
}
