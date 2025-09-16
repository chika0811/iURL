import { Shield } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export function AppHeader() {
  return (
    <header className="flex items-center justify-center p-4 bg-background border-b border-border relative">
      <div className="flex items-center space-x-3">
        <div className="bg-primary rounded-xl p-2">
          <Shield className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold">iURL</h1>
          <p className="text-sm text-muted-foreground">Smart Link Protection</p>
        </div>
      </div>
      <div className="absolute right-4">
        <ThemeToggle />
      </div>
    </header>
  )
}