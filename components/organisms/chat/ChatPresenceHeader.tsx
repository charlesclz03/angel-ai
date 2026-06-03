import { Button } from '@/components/atoms/Button'

interface ChatPresenceHeaderProps {
  angelName: string
  preferredName: string | null
  relationshipStageLabel: string
  accessModeLabel: string
  scheduledTouchpointLabel?: string
  onOpenContext: () => void
}

export function ChatPresenceHeader({
  angelName,
  preferredName,
  relationshipStageLabel,
  accessModeLabel,
  scheduledTouchpointLabel,
  onOpenContext,
}: ChatPresenceHeaderProps) {
  const counterpart = preferredName ?? 'you'

  return (
    <div className="angel-chat-presence">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="angel-kicker">Tonight&apos;s thread</p>
          <h2 className="mt-4 font-display text-[clamp(2rem,5vw,3rem)] leading-[0.96] tracking-[-0.05em] text-text-primary">
            {preferredName ? `${angelName} + ${preferredName}` : angelName}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-text-secondary sm:text-[0.95rem]">
            {angelName} is holding the tone of this thread with {counterpart},
            so it still feels like a continuation instead of a dashboard reset.
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          variant="quiet"
          className="xl:hidden"
          onClick={onOpenContext}
        >
          Context
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="angel-chat-chip">{relationshipStageLabel}</span>
        <span className="angel-chat-chip">{accessModeLabel}</span>
      </div>

      <p className="mt-4 text-sm leading-7 text-text-secondary">
        {scheduledTouchpointLabel
          ? `Tomorrow is already spoken for: ${scheduledTouchpointLabel}.`
          : 'Tomorrow is still available for the next gentle return.'}
      </p>
    </div>
  )
}
