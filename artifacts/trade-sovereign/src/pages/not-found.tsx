import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/design-system";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 mb-8 text-primary opacity-50 relative">
          <AlertTriangle className="w-full h-full" />
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
        </div>
        <h1 className="text-6xl font-display font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-6">Sector Not Found</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          The coordinates you entered lead to an uncharted sector. The requested node does not exist in the Sovereign network.
        </p>
        <Link href="/">
          <Button size="lg">Return to Command Center</Button>
        </Link>
      </div>
    </AppLayout>
  );
}
