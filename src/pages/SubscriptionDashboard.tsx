import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, CreditCard, Calendar, TrendingUp } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import FloatingBubbles from "@/components/ui/floating-bubbles";

interface Subscription {
  id: string;
  plan_name: string;
  amount: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  created_at: string;
}

export default function SubscriptionDashboard() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }
    fetchSubscriptionData();
  };

  const fetchSubscriptionData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: subData, error: subError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError) throw subError;
      setSubscription(subData);

      const { data: paymentData, error: paymentError } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (paymentError) throw paymentError;
      setPayments(paymentData || []);
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast({
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;
    
    setCancelling(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const { error } = await supabase.functions.invoke("cancel-subscription", {
        body: { subscriptionId: subscription.id },
      });

      if (error) throw error;

      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled successfully.",
      });

      fetchSubscriptionData();
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast({
        title: "Error",
        description: error.message,
      });
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      pending: "secondary",
      cancelled: "outline",
      failed: "destructive",
    };
    return <Badge variant={variants[status] || "outline"} className="text-[10px]">{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 flex flex-col relative">
        <FloatingBubbles />
        <AppHeader />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col relative">
      <FloatingBubbles />
      <AppHeader />
      
      <main className="container mx-auto py-4 px-2 max-w-6xl flex-1 relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Subscription Dashboard</h1>
          <Button variant="outline" size="sm" onClick={() => navigate("/home")} className="h-8 text-xs">
            Back to Home
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 mb-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4" />
                Current Plan
              </CardTitle>
              <CardDescription className="text-xs">Your active subscription details</CardDescription>
            </CardHeader>
            <CardContent>
              {subscription ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">{subscription.plan_name}</span>
                    {getStatusBadge(subscription.status)}
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold">₦{subscription.amount}</span>
                  </div>
                  {subscription.start_date && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Start Date</span>
                      <span>{format(new Date(subscription.start_date), "MMM dd, yyyy")}</span>
                    </div>
                  )}
                  {subscription.end_date && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Renewal Date</span>
                      <span>{format(new Date(subscription.end_date), "MMM dd, yyyy")}</span>
                    </div>
                  )}
                  <div className="pt-2 space-y-2">
                    <Button 
                      className="w-full h-8 text-xs" 
                      onClick={() => navigate("/pricing")}
                    >
                      <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
                      Upgrade Plan
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full h-8 text-xs">
                          Cancel Subscription
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will cancel your subscription. You can always resubscribe later.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleCancelSubscription}
                            disabled={cancelling}
                          >
                            {cancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-xs mb-3">No active subscription</p>
                  <Button onClick={() => navigate("/pricing")} size="sm" className="h-8 text-xs">
                    View Plans
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Quick Stats
              </CardTitle>
              <CardDescription className="text-xs">Your subscription overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center p-2.5 bg-muted rounded-lg">
                <span className="text-muted-foreground text-xs">Total Payments</span>
                <span className="font-bold text-lg">{payments.length}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-muted rounded-lg">
                <span className="text-muted-foreground text-xs">Successful Payments</span>
                <span className="font-bold text-lg text-green-600">
                  {payments.filter(p => p.status === 'success').length}
                </span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-muted rounded-lg">
                <span className="text-muted-foreground text-xs">Status</span>
                <span className="font-bold text-lg">
                  {subscription?.status === 'active' ? '✓ Active' : '✗ Inactive'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Payment History</CardTitle>
            <CardDescription className="text-xs">Your recent payment transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Amount</TableHead>
                    <TableHead className="text-xs">Method</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="text-xs">
                        {format(new Date(payment.created_at), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="text-xs">
                        {payment.currency} {payment.amount}
                      </TableCell>
                      <TableCell className="text-xs">{payment.payment_method || 'N/A'}</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-xs">
                No payment history available
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      
      <BottomNavigation />
    </div>
  );
}
