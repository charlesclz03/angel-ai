import { memo } from 'react'

import type { ChatMessageRecord } from '@/lib/angel/chat-state'
import type { PhotoMemoryStatus } from '@/lib/angel/photo-memory-service'

import { Button } from '@/components/atoms/Button'
import { cn } from '@/lib/utils'

// Helper must be declared before use (function hoisting is lexical, not temporal)
function getPhotoMemoryHelper(status: PhotoMemoryStatus): string {
  if (status.unavailableReason === 'MISSING_API_KEY') {
    return 'Unavailable until OPENAI_API_KEY is configured'
  }

  if ((status.remainingThisMonth ?? 0) <= 0) {
    return 'Memory snapshots used up for this month'
  }

  if (status.monthlyLimit) {
    return `${status.remainingThisMonth} of ${status.monthlyLimit} left this month`
  }

  return 'AI photo memory'
}

interface MessageBubbleProps {
  message: ChatMessageRecord
  canGenerateVoiceReply?: boolean
  photoMemoryStatus: PhotoMemoryStatus
  isGeneratingVoiceReply?: boolean
  isGeneratingPhotoMemory?: boolean
  onGenerateVoiceReply?: (messageId: string) => void
  onGeneratePhotoMemory?: (messageId: string) => void
}

export const MessageBubble = memo(function MessageBubble({
  message,
  canGenerateVoiceReply = false,
  photoMemoryStatus,
  isGeneratingVoiceReply = false,
  isGeneratingPhotoMemory = false,
  onGenerateVoiceReply,
  onGeneratePhotoMemory,
}: MessageBubbleProps) {
  const isUser = message.senderRole === 'USER'
  const hasGeneratedVoiceReply = message.attachments.some((attachment) => {
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

    return attachment.metadata.aiGenerated === true
  })
  const hasGeneratedPhotoMemory = message.attachments.some((attachment) => {
    if (attachment.type !== 'IMAGE') {
      return false
    }

    if (
      !attachment.metadata ||
      typeof attachment.metadata !== 'object' ||
      Array.isArray(attachment.metadata)
    ) {
      return false
    }

    return attachment.metadata.generatedKind === 'PHOTO_MEMORY'
  })
  const timestamp = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(message.createdAt))
  const canRenderAiActions =
    !isUser && canGenerateVoiceReply && Boolean(message.contentText?.trim())
  const photoMemoryHelper = getPhotoMemoryHelper(photoMemoryStatus)

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[88%] rounded-[1.6rem] border px-4 py-4 shadow-soft',
          isUser ? 'angel-chat-bubble-user' : 'angel-chat-bubble-angel'
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs uppercase tracking-[0.22em] text-text-tertiary">
            {isUser ? 'You' : 'Angel'}
          </p>
          <div className="flex items-center gap-3">
            {message.paywallState !== 'FREE' && (
              <p className="text-[10px] uppercase tracking-[0.18em] text-accent-primary">
                {message.paywallState.replace('_', ' ')}
              </p>
            )}
            <p className="text-[11px] uppercase tracking-[0.16em] text-text-tertiary">
              {timestamp}
            </p>
          </div>
        </div>

        {canRenderAiActions &&
        (!hasGeneratedVoiceReply || !hasGeneratedPhotoMemory) ? (
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              {!hasGeneratedVoiceReply ? (
                <Button
                  type="button"
                  size="sm"
                  variant="quiet"
                  isLoading={isGeneratingVoiceReply}
                  disabled={isGeneratingVoiceReply}
                  onClick={() => onGenerateVoiceReply?.(message.id)}
                >
                  Hear Angel
                </Button>
              ) : null}

              {!hasGeneratedPhotoMemory ? (
                <Button
                  type="button"
                  size="sm"
                  variant="quiet"
                  isLoading={isGeneratingPhotoMemory}
                  disabled={
                    isGeneratingPhotoMemory || !photoMemoryStatus.available
                  }
                  onClick={() => onGeneratePhotoMemory?.(message.id)}
                >
                  Memory Snapshot
                </Button>
              ) : null}
            </div>

            {!hasGeneratedPhotoMemory ? (
              <p className="text-[11px] uppercase tracking-[0.16em] text-text-tertiary">
                {photoMemoryHelper}
              </p>
            ) : null}
          </div>
        ) : null}

        {message.attachments.length > 0 && (
          <div className="mt-3 space-y-3">
            {message.attachments.map((attachment) => (
              <AttachmentPreview key={attachment.id} attachment={attachment} />
            ))}
          </div>
        )}

        <p className="mt-3 whitespace-pre-wrap text-sm leading-7">
          {message.contentText ?? ''}
        </p>
      </div>
    </div>
  )
})

function AttachmentPreview({
  attachment,
}: {
  attachment: ChatMessageRecord['attachments'][number]
}) {
  if (attachment.type === 'IMAGE') {
    const metadata =
      attachment.metadata &&
      typeof attachment.metadata === 'object' &&
      !Array.isArray(attachment.metadata)
        ? attachment.metadata
        : null
    const isPhotoMemory = metadata?.generatedKind === 'PHOTO_MEMORY'

    return (
      <div className="overflow-hidden rounded-[1.1rem] border border-white/10 bg-black/20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={attachment.url}
          alt={attachment.title ?? 'Shared image'}
          className="max-h-72 w-full object-cover"
        />
        <div className="space-y-1 px-3 py-2">
          {isPhotoMemory ? (
            <p className="text-[11px] uppercase tracking-[0.16em] text-text-tertiary">
              AI photo memory
            </p>
          ) : null}
          {attachment.title ? (
            <p className="text-xs text-text-tertiary">{attachment.title}</p>
          ) : null}
        </div>
      </div>
    )
  }

  if (attachment.type === 'VOICE_AUDIO') {
    const metadata =
      attachment.metadata &&
      typeof attachment.metadata === 'object' &&
      !Array.isArray(attachment.metadata)
        ? attachment.metadata
        : null
    const isAiGenerated = metadata?.aiGenerated === true

    return (
      <div className="rounded-[1.1rem] border border-white/10 bg-background/30 p-3">
        <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">
          {isAiGenerated
            ? 'Angel voice reply'
            : (attachment.title ?? 'Voice note')}
        </p>
        {isAiGenerated ? (
          <p className="mt-2 text-xs leading-6 text-text-secondary">
            AI-generated voice preview of Angel&apos;s saved reply.
          </p>
        ) : null}
        <audio controls src={attachment.url} className="mt-3 w-full" />
      </div>
    )
  }

  const preview =
    attachment.metadata &&
    typeof attachment.metadata === 'object' &&
    !Array.isArray(attachment.metadata)
      ? attachment.metadata
      : null

  const host = typeof preview?.host === 'string' ? preview.host : attachment.url
  const description =
    typeof preview?.description === 'string'
      ? preview.description
      : (attachment.title ?? attachment.url)

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className="block rounded-[1.1rem] border border-white/10 bg-black/20 p-3 transition-colors hover:border-accent-brand/25"
    >
      <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">
        {host}
      </p>
      <p className="mt-2 text-sm font-semibold text-text-primary">
        {attachment.title ?? 'Shared link'}
      </p>
      <p className="mt-2 text-sm leading-7 text-text-secondary">
        {description}
      </p>
    </a>
  )
}
