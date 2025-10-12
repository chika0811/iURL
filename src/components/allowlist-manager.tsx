import { useState } from "react"
import { Shield, Plus, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getAllowlist, addToAllowlist, removeFromAllowlist } from "@/lib/url-scanner/allowlist"
import { useToast } from "@/hooks/use-toast"

interface AllowlistManagerProps {
  open: boolean
  onClose: () => void
}

export function AllowlistManager({ open, onClose }: AllowlistManagerProps) {
  const [newDomain, setNewDomain] = useState("")
  const [allowlist, setAllowlist] = useState(getAllowlist())
  const { toast } = useToast()

  const handleAdd = () => {
    if (!newDomain.trim()) return
    
    try {
      addToAllowlist(newDomain)
      setAllowlist(getAllowlist())
      setNewDomain("")
      toast({
        title: "Domain added",
        description: `${newDomain} is now trusted`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add domain",
        variant: "destructive"
      })
    }
  }

  const handleRemove = (domain: string) => {
    removeFromAllowlist(domain)
    setAllowlist(getAllowlist())
    toast({
      title: "Domain removed",
      description: `${domain} removed from allowlist`,
    })
  }

  const userDomains = allowlist.filter(e => e.userAdded)
  const builtinDomains = allowlist.filter(e => !e.userAdded)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Trusted Domains</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Enter domain (e.g., example.com)"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button onClick={handleAdd} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {userDomains.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Your Trusted Domains</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {userDomains.map((entry) => (
                  <div key={entry.domain} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm font-mono">{entry.domain}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(entry.domain)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                Built-in Trusted Domains
                <Badge variant="secondary">{builtinDomains.length} domains</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {builtinDomains.map((entry) => (
                  <Badge key={entry.domain} variant="outline" className="font-mono text-xs">
                    {entry.domain}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
