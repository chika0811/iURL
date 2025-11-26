import { AppHeader } from "@/components/layout/app-header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch active subscription
        const { data: sub, error: subError } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .single();

        if (subError && subError.code !== "PGRST116") {
          toast({ title: "Error fetching subscription", description: subError.message });
        }
        setSubscription(sub);

        // Fetch payment history
        const { data: paymentHistory, error: paymentError } = await supabase
          .from("payments")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (paymentError) {
          toast({ title: "Error fetching payment history", description: paymentError.message });
        }
        setPayments(paymentHistory || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [toast]);

  const handleCancelSubscription = async () => {
    if (!subscription) return;
    try {
      const { error } = await supabase.functions.invoke('cancel-subscription', {
        body: { subscriptionId: subscription.id },
      });
      if (error) throw error;
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been successfully cancelled.",
      });
      setSubscription(null); // Or refetch
    } catch (error: any) {
      toast({
        title: "Error Cancelling Subscription",
        description: error.message,
      });
    }
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
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Cancel Subscription</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will cancel your subscription, but you will retain access until the end of your current billing period.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Back</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancelSubscription}>
                        Confirm Cancellation
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : (
              <div className="text-center">
                <p>You don't have an active subscription.</p>
                <Button onClick={() => navigate("/pricing")} className="mt-4">View Plans</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {subscription && payments.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {payments.map((payment) => (
                  <li key={payment.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">
                        {payment.metadata?.plan_name || subscription.plan_name} - ${payment.amount}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-green-600 capitalize">
                      {payment.status}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </main>
      <BottomNavigation />
    </div>
  );
}
