import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Shield, Key, History } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import FloatingBubbles from "@/components/ui/floating-bubbles";

export default function Security() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: loginActivity } = useQuery({
    queryKey: ['login-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('login_activity')
        .select('*')
        .eq('success', true)
        .order('login_timestamp', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "Please make sure your new passwords match.",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been successfully changed.",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast({
        variant: "destructive",
        title: "Error updating password",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-2 relative">
      <FloatingBubbles />
      <div className="container max-auto max-w-4xl py-4 relative z-10">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 h-8"
          size="sm"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back
        </Button>

        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Security Settings</h1>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Key className="h-4 w-4" />
                Change Password
              </CardTitle>
              <CardDescription className="text-xs">
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="current-password" className="text-xs">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-password" className="text-xs">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className="text-xs">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    className="h-9 text-sm"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full h-9">
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4" />
                Recent Login Activity
              </CardTitle>
              <CardDescription className="text-xs">
                View your recent login history (last 10 logins)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loginActivity && loginActivity.length > 0 ? (
                <div className="space-y-2">
                  {loginActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex justify-between items-start p-2 bg-muted rounded-lg"
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium">
                          {format(new Date(activity.login_timestamp), "PPpp")}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Method: {activity.login_method}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          IP: {activity.ip_address}
                        </p>
                      </div>
                      <div className="text-[10px] text-muted-foreground max-w-[150px] truncate">
                        {activity.user_agent}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4 text-xs">
                  No login activity found
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
