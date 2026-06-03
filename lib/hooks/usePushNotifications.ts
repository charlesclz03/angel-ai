'use client'

import { useState, useCallback, useEffect } from 'react'

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  )
  const [permission, setPermission] =
    useState<NotificationPermission>('default')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      setPermission(Notification.permission)

      void navigator.serviceWorker.ready
        .then((registration) => registration.pushManager.getSubscription())
        .then((currentSubscription) => {
          if (isMounted) {
            setSubscription(currentSubscription)
          }
        })
        .catch(() => {
          if (isMounted) {
            setSubscription(null)
          }
        })
    }

    return () => {
      isMounted = false
    }
  }, [])

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      return null
    }

    try {
      setIsLoading(true)
      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult)

      if (permissionResult !== 'granted') {
        console.warn('Notification permission not granted.')
        return null
      }

      const registration = await navigator.serviceWorker.ready

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        throw new Error('Missing VAPID Public Key')
      }

      // urlBase64ToUint8Array logic
      const padding = '='.repeat((4 - (vapidPublicKey.length % 4)) % 4)
      const base64 = (vapidPublicKey + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/')
      const rawData = window.atob(base64)
      const outputArray = new Uint8Array(rawData.length)
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
      }

      const existingSubscription =
        await registration.pushManager.getSubscription()
      const pushSubscription =
        existingSubscription ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: outputArray,
        }))

      setSubscription(pushSubscription)

      // Sync with our backend
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pushSubscription),
      })

      return pushSubscription
    } catch (error) {
      console.error('Failed to subscribe the user: ', error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  const unsubscribe = useCallback(async () => {
    if (!isSupported) {
      return false
    }

    try {
      setIsLoading(true)
      const registration = await navigator.serviceWorker.ready
      const currentSubscription =
        subscription ?? (await registration.pushManager.getSubscription())

      if (!currentSubscription) {
        setSubscription(null)
        return true
      }

      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: currentSubscription.endpoint,
        }),
      })

      await currentSubscription.unsubscribe()
      setSubscription(null)
      return true
    } catch (error) {
      console.error('Failed to unsubscribe the user: ', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, subscription])

  return {
    isSupported,
    permission,
    subscription,
    isLoading,
    subscribe,
    unsubscribe,
  }
}
