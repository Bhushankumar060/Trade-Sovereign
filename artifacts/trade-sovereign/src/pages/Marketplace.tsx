import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button, Card, Input, Badge, Skeleton } from "@/components/ui/design-system";
import { useListProducts, useAiSearch, useListCategories, CartItemType } from "@workspace/api-client-react";
import { Search, Sparkles, ShoppingCart, Tag, Filter } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { formatCurrency } from "@/lib/utils";

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const { addItem } = useCart();

  const { data: productsData, isLoading: productsLoading } = useListProducts({
    category: selectedCategory || undefined,
    tag: selectedTag || undefined,
  });
  const { data: categoriesData } = useListCategories();
  const searchMutation = useAiSearch();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    searchMutation.mutate({ data: { query: searchQuery } });
  };

  const displayProducts = searchMutation.data?.results || productsData?.products || [];
  const allTags = Array.from(new Set((productsData?.products ?? []).flatMap(p => p.tags ?? []))).slice(0, 10);
  const categories = categoriesData?.categories ?? [];

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-display font-bold mb-2 text-gradient">Sovereign Asset Exchange</h1>
            <p className="text-muted-foreground">Procure premium digital trading assets and tools.</p>
          </div>

          <form onSubmit={handleSearch} className="w-full md:w-auto relative flex items-center group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <Input
              placeholder="Ask AI (e.g. 'crypto signal tools')"
              className="pl-10 pr-24 w-full md:w-96 bg-black/40 border-primary/30 focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button type="submit" size="sm" className="absolute right-1 h-10 px-4" isLoading={searchMutation.isPending}>
              Search
            </Button>
          </form>
        </div>

        {searchMutation.data?.interpretation && (
          <Card className="mb-6 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-primary mb-1">AI Interpretation</h4>
                <p className="text-sm text-muted-foreground">{searchMutation.data.interpretation}</p>
              </div>
              <button onClick={() => searchMutation.reset()} className="text-xs text-muted-foreground hover:text-white underline">Clear</button>
            </div>
          </Card>
        )}

        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => { setSelectedCategory(""); searchMutation.reset(); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all whitespace-nowrap ${!selectedCategory ? "bg-primary text-primary-foreground border-primary" : "border-white/10 text-muted-foreground hover:text-white hover:border-white/20"}`}
          >
            All Assets
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.name); searchMutation.reset(); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all whitespace-nowrap ${selectedCategory === cat.name ? "bg-primary text-primary-foreground border-primary" : "border-white/10 text-muted-foreground hover:text-white hover:border-white/20"}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {allTags.length > 0 && (
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none items-center">
            <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0"><Tag className="w-3 h-3" /> Tags:</span>
            {selectedTag && (
              <button onClick={() => setSelectedTag("")} className="px-3 py-1 rounded-full text-xs border border-destructive/40 text-destructive hover:bg-destructive/10 transition-all">Clear</button>
            )}
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? "" : tag)}
                className={`px-3 py-1 rounded-full text-xs border transition-all whitespace-nowrap ${selectedTag === tag ? "bg-primary/20 text-primary border-primary/40" : "border-white/10 text-muted-foreground hover:text-white hover:border-white/20"}`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-[320px]" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayProducts.map((product) => {
              const hasDiscount = product.salePrice && product.salePrice < product.price;
              const discountPct = hasDiscount ? Math.round((1 - product.salePrice! / product.price) * 100) : 0;
              return (
                <Card key={product.id} className="p-0 overflow-hidden flex flex-col group hover:border-primary/50 transition-all duration-300">
                  <div className="h-48 bg-black/40 relative overflow-hidden">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Filter className="w-8 h-8 text-white/10" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                      <Badge className="bg-black/80 backdrop-blur border-none text-xs">{product.category}</Badge>
                      {product.isDigital && <Badge className="bg-amber-500/20 backdrop-blur border-none text-amber-400 text-xs">Digital</Badge>}
                      {product.isSubscription && <Badge className="bg-purple-500/20 backdrop-blur border-none text-purple-400 text-xs">Sub</Badge>}
                    </div>
                    {hasDiscount && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-red-500/80 backdrop-blur border-none text-white text-xs font-bold">-{discountPct}%</Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-base mb-1 line-clamp-1">{product.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">{product.description}</p>

                    {(product.tags ?? []).length > 0 && (
                      <div className="flex gap-1 flex-wrap mb-3">
                        {(product.tags ?? []).slice(0, 3).map(tag => (
                          <button key={tag} onClick={() => setSelectedTag(tag)} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                            #{tag}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                      <div className="flex flex-col">
                        {hasDiscount ? (
                          <>
                            <span className="font-display font-bold text-lg text-white">{formatCurrency(product.salePrice!)}</span>
                            <span className="text-xs text-muted-foreground line-through">{formatCurrency(product.price)}</span>
                          </>
                        ) : (
                          <span className="font-display font-bold text-xl text-white">{formatCurrency(product.price)}</span>
                        )}
                      </div>
                      <Button size="icon" variant="secondary" onClick={() => addItem(product, CartItemType.product)}>
                        <ShoppingCart className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}

            {displayProducts.length === 0 && (
              <div className="col-span-full py-20 text-center text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-medium mb-2">No assets found</h3>
                <p className="text-sm">Adjust your filters or search query.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
