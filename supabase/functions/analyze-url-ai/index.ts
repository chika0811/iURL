import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    // Call Gemini AI to analyze the URL
    // Using gemini-1.5-flash for better stability and performance
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analyze this URL for security threats. Check for phishing, malware, scams, typosquatting, suspicious patterns, and any malicious indicators. Provide a risk score from 0-100 (0=safe, 100=dangerous) and a brief reason.

URL: ${url}

Respond ONLY in this JSON format:
{
  "riskScore": <number 0-100>,
  "reason": "<brief explanation>",
  "threats": ["<threat1>", "<threat2>"]
}`
            }]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 200
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error('AI analysis failed');
    }

    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    // Parse AI response
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    const aiResult = jsonMatch ? JSON.parse(jsonMatch[0]) : { riskScore: 0, reason: 'No analysis', threats: [] };

    return new Response(
      JSON.stringify(aiResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-url-ai:', error);
    return new Response(
      JSON.stringify({ error: 'Analysis failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
