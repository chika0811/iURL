import { AppHeader } from "@/components/layout/app-header"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

// Declare Paystack type
declare global {
  interface Window {
    PaystackPop: {
      setup: (options: any) => { openIframe: () => void }; // eslint-disable-line @typescript-eslint/no-explicit-any
    };
  }
}

export default function Pricing() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState<string | null>(null)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)

  useEffect(() => {
    // Load Paystack SDK
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  const handleSubscribe = async (planName: string, price: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to subscribe",
      })
      navigate('/login')
      return
    }

    // Ensure user has an email before proceeding
    if (!user.email) {
      toast({
        title: "Email address required",
        description: "Please add an email to your account before subscribing.",
      })
      return
    }

    if (planName === "Free") {
      toast({
        title: "Free plan",
        description: "You're already on the free plan!",
      })
      return
    }

    // Check for active subscription
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()

    if (existingSub) {
      toast({
        title: "Active subscription",
        description: "You already have an active subscription. Visit your dashboard to manage it.",
      })
      navigate("/subscription")
      return
    }

    setLoading(planName)

    try {
      const usdAmount = parseFloat(price.replace('$', ''))
      
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('No active session')
      }

      const { data, error } = await supabase.functions.invoke('initialize-paystack-payment', {
        body: {
          planName,
          amount: usdAmount,
          currency: "USD",
          email: user.email,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (error) throw error

      // Use Paystack Inline checkout
      if (window.PaystackPop && data.public_key) {
        const handler = window.PaystackPop.setup({
          key: data.public_key,
          email: user.email,
          amount: data.amount, // Amount already in kobo/cents from backend
          currency: "USD",
          ref: data.reference,
          callback: async (response: { reference: string }) => {
            console.log('Payment completed:', response.reference)
            
            // Get fresh session token for verification
            const { data: { session: currentSession } } = await supabase.auth.getSession()
            if (!currentSession) {
              toast({
                title: "Authentication error",
                description: "Please log in again",
              })
              setLoading(null)
              return
            }

            // Verify payment with backend
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
              'verify-paystack-payment',
              {
                body: { reference: response.reference },
                headers: {
                  Authorization: `Bearer ${currentSession.access_token}`,
                },
              }
            )

            if (verifyError || !verifyData?.success) {
              console.error('Verification error:', verifyError)
              toast({
                title: "Verification failed",
                description: verifyError?.message || "Please contact support",
              })
            } else {
              toast({
                title: "Success!",
                description: "Your subscription is now active.",
              })
              setTimeout(() => navigate('/subscription-dashboard'), 1500)
            }
            setLoading(null)
          },
          onClose: () => {
            setLoading(null)
            toast({
              title: "Payment cancelled",
              description: "You closed the payment window.",
            })
          }
        })
        handler.openIframe()
      } else {
        // Fallback to redirect if Paystack SDK not loaded
        toast({
          title: "Loading payment...",
          description: "Redirecting to secure checkout",
        })
        window.location.href = data.authorization_url
      }
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Payment initialization error:', error)
      // Provide a more detailed error message to the user
      const description =
        error.details || error.message || "An unexpected error occurred. Please try again."
      toast({
        title: "Payment Failed",
        description: `Error: ${description}`,
        variant: "destructive",
      })
      setLoading(null)
    }
  }

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "month",
      features: [
        "Up to 10 links per month",
        "Manual URL paste only",
        "Daily counters (links checked & threats stopped)",
        "7 days history retention",
        "Basic threat detection"
      ]
    },
    {
      name: "Premium",
      monthlyPrice: "$4.99",
      yearlyPrice: "$49.99",
      period: "month",
      features: [
        "Everything in Free",
        "Unlimited URL scans",
        "Background checking with global access",
        "Auto-opens safe URLs in default browser",
        "Unlimited history retention",
        "Priority support"
      ],
      popular: true
    },
    {
      name: "Business",
      price: "$99.99",
      period: "year",
      features: [
        "Everything in Premium",
        "Custom AI model training",
        "Add unrecognized links to AI whitelist",
        "White-label SDK integration",
        "Device/per-seat pricing",
        "Advanced security controls",
        "Dedicated account manager"
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col">
      <AppHeader />
      
      <main className="container mx-auto p-4 max-w-6xl flex-1 flex flex-col justify-center">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
          <p className="text-muted-foreground">
            Select the perfect plan for your security needs
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const isPremium = plan.name === "Premium";
            const isFree = plan.name === "Free";
            const displayPrice = isPremium ? plan.monthlyPrice : plan.price;
            
            return (
              <Card 
                key={plan.name}
                className={`flex flex-col transition-all ${
                  plan.popular 
                    ? 'border-primary shadow-lg hover:shadow-xl relative' 
                    : 'hover:border-primary hover:shadow-lg'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>
                    <div className="space-y-1">
                      <div>
                        <span className="text-3xl font-bold text-foreground">{displayPrice}</span>
                        <span className="text-muted-foreground"> USD/{plan.period}</span>
                      </div>
                      {isPremium && (
                        <div className="text-sm text-muted-foreground">
                          or {plan.yearlyPrice} USD/year
                        </div>
                      )}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 mb-6 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full transition-all hover:scale-105" 
                    variant={isFree ? "outline" : "default"}
                    onClick={() => handleSubscribe(plan.name, displayPrice!)}
                    disabled={loading === plan.name || isFree}
                  >
                    {loading === plan.name 
                      ? "Processing..." 
                      : isFree 
                      ? "Current Plan" 
                      : "Subscribe Now"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      <BottomNavigation />
    </div>
  )
}
