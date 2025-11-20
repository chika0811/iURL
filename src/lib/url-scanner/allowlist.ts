import { AllowlistEntry } from './types'
import { supabase } from '@/integrations/supabase/client'

// Built-in trusted domains
const BUILTIN_ALLOWLIST = [
  'google.com', 'gmail.com', 'youtube.com', 'facebook.com', 'instagram.com',
  'twitter.com', 'x.com', 'linkedin.com', 'microsoft.com', 'apple.com',
  'amazon.com', 'netflix.com', 'spotify.com', 'github.com', 'stackoverflow.com',
  'wikipedia.org', 'reddit.com', 'tiktok.com', 'whatsapp.com', 'zoom.us',
  'paypal.com', 'stripe.com', 'dropbox.com', 'slack.com', 'discord.com',
  'chatgpt.com', 'openai.com', 'claude.ai', 'anthropic.com'
]

export async function getAllowlist(): Promise<AllowlistEntry[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    // Built-in entries
    const builtinEntries: AllowlistEntry[] = BUILTIN_ALLOWLIST.map(domain => ({
      domain,
      addedAt: 0,
      userAdded: false
    }))
    
    if (!session) {
      return builtinEntries
    }

    // Get user's custom domains
    const { data, error } = await supabase
      .from('allowlist')
      .select('*')
      .eq('user_id', session.user.id)

    if (error) throw error

    const userEntries: AllowlistEntry[] = (data || []).map(item => ({
      domain: item.domain,
      addedAt: new Date(item.added_at).getTime(),
      userAdded: true
    }))
    
    return [...builtinEntries, ...userEntries]
  } catch (error) {
    console.error('Error loading allowlist:', error)
    // Return built-in only on error
    return BUILTIN_ALLOWLIST.map(domain => ({
      domain,
      addedAt: 0,
      userAdded: false
    }))
  }
}

export async function addToAllowlist(domain: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const normalized = normalizeDomain(domain)
  
  const { error } = await supabase
    .from('allowlist')
    .insert({
      user_id: session.user.id,
      domain: normalized,
      added_at: new Date().toISOString()
    })

  if (error && error.code !== '23505') { // Ignore duplicate errors
    throw error
  }
}

export async function removeFromAllowlist(domain: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('allowlist')
    .delete()
    .eq('user_id', session.user.id)
    .eq('domain', domain)

  if (error) throw error
}

export async function isInAllowlist(url: string): Promise<boolean> {
  try {
    const domain = new URL(url).hostname.toLowerCase()
    const allowlist = await getAllowlist()
    
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
