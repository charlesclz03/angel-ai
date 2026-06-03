import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

import type { ChatMessageRecord } from '@/lib/angel/chat-state'
import type { PhotoMemoryStatus } from '@/lib/angel/photo-memory-service'

import { MessageBubble } from './MessageBubble'

interface ChatMessageListProps {
  messages: ChatMessageRecord[]
  canGenerateVoiceReplies?: boolean
  photoMemoryStatus: PhotoMemoryStatus
  generatingVoiceReplyForMessageId?: string | null
  generatingPhotoMemoryForMessageId?: string | null
  onGenerateVoiceReply?: (messageId: string) => void
  onGeneratePhotoMemory?: (messageId: string) => void
}

export function ChatMessageList({
  messages,
  canGenerateVoiceReplies = false,
  photoMemoryStatus,
  generatingVoiceReplyForMessageId = null,
  generatingPhotoMemoryForMessageId = null,
  onGenerateVoiceReply,
  onGeneratePhotoMemory,
}: ChatMessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Estimated average message height in px
    overscan: 5, // Render 5 extra items above/below viewport for smooth scrolling
  })

  if (messages.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-stroke-strong bg-black/10 p-8 text-center text-sm leading-7 text-text-secondary">
        Angel is here. The thread is simply waiting for the first real message.
      </div>
    )
  }

  return (
    <div className="rounded-[1.9rem] border border-white/8 bg-black/10 p-4 shadow-soft sm:p-5">
      <div
        ref={parentRef}
        className="overflow-y-auto"
        style={{ contain: 'strict' }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            position: 'relative',
            width: '100%',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const message = messages[virtualItem.index]
            return (
              <div
                key={message.id}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                className="py-1.5 sm:py-2"
              >
                <MessageBubble
                  message={message}
                  canGenerateVoiceReply={canGenerateVoiceReplies}
                  photoMemoryStatus={photoMemoryStatus}
                  isGeneratingVoiceReply={
                    generatingVoiceReplyForMessageId === message.id
                  }
                  isGeneratingPhotoMemory={
                    generatingPhotoMemoryForMessageId === message.id
                  }
                  onGenerateVoiceReply={onGenerateVoiceReply}
                  onGeneratePhotoMemory={onGeneratePhotoMemory}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
