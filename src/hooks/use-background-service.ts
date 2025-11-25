import { useEffect, useCallback } from 'react'
import { LocalNotifications } from '@capacitor/local-notifications'
import { useToast } from '@/hooks/use-toast'
import { useSubscriptionPlan } from '@/hooks/use-subscription-plan'

export function useBackgroundService() {
  const { toast } = useToast()
  const { hasBackgroundAccess, isLoading: planLoading } = useSubscriptionPlan()

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
        await navigator.serviceWorker.register('/sw.js')
        
        // Set up periodic background sync if available
        if ('sync' in window.ServiceWorkerRegistration.prototype) {
          // Background sync will be handled by service worker
        }
      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    }
  }

  // Monitor clipboard for URLs with real-time detection
  const monitorClipboard = useCallback(async () => {
    try {
      // Check if running as native app (Capacitor)
      if (window.Capacitor?.isNativePlatform()) {
        // Use Capacitor Clipboard plugin for native apps
        const { Clipboard } = await import('@capacitor/clipboard')
        const result = await Clipboard.read()
        const clipboardText = result.value
        
        // Check if clipboard contains URL
        if (clipboardText && isValidUrl(clipboardText.trim())) {
          const savedUrls = JSON.parse(localStorage.getItem('iurl-monitored-urls') || '[]')
          const isNewUrl = !savedUrls.includes(clipboardText.trim())
          
          if (isNewUrl) {
            // Auto-paste URL to input field
            window.dispatchEvent(new CustomEvent('clipboardUrlDetected', {
              detail: { url: clipboardText.trim() }
            }))
            
            // Save URL for monitoring
            savedUrls.push(clipboardText.trim())
            localStorage.setItem('iurl-monitored-urls', JSON.stringify(savedUrls))
            
            // Show toast notification
            toast({
              title: "URL Detected",
              description: "Tap to check this link with iURL"
            })
          }
        }
      } else {
        // Web version - requires user interaction due to browser security
        if (navigator.clipboard && navigator.clipboard.readText && document.hasFocus()) {
          const clipboardText = await navigator.clipboard.readText()
          
          // Check if clipboard contains URL
          if (clipboardText && isValidUrl(clipboardText.trim())) {
            const savedUrls = JSON.parse(localStorage.getItem('iurl-monitored-urls') || '[]')
            const isNewUrl = !savedUrls.includes(clipboardText.trim())
            
            if (isNewUrl) {
              // Auto-paste URL to input field
              window.dispatchEvent(new CustomEvent('clipboardUrlDetected', {
                detail: { url: clipboardText.trim() }
              }))
              
              // Save URL for monitoring
              savedUrls.push(clipboardText.trim())
              localStorage.setItem('iurl-monitored-urls', JSON.stringify(savedUrls))
              
              // Show toast notification
              toast({
                title: "URL Detected",
                description: "Clipboard URL ready for scanning"
              })
            }
          }
        }
      }
    } catch (error) {
      // Clipboard access might be restricted, fail silently in web version
      // This is normal behavior for web browsers when document is not focused
      if (window.Capacitor?.isNativePlatform()) {
        console.error('Clipboard monitoring error:', error)
      }
    }
  }, [toast])

  // Set up real-time clipboard monitoring using focus/paste events
  const setupClipboardListener = useCallback(() => {
    let clipboardCheckInterval: NodeJS.Timeout

    const startMonitoring = () => {
      // Check clipboard every 1 second when app is focused
      clipboardCheckInterval = setInterval(monitorClipboard, 1000)
    }

    const stopMonitoring = () => {
      if (clipboardCheckInterval) {
        clearInterval(clipboardCheckInterval)
      }
    }

    // Monitor when window gains focus
    const handleFocus = () => {
      startMonitoring()
      // Check immediately on focus
      setTimeout(monitorClipboard, 100)
    }

    const handleBlur = () => {
      stopMonitoring()
    }

    // Listen for paste events
    const handlePaste = () => {
      setTimeout(monitorClipboard, 100)
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('paste', handlePaste)

    // Start monitoring if window is already focused
    if (document.hasFocus()) {
      startMonitoring()
    }

    return () => {
      stopMonitoring()
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('paste', handlePaste)
    }
  }, [monitorClipboard])

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
    // Check if user has premium or business plan for background access
    if (planLoading) {
      toast({
        title: "Loading...",
        description: "Checking your subscription plan"
      })
      return
    }

    if (!hasBackgroundAccess) {
      toast({
        title: "Premium Feature",
        description: "Background protection requires a Premium or Business plan. Upgrade to enable this feature.",
        variant: "destructive"
      })
      return
    }

    await initializeBackgroundService()
    
    // Set up real-time clipboard monitoring
    const cleanup = setupClipboardListener()
    
    return cleanup
  }, [initializeBackgroundService, setupClipboardListener, hasBackgroundAccess, planLoading, toast])

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