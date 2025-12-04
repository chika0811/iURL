import { AppHeader } from "@/components/layout/app-header"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import FloatingBubbles from "@/components/ui/floating-bubbles"

// Declare Paystack type
declare global {
  interface Window {
    PaystackPop: {
      setup: (options: any) => { openIframe: () => void }; // eslint-disable-line @typescript-eslint/no-explicit-any
    };
  }
}

// Currency conversion rates (approximate, should be fetched from API in production)
const CURRENCY_RATES: Record<string, { symbol: string; rate: number; code: string }> = {
  'NG': { symbol: '₦', rate: 1650, code: 'NGN' },
  'GH': { symbol: '₵', rate: 15.5, code: 'GHS' },
  'KE': { symbol: 'KSh', rate: 160, code: 'KES' },
  'ZA': { symbol: 'R', rate: 19, code: 'ZAR' },
  'US': { symbol: '$', rate: 1, code: 'USD' },
}

export default function Pricing() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState<string | null>(null)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [userCountry, setUserCountry] = useState<string>('NG')
  const [localCurrency, setLocalCurrency] = useState(CURRENCY_RATES['NG'])
  const [currencyLoading, setCurrencyLoading] = useState(true)

  useEffect(() => {
    // Load Paystack SDK
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    document.body.appendChild(script)

    // Detect user's country (using a simple IP geolocation in production)
    // Defaulting to Nigeria for Paystack compatibility
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        const country = data.country_code || 'NG'
        setUserCountry(country)
        setLocalCurrency(CURRENCY_RATES[country] || CURRENCY_RATES['NG'])
      })
      .catch(() => {
        setUserCountry('NG')
        setLocalCurrency(CURRENCY_RATES['NG'])
      })
      .finally(() => {
        setCurrencyLoading(false)
      })

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const handlePaymentCallback = async (reference: string) => {
    try {
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
          body: { reference },
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
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Payment verification error:', error)
      toast({
        title: "Verification failed",
        description: "Please try again or contact support",
      })
    } finally {
      setLoading(null)
    }
  }

  const handleSubscribe = async (planName: string, price: string) => {
    if (currencyLoading) {
      toast({
        title: "Please wait",
        description: "Detecting your currency...",
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

    // Check authentication only when subscribing
    if (!user) {
      // Store subscription intent before redirecting to login
      localStorage.setItem('subscriptionIntent', JSON.stringify({
        planName,
        price: price,
        timestamp: Date.now()
      }))
      
      toast({
        title: "Authentication required",
        description: "Please log in to subscribe",
      })
      navigate('/login')
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
      navigate("/subscription-dashboard")
      return
    }

    setLoading(planName)

    try {
      const usdAmount = parseFloat(price.replace('$', ''))
      const localAmount = usdAmount * localCurrency.rate
      
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('No active session')
      }

      const { data, error } = await supabase.functions.invoke('initialize-paystack-payment', {
        body: {
          planName,
          amount: localAmount,
          currency: localCurrency.code,
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
          amount: data.amount,
          currency: localCurrency.code,
          ref: data.reference,
          callback: function(response: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            handlePaymentCallback(response.reference)
          },
          onClose: function() {
            setLoading(null)
            toast({
              title: "Payment cancelled",
              description: "You closed the payment window.",
            })
          }
        })
        handler.openIframe()
      } else {
        window.location.href = data.authorization_url
      }
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Payment initialization error:', error)
      toast({
        title: "Payment failed",
        description: error.message || "Unable to initialize payment",
      })
      setLoading(null)
    }
  }

  // Check for subscription intent after user login
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      
      if (user) {
        const intentStr = localStorage.getItem('subscriptionIntent')
        if (intentStr) {
          try {
            const intent = JSON.parse(intentStr)
            // Check if intent is less than 5 minutes old
            if (Date.now() - intent.timestamp < 5 * 60 * 1000) {
              localStorage.removeItem('subscriptionIntent')
              // Auto-trigger subscription with stored plan details
              setTimeout(() => {
                handleSubscribe(intent.planName, intent.price)
              }, 500)
            } else {
              localStorage.removeItem('subscriptionIntent')
            }
          } catch (e) {
            localStorage.removeItem('subscriptionIntent')
          }
        }
      }
    })
  }, [])

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
    },
    {
      name: "Family",
      price: "$9.99",
      period: "month",
      features: [
        "Up to 5 family members",
        "Individual dashboards per member",
        "Shared threat intelligence",
        "Parental controls",
        "Family activity reports",
        "Premium features for all members"
      ],
      comingSoon: true
    }
  ]

  return (
    <div className="min-h-screen bg-background pb-16 flex flex-col relative">
      <FloatingBubbles />
      <AppHeader />
      
      <main className="container mx-auto p-3 max-w-6xl flex-1 flex flex-col justify-center relative z-10">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-1.5">Choose Your Plan</h1>
          <p className="text-sm text-muted-foreground">
            Select the perfect plan for your security needs
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const isPremium = plan.name === "Premium";
            const isFree = plan.name === "Free";
            const isComingSoon = 'comingSoon' in plan && plan.comingSoon;
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
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-0.5 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                {isComingSoon && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full">
                    COMING SOON
                  </div>
                )}
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>
                    <div className="space-y-0.5">
                      <div>
                        <span className="text-2xl font-bold text-foreground">{displayPrice}</span>
                        <span className="text-xs text-muted-foreground"> USD/{plan.period}</span>
                      </div>
                      {isPremium && (
                        <div className="text-xs text-muted-foreground">
                          or {plan.yearlyPrice} USD/year
                        </div>
                      )}
                      {userCountry !== 'US' && !isFree && (
                        <div className="text-xs">
                          <span className="text-foreground font-semibold">
                            {localCurrency.symbol}{(parseFloat(displayPrice!.replace('$', '')) * localCurrency.rate).toFixed(2)}
                          </span>
                          <span className="text-muted-foreground"> {localCurrency.code}/{plan.period}</span>
                        </div>
                      )}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col pt-0">
                  <ul className="space-y-2 mb-4 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-1.5">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-xs">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full transition-all hover:scale-105 h-9 text-xs ${isComingSoon ? 'opacity-60' : ''}`}
                    variant={isFree || isComingSoon ? "outline" : "default"}
                    onClick={() => !isComingSoon && handleSubscribe(plan.name, displayPrice!)}
                    disabled={loading === plan.name || currencyLoading || isFree || isComingSoon}
                  >
                    {loading === plan.name 
                      ? "Processing..." 
                      : currencyLoading
                      ? "Loading..."
                      : isComingSoon
                      ? "Coming Soon"
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
