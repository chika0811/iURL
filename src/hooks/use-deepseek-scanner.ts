import { useState } from "react"

export interface DeepSeekAnalysis {
  isSafe: boolean
  confidence: number
  threats: string[]
  reasoning: string
}

export function useDeepSeekScanner() {
  const [apiKey, setApiKey] = useState<string>(
    localStorage.getItem('deepseek-api-key') || ''
  )

  const saveApiKey = (key: string) => {
    localStorage.setItem('deepseek-api-key', key)
    setApiKey(key)
  }

  const analyzeUrl = async (url: string): Promise<DeepSeekAnalysis> => {
    if (!apiKey) {
      throw new Error("DeepSeek API key not configured")
    }

    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `You are an expert cybersecurity analyst specializing in URL threat detection. Analyze URLs for:
- Phishing attempts (typosquatting, fake login pages, brand impersonation)
- Malware distribution (suspicious file downloads, exploit kits)
- Scams (fake prizes, too-good-to-be-true offers, investment fraud)
- NSFW content (adult content, gambling, piracy)
- Suspicious patterns (data exfiltration, unusual redirects, suspicious domains)

Return ONLY a valid JSON object with this exact structure:
{
  "isSafe": boolean,
  "confidence": number (0-100),
  "threats": ["threat1", "threat2"],
  "reasoning": "brief explanation"
}`
            },
            {
              role: 'user',
              content: `Analyze this URL for security threats: ${url}`
            }
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      })

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new Error("No response from DeepSeek API")
      }

      // Parse the JSON response
      const analysis = JSON.parse(content) as DeepSeekAnalysis

      return analysis
    } catch (error) {
      console.error('DeepSeek analysis error:', error)
      throw error
    }
  }

  return {
    analyzeUrl,
    apiKey,
    saveApiKey,
    hasApiKey: !!apiKey
  }
}
