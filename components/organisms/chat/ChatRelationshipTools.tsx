import { Button } from '@/components/atoms/Button'
import { SocialStatusCard } from '@/components/organisms/chat/SocialStatusCard'
import type { ChatState } from '@/lib/angel/chat-state'
import type { RitualKey } from '@/lib/angel/relationship-service'
import type { SocialPlatformKey } from '@/lib/social/types'
import { cn } from '@/lib/utils'

interface ChatRelationshipToolsProps {
  isOpen: boolean
  onToggle: () => void
  memoryEntries: ChatState['memoryEntries']
  memoryDrafts: Record<string, string>
  isSavingMemoryId: string | null
  onMemoryDraftChange: (memoryEntryId: string, value: string) => void
  onMemorySave: (memoryEntryId: string) => void
  onMemoryToggle: (
    memoryEntryId: string,
    input: {
      isPinned?: boolean
      isHidden?: boolean
    }
  ) => void
  onMemoryDelete: (memoryEntryId: string) => void
  rituals: ChatState['rituals']
  isSavingRituals: boolean
  onRitualToggle: (ritualKey: RitualKey) => void
  socialScanState: ChatState['socialScanState']
  socialActionKey: string | null
  onSocialConnect: (platform: SocialPlatformKey) => Promise<void>
  onSocialMutation: (
    platform: SocialPlatformKey,
    action: 'rescan' | 'disconnect' | 'delete'
  ) => Promise<void>
}

export function ChatRelationshipTools({
  isOpen,
  onToggle,
  memoryEntries,
  memoryDrafts,
  isSavingMemoryId,
  onMemoryDraftChange,
  onMemorySave,
  onMemoryToggle,
  onMemoryDelete,
  rituals,
  isSavingRituals,
  onRitualToggle,
  socialScanState,
  socialActionKey,
  onSocialConnect,
  onSocialMutation,
}: ChatRelationshipToolsProps) {
  return (
    <div className="space-y-4 rounded-[1.75rem] border border-white/8 bg-black/10 p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="angel-kicker">Relationship tools</p>
          <p className="mt-3 text-sm leading-7 text-text-secondary">
            Editing, ritual preferences, and social management stay nearby
            without taking over the live thread.
          </p>
        </div>
        <Button type="button" size="sm" variant="chip" onClick={onToggle}>
          {isOpen ? 'Hide tools' : 'Show tools'}
        </Button>
      </div>

      {isOpen ? (
        <div className="space-y-5">
          <section className="space-y-4">
            <div>
              <h3 className="font-display text-[1.45rem] tracking-[-0.04em] text-text-primary">
                Memory controls
              </h3>
              <p className="mt-2 text-sm leading-7 text-text-secondary">
                Pin what matters, edit what is wrong, hide what should fade, or
                delete it.
              </p>
            </div>

            {memoryEntries.length === 0 ? (
              <div className="angel-panel-soft p-5 text-sm leading-7 text-text-secondary">
                The thread does not have editable memories yet. They appear once
                enough durable signal survives extraction.
              </div>
            ) : (
              memoryEntries.map((entry) => (
                <div
                  key={entry.id}
                  className={cn(
                    'rounded-[1.4rem] border p-4',
                    entry.isHidden
                      ? 'border-white/8 bg-white/[0.02]'
                      : 'border-stroke-subtle bg-white/[0.03]'
                  )}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
                      {entry.memoryType.replace('_', ' ')}
                    </span>
                    {entry.isPinned ? (
                      <span className="text-[10px] uppercase tracking-[0.18em] text-accent-brand">
                        This matters
                      </span>
                    ) : null}
                    {entry.isHidden ? (
                      <span className="text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
                        Hidden
                      </span>
                    ) : null}
                  </div>

                  <textarea
                    rows={3}
                    value={memoryDrafts[entry.id] ?? entry.summary}
                    disabled={isSavingMemoryId === entry.id}
                    onChange={(event) =>
                      onMemoryDraftChange(entry.id, event.target.value)
                    }
                    className="angel-textarea mt-3"
                  />

                  {entry.sourcePreview ? (
                    <p className="mt-2 text-xs leading-6 text-text-tertiary">
                      Source: {entry.sourcePreview}
                    </p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-3">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => onMemorySave(entry.id)}
                      disabled={isSavingMemoryId === entry.id}
                    >
                      Save
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="chip"
                      onClick={() =>
                        onMemoryToggle(entry.id, {
                          isPinned: !entry.isPinned,
                        })
                      }
                      disabled={isSavingMemoryId === entry.id}
                    >
                      {entry.isPinned ? 'Unpin' : 'This matters'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="quiet"
                      onClick={() =>
                        onMemoryToggle(entry.id, {
                          isHidden: !entry.isHidden,
                        })
                      }
                      disabled={isSavingMemoryId === entry.id}
                    >
                      {entry.isHidden ? 'Unhide' : 'Hide'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => onMemoryDelete(entry.id)}
                      disabled={isSavingMemoryId === entry.id}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="font-display text-[1.45rem] tracking-[-0.04em] text-text-primary">
                Ritual controls
              </h3>
              <p className="mt-2 text-sm leading-7 text-text-secondary">
                Let Angel keep a rhythm without becoming noisy.
              </p>
            </div>

            <div className="space-y-3">
              {rituals.map((ritual) => (
                <button
                  key={ritual.key}
                  type="button"
                  disabled={isSavingRituals}
                  onClick={() => onRitualToggle(ritual.key)}
                  className={cn(
                    'w-full rounded-[1.35rem] border p-4 text-left transition-colors',
                    ritual.enabled
                      ? 'border-accent-brand/25 bg-accent-brand/8'
                      : 'border-stroke-subtle bg-white/[0.03] hover:border-accent-brand/20'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {ritual.label}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-text-secondary">
                        {ritual.description}
                      </p>
                    </div>
                    <span className="text-xs uppercase tracking-[0.18em] text-text-tertiary">
                      {ritual.enabled ? 'On' : 'Off'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="font-display text-[1.45rem] tracking-[-0.04em] text-text-primary">
                Social management
              </h3>
              <p className="mt-2 text-sm leading-7 text-text-secondary">
                Rescan, disconnect, or remove imported data without blocking the
                relationship thread.
              </p>
            </div>

            <div className="space-y-3">
              {socialScanState.map((item) => (
                <SocialStatusCard
                  key={item.platform}
                  item={item}
                  actionKey={socialActionKey}
                  onConnect={onSocialConnect}
                  onMutate={onSocialMutation}
                />
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
