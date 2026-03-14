import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext({
  toast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ title, description, variant = 'default', duration = 4000 }) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, description, variant }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        <AnimatePresence>
          {toasts.map(t => (
            <Toast key={t.id} {...t} onClose={() => removeToast(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ title, description, variant, onClose }) {
  const icons = {
    default: <Info className="w-5 h-5 text-cyan-400" />,
    success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    destructive: <AlertCircle className="w-5 h-5 text-red-400" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="glass-card rounded-xl p-4 flex items-start gap-3 min-w-[300px]"
    >
      {icons[variant]}
      <div className="flex-1">
        {title && <div className="font-medium text-white text-sm">{title}</div>}
        {description && <div className="text-xs text-gray-400 mt-1">{description}</div>}
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-white">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// Simple Toaster component for backwards compatibility
export function Toaster() {
  return null; // Toast rendering is handled by ToastProvider
}
