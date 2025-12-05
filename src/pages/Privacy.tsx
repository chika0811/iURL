import { Shield, Lock, Eye, Database, Building, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AppHeader } from "@/components/layout/app-header"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import FloatingBubbles from "@/components/ui/floating-bubbles"

export default function Privacy() {
  const handleCall = () => {
    window.open('tel:08113476790')
  }

  const handleEmail = () => {
    window.open('mailto:dnovitcorporation@gmail.com')
  }

  return (
    <div className="min-h-screen bg-background pb-40 flex flex-col relative">
      <FloatingBubbles />
      <AppHeader />
      
      <div className="p-2 space-y-3 max-w-lg mx-auto text-center flex-1 flex flex-col justify-center relative z-10">
        <h1 className="text-lg font-bold text-primary">Privacy Policy</h1>

        <Card>
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="flex items-center space-x-2 text-sm">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span>Our Privacy Commitment</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-2">
              At iURL, we are committed to protecting your privacy and ensuring your data remains secure.
            </p>
            <p className="text-[10px] text-muted-foreground leading-relaxed font-semibold">
              <strong className="text-primary">Important:</strong> Any data gathered from your clipboard or 
              link scanning is processed entirely on your device and is NOT shared with any external entity.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="flex items-center space-x-2 text-sm">
              <Database className="h-3.5 w-3.5 text-primary" />
              <span>Data Collection</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0 pb-3">
            <div>
              <h3 className="text-xs font-semibold mb-1">What We Collect:</h3>
              <ul className="space-y-0.5 text-[10px] text-muted-foreground">
                <li>• URLs you choose to scan for security analysis</li>
                <li>• Usage statistics (links checked, threats blocked)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xs font-semibold mb-1">What We DON'T Collect:</h3>
              <ul className="space-y-0.5 text-[10px] text-muted-foreground">
                <li>• Personal information or contact details</li>
                <li>• Clipboard contents without your explicit action</li>
                <li>• Location data or device identifiers</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="flex items-center space-x-2 text-sm">
              <Lock className="h-3.5 w-3.5 text-primary" />
              <span>Data Protection</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-1.5">
              <strong>Local Storage Only:</strong> Your history and preferences are stored locally on your device.
            </p>
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-1.5">
              <strong>Encrypted Communication:</strong> All URL analysis communication is encrypted and secure.
            </p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              <strong>No Third-Party Sharing:</strong> We do not share, sell, or distribute your data.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="flex items-center space-x-2 text-sm">
              <Eye className="h-3.5 w-3.5 text-primary" />
              <span>Your Privacy Controls</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <ul className="space-y-1.5 text-[10px] text-muted-foreground">
              <li className="flex items-start space-x-1.5">
                <span className="text-primary">•</span>
                <span>Clear your history anytime from the History page</span>
              </li>
              <li className="flex items-start space-x-1.5">
                <span className="text-primary">•</span>
                <span>Disable real-time protection for manual scanning only</span>
              </li>
              <li className="flex items-start space-x-1.5">
                <span className="text-primary">•</span>
                <span>All data is deleted when you uninstall the app</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="flex items-center space-x-2 text-sm">
              <Mail className="h-3.5 w-3.5 text-primary" />
              <span>Contact Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0 pb-3">
            <div className="flex items-center space-x-2 p-2 bg-muted rounded-lg">
              <Building className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <p className="text-[10px] font-medium">Company</p>
                <p className="text-[9px] text-muted-foreground">D.novit inc.</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 p-2 bg-muted rounded-lg">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <p className="text-[10px] font-medium">Phone</p>
                <p className="text-[9px] text-muted-foreground">08113476790</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 p-2 bg-muted rounded-lg">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <p className="text-[10px] font-medium">Email</p>
                <p className="text-[9px] text-muted-foreground">dnovitcorporation@gmail.com</p>
              </div>
            </div>
            
            <div className="flex space-x-2 pt-1">
              <Button onClick={handleCall} variant="outline" className="flex-1 h-7 text-[10px]">
                <Phone className="mr-1 h-3 w-3" />
                Call
              </Button>
              <Button onClick={handleEmail} variant="outline" className="flex-1 h-7 text-[10px]">
                <Mail className="mr-1 h-3 w-3" />
                Email
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center pt-2">
          <p className="text-[9px] text-muted-foreground">Last updated: January 2025</p>
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}
