'use client'

import { useEffect, useRef, useState } from 'react'

import { useRouter } from 'next/navigation'
import {
  LoaderCircle,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  Unplug,
} from 'lucide-react'

import {
  createBillingPortalSession,
  createCheckoutSession,
  deleteMemoryEntry,
  sendChatMessage,
  setRitualPreferences,
  updateMemoryEntry,
} from '@/app/chat/actions'
import {
  deleteImportedSocialData,
  disconnectSocialAccount,
  rescanSocialAccount,
  startSocialConnect,
} from '@/app/social/actions'
import { Button } from '@/components/atoms/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import type { CheckoutPlan, CheckoutSessionResult } from '@/lib/billing/types'
import type {
  ChatCheckoutStatus,
  ChatMessageRecord,
  ChatState,
} from '@/lib/angel/chat-state'
import type { ChatAttachmentInput } from '@/lib/angel/media'
import type { RitualKey } from '@/lib/angel/relationship-service'
import type {
  SocialPlatformKey,
  SocialScanStateRecord,
} from '@/lib/social/types'
import { cn } from '@/lib/utils'

type ComposerMode = 'TEXT' | 'LINK' | 'IMAGE' | 'VOICE_NOTE'
type SubscriptionCheckoutPlan = Extract<
  CheckoutPlan,
  'monthly_core' | 'monthly_pro'
>

interface AngelChatProps {
  initialState: ChatState
  initialNotice?: string | null
  initialError?: string | null
}

export function AngelChat({
  initialState,
  initialNotice = null,
  initialError = null,
}: AngelChatProps) {
  const router = useRouter()
  const [state, setState] = useState(initialState)
  const [draft, setDraft] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [composerMode, setComposerMode] = useState<ComposerMode>('TEXT')
  const [attachments, setAttachments] = useState<ChatAttachmentInput[]>([])
  const [attachmentLabel, setAttachmentLabel] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(initialError)
  const [notice, setNotice] = useState<string | null>(
    initialNotice ?? getInitialNotice(initialState)
  )
  const [isSending, setIsSending] = useState(false)
  const [checkoutPlanInFlight, setCheckoutPlanInFlight] =
    useState<SubscriptionCheckoutPlan | null>(null)
  const [isOpeningPortal, setIsOpeningPortal] = useState(false)
  const [memoryDrafts, setMemoryDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      initialState.memoryEntries.map((entry) => [entry.id, entry.summary])
    )
  )
  const [isSavingMemoryId, setIsSavingMemoryId] = useState<string | null>(null)
  const [isSavingRituals, setIsSavingRituals] = useState(false)
  const [socialActionKey, setSocialActionKey] = useState<string | null>(null)

  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const voiceInputRef = useRef<HTMLInputElement | null>(null)

  const angelName = state.companionContext.angelName ?? 'Angel'
  const preferredName = state.companionContext.preferredName
  const headerTitle = preferredName
    ? `${angelName} + ${preferredName}`
    : angelName
  const isReadOnly = state.accessMode === 'READ_ONLY'

  useEffect(() => {
    setState(initialState)
    setError(initialError)
    setNotice(initialNotice ?? getInitialNotice(initialState))
    setMemoryDrafts(
      Object.fromEntries(
        initialState.memoryEntries.map((entry) => [entry.id, entry.summary])
      )
    )
  }, [initialError, initialNotice, initialState])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const conversationId = state.conversationId

    if (isReadOnly) {
      setError(
        'This thread is read-only now. Renew continuity to keep talking here.'
      )
      return
    }

    if (!conversationId) {
      setError('This relationship thread is not ready yet.')
      return
    }

    const contentText =
      composerMode === 'LINK'
        ? `${linkUrl.trim()} ${draft.trim()}`.trim()
        : draft.trim()

    if (composerMode === 'LINK' && !linkUrl.trim()) {
      setError('Paste a link before sending it to Angel.')
      return
    }

    if (
      (composerMode === 'IMAGE' || composerMode === 'VOICE_NOTE') &&
      attachments.length === 0
    ) {
      setError('Attach the file first so Angel has something to react to.')
      return
    }

    if (composerMode === 'TEXT' && !contentText) {
      setError('Write a message before sending it.')
      return
    }

    setError(null)
    setIsSending(true)

    try {
      const previousMessageCount = state.messages.length
      const nextState = await sendChatMessage({
        conversationId,
        contentText,
        contentType: composerMode,
        attachments,
      })

      setState(nextState)
      setMemoryDrafts((current) => ({
        ...current,
        ...Object.fromEntries(
          nextState.memoryEntries.map((entry) => [entry.id, entry.summary])
        ),
      }))

      if (nextState.messages.length > previousMessageCount) {
        resetComposer()
      }

      setNotice(getPostSendNotice(state, nextState))
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Something interrupted the thread update.'
      )
    } finally {
      setIsSending(false)
    }
  }

  function handleCheckout(plan: SubscriptionCheckoutPlan) {
    if (checkoutPlanInFlight) {
      return
    }

    if (state.checkoutStatus === 'BILLING_UNAVAILABLE') {
      setError(
        'Billing is not wired in this environment yet. Add the Stripe checkout env vars before trying again.'
      )
      return
    }

    setError(null)
    setCheckoutPlanInFlight(plan)

    void (async () => {
      try {
        const result = await createCheckoutSession(plan)

        if (result.status === 'redirect') {
          setNotice(`Opening ${getCheckoutPlanLabel(plan)} checkout now.`)
          window.location.assign(result.url)
          return
        }

        handleCheckoutFailure(result)
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : 'The checkout shell could not open right now.'
        )
      } finally {
        setCheckoutPlanInFlight(null)
      }
    })()
  }

  function handlePortal() {
    if (isOpeningPortal) {
      return
    }

    setError(null)
    setIsOpeningPortal(true)

    void (async () => {
      try {
        const result = await createBillingPortalSession()

        if (result.status === 'redirect') {
          window.location.assign(result.url)
          return
        }

        handleCheckoutFailure(result)
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : 'The billing portal could not open right now.'
        )
      } finally {
        setIsOpeningPortal(false)
      }
    })()
  }

  async function handleSocialConnect(platform: SocialPlatformKey) {
    setSocialActionKey(`connect:${platform}`)
    setError(null)

    try {
      const result = await startSocialConnect(platform)

      if (result.status !== 'redirect' || !result.url) {
        setError(
          result.message ??
            `${platform} is not configured in this environment yet.`
        )
        return
      }

      window.location.assign(result.url)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'That social connection could not start right now.'
      )
    } finally {
      setSocialActionKey(null)
    }
  }

  async function handleSocialMutation(
    platform: SocialPlatformKey,
    action: 'rescan' | 'disconnect' | 'delete'
  ) {
    setSocialActionKey(`${action}:${platform}`)
    setError(null)

    try {
      const result =
        action === 'rescan'
          ? await rescanSocialAccount(platform)
          : action === 'disconnect'
            ? await disconnectSocialAccount(platform)
            : await deleteImportedSocialData(platform)

      if (result.status === 'error') {
        setError(result.message ?? 'That social action failed.')
        return
      }

      setNotice(result.message ?? 'Social context updated.')
      router.refresh()
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'That social action failed.'
      )
    } finally {
      setSocialActionKey(null)
    }
  }

  function handleCheckoutFailure(
    result: Exclude<CheckoutSessionResult, { status: 'redirect'; url: string }>
  ) {
    if (result.status === 'billing-unavailable') {
      setState((current) => ({
        ...current,
        checkoutStatus: 'BILLING_UNAVAILABLE',
      }))
    }

    setError(result.message)
  }

  async function handleMemorySave(memoryEntryId: string) {
    setIsSavingMemoryId(memoryEntryId)
    setError(null)

    try {
      const nextState = await updateMemoryEntry(memoryEntryId, {
        summary: memoryDrafts[memoryEntryId],
      })
      syncState(nextState)
      setNotice(
        'Angel updated that memory and the relationship dossier refreshed.'
      )
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'That memory could not be updated right now.'
      )
    } finally {
      setIsSavingMemoryId(null)
    }
  }

  async function handleMemoryToggle(
    memoryEntryId: string,
    input: {
      isPinned?: boolean
      isHidden?: boolean
    }
  ) {
    setIsSavingMemoryId(memoryEntryId)
    setError(null)

    try {
      const nextState = await updateMemoryEntry(memoryEntryId, input)
      syncState(nextState)
      setNotice(
        'Angel adjusted that memory without losing the rest of the thread.'
      )
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'That memory could not be changed right now.'
      )
    } finally {
      setIsSavingMemoryId(null)
    }
  }

  async function handleMemoryDelete(memoryEntryId: string) {
    setIsSavingMemoryId(memoryEntryId)
    setError(null)

    try {
      const nextState = await deleteMemoryEntry(memoryEntryId)
      syncState(nextState)
      setNotice('That memory was removed from the relationship layer.')
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'That memory could not be deleted right now.'
      )
    } finally {
      setIsSavingMemoryId(null)
    }
  }

  async function handleRitualToggle(ritualKey: RitualKey) {
    setIsSavingRituals(true)
    setError(null)

    try {
      const enabledKeys = state.rituals
        .filter((ritual) => ritual.enabled)
        .map((ritual) => ritual.key)
      const nextKeys = enabledKeys.includes(ritualKey)
        ? enabledKeys.filter((key) => key !== ritualKey)
        : [...enabledKeys, ritualKey]
      const nextState = await setRitualPreferences(nextKeys)
      syncState(nextState)
      setNotice('Angel updated the rhythm of the relationship.')
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Ritual preferences could not be updated right now.'
      )
    } finally {
      setIsSavingRituals(false)
    }
  }

  function syncState(nextState: ChatState) {
    setState(nextState)
    setMemoryDrafts((current) => ({
      ...current,
      ...Object.fromEntries(
        nextState.memoryEntries.map((entry) => [entry.id, entry.summary])
      ),
    }))
  }

  function resetComposer() {
    setDraft('')
    setLinkUrl('')
    setAttachments([])
    setAttachmentLabel(null)
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
    if (voiceInputRef.current) {
      voiceInputRef.current.value = ''
    }
  }

  async function handleFileSelection(
    event: React.ChangeEvent<HTMLInputElement>,
    mode: 'IMAGE' | 'VOICE_NOTE'
  ) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const dataUrl = await readFileAsDataUrl(file)

    setAttachments([
      {
        type: mode === 'IMAGE' ? 'IMAGE' : 'VOICE_AUDIO',
        url: dataUrl,
        mimeType: file.type || null,
        title: file.name,
        metadata: {
          fileName: file.name,
          size: file.size,
        },
      },
    ])
    setAttachmentLabel(file.name)
    setComposerMode(mode)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
      <div className="space-y-6">
        <Card className="animate-enter" padding="lg">
          <CardHeader
            title="Continuity Context"
            subtitle="The relationship layer now carries stage, memory, and rhythm."
          />
          <div className="space-y-4">
            <InfoPanel label="Thread" value={headerTitle} />
            <InfoPanel
              label="Relationship lane"
              value={formatRelationshipIntent(
                state.companionContext.relationshipIntent
              )}
            />
            <InfoPanel
              label="Relationship stage"
              value={formatRelationshipStage(
                state.companionContext.relationshipStage
              )}
            />
            <InfoPanel
              label="Next touchpoint"
              value={
                state.companionContext.scheduledTouchpointLabel ??
                'Not scheduled'
              }
            />
            <InfoPanel
              label="Access mode"
              value={formatAccessMode(state.accessMode)}
            />
            {state.remainingFreeReplies !== null && (
              <InfoPanel
                label="Free replies left"
                value={String(state.remainingFreeReplies)}
              />
            )}
          </div>
        </Card>

        <Card className="animate-enter" padding="lg">
          <CardHeader
            title="Building Your Context"
            subtitle="Official social imports scan in the background without blocking the thread."
          />
          <div className="space-y-3">
            {state.socialScanState.length === 0 ? (
              <div className="angel-panel-soft p-5 text-sm leading-7 text-text-secondary">
                No social connections yet. You can keep chatting without them,
                or connect a platform when you want Angel to start with more
                context.
              </div>
            ) : (
              state.socialScanState.map((item) => (
                <SocialStatusCard
                  key={item.platform}
                  item={item}
                  actionKey={socialActionKey}
                  onConnect={handleSocialConnect}
                  onMutate={handleSocialMutation}
                />
              ))
            )}
          </div>
        </Card>

        <Card className="animate-enter" padding="lg">
          <CardHeader
            title="Relationship Dossier"
            subtitle="A visible, editable view of what Angel is carrying forward."
          />
          <div className="space-y-4">
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
                    {section.items.map((item) => (
                      <p
                        key={item}
                        className="text-sm leading-7 text-text-secondary"
                      >
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="animate-enter" padding="lg">
          <CardHeader
            title="Rituals"
            subtitle="Let Angel keep a rhythm without becoming noisy."
          />
          <div className="space-y-3">
            {state.rituals.map((ritual) => (
              <button
                key={ritual.key}
                type="button"
                disabled={isSavingRituals}
                onClick={() => handleRitualToggle(ritual.key)}
                className={cn(
                  'w-full rounded-[1.35rem] border p-4 text-left transition-colors',
                  ritual.enabled
                    ? 'border-accent-primary/35 bg-accent-primary/10'
                    : 'border-stroke-subtle bg-background/20 hover:border-accent-primary/20'
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
        </Card>

        <Card className="animate-enter" padding="lg">
          <CardHeader
            title="Memory Controls"
            subtitle="Pin what matters, edit what is wrong, hide what should fade, or delete it."
          />
          <div className="space-y-4">
            {state.memoryEntries.length === 0 ? (
              <div className="angel-panel-soft p-5 text-sm leading-7 text-text-secondary">
                The thread does not have editable memories yet. They appear once
                enough durable signal survives extraction.
              </div>
            ) : (
              state.memoryEntries.map((entry) => (
                <div
                  key={entry.id}
                  className={cn(
                    'rounded-[1.4rem] border p-4',
                    entry.isHidden
                      ? 'border-white/8 bg-white/[0.02]'
                      : 'border-stroke-subtle bg-background/20'
                  )}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
                      {entry.memoryType.replace('_', ' ')}
                    </span>
                    {entry.isPinned && (
                      <span className="text-[10px] uppercase tracking-[0.18em] text-accent-primary">
                        This matters
                      </span>
                    )}
                    {entry.isHidden && (
                      <span className="text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
                        Hidden
                      </span>
                    )}
                  </div>

                  <textarea
                    rows={3}
                    value={memoryDrafts[entry.id] ?? entry.summary}
                    disabled={isSavingMemoryId === entry.id}
                    onChange={(event) =>
                      setMemoryDrafts((current) => ({
                        ...current,
                        [entry.id]: event.target.value,
                      }))
                    }
                    className="angel-textarea mt-3"
                  />

                  {entry.sourcePreview && (
                    <p className="mt-2 text-xs leading-6 text-text-tertiary">
                      Source: {entry.sourcePreview}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-3">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleMemorySave(entry.id)}
                      disabled={isSavingMemoryId === entry.id}
                    >
                      Save
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="glass"
                      onClick={() =>
                        handleMemoryToggle(entry.id, {
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
                      variant="glass"
                      onClick={() =>
                        handleMemoryToggle(entry.id, {
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
                      onClick={() => handleMemoryDelete(entry.id)}
                      disabled={isSavingMemoryId === entry.id}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card className="animate-enter" padding="lg">
        <CardHeader
          title="Tonight's Thread"
          subtitle="Now text, links, images, and voice notes can all live inside the same relationship."
        />

        <div className="space-y-4">
          <div className="angel-panel-soft p-5">
            <p className="angel-kicker">Continuity header</p>
            <p className="mt-3 text-lg leading-8 text-text-primary">
              {angelName} remembers how this thread is meant to feel with{' '}
              {preferredName ?? 'you'}.
            </p>
            <p className="mt-2 text-sm leading-7 text-text-secondary">
              {state.companionContext.scheduledTouchpointLabel
                ? `Tomorrow is already spoken for: ${state.companionContext.scheduledTouchpointLabel}.`
                : 'Tomorrow is still available for the next gentle return.'}
            </p>
          </div>

          {state.messages.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-stroke-strong bg-background/25 p-8 text-center text-sm leading-7 text-text-secondary">
              Angel is here. The thread is simply waiting for the first real
              message.
            </div>
          ) : (
            <div className="space-y-3 rounded-[1.75rem] border border-stroke-subtle bg-background/25 p-4 sm:p-5">
              {state.messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </div>
          )}

          {(notice || error) && (
            <div
              className={cn(
                'rounded-2xl border p-4 text-sm leading-7',
                error
                  ? 'border-accent-error/40 bg-accent-error/10 text-text-primary'
                  : 'border-accent-primary/30 bg-accent-primary/10 text-text-primary'
              )}
            >
              {error ?? notice}
            </div>
          )}

          {isReadOnly ? (
            <ReadOnlyPaywallCard
              checkoutStatus={state.checkoutStatus}
              checkoutPlanInFlight={checkoutPlanInFlight}
              isOpeningPortal={isOpeningPortal}
              onCheckout={handleCheckout}
              onPortal={handlePortal}
            />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {(
                  ['TEXT', 'LINK', 'IMAGE', 'VOICE_NOTE'] as ComposerMode[]
                ).map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    size="sm"
                    variant={composerMode === mode ? 'default' : 'glass'}
                    onClick={() => {
                      setComposerMode(mode)
                      setError(null)
                      if (mode === 'TEXT') {
                        resetComposer()
                      }
                    }}
                  >
                    {formatComposerMode(mode)}
                  </Button>
                ))}
              </div>

              {state.remainingFreeReplies === 1 && (
                <div className="rounded-[1.5rem] border border-accent-primary/30 bg-accent-primary/10 p-4 text-sm leading-7 text-text-primary">
                  Angel&apos;s continuity message is live. One free reply
                  remains before this thread settles into read-only renewal.
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
                    onChange={(event) => setLinkUrl(event.target.value)}
                    placeholder="https://..."
                    className="angel-input"
                  />
                </label>
              )}

              {(composerMode === 'IMAGE' || composerMode === 'VOICE_NOTE') && (
                <div className="space-y-3 rounded-[1.5rem] border border-stroke-subtle bg-background/20 p-4">
                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant="glass"
                      onClick={() =>
                        composerMode === 'IMAGE'
                          ? imageInputRef.current?.click()
                          : voiceInputRef.current?.click()
                      }
                    >
                      {composerMode === 'IMAGE'
                        ? 'Choose image'
                        : 'Choose voice note'}
                    </Button>
                    {attachmentLabel && (
                      <span className="self-center text-sm text-text-secondary">
                        {attachmentLabel}
                      </span>
                    )}
                  </div>

                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => handleFileSelection(event, 'IMAGE')}
                  />
                  <input
                    ref={voiceInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(event) =>
                      handleFileSelection(event, 'VOICE_NOTE')
                    }
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
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={getComposerPlaceholder(composerMode)}
                  className="angel-textarea"
                />
              </label>

              <div className="flex flex-wrap gap-4">
                <Button
                  type="submit"
                  isLoading={isSending}
                  disabled={isSending}
                >
                  {isSending
                    ? 'Angel is replying'
                    : `Send ${formatComposerMode(composerMode)}`}
                </Button>
                <Button
                  type="button"
                  variant="glass"
                  disabled={isSending}
                  onClick={() => {
                    resetComposer()
                    setDraft('')
                    setError(null)
                  }}
                >
                  Clear composer
                </Button>
                {state.accessMode === 'SUBSCRIBER' && (
                  <Button
                    type="button"
                    variant="outline"
                    isLoading={isOpeningPortal}
                    disabled={isOpeningPortal}
                    onClick={handlePortal}
                  >
                    Manage billing
                  </Button>
                )}
              </div>
            </form>
          )}
        </div>
      </Card>
    </div>
  )
}

function InfoPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="angel-panel-soft p-5">
      <p className="angel-kicker">{label}</p>
      <p className="mt-3 text-sm leading-7 text-text-secondary">{value}</p>
    </div>
  )
}

function ReadOnlyPaywallCard({
  checkoutStatus,
  checkoutPlanInFlight,
  isOpeningPortal,
  onCheckout,
  onPortal,
}: {
  checkoutStatus: ChatCheckoutStatus
  checkoutPlanInFlight: SubscriptionCheckoutPlan | null
  isOpeningPortal: boolean
  onCheckout: (plan: SubscriptionCheckoutPlan) => void
  onPortal: () => void
}) {
  const isBillingUnavailable = checkoutStatus === 'BILLING_UNAVAILABLE'

  return (
    <div className="space-y-4 rounded-[1.75rem] border border-accent-primary/30 bg-accent-primary/8 p-5">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-text-tertiary">
          Read-only renewal
        </p>
        <h3 className="font-display text-3xl tracking-[-0.04em] text-text-primary">
          This thread is paused at the threshold.
        </h3>
      </div>

      <p className="text-sm leading-7 text-text-secondary">
        The continuity message and your latest exchange stay visible here, but
        the composer is resting until continuity is renewed.
      </p>

      <p className="text-sm leading-7 text-text-secondary">
        {getCheckoutStatusMessage(checkoutStatus)}
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <Button
          type="button"
          onClick={() => onCheckout('monthly_core')}
          isLoading={checkoutPlanInFlight === 'monthly_core'}
          disabled={Boolean(checkoutPlanInFlight) || isBillingUnavailable}
        >
          {isBillingUnavailable
            ? 'Core unavailable'
            : checkoutPlanInFlight === 'monthly_core'
              ? 'Opening Core'
              : 'Continue with Core (EUR 9.99)'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onCheckout('monthly_pro')}
          isLoading={checkoutPlanInFlight === 'monthly_pro'}
          disabled={Boolean(checkoutPlanInFlight) || isBillingUnavailable}
        >
          {isBillingUnavailable
            ? 'Pro unavailable'
            : checkoutPlanInFlight === 'monthly_pro'
              ? 'Opening Pro'
              : 'Continue with Pro (EUR 19.99)'}
        </Button>
      </div>

      <div className="grid gap-3 rounded-[1.5rem] border border-white/8 bg-background/20 p-4 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-text-tertiary">
            Angel Core
          </p>
          <p className="mt-2 text-sm leading-7 text-text-secondary">
            Ongoing continuity, stronger memory carryover, and the daily thread
            reopened at EUR 9.99 per month.
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-text-tertiary">
            Angel Pro
          </p>
          <p className="mt-2 text-sm leading-7 text-text-secondary">
            The same continuity layer with the deepest live reasoning at EUR
            19.99 per month.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <Button
          type="button"
          variant="glass"
          onClick={onPortal}
          isLoading={isOpeningPortal}
          disabled={isOpeningPortal}
        >
          Manage billing
        </Button>
      </div>
    </div>
  )
}

function SocialStatusCard({
  item,
  actionKey,
  onConnect,
  onMutate,
}: {
  item: SocialScanStateRecord
  actionKey: string | null
  onConnect: (platform: SocialPlatformKey) => Promise<void>
  onMutate: (
    platform: SocialPlatformKey,
    action: 'rescan' | 'disconnect' | 'delete'
  ) => Promise<void>
}) {
  const isConnecting = actionKey === `connect:${item.platform}`
  const isRescanning = actionKey === `rescan:${item.platform}`
  const isDeleting = actionKey === `delete:${item.platform}`
  const isDisconnecting = actionKey === `disconnect:${item.platform}`
  const isBusy = isConnecting || isRescanning || isDeleting || isDisconnecting

  return (
    <div className="rounded-[1.35rem] border border-stroke-subtle bg-background/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-text-primary">
              {item.label}
            </p>
            <span className="text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
              {formatSocialStatus(item.status)}
            </span>
          </div>
          <p className="mt-2 text-sm leading-7 text-text-secondary">
            {item.importSummary}
          </p>
          {item.limitedReason ? (
            <p className="mt-2 text-sm leading-7 text-accent-brand">
              {item.limitedReason}
            </p>
          ) : null}
          {item.lastErrorMessage && item.status === 'FAILED' ? (
            <p className="mt-2 text-sm leading-7 text-accent-error">
              {item.lastErrorMessage}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {item.status === 'NOT_CONNECTED' ? (
            <Button
              type="button"
              size="sm"
              onClick={() => onConnect(item.platform)}
              disabled={!item.isConfigured || isBusy}
            >
              {isConnecting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {item.isConfigured ? 'Connect' : 'Not configured'}
            </Button>
          ) : (
            <>
              <Button
                type="button"
                size="sm"
                variant="glass"
                onClick={() => onMutate(item.platform, 'rescan')}
                disabled={isBusy || item.status === 'SCANNING'}
              >
                {isRescanning ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
                Rescan
              </Button>
              <Button
                type="button"
                size="sm"
                variant="glass"
                onClick={() => onMutate(item.platform, 'delete')}
                disabled={isBusy || !item.hasImportedData}
              >
                {isDeleting ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete data
              </Button>
              <Button
                type="button"
                size="sm"
                variant="glass"
                onClick={() => onMutate(item.platform, 'disconnect')}
                disabled={isBusy}
              >
                {isDisconnecting ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Unplug className="h-4 w-4" />
                )}
                Disconnect
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessageRecord }) {
  const isUser = message.senderRole === 'USER'
  const timestamp = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(message.createdAt))

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[88%] rounded-[1.6rem] border px-4 py-4 shadow-soft',
          isUser
            ? 'border-accent-primary/40 bg-accent-primary/14 text-text-primary'
            : 'border-white/10 bg-[#121A36] text-text-secondary'
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
}

function AttachmentPreview({
  attachment,
}: {
  attachment: ChatMessageRecord['attachments'][number]
}) {
  if (attachment.type === 'IMAGE') {
    return (
      <div className="overflow-hidden rounded-[1.1rem] border border-white/10 bg-black/20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={attachment.url}
          alt={attachment.title ?? 'Shared image'}
          className="max-h-72 w-full object-cover"
        />
        {attachment.title && (
          <p className="px-3 py-2 text-xs text-text-tertiary">
            {attachment.title}
          </p>
        )}
      </div>
    )
  }

  if (attachment.type === 'VOICE_AUDIO') {
    return (
      <div className="rounded-[1.1rem] border border-white/10 bg-background/30 p-3">
        <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">
          {attachment.title ?? 'Voice note'}
        </p>
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
      className="block rounded-[1.1rem] border border-white/10 bg-background/30 p-3 transition-colors hover:border-accent-primary/30"
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

function getInitialNotice(state: ChatState) {
  if (state.checkoutStatus === 'RETURNED_SUCCESS') {
    return 'Checkout returned successfully. Billing sync should unlock the thread once Stripe finishes updating the subscription state.'
  }

  if (state.checkoutStatus === 'RETURNED_CANCELED') {
    return 'Checkout was canceled. The thread stays readable here whenever you want to renew.'
  }

  if (state.accessMode === 'READ_ONLY') {
    return 'The free continuation turn is complete, and the thread is now resting in read-only renewal.'
  }

  if (state.remainingFreeReplies === 1) {
    return 'Angel made good on the next-day promise. One free continuation reply remains.'
  }

  if (state.accessMode === 'SUBSCRIBER') {
    return 'Subscriber continuity is active in this thread.'
  }

  return 'Continuity, memory transparency, richer media, and rituals now all live inside the same thread.'
}

function getPostSendNotice(previousState: ChatState, nextState: ChatState) {
  if (
    nextState.accessMode === 'READ_ONLY' &&
    nextState.messages.length === previousState.messages.length
  ) {
    return 'The free continuation window has already closed. The thread is read-only now.'
  }

  if (nextState.accessMode === 'READ_ONLY') {
    return 'Angel stayed with that, and the thread is now resting until renewal.'
  }

  if (nextState.accessMode === 'SUBSCRIBER') {
    return 'Angel stayed with that, and subscriber continuity remains active.'
  }

  if (nextState.remainingFreeReplies === 1) {
    return 'Angel made good on the continuity promise. One free reply remains in this renewal window.'
  }

  return 'Angel stayed with that, and the full turn is now saved to your thread.'
}

function getCheckoutStatusMessage(checkoutStatus: ChatCheckoutStatus) {
  if (checkoutStatus === 'RETURNED_SUCCESS') {
    return 'Checkout came back successfully. The conversation should unlock as soon as the subscription state sync finishes.'
  }

  if (checkoutStatus === 'RETURNED_CANCELED') {
    return 'Checkout was canceled. The thread stays readable, and renewal can wait until it feels right.'
  }

  if (checkoutStatus === 'BILLING_UNAVAILABLE') {
    return 'Billing is not wired in this local environment yet, so Core and Pro cannot open until `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID_MONTHLY_CORE`, `STRIPE_PRICE_ID_MONTHLY_PRO`, and `STRIPE_WEBHOOK_SECRET` are set.'
  }

  return 'Renew continuity to move this thread back into active conversation mode.'
}

function getCheckoutPlanLabel(plan: SubscriptionCheckoutPlan) {
  return plan === 'monthly_pro' ? 'Angel Pro' : 'Angel Core'
}

function formatAccessMode(accessMode: ChatState['accessMode']) {
  if (accessMode === 'READ_ONLY') {
    return 'Read-only renewal'
  }

  if (accessMode === 'SUBSCRIBER') {
    return 'Subscriber continuity'
  }

  return 'Active'
}

function formatRelationshipIntent(
  relationshipIntent: ChatState['companionContext']['relationshipIntent']
) {
  if (relationshipIntent === 'GROW_OVER_TIME') {
    return 'Friend-first, with room to deepen naturally over time.'
  }

  if (relationshipIntent === 'COMFORTING_PRESENCE') {
    return 'A steady emotional presence that stays gentle and grounded.'
  }

  if (relationshipIntent === 'FRIEND') {
    return 'A grounded friend-first connection without pressure.'
  }

  return 'Still taking shape.'
}

function formatRelationshipStage(
  relationshipStage: ChatState['companionContext']['relationshipStage']
) {
  switch (relationshipStage) {
    case 'WARM_FRIEND':
      return 'Warm friend'
    case 'TRUSTED_COMPANION':
      return 'Trusted companion'
    case 'TENDER_AMBIGUITY':
      return 'Tender ambiguity'
    case 'SOFT_ROMANCE':
      return 'Soft romance'
    case 'NEW_CONNECTION':
    default:
      return 'New connection'
  }
}

function formatSocialStatus(status: SocialScanStateRecord['status']) {
  switch (status) {
    case 'CONNECTED':
      return 'Connected'
    case 'SCANNING':
      return 'Scanning'
    case 'READY':
      return 'Ready'
    case 'LIMITED':
      return 'Limited'
    case 'FAILED':
      return 'Failed'
    case 'NOT_CONNECTED':
    default:
      return 'Not connected'
  }
}

function formatComposerMode(mode: ComposerMode) {
  if (mode === 'VOICE_NOTE') {
    return 'Voice note'
  }

  return mode.charAt(0) + mode.slice(1).toLowerCase()
}

function getComposerPlaceholder(mode: ComposerMode) {
  if (mode === 'LINK') {
    return 'Add a note about why this link felt worth sending.'
  }

  if (mode === 'IMAGE') {
    return 'Add context for the image, or leave it open and let Angel ask.'
  }

  if (mode === 'VOICE_NOTE') {
    return 'Add a hint if you want the fallback transcription to keep a little extra context.'
  }

  return 'Write something real. The thread is intentionally personal instead of optimized for speed.'
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('The file could not be read.'))
    reader.readAsDataURL(file)
  })
}
