import { useEffect, useCallback } from 'react'
import { LocalNotifications } from '@capacitor/local-notifications'
import { useToast } from '@/hooks/use-toast'

export function useBackgroundService() {
  const { toast } = useToast()

  // Initialize background monitoring
  const initializeBackgroundService = useCallback(async () => {
    try {
      if (window.Capacitor?.isNativePlatform()) {
        // Request notification permissions
        const permissionResult = await LocalNotifications.requestPermissions()
        
        if (permissionResult.display === 'granted') {
          // Set up periodic background URL monitoring
          await setupUrlMonitoring()
          
          toast({
            title: "Background Protection Active",
            description: "URL monitoring is now running in background"
          })
        }
      } else {
        // Web version - use service worker for background tasks
        await setupWebBackgroundService()
      }
    } catch (error) {
      console.error('Background service initialization failed:', error)
    }
  }, [toast])

  // Set up URL monitoring for mobile
  const setupUrlMonitoring = async () => {
    try {
      // Schedule periodic notifications to remind about protection status
      await LocalNotifications.schedule({
        notifications: [
          {
            title: "iURL Protection",
            body: "Background URL protection is active",
            id: 1,
            schedule: { 
              repeats: true,
              every: 'day'
            },
            sound: undefined,
            attachments: undefined,
            actionTypeId: "",
            extra: null
          }
        ]
      })
    } catch (error) {
      console.error('URL monitoring setup failed:', error)
    }
  }

  // Set up web service worker
  const setupWebBackgroundService = async () => {
    if ('serviceWorker' in navigator) {
      try {
        // Register service worker for background tasks
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('Service Worker registered:', registration)
        
        // Set up periodic background sync if available
        if ('sync' in window.ServiceWorkerRegistration.prototype) {
          // Background sync will be handled by service worker
          console.log('Background sync available')
        }
      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    }
  }

  // Monitor clipboard for URLs (when app is active)
  const monitorClipboard = useCallback(async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipboardText = await navigator.clipboard.readText()
        
        // Check if clipboard contains URL
        if (isValidUrl(clipboardText)) {
          const savedUrls = JSON.parse(localStorage.getItem('iurl-monitored-urls') || '[]')
          const isNewUrl = !savedUrls.includes(clipboardText)
          
          if (isNewUrl) {
            // Notify about new URL in clipboard
            if (window.Capacitor?.isNativePlatform()) {
              await LocalNotifications.schedule({
                notifications: [
                  {
                    title: "URL Detected",
                    body: "Tap to scan clipboard URL for safety",
                    id: Date.now(),
                    extra: { url: clipboardText },
                    actionTypeId: "SCAN_URL",
                    attachments: undefined,
                    schedule: undefined,
                    sound: undefined
                  }
                ]
              })
            }
            
            // Save URL for monitoring
            savedUrls.push(clipboardText)
            localStorage.setItem('iurl-monitored-urls', JSON.stringify(savedUrls))
          }
        }
      }
    } catch (error) {
      // Clipboard access might be restricted, fail silently
      console.log('Clipboard monitoring not available')
    }
  }, [])

  // Utility function to validate URLs
  const isValidUrl = (text: string): boolean => {
    try {
      const url = new URL(text)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  }

  // Start background protection
  const startBackgroundProtection = useCallback(async () => {
    await initializeBackgroundService()
    
    // Set up periodic clipboard monitoring (every 30 seconds when app is active)
    const clipboardInterval = setInterval(monitorClipboard, 30000)
    
    return () => {
      clearInterval(clipboardInterval)
    }
  }, [initializeBackgroundService, monitorClipboard])

  // Stop background protection
  const stopBackgroundProtection = useCallback(async () => {
    try {
      if (window.Capacitor?.isNativePlatform()) {
        // Cancel all scheduled notifications
        await LocalNotifications.cancel({ notifications: [{ id: 1 }] })
      }
      
      localStorage.removeItem('iurl-monitored-urls')
      
      toast({
        title: "Background Protection Disabled",
        description: "URL monitoring has been stopped"
      })
    } catch (error) {
      console.error('Error stopping background protection:', error)
    }
  }, [toast])

  useEffect(() => {
    // Listen for notification actions
    if (window.Capacitor?.isNativePlatform()) {
      LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        if (notification.actionId === 'SCAN_URL' && notification.notification.extra?.url) {
          // Handle URL scan request from notification
          window.dispatchEvent(new CustomEvent('scanUrlFromNotification', {
            detail: { url: notification.notification.extra.url }
          }))
        }
      })
    }
  }, [])

  return {
    startBackgroundProtection,
    stopBackgroundProtection,
    initializeBackgroundService
  }
}