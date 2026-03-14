import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button, Card, Badge, Skeleton } from "@/components/ui/design-system";
import { useListMedia, CartItemType, ListMediaType } from "@workspace/api-client-react";
import { Music, Film, ShoppingCart, Download, Lock } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export default function MediaStore() {
  const [activeTab, setActiveTab] = useState<ListMediaType>(ListMediaType.music);

  // Use the generated hook with params to filter by type
  const { data: mediaData, isLoading: mediaLoading } = useListMedia({ type: activeTab });
  
  const { addItem } = useCart();
  const { user } = useAuth();

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl font-display font-bold mb-4">The Sovereign Archive</h1>
          <p className="text-muted-foreground">Exclusive high-fidelity auditory and visual experiences.</p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="p-1 glass rounded-xl flex gap-1">
            <button 
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'music' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-white'}`}
              onClick={() => setActiveTab(ListMediaType.music)}
            >
              <Music className="w-4 h-4" /> Soundscapes
            </button>
            <button 
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'movie' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-white'}`}
              onClick={() => setActiveTab(ListMediaType.movie)}
            >
              <Film className="w-4 h-4" /> Cinematics
            </button>
          </div>
        </div>

        {mediaLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-80" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {mediaData?.items?.map((item) => (
              <Card key={item.id} className="p-0 overflow-hidden group">
                <div className="aspect-square bg-black/50 relative">
                  {item.imageUrl ? (
                     <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                     <div className="w-full h-full flex items-center justify-center text-white/20">
                       {item.type === 'music' ? <Music className="w-12 h-12" /> : <Film className="w-12 h-12" />}
                     </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                    <Button variant="primary" className="w-full gap-2" onClick={() => addItem(item, CartItemType.media)}>
                      <ShoppingCart className="w-4 h-4" /> {formatCurrency(item.price)}
                    </Button>
                  </div>
                  <Badge className="absolute top-3 left-3 bg-black/60 backdrop-blur">{item.licenseType}</Badge>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg truncate mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.description || 'No description available.'}</p>
                </div>
              </Card>
            ))}
            
            {(!mediaData?.items || mediaData.items.length === 0) && (
              <div className="col-span-full py-20 text-center text-muted-foreground glass-card rounded-2xl">
                <Lock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-medium mb-2">Vault Sealed</h3>
                <p>No {activeTab} assets currently available in the archive.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
