import { Shield, Search, Smartphone, Clipboard, Building, Phone, Mail } from "lucide-react"
import { AppHeader } from "@/components/layout/app-header"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    icon: Search,
    title: "Real-time Scanning",
    description: "Instant URL analysis using multiple security databases and AI-powered threat detection"
  },
  {
    icon: Shield,
    title: "Mobile Protection",
    description: "Intercepts and blocks malicious links before they can open in your mobile browser"
  },
  {
    icon: Smartphone,
    title: "Background Protection",
    description: "Continuously monitors clipboard and system-wide URL actions for threats"
  },
  {
    icon: Clipboard,
    title: "Safe History",
    description: "Track your verified safe links for easy access and quick re-opening"
  }
]

export default function About() {
  const handleCall = () => {
    window.open('tel:08113476790')
  }

  const handleEmail = () => {
    window.open('mailto:chikajoel01@gmail.com')
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      
      <div className="p-4 space-y-6 max-w-lg mx-auto">
        {/* App Info Section */}
        <div className="text-center space-y-4">
          <div className="bg-primary rounded-3xl p-8 mx-auto w-fit">
            <Shield className="h-16 w-16 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary">iURL</h1>
            <p className="text-muted-foreground">Smart Link Protection App</p>
          </div>
        </div>

        {/* About Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>About iURL</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              iURL is a comprehensive mobile link safety checker that protects you from malicious websites, 
              phishing attempts, and harmful content. Our advanced scanning technology analyzes URLs in 
              real-time to ensure your mobile browsing safety.
            </p>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="space-y-4">
          {features.map((feature, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-muted rounded-lg p-2 mt-1">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-primary" />
              <span>Contact Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
              <Building className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Company</p>
                <p className="text-sm text-muted-foreground">D.novit inc.</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">08113476790</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">chikajoel01@gmail.com</p>
              </div>
            </div>
            
            <div className="flex space-x-3 pt-2">
              <Button onClick={handleCall} className="flex-1">
                <Phone className="mr-2 h-4 w-4" />
                Call
              </Button>
              <Button onClick={handleEmail} variant="outline" className="flex-1">
                <Mail className="mr-2 h-4 w-4" />
                Email
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-2 pt-4">
          <p className="text-xs text-muted-foreground">© 2025 D.novit inc. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">iURL Mobile App • Version 1.0.0</p>
          <p className="text-xs text-muted-foreground">Powered by Advanced AI Security</p>
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}