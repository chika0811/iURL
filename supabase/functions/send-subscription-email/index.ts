import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0"
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const resend = new Resend(Deno.env.get("RESEND_API_KEY"))

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Validation schema
const emailSchema = z.object({
  to: z.string()
    .email({ message: 'Invalid email format' })
    .max(255, { message: 'Email must be less than 255 characters' }),
  type: z.enum(['activated', 'expiring', 'cancelled'], {
    errorMap: () => ({ message: 'Type must be activated, expiring, or cancelled' })
  }),
  subscriptionDetails: z.object({
    planName: z.string()
      .min(1, { message: 'Plan name is required' })
      .max(50, { message: 'Plan name must be less than 50 characters' }),
    amount: z.number()
      .positive({ message: 'Amount must be positive' }),
    endDate: z.string().optional()
  })
})

interface EmailRequest {
  to: string
  type: 'activated' | 'expiring' | 'cancelled'
  subscriptionDetails: {
    planName: string
    amount: number
    endDate?: string
  }
}

const getEmailContent = (type: string, details: { planName: string; amount: number; endDate?: string }) => {
  switch (type) {
    case 'activated':
      return {
        subject: '🎉 Your iURL Subscription is Active!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #0080ff;">Subscription Activated!</h1>
            <p>Great news! Your <strong>${details.planName}</strong> subscription has been successfully activated.</p>
            <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Plan:</strong> ${details.planName}</p>
              <p><strong>Amount:</strong> ₦${details.amount}</p>
              ${details.endDate ? `<p><strong>Valid Until:</strong> ${details.endDate}</p>` : ''}
            </div>
            <p>You now have full access to all premium features. Start protecting your links today!</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">Best regards,<br>The iURL Team</p>
          </div>
        `
      }
    case 'expiring':
      return {
        subject: '⚠️ Your iURL Subscription is Expiring Soon',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #0080ff;">Subscription Expiring Soon</h1>
            <p>Your <strong>${details.planName}</strong> subscription will expire on <strong>${details.endDate}</strong>.</p>
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <p>Don't lose access to your premium features!</p>
              <p>Renew your subscription to continue enjoying:</p>
              <ul>
                <li>Unlimited URL scans</li>
                <li>Advanced threat detection</li>
                <li>Detailed scan history</li>
              </ul>
            </div>
            <a href="${Deno.env.get('VITE_SUPABASE_URL')}/pricing" style="display: inline-block; background: #0080ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0;">Renew Now</a>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">Best regards,<br>The iURL Team</p>
          </div>
        `
      }
    case 'cancelled':
      return {
        subject: '❌ Your iURL Subscription Has Been Cancelled',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #0080ff;">Subscription Cancelled</h1>
            <p>Your <strong>${details.planName}</strong> subscription has been cancelled.</p>
            <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p>We're sorry to see you go! Your premium access will remain active until your current billing period ends.</p>
              ${details.endDate ? `<p><strong>Access Until:</strong> ${details.endDate}</p>` : ''}
            </div>
            <p>You can reactivate your subscription anytime to regain access to premium features.</p>
            <a href="${Deno.env.get('VITE_SUPABASE_URL')}/pricing" style="display: inline-block; background: #0080ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0;">Reactivate Subscription</a>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">Best regards,<br>The iURL Team</p>
          </div>
        `
      }
    default:
      return { subject: '', html: '' }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()

    // Validate input
    const validationResult = emailSchema.safeParse(body)
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

    const { to, type, subscriptionDetails } = validationResult.data

    const { subject, html } = getEmailContent(type, subscriptionDetails)

    const { error } = await resend.emails.send({
      from: 'iURL <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
    })

    if (error) {
      console.error('Error sending email:', error)
      throw error
    }

    console.log(`Email sent successfully to ${to} for ${type} event`)

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in send-subscription-email function:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
