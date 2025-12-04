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
    <header className="flex items-center justify-center p-3 md:p-4 bg-background relative h-18 md:h-20 shrink-0 z-50">
      <div className="flex items-center space-x-2">
        <img src={iurlLogo} alt="iURL Logo" className="h-7 w-7 md:h-8 md:w-8 rounded-lg" />
        <div>
          <h1 className="text-base md:text-lg font-bold">iURL</h1>
          <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">Smart Link Protection</p>
        </div>
      </div>
      <div className="absolute right-1.5 md:right-2 flex items-center gap-1">
        {user && (
          <>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/security")}
              className="hidden sm:flex h-7 text-xs"
            >
              <Shield className="mr-0 sm:mr-1.5 h-3.5 w-3.5" />
              <span className="hidden md:inline">Security</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/subscription")}
              className="hidden sm:flex h-7 text-xs"
            >
              <CreditCard className="mr-0 sm:mr-1.5 h-3.5 w-3.5" />
              <span className="hidden md:inline">Subscription</span>
            </Button>
          </>
        )}
        <ThemeToggle />
      </div>
    </header>
  )
}