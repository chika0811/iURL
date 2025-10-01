import { useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { useDeepSeekScanner } from "@/hooks/use-deepseek-scanner"

export interface ScanResult {
  url: string
  safe: boolean
  timestamp: number
  aiAnalysis?: {
    confidence: number
    threats: string[]
    reasoning: string
  }
}

// Helper function for phishing detection
const detectPhishing = (url: string): boolean => {
      // Typosquatting patterns
      const legitDomains = ['facebook', 'google', 'paypal', 'amazon', 'microsoft', 'apple', 'netflix', 'instagram', 'twitter', 'linkedin', 'gmail', 'yahoo', 'outlook']
      const typoPatterns = [
        // Character substitution (0 for o, 1 for l, etc.)
        /faceb00k|g00gle|paypa1|amaz0n|micr0soft|app1e|netf1ix|1nstagram|twitt3r|1inkedin|gmai1|yah00|0utlook/,
        // Extra characters
        /facebookk|googlle|paypall|amazonn|microsoftt|applee|netflixx|instagramm|twitterr|linkedinn/,
        // Missing characters
        /faceboo|gogle|paypa|amazo|microsofi|appl|netfli|instagra|twiter|linkedi/,
        // Different TLDs for known brands
        /facebook\.(tk|ml|ga|cf|xyz|top|click|download)/,
        /paypal\.(tk|ml|ga|cf|xyz|top|click|download)/,
        /google\.(tk|ml|ga|cf|xyz|top|click|download)/
      ]
      
      // Check for typosquatting
      if (typoPatterns.some(pattern => pattern.test(url))) return true
      
      // Suspicious domain endings for popular services
      const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.xyz', '.top', '.click', '.download', '.review', '.stream', '.science', '.faith', '.win', '.bid', '.loan']
      if (suspiciousTlds.some(tld => url.includes(tld))) {
        // Check if trying to mimic legitimate services
        if (legitDomains.some(domain => url.includes(domain))) return true
      }
      
      // Long random character strings - only flag if truly random (no meaningful patterns)
      if (/[a-z0-9]{30,}/.test(url) && !/\w+\.(com|org|net|edu|gov|mil)/.test(url)) return true
      
      // Fake login patterns
      const loginPatterns = ['login', 'signin', 'auth', 'verify', 'secure', 'account', 'update', 'confirm', 'validation']
      if (loginPatterns.some(pattern => url.includes(pattern)) && 
          (url.includes('fake') || url.includes('phish') || /[0-9]{8,}/.test(url))) return true
      
      return false
    }
    
// Helper function for malware detection
const detectMalware = (url: string): boolean => {
      // File download patterns - only suspicious executables
      const malwareExtensions = ['.exe', '.scr', '.bat', '.pif', '.vbs']
      if (malwareExtensions.some(ext => url.endsWith(ext))) return true
      
      // Only flag shortened URLs if they contain obvious malware indicators
      const shorteners = ['bit.ly', 'tinyurl', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly', 'short.link', 'tiny.cc']
      const hasShortenedUrl = shorteners.some(shortener => url.includes(shortener))
      if (hasShortenedUrl && (url.includes('malware') || url.includes('virus') || url.includes('trojan'))) return true
      
      // Force download patterns
      if (url.includes('download') && (url.includes('force') || url.includes('auto') || url.includes('direct'))) return true
      
      // Malware keywords
      const malwareKeywords = ['malware', 'virus', 'trojan', 'keylogger', 'rootkit', 'spyware', 'backdoor', 'worm', 'ransomware']
      if (malwareKeywords.some(keyword => url.includes(keyword))) return true
      
      return false
    }
    
// Helper function for scam detection
const detectScam = (url: string): boolean => {
      // Too good to be true patterns
      const scamKeywords = [
        'you-won', 'winner', 'congratulations', 'prize', 'lottery', 'million-dollar',
        'free-iphone', 'free-money', 'get-rich', 'easy-money', 'work-from-home',
        'miracle-cure', 'lose-weight-fast', 'click-here-now', 'limited-time',
        'act-now', 'urgent', 'expire-today', 'last-chance', 'exclusive-offer',
        'guaranteed-results', 'no-risk', 'secret-method', 'insider-info',
        'make-money-fast', 'investment-opportunity', 'high-returns', 'risk-free',
        'double-your-money', 'financial-freedom', 'passive-income',
        'free-trial-no-card', 'cracked-software', 'free-premium', 'unlock-features'
      ]
      
      if (scamKeywords.some(keyword => url.includes(keyword.replace('-', '')))) return true
      
      // Fake shopping indicators
      const fakeShopPatterns = [
        /\d+%-off/, // Large percentage discounts
        /90%-discount|95%-discount|99%-discount/,
        /everything-free|all-free/,
        /luxury-.*-cheap|designer-.*-wholesale/
      ]
      if (fakeShopPatterns.some(pattern => pattern.test(url))) return true
      
      return false
    }
    
// Helper function for NSFW detection
const detectNSFW = (url: string): boolean => {
      const nsfwKeywords = [
        'porn', 'xxx', 'adult', 'sex', 'nude', 'naked', 'erotic', 'cam', 'escort',
        'casino', 'gambling', 'poker', 'slots', 'betting', 'lottery',
        'pirated', 'torrent', 'cracked', 'keygen', 'serial', 'patch', 'warez',
        'movies-free', 'watch-free', 'stream-free', 'download-movies'
      ]
      
      return nsfwKeywords.some(keyword => url.includes(keyword))
    }
    
// Helper function for suspicious parameters detection
const detectSuspiciousParams = (url: string): boolean => {
      try {
        const urlObj = new URL(url)
        const params = urlObj.searchParams
        
        // Check for excessively long parameter values (potential data exfiltration)
        for (const [key, value] of params) {
          if (value.length > 100 && /[a-f0-9]{32,}/.test(value)) return true // Potential token stealing
          if (['redirect', 'return', 'callback'].includes(key.toLowerCase()) && 
              !value.startsWith(urlObj.origin)) return true // Suspicious redirects
        }
        
        // Check for sensitive parameter names
        const sensitiveParams = ['password', 'pwd', 'pass', 'token', 'auth', 'key', 'secret', 'session', 'cookie']
        if (sensitiveParams.some(param => Array.from(params.keys()).join('').toLowerCase().includes(param))) return true
        
        // Too many parameters (potential data harvesting) - increased threshold
        if (params.size > 20) return true
        
      } catch (e) {
        return false
      }
      
      return false
    }
    
// Helper function for suspicious domain detection
const detectSuspiciousDomain = (url: string): boolean => {
      try {
        const urlObj = new URL(url)
        const hostname = urlObj.hostname.toLowerCase()
        
        // IP address instead of domain name - only flag private IPs or suspicious patterns
        if (/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|127\.)/.test(hostname)) return true
        
        // Excessive subdomains
        const subdomains = hostname.split('.')
        if (subdomains.length > 4) return true
        
        // Random character domains - only flag if truly random and suspicious
        if (/^[a-z0-9]{15,}\./.test(hostname) && !hostname.includes('amazonaws') && !hostname.includes('cloudfront')) return true
        
        // Non-HTTPS for sensitive operations
        if (urlObj.protocol === 'http:' && 
            (url.includes('login') || url.includes('payment') || url.includes('bank'))) return true
        
        // Suspicious TLDs for brand impersonation - only truly suspicious ones
        const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf']
        if (suspiciousTLDs.some(tld => hostname.endsWith(tld))) return true
        
        return false
      } catch (e) {
        return true // Invalid URL
      }
    }

// Main threat detection function
const detectThreats = (url: string): boolean => {
      const urlLower = url.toLowerCase()
      
      // 1. Phishing Detection
      if (detectPhishing(urlLower)) return true
      
      // 2. Malware/Spyware Detection
      if (detectMalware(urlLower)) return true
      
      // 3. Scam/Fraud Detection
      if (detectScam(urlLower)) return true
      
      // 4. Adult/NSFW/Illegal Content
      if (detectNSFW(urlLower)) return true
      
      // 5. Suspicious Parameters
      if (detectSuspiciousParams(url)) return true
      
      // 6. Domain Analysis
      if (detectSuspiciousDomain(urlLower)) return true
      
      return false
    }

export function useUrlScanner() {
  const [isScanning, setIsScanning] = useState(false)
  const { toast } = useToast()
  const { analyzeUrl, hasApiKey } = useDeepSeekScanner()

  const scanUrl = useCallback(async (url: string): Promise<ScanResult> => {
    setIsScanning(true)
    
    let aiAnalysis
    let isSafe = true
    
    // Try AI analysis first if API key is available
    if (hasApiKey) {
      try {
        const analysis = await analyzeUrl(url)
        aiAnalysis = {
          confidence: analysis.confidence,
          threats: analysis.threats,
          reasoning: analysis.reasoning
        }
        isSafe = analysis.isSafe
      } catch (error) {
        console.error('AI analysis failed, falling back to rule-based detection:', error)
        // Fall back to rule-based detection if AI fails
        isSafe = !detectThreats(url)
      }
    } else {
      // Use rule-based detection if no API key
      isSafe = !detectThreats(url)
    }
    
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
      ? aiAnalysis 
        ? `AI Analysis (${aiAnalysis.confidence}% confidence): ${aiAnalysis.reasoning}`
        : "This link is legitimate and safe to open."
      : aiAnalysis
        ? `Threats detected: ${aiAnalysis.threats.join(', ')}. ${aiAnalysis.reasoning}`
        : "This link appears to be malicious and has been blocked."
    
    toast({
      title: isSafe ? "Link is Safe ✓" : "Threat Detected!",
      description,
      variant: isSafe ? "default" : "destructive",
    })
    
    setIsScanning(false)
    return result
  }, [toast, analyzeUrl, hasApiKey])

  return {
    scanUrl,
    isScanning
  }
}