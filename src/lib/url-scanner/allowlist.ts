import { AllowlistEntry } from './types'

const STORAGE_KEY = 'iurl-allowlist'

// Built-in trusted domains
const BUILTIN_ALLOWLIST = [
  'google.com', 'gmail.com', 'youtube.com', 'facebook.com', 'instagram.com',
  'twitter.com', 'x.com', 'linkedin.com', 'microsoft.com', 'apple.com',
  'amazon.com', 'netflix.com', 'spotify.com', 'github.com', 'stackoverflow.com',
  'wikipedia.org', 'reddit.com', 'tiktok.com', 'whatsapp.com', 'zoom.us',
  'paypal.com', 'stripe.com', 'dropbox.com', 'slack.com', 'discord.com',
  'chatgpt.com', 'openai.com', 'claude.ai', 'anthropic.com'
]

export function getAllowlist(): AllowlistEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const userList = stored ? JSON.parse(stored) : []
    
    // Combine built-in and user lists
    const builtinEntries: AllowlistEntry[] = BUILTIN_ALLOWLIST.map(domain => ({
      domain,
      addedAt: 0,
      userAdded: false
    }))
    
    return [...builtinEntries, ...userList]
  } catch {
    return []
  }
}

export function addToAllowlist(domain: string): void {
  const allowlist = getAllowlist().filter(e => e.userAdded)
  const normalized = normalizeDomain(domain)
  
  if (!allowlist.some(e => e.domain === normalized)) {
    allowlist.push({
      domain: normalized,
      addedAt: Date.now(),
      userAdded: true
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allowlist))
  }
}

export function removeFromAllowlist(domain: string): void {
  const allowlist = getAllowlist().filter(e => e.userAdded)
  const filtered = allowlist.filter(e => e.domain !== domain)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

export function isInAllowlist(url: string): boolean {
  try {
    const domain = new URL(url).hostname.toLowerCase()
    const allowlist = getAllowlist()
    
    return allowlist.some(entry => {
      const entryDomain = entry.domain.toLowerCase()
      return domain === entryDomain || domain.endsWith('.' + entryDomain)
    })
  } catch {
    return false
  }
}

function normalizeDomain(domain: string): string {
  try {
    const url = domain.startsWith('http') ? domain : `https://${domain}`
    return new URL(url).hostname.toLowerCase()
  } catch {
    return domain.toLowerCase()
  }
}
