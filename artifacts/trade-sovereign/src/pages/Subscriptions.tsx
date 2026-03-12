import { AppLayout } from "@/components/layout/AppLayout";
import { Button, Card, Badge } from "@/components/ui/design-system";
import { useListSubscriptionPlans, useCreatePaymentOrder, CreateOrderRequestType } from "@workspace/api-client-react";
import { Check, Shield, Zap } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function Subscriptions() {
  const { data } = useListSubscriptionPlans();
  const createOrder = useCreatePaymentOrder();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubscribe = async (planId: string) => {
    if (!user) {
       toast({ title: "Authentication required", variant: "destructive" });
       return;
    }
    
    try {
      const orderRes = await createOrder.mutateAsync({
        data: {
          items: [],
          type: CreateOrderRequestType.subscription,
          subscriptionPlan: planId
        }
      });

      if (!(window as any).Razorpay) {
        toast({ title: "Payment gateway initializing...", description: "Please wait." });
        return;
      }

      const options = {
        key: orderRes.keyId,
        amount: orderRes.amount,
        currency: orderRes.currency,
        name: "Trade Sovereign",
        description: "Plan Subscription",
        order_id: orderRes.razorpayOrderId,
        handler: async function (response: any) {
          try {
            await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${window.__FIREBASE_TOKEN__}` },
              body: JSON.stringify({
                orderId: orderRes.orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              })
            });
            toast({ title: "Upgraded Successfully!", description: "Welcome to the new tier." });
          } catch (e) {
            toast({ title: "Verification Failed", variant: "destructive" });
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (e: any) {
      toast({ title: "Failed to initialize checkout", description: e.message, variant: "destructive" });
    }
  };

  // Fallback data if endpoint is unseeded
  const plans = data?.plans?.length ? data.plans : [
    { id: "free", name: "Initiate", price: 0, yearlyPrice: 0, isPopular: false, features: ["Basic Telemetry", "Standard Marketplace Access", "Community Support"] },
    { id: "pro", name: "Sovereign Pro", price: 9.99, yearlyPrice: 99.99, isPopular: true, features: ["Advanced TradingView Integration", "Gemini AI Trade Analysis", "Priority Media Access", "Zero-fee transactions"] },
    { id: "elite", name: "Elite Syndicate", price: 24.99, yearlyPrice: 249.99, isPopular: false, features: ["Everything in Pro", "Algorithmic execution API", "Exclusive Hardware Drops", "Dedicated Account Manager"] }
  ];

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4"><Zap className="w-3 h-3 mr-2 text-primary" /> Network Access Tiers</Badge>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">Elevate Your Command</h1>
          <p className="text-xl text-muted-foreground">Select the infrastructure tier that matches your operational requirements.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.id} className={`relative flex flex-col ${plan.isPopular ? 'border-primary/50 shadow-[0_0_30px_rgba(6,182,212,0.15)] bg-card/80' : 'bg-card/40'}`}>
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground border-none px-4 py-1 uppercase tracking-widest font-bold">Most Tactical</Badge>
                </div>
              )}
              
              <div className="text-center p-6 border-b border-white/5">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-display font-bold">{formatCurrency(plan.price)}</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
              </div>

              <div className="p-6 flex-1">
                <ul className="space-y-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-300">
                      <Check className="w-5 h-5 text-primary shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 mt-auto">
                <Button 
                  variant={plan.isPopular ? "primary" : "glass"} 
                  className="w-full"
                  onClick={() => handleSubscribe(plan.id)}
                >
                  Deploy {plan.name}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
