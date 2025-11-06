import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Shield } from "lucide-react"

export default function Welcome() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login")
    }, 3000)

    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-8">
        <div className="bg-primary rounded-3xl p-8 mx-auto w-fit">
          <Shield className="h-16 w-16 text-primary-foreground" />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-primary">iURL</h1>
          <p className="text-muted-foreground text-lg">by D.novit</p>
          <p className="text-muted-foreground text-xl mt-8">Smart Link Protection</p>
        </div>
      </div>
    </div>
  )
}