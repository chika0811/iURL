import { useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"

export interface ScanResult {
  url: string
  safe: boolean
  timestamp: number
}

export function useUrlScanner() {
  const [isScanning, setIsScanning] = useState(false)
  const { toast } = useToast()

  const scanUrl = useCallback(async (url: string): Promise<ScanResult> => {
    setIsScanning(true)
    
    // Simulate URL scanning with delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Simple URL safety check (in real app, this would use security APIs)
    const dangerousPatterns = [
      'phishing', 'malware', 'scam', 'virus', 'trojan',
      'suspicious', 'hack', 'steal', 'fraud', 'fake'
    ]
    
    const isSafe = !dangerousPatterns.some(pattern => 
      url.toLowerCase().includes(pattern)
    )
    
    const result: ScanResult = {
      url,
      safe: isSafe,
      timestamp: Date.now()
    }
    
    // Update daily stats
    const today = new Date().toDateString()
    const stats = JSON.parse(localStorage.getItem('iurl-daily-stats') || '{}')
    
    if (!stats[today]) {
      stats[today] = { linksChecked: 0, threatsBlocked: 0 }
    }
    
    stats[today].linksChecked++
    if (!isSafe) {
      stats[today].threatsBlocked++
    }
    
    localStorage.setItem('iurl-daily-stats', JSON.stringify(stats))
    
      // Save to history if safe
      if (result.safe) {
        const history = JSON.parse(localStorage.getItem('iurl-safe-history') || '[]')
        const existingIndex = history.findIndex((item: ScanResult & { count?: number }) => item.url === result.url)
        
        if (existingIndex >= 0) {
          // Update count and move to top
          history[existingIndex].count = (history[existingIndex].count || 1) + 1
          history[existingIndex].timestamp = result.timestamp
          const updatedItem = history.splice(existingIndex, 1)[0]
          history.unshift(updatedItem)
        } else {
          // Add new item with count 1
          history.unshift({ ...result, count: 1 })
        }
        
        localStorage.setItem('iurl-safe-history', JSON.stringify(history.slice(0, 50))) // Keep last 50
      }
    
    // Show toast notification
    toast({
      title: isSafe ? "Link is Safe" : "Threat Detected!",
      description: isSafe 
        ? "This link is legitimate and safe to open."
        : "This link appears to be malicious and has been blocked.",
      variant: isSafe ? "default" : "destructive",
    })
    
    setIsScanning(false)
    return result
  }, [toast])

  return {
    scanUrl,
    isScanning
  }
}