import { useState, useEffect } from "react"
import { Shield, Trash2, ExternalLink } from "lucide-react"
import { AppHeader } from "@/components/layout/app-header"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScanResult } from "@/hooks/use-url-scanner"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface HistoryItem extends ScanResult {
  count?: number
}

export default function History() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('scan_history')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50)

      if (error) throw error

      const formattedHistory: HistoryItem[] = (data || []).map(item => ({
        url: item.url,
        score: item.score,
        verdict: item.verdict as 'clean' | 'suspicious' | 'malicious',
        safe: item.safe,
        reasons: item.reasons || [],
        timestamp: new Date(item.timestamp).getTime(),
        count: item.scan_count,
        factors: {
          allowlist: 0,
          threatFeed: 0,
          domainSimilarity: 0,
          certificate: 0,
          redirects: 0,
          entropy: 0,
          behavior: 0,
          c2: 0
        }
      }))

      setHistory(formattedHistory)
    } catch (error) {
      console.error('Error loading history:', error)
      toast({
        title: "Error",
        description: "Failed to load history",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = async () => {
    if (!confirm('Are you sure you want to clear all history?')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { error } = await supabase
        .from('scan_history')
        .delete()
        .eq('user_id', session.user.id)

      if (error) throw error

      setHistory([])
      toast({
        title: "Success",
        description: "History cleared successfully"
      })
    } catch (error) {
      console.error('Error clearing history:', error)
      toast({
        title: "Error",
        description: "Failed to clear history",
        variant: "destructive"
      })
    }
  }

  const handleDeleteItem = async (url: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { error } = await supabase
        .from('scan_history')
        .delete()
        .eq('user_id', session.user.id)
        .eq('url', url)

      if (error) throw error

      setHistory(prev => prev.filter(item => item.url !== url))
      toast({
        title: "Success",
        description: "Item deleted successfully"
      })
    } catch (error) {
      console.error('Error deleting item:', error)
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col">
      <AppHeader />
      
      <div className="p-4 space-y-6 max-w-lg mx-auto flex-1 flex flex-col justify-center">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Scan History</h1>
          {history.length > 0 && (
            <Button variant="destructive" size="sm" onClick={clearHistory}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        ) : history.length === 0 ? (
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
                          item.verdict === 'clean' ? 'text-primary' : 
                          item.verdict === 'suspicious' ? 'text-warning' : 
                          'text-destructive'
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
