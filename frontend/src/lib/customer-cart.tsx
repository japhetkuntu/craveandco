'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

const STORAGE_KEY = 'crave_customer_cart';

export interface CartItem {
  menuItemId: string;
  name: string;
  imageUrl?: string | null;
  unitPrice: number;
  quantity: number;
  notes?: string;
}

interface CartState {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  remove: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  setNotes: (menuItemId: string, notes: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartState | undefined>(undefined);

function readStored(): CartItem[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

function writeStored(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function CustomerCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(readStored());
  }, []);

  useEffect(() => {
    writeStored(items);
  }, [items]);

  const add = useCallback((item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((c) => c.menuItemId === item.menuItemId);
      if (existing) {
        return current.map((c) =>
          c.menuItemId === item.menuItemId ? { ...c, quantity: c.quantity + quantity } : c,
        );
      }
      return [...current, { ...item, quantity }];
    });
  }, []);

  const remove = useCallback((menuItemId: string) => {
    setItems((current) => current.filter((c) => c.menuItemId !== menuItemId));
  }, []);

  const updateQuantity = useCallback((menuItemId: string, quantity: number) => {
    setItems((current) =>
      quantity <= 0
        ? current.filter((c) => c.menuItemId !== menuItemId)
        : current.map((c) => (c.menuItemId === menuItemId ? { ...c, quantity } : c)),
    );
  }, []);

  const setNotes = useCallback((menuItemId: string, notes: string) => {
    setItems((current) => current.map((c) => (c.menuItemId === menuItemId ? { ...c, notes } : c)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartState>(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    return { items, count, subtotal, add, remove, updateQuantity, setNotes, clear };
  }, [items, add, remove, updateQuantity, setNotes, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCustomerCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCustomerCart must be used within CustomerCartProvider');
  return ctx;
}
