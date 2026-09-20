import React, { useState } from 'react';
import { X, CheckCircle, ShieldCheck, CreditCard, Truck, MapPin } from 'lucide-react';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import api from '../../services/api.js';

export const CheckoutModal = ({ isOpen, onClose, onSuccess }) => {
  const { items, subtotal, shipping, tax, discount, total, coupon, clearCart } = useCart();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.name || 'Darshan',
    street: user?.address?.street || '742 Evergreen Terrace',
    city: user?.address?.city || 'Springfield',
    state: user?.address?.state || 'OR',
    zipCode: user?.address?.zipCode || '97477',
    phone: user?.phone || '+1 (555) 382-9011',
    paymentMethod: 'Credit Card',
    cardNumber: '•••• •••• •••• 4242',
    expDate: '08/28',
    cvv: '123'
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderPayload = {
        items: items.map(i => ({
          productId: i.product._id,
          quantity: i.quantity,
        })),
        shippingAddress: {
          fullName: formData.fullName,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          phone: formData.phone,
        },
        paymentMethod: formData.paymentMethod,
        couponCode: coupon?.code
      };

      const res = await api.post('/orders/checkout', orderPayload);
      if (res.data?.success) {
        const order = res.data.data;
        clearCart();
        window.dispatchEvent(new CustomEvent('petcare_data_updated', { detail: { type: 'order' } }));
        localStorage.setItem('petcare_last_sync', Date.now().toString());
        success('Payment authorized and order confirmed!', 'Order Placed');
        onSuccess(order._id, order.trackingNumber);
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-[#20351F]/10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-[#FBFBF6]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#20351F] text-white flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-[#DCE7D5]" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#20351F]">Secure PetCare Checkout</h3>
              <p className="text-xs text-[#687166]">Encrypted 256-bit payment verification</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Order Summary Snapshot */}
          <div className="bg-[#F0F4ED] p-4 rounded-2xl border border-[#78936D]/30 space-y-2 text-xs text-[#20351F]">
            <div className="flex justify-between">
              <span className="text-[#687166]">Items ({items.length})</span>
              <span className="font-semibold">${subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Promo Discount ({coupon?.code})</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#687166]">Standard Shipping</span>
              <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#687166]">Estimated Tax (8%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="border-t border-[#78936D]/30 pt-2 flex justify-between font-extrabold text-sm text-[#20351F]">
              <span>Total Payable</span>
              <span className="text-base text-[#C8643D]">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <h4 className="text-sm font-bold text-[#20351F] flex items-center gap-1.5 mb-3">
              <MapPin className="w-4 h-4 text-[#78936D]" /> Delivery Address
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#78936D]"
                />
              </div>
              <div className="col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#78936D]"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#78936D]"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">State / Zip</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-16 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#78936D]"
                  />
                  <input
                    type="text"
                    required
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#78936D]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <h4 className="text-sm font-bold text-[#20351F] flex items-center gap-1.5 mb-3">
              <CreditCard className="w-4 h-4 text-[#78936D]" /> Payment Method
            </h4>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl border-2 border-[#20351F] bg-[#FCFCF5] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-[#20351F]" />
                  <span className="font-bold text-[#20351F]">Instant Card Payment (Visa / Master / Amex)</span>
                </div>
                <CheckCircle className="w-4 h-4 text-[#20351F]" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-medium text-slate-600 mb-1">Card Number</label>
                  <input
                    type="text"
                    disabled
                    value={formData.cardNumber}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Exp Date</label>
                  <input
                    type="text"
                    disabled
                    value={formData.expDate}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#C8643D] hover:bg-[#B55530] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Truck className="w-4 h-4" />
              {loading ? 'Authorizing Payment...' : `Authorize & Place Order · $${total.toFixed(2)}`}
            </button>
            <p className="text-[11px] text-center text-slate-400 mt-2">
              Free 30-day return policy on all unopened pet supplies.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
