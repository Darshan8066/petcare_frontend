import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';
import { useToast } from './ToastContext.jsx';

const CartContext = createContext(undefined);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('petcare_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [coupon, setCoupon] = useState(null);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    localStorage.setItem('petcare_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product, quantity = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product._id === product._id);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
        };
        return next;
      }
      return [...prev, { product, quantity }];
    });
    success(`Added ${product.title.substring(0, 24)}... to your cart!`, 'Cart Updated');
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product._id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setItems((prev) => prev.filter((item) => item.product._id !== productId));
  };

  const clearCart = () => {
    setItems([]);
    setCoupon(null);
  };

  const subtotal = Number(
    items.reduce((sum, item) => sum + item.product.price * item.quantity, 0).toFixed(2)
  );

  const shipping = subtotal === 0 || subtotal >= 49 ? 0 : 5.00;
  const tax = Number((subtotal * 0.08).toFixed(2));

  let discount = 0;
  if (coupon) {
    discount = Math.min((subtotal * coupon.discountPercent) / 100, coupon.discountAmount || 20);
    discount = Number(discount.toFixed(2));
  }

  const total = Math.max(0, Number((subtotal + shipping + tax - discount).toFixed(2)));
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const applyCoupon = async (code) => {
    if (!code.trim()) return false;
    try {
      const res = await api.post('/orders/coupon/validate', {
        code: code.trim(),
        subtotal
      });
      if (res.data?.success) {
        setCoupon(res.data.data);
        success(res.data.message, 'Coupon Applied');
        return true;
      }
      return false;
    } catch (err) {
      toastError(err.response?.data?.message || 'Invalid promo code');
      return false;
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    success('Promo code removed.');
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        coupon,
        applyCoupon,
        removeCoupon,
        subtotal,
        shipping,
        tax,
        discount,
        total,
        totalItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
