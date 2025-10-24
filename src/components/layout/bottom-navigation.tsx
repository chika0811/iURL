import { Shield, Clipboard, Info, Lock, DollarSign } from "lucide-react"
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
    name: "About",
    href: "/about",
    icon: Info,
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
      <div className="flex items-center justify-around py-2 px-2 max-w-lg mx-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-col items-center p-2 rounded-xl transition-colors min-w-0",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}