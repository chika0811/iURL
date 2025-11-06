import { AppHeader } from "@/components/layout/app-header"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

export default function Pricing() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

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
        variant: "destructive",
      })
      navigate('/login')
      return
    }

    if (planName === "Free") {
      toast({
        title: "Free plan",
        description: "You're already on the free plan!",
      })
      return
    }

    setLoading(planName)

    try {
      const amount = parseFloat(price.replace('$', ''))
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('No active session')
      }

      const { data, error } = await supabase.functions.invoke('initialize-paystack-payment', {
        body: {
          planName,
          amount,
          email: user.email,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (error) throw error

      // Redirect to Paystack payment page
      window.location.href = data.authorization_url
    } catch (error: any) {
      console.error('Payment initialization error:', error)
      toast({
        title: "Payment failed",
        description: error.message || "Unable to initialize payment",
        variant: "destructive",
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

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.name}
              className={plan.popular ? "border-primary shadow-lg" : ""}
            >
              <CardHeader>
                {plan.popular && (
                  <div className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full w-fit mb-2">
                    Most Popular
                  </div>
                )}
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
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
                  disabled={loading === plan.name}
                >
                  {loading === plan.name 
                    ? "Processing..." 
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
