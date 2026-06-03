/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope

sw.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  const title = data.title || 'Angel AI'
  const body = data.body || 'You have a new message from Angel.'
  const url = data.url || '/chat'

  event.waitUntil(
    sw.registration.showNotification(title, {
      body,
      icon: '/icon512_maskable.png',
      badge: '/icon512_maskable.png',
      data: { url },
      vibrate: [200, 100, 200],
    })
  )
})

sw.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/chat'

  event.waitUntil(
    sw.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If a window is already open, focus it and navigate
        for (const client of clientList) {
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus()
          }
        }
        // Otherwise, open a new window
        if (sw.clients.openWindow) {
          return sw.clients.openWindow(targetUrl)
        }
      })
  )
})
