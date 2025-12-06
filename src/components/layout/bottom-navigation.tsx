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
    <nav className="fixed bottom-0 left-0 right-0 bg-background z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-center gap-6 py-2 px-4 max-w-lg mx-auto h-14">
        {visibleNavigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span className="text-[10px] font-medium text-center leading-none">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
