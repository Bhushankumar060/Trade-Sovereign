import React from 'react';
import Navbar from './Navbar';
import CartDrawer from './CartDrawer';

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col relative">
      <Navbar />
      <main className="flex-1 relative z-10">
        {children}
      </main>
      <CartDrawer />
      
      <footer className="border-t border-white/5 py-12 mt-20 relative z-10 glass-panel">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <span className="text-black font-bold text-sm">TS</span>
            </div>
            <span className="font-display font-bold text-lg text-white/50">Trade Sovereign</span>
          </div>
          <p className="text-sm">&copy; {new Date().getFullYear()} Trade Sovereign Enterprise. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
