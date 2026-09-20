import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Tag, Check, Sparkles } from 'lucide-react';
import { useCart } from '../../context/CartContext.jsx';
import { CheckoutModal } from './CheckoutModal.jsx';

export const CartDrawer = () => {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    subtotal,
    shipping,
    discount,
    total,
    coupon,
    applyCoupon,
    removeCoupon
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState(null);

  if (!isCartOpen) return null;

  const freeShippingThreshold = 49;
  const progressToFreeShipping = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const ok = await applyCoupon(couponInput);
    if (ok) setCouponInput('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
      />

      {/* Drawer */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FCFCF5] shadow-2xl flex flex-col border-l border-[#20351F]/10">
          {/* Header */}
          <div className="p-5 border-b border-slate-200/70 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#20351F]" />
              <h2 className="font-extrabold text-base text-[#20351F]">Your Pet Bag ({items.length})</h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress */}
          <div className="px-5 py-3 bg-[#F0F4ED] border-b border-[#78936D]/20">
            <div className="flex justify-between text-xs font-semibold text-[#20351F] mb-1.5">
              <span>{amountNeededForFreeShipping === 0 ? '🎉 You unlocked FREE Shipping!' : `Add $${amountNeededForFreeShipping.toFixed(2)} more for FREE Shipping`}</span>
              <span>{Math.round(progressToFreeShipping)}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#78936D] transition-all duration-500 rounded-full"
                style={{ width: `${progressToFreeShipping}%` }}
              />
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {orderSuccessData ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-xl text-[#20351F]">Order Confirmed!</h3>
                <p className="text-xs text-[#687166] max-w-xs mx-auto">
                  Your order has been recorded. Tracking Number: <span className="font-mono font-bold text-[#20351F]">{orderSuccessData.tracking}</span>
                </p>
                <button
                  onClick={() => {
                    setOrderSuccessData(null);
                    setIsCartOpen(false);
                  }}
                  className="px-6 py-2.5 rounded-full bg-[#20351F] text-white text-xs font-bold"
                >
                  Continue Browsing
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-[#F0F4ED] text-[#78936D] flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-[#20351F]">Your cart is empty</h3>
                <p className="text-xs text-[#687166] max-w-xs mx-auto">
                  Explore pet-approved dog food, cat treats, health supplements, and durable chew toys.
                </p>
              </div>
            ) : (
              items.map(({ product, quantity }) => (
                <div
                  key={product._id}
                  className="flex items-center gap-3.5 p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs"
                >
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 bg-slate-50"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-[#20351F] truncate leading-tight">
                      {product.title}
                    </h4>
                    <p className="text-[11px] text-[#687166] mt-0.5">{product.brand}</p>
                    <p className="text-xs font-extrabold text-[#C8643D] mt-1">
                      ${(product.price * quantity).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                      <button
                        onClick={() => updateQuantity(product._id, quantity - 1)}
                        className="px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-200"
                      >
                        -
                      </button>
                      <span className="px-2 text-xs font-semibold text-slate-800">{quantity}</span>
                      <button
                        onClick={() => updateQuantity(product._id, quantity + 1)}
                        className="px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-200"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(product._id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                      title="Remove product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout */}
          {!orderSuccessData && items.length > 0 && (
            <div className="p-5 bg-white border-t border-slate-200 space-y-4">
              {/* Coupon Bar */}
              {coupon ? (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Coupon: {coupon.code} (-${discount.toFixed(2)})</span>
                  </div>
                  <button onClick={removeCoupon} className="text-slate-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Promo code (try WELCOME10)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#78936D]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#F0F4ED] hover:bg-[#DCE7D5] text-[#20351F] text-xs font-bold transition-colors"
                  >
                    Apply
                  </button>
                </form>
              )}

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100 font-extrabold text-sm text-[#20351F]">
                  <span>Total</span>
                  <span className="text-base text-[#C8643D]">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Trigger */}
              <button
                onClick={() => setIsCheckoutOpen(true)}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#20351F] hover:bg-[#152414] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={(id, tracking) => {
          setIsCheckoutOpen(false);
          setOrderSuccessData({ id, tracking });
        }}
      />
    </div>
  );
};
