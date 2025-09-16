import { CheckCircle, ExternalLink } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface LinkIntegrityCardProps {
  url: string
  onOpenLink: () => void
}

export function LinkIntegrityCard({ url, onOpenLink }: LinkIntegrityCardProps) {
  return (
    <Card className="border-2 border-green-500 bg-green-50 dark:bg-green-950/20 mt-4">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-green-800 dark:text-green-300 text-lg">
              Safe Link ✓
            </h3>
            <p className="text-sm text-green-700 dark:text-green-400 mt-1 break-all">
              {url}
            </p>
            <Button 
              className="bg-green-600 hover:bg-green-700 mt-3"
              onClick={onOpenLink}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Safe Link
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}