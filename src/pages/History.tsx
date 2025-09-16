import { useState, useEffect } from "react"
import { Clipboard, Trash2 } from "lucide-react"
import { AppHeader } from "@/components/layout/app-header"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScanResult } from "@/hooks/use-url-scanner"

export default function History() {
  const [history, setHistory] = useState<ScanResult[]>([])

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('iurl-safe-history') || '[]')
    setHistory(savedHistory)
  }, [])

  const clearHistory = () => {
    localStorage.removeItem('iurl-safe-history')
    setHistory([])
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  const getDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname
      return domain.replace('www.', '')
    } catch {
      return url
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      
      <div className="p-4 space-y-6 max-w-lg mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Safe Links History</h1>
          {history.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearHistory}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>

        {history.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-orange-100 dark:bg-orange-900 rounded-full p-4">
                  <Clipboard className="h-12 w-12 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold">No Safe Links Yet</h3>
                <p className="text-muted-foreground max-w-sm">
                  Check your first URL to start building your safe browsing history.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {history.map((item, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{getDomain(item.url)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatTimestamp(item.timestamp)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="ml-2 text-success">
                    Safe
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}