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
import FloatingBubbles from "@/components/ui/floating-bubbles"

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
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data, error } = await supabase
          .from('scan_history')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(50)
        
        if (error) throw error
        
        const historyItems: HistoryItem[] = (data || []).map(item => ({
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
        
        setHistory(historyItems)
      } else {
        const savedHistory = JSON.parse(localStorage.getItem('iurl-safe-history') || '[]')
        setHistory(savedHistory)
      }
    } catch (error) {
      console.error('Error loading history:', error)
      const savedHistory = JSON.parse(localStorage.getItem('iurl-safe-history') || '[]')
      setHistory(savedHistory)
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = async () => {
    if (!confirm('Are you sure you want to clear all history?')) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { error } = await supabase
          .from('scan_history')
          .delete()
          .eq('user_id', user.id)
        
        if (error) throw error
        
        toast({
          title: "History Cleared",
          description: "All scan history has been removed"
        })
      } else {
        localStorage.removeItem('iurl-safe-history')
      }
      
      setHistory([])
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
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { error } = await supabase
          .from('scan_history')
          .delete()
          .eq('user_id', user.id)
          .eq('url', url)
        
        if (error) throw error
      } else {
        const updated = history.filter(item => item.url !== url)
        localStorage.setItem('iurl-safe-history', JSON.stringify(updated))
      }
      
      setHistory(prev => prev.filter(item => item.url !== url))
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
    <div className="min-h-screen bg-background pb-14 flex flex-col relative">
      <FloatingBubbles />
      <AppHeader />
      
      <div className="p-2 space-y-3 max-w-lg mx-auto flex-1 flex flex-col justify-center relative z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Scan History</h1>
          {history.length > 0 && (
            <Button variant="destructive" size="sm" onClick={clearHistory} className="h-7">
              <Trash2 className="h-3 w-3 mr-1" />
              <span className="text-[10px]">Clear All</span>
            </Button>
          )}
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-6 text-center">
              <Shield className="h-10 w-10 mx-auto text-muted-foreground mb-2 animate-pulse" />
              <p className="text-[10px] text-muted-foreground">Loading history...</p>
            </CardContent>
          </Card>
        ) : history.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center">
              <Shield className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <h3 className="text-sm font-semibold mb-1">No History Yet</h3>
              <p className="text-[10px] text-muted-foreground">
                Scanned URLs will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {history.map((item) => (
              <Card key={item.url} className="overflow-hidden">
                <CardContent className="p-2.5">
                  <div className="flex items-start justify-between space-x-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1 mb-1">
                        <Shield className={`h-3 w-3 ${
                          item.verdict === 'clean' ? 'text-green-500' : 
                          item.verdict === 'suspicious' ? 'text-yellow-500' : 
                          'text-red-500'
                        }`} />
                        <Badge variant={
                          item.verdict === 'clean' ? 'secondary' : 
                          item.verdict === 'suspicious' ? 'outline' : 
                          'destructive'
                        } className="text-[9px] px-1 py-0">
                          {item.verdict}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] px-1 py-0">
                          {item.score}/100
                        </Badge>
                        {item.count && item.count > 1 && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0">×{item.count}</Badge>
                        )}
                      </div>
                      <p className="text-[10px] font-mono break-all text-muted-foreground mb-0.5">
                        {item.url}
                      </p>
                      {item.reasons && item.reasons[0] && (
                        <p className="text-[9px] text-muted-foreground mb-0.5">
                          {item.reasons[0]}
                        </p>
                      )}
                      <p className="text-[9px] text-muted-foreground">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex space-x-0.5">
                      {item.verdict === 'clean' && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => window.open(item.url, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => handleDeleteItem(item.url)}
                      >
                        <Trash2 className="h-3 w-3" />
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
