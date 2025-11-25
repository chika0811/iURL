import { useState, useEffect } from "react"
import { QrCode, Shield, TrendingUp, ShieldX, Settings } from "lucide-react"
import { AppHeader } from "@/components/layout/app-header"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LinkStatusPopup } from "@/components/ui/link-status-popup"
import { LinkIntegrityCard } from "@/components/ui/link-integrity-card"
import { QrScanner } from "@/components/qr-scanner"
import { AllowlistManager } from "@/components/allowlist-manager"
import { useUrlScanner, ScanResult } from "@/hooks/use-url-scanner"
import { useDailyStats } from "@/hooks/use-daily-stats"
import { useBackgroundService } from "@/hooks/use-background-service"
import { useScanLimit } from "@/hooks/use-scan-limit"
import { addToAllowlist } from "@/lib/url-scanner/allowlist"
import { useToast } from "@/hooks/use-toast"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"

export default function Home() {
  const [url, setUrl] = useState("")
  const [isProtectionActive, setIsProtectionActive] = useState(true)
  const [cleanupClipboard, setCleanupClipboard] = useState<(() => void) | null>(null)
  const [showPopup, setShowPopup] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [showQrScanner, setShowQrScanner] = useState(false)
  const [showAllowlist, setShowAllowlist] = useState(false)
  const [hasPremiumPlan, setHasPremiumPlan] = useState(false)
  const { scanUrl, isScanning } = useUrlScanner()
  const stats = useDailyStats()
  const { startBackgroundProtection, stopBackgroundProtection } = useBackgroundService()
  const { scanLimit, incrementScanCount } = useScanLimit()
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user has premium subscription
    const checkSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('plan_type, status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle()
        
        setHasPremiumPlan(subscription?.plan_type === 'pro' || subscription?.plan_type === 'premium')
      }
    }
    checkSubscription()
  }, [])

  useEffect(() => {
    // Listen for URL scan requests from notifications
    const handleScanFromNotification = (event: CustomEvent) => {
      setUrl(event.detail.url)
      handleScanUrl()
    }

    // Listen for clipboard URL detection
    const handleClipboardUrlDetected = (event: CustomEvent) => {
      setUrl(event.detail.url)
      handleScanUrl(event.detail.url)
    }

    window.addEventListener('scanUrlFromNotification', handleScanFromNotification as EventListener)
    window.addEventListener('clipboardUrlDetected', handleClipboardUrlDetected as EventListener)
    
    return () => {
      window.removeEventListener('scanUrlFromNotification', handleScanFromNotification as EventListener)
      window.removeEventListener('clipboardUrlDetected', handleClipboardUrlDetected as EventListener)
    }
  }, [])

  // Auto-start clipboard monitoring when component mounts (always active)
  useEffect(() => {
    const initClipboardMonitoring = async () => {
      const cleanup = await startBackgroundProtection()
      setCleanupClipboard(() => cleanup)
    }
    
    initClipboardMonitoring()
    
    return () => {
      if (cleanupClipboard) {
        cleanupClipboard()
      }
    }
  }, [startBackgroundProtection])

  const handleToggleProtection = async () => {
    if (isProtectionActive) {
      if (cleanupClipboard) {
        cleanupClipboard()
        setCleanupClipboard(null)
      }
      await stopBackgroundProtection()
      setIsProtectionActive(false)
    } else {
      const cleanup = await startBackgroundProtection()
      setCleanupClipboard(() => cleanup)
      setIsProtectionActive(true)
    }
  }

  const handleScanUrl = async (input?: string | React.MouseEvent) => {
    let targetUrl = url
    if (typeof input === 'string') {
      targetUrl = input
    }

    if (!targetUrl.trim()) return
    
    // Check scan limit for free users
    if (scanLimit && !scanLimit.canScan) {
      toast({
        title: "Scan limit reached",
        description: `Free plan allows ${scanLimit.total} scans per month. Upgrade to continue scanning.`,
      })
      navigate('/pricing')
      return
    }
    
    setShowPopup(true)
    setScanResult(null)
    
    try {
      const result = await scanUrl(targetUrl.trim())
      setScanResult(result)
      
      // Increment scan count after successful scan
      if (scanLimit && scanLimit.planType === 'free') {
        await incrementScanCount()
      }
    } catch (error) {
      console.error("Error scanning URL:", error)
      setShowPopup(false)
    }
  }

  const handleOpenLink = () => {
    if (scanResult?.url) {
      window.open(scanResult.url, '_blank')
      setShowPopup(false)
      setScanResult(null)
      setUrl("")
    }
  }

  const handleClosePopup = () => {
    setShowPopup(false)
    setScanResult(null)
    setUrl("")
  }

  const handleQrScan = () => {
    setShowQrScanner(true)
  }

  const handleQrResult = (scannedUrl: string) => {
    setUrl(scannedUrl)
    setShowQrScanner(false)
    // Auto-scan the detected URL
    handleScanUrl(scannedUrl)
  }

  const handleCloseQrScanner = () => {
    setShowQrScanner(false)
  }

  const handleAddToAllowlist = () => {
    if (scanResult?.url) {
      try {
        const domain = new URL(scanResult.url).hostname
        addToAllowlist(domain)
        toast({
          title: "Domain trusted",
          description: `${domain} added to allowlist`,
        })
        setShowPopup(false)
        setScanResult(null)
        setUrl("")
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to add domain to allowlist",
        })
      }
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col">
      <AppHeader />
      
      <div className="p-4 space-y-6 max-w-lg mx-auto text-center flex-1 flex flex-col justify-center">
        {/* Real-time Protection Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Shield className="h-6 w-6 text-primary" />
                <h2 className="text-lg font-semibold">Real-time Protection</h2>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAllowlist(true)}
                >
                  <Settings className="h-5 w-5" />
                </Button>
                <Button
                  variant={isProtectionActive ? "default" : "outline"}
                  onClick={handleToggleProtection}
                  className="px-6"
                >
                  {isProtectionActive ? "Active" : "Activate"}
                </Button>
              </div>
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
            
            {scanLimit && scanLimit.planType === 'free' && (
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Monthly Scans</div>
                <div className="text-lg font-semibold">
                  {scanLimit.remaining} / {scanLimit.total} remaining
                </div>
              </div>
            )}
            
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

        {scanResult?.safe && (
          <LinkIntegrityCard 
            url={scanResult.url} 
            onOpenLink={handleOpenLink}
          />
        )}
      </div>

      <LinkStatusPopup
        isOpen={showPopup}
        result={scanResult}
        isScanning={isScanning}
        onOpenLink={handleOpenLink}
        onClose={handleClosePopup}
        onAddToAllowlist={hasPremiumPlan ? handleAddToAllowlist : undefined}
      />

      {showQrScanner && (
        <QrScanner
          onResult={handleQrResult}
          onClose={handleCloseQrScanner}
        />
      )}

      <AllowlistManager
        open={showAllowlist}
        onClose={() => setShowAllowlist(false)}
      />

      <BottomNavigation />
    </div>
  )
}