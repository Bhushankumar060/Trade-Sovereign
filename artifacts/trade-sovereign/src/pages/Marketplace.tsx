import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button, Card, Input, Badge, Skeleton } from "@/components/ui/design-system";
import { useListProducts, useAiSearch, CartItemType } from "@workspace/api-client-react";
import { Search, Sparkles, ShoppingCart, Filter } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { formatCurrency } from "@/lib/utils";

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const { addItem } = useCart();
  
  const { data: productsData, isLoading: productsLoading } = useListProducts();
  const searchMutation = useAiSearch();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    searchMutation.mutate({ data: { query: searchQuery } });
  };

  const displayProducts = searchMutation.data?.results || productsData?.products || [];

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-display font-bold mb-2 text-gradient">Sovereign Asset Exchange</h1>
            <p className="text-muted-foreground">Procure premium digital assets and hardware.</p>
          </div>
          
          <form onSubmit={handleSearch} className="w-full md:w-auto relative flex items-center group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <Input 
              placeholder="Ask AI (e.g. 'high performance trading gear')" 
              className="pl-10 pr-24 w-full md:w-96 bg-black/40 border-primary/30 focus-visible:ring-primary group-hover:border-primary/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button 
              type="submit" 
              size="sm" 
              className="absolute right-1 h-10 px-4"
              isLoading={searchMutation.isPending}
            >
              Search
            </Button>
          </form>
        </div>

        {searchMutation.data?.interpretation && (
          <Card className="mb-8 bg-primary/5 border-primary/20">
            <div className="flex gap-3">
              <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-primary mb-1">AI Interpretation</h4>
                <p className="text-sm text-muted-foreground">{searchMutation.data.interpretation}</p>
              </div>
            </div>
          </Card>
        )}

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {['All', 'Hardware', 'Software', 'Data Feeds'].map(cat => (
            <Badge key={cat} variant={cat === 'All' ? 'default' : 'outline'} className="px-4 py-1.5 cursor-pointer">
              {cat}
            </Badge>
          ))}
        </div>

        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-[300px]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayProducts.map((product) => (
              <Card key={product.id} className="p-0 overflow-hidden flex flex-col group hover:border-primary/50 transition-colors">
                <div className="h-48 bg-black/40 relative overflow-hidden">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Filter className="w-8 h-8 text-white/10" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Badge className="bg-black/80 backdrop-blur border-none">{product.category}</Badge>
                    {product.isDigital && <Badge variant="warning" className="bg-amber-500/20 backdrop-blur border-none">Digital</Badge>}
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg mb-1 line-clamp-1">{product.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{product.description}</p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                    <span className="font-display font-bold text-xl text-white">{formatCurrency(product.price)}</span>
                    <Button size="icon" variant="secondary" onClick={() => addItem(product, CartItemType.product)}>
                      <ShoppingCart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            
            {displayProducts.length === 0 && (
              <div className="col-span-full py-20 text-center text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-medium mb-2">No assets found</h3>
                <p>Adjust your search parameters or query.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
