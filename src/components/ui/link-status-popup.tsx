import { CheckCircle, AlertTriangle, ExternalLink } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface LinkStatusPopupProps {
  isVisible: boolean
  isLoading: boolean
  result?: {
    safe: boolean
    url: string
  }
  onClose: () => void
  onOpenLink?: () => void
}

export function LinkStatusPopup({ 
  isVisible, 
  isLoading, 
  result, 
  onClose, 
  onOpenLink 
}: LinkStatusPopupProps) {
  if (!isVisible) return null

  return (
    <div className="fixed inset-x-4 top-20 z-50 mx-auto max-w-lg">
      <Card className={cn(
        "shadow-lg border-2 transition-all duration-300",
        result?.safe ? "border-green-500 bg-green-50 dark:bg-green-950" : "border-red-500 bg-red-50 dark:bg-red-950",
        isLoading && "border-blue-500 bg-blue-50 dark:bg-blue-950"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            {isLoading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            ) : result?.safe ? (
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
            )}
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg">
                {isLoading ? "Checking Link..." : result?.safe ? "Safe Link Verified" : "Threat Detected!"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {isLoading 
                  ? "Analyzing URL for potential threats..."
                  : result?.safe 
                    ? "Link is safe to open. Click 'Open Link' to visit."
                    : "This link appears to be malicious and has been blocked."
                }
              </p>
              
              {result && (
                <div className="flex gap-2 mt-3">
                  {result.safe && onOpenLink && (
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={onOpenLink}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Link
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onClose}
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}