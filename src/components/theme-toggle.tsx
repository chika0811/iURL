import { Moon, Sun, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg border border-border/50">
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-6 w-6 rounded-md hover:bg-background hover:text-foreground", theme === 'light' && "bg-background shadow-sm")}
        onClick={() => setTheme("light")}
        title="Light Mode"
      >
        <Sun className="h-3.5 w-3.5" />
        <span className="sr-only">Light</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-6 w-6 rounded-md hover:bg-background hover:text-foreground", theme === 'dark' && "bg-background shadow-sm")}
        onClick={() => setTheme("dark")}
        title="Dark Mode"
      >
        <Moon className="h-3.5 w-3.5" />
        <span className="sr-only">Dark</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-6 w-6 rounded-md hover:bg-background hover:text-foreground", theme === 'system' && "bg-background shadow-sm")}
        onClick={() => setTheme("system")}
        title="System Theme"
      >
        <Monitor className="h-3.5 w-3.5" />
        <span className="sr-only">System</span>
      </Button>
    </div>
  )
}