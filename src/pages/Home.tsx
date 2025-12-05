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
import FloatingBubbles from "@/components/ui/floating-bubbles"
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
    const handleScanFromNotification = (event: CustomEvent) => {
      setUrl(event.detail.url)
      handleScanUrl(event.detail.url)
    }

    const handleClipboardUrlDetected = (event: CustomEvent) => {
      setUrl(event.detail.url)
      if (event.detail.result) {
        // Already scanned, show result
        setScanResult(event.detail.result)
        setShowPopup(true)
      } else {
        handleScanUrl(event.detail.url)
      }
    }

    const handleThreatDetected = (event: CustomEvent) => {
      const { url: threatUrl, result } = event.detail
      setUrl(threatUrl)
      setScanResult(result)
      setShowPopup(true)
    }

    const handleViewThreatDetails = (event: CustomEvent) => {
      const { url: threatUrl, verdict, score } = event.detail
      setUrl(threatUrl)
      setScanResult({
        url: threatUrl,
        score: Number(score) || 0,
        verdict: (verdict as 'clean' | 'suspicious' | 'malicious') || 'suspicious',
        safe: false,
        reasons: [`Threat detected: ${verdict}`],
        timestamp: Date.now(),
        factors: {
          allowlist: 0,
          threatFeed: 50,
          domainSimilarity: 0,
          certificate: 0,
          redirects: 0,
          entropy: 0,
          behavior: 50,
          c2: 0
        }
      })
      setShowPopup(true)
    }

    const handleSafeUrlDetected = (event: CustomEvent) => {
      const { url: safeUrl } = event.detail
      // Auto-open safe URLs for premium users
      if (isPremiumOrBusiness) {
        window.open(safeUrl, '_blank')
      }
    }

    // Listen for service worker messages (web notifications)
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'THREAT_NOTIFICATION_CLICKED') {
        setUrl(event.data.url)
        handleScanUrl(event.data.url)
      }
    }

    window.addEventListener('scanUrlFromNotification', handleScanFromNotification as EventListener)
    window.addEventListener('clipboardUrlDetected', handleClipboardUrlDetected as EventListener)
    window.addEventListener('threatDetected', handleThreatDetected as EventListener)
    window.addEventListener('viewThreatDetails', handleViewThreatDetails as EventListener)
    window.addEventListener('safeUrlDetected', handleSafeUrlDetected as EventListener)
    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage)
    
    return () => {
      window.removeEventListener('scanUrlFromNotification', handleScanFromNotification as EventListener)
      window.removeEventListener('clipboardUrlDetected', handleClipboardUrlDetected as EventListener)
      window.removeEventListener('threatDetected', handleThreatDetected as EventListener)
      window.removeEventListener('viewThreatDetails', handleViewThreatDetails as EventListener)
      window.removeEventListener('safeUrlDetected', handleSafeUrlDetected as EventListener)
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage)
    }
  }, [isPremiumOrBusiness])

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
    <div className="min-h-screen bg-background pb-40 flex flex-col relative">
      <FloatingBubbles />
      <AppHeader />
      
      <div className="p-2 space-y-2 max-w-lg mx-auto text-center flex-1 flex flex-col justify-center relative z-10">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <h2 className="text-base font-bold">Real-time Protection</h2>
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
                  className="px-3 h-8 text-xs font-medium"
                >
                  {isProtectionActive ? "Active" : "Activate"}
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4 mt-2">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">Today</span>
                </div>
                <div className="text-2xl font-bold leading-none">{stats.linksChecked}</div>
                <div className="text-[10px] font-medium text-muted-foreground mt-1">Links Checked</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <ShieldX className="h-4 w-4 text-destructive" />
                  <span className="text-xs font-medium text-muted-foreground">Blocked</span>
                </div>
                <div className="text-2xl font-bold leading-none">{stats.threatsBlocked}</div>
                <div className="text-[10px] font-medium text-muted-foreground mt-1">Threats Stopped</div>
              </div>
            </div>
            
            {scanLimit && scanLimit.planType === 'free' && (
              <div className="text-center p-2 bg-muted rounded-lg mb-2">
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Monthly Scans</div>
                <div className="text-base font-bold">
                  {scanLimit.remaining} / {scanLimit.total} remaining
                </div>
              </div>
            )}
            
            {isProtectionActive && (
              <Badge variant="secondary" className="w-full justify-center text-xs py-1 font-medium">
                System Integration Active
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="flex items-center space-x-2 text-base font-bold">
              <Shield className="h-5 w-5 text-primary" />
              <span>URL Security Scanner</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0 pb-4">
            <Input
              placeholder="Paste or enter URL to check for threats..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="text-sm h-11"
            />
            <div className="flex space-x-3">
              <Button 
                onClick={handleScanUrl}
                disabled={!url.trim() || isScanning}
                className="flex-1 h-11 text-sm font-medium"
              >
                <Shield className="mr-2 h-4 w-4" />
                {isScanning ? "Scanning..." : "Scan URL"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleQrScan}
                className="shrink-0 h-11 w-11"
              >
                <QrCode className="h-5 w-5" />
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
