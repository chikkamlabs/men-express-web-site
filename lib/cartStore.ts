'use client';

import { useSyncExternalStore } from 'react';

export interface CartItem {
  id: string; // unique key: variantId or `${variantId}_${colorId}`
  productId: string;
  productName: string;
  fit?: string | null;
  variantId: string;
  colorId: string;
  colorName: string;
  sizeId: string;
  sizeValue: string;
  imageUrl: string | null;
  mrp: number;
  s_p: number;
  quantity: number;
}

const CART_STORAGE_KEY = 'menexpress_cart_items';
const CART_EVENT_NAME = 'menexpress_cart_change';

const EMPTY_CART: CartItem[] = [];
let cachedCartRaw = '';
let cachedCartItems: CartItem[] = EMPTY_CART;

/**
 * Retrieves the current cart items from localStorage (with memoized snapshot for React).
 */
export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return EMPTY_CART;
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY) || '[]';
    if (raw !== cachedCartRaw) {
      cachedCartRaw = raw;
      const parsed = JSON.parse(raw);
      cachedCartItems = Array.isArray(parsed) ? parsed : EMPTY_CART;
    }
    return cachedCartItems;
  } catch (err) {
    console.error('Error reading cart from localStorage:', err);
    return EMPTY_CART;
  }
}

export function getCartServerSnapshot(): CartItem[] {
  return EMPTY_CART;
}

/**
 * Saves cart items to localStorage and dispatches a notification event.
 */
function saveCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(items);
    localStorage.setItem(CART_STORAGE_KEY, serialized);
    cachedCartRaw = serialized;
    cachedCartItems = items;
    window.dispatchEvent(new CustomEvent(CART_EVENT_NAME, { detail: items }));
  } catch (err) {
    console.error('Error saving cart to localStorage:', err);
  }
}

/**
 * Adds an item to the cart. If already exists with matching variantId, increments quantity.
 */
export function addToCart(item: Omit<CartItem, 'id'>): CartItem[] {
  const current = getCart();
  const id = `${item.variantId}_${item.colorId}`;

  const existingIndex = current.findIndex((i) => i.id === id);
  let updated: CartItem[];

  if (existingIndex > -1) {
    updated = current.map((i, idx) =>
      idx === existingIndex
        ? { ...i, quantity: i.quantity + item.quantity }
        : i
    );
  } else {
    updated = [...current, { ...item, id }];
  }

  saveCart(updated);
  return updated;
}

/**
 * Updates the quantity of a specific cart item. If quantity <= 0, removes the item.
 */
export function updateQuantity(id: string, newQty: number): CartItem[] {
  const current = getCart();
  if (newQty <= 0) {
    return removeFromCart(id);
  }

  const updated = current.map((i) =>
    i.id === id ? { ...i, quantity: newQty } : i
  );

  saveCart(updated);
  return updated;
}

/**
 * Removes an item from the cart.
 */
export function removeFromCart(id: string): CartItem[] {
  const current = getCart();
  const updated = current.filter((i) => i.id !== id);
  saveCart(updated);
  return updated;
}

/**
 * Clears all items from the cart.
 */
export function clearCart(): void {
  saveCart([]);
}

/**
 * Returns cart calculations including total items, MRP, SP, savings, and grand total.
 */
export function calculateCartSummary(items: CartItem[], deliveryFee = 100) {
  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);
  const totalSP = items.reduce((acc, i) => acc + i.s_p * i.quantity, 0);
  const totalMRP = items.reduce(
    (acc, i) => acc + (i.mrp > 0 ? i.mrp : i.s_p) * i.quantity,
    0
  );
  const totalSavings = Math.max(0, totalMRP - totalSP);
  const deliveryCharges = itemCount > 0 ? deliveryFee : 0;
  const grandTotal = totalSP + deliveryCharges;

  return {
    itemCount,
    totalSP,
    totalMRP,
    totalSavings,
    deliveryCharges,
    grandTotal,
  };
}

export function getCartSummary(deliveryFee = 100) {
  return calculateCartSummary(getCart(), deliveryFee);
}

/**
 * Subscribes to cart changes across tabs and client components.
 */
export function subscribeToCart(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener(CART_EVENT_NAME, callback);
  window.addEventListener('storage', callback);

  return () => {
    window.removeEventListener(CART_EVENT_NAME, callback);
    window.removeEventListener('storage', callback);
  };
}

/**
 * Hook to consume cart items without setState inside useEffect.
 */
export function useCart(): CartItem[] {
  return useSyncExternalStore(subscribeToCart, getCart, getCartServerSnapshot);
}
