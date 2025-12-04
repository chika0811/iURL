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
    (item) => item.href !== location.pathname
  )

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around py-2 px-2 max-w-lg mx-auto h-[60px]">
        {visibleNavigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-1 rounded-lg transition-colors min-w-[45px] flex-1 max-w-[70px]",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 mb-0.5" />
              <span className="text-[8px] font-medium truncate w-full text-center leading-none">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}