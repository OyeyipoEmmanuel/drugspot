import { createContext, useContext, useMemo, useState } from "react";

import type { CartItem, Pharmacy, Product, ProductOffer } from "@/types/marketplace";

const CART_KEY = "drugspot-cart";

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  pharmacy: Pharmacy | null;
  addItem: (product: Product, offer: ProductOffer, pharmacy: Pharmacy, quantity?: number) => void;
  updateQuantity: (offerId: string, quantity: number) => void;
  removeItem: (offerId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function readCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) ?? "[]") as CartItem[]; }
  catch { return []; }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readCart);
  const update = (next: CartItem[]) => { setItems(next); localStorage.setItem(CART_KEY, JSON.stringify(next)); };
  const value = useMemo<CartContextValue>(() => ({
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.offer.price * item.quantity, 0),
    pharmacy: items[0]?.pharmacy ?? null,
    addItem(product, offer, pharmacy, quantity = 1) {
      if (items.length && items[0].pharmacy.id !== pharmacy.id) {
        throw new Error(`Your cart contains items from ${items[0].pharmacy.name}. Complete or clear that cart before ordering from another pharmacy.`);
      }
      const existing = items.find((item) => item.offer.id === offer.id);
      const next = existing
        ? items.map((item) => item.offer.id === offer.id ? { ...item, quantity: Math.min(item.quantity + quantity, Math.max(1, offer.stockCount)) } : item)
        : [...items, { product, offer, pharmacy, quantity }];
      update(next);
    },
    updateQuantity(offerId, quantity) {
      update(items.map((item) => item.offer.id === offerId ? { ...item, quantity: Math.max(1, Math.min(quantity, Math.max(1, item.offer.stockCount))) } : item));
    },
    removeItem(offerId) { update(items.filter((item) => item.offer.id !== offerId)); },
    clearCart() { update([]); },
  }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
