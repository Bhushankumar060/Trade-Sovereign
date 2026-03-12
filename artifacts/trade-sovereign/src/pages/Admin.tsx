import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, Button, Input, Label, Badge } from "@/components/ui/design-system";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminGetStats, useAdminCreateProduct, useAdminListProducts, useAdminDeleteProduct } from "@workspace/api-client-react";
import { Users, DollarSign, Package, Lock, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

export default function Admin() {
  const { user } = useAuth();
  const { data: stats } = useAdminGetStats({ query: { enabled: user?.role === 'admin' }});
  const { data: productsData, refetch } = useAdminListProducts({ query: { enabled: user?.role === 'admin' }});
  
  const createProduct = useAdminCreateProduct();
  const deleteProduct = useAdminDeleteProduct();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "", description: "", price: "", category: "", stock: "", imageUrl: "", isDigital: true
  });

  if (user?.role !== 'admin') {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
          <Lock className="w-24 h-24 text-destructive mb-6 opacity-80" />
          <h1 className="text-4xl font-display font-bold text-destructive mb-4">Access Denied</h1>
          <p className="text-muted-foreground max-w-md">Your security clearance is insufficient to access the central mainframe.</p>
        </div>
      </AppLayout>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProduct.mutateAsync({
        data: {
          name: formData.name,
          description: formData.description,
          price: Number(formData.price),
          category: formData.category,
          stock: Number(formData.stock),
          imageUrl: formData.imageUrl,
          isDigital: formData.isDigital
        }
      });
      toast({ title: "Asset Deployed", description: "Successfully injected into marketplace." });
      setFormData({ name: "", description: "", price: "", category: "", stock: "", imageUrl: "", isDigital: true });
      refetch();
    } catch (e: any) {
      toast({ title: "Deployment Failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-display font-bold mb-8 text-primary">System Override</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Personnel</p>
              <h3 className="text-2xl font-bold">{stats?.totalUsers || 0}</h3>
            </div>
          </Card>
          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Capital Flow</p>
              <h3 className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</h3>
            </div>
          </Card>
          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Assets</p>
              <h3 className="text-2xl font-bold">{stats?.totalProducts || 0}</h3>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Form */}
          <Card className="lg:col-span-1 h-fit">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Plus className="w-5 h-5 text-primary" /> Deploy New Asset</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Asset Name</Label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input type="number" step="0.01" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Stock</Label>
                  <Input type="number" required value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Image URL (Optional)</Label>
                <Input value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
              </div>
              <Button type="submit" className="w-full mt-4" isLoading={createProduct.isPending}>Deploy to Network</Button>
            </form>
          </Card>

          {/* Product List */}
          <Card className="lg:col-span-2 p-0 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/5 bg-black/20">
              <h2 className="text-xl font-bold">Network Asset Registry</h2>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[600px] p-0 custom-scrollbar">
              {productsData?.products.length ? (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-black/40 border-b border-white/5 sticky top-0 backdrop-blur">
                    <tr>
                      <th className="px-6 py-3">Asset</th>
                      <th className="px-6 py-3">Price</th>
                      <th className="px-6 py-3">Stock</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productsData.products.map(p => (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-medium text-white">{p.name}</td>
                        <td className="px-6 py-4 text-primary">{formatCurrency(p.price)}</td>
                        <td className="px-6 py-4">{p.stock}</td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:bg-destructive/20"
                            onClick={async () => {
                              await deleteProduct.mutateAsync({ id: p.id });
                              refetch();
                              toast({ title: "Asset scrubbed from registry" });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center text-muted-foreground">Registry empty.</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
