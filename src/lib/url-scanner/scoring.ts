import { ScanFactors, ScanResult, THRESHOLDS, WEIGHTS } from './types'
import { isInAllowlist } from './allowlist'
import {
  detectDomainSimilarity,
  detectThreatFeed,
  detectCertificate,
  detectRedirects,
  detectEntropy,
  detectBehavior
} from './detectors'

export function calculateScore(url: string): ScanResult {
  // Step 1: Check allowlist first
  if (isInAllowlist(url)) {
    return {
      url,
      safe: true,
      score: 0,
      verdict: 'clean',
      timestamp: Date.now(),
      reasons: ['Domain is in allowlist'],
      factors: {
        allowlist: 0,
        threatFeed: 0,
        domainSimilarity: 0,
        certificate: 0,
        redirects: 0,
        entropy: 0,
        behavior: 0
      }
    }
  }

  // Step 2: Run all detectors
  const factors: ScanFactors = {
    allowlist: 0,
    threatFeed: detectThreatFeed(url),
    domainSimilarity: detectDomainSimilarity(url),
    certificate: detectCertificate(url),
    redirects: detectRedirects(url),
    entropy: detectEntropy(url),
    behavior: detectBehavior(url)
  }

  // Step 3: Calculate weighted score
  const contributions = {
    threatFeed: WEIGHTS.threatFeed * (factors.threatFeed / 100),
    domainSimilarity: WEIGHTS.domainSimilarity * (factors.domainSimilarity / 100),
    certificate: WEIGHTS.certificate * (factors.certificate / 100),
    redirects: WEIGHTS.redirects * (factors.redirects / 100),
    entropy: WEIGHTS.entropy * (factors.entropy / 100),
    behavior: WEIGHTS.behavior * (factors.behavior / 100)
  }

  const totalContribution = Object.values(contributions).reduce((sum, val) => sum + val, 0)
  const totalWeight = WEIGHTS.threatFeed + WEIGHTS.domainSimilarity + 
                     WEIGHTS.certificate + WEIGHTS.redirects + 
                     WEIGHTS.entropy + WEIGHTS.behavior

  const score = (totalContribution / totalWeight) * 100

  // Step 4: Determine verdict
  let verdict: 'clean' | 'suspicious' | 'malicious'
  if (score <= THRESHOLDS.CLEAN) {
    verdict = 'clean'
  } else if (score < THRESHOLDS.MALICIOUS) {
    verdict = 'suspicious'
  } else {
    verdict = 'malicious'
  }

  // Step 5: Generate human-readable reasons
  const reasons = generateReasons(factors, contributions)

  return {
    url,
    safe: verdict === 'clean',
    score: Math.round(score),
    verdict,
    timestamp: Date.now(),
    reasons,
    factors
  }
}

function generateReasons(factors: ScanFactors, contributions: Record<string, number>): string[] {
  const reasons: string[] = []

  if (contributions.threatFeed > 5) {
    if (factors.threatFeed >= 80) {
      reasons.push('Known malicious patterns detected')
    } else {
      reasons.push('Suspicious domain characteristics')
    }
  }

  if (contributions.domainSimilarity > 3) {
    reasons.push('Domain resembles trusted site (possible typosquatting)')
  }

  if (contributions.certificate > 2) {
    reasons.push('Insecure connection (HTTP) for sensitive operations')
  }

  if (contributions.redirects > 2) {
    reasons.push('URL shortener detected (may hide destination)')
  }

  if (contributions.entropy > 2) {
    reasons.push('Unusual URL structure with random characters')
  }

  if (contributions.behavior > 5) {
    if (factors.behavior >= 90) {
      reasons.push('Malicious file download detected')
    } else if (factors.behavior >= 70) {
      reasons.push('Suspicious behavior patterns (scam/phishing indicators)')
    } else {
      reasons.push('Questionable content indicators')
    }
  }

  if (reasons.length === 0) {
    reasons.push('No threats detected')
  }

  return reasons
}
