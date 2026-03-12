import { Navbar } from "./Navbar";
import { CartDrawer } from "./CartDrawer";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col relative">
      <Navbar />
      <main className="flex-1 relative z-10">
        {children}
      </main>
      <CartDrawer />
      
      <footer className="border-t border-white/5 py-12 mt-20 relative z-10 glass-panel">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-3 mb-6">
            <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Trade Sovereign" className="w-6 h-6 opacity-50" />
            <span className="font-display font-bold text-lg text-white/50">Trade Sovereign</span>
          </div>
          <p>&copy; {new Date().getFullYear()} Trade Sovereign Enterprise. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
