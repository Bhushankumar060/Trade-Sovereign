import { AppLayout } from "@/components/layout/AppLayout";
import { Card, Badge, Skeleton } from "@/components/ui/design-system";
import { useListOrders } from "@workspace/api-client-react";
import { Package, Clock, CheckCircle2, XCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function Orders() {
  const { data, isLoading } = useListOrders();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge variant="success"><CheckCircle2 className="w-3 h-3 mr-1" /> Secured</Badge>;
      case 'pending': return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" /> Processing</Badge>;
      case 'failed': return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Terminated</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-3xl font-display font-bold mb-8">Transaction Log</h1>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
          </div>
        ) : data?.orders?.length ? (
          <div className="space-y-4">
            {data.orders.map(order => (
              <Card key={order.id} className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between p-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-mono text-muted-foreground uppercase">ID: {order.id.split('-')[0]}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="text-sm text-gray-400">
                    {new Date(order.createdAt).toLocaleString()}
                  </div>
                </div>
                
                <div className="flex-1 md:px-8 w-full md:w-auto border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0">
                  <div className="space-y-2">
                    {order.items?.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="font-medium">{item.quantity}x {item.name || 'Asset'}</span>
                        <span className="text-muted-foreground">{formatCurrency(item.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="text-right w-full md:w-auto border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 pl-0 md:pl-8">
                  <p className="text-sm text-muted-foreground mb-1">Total</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(order.total)}</p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="py-24 flex flex-col items-center justify-center text-muted-foreground border-dashed">
            <Package className="w-16 h-16 mb-4 opacity-20" />
            <h3 className="text-xl font-medium mb-2">No active records</h3>
            <p>Your transaction log is currently empty.</p>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
