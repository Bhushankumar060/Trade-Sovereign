import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import AppLayout from '../components/layout/AppLayout';
import { Card, Button, Input, Label, Badge, Spinner } from '../components/ui/DesignSystem';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile } from '../lib/api';
import { formatDate } from '../lib/utils';
import { User, Mail, Calendar, Crown, Lock, Edit2, Check } from 'lucide-react';

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.displayName || '');

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      setEditing(false);
      window.location.reload();
    }
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
          <p className="text-gray-400 mb-8 max-w-md">Access your profile and account settings.</p>
          <Link to="/login"><Button>Sign In</Button></Link>
        </div>
      </AppLayout>
    );
  }

  const handleSave = () => {
    updateMutation.mutate({ displayName: name });
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl" data-testid="profile">
        <h1 className="text-3xl font-display font-bold mb-8">Your Profile</h1>

        <Card className="relative overflow-hidden" hover3d>
          {/* Background Glow */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            {/* Avatar & Name */}
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-8 border-b border-white/10">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <User className="w-12 h-12 text-black" />
              </div>
              <div className="text-center sm:text-left flex-1">
                {editing ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="max-w-xs"
                      placeholder="Your name"
                    />
                    <Button size="sm" onClick={handleSave} isLoading={updateMutation.isPending}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-display font-bold text-white">
                      {user.displayName || 'Unnamed Trader'}
                    </h2>
                    <button
                      onClick={() => { setName(user.displayName || ''); setEditing(true); }}
                      className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                  <Badge variant={user.role === 'admin' ? 'success' : 'outline'}>
                    <Crown className="w-3 h-3 mr-1" />
                    {user.role === 'admin' ? 'Admin' : 'Member'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                <Mail className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Email</p>
                  <p className="text-white">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                <Crown className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Loyalty Points</p>
                  <p className="text-white text-xl font-bold">{user.loyaltyPoints || 0} PTS</p>
                </div>
              </div>

              {user.createdAt && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Member Since</p>
                    <p className="text-white">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="mt-8 pt-8 border-t border-white/10 flex flex-wrap gap-3">
              <Link to="/orders"><Button variant="glass" size="sm">View Orders</Button></Link>
              <Link to="/rewards"><Button variant="glass" size="sm">Rewards Center</Button></Link>
              <Link to="/subscriptions"><Button variant="glass" size="sm">Manage Subscription</Button></Link>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
