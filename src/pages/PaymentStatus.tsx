import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { AppHeader } from "@/components/layout/app-header"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/integrations/supabase/client"
import { CheckCircle, XCircle, Loader } from "lucide-react"

export default function PaymentStatus() {
  const location = useLocation()
  const navigate = useNavigate()
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading")
  const [message, setMessage] = useState("Verifying your payment...")

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
      // Poll for subscription status
      const interval = setInterval(async () => {
        const { data, error } = await supabase
          .from("subscriptions")
          .select("status")
          .eq("paystack_reference", reference)
          .single()

        if (error) {
          // Keep polling
          return
        }

        if (data.status === "active") {
          clearInterval(interval)
          setStatus("success")
          setMessage("Your subscription is now active!")
        } else if (data.status === "failed") {
          clearInterval(interval)
          setStatus("failed")
          setMessage("Payment failed. Please try again.")
        }
      }, 3000) // Poll every 3 seconds

      // Timeout after 30 seconds
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
    <div className="min-h-screen bg-background pb-20 flex flex-col">
      <AppHeader />
      <main className="container mx-auto p-4 max-w-md flex-1 flex flex-col justify-center">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Payment Status</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            {status === "loading" && (
              <Loader className="h-16 w-16 mx-auto text-primary animate-spin mb-4" />
            )}
            {status === "success" && (
              <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
            )}
            {status === "failed" && (
              <XCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
            )}
            <p className="text-lg mb-6">{message}</p>
            {status !== "loading" && (
              <Button onClick={() => navigate("/pricing")}>
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
