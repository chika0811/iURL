import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/app-header"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/integrations/supabase/client"
import { CheckCircle, XCircle, Loader } from "lucide-react"
import FloatingBubbles from "@/components/ui/floating-bubbles"
import { ConfettiEffect } from "@/components/ui/confetti-effect"

export default function PaymentStatus() {
  const location = useLocation()
  const navigate = useNavigate()
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading")
  const [message, setMessage] = useState("Verifying your payment...")
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const reference = params.get("reference")

    if (reference) {
      verifySubscription(reference)
    } else {
      setStatus("failed")
      setMessage("No payment reference found.")
    }
  }, [location.search])

  const verifySubscription = async (reference: string) => {
    try {
      const interval = setInterval(async () => {
        const { data, error } = await supabase
          .from("subscriptions")
          .select("status")
          .eq("paystack_reference", reference)
          .single()

        if (error) {
          return
        }

        if (data.status === "active") {
          clearInterval(interval)
          setStatus("success")
          setMessage("Your subscription is now active!")
          setShowConfetti(true)
        } else if (data.status === "failed") {
          clearInterval(interval)
          setStatus("failed")
          setMessage("Payment failed. Please try again.")
        }
      }, 3000)

      setTimeout(() => {
        clearInterval(interval)
        if (status === "loading") {
          setStatus("failed")
          setMessage("Payment verification timed out. Please check your subscriptions later.")
        }
      }, 30000)
    } catch (error) {
      setStatus("failed")
      setMessage("An error occurred during payment verification.")
    }
  }

  return (
    <div className="min-h-screen bg-background pb-14 flex flex-col relative">
      <FloatingBubbles />
      <ConfettiEffect trigger={showConfetti} />
      <AppHeader />
      <main className="container mx-auto p-2 max-w-md flex-1 flex flex-col justify-center relative z-10">
        <Card className="animate-fade-in-up">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg">Payment Status</CardTitle>
          </CardHeader>
          <CardContent className="text-center pb-4">
            {status === "loading" && (
              <Loader className="h-12 w-12 mx-auto text-primary animate-spin mb-3" />
            )}
            {status === "success" && (
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3 animate-bounce" />
            )}
            {status === "failed" && (
              <XCircle className="h-12 w-12 mx-auto text-destructive mb-3" />
            )}
            <p className="text-sm mb-4">{message}</p>
            {status !== "loading" && (
              <Button onClick={() => navigate("/pricing")} size="sm">
                Back to Pricing
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
      <BottomNavigation />
    </div>
  )
}
