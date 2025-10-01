import { useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { useDeepSeekScanner } from "@/hooks/use-deepseek-scanner"

export interface ScanResult {
  url: string
  safe: boolean
  timestamp: number
  aiAnalysis: {
    confidence: number
    threats: string[]
    reasoning: string
  }
}

export function useUrlScanner() {
  const [isScanning, setIsScanning] = useState(false)
  const { toast } = useToast()
  const { analyzeUrl, hasApiKey } = useDeepSeekScanner()

  const scanUrl = useCallback(async (url: string): Promise<ScanResult> => {
    setIsScanning(true)
    
    // Require DeepSeek API key for analysis
    if (!hasApiKey) {
      setIsScanning(false)
      toast({
        title: "DeepSeek API Key Required",
        description: "Please configure your DeepSeek API key to scan links.",
        variant: "destructive",
      })
      throw new Error("DeepSeek API key not configured")
    }
    
    try {
      const analysis = await analyzeUrl(url)
      const aiAnalysis = {
        confidence: analysis.confidence,
        threats: analysis.threats,
        reasoning: analysis.reasoning
      }
      const isSafe = analysis.isSafe
    
      const result: ScanResult = {
        url,
        safe: isSafe,
        timestamp: Date.now(),
        aiAnalysis
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
      const description = isSafe 
        ? `AI Analysis (${aiAnalysis.confidence}% confidence): ${aiAnalysis.reasoning}`
        : `Threats detected: ${aiAnalysis.threats.join(', ')}. ${aiAnalysis.reasoning}`
      
      toast({
        title: isSafe ? "Link is Safe ✓" : "Threat Detected!",
        description,
        variant: isSafe ? "default" : "destructive",
      })
      
      setIsScanning(false)
      return result
    } catch (error) {
      setIsScanning(false)
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze URL with DeepSeek AI",
        variant: "destructive",
      })
      throw error
    }
  }, [toast, analyzeUrl, hasApiKey])

  return {
    scanUrl,
    isScanning
  }
}