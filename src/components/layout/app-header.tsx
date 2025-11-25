import { ThemeToggle } from "@/components/theme-toggle"
import iurlLogo from "@/assets/iurl-logo.png"
import { Button } from "@/components/ui/button"
import { CreditCard, Shield } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { useEffect, useState } from "react"
import { User } from "@supabase/supabase-js"

export function AppHeader() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  return (
    <header className="flex items-center justify-center p-4 bg-background border-b border-border relative">
      <div className="flex items-center space-x-3">
        <img src={iurlLogo} alt="iURL Logo" className="h-10 w-10" />
        <div>
          <h1 className="text-xl font-bold">iURL</h1>
          <p className="text-sm text-muted-foreground">Smart Link Protection</p>
        </div>
      </div>
      <div className="absolute right-4 flex items-center gap-2">
        {user && (
          <>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/security")}
            >
              <Shield className="mr-2 h-4 w-4" />
              Security
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/subscription")}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Subscription
            </Button>
          </>
        )}
        <ThemeToggle />
      </div>
    </header>
  )
}