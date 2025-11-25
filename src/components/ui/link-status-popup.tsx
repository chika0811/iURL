import { CheckCircle, XCircle, AlertTriangle, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScanResult } from "@/hooks/use-url-scanner"

interface LinkStatusPopupProps {
  isOpen: boolean
  result: ScanResult | null
  isScanning: boolean
  onOpenLink: () => void
  onClose: () => void
  onAddToAllowlist?: () => void
}

export function LinkStatusPopup({
  isOpen,
  result,
  isScanning,
  onOpenLink,
  onClose,
  onAddToAllowlist,
}: LinkStatusPopupProps) {
  if (!isOpen) return null

  const getIcon = () => {
    if (isScanning) {
      return <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary" />
    }
    
    if (!result) return null

    if (result.verdict === 'clean') {
      return <CheckCircle className="h-16 w-16 text-green-500" />
    } else if (result.verdict === 'suspicious') {
      return <AlertTriangle className="h-16 w-16 text-yellow-500" />
    } else {
      return <XCircle className="h-16 w-16 text-red-500" />
    }
  }

  const getTitle = () => {
    if (isScanning) return 'Scanning...'
    if (!result) return 'Processing...'
    
    if (result.verdict === 'clean') return 'Link is Safe ✓'
    if (result.verdict === 'suspicious') return 'Suspicious Link ⚠️'
    return 'Threat Detected! 🛡️'
  }

  const getDescription = () => {
    if (isScanning) return 'Analyzing URL for threats...'
    if (!result) return 'Processing result...'
    
    if (result.verdict === 'clean') {
      return 'This link is legitimate and safe to open.'
    } else if (result.verdict === 'suspicious') {
      return 'This link shows warning signs. Review carefully before opening.'
    } else {
      return 'This link appears malicious and has been blocked for your protection.'
    }
  }

  const borderColor = !result || result.verdict === 'clean' 
    ? 'border-green-500' 
    : result.verdict === 'suspicious'
    ? 'border-yellow-500'
    : 'border-red-500'

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className={`w-full max-w-md p-6 space-y-4 ${borderColor} border-2`}>
        <div className="flex items-center justify-center">
          {getIcon()}
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">{getTitle()}</h2>
          
          {result && (
            <div className="flex items-center justify-center space-x-2">
              <Badge variant={result.verdict === 'clean' ? 'secondary' : 'destructive'}>
                Score: {result.score}/100
              </Badge>
              <Badge variant="outline">{result.verdict}</Badge>
            </div>
          )}

          <p className="text-muted-foreground break-all text-sm font-mono">
            {result?.url}
          </p>
          
          <p className="text-sm">{getDescription()}</p>

          {result && result.reasons.length > 0 && (
            <div className="bg-muted p-3 rounded-lg text-left">
              <p className="font-semibold text-xs mb-2">Detection Details:</p>
              <ul className="space-y-1">
                {result.reasons.map((reason, idx) => (
                  <li key={idx} className="text-xs flex items-start space-x-2">
                    <Shield className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {!isScanning && result && (
          <div className="space-y-2">
            {result.verdict === 'clean' ? (
              <div className="flex space-x-3">
                <Button onClick={onOpenLink} className="flex-1">
                  Open Link
                </Button>
                <Button onClick={onClose} variant="outline" className="flex-1">
                  Close
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button onClick={onClose} className="w-full">
                  Close
                </Button>
                {onAddToAllowlist && (
                  <Button 
                    onClick={onAddToAllowlist} 
                    variant="ghost" 
                    size="sm" 
                    className="w-full"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Trust this domain
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
