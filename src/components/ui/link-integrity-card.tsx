import { CheckCircle, ExternalLink } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface LinkIntegrityCardProps {
  url: string
  onOpenLink: () => void
}

export function LinkIntegrityCard({ url, onOpenLink }: LinkIntegrityCardProps) {
  return (
    <Card className="border-2 border-primary bg-primary/5 dark:bg-primary/10 mt-4">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-primary dark:text-primary text-lg">
              Safe Link ✓
            </h3>
            <p className="text-sm text-foreground/80 dark:text-foreground/60 mt-1 break-all">
              {url}
            </p>
            <Button 
              className="bg-primary hover:bg-primary/90 mt-3"
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