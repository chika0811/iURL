import { ScanFactors, ScanResult, THRESHOLDS, WEIGHTS } from './types'
import { isInAllowlist } from './allowlist'
import {
  detectDomainSimilarity,
  detectThreatFeed,
  detectCertificate,
  detectRedirects,
  detectEntropy,
  detectBehavior,
  detectC2Links
} from './detectors'
import { supabase } from '@/integrations/supabase/client'

async function getAIAnalysis(url: string): Promise<{ riskScore: number; reason: string; threats: string[] }> {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-url-ai', {
      body: { url }
    });
    
    if (error) throw error;
    return data || { riskScore: 0, reason: '', threats: [] };
  } catch {
    return { riskScore: 0, reason: '', threats: [] };
  }
}

export async function calculateScore(url: string): Promise<ScanResult> {
  // Step 1: Check allowlist first for immediate safety confirmation
  if (isInAllowlist(url)) {
    return {
      url,
      safe: true,
      score: 100, // A 100% safe score for allowlisted domains
      verdict: 'clean',
      timestamp: Date.now(),
      reasons: ['This domain is on your trusted list.'],
      factors: {
        allowlist: 1, // Indicate allowlist was hit
        threatFeed: 0,
        domainSimilarity: 0,
        certificate: 0,
        redirects: 0,
        entropy: 0,
        behavior: 0,
        c2: 0
      }
    }
  }

  // Step 2: Run all detectors to gather risk factors (including AI analysis)
  const aiAnalysis = await getAIAnalysis(url);
  
  const factors: ScanFactors = {
    allowlist: 0,
    threatFeed: detectThreatFeed(url),
    domainSimilarity: detectDomainSimilarity(url),
    certificate: detectCertificate(url),
    redirects: detectRedirects(url),
    entropy: detectEntropy(url),
    behavior: detectBehavior(url),
    c2: detectC2Links(url)
  }

  // Step 3: Calculate a weighted "danger score"
  const contributions = {
    threatFeed: WEIGHTS.threatFeed * (factors.threatFeed / 100),
    domainSimilarity: WEIGHTS.domainSimilarity * (factors.domainSimilarity / 100),
    certificate: WEIGHTS.certificate * (factors.certificate / 100),
    redirects: WEIGHTS.redirects * (factors.redirects / 100),
    entropy: WEIGHTS.entropy * (factors.entropy / 100),
    behavior: WEIGHTS.behavior * (factors.behavior / 100),
    c2: WEIGHTS.c2 * (factors.c2 / 100)
  }

  const totalContribution = Object.values(contributions).reduce((sum, val) => sum + val, 0)
  const totalWeight = Object.values(WEIGHTS).reduce((sum, val) => sum + val, 0) - WEIGHTS.allowlist

  let dangerScore = Math.min(100, (totalContribution / totalWeight) * 100)
  
  // Blend AI analysis with detector score (60% detectors, 40% AI)
  dangerScore = (dangerScore * 0.6) + (aiAnalysis.riskScore * 0.4)

  // Step 4: Invert the danger score to get a "safety score"
  const safetyScore = 100 - dangerScore

  // Step 5: Determine the verdict based on the danger score
  let verdict: 'clean' | 'suspicious' | 'malicious'
  if (dangerScore <= THRESHOLDS.CLEAN) {
    verdict = 'clean'
  } else if (dangerScore < THRESHOLDS.MALICIOUS) {
    verdict = 'suspicious'
  } else {
    verdict = 'malicious'
  }

  // Step 6: Generate human-readable reasons for the score
  const reasons = generateReasons(factors, contributions, verdict, aiAnalysis)

  return {
    url,
    safe: verdict === 'clean',
    score: Math.round(safetyScore),
    verdict,
    timestamp: Date.now(),
    reasons,
    factors
  }
}

function generateReasons(
  factors: ScanFactors,
  contributions: Record<string, number>,
  verdict: 'clean' | 'suspicious' | 'malicious',
  aiAnalysis: { riskScore: number; reason: string; threats: string[] }
): string[] {
  const reasons: string[] = []

  if (verdict === 'clean') {
    reasons.push('This link appears to be safe.')
    if (aiAnalysis.reason) reasons.push(`AI: ${aiAnalysis.reason}`)
    return reasons
  }
  
  // Add AI insights first if available
  if (aiAnalysis.reason && aiAnalysis.riskScore > 30) {
    reasons.push(`AI: ${aiAnalysis.reason}`)
  }
  if (aiAnalysis.threats.length > 0) {
    aiAnalysis.threats.slice(0, 2).forEach(threat => reasons.push(`⚠️ ${threat}`))
  }

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

  if (contributions.c2 > 5) {
    reasons.push('URL matches patterns of Command & Control (C2) servers')
  }

  if (reasons.length === 0) {
    reasons.push('No threats detected')
  }

  return reasons
}
