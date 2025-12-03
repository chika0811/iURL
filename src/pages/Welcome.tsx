import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import iurlLogo from "@/assets/iurl-logo.png"
import FloatingBubbles from "@/components/ui/floating-bubbles"

export default function Welcome() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/home")
    }, 3000)

    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 relative">
      <FloatingBubbles />
      <div className="text-center space-y-6 relative z-10">
        <div className="mx-auto w-fit animate-fade-in-up">
          <img src={iurlLogo} alt="iURL Logo" className="h-24 w-24 rounded-2xl" />
        </div>
        
        <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h1 className="text-4xl font-bold text-primary">iURL</h1>
          <p className="text-muted-foreground text-base">by D.novit</p>
          <p className="text-muted-foreground text-lg mt-6">Smart Link Protection</p>
        </div>
      </div>
    </div>
  )
}
