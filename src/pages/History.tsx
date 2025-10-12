import { useState, useEffect } from "react"
import { Shield, Trash2, ExternalLink } from "lucide-react"
import { AppHeader } from "@/components/layout/app-header"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScanResult } from "@/hooks/use-url-scanner"

interface HistoryItem extends ScanResult {
  count?: number
}

export default function History() {
  const [history, setHistory] = useState<HistoryItem[]>([])

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('iurl-safe-history') || '[]')
    setHistory(savedHistory)
  }, [])

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all history?')) {
      localStorage.removeItem('iurl-safe-history')
      setHistory([])
    }
  }

  const handleDeleteItem = (url: string) => {
    const updated = history.filter(item => item.url !== url)
    localStorage.setItem('iurl-safe-history', JSON.stringify(updated))
    setHistory(updated)
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      
      <div className="p-4 space-y-6 max-w-lg mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Scan History</h1>
          {history.length > 0 && (
            <Button variant="destructive" size="sm" onClick={clearHistory}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>

        {history.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No History Yet</h3>
              <p className="text-sm text-muted-foreground">
                Scanned URLs will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <Card key={item.url} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between space-x-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <Shield className={`h-4 w-4 ${
                          item.verdict === 'clean' ? 'text-green-500' : 
                          item.verdict === 'suspicious' ? 'text-yellow-500' : 
                          'text-red-500'
                        }`} />
                        <Badge variant={
                          item.verdict === 'clean' ? 'secondary' : 
                          item.verdict === 'suspicious' ? 'outline' : 
                          'destructive'
                        }>
                          {item.verdict}
                        </Badge>
                        <Badge variant="outline">
                          {item.score}/100
                        </Badge>
                        {item.count && item.count > 1 && (
                          <Badge variant="outline">×{item.count}</Badge>
                        )}
                      </div>
                      <p className="text-sm font-mono break-all text-muted-foreground mb-1">
                        {item.url}
                      </p>
                      {item.reasons && item.reasons[0] && (
                        <p className="text-xs text-muted-foreground mb-1">
                          {item.reasons[0]}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {item.verdict === 'clean' && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => window.open(item.url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteItem(item.url)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}
