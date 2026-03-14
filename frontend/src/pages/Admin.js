import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import AppLayout from '../components/layout/AppLayout';
import { Card, Button, Input, Label, Badge, Spinner } from '../components/ui/DesignSystem';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  adminGetStats, adminGetAnalytics, adminListProducts, adminCreateProduct, adminDeleteProduct,
  adminListCategories, adminCreateCategory, adminDeleteCategory,
  adminListMedia, adminCreateMedia,
  adminListUsers, adminUpdateUserRole,
  adminListSubscriptionPlans, adminCreateSubscriptionPlan, adminDeleteSubscriptionPlan,
  adminGetAiSettings, adminUpdateAiSettings
} from '../lib/api';
import {
  LayoutDashboard, Package, Film, Users, Settings, Crown, Shield, Lock,
  Plus, Trash2, BarChart3, TrendingUp, DollarSign, ShoppingBag, Bot, FileText
} from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'media', label: 'Media', icon: Film },
  { id: 'categories', label: 'Categories', icon: ShoppingBag },
  { id: 'pages', label: 'Pages', icon: FileText },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'subscriptions', label: 'Plans', icon: Crown },
  { id: 'ai', label: 'AI Config', icon: Bot },
];

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
          <Lock className="w-20 h-20 text-red-400 mb-6" />
          <h1 className="text-3xl font-display font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-8 max-w-md">You don't have permission to access the Admin Panel.</p>
          <Link to="/dashboard"><Button variant="glass">Back to Dashboard</Button></Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8" data-testid="admin-panel">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-cyan-400" />
              <h1 className="text-3xl font-display font-bold">Admin Panel</h1>
            </div>
            <p className="text-gray-400">Manage your Trade Sovereign platform</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {TABS.map(tab => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'primary' : 'glass'}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'media' && <MediaTab />}
        {activeTab === 'categories' && <CategoriesTab />}
        {activeTab === 'pages' && <PagesTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'subscriptions' && <SubscriptionsTab />}
        {activeTab === 'ai' && <AiConfigTab />}
      </div>
    </AppLayout>
  );
}

function OverviewTab() {
  const { data: stats, isLoading } = useQuery({ queryKey: ['admin-stats'], queryFn: adminGetStats });
  const { data: analytics } = useQuery({ queryKey: ['admin-analytics'], queryFn: () => adminGetAnalytics('30d') });

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'from-cyan-400 to-blue-500' },
          { label: 'Total Orders', value: stats?.totalOrders || 0, icon: ShoppingBag, color: 'from-purple-400 to-pink-500' },
          { label: 'Revenue', value: formatCurrency(stats?.totalRevenue || 0), icon: DollarSign, color: 'from-emerald-400 to-teal-500' },
          { label: 'Products', value: stats?.totalProducts || 0, icon: Package, color: 'from-amber-400 to-orange-500' },
        ].map((stat, idx) => (
          <Card key={idx} hover3d>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5 text-black" />
            </div>
            <p className="text-gray-400 text-sm">{stat.label}</p>
            <p className="text-2xl font-display font-bold text-white">{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          Recent Orders
        </h3>
        <div className="space-y-2">
          {(stats?.recentOrders || []).slice(0, 5).map((order, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div>
                <p className="font-mono text-sm text-white">#{order.id?.slice(-8)}</p>
                <p className="text-xs text-gray-500">{order.createdAt && formatDate(order.createdAt)}</p>
              </div>
              <Badge variant={order.status === 'paid' ? 'success' : 'warning'}>{order.status}</Badge>
              <span className="text-cyan-400 font-semibold">{formatCurrency(order.total)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ProductsTab() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-products'], queryFn: adminListProducts });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: '', stock: '0', imageUrl: '', isDigital: false });

  const createMutation = useMutation({
    mutationFn: adminCreateProduct,
    onSuccess: () => { queryClient.invalidateQueries(['admin-products']); setShowForm(false); setForm({ name: '', description: '', price: '', category: '', stock: '0', imageUrl: '', isDigital: false }); }
  });

  const deleteMutation = useMutation({
    mutationFn: adminDeleteProduct,
    onSuccess: () => queryClient.invalidateQueries(['admin-products'])
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...form, price: parseFloat(form.price), stock: parseInt(form.stock) });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold">Products ({data?.products?.length || 0})</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />{showForm ? 'Cancel' : 'Add Product'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div><Label>Price</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required /></div>
            <div><Label>Category</Label><Input value={form.category} onChange={e => setForm({...form, category: e.target.value})} /></div>
            <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} /></div>
            <div><Label>Image URL</Label><Input value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} /></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={form.isDigital} onChange={e => setForm({...form, isDigital: e.target.checked})} /><span className="text-sm text-gray-400">Digital Product</span></div>
            <div className="md:col-span-2"><Label>Description</Label><Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div className="md:col-span-2"><Button type="submit" isLoading={createMutation.isPending}>Create Product</Button></div>
          </form>
        </Card>
      )}

      {isLoading ? <Spinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data?.products || []).map(product => (
            <Card key={product.id} className="flex flex-col">
              {product.imageUrl && <img src={product.imageUrl} alt={product.name} className="w-full h-32 object-cover rounded-lg mb-3" />}
              <h4 className="font-semibold text-white mb-1">{product.name}</h4>
              <p className="text-sm text-gray-400 mb-2">{product.category}</p>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-cyan-400 font-bold">{formatCurrency(product.price)}</span>
                <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(product.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function MediaTab() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-media'], queryFn: adminListMedia });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'music', price: '', description: '', imageUrl: '', fileUrl: '' });

  const createMutation = useMutation({
    mutationFn: adminCreateMedia,
    onSuccess: () => { queryClient.invalidateQueries(['admin-media']); setShowForm(false); setForm({ title: '', type: 'music', price: '', description: '', imageUrl: '', fileUrl: '' }); }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...form, price: parseFloat(form.price) });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold">Media Items ({data?.items?.length || 0})</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" />{showForm ? 'Cancel' : 'Add Media'}</Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></div>
            <div><Label>Type</Label><select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full h-12 rounded-xl bg-black/20 border border-white/10 px-4 text-white"><option value="music">Music</option><option value="movie">Course</option></select></div>
            <div><Label>Price</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required /></div>
            <div><Label>Image URL</Label><Input value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} /></div>
            <div className="md:col-span-2"><Label>Description</Label><Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div className="md:col-span-2"><Button type="submit" isLoading={createMutation.isPending}>Create Media</Button></div>
          </form>
        </Card>
      )}

      {isLoading ? <Spinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data?.items || []).map(item => (
            <Card key={item.id}>
              {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="w-full h-32 object-cover rounded-lg mb-3" />}
              <Badge variant={item.type === 'music' ? 'default' : 'outline'} className="mb-2">{item.type}</Badge>
              <h4 className="font-semibold text-white">{item.title}</h4>
              <span className="text-cyan-400 font-bold">{formatCurrency(item.price)}</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoriesTab() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-categories'], queryFn: adminListCategories });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '' });

  const createMutation = useMutation({
    mutationFn: adminCreateCategory,
    onSuccess: () => { queryClient.invalidateQueries(['admin-categories']); setShowForm(false); setForm({ name: '', slug: '' }); }
  });

  const deleteMutation = useMutation({
    mutationFn: adminDeleteCategory,
    onSuccess: () => queryClient.invalidateQueries(['admin-categories'])
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold">Categories ({data?.categories?.length || 0})</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" />{showForm ? 'Cancel' : 'Add Category'}</Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="flex gap-4">
            <div className="flex-1"><Label>Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} required /></div>
            <div className="flex-1"><Label>Slug</Label><Input value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} required /></div>
            <div className="flex items-end"><Button type="submit" isLoading={createMutation.isPending}>Add</Button></div>
          </form>
        </Card>
      )}

      {isLoading ? <Spinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(data?.categories || []).map(cat => (
            <Card key={cat.id} className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-white">{cat.name}</h4>
                <p className="text-xs text-gray-400">{cat.productCount} products</p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(cat.id)}><Trash2 className="w-4 h-4" /></Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function UsersTab() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-users'], queryFn: adminListUsers });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }) => adminUpdateUserRole(id, { role }),
    onSuccess: () => queryClient.invalidateQueries(['admin-users'])
  });

  return (
    <div>
      <h3 className="font-semibold mb-6">Users ({data?.users?.length || 0})</h3>
      {isLoading ? <Spinner /> : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-3 text-gray-400">Email</th>
                <th className="text-left p-3 text-gray-400">Name</th>
                <th className="text-left p-3 text-gray-400">Role</th>
                <th className="text-left p-3 text-gray-400">Points</th>
                <th className="text-left p-3 text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.users || []).map(u => (
                <tr key={u.id} className="border-b border-white/5">
                  <td className="p-3 text-white">{u.email}</td>
                  <td className="p-3 text-gray-400">{u.displayName || '-'}</td>
                  <td className="p-3"><Badge variant={u.role === 'admin' ? 'success' : 'outline'}>{u.role}</Badge></td>
                  <td className="p-3 text-cyan-400">{u.loyaltyPoints || 0}</td>
                  <td className="p-3">
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={() => updateRoleMutation.mutate({ id: u.id, role: u.role === 'admin' ? 'user' : 'admin' })}
                    >
                      {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function SubscriptionsTab() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-subscription-plans'], queryFn: adminListSubscriptionPlans });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', yearlyPrice: '', features: '', isPopular: false });

  const createMutation = useMutation({
    mutationFn: adminCreateSubscriptionPlan,
    onSuccess: () => { queryClient.invalidateQueries(['admin-subscription-plans']); setShowForm(false); setForm({ name: '', price: '', yearlyPrice: '', features: '', isPopular: false }); }
  });

  const deleteMutation = useMutation({
    mutationFn: adminDeleteSubscriptionPlan,
    onSuccess: () => queryClient.invalidateQueries(['admin-subscription-plans'])
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...form, price: parseFloat(form.price), yearlyPrice: parseFloat(form.yearlyPrice), features: form.features.split('\n').filter(Boolean) });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold">Subscription Plans ({data?.plans?.length || 0})</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" />{showForm ? 'Cancel' : 'Add Plan'}</Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Plan Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="e.g., Pro" /></div>
            <div><Label>Monthly Price</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required /></div>
            <div><Label>Yearly Price</Label><Input type="number" step="0.01" value={form.yearlyPrice} onChange={e => setForm({...form, yearlyPrice: e.target.value})} required /></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={form.isPopular} onChange={e => setForm({...form, isPopular: e.target.checked})} /><span className="text-sm text-gray-400">Mark as Popular</span></div>
            <div className="md:col-span-2"><Label>Features (one per line)</Label><textarea value={form.features} onChange={e => setForm({...form, features: e.target.value})} rows={4} className="w-full rounded-xl bg-black/20 border border-white/10 p-4 text-white text-sm" placeholder="Advanced AI insights&#10;Unlimited chat history&#10;Priority support" /></div>
            <div className="md:col-span-2"><Button type="submit" isLoading={createMutation.isPending}>Create Plan</Button></div>
          </form>
        </Card>
      )}

      {isLoading ? <Spinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(data?.plans || []).map(plan => (
            <Card key={plan.id}>
              {plan.isPopular && <Badge className="mb-2">Popular</Badge>}
              <h4 className="font-semibold text-xl text-white mb-2">{plan.name}</h4>
              <p className="text-cyan-400 font-bold text-2xl mb-4">{formatCurrency(plan.price)}<span className="text-gray-400 text-sm font-normal">/mo</span></p>
              <ul className="space-y-1 mb-4">
                {plan.features?.map((f, i) => <li key={i} className="text-sm text-gray-400">• {f}</li>)}
              </ul>
              <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(plan.id)}><Trash2 className="w-4 h-4 mr-2" />Delete</Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function PagesTab() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-pages'], queryFn: adminListPages });
  const [showForm, setShowForm] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [form, setForm] = useState({ title: '', slug: '', content: '', contentType: 'markdown', isPublished: false });

  React.useEffect(() => {
    if (editingPage) {
      setForm({
        title: editingPage.title || '',
        slug: editingPage.slug || '',
        content: editingPage.content || '',
        contentType: editingPage.contentType || 'markdown',
        isPublished: !!editingPage.isPublished,
      });
      setShowForm(true);
    }
  }, [editingPage]);

  const createMutation = useMutation({
    mutationFn: adminCreatePage,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-pages']);
      setShowForm(false);
      setEditingPage(null);
      setForm({ title: '', slug: '', content: '', contentType: 'markdown', isPublished: false });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => adminUpdatePage(editingPage?.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-pages']);
      setShowForm(false);
      setEditingPage(null);
      setForm({ title: '', slug: '', content: '', contentType: 'markdown', isPublished: false });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminDeletePage,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-pages']);
      if (editingPage) setEditingPage(null);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      title: form.title,
      slug: form.slug,
      content: form.content,
      contentType: form.contentType,
      isPublished: form.isPublished,
    };
    if (editingPage) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (page) => {
    setEditingPage(page);
  };

  const handleCancel = () => {
    setEditingPage(null);
    setShowForm(false);
    setForm({ title: '', slug: '', content: '', contentType: 'markdown', isPublished: false });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold">Pages ({data?.pages?.length || 0})</h3>
        <Button size="sm" onClick={() => { setShowForm(!showForm); setEditingPage(null); }}>
          <Plus className="w-4 h-4 mr-2" />{showForm ? 'Cancel' : 'Add Page'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} required /></div>
            <div>
              <Label>Content Type</Label>
              <select value={form.contentType} onChange={e => setForm({ ...form, contentType: e.target.value })} className="w-full h-12 rounded-xl bg-black/20 border border-white/10 px-4 text-white">
                <option value="markdown">Markdown</option>
                <option value="html">HTML</option>
              </select>
            </div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={form.isPublished} onChange={e => setForm({ ...form, isPublished: e.target.checked })} /><span className="text-sm text-gray-400">Published</span></div>
            <div className="md:col-span-2"><Label>Content</Label><textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={10} className="w-full rounded-xl bg-black/20 border border-white/10 p-4 text-white text-sm" /></div>
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>{editingPage ? 'Update Page' : 'Create Page'}</Button>
              {editingPage && <Button variant="glass" type="button" onClick={handleCancel}>Cancel</Button>}
            </div>
          </form>
        </Card>
      )}

      {isLoading ? <Spinner /> : (
        <div className="space-y-3">
          {(data?.pages || []).map(page => (
            <Card key={page.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold">{page.title}</span>
                  {page.isPublished ? <Badge variant="success">Published</Badge> : <Badge variant="outline">Draft</Badge>}
                </div>
                <p className="text-xs text-gray-400">/{page.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="glass" size="sm" onClick={() => handleEdit(page)}>Edit</Button>
                <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(page.id)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AiConfigTab() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-ai-settings'], queryFn: adminGetAiSettings });
  const [form, setForm] = useState({ modelName: '', promptTemplate: '' });

  React.useEffect(() => {
    if (data) {
      setForm({ modelName: data.modelName || '', promptTemplate: data.promptTemplate || '' });
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: adminUpdateAiSettings,
    onSuccess: () => queryClient.invalidateQueries(['admin-ai-settings'])
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  if (isLoading) return <Spinner />;

  return (
    <Card>
      <h3 className="font-semibold mb-6 flex items-center gap-2">
        <Bot className="w-5 h-5 text-cyan-400" />
        AI Configuration
      </h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label>Model Name</Label>
          <Input value={form.modelName} onChange={e => setForm({...form, modelName: e.target.value})} placeholder="gemini-3-flash-preview" />
          <p className="text-xs text-gray-500 mt-1">Supported: gemini-3-flash-preview, gemini-3-pro-preview</p>
        </div>
        <div>
          <Label>System Prompt Template</Label>
          <textarea
            value={form.promptTemplate}
            onChange={e => setForm({...form, promptTemplate: e.target.value})}
            rows={6}
            className="w-full rounded-xl bg-black/20 border border-white/10 p-4 text-white text-sm"
            placeholder="You are Trade Sovereign AI, an expert trading assistant..."
          />
        </div>
        <Button type="submit" isLoading={updateMutation.isPending}>Save Settings</Button>
      </form>
    </Card>
  );
}
