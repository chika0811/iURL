import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import iurlLogo from "@/assets/iurl-logo.png";
import FloatingBubbles from "@/components/ui/floating-bubbles";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showGuestWarning, setShowGuestWarning] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/home`
        }
      });

      if (error) throw error;

      toast({
        title: "Account created!",
        description: "Signing you in...",
      });
      
      // Auto sign in after signup
      setTimeout(async () => {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (!signInError) {
          navigate("/home");
        }
      }, 1000);
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast({
        title: "Sign up failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Track login activity
      if (data.user) {
        try {
          await supabase.functions.invoke('track-login-activity', {
            body: {
              user_id: data.user.id,
              login_method: 'email/password',
              success: true,
            },
          });
        } catch (trackError) {
          console.error('Error tracking login:', trackError);
        }
      }

      toast({
        title: "Welcome back!",
        description: "Successfully logged in.",
      });
      
      navigate("/home");
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast({
        title: "Sign in failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <FloatingBubbles />
      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-3">
          <div className="mx-auto w-fit">
            <img src={iurlLogo} alt="iURL Logo" className="h-16 w-16 rounded-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">iURL</h1>
            <p className="text-sm text-muted-foreground">Smart Link Protection</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Welcome</CardTitle>
            <CardDescription className="text-xs">Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-email" className="text-xs">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-password" className="text-xs">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-9 text-sm"
                    />
                  </div>
                  <Button type="submit" className="w-full h-9" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email" className="text-xs">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password" className="text-xs">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-9 text-sm"
                    />
                  </div>
                  <Button type="submit" className="w-full h-9" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign Up
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={() => setShowGuestWarning(true)}>
            Continue as Guest
          </Button>
        </div>

        <AlertDialog open={showGuestWarning} onOpenChange={setShowGuestWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Guest Mode Security Notice
              </AlertDialogTitle>
              <AlertDialogDescription className="text-left space-y-2">
                <p>Before continuing as a guest, please be aware:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Your scan history is stored only in your browser and is not backed up</li>
                  <li>Clearing browser data will permanently delete your history</li>
                  <li>You won't have access to subscription features or cloud sync</li>
                  <li>No audit trail for your scan activity</li>
                </ul>
                <p className="text-sm pt-2">For full features and data protection, please create an account.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Create Account</AlertDialogCancel>
              <AlertDialogAction onClick={() => navigate("/home")}>
                Continue as Guest
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
