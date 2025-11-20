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
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // Update daily stats
        const today = new Date().toISOString().split('T')[0]
        
        const { data: existingStats } = await supabase
          .from('daily_stats')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('date', today)
          .single()

        if (existingStats) {
          await supabase
            .from('daily_stats')
            .update({
              links_checked: existingStats.links_checked + 1,
              threats_blocked: existingStats.threats_blocked + (result.safe ? 0 : 1)
            })
            .eq('id', existingStats.id)
        } else {
          await supabase
            .from('daily_stats')
            .insert({
              user_id: session.user.id,
              date: today,
              links_checked: 1,
              threats_blocked: result.safe ? 0 : 1
            })
        }

        // Save to history
        const { data: existing } = await supabase
          .from('scan_history')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('url', result.url)
          .single()

        if (existing) {
          await supabase
            .from('scan_history')
            .update({
              score: result.score,
              verdict: result.verdict,
              safe: result.safe,
              reasons: result.reasons,
              timestamp: new Date().toISOString(),
              scan_count: existing.scan_count + 1
            })
            .eq('id', existing.id)
        } else {
          await supabase
            .from('scan_history')
            .insert({
              user_id: session.user.id,
              url: result.url,
              score: result.score,
              verdict: result.verdict,
              safe: result.safe,
              reasons: result.reasons,
              timestamp: new Date().toISOString(),
              scan_count: 1
            })
        }
      }
    } catch (error) {
      console.error('Error saving scan data:', error)
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
