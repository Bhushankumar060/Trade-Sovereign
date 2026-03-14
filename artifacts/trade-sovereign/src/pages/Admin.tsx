import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, Button, Input, Label, Badge } from "@/components/ui/design-system";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAdminGetStats, useAdminGetAnalytics,
  useAdminCreateProduct, useAdminListProducts, useAdminDeleteProduct, useAdminUpdateProduct,
  useAdminCreateMedia, useAdminListMedia,
  useAdminListUsers, useAdminUpdateUserRole,
  useAdminListCategories, useAdminCreateCategory, useAdminUpdateCategory, useAdminDeleteCategory,
  useAdminListPages, useAdminCreatePage, useAdminUpdatePage, useAdminDeletePage,
  useAdminGetAiSettings, useAdminUpdateAiSettings,
  useAdminListSubscriptionPlans, useAdminCreateSubscriptionPlan, useAdminDeleteSubscriptionPlan,
} from "@workspace/api-client-react";
import {
  Users, DollarSign, Package, Lock, Plus, Trash2, BarChart2,
  Settings, FileText, Tags, Brain, Crown, Film, ShieldCheck, Edit2, Check, X, RefreshCw, Tv
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

type Tab = "overview" | "products" | "media" | "users" | "categories" | "pages" | "ai" | "plans" | "analytics";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <BarChart2 className="w-4 h-4" /> },
  { id: "analytics", label: "Analytics", icon: <BarChart2 className="w-4 h-4" /> },
  { id: "products", label: "Products", icon: <Package className="w-4 h-4" /> },
  { id: "media", label: "Media Store", icon: <Film className="w-4 h-4" /> },
  { id: "users", label: "Users", icon: <Users className="w-4 h-4" /> },
  { id: "categories", label: "Categories", icon: <Tags className="w-4 h-4" /> },
  { id: "pages", label: "Pages", icon: <FileText className="w-4 h-4" /> },
  { id: "ai", label: "AI Settings", icon: <Brain className="w-4 h-4" /> },
  { id: "plans", label: "Sub Plans", icon: <Crown className="w-4 h-4" /> },
];

const CHART_COLORS = ["#22d3ee", "#6366f1", "#f59e0b", "#10b981", "#ef4444"];

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("overview");
  const isAdmin = user?.role === "admin";

  const { data: stats, refetch: refetchStats } = useAdminGetStats({ query: { queryKey: ["admin-stats"], enabled: isAdmin } });
  const { data: analytics, refetch: refetchAnalytics } = useAdminGetAnalytics({ period: "30d" }, { query: { queryKey: ["admin-analytics", "30d"], enabled: isAdmin && tab === "analytics" } });
  const { data: productsData, refetch: refetchProducts } = useAdminListProducts({ query: { queryKey: ["admin-products"], enabled: isAdmin } });
  const { data: mediaData, refetch: refetchMedia } = useAdminListMedia({ query: { queryKey: ["admin-media"], enabled: isAdmin } });
  const { data: usersData, refetch: refetchUsers } = useAdminListUsers({ query: { queryKey: ["admin-users"], enabled: isAdmin } });
  const { data: catsData, refetch: refetchCats } = useAdminListCategories({ query: { queryKey: ["admin-categories"], enabled: isAdmin } });
  const { data: pagesData, refetch: refetchPages } = useAdminListPages({ query: { queryKey: ["admin-pages"], enabled: isAdmin } });
  const { data: aiSettings, refetch: refetchAi } = useAdminGetAiSettings({ query: { queryKey: ["admin-ai-settings"], enabled: isAdmin } });
  const { data: plansData, refetch: refetchPlans } = useAdminListSubscriptionPlans({ query: { queryKey: ["admin-subscription-plans"], enabled: isAdmin } });

  const createProduct = useAdminCreateProduct();
  const deleteProduct = useAdminDeleteProduct();
  const createMedia = useAdminCreateMedia();
  const updateUserRole = useAdminUpdateUserRole();
  const createCategory = useAdminCreateCategory();
  const deleteCategory = useAdminDeleteCategory();
  const createPage = useAdminCreatePage();
  const deletePage = useAdminDeletePage();
  const updatePage = useAdminUpdatePage();
  const updateAi = useAdminUpdateAiSettings();
  const createPlan = useAdminCreateSubscriptionPlan();
  const deletePlan = useAdminDeleteSubscriptionPlan();

  const [productForm, setProductForm] = useState({ name: "", description: "", price: "", salePrice: "", category: "", tags: "", stock: "0", imageUrl: "", isDigital: true, isSubscription: false });
  const [mediaForm, setMediaForm] = useState({ title: "", type: "music", price: "", description: "", imageUrl: "", fileUrl: "", licenseType: "standard" });
  const [catForm, setCatForm] = useState({ name: "", slug: "" });
  const [pageForm, setPageForm] = useState({ title: "", slug: "", content: "", contentType: "markdown", isPublished: false });
  const [editingPage, setEditingPage] = useState<string | null>(null);
  const [aiForm, setAiForm] = useState({ modelName: "", promptTemplate: "", apiKey: "" });
  const [planForm, setPlanForm] = useState({ name: "", price: "", yearlyPrice: "", features: "", isPopular: false });

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
          <Lock className="w-24 h-24 text-destructive mb-6 opacity-80" />
          <h1 className="text-4xl font-display font-bold text-destructive mb-4">Access Denied</h1>
          <p className="text-muted-foreground max-w-md">Your security clearance is insufficient to access the admin mainframe.</p>
        </div>
      </AppLayout>
    );
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProduct.mutateAsync({ data: { name: productForm.name, description: productForm.description, price: Number(productForm.price), salePrice: productForm.salePrice ? Number(productForm.salePrice) : undefined, category: productForm.category, tags: productForm.tags ? productForm.tags.split(",").map(t => t.trim()).filter(Boolean) : [], stock: Number(productForm.stock), imageUrl: productForm.imageUrl || undefined, isDigital: productForm.isDigital, isSubscription: productForm.isSubscription } });
      toast({ title: "Asset Deployed" });
      setProductForm({ name: "", description: "", price: "", salePrice: "", category: "", tags: "", stock: "0", imageUrl: "", isDigital: true, isSubscription: false });
      refetchProducts();
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  const handleCreateMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMedia.mutateAsync({ data: { title: mediaForm.title, type: mediaForm.type as any, price: Number(mediaForm.price), description: mediaForm.description, imageUrl: mediaForm.imageUrl || undefined, fileUrl: mediaForm.fileUrl || undefined, licenseType: mediaForm.licenseType } });
      toast({ title: "Media Item Created" });
      setMediaForm({ title: "", type: "music", price: "", description: "", imageUrl: "", fileUrl: "", licenseType: "standard" });
      refetchMedia();
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCategory.mutateAsync({ data: { name: catForm.name, slug: catForm.slug || catForm.name.toLowerCase().replace(/\s+/g, "-") } });
      toast({ title: "Category Created" });
      setCatForm({ name: "", slug: "" });
      refetchCats();
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPage) {
        await updatePage.mutateAsync({ id: editingPage, data: { title: pageForm.title, slug: pageForm.slug, content: pageForm.content, contentType: pageForm.contentType as any, isPublished: pageForm.isPublished } });
        toast({ title: "Page Updated" });
        setEditingPage(null);
      } else {
        await createPage.mutateAsync({ data: { title: pageForm.title, slug: pageForm.slug, content: pageForm.content, contentType: pageForm.contentType as any, isPublished: pageForm.isPublished } });
        toast({ title: "Page Created" });
      }
      setPageForm({ title: "", slug: "", content: "", contentType: "markdown", isPublished: false });
      refetchPages();
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  const handleSaveAi = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateAi.mutateAsync({ data: { modelName: aiForm.modelName || undefined, promptTemplate: aiForm.promptTemplate || undefined, apiKey: aiForm.apiKey || undefined } });
      toast({ title: "AI Settings Saved" });
      setAiForm({ modelName: "", promptTemplate: "", apiKey: "" });
      refetchAi();
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPlan.mutateAsync({ data: { name: planForm.name, price: Number(planForm.price), yearlyPrice: Number(planForm.yearlyPrice || planForm.price), features: planForm.features.split("\n").map(f => f.trim()).filter(Boolean), isPopular: planForm.isPopular } });
      toast({ title: "Plan Created" });
      setPlanForm({ name: "", price: "", yearlyPrice: "", features: "", isPopular: false });
      refetchPlans();
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-primary">System Override</h1>
            <p className="text-muted-foreground text-sm">Trade Sovereign Admin Control Panel</p>
          </div>
          <Badge variant="success" className="gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Admin</Badge>
        </div>

        {/* Tab Nav */}
        <div className="flex gap-1 mb-8 overflow-x-auto pb-1 scrollbar-none glass-panel rounded-xl p-1.5">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-white hover:bg-white/5"}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: "Users", value: stats?.totalUsers ?? 0, icon: <Users className="w-5 h-5" />, color: "blue" },
                { label: "Revenue", value: formatCurrency(stats?.totalRevenue ?? 0), icon: <DollarSign className="w-5 h-5" />, color: "emerald" },
                { label: "Orders", value: stats?.totalOrders ?? 0, icon: <Package className="w-5 h-5" />, color: "violet" },
                { label: "Products", value: stats?.totalProducts ?? 0, icon: <Tv className="w-5 h-5" />, color: "amber" },
                { label: "Media", value: stats?.totalMediaItems ?? 0, icon: <Film className="w-5 h-5" />, color: "pink" },
                { label: "Subscriptions", value: stats?.activeSubscriptions ?? 0, icon: <Crown className="w-5 h-5" />, color: "cyan" },
              ].map(s => (
                <Card key={s.label} className="flex items-center gap-3 p-4">
                  <div className={`w-10 h-10 rounded-lg bg-${s.color}-500/10 flex items-center justify-center text-${s.color}-400 shrink-0`}>
                    {s.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <h3 className="text-xl font-bold truncate">{s.value}</h3>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-0 overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <h2 className="font-bold">Recent Orders</h2>
                <Badge variant="outline">{stats?.recentOrders?.length ?? 0} orders</Badge>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground uppercase bg-black/30 border-b border-white/5">
                    <tr>
                      {["Order ID", "User", "Total", "Status", "Date"].map(h => (
                        <th key={h} className="px-5 py-3 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.recentOrders ?? []).map(o => (
                      <tr key={o.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{o.id.slice(0, 8)}…</td>
                        <td className="px-5 py-3 text-xs">{o.userId.slice(0, 12)}…</td>
                        <td className="px-5 py-3 text-primary font-medium">{formatCurrency(o.total)}</td>
                        <td className="px-5 py-3">
                          <Badge variant={o.status === "paid" ? "success" : o.status === "failed" ? "destructive" : "outline"} className="text-xs">{o.status}</Badge>
                        </td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!stats?.recentOrders?.length && <div className="p-8 text-center text-muted-foreground text-sm">No orders yet</div>}
              </div>
            </Card>
          </div>
        )}

        {/* ── ANALYTICS ── */}
        {tab === "analytics" && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button variant="glass" size="sm" onClick={() => refetchAnalytics()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
            </div>
            <Card className="p-6">
              <h3 className="font-bold mb-4">Revenue (Last 30 Days)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={analytics?.revenueByDay ?? []}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={v => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={v => `₹${v}`} />
                  <Tooltip contentStyle={{ background: "#0d1626", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} formatter={(v: number) => [formatCurrency(v), "Revenue"]} />
                  <Area type="monotone" dataKey="revenue" stroke="#22d3ee" fill="url(#rev)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-bold mb-4">Top Products by Revenue</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={(analytics?.topProducts ?? []).slice(0, 5)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={v => `₹${v}`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} width={100} />
                    <Tooltip contentStyle={{ background: "#0d1626", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                    <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold mb-4">Orders by Status</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={analytics?.ordersByStatus ?? []} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}>
                      {(analytics?.ordersByStatus ?? []).map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#0d1626", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="font-bold mb-4">New Users (Last 30 Days)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={analytics?.newUsersByDay ?? []}>
                  <defs>
                    <linearGradient id="users" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={v => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip contentStyle={{ background: "#0d1626", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#users)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* ── PRODUCTS ── */}
        {tab === "products" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 h-fit">
              <h2 className="text-lg font-bold mb-5 flex items-center gap-2"><Plus className="w-4 h-4 text-primary" /> New Asset</h2>
              <form onSubmit={handleCreateProduct} className="space-y-3">
                <div><Label>Name *</Label><Input required value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div><Label>Description</Label><Input value={productForm.description} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Price *</Label><Input type="number" step="0.01" required value={productForm.price} onChange={e => setProductForm(f => ({ ...f, price: e.target.value }))} /></div>
                  <div><Label>Sale Price</Label><Input type="number" step="0.01" value={productForm.salePrice} onChange={e => setProductForm(f => ({ ...f, salePrice: e.target.value }))} /></div>
                </div>
                <div><Label>Category *</Label><Input required value={productForm.category} onChange={e => setProductForm(f => ({ ...f, category: e.target.value }))} /></div>
                <div><Label>Tags (comma-separated)</Label><Input placeholder="crypto, signal, algo" value={productForm.tags} onChange={e => setProductForm(f => ({ ...f, tags: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Stock</Label><Input type="number" value={productForm.stock} onChange={e => setProductForm(f => ({ ...f, stock: e.target.value }))} /></div>
                  <div><Label>Image URL</Label><Input value={productForm.imageUrl} onChange={e => setProductForm(f => ({ ...f, imageUrl: e.target.value }))} /></div>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={productForm.isDigital} onChange={e => setProductForm(f => ({ ...f, isDigital: e.target.checked }))} className="w-4 h-4" /> Digital</label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={productForm.isSubscription} onChange={e => setProductForm(f => ({ ...f, isSubscription: e.target.checked }))} className="w-4 h-4" /> Subscription</label>
                </div>
                <Button type="submit" className="w-full" isLoading={createProduct.isPending}>Deploy Asset</Button>
              </form>
            </Card>

            <Card className="lg:col-span-2 p-0 overflow-hidden flex flex-col">
              <div className="p-5 border-b border-white/5 flex justify-between items-center">
                <h2 className="font-bold">Assets ({productsData?.products?.length ?? 0})</h2>
                <Button variant="glass" size="sm" onClick={() => refetchProducts()}><RefreshCw className="w-3.5 h-3.5" /></Button>
              </div>
              <div className="overflow-y-auto max-h-[600px] custom-scrollbar">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground uppercase bg-black/30 border-b border-white/5 sticky top-0 backdrop-blur">
                    <tr>{["Name", "Price", "Sale", "Cat", "Stock", ""].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {(productsData?.products ?? []).map(p => (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3 font-medium max-w-[150px] truncate">{p.name}</td>
                        <td className="px-4 py-3 text-primary">{formatCurrency(p.price)}</td>
                        <td className="px-4 py-3 text-emerald-400">{p.salePrice ? formatCurrency(p.salePrice) : "—"}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{p.category}</td>
                        <td className="px-4 py-3">{p.stock}</td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/20" onClick={async () => { await deleteProduct.mutateAsync({ id: p.id }); refetchProducts(); toast({ title: "Asset deleted" }); }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!productsData?.products?.length && <div className="p-10 text-center text-muted-foreground text-sm">No products yet</div>}
              </div>
            </Card>
          </div>
        )}

        {/* ── MEDIA ── */}
        {tab === "media" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 h-fit">
              <h2 className="text-lg font-bold mb-5 flex items-center gap-2"><Plus className="w-4 h-4 text-primary" /> Add Media</h2>
              <form onSubmit={handleCreateMedia} className="space-y-3">
                <div><Label>Title *</Label><Input required value={mediaForm.title} onChange={e => setMediaForm(f => ({ ...f, title: e.target.value }))} /></div>
                <div>
                  <Label>Type</Label>
                  <select value={mediaForm.type} onChange={e => setMediaForm(f => ({ ...f, type: e.target.value }))} className="w-full h-10 px-3 rounded-lg bg-black/40 border border-white/10 text-sm text-white">
                    <option value="music">Music</option>
                    <option value="movie">Movie/Course</option>
                  </select>
                </div>
                <div><Label>Price *</Label><Input type="number" step="0.01" required value={mediaForm.price} onChange={e => setMediaForm(f => ({ ...f, price: e.target.value }))} /></div>
                <div><Label>Description</Label><Input value={mediaForm.description} onChange={e => setMediaForm(f => ({ ...f, description: e.target.value }))} /></div>
                <div><Label>Image URL</Label><Input value={mediaForm.imageUrl} onChange={e => setMediaForm(f => ({ ...f, imageUrl: e.target.value }))} /></div>
                <div><Label>File URL</Label><Input value={mediaForm.fileUrl} onChange={e => setMediaForm(f => ({ ...f, fileUrl: e.target.value }))} /></div>
                <div><Label>License Type</Label><Input value={mediaForm.licenseType} onChange={e => setMediaForm(f => ({ ...f, licenseType: e.target.value }))} /></div>
                <Button type="submit" className="w-full" isLoading={createMedia.isPending}>Add Media</Button>
              </form>
            </Card>
            <Card className="lg:col-span-2 p-0 overflow-hidden">
              <div className="p-5 border-b border-white/5"><h2 className="font-bold">Media Items ({mediaData?.items?.length ?? 0})</h2></div>
              <div className="overflow-y-auto max-h-[500px] custom-scrollbar">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground uppercase bg-black/30 border-b border-white/5 sticky top-0 backdrop-blur">
                    <tr>{["Title", "Type", "Price", "License"].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {(mediaData?.items ?? []).map(m => (
                      <tr key={m.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3 font-medium">{m.title}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{m.type}</Badge></td>
                        <td className="px-4 py-3 text-primary">{formatCurrency(m.price)}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{m.licenseType}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!mediaData?.items?.length && <div className="p-10 text-center text-muted-foreground text-sm">No media yet</div>}
              </div>
            </Card>
          </div>
        )}

        {/* ── USERS ── */}
        {tab === "users" && (
          <Card className="p-0 overflow-hidden">
            <div className="p-5 border-b border-white/5 flex justify-between items-center">
              <h2 className="font-bold">Users ({usersData?.total ?? 0})</h2>
              <Button variant="glass" size="sm" onClick={() => refetchUsers()}><RefreshCw className="w-3.5 h-3.5" /></Button>
            </div>
            <div className="overflow-y-auto max-h-[600px] custom-scrollbar">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground uppercase bg-black/30 border-b border-white/5 sticky top-0 backdrop-blur">
                  <tr>{["Email", "Name", "Role", "Points", "Joined", "Action"].map(h => <th key={h} className="px-5 py-3 text-left">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {(usersData?.users ?? []).map(u => (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-5 py-3 text-sm">{u.email}</td>
                      <td className="px-5 py-3 text-muted-foreground text-xs">{u.displayName || "—"}</td>
                      <td className="px-5 py-3"><Badge variant={u.role === "admin" ? "success" : "outline"} className="text-xs">{u.role}</Badge></td>
                      <td className="px-5 py-3 text-primary">{u.loyaltyPoints}</td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3">
                        {u.id !== user?.id && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={async () => {
                            await updateUserRole.mutateAsync({ id: u.id, data: { role: u.role === "admin" ? "user" : "admin" } });
                            refetchUsers();
                            toast({ title: `Role updated to ${u.role === "admin" ? "user" : "admin"}` });
                          }}>
                            {u.role === "admin" ? "Demote" : "Promote"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!usersData?.users?.length && <div className="p-10 text-center text-muted-foreground text-sm">No users yet</div>}
            </div>
          </Card>
        )}

        {/* ── CATEGORIES ── */}
        {tab === "categories" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 h-fit">
              <h2 className="text-lg font-bold mb-5 flex items-center gap-2"><Plus className="w-4 h-4 text-primary" /> New Category</h2>
              <form onSubmit={handleCreateCategory} className="space-y-3">
                <div><Label>Name *</Label><Input required value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div><Label>Slug (auto-generated if empty)</Label><Input placeholder="e.g. crypto-signals" value={catForm.slug} onChange={e => setCatForm(f => ({ ...f, slug: e.target.value }))} /></div>
                <Button type="submit" className="w-full" isLoading={createCategory.isPending}>Create Category</Button>
              </form>
            </Card>
            <Card className="lg:col-span-2 p-0 overflow-hidden">
              <div className="p-5 border-b border-white/5 flex justify-between items-center">
                <h2 className="font-bold">Categories ({catsData?.categories?.length ?? 0})</h2>
                <Button variant="glass" size="sm" onClick={() => refetchCats()}><RefreshCw className="w-3.5 h-3.5" /></Button>
              </div>
              <div className="overflow-y-auto max-h-[400px] custom-scrollbar">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground uppercase bg-black/30 border-b border-white/5 sticky top-0 backdrop-blur">
                    <tr>{["Name", "Slug", "Products", "Created", ""].map(h => <th key={h} className="px-5 py-3 text-left">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {(catsData?.categories ?? []).map(c => (
                      <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-5 py-3 font-medium">{c.name}</td>
                        <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{c.slug}</td>
                        <td className="px-5 py-3 text-primary">{c.productCount ?? 0}</td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</td>
                        <td className="px-5 py-3">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/20" onClick={async () => { await deleteCategory.mutateAsync({ id: c.id }); refetchCats(); toast({ title: "Category deleted" }); }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!catsData?.categories?.length && <div className="p-10 text-center text-muted-foreground text-sm">No categories yet</div>}
              </div>
            </Card>
          </div>
        )}

        {/* ── PAGES ── */}
        {tab === "pages" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
                {editingPage ? <Edit2 className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-primary" />}
                {editingPage ? "Edit Page" : "New Page"}
              </h2>
              <form onSubmit={handleCreatePage} className="space-y-3">
                <div><Label>Title *</Label><Input required value={pageForm.title} onChange={e => setPageForm(f => ({ ...f, title: e.target.value }))} /></div>
                <div><Label>Slug (URL path) *</Label><Input required placeholder="e.g. trading-guide" value={pageForm.slug} onChange={e => setPageForm(f => ({ ...f, slug: e.target.value }))} /></div>
                <div>
                  <Label>Content Type</Label>
                  <select value={pageForm.contentType} onChange={e => setPageForm(f => ({ ...f, contentType: e.target.value }))} className="w-full h-10 px-3 rounded-lg bg-black/40 border border-white/10 text-sm text-white">
                    <option value="markdown">Markdown</option>
                    <option value="html">HTML</option>
                  </select>
                </div>
                <div>
                  <Label>Content *</Label>
                  <textarea
                    className="w-full h-48 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder={pageForm.contentType === "markdown" ? "# Heading\n\nYour content here..." : "<h1>Heading</h1>\n<p>Content...</p>"}
                    value={pageForm.content}
                    onChange={e => setPageForm(f => ({ ...f, content: e.target.value }))}
                    required
                  />
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={pageForm.isPublished} onChange={e => setPageForm(f => ({ ...f, isPublished: e.target.checked }))} className="w-4 h-4" />
                  Publish (make publicly visible)
                </label>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" isLoading={createPage.isPending || updatePage.isPending}>
                    {editingPage ? "Update Page" : "Create Page"}
                  </Button>
                  {editingPage && (
                    <Button variant="glass" type="button" onClick={() => { setEditingPage(null); setPageForm({ title: "", slug: "", content: "", contentType: "markdown", isPublished: false }); }}>Cancel</Button>
                  )}
                </div>
              </form>
            </Card>

            <Card className="p-0 overflow-hidden flex flex-col">
              <div className="p-5 border-b border-white/5 flex justify-between items-center">
                <h2 className="font-bold">Pages ({pagesData?.pages?.length ?? 0})</h2>
                <Button variant="glass" size="sm" onClick={() => refetchPages()}><RefreshCw className="w-3.5 h-3.5" /></Button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-white/5">
                {(pagesData?.pages ?? []).map(p => (
                  <div key={p.id} className="p-4 hover:bg-white/5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">{p.title}</span>
                        <Badge variant={p.isPublished ? "success" : "outline"} className="text-xs shrink-0">{p.isPublished ? "Live" : "Draft"}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">/pages/{p.slug}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.contentType} · Updated {new Date(p.updatedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10" onClick={() => { setEditingPage(p.id); setPageForm({ title: p.title, slug: p.slug, content: p.content, contentType: p.contentType, isPublished: p.isPublished }); }}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/20" onClick={async () => { await deletePage.mutateAsync({ id: p.id }); refetchPages(); toast({ title: "Page deleted" }); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                {!pagesData?.pages?.length && <div className="p-10 text-center text-muted-foreground text-sm">No pages yet</div>}
              </div>
            </Card>
          </div>
        )}

        {/* ── AI SETTINGS ── */}
        {tab === "ai" && (
          <div className="max-w-2xl space-y-6">
            <Card className="bg-primary/5 border-primary/20">
              <div className="flex gap-3">
                <Brain className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-primary mb-1">Current Configuration</h3>
                  <p className="text-sm text-muted-foreground">Model: <span className="text-white">{aiSettings?.modelName ?? "gemini-1.5-flash"}</span></p>
                  <p className="text-sm text-muted-foreground">API Key: <span className={aiSettings?.hasApiKey ? "text-emerald-400" : "text-amber-400"}>{aiSettings?.hasApiKey ? "Custom key configured" : "Using system default"}</span></p>
                  <p className="text-xs text-muted-foreground mt-1">Last updated: {aiSettings?.updatedAt ? new Date(aiSettings.updatedAt).toLocaleString() : "—"}</p>
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-bold mb-5 flex items-center gap-2"><Settings className="w-4 h-4 text-primary" /> Update AI Settings</h2>
              <form onSubmit={handleSaveAi} className="space-y-4">
                <div>
                  <Label>Model Name</Label>
                  <select value={aiForm.modelName || aiSettings?.modelName || "gemini-1.5-flash"} onChange={e => setAiForm(f => ({ ...f, modelName: e.target.value }))} className="w-full h-10 px-3 rounded-lg bg-black/40 border border-white/10 text-sm text-white">
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (fast)</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (powerful)</option>
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                  </select>
                </div>
                <div>
                  <Label>System Prompt Template</Label>
                  <textarea
                    className="w-full h-40 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder={aiSettings?.promptTemplate || "You are Trade Sovereign AI..."}
                    value={aiForm.promptTemplate}
                    onChange={e => setAiForm(f => ({ ...f, promptTemplate: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Leave blank to keep current prompt</p>
                </div>
                <div>
                  <Label>Custom API Key (optional)</Label>
                  <Input type="password" placeholder="sk-... or AI-... (leave blank to use system key)" value={aiForm.apiKey} onChange={e => setAiForm(f => ({ ...f, apiKey: e.target.value }))} />
                </div>
                <Button type="submit" isLoading={updateAi.isPending}>Save AI Settings</Button>
              </form>
            </Card>
          </div>
        )}

        {/* ── SUBSCRIPTION PLANS ── */}
        {tab === "plans" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 h-fit">
              <h2 className="text-lg font-bold mb-5 flex items-center gap-2"><Plus className="w-4 h-4 text-primary" /> New Plan</h2>
              <form onSubmit={handleCreatePlan} className="space-y-3">
                <div><Label>Plan Name *</Label><Input required placeholder="Pro, Elite..." value={planForm.name} onChange={e => setPlanForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Monthly Price *</Label><Input type="number" step="0.01" required value={planForm.price} onChange={e => setPlanForm(f => ({ ...f, price: e.target.value }))} /></div>
                  <div><Label>Yearly Price</Label><Input type="number" step="0.01" placeholder="auto" value={planForm.yearlyPrice} onChange={e => setPlanForm(f => ({ ...f, yearlyPrice: e.target.value }))} /></div>
                </div>
                <div>
                  <Label>Features (one per line)</Label>
                  <textarea className="w-full h-32 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white resize-y focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="AI Trading Assistant&#10;Real-time Signals&#10;Priority Support" value={planForm.features} onChange={e => setPlanForm(f => ({ ...f, features: e.target.value }))} />
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={planForm.isPopular} onChange={e => setPlanForm(f => ({ ...f, isPopular: e.target.checked }))} className="w-4 h-4" /> Mark as Popular</label>
                <Button type="submit" className="w-full" isLoading={createPlan.isPending}>Create Plan</Button>
              </form>
            </Card>

            <Card className="lg:col-span-2 p-0 overflow-hidden">
              <div className="p-5 border-b border-white/5 flex justify-between items-center">
                <h2 className="font-bold">Plans ({plansData?.plans?.length ?? 0})</h2>
                <Button variant="glass" size="sm" onClick={() => refetchPlans()}><RefreshCw className="w-3.5 h-3.5" /></Button>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(plansData?.plans ?? []).map(plan => (
                  <Card key={plan.id} className={`relative ${plan.isPopular ? "border-primary/40 bg-primary/5" : ""}`}>
                    {plan.isPopular && <Badge className="absolute top-3 right-3 bg-primary/20 text-primary border-primary/30 text-xs">Popular</Badge>}
                    <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                    <p className="text-2xl font-display font-bold text-primary mb-3">₹{plan.price}<span className="text-sm text-muted-foreground font-normal">/mo</span></p>
                    <ul className="space-y-1 mb-4">
                      {(plan.features ?? []).map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Check className="w-3 h-3 text-primary shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                    <Button variant="ghost" size="sm" className="w-full text-destructive hover:bg-destructive/10" onClick={async () => { await deletePlan.mutateAsync({ id: plan.id }); refetchPlans(); toast({ title: "Plan deleted" }); }}>
                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                    </Button>
                  </Card>
                ))}
                {!plansData?.plans?.length && <div className="col-span-full p-10 text-center text-muted-foreground text-sm">No plans yet. Create your first subscription plan.</div>}
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
