import React, { createContext, useContext, useState, useEffect } from "react";
import type { CartItem, CartItemType, Product, MediaItem } from "@workspace/api-client-react";

interface CartContextType {
  items: CartItem[];
  itemDetails: Record<string, Product | MediaItem>;
  addItem: (item: Product | MediaItem, type: CartItemType, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("ts_cart");
    return saved ? JSON.parse(saved) : [];
  });
  const [itemDetails, setItemDetails] = useState<Record<string, Product | MediaItem>>(() => {
    const saved = localStorage.getItem("ts_cart_details");
    return saved ? JSON.parse(saved) : {};
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("ts_cart", JSON.stringify(items));
    localStorage.setItem("ts_cart_details", JSON.stringify(itemDetails));
  }, [items, itemDetails]);

  const addItem = (item: Product | MediaItem, type: CartItemType, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i));
      }
      return [...prev, { id: item.id, type, quantity }];
    });
    setItemDetails((prev) => ({ ...prev, [item.id]: item }));
    setIsOpen(true);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) return removeItem(id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
  };

  const clearCart = () => {
    setItems([]);
    setItemDetails({});
  };

  const total = items.reduce((acc, item) => {
    const detail = itemDetails[item.id];
    return acc + (detail?.price || 0) * item.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{ items, itemDetails, addItem, removeItem, updateQuantity, clearCart, total, isOpen, setIsOpen }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
