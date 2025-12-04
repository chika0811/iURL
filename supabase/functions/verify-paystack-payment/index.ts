import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Validation schema for payment reference
const verifySchema = z.object({
  reference: z.string()
    .min(1, { message: 'Reference is required' })
    .max(100, { message: 'Reference too long' })
    .regex(/^[a-zA-Z0-9_-]+$/, { message: 'Invalid reference format' })
})

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()

    // Validate input
    const validationResult = verifySchema.safeParse(body)
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

    const { reference } = validationResult.data

    console.log('Verifying payment with reference:', reference)

    // Verify payment with Paystack
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
        },
      }
    )

    const verifyData = await verifyResponse.json()
    console.log('Paystack verification response:', verifyData)

    if (!verifyData.status || verifyData.data.status !== 'success') {
      return new Response(
        JSON.stringify({ error: 'Payment verification failed', details: verifyData }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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

    // Extract plan details from metadata
    const metadata = verifyData.data.metadata
    const planName = metadata.plan_name
    const amount = verifyData.data.amount / 100 // Convert from kobo to naira (or cents to dollars)

    // Calculate subscription dates
    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1) // 1 month subscription

    // Update or create subscription record
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('paystack_reference', reference)
      .single()

    let subscriptionId: string

    if (existingSubscription) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        })
        .eq('id', existingSubscription.id)

      if (updateError) {
        console.error('Error updating subscription:', updateError)
        throw updateError
      }
      subscriptionId = existingSubscription.id
    } else {
      // Create new subscription
      const { data: newSub, error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan_name: planName,
          amount: amount,
          paystack_reference: reference,
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating subscription:', insertError)
        throw insertError
      }
      subscriptionId = newSub.id
    }

    // Record payment
    const paymentData = verifyData.data
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        subscription_id: subscriptionId,
        amount: amount,
        currency: paymentData.currency || 'NGN',
        paystack_reference: reference,
        status: 'success',
        payment_method: paymentData.channel,
        metadata: paymentData
      })

    if (paymentError) {
      console.error('Error recording payment:', paymentError)
    }

    // Send activation email
    try {
      await supabase.functions.invoke('send-subscription-email', {
        body: {
          to: user.email,
          type: 'activated',
          subscriptionDetails: {
            planName: planName,
            amount: amount,
            endDate: endDate.toISOString()
          }
        }
      })
      console.log('Activation email sent to:', user.email)
    } catch (emailError) {
      console.error('Error sending activation email:', emailError)
      // Don't fail the payment if email fails
    }

    console.log('Subscription activated successfully for user:', user.id)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment verified and subscription activated',
        subscription: {
          plan_name: planName,
          amount: amount,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in verify-paystack-payment function:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
