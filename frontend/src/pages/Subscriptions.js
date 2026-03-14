import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import AppLayout from '../components/layout/AppLayout';
import { Card, Button, Badge, Spinner } from '../components/ui/DesignSystem';
import { useAuth } from '../contexts/AuthContext';
import { listSubscriptionPlans, getMySubscription, createPaymentOrder, verifyPayment } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { Check, Crown, Zap, Shield, Star } from 'lucide-react';

export default function Subscriptions() {
  const { user } = useAuth();

  const { data: plansData, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: listSubscriptionPlans,
  });

  const { data: mySub } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: getMySubscription,
    enabled: !!user,
  });

  const plans = plansData?.plans || [];

  const handleSubscribe = async (plan) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    try {
      const orderData = await createPaymentOrder({
        items: [{ id: plan.id, quantity: 1, type: 'product' }],
        type: 'subscription',
        subscriptionPlan: plan.id
      });

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Trade Sovereign',
        description: `${plan.name} Subscription`,
        order_id: orderData.razorpayOrderId,
        handler: async function(response) {
          try {
            await verifyPayment({
              orderId: orderData.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });
            alert('Subscription activated! Welcome to ' + plan.name);
            window.location.reload();
          } catch (err) {
            alert('Payment verification failed');
          }
        },
        prefill: {
          email: user.email,
          name: user.displayName || ''
        },
        theme: { color: '#22d3ee' }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error('Subscription error:', err);
      alert('Failed to create subscription order');
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8" data-testid="subscriptions">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 px-4 py-1">
            <Crown className="w-3 h-3 mr-2" />
            Premium Plans
          </Badge>
          <h1 className="text-3xl md:text-5xl font-display font-bold mb-4">
            Elevate Your <span className="text-gradient-primary">Trading</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Choose the perfect plan for your trading journey. Unlock advanced features, AI insights, and exclusive content.
          </p>

          {mySub && mySub.planType !== 'free' && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-400">
              <Shield className="w-4 h-4" />
              <span>Current Plan: <strong className="uppercase">{mySub.planType}</strong></span>
            </div>
          )}
        </div>

        {/* Plans */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400">No subscription plans available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, idx) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card
                  className={`h-full flex flex-col relative ${
                    plan.isPopular ? 'border-cyan-400/50 bg-cyan-400/5' : ''
                  }`}
                  hover3d
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-cyan-400 text-black border-0 px-4">
                        <Star className="w-3 h-3 mr-1" fill="currentColor" />
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <div className="text-center mb-6 pt-4">
                    <h3 className="text-2xl font-display font-bold mb-2">{plan.name}</h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-cyan-400">{formatCurrency(plan.price)}</span>
                      <span className="text-gray-400">/month</span>
                    </div>
                    {plan.yearlyPrice && (
                      <p className="text-sm text-gray-500 mt-1">
                        or {formatCurrency(plan.yearlyPrice)}/year (save 20%)
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 flex-1 mb-6">
                    {plan.features?.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <Check className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSubscribe(plan)}
                    variant={plan.isPopular ? 'primary' : 'glass'}
                    className="w-full"
                    disabled={mySub?.planType?.toLowerCase() === plan.name.toLowerCase()}
                  >
                    {mySub?.planType?.toLowerCase() === plan.name.toLowerCase() ? (
                      'Current Plan'
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Get {plan.name}
                      </>
                    )}
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
