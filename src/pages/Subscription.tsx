import { AppHeader } from "@/components/layout/app-header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Subscription() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: sub, error } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .single();
        if (error && error.code !== "PGRST116") {
          toast({
            title: "Error fetching subscription",
            description: error.message,
          });
        }
        setSubscription(sub);
      }
      setLoading(false);
    };
    fetchSubscription();
  }, [toast]);

  const handleManageSubscription = () => {
    // Redirect to a subscription management page or open a portal
    toast({
      title: "Manage Subscription",
      description: "Redirecting to subscription management...",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col">
      <AppHeader />
      <main className="container mx-auto p-4 max-w-2xl flex-1 flex flex-col justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Your Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading your subscription details...</p>
            ) : subscription ? (
              <div className="space-y-4">
                <p><strong>Plan:</strong> {subscription.plan_name}</p>
                <p><strong>Status:</strong> {subscription.status}</p>
                <p><strong>Renews on:</strong> {new Date(subscription.end_date).toLocaleDateString()}</p>
                <Button onClick={handleManageSubscription}>Manage Subscription</Button>
              </div>
            ) : (
              <div className="text-center">
                <p>You don't have an active subscription.</p>
                <Button onClick={() => navigate("/pricing")} className="mt-4">View Plans</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <BottomNavigation />
    </div>
  );
}
