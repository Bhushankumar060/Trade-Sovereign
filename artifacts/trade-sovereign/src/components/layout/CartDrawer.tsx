import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/design-system";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useCreatePaymentOrder, CreateOrderRequestType } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

export function CartDrawer() {
  const { items, itemDetails, isOpen, setIsOpen, updateQuantity, removeItem, total, clearCart } = useCart();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const createOrder = useCreatePaymentOrder();

  const handleCheckout = async () => {
    if (!user) {
      toast({ title: "Authentication required", description: "Please sign in to checkout", variant: "destructive" });
      setIsOpen(false);
      setLocation("/login");
      return;
    }

    try {
      // 1. Create order on backend
      const orderRes = await createOrder.mutateAsync({
        data: {
          items: items.map(i => ({ id: i.id, quantity: i.quantity, type: i.type })),
          type: CreateOrderRequestType.product // Mixed carts default to product in this implementation
        }
      });

      // 2. Load Razorpay script if not loaded
      if (!(window as any).Razorpay) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = resolve;
          document.body.appendChild(script);
        });
      }

      // 3. Open Razorpay
      const options = {
        key: orderRes.keyId,
        amount: orderRes.amount,
        currency: orderRes.currency,
        name: "Trade Sovereign",
        description: "Order Checkout",
        order_id: orderRes.razorpayOrderId,
        handler: async function (response: any) {
          try {
            // 4. Verify payment
            const res = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${window.__FIREBASE_TOKEN__}` },
              body: JSON.stringify({
                orderId: orderRes.orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              })
            });
            const data = await res.json();
            if (data.success) {
              toast({ title: "Payment Successful!", description: "Your order has been placed." });
              clearCart();
              setIsOpen(false);
              setLocation("/orders");
            } else {
              throw new Error("Verification failed");
            }
          } catch (e) {
            toast({ title: "Payment Verification Failed", variant: "destructive" });
          }
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: "#06B6D4"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error: any) {
      toast({ title: "Checkout Failed", description: error.message, variant: "destructive" });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" 
            onClick={() => setIsOpen(false)} 
          />
          <motion.div 
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 20 }}
            className="fixed right-0 top-0 h-full w-full max-w-md glass-panel z-[101] flex flex-col border-l border-white/10"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-display font-bold flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" /> 
                Your Cart
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {items.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                  <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
                  <p>Your cart is empty</p>
                  <Button variant="glass" className="mt-4" onClick={() => setIsOpen(false)}>Continue Shopping</Button>
                </div>
              ) : (
                items.map((item) => {
                  const detail = itemDetails[item.id];
                  if (!detail) return null;
                  return (
                    <div key={item.id} className="flex gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                      <div className="w-20 h-20 rounded-lg bg-black/40 overflow-hidden flex-shrink-0">
                        {detail.imageUrl ? (
                          <img src={detail.imageUrl} alt={detail.name || (detail as any).title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No img</div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-medium text-sm line-clamp-2">{detail.name || (detail as any).title}</h4>
                          <p className="text-primary font-semibold mt-1">{formatCurrency(detail.price)}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2 bg-black/40 rounded-lg p-1">
                            <button className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded text-muted-foreground hover:text-white transition-colors" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-medium w-4 text-center">{item.quantity}</span>
                            <button className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded text-muted-foreground hover:text-white transition-colors" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button className="text-xs text-destructive hover:underline" onClick={() => removeItem(item.id)}>Remove</button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t border-white/10 bg-black/20">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-2xl font-bold text-white">{formatCurrency(total)}</span>
                </div>
                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={handleCheckout}
                  isLoading={createOrder.isPending}
                >
                  Checkout Securely
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
