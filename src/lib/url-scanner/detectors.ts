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
    'roblox', 'ebay', 'walmart', 'target', 'chase', 'wellsfargo', 'bankofamerica',
    'aliexpress', 'wordpress', 'adobe', 'canva', 'visa', 'mastercard', 'shopify'
  ]

  try {
    const hostname = new URL(url).hostname.toLowerCase()
    // Handle domains like 'www.google.com' -> 'google'
    const domainParts = hostname.replace('www.', '').split('.')
    const domain = domainParts.length > 1 ? domainParts[0] : ''

    if (!domain) return 0

    let minDistance = Infinity
    for (const legitDomain of legitDomains) {
      const distance = levenshteinDistance(domain, legitDomain)

      // If the domain is a substring of a legit domain, it could be something like 'login-apple'
      if (legitDomain.includes(domain) && domain.length < legitDomain.length) {
        minDistance = Math.min(minDistance, 2) // Assign a moderate distance
        continue
      }

      const similarity = 1 - (distance / Math.max(domain.length, legitDomain.length))
      
      // If very similar but not an exact match, it's a high risk for typosquatting
      if (similarity > 0.8 && domain !== legitDomain) {
        minDistance = Math.min(minDistance, distance)
      }
    }

    // Convert distance to score (0-100, higher = more suspicious)
    if (minDistance === Infinity) return 0
    // Lower distance means more similar, so higher score
    return Math.min(100, (1 / (minDistance + 1)) * 150)
  } catch {
    return 0
  }
}

export function detectThreatFeed(url: string): number {
  const urlLower = url.toLowerCase()
  
  // Suspicious TLDs commonly used for phishing and malware
  const suspiciousTlds = [
    '.tk', '.ml', '.ga', 'cf', '.xyz', '.top', '.click', '.download', '.ru',
    '.biz', '.info', '.loan', '.work', '.gq', '.fit', '.buzz', '.monster'
  ]
  if (suspiciousTlds.some(tld => urlLower.endsWith(tld))) {
    return 75
  }

  // Known malware patterns
  const malwareKeywords = ['malware', 'virus', 'trojan', 'keylogger', 'rootkit', 'spyware', 'ransomware', 'botnet']
  if (malwareKeywords.some(keyword => urlLower.includes(keyword))) {
    return 100
  }

  // Phishing patterns targeting user credentials
  const phishingPatterns = [
    'verify-account', 'suspended-account', 'confirm-identity', 'urgent-action',
    'login-support', 'account-update', 'secure-login', 'login-required',
    'signin', 'log-in', 'account-verification', 'password-reset', 'confirm-payment'
  ]
  if (phishingPatterns.some(pattern => urlLower.includes(pattern))) {
    return 80
  }

  return 0
}

export function detectC2Links(url: string): number {
  try {
    const urlObj = new URL(url)
    const port = parseInt(urlObj.port, 10)
    const path = urlObj.pathname.toLowerCase()

    // C2 servers often use non-standard, high-numbered ports
    if (!isNaN(port) && (port > 1024 && port < 10000 || port > 40000)) {
      if (port === 8080 || port === 8443) return 30 // Common proxy ports, less suspicious
      return 80
    }

    // Common C2 path patterns
    const c2Paths = [
      '/gate.php', '/handler.php', '/api.php', '/remote', '/payload', '/bot',
      '/data', '/update', '/config', '/c2', '/beacon'
    ]
    if (c2Paths.some(c2Path => path.includes(c2Path))) {
      return 90
    }

    // Look for file extensions not typically found in legitimate web traffic
    if (path.endsWith('.ps1') || path.endsWith('.sh') || path.endsWith('.dat')) {
      return 100
    }

    return 0
  } catch {
    return 0
  }
}

export function detectCertificate(url: string): number {
  // NOTE: This function can only perform basic checks based on the URL string.
  // It CANNOT verify the actual SSL certificate for expiration, self-signing, or mismatched domains.
  // A real implementation would require a backend service to perform a live TLS handshake.
  try {
    const urlObj = new URL(url)
    
    // Non-HTTPS for sensitive operations is a major red flag
    if (urlObj.protocol === 'http:' && 
        (url.includes('login') || url.includes('payment') || url.includes('bank') || url.includes('signin'))) {
      return 100
    }

    // All other HTTP URLs are still a risk
    if (urlObj.protocol === 'http:') {
      return 40
    }

    // Mixed content (HTTPS page with HTTP resources in params) is a flag
    if (urlObj.protocol === 'https:' && url.includes('http://')) {
      return 40
    }

    return 0
  } catch {
    return 50 // Invalid URL structure
  }
}

export function detectRedirects(url: string): number {
  // URL shorteners can be used to mask malicious destinations
  const shorteners = [
    'bit.ly', 'tinyurl', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'short.link', 'tiny.cc',
    'rebrand.ly', 'buff.ly', 'shorte.st', 'adf.ly', 'bc.vc', 'cutt.ly', 'tiny.one'
  ]
  
  if (shorteners.some(shortener => new URL(url).hostname.includes(shortener))) {
    return 60 // Moderate suspicion - common but can hide threats
  }

  return 0
}

export function detectEntropy(url: string): number {
  try {
    const urlObj = new URL(url)
    const path = urlObj.pathname + urlObj.search
    const hostname = urlObj.hostname
    
    // Long random strings in path or hostname are highly suspicious
    if (/[a-z0-9]{30,}/.test(path) || /[a-z0-9-]{40,}/.test(hostname)) {
      return 90
    }

    // Calculate entropy of the entire URL string (hostname + path)
    const fullUrl = hostname + path
    const chars: Record<string, number> = {}
    for (const char of fullUrl) {
      chars[char] = (chars[char] || 0) + 1
    }

    let entropy = 0
    const len = fullUrl.length
    for (const count of Object.values(chars)) {
      const p = count / len
      entropy -= p * Math.log2(p)
    }

    // Normalize entropy (typical URL entropy is 2-4, random is >4.5)
    if (entropy > 4.5) return 75
    if (entropy > 4) return 40
    
    return 0
  } catch {
    return 0
  }
}

export function detectBehavior(url: string): number {
  const urlLower = url.toLowerCase()
  
  // Malicious file extensions that may trigger downloads
  const malwareExtensions = ['.exe', '.scr', '.bat', '.pif', '.vbs', '.cmd', '.msi', '.jar']
  if (malwareExtensions.some(ext => urlLower.endsWith(ext))) {
    return 100
  }

  // Keywords suggesting a forced or automatic download
  const forceDownloadKeywords = ['force-download', 'auto-download', 'direct-download']
  if (forceDownloadKeywords.some(keyword => urlLower.includes(keyword))) {
    return 90
  }

  // Scam keywords covering a wider range of fraudulent activities
  const scamKeywords = [
    'winner', 'prize', 'lottery', 'free-iphone', 'free-money', 'congratulations',
    'get-rich-quick', 'urgent', 'expire-today', 'act-now', 'claim-your',
    'exclusive-deal', 'limited-time', 'investment', 'high-return', 'guaranteed-return',
    'crypto-giveaway', 'free-trial', 'miracle-cure', 'unrealistic-discount',
    'celebrity-endorsed', 'fake-shopping', 'deal-too-good'
  ]
  if (scamKeywords.some(keyword => urlLower.includes(keyword))) {
    return 85
  }

  // NSFW/Gambling/Piracy keywords
  const nsfwKeywords = [
    'porn', 'xxx', 'adult', 'casino', 'gambling', 'betting', 'poker',
    'cracked', 'warez', 'pirated-movie', 'free-software-download'
  ]
  if (nsfwKeywords.some(keyword => urlLower.includes(keyword))) {
    return 70
  }

  // Suspicious parameters
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname

    // Raw IP address instead of a domain name is a classic red flag
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
      return 90
    }

    const params = urlObj.searchParams
    
    if (params.size > 10 && params.toString().length > 200) return 60
    
    const sensitiveParams = ['password', 'pwd', 'pass', 'token', 'auth', 'key', 'secret', 'sessionid']
    for (const [key, value] of params.entries()) {
      if (sensitiveParams.some(s => key.toLowerCase().includes(s))) {
        return 75
      }
      // Check for suspicious values, like another URL which indicates a redirect
      if (value.toLowerCase().includes('http://') || value.toLowerCase().includes('https://')) {
        return 80
      }
      // Check for encoded data which might hide malicious scripts
      if (/%[0-9a-f]{2}/i.test(value)) {
        try {
          const decodedValue = decodeURIComponent(value)
          if (decodedValue.includes('<script>') || decodedValue.includes('javascript:')) {
            return 100 // High confidence of XSS
          }
        } catch (e) {
          // Decoding failed, could be malformed, which is suspicious
          return 60
        }
      }
    }
  } catch {
    // Invalid URL structure is suspicious in itself
    return 50
  }

  return 0
}
