import { Shield, Clipboard, Lock, DollarSign } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"

const navigation = [
  {
    name: "Home",
    href: "/home",
    icon: Shield,
  },
  {
    name: "History",
    href: "/history",
    icon: Clipboard,
  },
  {
    name: "Privacy",
    href: "/privacy",
    icon: Lock,
  },
  {
    name: "Pricing",
    href: "/pricing",
    icon: DollarSign,
  },
]

export function BottomNavigation() {
  const location = useLocation()

  // Filter out the button that corresponds to the current page
  const visibleNavigation = navigation.filter(
    (item) => {
      // Normalize paths by removing trailing slashes for comparison
      const normalizePath = (path: string) => path.replace(/\/$/, "")
      return normalizePath(item.href) !== normalizePath(location.pathname)
    }
  )

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around py-3 px-2 max-w-lg mx-auto">
        {visibleNavigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-col items-center p-2 rounded-xl transition-colors min-w-[60px] flex-1 max-w-[100px]",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span className="text-[10px] font-medium truncate w-full text-center">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}