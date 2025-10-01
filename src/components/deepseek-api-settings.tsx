import { useState } from "react"
import { useDeepSeekScanner } from "@/hooks/use-deepseek-scanner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Eye, EyeOff, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function DeepSeekApiSettings() {
  const { apiKey, saveApiKey, hasApiKey } = useDeepSeekScanner()
  const [inputKey, setInputKey] = useState(apiKey)
  const [showKey, setShowKey] = useState(false)
  const { toast } = useToast()

  const handleSave = () => {
    if (inputKey.trim()) {
      saveApiKey(inputKey.trim())
      toast({
        title: "API Key Saved",
        description: "DeepSeek AI is now enabled for advanced threat detection.",
      })
    }
  }

  const handleClear = () => {
    setInputKey("")
    saveApiKey("")
    toast({
      title: "API Key Removed",
      description: "Switched back to rule-based detection.",
      variant: "destructive",
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle>DeepSeek AI Settings</CardTitle>
        </div>
        <CardDescription>
          Enable AI-powered threat detection for more accurate link analysis.
          {!hasApiKey && " Get your free API key from DeepSeek."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-key">DeepSeek API Key</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="api-key"
                type={showKey ? "text" : "password"}
                placeholder="sk-..."
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <Button onClick={handleSave} disabled={!inputKey.trim()}>
              Save
            </Button>
            {hasApiKey && (
              <Button onClick={handleClear} variant="destructive">
                Clear
              </Button>
            )}
          </div>
        </div>

        {!hasApiKey && (
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground mb-2">
              <strong>To get your API key:</strong>
            </p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Visit DeepSeek Platform</li>
              <li>Sign up or log in to your account</li>
              <li>Navigate to API Keys section</li>
              <li>Create a new API key</li>
              <li>Copy and paste it above</li>
            </ol>
            <Button
              variant="link"
              className="mt-2 p-0 h-auto"
              asChild
            >
              <a
                href="https://platform.deepseek.com/api_keys"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                Get API Key <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        )}

        {hasApiKey && (
          <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
            <p className="text-sm text-green-700 dark:text-green-400 font-medium">
              ✓ DeepSeek AI is active
            </p>
            <p className="text-xs text-green-600 dark:text-green-500 mt-1">
              All links will be analyzed using advanced AI threat detection.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
