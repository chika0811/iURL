import { useState } from "react"
import { QrCode, Shield, TrendingUp, ShieldX } from "lucide-react"
import { AppHeader } from "@/components/layout/app-header"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useUrlScanner } from "@/hooks/use-url-scanner"
import { useDailyStats } from "@/hooks/use-daily-stats"

export default function Home() {
  const [url, setUrl] = useState("")
  const [isProtectionActive, setIsProtectionActive] = useState(true)
  const { scanUrl, isScanning } = useUrlScanner()
  const stats = useDailyStats()

  const handleScanUrl = async () => {
    if (!url.trim()) return
    
    try {
      const result = await scanUrl(url.trim())
      if (result.safe) {
        window.open(result.url, '_blank')
      }
      setUrl("")
    } catch (error) {
      console.error("Error scanning URL:", error)
    }
  }

  const handleQrScan = () => {
    // In a real app, this would open camera for QR scanning
    alert("QR Scanner would open camera here. This is a demo.")
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      
      <div className="p-4 space-y-6 max-w-lg mx-auto text-center">
        {/* Real-time Protection Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Shield className="h-6 w-6 text-primary" />
                <h2 className="text-lg font-semibold">Real-time Protection</h2>
              </div>
              <Button
                variant={isProtectionActive ? "default" : "outline"}
                onClick={() => setIsProtectionActive(!isProtectionActive)}
                className="px-6"
              >
                {isProtectionActive ? "Active" : "Activate"}
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Today</span>
                </div>
                <div className="text-2xl font-bold">{stats.linksChecked}</div>
                <div className="text-sm text-muted-foreground">Links Checked</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-2">
                  <ShieldX className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-muted-foreground">Blocked</span>
                </div>
                <div className="text-2xl font-bold">{stats.threatsBlocked}</div>
                <div className="text-sm text-muted-foreground">Threats Stopped</div>
              </div>
            </div>
            
            {isProtectionActive && (
              <Badge variant="secondary" className="w-full justify-center">
                System Integration Active
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* URL Security Scanner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>URL Security Scanner</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Paste or enter URL to check for threats..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="text-base"
            />
            <div className="flex space-x-3">
              <Button 
                onClick={handleScanUrl}
                disabled={!url.trim() || isScanning}
                className="flex-1"
              >
                <Shield className="mr-2 h-4 w-4" />
                {isScanning ? "Scanning..." : "Scan URL"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleQrScan}
                className="shrink-0"
              >
                <QrCode className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  )
}