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
    <header className="flex items-center justify-center pt-8 md:pt-10 pb-4 md:pb-6 px-3 md:px-4 bg-background relative h-32 md:h-40 shrink-0 z-50">
      <div className="flex items-center space-x-3">
        <img src={iurlLogo} alt="iURL Logo" className="h-10 w-10 md:h-12 md:w-12 rounded-full" />
        <div>
          <h1 className="text-lg md:text-xl font-bold">iURL</h1>
          <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Smart Link Protection</p>
        </div>
      </div>
      <div className="absolute right-2 md:right-4 flex items-center gap-1.5">
        {user && (
          <>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/security")}
              className="hidden sm:flex h-8 text-xs"
            >
              <Shield className="mr-0 sm:mr-1.5 h-4 w-4" />
              <span className="hidden md:inline">Security</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/subscription")}
              className="hidden sm:flex h-8 text-xs"
            >
              <CreditCard className="mr-0 sm:mr-1.5 h-4 w-4" />
              <span className="hidden md:inline">Subscription</span>
            </Button>
          </>
        )}
        <ThemeToggle />
      </div>
    </header>
  )
}
