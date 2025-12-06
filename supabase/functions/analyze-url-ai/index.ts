import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Zod schema for URL validation
const urlSchema = z.object({
  url: z.string()
    .min(1, 'URL is required')
    .max(2048, 'URL must be less than 2048 characters')
    .refine((url) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    }, 'Invalid URL format')
});

// Simple in-memory rate limiter by IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per IP

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // Clean up old entries periodically
  if (rateLimitMap.size > 10000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetTime < now) {
        rateLimitMap.delete(key);
      }
    }
  }

  if (!record || record.resetTime < now) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count++;
  return { allowed: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get client IP for rate limiting
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || req.headers.get('x-real-ip') 
    || 'unknown';

  // Check rate limit
  const rateLimitResult = checkRateLimit(clientIP);
  if (!rateLimitResult.allowed) {
    console.log(`Rate limit exceeded for IP: ${clientIP}`);
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
      { 
        status: 429, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': String(rateLimitResult.retryAfter || 60)
        } 
      }
    );
  }

  try {
    const body = await req.json();
    
    // Validate input with Zod
    const validationResult = urlSchema.safeParse(body);
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors[0]?.message || 'Invalid input';
      console.log(`Validation failed for IP ${clientIP}: ${errorMessage}`);
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { url } = validationResult.data;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      console.error('Configuration Error: No AI API keys found');
      throw new Error('AI API key not configured');
    }

    console.log(`Analyzing URL for IP ${clientIP}: ${url.substring(0, 100)}...`);

    let aiText = '{}';
    let response;

    const systemPrompt = `Analyze this URL for security threats. Check for phishing, malware, scams, typosquatting, suspicious patterns, and any malicious indicators. Provide a risk score from 0-100 (0=safe, 100=dangerous) and a brief reason.

URL: ${url}

Respond ONLY in this JSON format:
{
  "riskScore": <number 0-100>,
  "reason": "<brief explanation>",
  "threats": ["<threat1>", "<threat2>"]
}`;

    // Simple retry mechanism for robustness
    let retries = 2;
    while (retries >= 0) {
      try {
        console.log(`Connecting to Lovable AI... (Attempts left: ${retries})`);

        // Using 'gpt-4o' for the strongest available analysis via the gateway
        response = await fetch(
          'https://ai.gateway.lovable.dev/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages: [{
                role: 'user',
                content: systemPrompt
              }],
              temperature: 0.1, // Lower temperature for more consistent JSON
              max_tokens: 300
            })
          }
        );

        if (response.ok) break;

        // Log failure but continue if retries left
        const statusText = await response.clone().text();
        console.warn(`Attempt failed: ${response.status} - ${statusText}`);

        if (response.status === 400 || response.status === 401 || response.status === 403) {
          // Don't retry client errors or auth errors
          break;
        }

      } catch (e) {
        console.warn('Network attempt failed:', e);
      }
      
      retries--;
      if (retries >= 0) await new Promise(r => setTimeout(r, 1000)); // Wait 1s before retry
    }

    if (!response || !response.ok) {
      const errorText = response ? await response.text() : 'Network Error';
      console.error('AI service fatal error:', response?.status, errorText);

      throw new Error(`AI analysis failed after retries: ${response?.status || 'Unknown'}`);
    }

    const data = await response.json();
    aiText = data.choices?.[0]?.message?.content || '{}';
    
    // Robust parsing
    let aiResult;
    try {
      // Clean up markdown code blocks if present (common with LLMs)
      const cleanJson = aiText.replace(/```json\n?|\n?```/g, '').trim();
      aiResult = JSON.parse(cleanJson);
    } catch (e) {
      // Fallback regex extraction
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          aiResult = JSON.parse(jsonMatch[0]);
        } catch (e2) {
          console.error('Failed to parse AI response:', aiText);
          aiResult = { riskScore: 0, reason: 'Analysis parsing error', threats: [] };
        }
      } else {
        console.error('No JSON found in AI response:', aiText);
        aiResult = { riskScore: 0, reason: 'Analysis format error', threats: [] };
      }
    }

    console.log(`Analysis complete for IP ${clientIP}: riskScore=${aiResult.riskScore}`);

    return new Response(
      JSON.stringify(aiResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-url-ai:', error);
    return new Response(
      JSON.stringify({ error: 'Analysis failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
