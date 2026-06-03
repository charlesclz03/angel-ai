// Service Worker for Angel AI
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? { title: 'Angel AI', body: 'New message' }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon512_maskable.png',
      badge: '/badge.png',
      data: data.url ? { url: data.url } : {},
      vibrate: [100, 50, 100],
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/chat'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If a window is already open, focus it and navigate
        for (const client of clientList) {
          if (client.url.includes('/chat') && 'focus' in client) {
            return client.focus()
          }
        }
        // If no window is open, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen)
        }
      })
  )
})
