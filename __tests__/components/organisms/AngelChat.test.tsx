import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AngelChat } from '@/components/organisms/AngelChat'
import type { ChatState } from '@/lib/angel/chat-state'
import { buildDefaultSocialScanState } from '@/lib/social/types'

const {
  sendChatMessageMock,
  createCheckoutSessionMock,
  createBillingPortalSessionMock,
  updateMemoryEntryMock,
  deleteMemoryEntryMock,
  setRitualPreferencesMock,
  updateNotificationPreferencesMock,
  generatePhotoMemoryMock,
  generateAngelVoiceReplyMock,
  logRitualCheckInMock,
  startSocialConnectMock,
  rescanSocialAccountMock,
  disconnectSocialAccountMock,
  deleteImportedSocialDataMock,
  routerRefreshMock,
} = vi.hoisted(() => ({
  sendChatMessageMock: vi.fn(),
  createCheckoutSessionMock: vi.fn(),
  createBillingPortalSessionMock: vi.fn(),
  updateMemoryEntryMock: vi.fn(),
  deleteMemoryEntryMock: vi.fn(),
  setRitualPreferencesMock: vi.fn(),
  updateNotificationPreferencesMock: vi.fn(),
  generatePhotoMemoryMock: vi.fn(),
  generateAngelVoiceReplyMock: vi.fn(),
  logRitualCheckInMock: vi.fn(),
  startSocialConnectMock: vi.fn(),
  rescanSocialAccountMock: vi.fn(),
  disconnectSocialAccountMock: vi.fn(),
  deleteImportedSocialDataMock: vi.fn(),
  routerRefreshMock: vi.fn(),
}))

vi.mock('@/app/chat/actions', () => ({
  sendChatMessage: sendChatMessageMock,
  createCheckoutSession: createCheckoutSessionMock,
  createBillingPortalSession: createBillingPortalSessionMock,
  updateMemoryEntry: updateMemoryEntryMock,
  deleteMemoryEntry: deleteMemoryEntryMock,
  setRitualPreferences: setRitualPreferencesMock,
  updateNotificationPreferences: updateNotificationPreferencesMock,
  generatePhotoMemory: generatePhotoMemoryMock,
  generateAngelVoiceReply: generateAngelVoiceReplyMock,
  logRitualCheckIn: logRitualCheckInMock,
}))

vi.mock('@/app/social/actions', () => ({
  startSocialConnect: startSocialConnectMock,
  rescanSocialAccount: rescanSocialAccountMock,
  disconnectSocialAccount: disconnectSocialAccountMock,
  deleteImportedSocialData: deleteImportedSocialDataMock,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: routerRefreshMock,
  }),
}))

function buildChatState(overrides: Partial<ChatState> = {}): ChatState {
  return {
    status: 'ready',
    conversationId: 'conversation-1',
    threadReady: true,
    accessMode: 'ACTIVE',
    remainingFreeReplies: null,
    paywallReason: null,
    checkoutStatus: 'READY',
    companionContext: {
      preferredName: 'Charlie',
      angelName: 'Noor',
      relationshipIntent: 'GROW_OVER_TIME',
      relationshipStage: 'NEW_CONNECTION',
      scheduledTouchpointAt: '2026-03-19T18:45:00.000Z',
      scheduledTouchpointLabel: 'Thursday, March 19 at 6:45 PM',
    },
    messages: [
      {
        id: 'message-1',
        senderRole: 'ANGEL',
        contentText:
          "Charlie, I'm Noor. I already have our next gentle check-in marked for Thursday, March 19 at 6:45 PM.",
        contentType: 'TEXT',
        paywallState: 'FREE',
        createdAt: '2026-03-18T13:00:00.000Z',
        attachments: [],
      },
      {
        id: 'message-2',
        senderRole: 'USER',
        contentText: 'I needed somewhere steady tonight.',
        contentType: 'TEXT',
        paywallState: 'FREE',
        createdAt: '2026-03-18T13:02:00.000Z',
        attachments: [],
      },
    ],
    memoryEntries: [],
    relationshipDossier: {
      relationshipStage: 'NEW_CONNECTION',
      sections: [],
    },
    rituals: [],
    sharedRituals: [],
    socialScanState: buildDefaultSocialScanState(),
    photoMemoryStatus: {
      available: false,
      remainingThisMonth: 0,
      monthlyLimit: 0,
      unavailableReason: 'UPGRADE_REQUIRED',
    },
    notificationPreferences: {
      enabled: true,
      quietHoursStart: null,
      quietHoursEnd: null,
      timeZone: 'Europe/Lisbon',
    },
    ...overrides,
  }
}

describe('AngelChat', () => {
  beforeEach(() => {
    sendChatMessageMock.mockReset()
    createCheckoutSessionMock.mockReset()
    createBillingPortalSessionMock.mockReset()
    updateMemoryEntryMock.mockReset()
    deleteMemoryEntryMock.mockReset()
    setRitualPreferencesMock.mockReset()
    updateNotificationPreferencesMock.mockReset()
    generatePhotoMemoryMock.mockReset()
    generateAngelVoiceReplyMock.mockReset()
    logRitualCheckInMock.mockReset()
    startSocialConnectMock.mockReset()
    rescanSocialAccountMock.mockReset()
    disconnectSocialAccountMock.mockReset()
    deleteImportedSocialDataMock.mockReset()
    routerRefreshMock.mockReset()
  })

  it('renders both ANGEL and USER messages', () => {
    render(<AngelChat initialState={buildChatState()} />)

    expect(screen.getByText(/tonight's thread/i)).toBeInTheDocument()
    expect(
      screen.getByText(/i needed somewhere steady tonight\./i)
    ).toBeInTheDocument()
    expect(screen.getByText(/charlie, i'm noor\./i)).toBeInTheDocument()
  })

  it('shows an intentional empty state when the thread has no messages', () => {
    render(
      <AngelChat
        initialState={buildChatState({
          messages: [],
        })}
      />
    )

    expect(
      screen.getByText(
        /angel is here\. the thread is simply waiting for the first real message\./i
      )
    ).toBeInTheDocument()
  })

  it('sends a message and shows the returned read-only state after the free continuation turn closes', async () => {
    sendChatMessageMock.mockResolvedValue(
      buildChatState({
        accessMode: 'READ_ONLY',
        remainingFreeReplies: 0,
        paywallReason: 'CONTINUITY_RENEWAL',
        messages: [
          ...buildChatState().messages,
          {
            id: 'message-3',
            senderRole: 'USER',
            contentText: 'I made it back.',
            contentType: 'TEXT',
            paywallState: 'FREE',
            createdAt: '2026-03-19T19:05:00.000Z',
            attachments: [],
          },
          {
            id: 'message-4',
            senderRole: 'ANGEL',
            contentText:
              'I am glad you made it back. What do you need most right now?',
            contentType: 'TEXT',
            paywallState: 'READ_ONLY',
            createdAt: '2026-03-19T19:06:00.000Z',
            attachments: [],
          },
        ],
      })
    )

    render(<AngelChat initialState={buildChatState()} />)

    fireEvent.change(screen.getByLabelText(/send a message/i), {
      target: { value: '  I made it back.  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send text/i }))

    await waitFor(() =>
      expect(sendChatMessageMock).toHaveBeenCalledWith({
        conversationId: 'conversation-1',
        contentText: 'I made it back.',
        contentType: 'TEXT',
        attachments: [],
      })
    )

    await waitFor(() =>
      expect(
        screen.getByText(/this thread is paused at the threshold\./i)
      ).toBeInTheDocument()
    )
    expect(
      screen.getByText(
        /angel stayed with that, and the thread is now resting until renewal\./i
      )
    ).toBeInTheDocument()
    expect(screen.queryByLabelText(/send a message/i)).not.toBeInTheDocument()
    expect(
      screen.getByText(/this thread is paused at the threshold\./i)
    ).toBeInTheDocument()
  })

  it('shows a loading-safe composer state while a send is in flight', async () => {
    let resolveSend: ((value: ChatState) => void) | undefined

    sendChatMessageMock.mockReturnValue(
      new Promise<ChatState>((resolve) => {
        resolveSend = resolve
      })
    )

    render(<AngelChat initialState={buildChatState()} />)

    fireEvent.change(screen.getByLabelText(/send a message/i), {
      target: { value: 'Still here.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send text/i }))

    await waitFor(() =>
      expect(screen.getByLabelText(/send a message/i)).toBeDisabled()
    )
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /clear composer/i })
      ).toBeDisabled()
    )

    resolveSend?.(buildChatState())

    await waitFor(() =>
      expect(
        screen.getByText(
          /angel stayed with that, and the full turn is now saved to your thread\./i
        )
      ).toBeInTheDocument()
    )
  })

  it('renders an error state when the send fails', async () => {
    sendChatMessageMock.mockRejectedValue(new Error('Thread write failed.'))

    render(<AngelChat initialState={buildChatState()} />)

    fireEvent.change(screen.getByLabelText(/send a message/i), {
      target: { value: 'Please stay.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send text/i }))

    await waitFor(() =>
      expect(screen.getByText(/thread write failed\./i)).toBeInTheDocument()
    )
  })

  it('replaces the composer with the read-only paywall card', () => {
    render(
      <AngelChat
        initialState={buildChatState({
          accessMode: 'READ_ONLY',
          remainingFreeReplies: 0,
          paywallReason: 'CONTINUITY_RENEWAL',
          checkoutStatus: 'READY',
        })}
      />
    )

    expect(
      screen.getByText(/this thread is paused at the threshold\./i)
    ).toBeInTheDocument()
    expect(screen.queryByLabelText(/send a message/i)).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /continue with core/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /continue with pro/i })
    ).toBeInTheDocument()
  })

  it('shows a friendly in-app billing state when checkout is not wired yet', () => {
    render(
      <AngelChat
        initialState={buildChatState({
          accessMode: 'READ_ONLY',
          remainingFreeReplies: 0,
          paywallReason: 'CONTINUITY_RENEWAL',
          checkoutStatus: 'BILLING_UNAVAILABLE',
        })}
      />
    )

    expect(
      screen.getByText(/billing is not wired in this local environment yet/i)
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /core unavailable/i })
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: /pro unavailable/i })
    ).toBeDisabled()
  })

  it('opens the mobile context drawer and keeps relationship tools secondary', async () => {
    render(
      <AngelChat
        initialState={buildChatState({
          memoryEntries: [
            {
              id: 'memory-1',
              summary: 'Charlie likes late-night check-ins.',
              memoryType: 'PROFILE_FACT',
              confidence: 0.92,
              isPinned: false,
              isHidden: false,
              sourceMessageId: 'message-2',
              sourcePreview: 'I needed somewhere steady tonight.',
              createdAt: '2026-03-18T13:05:00.000Z',
              updatedAt: '2026-03-18T13:02:00.000Z',
            },
          ],
        })}
      />
    )

    expect(screen.queryByText(/memory controls/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /context/i }))

    const contextDialog = screen.getByRole('dialog')

    expect(
      within(contextDialog).getByText(/relationship context/i)
    ).toBeInTheDocument()
    expect(
      within(contextDialog).getByText(/continuity snapshot/i)
    ).toBeInTheDocument()
    expect(screen.queryByText(/memory controls/i)).not.toBeInTheDocument()

    fireEvent.click(
      within(contextDialog).getByRole('button', { name: /show tools/i })
    )

    expect(
      within(contextDialog).getByText(/memory controls/i)
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /close/i }))

    await waitFor(() =>
      expect(
        screen.queryByText(/relationship context/i)
      ).not.toBeInTheDocument()
    )
  })

  it('shows shared rituals in context and lets the user check in', async () => {
    logRitualCheckInMock.mockResolvedValue({
      success: true,
      streakCount: 4,
      alreadyCheckedIn: false,
      state: buildChatState({
        sharedRituals: [
          {
            id: 'ritual-1',
            title: 'Evening exhale',
            description: 'A slower night ritual for closing the day gently.',
            streakCount: 4,
            longestStreak: 7,
            lastCheckInDate: '2026-03-18T20:00:00.000Z',
          },
        ],
      }),
    })

    render(
      <AngelChat
        initialState={buildChatState({
          sharedRituals: [
            {
              id: 'ritual-1',
              title: 'Evening exhale',
              description: 'A slower night ritual for closing the day gently.',
              streakCount: 3,
              longestStreak: 7,
              lastCheckInDate: null,
            },
          ],
        })}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /context/i }))

    const contextDialog = screen.getByRole('dialog')

    expect(within(contextDialog).getByText(/our rituals/i)).toBeInTheDocument()
    expect(
      within(contextDialog).getByText(/evening exhale/i)
    ).toBeInTheDocument()
    expect(within(contextDialog).getByText(/3 days/i)).toBeInTheDocument()

    fireEvent.click(
      within(contextDialog).getByRole('button', { name: /check in today/i })
    )

    await waitFor(() =>
      expect(logRitualCheckInMock).toHaveBeenCalledWith('ritual-1')
    )

    await waitFor(() =>
      expect(within(contextDialog).getByText(/4 days/i)).toBeInTheDocument()
    )

    expect(screen.getByText(/the streak is now 4 days\./i)).toBeInTheDocument()
  })

  it('can generate an Angel voice reply for subscriber messages', async () => {
    generateAngelVoiceReplyMock.mockResolvedValue(
      buildChatState({
        accessMode: 'SUBSCRIBER',
        messages: [
          {
            ...buildChatState().messages[0],
            attachments: [
              {
                id: 'attachment-voice-1',
                type: 'VOICE_AUDIO',
                url: '/api/media/view/user-1/angel-voice-message-1.mp3',
                mimeType: 'audio/mpeg',
                title: 'Angel voice reply',
                metadata: {
                  aiGenerated: true,
                },
              },
            ],
          },
          buildChatState().messages[1],
        ],
      })
    )

    render(
      <AngelChat
        initialState={buildChatState({
          accessMode: 'SUBSCRIBER',
        })}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /hear angel/i }))

    await waitFor(() =>
      expect(generateAngelVoiceReplyMock).toHaveBeenCalledWith('message-1')
    )

    await waitFor(() =>
      expect(
        screen.getByText(/ai-generated voice preview of angel's saved reply\./i)
      ).toBeInTheDocument()
    )
  })

  it('can generate a photo memory from a saved Angel reply and renders the image in-thread', async () => {
    let resolvePhotoMemory: ((value: ChatState) => void) | undefined

    generatePhotoMemoryMock.mockReturnValue(
      new Promise<ChatState>((resolve) => {
        resolvePhotoMemory = resolve
      })
    )

    render(
      <AngelChat
        initialState={buildChatState({
          accessMode: 'SUBSCRIBER',
          photoMemoryStatus: {
            available: true,
            remainingThisMonth: 2,
            monthlyLimit: 2,
            unavailableReason: null,
          },
        })}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /memory snapshot/i }))

    await waitFor(() =>
      expect(generatePhotoMemoryMock).toHaveBeenCalledWith('message-1')
    )
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /memory snapshot/i })
      ).toBeDisabled()
    )

    resolvePhotoMemory?.(
      buildChatState({
        accessMode: 'SUBSCRIBER',
        photoMemoryStatus: {
          available: true,
          remainingThisMonth: 1,
          monthlyLimit: 2,
          unavailableReason: null,
        },
        messages: [
          {
            ...buildChatState().messages[0],
            attachments: [
              {
                id: 'attachment-image-1',
                type: 'IMAGE',
                url: '/api/media/view/user-1/memory-snapshot.png',
                mimeType: 'image/png',
                title: 'Memory snapshot',
                metadata: {
                  aiGenerated: true,
                  generatedKind: 'PHOTO_MEMORY',
                },
              },
            ],
          },
          buildChatState().messages[1],
        ],
      })
    )

    await waitFor(() =>
      expect(screen.getByText(/ai photo memory/i)).toBeInTheDocument()
    )
  })

  it('shows a disabled photo memory CTA when local image generation is unavailable', () => {
    render(
      <AngelChat
        initialState={buildChatState({
          accessMode: 'SUBSCRIBER',
          photoMemoryStatus: {
            available: false,
            remainingThisMonth: 2,
            monthlyLimit: 2,
            unavailableReason: 'MISSING_API_KEY',
          },
        })}
      />
    )

    expect(
      screen.getByRole('button', { name: /memory snapshot/i })
    ).toBeDisabled()
    expect(
      screen.getByText(/unavailable until openai_api_key is configured/i)
    ).toBeInTheDocument()
  })
})
