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
    PaystackPop: any;
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
  const [user, setUser] = useState<any>(null)
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
      // Convert USD to local currency
      const localAmount = usdAmount * localCurrency.rate
      
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('No active session')
      }

      const { data, error } = await supabase.functions.invoke('initialize-paystack-payment', {
        body: {
          planName,
          amount: localAmount, // Send amount in local currency
          currency: localCurrency.code,
          email: user.email,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (error) throw error

      // Use Paystack Inline instead of redirect
      if (window.PaystackPop && data.public_key) {
        try {
          const handler = window.PaystackPop.setup({
            key: data.public_key,
            email: user.email,
            amount: data.amount, // Amount already in kobo/cents from backend
            currency: localCurrency.code,
            ref: data.reference,
            callback: async (response: any) => {
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
        } catch (popupError) {
          console.error('Paystack popup error:', popupError)
          toast({
            title: "Error",
            description: "Failed to open payment window. Redirecting...",
          })
          setTimeout(() => {
            window.location.href = data.authorization_url
          }, 2000)
        }
      } else {
        // Fallback to redirect if Paystack SDK not loaded
        window.location.href = data.authorization_url
      }
    } catch (error: any) {
      console.error('Payment initialization error:', error)
      toast({
        title: "Payment failed",
        description: error.message || "Unable to initialize payment",
      })
      setLoading(null)
    }
  }

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      features: [
        "Manual URL scanning",
        "QR code scanning",
        "Basic threat detection",
        "Scan history",
        "Local processing"
      ]
    },
    {
      name: "Pro",
      price: "$4.99",
      period: "per month",
      features: [
        "Everything in Free",
        "Automatic clipboard monitoring",
        "Advanced threat detection",
        "Priority scanning",
        "Custom allowlist",
        "Email support"
      ],
      popular: true
    },
    {
      name: "Premium",
      price: "$9.99",
      period: "per month",
      features: [
        "Everything in Pro",
        "Real-time protection",
        "Enterprise-grade security",
        "VPN integration",
        "24/7 priority support",
        "Custom integrations"
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

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {plans.filter(plan => plan.name !== "Free").map((plan) => (
            <Card 
              key={plan.name}
              className="flex flex-col transition-all hover:border-primary hover:shadow-lg"
            >
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>
                  <div className="space-y-1">
                    <div>
                      <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-muted-foreground"> USD/{plan.period}</span>
                    </div>
                    {userCountry !== 'US' && (
                      <div className="text-sm">
                        <span className="text-foreground font-semibold">
                          {localCurrency.symbol}{(parseFloat(plan.price.replace('$', '')) * localCurrency.rate).toFixed(2)}
                        </span>
                        <span className="text-muted-foreground"> {localCurrency.code}/{plan.period}</span>
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
                  className="w-full" 
                  variant="default"
                  onClick={() => handleSubscribe(plan.name, plan.price)}
                  disabled={loading === plan.name || currencyLoading}
                >
                  {loading === plan.name 
                    ? "Processing..." 
                    : currencyLoading
                    ? "Loading..."
                    : plan.name === "Free" 
                    ? "Get Started" 
                    : "Subscribe Now"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <BottomNavigation />
    </div>
  )
}
