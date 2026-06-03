import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ChatState } from '@/lib/angel/chat-state'
import { buildDefaultSocialScanState } from '@/lib/social/types'

const { getServerAuthSessionMock, loadChatStateForUserMock, redirectMock } =
  vi.hoisted(() => ({
    getServerAuthSessionMock: vi.fn(),
    loadChatStateForUserMock: vi.fn(),
    redirectMock: vi.fn((path: string) => {
      throw new Error(`REDIRECT:${path}`)
    }),
  }))

vi.mock('@/lib/auth', () => ({
  getServerAuthSession: getServerAuthSessionMock,
}))

vi.mock('@/lib/angel/chat-service', () => ({
  loadChatStateForUser: loadChatStateForUserMock,
}))

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}))

vi.mock('@/components/organisms/AngelChat', () => ({
  AngelChat: ({ initialState }: { initialState: ChatState }) => (
    <div>Chat ready for {initialState.companionContext.angelName}</div>
  ),
}))

import ChatPage from '@/app/chat/page'

function buildReadyChatState(): ChatState {
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
    messages: [],
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
  }
}

describe('/chat page', () => {
  beforeEach(() => {
    getServerAuthSessionMock.mockReset()
    loadChatStateForUserMock.mockReset()
    redirectMock.mockClear()
  })

  it('redirects guests to /onboarding', async () => {
    getServerAuthSessionMock.mockResolvedValue(null)

    await expect(ChatPage({})).rejects.toThrow('REDIRECT:/onboarding')
    expect(loadChatStateForUserMock).not.toHaveBeenCalled()
  })

  it('redirects signed-in users with incomplete onboarding to /onboarding', async () => {
    getServerAuthSessionMock.mockResolvedValue({
      user: { id: 'user-1', name: 'Charlie', email: 'charlie@example.com' },
    })
    loadChatStateForUserMock.mockResolvedValue({
      ...buildReadyChatState(),
      status: 'needs-onboarding',
      threadReady: false,
    })

    await expect(ChatPage({})).rejects.toThrow('REDIRECT:/onboarding')
  })

  it('renders the active thread for completed users', async () => {
    getServerAuthSessionMock.mockResolvedValue({
      user: { id: 'user-1', name: 'Charlie', email: 'charlie@example.com' },
    })
    loadChatStateForUserMock.mockResolvedValue(buildReadyChatState())

    const page = await ChatPage({})

    render(page)

    expect(screen.getByText(/chat ready for noor/i)).toBeInTheDocument()
    expect(
      screen.getByText(/one calm place to pick the thread back up\./i)
    ).toBeInTheDocument()
    expect(screen.queryByText(/thread design goals/i)).not.toBeInTheDocument()
  })
})
