import { Shield, Lock, Eye, Database } from "lucide-react"
import { AppHeader } from "@/components/layout/app-header"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      
      <div className="p-4 space-y-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-primary">Privacy Policy</h1>

        {/* Privacy Statement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>Our Privacy Commitment</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              At iURL, we are committed to protecting your privacy and ensuring your data remains secure. 
              We believe in transparency and want you to understand exactly how we handle your information.
            </p>
          </CardContent>
        </Card>

        {/* Data Collection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-primary" />
              <span>Data Collection</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">What We Collect:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• URLs you choose to scan for security analysis</li>
                <li>• Usage statistics (number of links checked, threats blocked)</li>
                <li>• App performance data for improving our service</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">What We DON'T Collect:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
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
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="h-5 w-5 text-primary" />
              <span>Data Protection</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong>Local Storage Only:</strong> Your safe link history and preferences are stored 
              locally on your device and are never transmitted to external servers.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong>Encrypted Communication:</strong> When we analyze URLs for threats, all 
              communication is encrypted and secure.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>No Third-Party Sharing:</strong> We do not share, sell, or distribute your 
              data to any third-party services or advertisers.
            </p>
          </CardContent>
        </Card>

        {/* Privacy Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-primary" />
              <span>Your Privacy Controls</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-muted-foreground">
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

        {/* Contact */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              If you have any questions about our privacy practices, please contact us at{' '}
              <a href="mailto:chikajoel01@gmail.com" className="text-primary underline">
                chikajoel01@gmail.com
              </a>
            </p>
          </CardContent>
        </Card>

        <div className="text-center pt-4">
          <p className="text-xs text-muted-foreground">Last updated: January 2025</p>
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}