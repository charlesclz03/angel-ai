import { Card } from '@/components/ui/Card'
import { PushNotificationPrompt } from '@/components/organisms/PushNotificationPrompt'
import { ChatRelationshipTools } from '@/components/organisms/chat/ChatRelationshipTools'
import { InfoPanel } from '@/components/organisms/chat/InfoPanel'
import { SocialStatusCard } from '@/components/organisms/chat/SocialStatusCard'
import type { ChatState } from '@/lib/angel/chat-state'
import type { RitualKey } from '@/lib/angel/relationship-service'
import type { SocialPlatformKey } from '@/lib/social/types'

export interface ChatContextRailProps {
  state: ChatState
  headerTitle: string
  relationshipLaneLabel: string
  relationshipStageLabel: string
  accessModeLabel: string
  isRelationshipToolsOpen: boolean
  onToggleRelationshipTools: () => void
  memoryDrafts: Record<string, string>
  isSavingMemoryId: string | null
  isSavingRituals: boolean
  isCheckingInRitualId: string | null
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
  onRitualToggle: (ritualKey: RitualKey) => void
  onSharedRitualCheckIn: (ritualId: string) => void
  socialActionKey: string | null
  onSocialConnect: (platform: SocialPlatformKey) => Promise<void>
  onSocialMutation: (
    platform: SocialPlatformKey,
    action: 'rescan' | 'disconnect' | 'delete'
  ) => Promise<void>
  onPushStateChange: (state: ChatState) => void
  onPushNotice: (message: string) => void
  onPushError: (message: string) => void
}

export function ChatContextRail({
  state,
  headerTitle,
  relationshipLaneLabel,
  relationshipStageLabel,
  accessModeLabel,
  isRelationshipToolsOpen,
  onToggleRelationshipTools,
  memoryDrafts,
  isSavingMemoryId,
  isSavingRituals,
  isCheckingInRitualId,
  onMemoryDraftChange,
  onMemorySave,
  onMemoryToggle,
  onMemoryDelete,
  onRitualToggle,
  onSharedRitualCheckIn,
  socialActionKey,
  onSocialConnect,
  onSocialMutation,
  onPushStateChange,
  onPushNotice,
  onPushError,
}: ChatContextRailProps) {
  return (
    <div className="space-y-4">
      <Card variant="rail" padding="lg" className="animate-enter">
        <p className="angel-kicker">Continuity snapshot</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <InfoPanel label="Thread" value={headerTitle} />
          <InfoPanel label="Relationship lane" value={relationshipLaneLabel} />
          <InfoPanel
            label="Relationship stage"
            value={relationshipStageLabel}
          />
          <InfoPanel
            label="Next touchpoint"
            value={
              state.companionContext.scheduledTouchpointLabel ?? 'Not scheduled'
            }
          />
          <InfoPanel label="Access mode" value={accessModeLabel} />
          {state.remainingFreeReplies !== null ? (
            <InfoPanel
              label="Free replies left"
              value={String(state.remainingFreeReplies)}
            />
          ) : null}
        </div>
      </Card>

      <Card variant="rail" padding="lg" className="animate-enter">
        <p className="angel-kicker">Relationship summary</p>
        <div className="mt-5 space-y-3">
          {state.relationshipDossier.sections.length === 0 ? (
            <div className="angel-panel-soft p-5 text-sm leading-7 text-text-secondary">
              Durable memory is still thin here. It will deepen as the thread
              gathers more real turns.
            </div>
          ) : (
            state.relationshipDossier.sections.map((section) => (
              <div key={section.title} className="angel-panel-soft p-5">
                <p className="angel-kicker">{section.title}</p>
                <div className="mt-3 space-y-2">
                  {section.items.slice(0, 2).map((item) => (
                    <p
                      key={item}
                      className="text-sm leading-7 text-text-secondary"
                    >
                      {item}
                    </p>
                  ))}
                  {section.items.length > 2 ? (
                    <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">
                      +{section.items.length - 2} more held in memory
                    </p>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card variant="rail" padding="lg" className="animate-enter">
        <p className="angel-kicker">Social context</p>
        <div className="mt-5 space-y-3">
          {state.socialScanState.length === 0 ? (
            <div className="angel-panel-soft p-5 text-sm leading-7 text-text-secondary">
              No social connections yet. You can keep chatting without them, or
              connect a platform when you want Angel to start with more context.
            </div>
          ) : (
            state.socialScanState.map((item) => (
              <SocialStatusCard
                key={item.platform}
                item={item}
                actionKey={socialActionKey}
                onConnect={onSocialConnect}
                onMutate={onSocialMutation}
                showActions={false}
              />
            ))
          )}
        </div>
      </Card>

      <Card variant="rail" padding="lg" className="animate-enter">
        <p className="angel-kicker">Ritual summary</p>
        <div className="mt-5 space-y-3">
          {state.rituals.map((ritual) => (
            <div
              key={ritual.key}
              className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {ritual.label}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-text-secondary">
                    {ritual.description}
                  </p>
                </div>
                <span className="angel-chat-chip shrink-0">
                  {ritual.enabled ? 'On' : 'Off'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card variant="rail" padding="lg" className="animate-enter">
        <p className="angel-kicker">Our rituals</p>
        <div className="mt-5 space-y-3">
          {state.sharedRituals.length === 0 ? (
            <div className="angel-panel-soft p-5 text-sm leading-7 text-text-secondary">
              No shared rituals are active yet. Turn on a ritual in Relationship
              tools and Angel will carry it forward here with a real streak you
              can check into.
            </div>
          ) : (
            state.sharedRituals.map((ritual) => {
              const checkedInToday = isCheckedInToday(ritual.lastCheckInDate)

              return (
                <div
                  key={ritual.id}
                  className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {ritual.title}
                      </p>
                      {ritual.description ? (
                        <p className="mt-2 text-sm leading-7 text-text-secondary">
                          {ritual.description}
                        </p>
                      ) : null}
                    </div>
                    <span className="angel-chat-chip shrink-0">
                      {formatStreakLabel(ritual.streakCount)}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="angel-chat-chip">
                      Best {formatStreakLabel(ritual.longestStreak)}
                    </span>
                    <span className="angel-chat-chip">
                      {formatLastCheckInLabel(ritual.lastCheckInDate)}
                    </span>
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      disabled={
                        checkedInToday || isCheckingInRitualId === ritual.id
                      }
                      onClick={() => onSharedRitualCheckIn(ritual.id)}
                      className="rounded-full border border-accent-brand/25 bg-accent-brand/8 px-4 py-2 text-sm font-medium text-text-primary transition-colors disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-text-tertiary"
                    >
                      {checkedInToday
                        ? 'Checked in today'
                        : isCheckingInRitualId === ritual.id
                          ? 'Saving...'
                          : 'Check in today'}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>

      <PushNotificationPrompt
        state={state}
        onStateChange={onPushStateChange}
        onNotice={onPushNotice}
        onError={onPushError}
      />

      <ChatRelationshipTools
        isOpen={isRelationshipToolsOpen}
        onToggle={onToggleRelationshipTools}
        memoryEntries={state.memoryEntries}
        memoryDrafts={memoryDrafts}
        isSavingMemoryId={isSavingMemoryId}
        onMemoryDraftChange={onMemoryDraftChange}
        onMemorySave={onMemorySave}
        onMemoryToggle={onMemoryToggle}
        onMemoryDelete={onMemoryDelete}
        rituals={state.rituals}
        isSavingRituals={isSavingRituals}
        onRitualToggle={onRitualToggle}
        socialScanState={state.socialScanState}
        socialActionKey={socialActionKey}
        onSocialConnect={onSocialConnect}
        onSocialMutation={onSocialMutation}
      />
    </div>
  )
}

function formatStreakLabel(value: number) {
  return `${value} day${value === 1 ? '' : 's'}`
}

function formatLastCheckInLabel(value: string | null) {
  if (!value) {
    return 'Not checked in yet'
  }

  const date = new Date(value)

  return `Last check-in ${new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date)}`
}

function isCheckedInToday(value: string | null) {
  if (!value) {
    return false
  }

  const date = new Date(value)
  const today = new Date()

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}
