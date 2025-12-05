import { useEffect, useCallback } from 'react'
import { LocalNotifications } from '@capacitor/local-notifications'
import { useToast } from '@/hooks/use-toast'
import { useSubscriptionPlan } from '@/hooks/use-subscription-plan'
import { calculateScore } from '@/lib/url-scanner/scoring'

// Notification IDs
const NOTIFICATION_IDS = {
  PROTECTION_STATUS: 1,
  THREAT_ALERT: 100,
}

export function useBackgroundService() {
  const { toast } = useToast()
  const { hasBackgroundAccess, isLoading: planLoading } = useSubscriptionPlan()

  // Show threat notification
  const showThreatNotification = useCallback(async (url: string, verdict: string, score: number) => {
    try {
      if (window.Capacitor?.isNativePlatform()) {
        const notificationId = NOTIFICATION_IDS.THREAT_ALERT + Date.now() % 1000
        
        await LocalNotifications.schedule({
          notifications: [
            {
              id: notificationId,
              title: verdict === 'malicious' ? '🚨 Malicious URL Detected!' : '⚠️ Suspicious URL Detected',
              body: `Threat Score: ${100 - score}% - ${url.substring(0, 50)}${url.length > 50 ? '...' : ''}`,
              schedule: { at: new Date(Date.now() + 100) },
              sound: 'default',
              actionTypeId: 'THREAT_ACTIONS',
              extra: { url, verdict, score }
            }
          ]
        })
      }
    } catch (error) {
      console.error('Failed to show threat notification:', error)
    }
  }, [])

  // Scan URL and notify if threat detected
  const scanAndNotify = useCallback(async (url: string): Promise<boolean> => {
    try {
      const result = await calculateScore(url)
      
      if (result.verdict === 'malicious' || result.verdict === 'suspicious') {
        await showThreatNotification(url, result.verdict, result.score)
        
        // Dispatch event for UI to handle
        window.dispatchEvent(new CustomEvent('threatDetected', {
          detail: { url, result }
        }))
        
        return false // URL is not safe
      }
      
      return true // URL is safe
    } catch (error) {
      console.error('Background scan failed:', error)
      return true // Allow on error to not block user
    }
  }, [showThreatNotification])

  // Handle incoming URL from deep link or intent
  const handleIncomingUrl = useCallback(async (url: string) => {
    if (!isValidUrl(url)) return
    
    toast({
      title: "Scanning URL...",
      description: "Checking link safety"
    })
    
    const isSafe = await scanAndNotify(url)
    
    if (isSafe) {
      // Safe URL - dispatch event to open
      window.dispatchEvent(new CustomEvent('safeUrlDetected', {
        detail: { url }
      }))
      
      toast({
        title: "✓ URL is Safe",
        description: "Opening link..."
      })
    } else {
      toast({
        title: "⚠️ Threat Detected",
        description: "This URL has been blocked",
        variant: "destructive"
      })
    }
  }, [scanAndNotify, toast])

  // Set up global URL detection (deep links, intents)
  const setupGlobalUrlDetection = useCallback(async () => {
    if (!window.Capacitor?.isNativePlatform()) return

    try {
      const { App } = await import('@capacitor/app')
      
      // Listen for app URL open events (deep links)
      App.addListener('appUrlOpen', async (data) => {
        if (data.url) {
          await handleIncomingUrl(data.url)
        }
      })

      // Check if app was opened with URL
      const launchUrl = await App.getLaunchUrl()
      if (launchUrl?.url) {
        await handleIncomingUrl(launchUrl.url)
      }

      // Register notification action types
      await LocalNotifications.registerActionTypes({
        types: [
          {
            id: 'THREAT_ACTIONS',
            actions: [
              {
                id: 'VIEW_DETAILS',
                title: 'View Details'
              },
              {
                id: 'DISMISS',
                title: 'Dismiss',
                destructive: true
              }
            ]
          }
        ]
      })

    } catch (error) {
      console.error('Global URL detection setup failed:', error)
    }
  }, [handleIncomingUrl])

  // Initialize background monitoring
  const initializeBackgroundService = useCallback(async () => {
    try {
      if (window.Capacitor?.isNativePlatform()) {
        // Request notification permissions
        const permissionResult = await LocalNotifications.requestPermissions()
        
        if (permissionResult.display === 'granted') {
          // Set up periodic background URL monitoring
          await setupUrlMonitoring()
          
          // Set up global URL detection
          await setupGlobalUrlDetection()
          
          toast({
            title: "Background Protection Active",
            description: "URL monitoring and threat alerts enabled"
          })
        }
      } else {
        // Web version - use service worker for background tasks
        await setupWebBackgroundService()
      }
    } catch (error) {
      console.error('Background service initialization failed:', error)
    }
  }, [toast, setupGlobalUrlDetection])

  // Set up URL monitoring for mobile
  const setupUrlMonitoring = async () => {
    try {
      // Schedule periodic notifications to remind about protection status
      await LocalNotifications.schedule({
        notifications: [
          {
            title: "iURL Protection",
            body: "Background URL protection is active",
            id: NOTIFICATION_IDS.PROTECTION_STATUS,
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
        
        // Request notification permission for web
        if ('Notification' in window) {
          const permission = await Notification.requestPermission()
          if (permission === 'granted') {
            console.log('Web notifications enabled')
          }
        }
      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    }
  }

  // Show web notification for threat
  const showWebThreatNotification = useCallback((url: string, verdict: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(
        verdict === 'malicious' ? '🚨 Malicious URL Detected!' : '⚠️ Suspicious URL Detected',
        {
          body: `Threat detected: ${url.substring(0, 50)}${url.length > 50 ? '...' : ''}`,
          icon: '/iurl-logo.png',
          tag: 'threat-alert',
          requireInteraction: true
        }
      )
    }
  }, [])

  // Monitor clipboard for URLs with real-time detection
  const monitorClipboard = useCallback(async () => {
    try {
      let clipboardText = ''
      
      // Check if running as native app (Capacitor)
      if (window.Capacitor?.isNativePlatform()) {
        // Use Capacitor Clipboard plugin for native apps
        const { Clipboard } = await import('@capacitor/clipboard')
        const result = await Clipboard.read()
        clipboardText = result.value || ''
      } else {
        // Web version - requires user interaction due to browser security
        if (navigator.clipboard && navigator.clipboard.readText && document.hasFocus()) {
          clipboardText = await navigator.clipboard.readText()
        }
      }
      
      // Check if clipboard contains URL
      if (clipboardText && isValidUrl(clipboardText.trim())) {
        const url = clipboardText.trim()
        const savedUrls = JSON.parse(localStorage.getItem('iurl-monitored-urls') || '[]')
        const isNewUrl = !savedUrls.includes(url)
        
        if (isNewUrl) {
          // Save URL for monitoring
          savedUrls.push(url)
          localStorage.setItem('iurl-monitored-urls', JSON.stringify(savedUrls))
          
          // Auto-scan the URL in background if premium
          if (hasBackgroundAccess) {
            const result = await calculateScore(url)
            
            if (result.verdict === 'malicious' || result.verdict === 'suspicious') {
              // Show threat notification
              if (window.Capacitor?.isNativePlatform()) {
                await showThreatNotification(url, result.verdict, result.score)
              } else {
                showWebThreatNotification(url, result.verdict)
              }
              
              toast({
                title: result.verdict === 'malicious' ? "🚨 Malicious URL!" : "⚠️ Suspicious URL",
                description: "Threat detected in clipboard URL",
                variant: "destructive"
              })
            } else {
              // Auto-paste URL to input field for clean URLs
              window.dispatchEvent(new CustomEvent('clipboardUrlDetected', {
                detail: { url, result }
              }))
              
              toast({
                title: "✓ URL Scanned",
                description: "Clean URL detected in clipboard"
              })
            }
          } else {
            // Free users - just notify about detection
            window.dispatchEvent(new CustomEvent('clipboardUrlDetected', {
              detail: { url }
            }))
            
            toast({
              title: "URL Detected",
              description: "Tap to check this link with iURL"
            })
          }
        }
      }
    } catch (error) {
      // Clipboard access might be restricted, fail silently in web version
      if (window.Capacitor?.isNativePlatform()) {
        console.error('Clipboard monitoring error:', error)
      }
    }
  }, [toast, hasBackgroundAccess, showThreatNotification, showWebThreatNotification])

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
        await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_IDS.PROTECTION_STATUS }] })
        
        // Remove app URL listener
        const { App } = await import('@capacitor/app')
        App.removeAllListeners()
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
        const actionId = notification.actionId
        const extra = notification.notification.extra
        
        if (actionId === 'VIEW_DETAILS' && extra?.url) {
          // Navigate to scan details
          window.dispatchEvent(new CustomEvent('viewThreatDetails', {
            detail: { url: extra.url, verdict: extra.verdict, score: extra.score }
          }))
        } else if (actionId === 'SCAN_URL' && extra?.url) {
          // Handle URL scan request from notification
          window.dispatchEvent(new CustomEvent('scanUrlFromNotification', {
            detail: { url: extra.url }
          }))
        }
      })
    }
  }, [])

  return {
    startBackgroundProtection,
    stopBackgroundProtection,
    initializeBackgroundService,
    scanAndNotify,
    handleIncomingUrl
  }
}
