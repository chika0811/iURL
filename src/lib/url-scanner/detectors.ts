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
    'outlook', 'github', 'spotify', 'reddit'
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
  const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.xyz', '.top', '.click', '.download']
  if (suspiciousTlds.some(tld => urlLower.includes(tld))) {
    return 70
  }

  // Known malware patterns
  const malwareKeywords = ['malware', 'virus', 'trojan', 'keylogger', 'rootkit', 'spyware', 'ransomware']
  if (malwareKeywords.some(keyword => urlLower.includes(keyword))) {
    return 100
  }

  // Phishing patterns
  const phishingPatterns = ['verify-account', 'suspended-account', 'confirm-identity', 'urgent-action']
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

    return 0
  } catch {
    return 50
  }
}

export function detectRedirects(url: string): number {
  // URL shortener detection
  const shorteners = ['bit.ly', 'tinyurl', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'short.link', 'tiny.cc']
  
  if (shorteners.some(shortener => url.includes(shortener))) {
    return 60 // Moderate suspicion - common but can hide threats
  }

  return 0
}

export function detectEntropy(url: string): number {
  try {
    const urlObj = new URL(url)
    const path = urlObj.pathname + urlObj.search
    
    // Long random strings
    if (/[a-z0-9]{30,}/.test(path)) {
      return 80
    }

    // Calculate entropy of path
    const chars: Record<string, number> = {}
    for (const char of path) {
      chars[char] = (chars[char] || 0) + 1
    }

    let entropy = 0
    for (const count of Object.values(chars)) {
      const p = count / path.length
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
    'get-rich', 'urgent', 'expire-today', 'act-now'
  ]
  if (scamKeywords.some(keyword => urlLower.includes(keyword))) {
    return 85
  }

  // NSFW/Gambling
  const nsfwKeywords = ['porn', 'xxx', 'adult', 'casino', 'gambling', 'betting']
  if (nsfwKeywords.some(keyword => urlLower.includes(keyword))) {
    return 70
  }

  // Suspicious parameters
  try {
    const urlObj = new URL(url)
    const params = urlObj.searchParams
    
    if (params.size > 20) return 60
    
    const sensitiveParams = ['password', 'pwd', 'pass', 'token', 'auth', 'key', 'secret']
    for (const param of params.keys()) {
      if (sensitiveParams.some(s => param.toLowerCase().includes(s))) {
        return 70
      }
    }
  } catch {
    // Invalid URL
    return 50
  }

  return 0
}
