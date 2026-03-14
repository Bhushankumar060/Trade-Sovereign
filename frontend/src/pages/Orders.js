import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import AppLayout from '../components/layout/AppLayout';
import { Card, Badge, Spinner } from '../components/ui/DesignSystem';
import { useAuth } from '../contexts/AuthContext';
import { listOrders } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { Package, Lock, ShoppingBag, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function Orders() {
  const { user, loading: authLoading } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: listOrders,
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
          <Lock className="w-16 h-16 text-cyan-400 mb-6 opacity-60" />
          <h1 className="text-3xl font-display font-bold mb-4">Sign In Required</h1>
          <p className="text-gray-400 mb-8 max-w-md">View your order history and manage purchases.</p>
          <Link to="/login"><Badge>Sign In</Badge></Link>
        </div>
      </AppLayout>
    );
  }

  const orders = data?.orders || [];

  const statusIcons = {
    pending: <Clock className="w-4 h-4" />,
    paid: <CheckCircle className="w-4 h-4" />,
    failed: <XCircle className="w-4 h-4" />,
    refunded: <XCircle className="w-4 h-4" />,
  };

  const statusVariants = {
    pending: 'warning',
    paid: 'success',
    failed: 'destructive',
    refunded: 'outline',
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8" data-testid="orders">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Order History</h1>
            <p className="text-gray-400">View and manage your purchases</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : orders.length === 0 ? (
          <Card className="text-center py-16">
            <ShoppingBag className="w-20 h-20 mx-auto mb-6 text-gray-600" />
            <h2 className="text-xl font-semibold mb-2">No Orders Yet</h2>
            <p className="text-gray-400 mb-6">Start shopping to see your orders here</p>
            <Link to="/marketplace">
              <Badge>Browse Marketplace</Badge>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order, idx) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="hover:border-white/10 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 flex items-center justify-center">
                        <Package className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <p className="font-mono text-sm text-gray-400">#{order.id.slice(-8)}</p>
                        <p className="text-xs text-gray-500">{order.createdAt && formatDate(order.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Badge variant={statusVariants[order.status]} className="flex items-center gap-1">
                        {statusIcons[order.status]}
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                      <span className="text-xl font-bold text-cyan-400">{formatCurrency(order.total)}</span>
                    </div>
                  </div>

                  {order.items && order.items.length > 0 && (
                    <div className="border-t border-white/5 pt-4">
                      <p className="text-sm text-gray-400 mb-2">{order.items.length} item(s)</p>
                      <div className="flex flex-wrap gap-2">
                        {order.items.map((item, i) => (
                          <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-gray-300">
                            {item.name} x{item.quantity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
