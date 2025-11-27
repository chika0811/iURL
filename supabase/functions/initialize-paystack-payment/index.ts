import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Validation schema
const paymentSchema = z.object({
  planName: z.enum(['Premium', 'Business'], { 
    errorMap: () => ({ message: 'Plan name must be either Premium or Business' })
  }),
  amount: z.number()
    .positive({ message: 'Amount must be positive' })
    .max(1000000, { message: 'Amount exceeds maximum allowed value' }),
  email: z.string()
    .email({ message: 'Invalid email format' })
    .max(255, { message: 'Email must be less than 255 characters' }),
  currency: z.enum(['NGN', 'USD', 'GHS', 'KES', 'ZAR'], {
    errorMap: () => ({ message: 'Invalid currency code' })
  })
})

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()

    // Validate input
    const validationResult = paymentSchema.safeParse(body)
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.format())
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input data',
          details: validationResult.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { planName, amount, email, currency } = validationResult.data

    console.log('Initializing payment for:', { planName, amount, email, currency })

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user ID from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize payment with Paystack
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')
    const paystackPublicKey = Deno.env.get('PAYSTACK_PUBLIC_KEY')
    
    if (!paystackSecretKey || !paystackPublicKey) {
      return new Response(
        JSON.stringify({ error: 'Paystack keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        amount: Math.round(amount * 100), // Convert to kobo/cents
        currency: currency,
        metadata: {
          plan_name: planName,
          user_id: user.id,
          original_currency: currency,
        },
        callback_url: `${req.headers.get('origin')}/payment-status`,
      }),
    })

    const data = await response.json()
    console.log('Paystack initialization response:', data)

    if (!data.status) {
      return new Response(
        JSON.stringify({ error: 'Payment initialization failed', details: data }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create pending subscription record
    const { error: insertError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan_name: planName,
        amount: amount,
        paystack_reference: data.data.reference,
        status: 'pending',
      })

    if (insertError) {
      console.error('Error creating pending subscription:', insertError)
      return new Response(
        JSON.stringify({ error: 'Could not create a pending subscription', details: insertError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        authorization_url: data.data.authorization_url,
        access_code: data.data.access_code,
        reference: data.data.reference,
        public_key: paystackPublicKey,
        amount: Math.round(amount * 100), // Return amount in kobo for inline checkout
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in initialize-paystack-payment function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
