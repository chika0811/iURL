import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import crypto from 'https://deno.land/std@0.168.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const signature = req.headers.get('x-paystack-signature')
    const body = await req.text()

    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'No signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const hash = crypto.createHmac('sha512', paystackSecretKey).update(body).digest('hex')
    if (hash !== signature) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { event, data } = JSON.parse(body)

    console.log('Received Paystack webhook:', { event, data })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (event === 'charge.success') {
      const { reference, amount, metadata } = data
      const { plan_name, user_id } = metadata

      const startDate = new Date()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 1)

      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        })
        .eq('paystack_reference', reference)

      if (error) {
        console.error('Error activating subscription:', error)
      } else {
        console.log('Subscription activated successfully for user:', user_id)
      }
    } else if (event === 'charge.failed') {
      const { reference, metadata } = data
      const { user_id } = metadata

      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'failed' })
        .eq('paystack_reference', reference)

      if (error) {
        console.error('Error updating subscription to failed:', error)
      } else {
        console.log('Subscription status updated to failed for user:', user_id)
      }
    } else {
      console.warn('Unhandled Paystack webhook event:', event)
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in handle-paystack-webhook function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
