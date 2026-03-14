import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  total: 0,
  itemCount: 0,
  isOpen: false,
  setIsOpen: () => {},
});

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load cart from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading cart:', e);
      }
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product, type = 'product') => {
    setItems(prev => {
      const existing = prev.find(item => item.id === product.id && item.type === type);
      if (existing) {
        return prev.map(item =>
          item.id === product.id && item.type === type
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, type }];
    });
    setIsOpen(true);
  };

  const removeItem = (id, type) => {
    setItems(prev => prev.filter(item => !(item.id === id && item.type === type)));
  };

  const updateQuantity = (id, type, quantity) => {
    if (quantity <= 0) {
      removeItem(id, type);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.id === id && item.type === type ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const total = items.reduce((sum, item) => {
    const price = item.salePrice || item.price;
    return sum + price * item.quantity;
  }, 0);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        itemCount,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
