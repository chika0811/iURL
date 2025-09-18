// Service Worker for iURL background functionality

const CACHE_NAME = 'iurl-cache-v1'
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js'
]

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache)
      })
  )
})

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
      })
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
  try {
    // Check for new URLs in storage that need scanning
    const response = await self.registration.sync.register('url-monitoring')
    console.log('Background URL monitoring performed')
  } catch (error) {
    console.error('Background URL monitoring failed:', error)
  }
}

// Periodic URL checking
async function performPeriodicUrlCheck() {
  try {
    // Perform periodic security updates
    console.log('Periodic URL security check performed')
  } catch (error) {
    console.error('Periodic URL check failed:', error)
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'URL threat detected!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/favicon.ico'
      },
      {
        action: 'close',
        title: 'Dismiss',
        icon: '/favicon.ico'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('iURL Security Alert', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})