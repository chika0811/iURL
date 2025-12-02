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
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan"
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
  const { scanUrl, isScanning } = useUrlScanner()
  const stats = useDailyStats()
  const { startBackgroundProtection, stopBackgroundProtection } = useBackgroundService()
  const { scanLimit, incrementScanCount } = useScanLimit()
  const { hasBackgroundAccess, isPremiumOrBusiness } = useSubscriptionPlan()
  const { toast } = useToast()
  const navigate = useNavigate()

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

  // Auto-start clipboard monitoring for premium/business users only
  useEffect(() => {
    const initClipboardMonitoring = async () => {
      if (hasBackgroundAccess) {
        const cleanup = await startBackgroundProtection()
        setCleanupClipboard(() => cleanup)
      }
    }
    
    initClipboardMonitoring()
    
    return () => {
      if (cleanupClipboard) {
        cleanupClipboard()
      }
    }
  }, [startBackgroundProtection, hasBackgroundAccess])

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
    <div className="min-h-screen bg-background pb-16 flex flex-col">
      <AppHeader />
      
      <div className="p-3 space-y-3 max-w-lg mx-auto text-center flex-1 flex flex-col justify-center">
        {/* Real-time Protection Section */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <h2 className="text-base font-semibold">Real-time Protection</h2>
              </div>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAllowlist(true)}
                  className="h-8 w-8"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant={isProtectionActive ? "default" : "outline"}
                  onClick={handleToggleProtection}
                  className="px-4 h-8 text-sm"
                >
                  {isProtectionActive ? "Active" : "Activate"}
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <TrendingUp className="h-3 w-3 text-primary" />
                  <span className="text-xs text-muted-foreground">Today</span>
                </div>
                <div className="text-xl font-bold">{stats.linksChecked}</div>
                <div className="text-xs text-muted-foreground">Links Checked</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <ShieldX className="h-3 w-3 text-destructive" />
                  <span className="text-xs text-muted-foreground">Blocked</span>
                </div>
                <div className="text-xl font-bold">{stats.threatsBlocked}</div>
                <div className="text-xs text-muted-foreground">Threats Stopped</div>
              </div>
            </div>
            
            {scanLimit && scanLimit.planType === 'free' && (
              <div className="text-center p-2 bg-muted rounded-lg mb-2">
                <div className="text-xs text-muted-foreground">Monthly Scans</div>
                <div className="text-base font-semibold">
                  {scanLimit.remaining} / {scanLimit.total} remaining
                </div>
              </div>
            )}
            
            {isProtectionActive && (
              <Badge variant="secondary" className="w-full justify-center text-xs py-1">
                System Integration Active
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* URL Security Scanner */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-base">
              <Shield className="h-4 w-4 text-primary" />
              <span>URL Security Scanner</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <Input
              placeholder="Paste or enter URL to check for threats..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="text-sm h-10"
            />
            <div className="flex space-x-2">
              <Button 
                onClick={handleScanUrl}
                disabled={!url.trim() || isScanning}
                className="flex-1 h-10"
              >
                <Shield className="mr-2 h-4 w-4" />
                {isScanning ? "Scanning..." : "Scan URL"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleQrScan}
                className="shrink-0 h-10 w-10"
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
        onAddToAllowlist={isPremiumOrBusiness ? handleAddToAllowlist : undefined}
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