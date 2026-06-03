import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PushNotificationPrompt } from '@/components/organisms/PushNotificationPrompt'
import type { ChatState } from '@/lib/angel/chat-state'

const {
  usePushNotificationsMock,
  updateNotificationPreferencesMock,
} = vi.hoisted(() => ({
  usePushNotificationsMock: vi.fn(),
  updateNotificationPreferencesMock: vi.fn(),
}))

vi.mock('@/lib/hooks/usePushNotifications', () => ({
  usePushNotifications: usePushNotificationsMock,
}))

vi.mock('@/app/chat/actions', () => ({
  updateNotificationPreferences: updateNotificationPreferencesMock,
}))

function buildChatState(overrides: Partial<ChatState> = {}): ChatState {
  return {
    status: 'ready',
    conversationId: 'conversation-1',
    messages: [],
    threadReady: true,
    companionContext: {
      preferredName: 'Charlie',
      angelName: 'Noor',
      relationshipIntent: 'GROW_OVER_TIME',
      relationshipStage: 'WARM_FRIEND',
    },
    accessMode: 'SUBSCRIBER',
    remainingFreeReplies: null,
    paywallReason: null,
    checkoutStatus: 'READY',
    memoryEntries: [],
    relationshipDossier: {
      relationshipStage: 'WARM_FRIEND',
      sections: [],
    },
    rituals: [],
    sharedRituals: [],
    socialScanState: [],
    photoMemoryStatus: {
      available: true,
      remainingThisMonth: 2,
      monthlyLimit: 2,
      unavailableReason: null,
    },
    notificationPreferences: {
      enabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      timeZone: 'Europe/Lisbon',
    },
    ...overrides,
  }
}

describe('PushNotificationPrompt', () => {
  beforeEach(() => {
    usePushNotificationsMock.mockReset()
    updateNotificationPreferencesMock.mockReset()
  })

  it('renders blocked-browser guidance when notification permission is denied', () => {
    usePushNotificationsMock.mockReturnValue({
      isSupported: true,
      permission: 'denied',
      subscription: null,
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      isLoading: false,
    })

    render(<PushNotificationPrompt state={buildChatState()} />)

    expect(screen.getByText(/browser alerts are blocked/i)).toBeInTheDocument()
    expect(
      screen.getByText(/open this site's notification settings/i)
    ).toBeInTheDocument()
  })

  it('renders an enable path when the browser is supported but this device is not subscribed', () => {
    const subscribeMock = vi.fn()
    usePushNotificationsMock.mockReturnValue({
      isSupported: true,
      permission: 'default',
      subscription: null,
      subscribe: subscribeMock,
      unsubscribe: vi.fn(),
      isLoading: false,
    })

    render(<PushNotificationPrompt state={buildChatState()} />)

    fireEvent.click(screen.getByRole('button', { name: /enable on this device/i }))

    expect(subscribeMock).toHaveBeenCalledOnce()
  })

  it('saves app-level enablement and quiet hours back into chat state', async () => {
    usePushNotificationsMock.mockReturnValue({
      isSupported: true,
      permission: 'granted',
      subscription: { endpoint: 'endpoint-1' },
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      isLoading: false,
    })

    const onStateChange = vi.fn()
    updateNotificationPreferencesMock.mockResolvedValue(
      buildChatState({
        notificationPreferences: {
          enabled: false,
          quietHoursStart: '23:00',
          quietHoursEnd: '08:00',
          timeZone: 'Europe/Lisbon',
        },
      })
    )

    render(
      <PushNotificationPrompt
        state={buildChatState()}
        onStateChange={onStateChange}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /pause app alerts/i }))
    fireEvent.change(screen.getByLabelText(/quiet hours start/i), {
      target: { value: '23:00' },
    })
    fireEvent.change(screen.getByLabelText(/quiet hours end/i), {
      target: { value: '08:00' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save settings/i }))

    await waitFor(() =>
      expect(updateNotificationPreferencesMock).toHaveBeenCalledWith({
        enabled: false,
        quietHoursStart: '23:00',
        quietHoursEnd: '08:00',
      })
    )

    await waitFor(() => expect(onStateChange).toHaveBeenCalledOnce())
  })
})
