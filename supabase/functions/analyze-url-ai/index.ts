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
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    if (!LOVABLE_API_KEY && !GEMINI_API_KEY) {
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

    // Prefer GEMINI_API_KEY if available (direct connection)
    if (GEMINI_API_KEY) {
      console.log('Using direct Gemini API connection');
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: systemPrompt }]
            }],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        }
      );
    } else {
      console.log('Using Lovable Gateway connection');
      // Fallback to Lovable Gateway
      // Using 'gpt-4o-mini' as a standard model name that is widely supported by gateways
      // This is safer than specific provider prefixes if the gateway abstracts them
      response = await fetch(
        'https://ai.gateway.lovable.dev/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{
              role: 'user',
              content: systemPrompt
            }],
            temperature: 0.2,
            max_tokens: 200
          })
        }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI service error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'AI service rate limited. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service unavailable. Please try again later.' }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI analysis failed: ${response.status} - ${errorText.substring(0, 100)}`);
    }

    const data = await response.json();

    // Parse AI response based on provider
    if (GEMINI_API_KEY) {
      aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    } else {
      aiText = data.choices?.[0]?.message?.content || '{}';
    }
    
    // Parse AI response
    let aiResult;
    try {
      // Try to parse simply first
      aiResult = JSON.parse(aiText);
    } catch (e) {
      // If simple parse fails, try to extract JSON from markdown block
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
