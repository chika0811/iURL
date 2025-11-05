import { ThemeToggle } from "@/components/theme-toggle"
import iurlLogo from "@/assets/iurl-logo.png"

export function AppHeader() {
  return (
    <header className="flex items-center justify-center p-4 bg-background border-b border-border relative">
      <div className="flex items-center space-x-3">
        <img 
          src={iurlLogo} 
          alt="iURL Logo" 
          className="h-12 w-12 object-contain rounded-full"
        />
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