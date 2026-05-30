'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/app/auth-provider';
import { apiRequest, type CartResponse } from '@/app/lib/api';

interface CartContextValue {
  cart: CartResponse;
  ready: boolean;
  isLoading: boolean;
  itemCount: number;
  getProductQuantity: (productId: number) => number;
  refreshCart: () => Promise<void>;
  addProduct: (productId: number) => Promise<void>;
  incrementProduct: (productId: number) => Promise<void>;
  decrementProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => Promise<void>;
  clearCartState: () => void;
}

const EMPTY_CART: CartResponse = { totalPrice: 0, items: [] };

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, ready: authReady } = useAuth();
  const [cart, setCart] = useState<CartResponse>(EMPTY_CART);
  const [isLoading, setIsLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!user) {
      setCart(EMPTY_CART);
      setReady(true);
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiRequest<CartResponse>('/api/cart');
      setCart(response);
      setReady(true);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (!user) {
      setCart(EMPTY_CART);
      setReady(true);
      setIsLoading(false);
      return;
    }

    refreshCart().catch(() => {
      setCart(EMPTY_CART);
      setReady(true);
      setIsLoading(false);
    });
  }, [authReady, refreshCart, user]);

  const mutateCart = useCallback(
    async (
      productId: number,
      method: 'POST' | 'PATCH' | 'DELETE',
      body?: Record<string, unknown>,
    ) => {
      const url = method === 'POST' ? '/api/cart/items' : `/api/cart/items/${productId}`;
      const response = await apiRequest<CartResponse>(url, {
        method,
        body: method === 'DELETE' && !body ? undefined : JSON.stringify(body ?? { productId }),
      });
      setCart(response);
      setReady(true);
    },
    [],
  );

  const addProduct = useCallback(
    (productId: number) => mutateCart(productId, 'POST', { productId }),
    [mutateCart],
  );
  const incrementProduct = useCallback(
    (productId: number) => mutateCart(productId, 'PATCH', { action: 'increment' }),
    [mutateCart],
  );
  const decrementProduct = useCallback(
    (productId: number) => mutateCart(productId, 'PATCH', { action: 'decrement' }),
    [mutateCart],
  );
  const removeProduct = useCallback((productId: number) => mutateCart(productId, 'DELETE'), [mutateCart]);

  const clearCartState = useCallback(() => {
    setCart(EMPTY_CART);
    setReady(true);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const quantities = new Map(cart.items.map((item) => [item.productId, item.quantity]));

    return {
      cart,
      ready,
      isLoading,
      itemCount,
      getProductQuantity: (productId: number) => quantities.get(productId) ?? 0,
      refreshCart,
      addProduct,
      incrementProduct,
      decrementProduct,
      removeProduct,
      clearCartState,
    };
  }, [
    addProduct,
    cart,
    clearCartState,
    decrementProduct,
    incrementProduct,
    isLoading,
    ready,
    refreshCart,
    removeProduct,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }

  return context;
}
