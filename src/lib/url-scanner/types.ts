export interface ScanResult {
  url: string
  safe: boolean
  score: number // 0-100, higher = safer
  verdict: 'clean' | 'suspicious' | 'malicious'
  timestamp: number
  reasons: string[]
  factors: ScanFactors
}

export interface ScanFactors {
  allowlist: number
  threatFeed: number
  domainSimilarity: number
  certificate: number
  redirects: number
  entropy: number
  behavior: number
  c2: number
}

export interface AllowlistEntry {
  domain: string
  addedAt: number
  userAdded: boolean
}

export const THRESHOLDS = {
  CLEAN: 10, // Danger score below this is considered safe
  MALICIOUS: 60
} as const

export const WEIGHTS = {
  allowlist: 100,
  threatFeed: 30,
  domainSimilarity: 15,
  certificate: 10,
  redirects: 10,
  entropy: 10,
  behavior: 25,
  c2: 20
} as const
