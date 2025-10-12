// Levenshtein distance for typosquatting detection
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

export function detectDomainSimilarity(url: string): number {
  const legitDomains = [
    'facebook', 'google', 'paypal', 'amazon', 'microsoft', 'apple', 
    'netflix', 'instagram', 'twitter', 'linkedin', 'gmail', 'yahoo', 
    'outlook', 'github', 'spotify', 'reddit', 'twitch', 'discord',
    'roblox', 'ebay', 'walmart', 'target', 'chase', 'wellsfargo', 'bankofamerica'
  ]

  try {
    const hostname = new URL(url).hostname.toLowerCase()
    const domain = hostname.split('.')[0]

    let minDistance = Infinity
    for (const legitDomain of legitDomains) {
      const distance = levenshteinDistance(domain, legitDomain)
      const similarity = 1 - (distance / Math.max(domain.length, legitDomain.length))
      
      // If very similar but not exact match, it's typosquatting
      if (similarity > 0.7 && domain !== legitDomain) {
        minDistance = Math.min(minDistance, distance)
      }
    }

    // Convert distance to score (0-100, higher = more suspicious)
    if (minDistance === Infinity) return 0
    return Math.min(100, (1 / (minDistance + 1)) * 100)
  } catch {
    return 0
  }
}

export function detectThreatFeed(url: string): number {
  const urlLower = url.toLowerCase()
  
  // Suspicious TLDs commonly used for phishing
  const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.xyz', '.top', '.click', '.download', '.ru', '.biz', '.info', '.loan', '.work']
  if (suspiciousTlds.some(tld => urlLower.endsWith(tld))) {
    return 70
  }

  // Known malware patterns
  const malwareKeywords = ['malware', 'virus', 'trojan', 'keylogger', 'rootkit', 'spyware', 'ransomware']
  if (malwareKeywords.some(keyword => urlLower.includes(keyword))) {
    return 100
  }

  // Phishing patterns
  const phishingPatterns = [
    'verify-account', 'suspended-account', 'confirm-identity', 'urgent-action',
    'login-support', 'account-update', 'secure-login', 'login-required'
  ]
  if (phishingPatterns.some(pattern => urlLower.includes(pattern))) {
    return 80
  }

  return 0
}

export function detectCertificate(url: string): number {
  try {
    const urlObj = new URL(url)
    
    // Non-HTTPS for sensitive operations
    if (urlObj.protocol === 'http:' && 
        (url.includes('login') || url.includes('payment') || url.includes('bank'))) {
      return 100
    }

    // All other HTTP
    if (urlObj.protocol === 'http:') {
      return 30
    }

    // Mixed content (HTTPS page with HTTP resources) is a flag, though hard to detect from URL alone.
    // This is a simplified check. A real implementation would need to inspect page content.
    if (urlObj.protocol === 'https:' && url.includes('http://')) {
      return 40
    }

    return 0
  } catch {
    return 50 // Invalid URL structure
  }
}

export function detectRedirects(url: string): number {
  // URL shortener detection
  const shorteners = [
    'bit.ly', 'tinyurl', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'short.link', 'tiny.cc',
    'rebrand.ly', 'buff.ly', 'shorte.st', 'adf.ly', 'bc.vc'
  ]
  
  if (shorteners.some(shortener => url.includes(shortener))) {
    return 60 // Moderate suspicion - common but can hide threats
  }

  return 0
}

export function detectEntropy(url: string): number {
  try {
    const urlObj = new URL(url)
    const path = urlObj.pathname + urlObj.search
    const hostname = urlObj.hostname
    
    // Long random strings in path or hostname
    if (/[a-z0-9]{30,}/.test(path) || /[a-z0-9-]{30,}/.test(hostname)) {
      return 90
    }

    // Calculate entropy of the entire URL string
    const fullUrl = url.replace(/^https?:\/\//, '')
    const chars: Record<string, number> = {}
    for (const char of fullUrl) {
      chars[char] = (chars[char] || 0) + 1
    }

    let entropy = 0
    for (const count of Object.values(chars)) {
      const p = count / fullUrl.length
      entropy -= p * Math.log2(p)
    }

    // Normalize entropy (typical URL entropy is 2-4, random is 4-5)
    if (entropy > 4.5) return 70
    if (entropy > 4) return 40
    
    return 0
  } catch {
    return 0
  }
}

export function detectBehavior(url: string): number {
  const urlLower = url.toLowerCase()
  
  // Malicious file extensions
  const malwareExtensions = ['.exe', '.scr', '.bat', '.pif', '.vbs', '.cmd']
  if (malwareExtensions.some(ext => urlLower.endsWith(ext))) {
    return 100
  }

  // Force download patterns
  if (url.includes('download') && (url.includes('force') || url.includes('auto') || url.includes('direct'))) {
    return 90
  }

  // Scam keywords
  const scamKeywords = [
    'winner', 'prize', 'lottery', 'free-iphone', 'free-money', 
    'get-rich', 'urgent', 'expire-today', 'act-now', 'congratulations',
    'claim-your', 'exclusive-deal', 'limited-time', 'investment', 'high-return',
    'crypto-giveaway', 'free-trial', 'miracle-cure', 'unrealistic-discount'
  ]
  if (scamKeywords.some(keyword => urlLower.includes(keyword))) {
    return 85
  }

  // NSFW/Gambling/Piracy
  const nsfwKeywords = ['porn', 'xxx', 'adult', 'casino', 'gambling', 'betting', 'cracked', 'warez', 'pirated']
  if (nsfwKeywords.some(keyword => urlLower.includes(keyword))) {
    return 70
  }

  // Suspicious parameters
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname

    // Raw IP address instead of domain
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
      return 90
    }

    const params = urlObj.searchParams
    
    if (params.size > 20) return 60
    
    const sensitiveParams = ['password', 'pwd', 'pass', 'token', 'auth', 'key', 'secret']
    for (const [key, value] of params.entries()) {
      if (sensitiveParams.some(s => key.toLowerCase().includes(s))) {
        return 70
      }
      // Check for suspicious values, e.g., redirecting to another URL
      if (value.toLowerCase().includes('http://') || value.toLowerCase().includes('https://')) {
        return 80
      }
    }
  } catch {
    // Invalid URL
    return 50
  }

  return 0
}
