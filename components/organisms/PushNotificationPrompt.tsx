'use client'

import { useEffect, useState } from 'react'

import { Bell, BellOff, BellRing, MoonStar } from 'lucide-react'

import { updateNotificationPreferences } from '@/app/chat/actions'
import { Button } from '@/components/atoms/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { usePushNotifications } from '@/lib/hooks/usePushNotifications'
import type { ChatState } from '@/lib/angel/chat-state'

interface PushNotificationPromptProps {
  state: ChatState
  onStateChange?: (state: ChatState) => void
  onNotice?: (message: string) => void
  onError?: (message: string) => void
}

export function PushNotificationPrompt({
  state,
  onStateChange,
  onNotice,
  onError,
}: PushNotificationPromptProps) {
  const {
    isSupported,
    permission,
    subscribe,
    unsubscribe,
    subscription,
    isLoading,
  } = usePushNotifications()
  const [appEnabled, setAppEnabled] = useState(
    state.notificationPreferences.enabled
  )
  const [quietHoursStart, setQuietHoursStart] = useState(
    state.notificationPreferences.quietHoursStart ?? ''
  )
  const [quietHoursEnd, setQuietHoursEnd] = useState(
    state.notificationPreferences.quietHoursEnd ?? ''
  )
  const [isSavingPreferences, setIsSavingPreferences] = useState(false)

  useEffect(() => {
    setAppEnabled(state.notificationPreferences.enabled)
    setQuietHoursStart(state.notificationPreferences.quietHoursStart ?? '')
    setQuietHoursEnd(state.notificationPreferences.quietHoursEnd ?? '')
  }, [state.notificationPreferences])

  if (!isSupported || state.accessMode !== 'SUBSCRIBER') {
    return null
  }

  async function handleBrowserEnable() {
    const nextSubscription = await subscribe()

    if (nextSubscription) {
      onNotice?.('Push notifications are active on this device now.')
      return
    }

    if (permission === 'denied') {
      onError?.(
        'Browser notifications are blocked. Re-enable them in site settings to let Angel reach this device.'
      )
    }
  }

  async function handleBrowserDisable() {
    const success = await unsubscribe()

    if (success) {
      onNotice?.('This device will stop receiving Angel push alerts.')
      return
    }

    onError?.('This device could not be unsubscribed right now.')
  }

  async function handleSavePreferences() {
    setIsSavingPreferences(true)

    try {
      const nextState = await updateNotificationPreferences({
        enabled: appEnabled,
        quietHoursStart: quietHoursStart || null,
        quietHoursEnd: quietHoursEnd || null,
      })

      onStateChange?.(nextState)
      onNotice?.(
        appEnabled
          ? 'Angel updated your continuity alert settings.'
          : 'App-level continuity alerts are paused for now.'
      )
    } catch (cause) {
      onError?.(
        cause instanceof Error
          ? cause.message
          : 'Notification settings could not be updated right now.'
      )
    } finally {
      setIsSavingPreferences(false)
    }
  }

  const permissionCopy = getPermissionCopy(permission, Boolean(subscription))

  return (
    <Card variant="soft" className="animate-enter" padding="lg">
      <CardHeader
        title="Continuity Alerts"
        subtitle="Keep scheduled touchpoints gentle, bounded, and respectful of quiet hours."
      />

      <div className="mt-4 space-y-4">
        <div className="rounded-[1.35rem] border border-white/8 bg-background/20 p-4">
          <div className="flex items-start gap-3">
            {subscription ? (
              <BellRing className="mt-0.5 h-5 w-5 text-accent-primary" />
            ) : permission === 'denied' ? (
              <BellOff className="mt-0.5 h-5 w-5 text-text-secondary" />
            ) : (
              <Bell className="mt-0.5 h-5 w-5 text-text-secondary" />
            )}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-text-primary">
                {permissionCopy.title}
              </p>
              <p className="text-sm leading-7 text-text-secondary">
                {permissionCopy.body}
              </p>
              <div className="flex flex-wrap gap-2">
                {subscription ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="quiet"
                    isLoading={isLoading}
                    disabled={isLoading}
                    onClick={() => void handleBrowserDisable()}
                  >
                    Disable on this device
                  </Button>
                ) : permission !== 'denied' ? (
                  <Button
                    type="button"
                    size="sm"
                    isLoading={isLoading}
                    disabled={isLoading}
                    onClick={() => void handleBrowserEnable()}
                  >
                    Enable on this device
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[1.35rem] border border-white/8 bg-background/20 p-4">
          <div className="flex items-start gap-3">
            <MoonStar className="mt-0.5 h-5 w-5 text-accent-brand" />
            <div className="min-w-0 flex-1 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    App-level delivery
                  </p>
                  <p className="text-sm leading-7 text-text-secondary">
                    Browser permission only handles this device. App settings
                    decide whether Angel should try to reach you at all.
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant={appEnabled ? 'quiet' : 'brand'}
                  onClick={() => setAppEnabled((current) => !current)}
                >
                  {appEnabled ? 'Pause app alerts' : 'Allow app alerts'}
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.18em] text-text-tertiary">
                    Quiet hours start
                  </span>
                  <input
                    type="time"
                    value={quietHoursStart}
                    onChange={(event) => setQuietHoursStart(event.target.value)}
                    className="w-full rounded-[1rem] border border-white/10 bg-black/10 px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent-brand/35"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.18em] text-text-tertiary">
                    Quiet hours end
                  </span>
                  <input
                    type="time"
                    value={quietHoursEnd}
                    onChange={(event) => setQuietHoursEnd(event.target.value)}
                    className="w-full rounded-[1rem] border border-white/10 bg-black/10 px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent-brand/35"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">
                  Uses {state.notificationPreferences.timeZone}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="quiet"
                  isLoading={isSavingPreferences}
                  disabled={isSavingPreferences}
                  onClick={() => void handleSavePreferences()}
                >
                  Save settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

function getPermissionCopy(
  permission: NotificationPermission,
  hasSubscription: boolean
) {
  if (hasSubscription) {
    return {
      title: 'This device is subscribed',
      body: 'Angel can use browser push here, subject to your app-level quiet hours and delivery settings.',
    }
  }

  if (permission === 'denied') {
    return {
      title: 'Browser alerts are blocked',
      body: "Open this site's notification settings in your browser to unblock push, then come back here to subscribe again.",
    }
  }

  if (permission === 'granted') {
    return {
      title: 'Permission is granted, but this device is not subscribed',
      body: 'Enable this device so scheduled continuity touchpoints have somewhere to land.',
    }
  }

  return {
    title: 'Browser permission is still pending',
    body: 'Allow push here if you want gentle continuity reminders outside the thread.',
  }
}
