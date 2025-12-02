import { Shield, Lock, Eye, Database, Building, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AppHeader } from "@/components/layout/app-header"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Privacy() {
  const handleCall = () => {
    window.open('tel:08113476790')
  }

  const handleEmail = () => {
    window.open('mailto:dnovitcorporation@gmail.com')
  }

  return (
    <div className="min-h-screen bg-background pb-16 flex flex-col">
      <AppHeader />
      
      <div className="p-3 space-y-4 max-w-lg mx-auto text-center flex-1 flex flex-col justify-center">
        <h1 className="text-xl font-bold text-primary">Privacy Policy</h1>

        {/* Privacy Statement */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-base">
              <Shield className="h-4 w-4 text-primary" />
              <span>Our Privacy Commitment</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              At iURL, we are committed to protecting your privacy and ensuring your data remains secure. 
              We believe in transparency and want you to understand exactly how we handle your information.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
              <strong className="text-primary">Important:</strong> Any data gathered from your clipboard or 
              link scanning is processed entirely on your device and is NOT shared with any external entity, 
              including the developers. Your privacy is our top priority.
            </p>
          </CardContent>
        </Card>

        {/* Data Collection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-base">
              <Database className="h-4 w-4 text-primary" />
              <span>Data Collection</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div>
              <h3 className="text-sm font-semibold mb-1.5">What We Collect:</h3>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• URLs you choose to scan for security analysis</li>
                <li>• Usage statistics (number of links checked, threats blocked)</li>
                <li>• App performance data for improving our service</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold mb-1.5">What We DON'T Collect:</h3>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• Personal information or contact details</li>
                <li>• Clipboard contents without your explicit action</li>
                <li>• Location data or device identifiers</li>
                <li>• Browsing history from other apps</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Data Protection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-base">
              <Lock className="h-4 w-4 text-primary" />
              <span>Data Protection</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              <strong>Local Storage Only:</strong> Your safe link history and preferences are stored 
              locally on your device and are never transmitted to external servers.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              <strong>Encrypted Communication:</strong> When we analyze URLs for threats, all 
              communication is encrypted and secure.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>No Third-Party Sharing:</strong> We do not share, sell, or distribute your 
              data to any third-party services or advertisers.
            </p>
          </CardContent>
        </Card>

        {/* Privacy Features */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-base">
              <Eye className="h-4 w-4 text-primary" />
              <span>Your Privacy Controls</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start space-x-2">
                <span className="text-primary">•</span>
                <span>You can clear your history at any time from the History page</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary">•</span>
                <span>Real-time protection can be disabled if you prefer manual scanning only</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary">•</span>
                <span>All data is deleted when you uninstall the app</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary">•</span>
                <span>No account creation means no personal data stored on our servers</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-base">
              <Mail className="h-4 w-4 text-primary" />
              <span>Contact Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="flex items-center space-x-2.5 p-2.5 bg-muted rounded-lg">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium">Company</p>
                <p className="text-[10px] text-muted-foreground">D.novit inc.</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2.5 p-2.5 bg-muted rounded-lg">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium">Phone</p>
                <p className="text-[10px] text-muted-foreground">08113476790</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2.5 p-2.5 bg-muted rounded-lg">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium">Email</p>
                <p className="text-[10px] text-muted-foreground">dnovitcorporation@gmail.com</p>
              </div>
            </div>
            
            <div className="flex space-x-2.5 pt-1.5">
              <Button onClick={handleCall} variant="outline" className="flex-1 h-8 text-xs">
                <Phone className="mr-1.5 h-3.5 w-3.5" />
                Call
              </Button>
              <Button onClick={handleEmail} variant="outline" className="flex-1 h-8 text-xs">
                <Mail className="mr-1.5 h-3.5 w-3.5" />
                Email
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center pt-3">
          <p className="text-[10px] text-muted-foreground">Last updated: January 2025</p>
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}