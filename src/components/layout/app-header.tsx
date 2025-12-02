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
    <header className="flex items-center justify-center p-2 md:p-3 bg-background border-b border-border relative">
      <div className="flex items-center space-x-2">
        <img src={iurlLogo} alt="iURL Logo" className="h-7 w-7 md:h-10 md:w-10" />
        <div>
          <h1 className="text-base md:text-xl font-bold">iURL</h1>
          <p className="text-[10px] md:text-sm text-muted-foreground hidden sm:block">Smart Link Protection</p>
        </div>
      </div>
      <div className="absolute right-2 md:right-3 flex items-center gap-1 md:gap-2">
        {user && (
          <>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/security")}
              className="hidden sm:flex"
            >
              <Shield className="mr-0 sm:mr-2 h-4 w-4" />
              <span className="hidden md:inline">Security</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/subscription")}
              className="hidden sm:flex"
            >
              <CreditCard className="mr-0 sm:mr-2 h-4 w-4" />
              <span className="hidden md:inline">Subscription</span>
            </Button>
          </>
        )}
        <ThemeToggle />
      </div>
    </header>
  )
}