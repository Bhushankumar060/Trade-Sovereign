import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Badge } from '../ui/DesignSystem';
import { formatCurrency } from '../../lib/utils';
import { createPaymentOrder, verifyPayment } from '../../lib/api';
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, total, clearCart } = useCart();
  const { user } = useAuth();

  const handleCheckout = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    if (items.length === 0) return;

    try {
      const orderData = await createPaymentOrder({
        items: items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          type: item.type
        })),
        type: items[0].type
      });

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Trade Sovereign',
        description: 'Purchase',
        order_id: orderData.razorpayOrderId,
        handler: async function(response) {
          try {
            await verifyPayment({
              orderId: orderData.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });
            clearCart();
            setIsOpen(false);
            alert('Payment successful! Thank you for your purchase.');
            window.location.href = '/orders';
          } catch (err) {
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          email: user.email,
          name: user.displayName || ''
        },
        theme: {
          color: '#22d3ee'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Failed to create order. Please try again.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md glass-panel z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-cyan-400" />
                <h2 className="font-display font-bold text-lg">Your Cart</h2>
                <Badge variant="default">{items.length} items</Badge>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"
                data-testid="close-cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                  <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
                  <p>Your cart is empty</p>
                  <p className="text-sm mt-1">Add items to get started</p>
                </div>
              ) : (
                items.map(item => (
                  <div
                    key={`${item.id}-${item.type}`}
                    className="flex gap-4 p-3 rounded-xl bg-white/5 border border-white/5"
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-cyan-400/20 to-blue-500/20 flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 text-cyan-400/50" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate">
                        {item.title}
                      </h3>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {item.type}
                      </Badge>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-cyan-400 font-semibold">
                          {formatCurrency(item.salePrice || item.price)}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.type, item.quantity - 1)}
                            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-mono">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.type, item.quantity + 1)}
                            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeItem(item.id, item.type)}
                            className="w-7 h-7 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-gray-400 hover:text-red-400 ml-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-4 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-2xl font-display font-bold text-white">
                    {formatCurrency(total)}
                  </span>
                </div>
                <Button
                  onClick={handleCheckout}
                  className="w-full"
                  data-testid="checkout-button"
                >
                  Proceed to Checkout
                </Button>
                <button
                  onClick={clearCart}
                  className="w-full text-sm text-gray-400 hover:text-red-400 transition-colors"
                >
                  Clear Cart
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
