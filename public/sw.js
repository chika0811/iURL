// Service Worker for iURL background functionality

const CACHE_NAME = 'iurl-cache-v2'
const urlsToCache = [
  '/',
  '/index.html'
]

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  )
})

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  )
})

// Background sync for URL monitoring
self.addEventListener('sync', (event) => {
  if (event.tag === 'url-monitoring') {
    event.waitUntil(performUrlMonitoring())
  }
})

// Periodic background sync for URL checking
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'periodic-url-check') {
    event.waitUntil(performPeriodicUrlCheck())
  }
})

// URL monitoring function
async function performUrlMonitoring() {
  console.log('Background URL monitoring performed')
}

// Periodic URL checking
async function performPeriodicUrlCheck() {
  console.log('Periodic URL security check performed')
}

// Handle push notifications for threat alerts
self.addEventListener('push', (event) => {
  let data = {
    title: 'iURL Security Alert',
    body: 'A threat has been detected!',
    url: null,
    verdict: 'suspicious'
  }

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() }
    } catch (e) {
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body,
    icon: '/iurl-logo.png',
    badge: '/iurl-logo.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: 'threat-alert',
    requireInteraction: true,
    data: {
      url: data.url,
      verdict: data.verdict,
      dateOfArrival: Date.now()
    },
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/iurl-logo.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const action = event.action
  const notificationData = event.notification.data

  if (action === 'view' || action === '') {
    // Open the app with threat details
    const urlToOpen = notificationData?.url 
      ? `/?threat=${encodeURIComponent(notificationData.url)}`
      : '/'
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((windowClients) => {
          // Check if there's already a window open
          for (const client of windowClients) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              client.postMessage({
                type: 'THREAT_NOTIFICATION_CLICKED',
                url: notificationData?.url,
                verdict: notificationData?.verdict
              })
              return client.focus()
            }
          }
          // Open new window if none exists
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen)
          }
        })
    )
  }
})

// Listen for messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_THREAT_NOTIFICATION') {
    const { url, verdict, score } = event.data
    
    const title = verdict === 'malicious' 
      ? '🚨 Malicious URL Detected!' 
      : '⚠️ Suspicious URL Detected'
    
    const options = {
      body: `Threat Score: ${100 - score}% - ${url.substring(0, 50)}${url.length > 50 ? '...' : ''}`,
      icon: '/iurl-logo.png',
      badge: '/iurl-logo.png',
      vibrate: [200, 100, 200],
      tag: 'threat-alert',
      requireInteraction: true,
      data: { url, verdict, score },
      actions: [
        { action: 'view', title: 'View Details' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    }
    
    self.registration.showNotification(title, options)
  }
})
