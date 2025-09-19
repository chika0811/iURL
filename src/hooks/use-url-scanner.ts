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
      
      // Long random character strings
      if (/[a-z0-9]{20,}/.test(url)) return true
      
      // Fake login patterns
      const loginPatterns = ['login', 'signin', 'auth', 'verify', 'secure', 'account', 'update', 'confirm', 'validation']
      if (loginPatterns.some(pattern => url.includes(pattern)) && 
          (url.includes('fake') || url.includes('phish') || /[0-9]{8,}/.test(url))) return true
      
      return false
    }
    
    const detectMalware = (url: string): boolean => {
      // File download patterns
      const malwareExtensions = ['.exe', '.scr', '.bat', '.com', '.pif', '.vbs', '.js', '.jar', '.apk', '.dmg', '.pkg']
      if (malwareExtensions.some(ext => url.includes(ext))) return true
      
      // Shortened URL services (potential malware redirects)
      const shorteners = ['bit.ly', 'tinyurl', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly', 'short.link', 'tiny.cc']
      if (shorteners.some(shortener => url.includes(shortener))) return true
      
      // Force download patterns
      if (url.includes('download') && (url.includes('force') || url.includes('auto') || url.includes('direct'))) return true
      
      // Malware keywords
      const malwareKeywords = ['malware', 'virus', 'trojan', 'keylogger', 'rootkit', 'spyware', 'backdoor', 'worm', 'ransomware']
      if (malwareKeywords.some(keyword => url.includes(keyword))) return true
      
      return false
    }
    
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
    
    const detectNSFW = (url: string): boolean => {
      const nsfwKeywords = [
        'porn', 'xxx', 'adult', 'sex', 'nude', 'naked', 'erotic', 'cam', 'escort',
        'casino', 'gambling', 'poker', 'slots', 'betting', 'lottery',
        'pirated', 'torrent', 'cracked', 'keygen', 'serial', 'patch', 'warez',
        'movies-free', 'watch-free', 'stream-free', 'download-movies'
      ]
      
      return nsfwKeywords.some(keyword => url.includes(keyword))
    }
    
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
        
        // Too many parameters (potential data harvesting)
        if (params.size > 10) return true
        
      } catch (e) {
        return false
      }
      
      return false
    }
    
    const detectSuspiciousDomain = (url: string): boolean => {
      try {
        const urlObj = new URL(url)
        const hostname = urlObj.hostname.toLowerCase()
        
        // IP address instead of domain name
        if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return true
        
        // Excessive subdomains
        const subdomains = hostname.split('.')
        if (subdomains.length > 4) return true
        
        // Random character domains
        if (/^[a-z0-9]{8,}\./.test(hostname)) return true
        
        // Non-HTTPS for sensitive operations
        if (urlObj.protocol === 'http:' && 
            (url.includes('login') || url.includes('payment') || url.includes('bank'))) return true
        
        // Suspicious TLDs for brand impersonation
        const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.xyz', '.top', '.click', '.download', '.review', '.stream', '.science', '.faith', '.win', '.bid', '.loan', '.ru', '.su']
        if (suspiciousTLDs.some(tld => hostname.endsWith(tld))) return true
        
        return false
      } catch (e) {
        return true // Invalid URL
      }
    }
    
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
    
    // Comprehensive threat detection
    const isSafe = !detectThreats(url)
    
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