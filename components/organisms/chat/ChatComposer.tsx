import type { FormEvent, MutableRefObject } from 'react'

import { Button } from '@/components/atoms/Button'
import type { ComposerMode } from '@/components/organisms/chat/chat-types'

const composerModes: ComposerMode[] = ['TEXT', 'LINK', 'IMAGE', 'VOICE_NOTE']

interface ChatComposerProps {
  composerMode: ComposerMode
  draft: string
  linkUrl: string
  attachmentLabel: string | null
  isSending: boolean
  remainingFreeReplies: number | null
  isSubscriber: boolean
  isOpeningPortal: boolean
  imageInputRef: MutableRefObject<HTMLInputElement | null>
  voiceInputRef: MutableRefObject<HTMLInputElement | null>
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onModeChange: (mode: ComposerMode) => void
  onDraftChange: (value: string) => void
  onLinkUrlChange: (value: string) => void
  onFileSelection: (
    event: React.ChangeEvent<HTMLInputElement>,
    mode: 'IMAGE' | 'VOICE_NOTE'
  ) => void
  onClear: () => void
  onPortal: () => void
  getComposerPlaceholder: (mode: ComposerMode) => string
  formatComposerMode: (mode: ComposerMode) => string
}

export function ChatComposer({
  composerMode,
  draft,
  linkUrl,
  attachmentLabel,
  isSending,
  remainingFreeReplies,
  isSubscriber,
  isOpeningPortal,
  imageInputRef,
  voiceInputRef,
  onSubmit,
  onModeChange,
  onDraftChange,
  onLinkUrlChange,
  onFileSelection,
  onClear,
  onPortal,
  getComposerPlaceholder,
  formatComposerMode,
}: ChatComposerProps) {
  return (
    <form onSubmit={onSubmit} className="angel-chat-composer space-y-4">
      <div className="flex flex-wrap gap-2">
        {composerModes.map((mode) => (
          <Button
            key={mode}
            type="button"
            size="sm"
            variant={composerMode === mode ? 'default' : 'chip'}
            onClick={() => onModeChange(mode)}
          >
            {formatComposerMode(mode)}
          </Button>
        ))}
      </div>

      {remainingFreeReplies === 1 && (
        <div className="rounded-[1.45rem] border border-accent-brand/25 bg-accent-brand/8 px-4 py-3 text-sm leading-7 text-text-primary">
          Angel&apos;s continuity message is live. One free reply remains before
          this thread settles into read-only renewal.
        </div>
      )}

      {composerMode === 'LINK' && (
        <label className="block space-y-2">
          <span className="text-xs uppercase tracking-[0.22em] text-text-tertiary">
            Link URL
          </span>
          <input
            value={linkUrl}
            disabled={isSending}
            onChange={(event) => onLinkUrlChange(event.target.value)}
            placeholder="https://..."
            className="angel-input"
          />
        </label>
      )}

      {(composerMode === 'IMAGE' || composerMode === 'VOICE_NOTE') && (
        <div className="space-y-3 rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="quiet"
              onClick={() =>
                composerMode === 'IMAGE'
                  ? imageInputRef.current?.click()
                  : voiceInputRef.current?.click()
              }
            >
              {composerMode === 'IMAGE' ? 'Choose image' : 'Choose voice note'}
            </Button>
            {attachmentLabel ? (
              <span className="self-center text-sm text-text-secondary">
                {attachmentLabel}
              </span>
            ) : null}
          </div>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => onFileSelection(event, 'IMAGE')}
          />
          <input
            ref={voiceInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(event) => onFileSelection(event, 'VOICE_NOTE')}
          />
        </div>
      )}

      <label className="block space-y-2">
        <span className="text-xs uppercase tracking-[0.22em] text-text-tertiary">
          {composerMode === 'TEXT'
            ? 'Send a message'
            : composerMode === 'LINK'
              ? 'Why this link matters'
              : composerMode === 'IMAGE'
                ? 'Optional image note'
                : 'Optional voice-note hint'}
        </span>
        <textarea
          rows={4}
          value={draft}
          disabled={isSending}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder={getComposerPlaceholder(composerMode)}
          className="angel-textarea"
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" isLoading={isSending} disabled={isSending}>
          {isSending
            ? 'Angel is replying'
            : `Send ${formatComposerMode(composerMode)}`}
        </Button>
        <Button
          type="button"
          variant="quiet"
          disabled={isSending}
          onClick={onClear}
        >
          Clear composer
        </Button>
        {isSubscriber ? (
          <Button
            type="button"
            variant="outline"
            isLoading={isOpeningPortal}
            disabled={isOpeningPortal}
            onClick={onPortal}
          >
            Manage billing
          </Button>
        ) : null}
      </div>
    </form>
  )
}
