import { useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { calculateScore } from "@/lib/url-scanner/scoring"
import { ScanResult } from "@/lib/url-scanner/types"
import { supabase } from "@/integrations/supabase/client"

export type { ScanResult }

export function useUrlScanner() {
  const [isScanning, setIsScanning] = useState(false)
  const { toast } = useToast()

  const scanUrl = useCallback(async (url: string): Promise<ScanResult> => {
    setIsScanning(true)
    
    // Simulate scanning delay for UX
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Calculate threat score
    const result = calculateScore(url)
    
    // Update daily stats
    const today = new Date().toDateString()
    const stats = JSON.parse(localStorage.getItem('iurl-daily-stats') || '{}')
    
    if (!stats[today]) {
      stats[today] = { linksChecked: 0, threatsBlocked: 0 }
    }
    
    stats[today].linksChecked++
    if (!result.safe) {
      stats[today].threatsBlocked++
    }
    
    localStorage.setItem('iurl-daily-stats', JSON.stringify(stats))
    
    // Save to database if user is authenticated
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if URL already exists in history
        const { data: existing } = await supabase
          .from('scan_history')
          .select('*')
          .eq('user_id', user.id)
          .eq('url', result.url)
          .single()
        
        if (existing) {
          // Update existing record
          await supabase
            .from('scan_history')
            .update({
              scan_count: existing.scan_count + 1,
              timestamp: new Date(result.timestamp).toISOString(),
              score: result.score,
              verdict: result.verdict,
              safe: result.safe,
              reasons: result.reasons,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)
        } else {
          // Insert new record
          await supabase
            .from('scan_history')
            .insert([{
              user_id: user.id,
              url: result.url,
              score: result.score,
              verdict: result.verdict,
              safe: result.safe,
              reasons: result.reasons,
              timestamp: new Date(result.timestamp).toISOString(),
              scan_count: 1
            }])
        }
      } else {
        // Guest user - use localStorage as fallback
        const history = JSON.parse(localStorage.getItem('iurl-safe-history') || '[]')
        const existingIndex = history.findIndex((item: ScanResult & { count?: number }) => item.url === result.url)
        
        if (existingIndex >= 0) {
          history[existingIndex].count = (history[existingIndex].count || 1) + 1
          history[existingIndex].timestamp = result.timestamp
          history[existingIndex].score = result.score
          history[existingIndex].verdict = result.verdict
          const updatedItem = history.splice(existingIndex, 1)[0]
          history.unshift(updatedItem)
        } else {
          history.unshift({ ...result, count: 1 })
        }
        
        localStorage.setItem('iurl-safe-history', JSON.stringify(history.slice(0, 50)))
      }
    } catch (error) {
      console.error('Error saving to database, using localStorage:', error)
      // Fallback to localStorage on error
      const history = JSON.parse(localStorage.getItem('iurl-safe-history') || '[]')
      const existingIndex = history.findIndex((item: ScanResult & { count?: number }) => item.url === result.url)
      
      if (existingIndex >= 0) {
        history[existingIndex].count = (history[existingIndex].count || 1) + 1
        history[existingIndex].timestamp = result.timestamp
        history[existingIndex].score = result.score
        history[existingIndex].verdict = result.verdict
        const updatedItem = history.splice(existingIndex, 1)[0]
        history.unshift(updatedItem)
      } else {
        history.unshift({ ...result, count: 1 })
      }
      
      localStorage.setItem('iurl-safe-history', JSON.stringify(history.slice(0, 50)))
    }
    
    // Show toast notification
    let title: string
    let description: string
    
    if (result.verdict === 'clean') {
      title = "Link is Safe ✓"
      description = "No threats detected. Safe to open."
    } else if (result.verdict === 'suspicious') {
      title = "Suspicious Link ⚠️"
      description = `Score: ${result.score}/100. ${result.reasons[0]}`
    } else {
      title = "Threat Detected! 🛡️"
      description = `Blocked (${result.score}/100). ${result.reasons[0]}`
    }
    
    toast({
      title,
      description,
    })
    
    setIsScanning(false)
    return result
  }, [toast])

  return {
    scanUrl,
    isScanning
  }
}
