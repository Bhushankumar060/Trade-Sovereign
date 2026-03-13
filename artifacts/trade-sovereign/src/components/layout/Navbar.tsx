import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Button, Badge } from "@/components/ui/design-system";
import { ShoppingCart, LogOut, LayoutDashboard, Crown, Shield, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { items, setIsOpen: setCartOpen } = useCart();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const navLinks = [
    { label: "Marketplace", href: "/marketplace" },
    { label: "Media Store", href: "/media" },
    { label: "Subscriptions", href: "/subscriptions" },
    { label: "AI Assistant", href: "/chat" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 glass-panel">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Trade Sovereign" className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
            <span className="font-display font-bold text-xl tracking-wide text-gradient">Trade Sovereign</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  location === link.href 
                    ? "bg-white/10 text-white" 
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative" onClick={() => setCartOpen(true)}>
            <ShoppingCart className="w-5 h-5" />
            {items.length > 0 && (
              <span className="absolute 1 top-1 right-1 w-4 h-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                {items.reduce((acc, i) => acc + i.quantity, 0)}
              </span>
            )}
          </Button>

          {user ? (
            <div className="relative">
              <Button variant="glass" className="gap-2 pl-3" onClick={() => setDropdownOpen(!dropdownOpen)}>
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center text-xs font-bold">
                  {user.displayName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline-block text-sm">{user.displayName || user.email.split('@')[0]}</span>
              </Button>
              
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 glass-card rounded-xl shadow-2xl border border-white/10 py-2 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-white/10 mb-2">
                      <p className="text-sm font-medium text-white truncate">{user.displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      <div className="mt-2 flex gap-2">
                        <Badge variant="outline">{user.loyaltyPoints} PTS</Badge>
                        {user.role === 'admin' && <Badge variant="success">Admin</Badge>}
                      </div>
                    </div>
                    
                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-colors" onClick={() => setDropdownOpen(false)}>
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    <Link href="/orders" className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-colors" onClick={() => setDropdownOpen(false)}>
                      <ShoppingCart className="w-4 h-4" /> Orders
                    </Link>
                    <Link href="/rewards" className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-colors" onClick={() => setDropdownOpen(false)}>
                      <Crown className="w-4 h-4" /> Rewards
                    </Link>
                    {user.role === 'admin' && (
                      <Link href="/admin" className="flex items-center gap-3 px-4 py-2 text-sm text-primary hover:bg-primary/10 transition-colors" onClick={() => setDropdownOpen(false)}>
                        <Shield className="w-4 h-4" /> Admin Panel
                      </Link>
                    )}
                    
                    <div className="h-px bg-white/10 my-2" />
                    
                    <button 
                      onClick={() => { setDropdownOpen(false); logout(); }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" className="hidden sm:flex">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button variant="primary">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
