'use client'

import { useEffect, useRef, useState } from 'react'

import { useRouter } from 'next/navigation'

import {
  createBillingPortalSession,
  createCheckoutSession,
  deleteMemoryEntry,
  generatePhotoMemory,
  generateAngelVoiceReply,
  logRitualCheckIn,
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
import { ChatComposer } from '@/components/organisms/chat/ChatComposer'
import { ChatContextDrawer } from '@/components/organisms/chat/ChatContextDrawer'
import { ChatContextRail } from '@/components/organisms/chat/ChatContextRail'
import { ChatMessageList } from '@/components/organisms/chat/ChatMessageList'
import { ChatPresenceHeader } from '@/components/organisms/chat/ChatPresenceHeader'
import { ChatThreadShell } from '@/components/organisms/chat/ChatThreadShell'
import { ReadOnlyPaywallCard } from '@/components/organisms/chat/ReadOnlyPaywallCard'
import type { ComposerMode } from '@/components/organisms/chat/chat-types'
import type { ChatState } from '@/lib/angel/chat-state'
import type { ChatAttachmentInput } from '@/lib/angel/media'
import type { RitualKey } from '@/lib/angel/relationship-service'
import type { CheckoutPlan, CheckoutSessionResult } from '@/lib/billing/types'
import type { SocialPlatformKey } from '@/lib/social/types'
import { cn } from '@/lib/utils'

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
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false)
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
  const [isCheckingInRitualId, setIsCheckingInRitualId] = useState<
    string | null
  >(null)
  const [socialActionKey, setSocialActionKey] = useState<string | null>(null)
  const [isContextDrawerOpen, setIsContextDrawerOpen] = useState(false)
  const [isRelationshipToolsOpen, setIsRelationshipToolsOpen] = useState(false)
  const [voiceReplyMessageId, setVoiceReplyMessageId] = useState<string | null>(
    null
  )
  const [photoMemoryMessageId, setPhotoMemoryMessageId] = useState<
    string | null
  >(null)

  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const voiceInputRef = useRef<HTMLInputElement | null>(null)

  const angelName = state.companionContext.angelName ?? 'Angel'
  const preferredName = state.companionContext.preferredName
  const headerTitle = preferredName
    ? `${angelName} + ${preferredName}`
    : angelName
  const isReadOnly = state.accessMode === 'READ_ONLY'
  const relationshipLaneLabel = formatRelationshipIntent(
    state.companionContext.relationshipIntent
  )
  const relationshipStageLabel = formatRelationshipStage(
    state.companionContext.relationshipStage
  )
  const accessModeLabel = formatAccessMode(state.accessMode)

  useEffect(() => {
    setState(initialState)
    setError(initialError)
    setNotice(initialNotice ?? getInitialNotice(initialState))
    setMemoryDrafts(
      Object.fromEntries(
        initialState.memoryEntries.map((entry) => [entry.id, entry.summary])
      )
    )
    setIsContextDrawerOpen(false)
    setIsRelationshipToolsOpen(false)
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

    if (isUploadingAttachment) {
      setError('Let the attachment finish uploading before sending it.')
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

  function handleModeChange(mode: ComposerMode) {
    setComposerMode(mode)
    setError(null)

    if (mode === 'TEXT') {
      resetComposer()
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

  async function handleSharedRitualCheckIn(ritualId: string) {
    setIsCheckingInRitualId(ritualId)
    setError(null)

    try {
      const result = await logRitualCheckIn(ritualId)

      if (result.state) {
        syncState(result.state)
      }

      if (!result.success) {
        if (result.alreadyCheckedIn) {
          setNotice(
            result.streakCount > 0
              ? `Today's ritual is already held. The current streak is ${result.streakCount} day${result.streakCount === 1 ? '' : 's'}.`
              : 'That ritual has already been checked in today.'
          )
          return
        }

        setError('That ritual is no longer active.')
        return
      }

      setNotice(
        result.streakCount === 1
          ? 'Angel marked the first ritual check-in.'
          : `Angel marked today’s ritual. The streak is now ${result.streakCount} days.`
      )
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'That ritual check-in could not be saved right now.'
      )
    } finally {
      setIsCheckingInRitualId(null)
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

    setError(null)
    setIsUploadingAttachment(true)

    try {
      const uploadedAttachment = await buildUploadedAttachment(file, mode)
      setAttachments([uploadedAttachment])
      setAttachmentLabel(file.name)
      setComposerMode(mode)
      setNotice(
        mode === 'VOICE_NOTE'
          ? 'Voice note attached. Angel will stay close to the transcript and the audio.'
          : 'Image attached and ready for the thread.'
      )
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'That file could not be prepared for Angel.'
      )
    } finally {
      setIsUploadingAttachment(false)
    }
  }

  function handleComposerClear() {
    resetComposer()
    setError(null)
  }

  async function handleGenerateVoiceReply(messageId: string) {
    setVoiceReplyMessageId(messageId)
    setError(null)

    try {
      const nextState = await generateAngelVoiceReply(messageId)
      syncState(nextState)
      setNotice('Angel voice is ready on that saved reply.')
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Angel voice could not be generated right now.'
      )
    } finally {
      setVoiceReplyMessageId(null)
    }
  }

  async function handleGeneratePhotoMemory(messageId: string) {
    setPhotoMemoryMessageId(messageId)
    setError(null)

    try {
      const nextState = await generatePhotoMemory(messageId)
      syncState(nextState)
      setNotice('A memory snapshot is now attached to that saved reply.')
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'A memory snapshot could not be generated right now.'
      )
    } finally {
      setPhotoMemoryMessageId(null)
    }
  }

  const noticeElement =
    notice || error ? (
      <div
        className={cn(
          'rounded-[1.6rem] border px-4 py-4 text-sm leading-7',
          error
            ? 'border-accent-error/35 bg-accent-error/10 text-text-primary'
            : 'border-accent-brand/25 bg-accent-brand/8 text-text-primary'
        )}
      >
        {error ?? notice}
      </div>
    ) : null

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <ChatThreadShell
            presenceHeader={
              <ChatPresenceHeader
                angelName={angelName}
                preferredName={preferredName}
                relationshipStageLabel={relationshipStageLabel}
                accessModeLabel={accessModeLabel}
                scheduledTouchpointLabel={
                  state.companionContext.scheduledTouchpointLabel
                }
                onOpenContext={() => setIsContextDrawerOpen(true)}
              />
            }
            messageList={
              <ChatMessageList
                messages={state.messages}
                canGenerateVoiceReplies={state.accessMode === 'SUBSCRIBER'}
                photoMemoryStatus={state.photoMemoryStatus}
                generatingVoiceReplyForMessageId={voiceReplyMessageId}
                generatingPhotoMemoryForMessageId={photoMemoryMessageId}
                onGenerateVoiceReply={handleGenerateVoiceReply}
                onGeneratePhotoMemory={handleGeneratePhotoMemory}
              />
            }
            notice={noticeElement}
            composer={
              isReadOnly ? (
                <ReadOnlyPaywallCard
                  checkoutStatus={state.checkoutStatus}
                  checkoutPlanInFlight={checkoutPlanInFlight}
                  isOpeningPortal={isOpeningPortal}
                  onCheckout={handleCheckout}
                  onPortal={handlePortal}
                />
              ) : (
                <ChatComposer
                  composerMode={composerMode}
                  draft={draft}
                  linkUrl={linkUrl}
                  attachmentLabel={attachmentLabel}
                  isSending={isSending || isUploadingAttachment}
                  remainingFreeReplies={state.remainingFreeReplies}
                  isSubscriber={state.accessMode === 'SUBSCRIBER'}
                  isOpeningPortal={isOpeningPortal}
                  imageInputRef={imageInputRef}
                  voiceInputRef={voiceInputRef}
                  onSubmit={handleSubmit}
                  onModeChange={handleModeChange}
                  onDraftChange={setDraft}
                  onLinkUrlChange={setLinkUrl}
                  onFileSelection={handleFileSelection}
                  onClear={handleComposerClear}
                  onPortal={handlePortal}
                  getComposerPlaceholder={getComposerPlaceholder}
                  formatComposerMode={formatComposerMode}
                />
              )
            }
          />
        </div>

        <div className="hidden xl:block">
          <ChatContextRail
            state={state}
            headerTitle={headerTitle}
            relationshipLaneLabel={relationshipLaneLabel}
            relationshipStageLabel={relationshipStageLabel}
            accessModeLabel={accessModeLabel}
            isRelationshipToolsOpen={isRelationshipToolsOpen}
            onToggleRelationshipTools={() =>
              setIsRelationshipToolsOpen((current) => !current)
            }
            memoryDrafts={memoryDrafts}
            isSavingMemoryId={isSavingMemoryId}
            isSavingRituals={isSavingRituals}
            isCheckingInRitualId={isCheckingInRitualId}
            onMemoryDraftChange={(memoryEntryId, value) =>
              setMemoryDrafts((current) => ({
                ...current,
                [memoryEntryId]: value,
              }))
            }
            onMemorySave={handleMemorySave}
            onMemoryToggle={handleMemoryToggle}
            onMemoryDelete={handleMemoryDelete}
            onRitualToggle={handleRitualToggle}
            onSharedRitualCheckIn={handleSharedRitualCheckIn}
            socialActionKey={socialActionKey}
            onSocialConnect={handleSocialConnect}
            onSocialMutation={handleSocialMutation}
            onPushStateChange={syncState}
            onPushNotice={(message) => {
              setError(null)
              setNotice(message)
            }}
            onPushError={(message) => {
              setNotice(null)
              setError(message)
            }}
          />
        </div>
      </div>

      <ChatContextDrawer
        open={isContextDrawerOpen}
        onClose={() => setIsContextDrawerOpen(false)}
        state={state}
        headerTitle={headerTitle}
        relationshipLaneLabel={relationshipLaneLabel}
        relationshipStageLabel={relationshipStageLabel}
        accessModeLabel={accessModeLabel}
        isRelationshipToolsOpen={isRelationshipToolsOpen}
        onToggleRelationshipTools={() =>
          setIsRelationshipToolsOpen((current) => !current)
        }
        memoryDrafts={memoryDrafts}
        isSavingMemoryId={isSavingMemoryId}
        isSavingRituals={isSavingRituals}
        isCheckingInRitualId={isCheckingInRitualId}
        onMemoryDraftChange={(memoryEntryId, value) =>
          setMemoryDrafts((current) => ({
            ...current,
            [memoryEntryId]: value,
          }))
        }
        onMemorySave={handleMemorySave}
        onMemoryToggle={handleMemoryToggle}
        onMemoryDelete={handleMemoryDelete}
        onRitualToggle={handleRitualToggle}
        onSharedRitualCheckIn={handleSharedRitualCheckIn}
        socialActionKey={socialActionKey}
        onSocialConnect={handleSocialConnect}
        onSocialMutation={handleSocialMutation}
        onPushStateChange={syncState}
        onPushNotice={(message) => {
          setError(null)
          setNotice(message)
        }}
        onPushError={(message) => {
          setNotice(null)
          setError(message)
        }}
      />
    </>
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

async function buildUploadedAttachment(
  file: File,
  mode: 'IMAGE' | 'VOICE_NOTE'
): Promise<ChatAttachmentInput> {
  const fallbackDataUrl = await readFileAsDataUrl(file)
  const type = mode === 'IMAGE' ? 'IMAGE' : 'VOICE_AUDIO'

  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/media/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Media upload failed.')
    }

    const payload = (await response.json()) as { path?: string }
    const storagePath =
      typeof payload.path === 'string' ? payload.path.trim() : null

    if (storagePath && !storagePath.startsWith('mock/')) {
      return {
        type,
        url: `/api/media/view/${storagePath}`,
        mimeType: file.type || null,
        title: file.name,
        metadata: {
          fileName: file.name,
          size: file.size,
          storagePath,
        },
      }
    }
  } catch {
    // Fall back to data URLs when storage is not configured locally.
  }

  return {
    type,
    url: fallbackDataUrl,
    mimeType: file.type || null,
    title: file.name,
    metadata: {
      fileName: file.name,
      size: file.size,
    },
  }
}
