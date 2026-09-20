import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  Heart,
  Calendar,
  DollarSign,
  ShoppingBag,
  Package,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Truck,
  AlertTriangle,
  Phone,
  Search,
  Filter,
  Check,
  X,
  RefreshCw,
  ExternalLink,
  HelpCircle,
  Stethoscope,
  Tag,
  Eye,
  Info,
  AlertCircle
} from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export const AdminPage = () => {
  const { user, isAdmin, logout, loading: authLoading } = useAuth();
  const { success, error: toastError, info } = useToast();
  const navigate = useNavigate();

  // Navigation tab synced with URL search params
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab =
    ['overview', 'bookings', 'orders', 'inventory', 'pets', 'emergency'].includes(rawTab)
      ? rawTab
      : 'overview';

  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState(new Date());
  const [showHelpBanner, setShowHelpBanner] = useState(true);

  // Data states
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [petListings, setPetListings] = useState([]);
  const [emergencyClinics, setEmergencyClinics] = useState([]);

  // Filtering states
  const [bookingFilter, setBookingFilter] = useState('all');
  const [orderFilter, setOrderFilter] = useState('all');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productSearch, setProductSearch] = useState('');

  // Add Product Modal
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: '',
    brand: 'PetCare Essentials',
    category: 'Pet Accessories',
    targetPet: 'All Pets',
    price: 19.99,
    originalPrice: 24.99,
    stockCount: 50,
    image: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=500&auto=format&fit=crop&q=80',
    description: 'High durability pet care accessory tested for comfort and safety.'
  });

  const notifyDataChanged = (type = 'general') => {
    window.dispatchEvent(new CustomEvent('petcare_data_updated', { detail: { type } }));
    localStorage.setItem('petcare_last_sync', Date.now().toString());
  };

  const fetchData = async (silent = false) => {
    try {
      if (!silent) {
        if (!stats) setLoading(true);
        else setIsRefreshing(true);
      }
      const [statsRes, bookRes, ordRes, prodRes, petRes, clinicRes] = await Promise.all([
        api.get('/admin/stats').catch(() => ({ data: { success: true, data: {} } })),
        api.get('/bookings').catch(() => ({ data: { success: true, data: [] } })),
        api.get('/orders').catch(() => ({ data: { success: true, data: [] } })),
        api.get('/products').catch(() => ({ data: { success: true, data: [] } })),
        api.get('/pet-listings').catch(() => ({ data: { success: true, data: [] } })),
        api.get('/emergency-clinics').catch(() => ({ data: { success: true, data: [] } }))
      ]);

      if (statsRes.data?.success) setStats(statsRes.data.data);
      if (bookRes.data?.success) setBookings(bookRes.data.data);
      if (ordRes.data?.success) setOrders(ordRes.data.data);
      if (prodRes.data?.success) setProducts(prodRes.data.data);
      if (petRes.data?.success) setPetListings(petRes.data.data);
      if (clinicRes.data?.success) setEmergencyClinics(clinicRes.data.data);
      setLastUpdatedTime(new Date());
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData(false);

      // Real-time live auto-update without needing page refresh (runs every 3.5 seconds)
      const pollInterval = setInterval(() => {
        fetchData(true);
      }, 3500);

      // Instant update when internal app events or other tabs trigger data changes
      const handleDataEvent = () => {
        fetchData(true);
      };
      window.addEventListener('petcare_data_updated', handleDataEvent);
      window.addEventListener('storage', handleDataEvent);

      return () => {
        clearInterval(pollInterval);
        window.removeEventListener('petcare_data_updated', handleDataEvent);
        window.removeEventListener('storage', handleDataEvent);
      };
    }
  }, [isAdmin]);

  // Booking handlers
  const handleUpdateBookingStatus = async (bookingId, status) => {
    try {
      const res = await api.put(`/bookings/${bookingId}`, { status });
      if (res.data?.success) {
        setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status } : b));
        success(`Appointment status updated to "${status}".`);
        notifyDataChanged('booking');
        fetchData(true);
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update booking status.');
    }
  };

  // Order handlers
  const handleUpdateOrderStatus = async (orderId, orderStatus) => {
    try {
      const res = await api.patch(`/orders/${orderId}`, { orderStatus });
      if (res.data?.success) {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, orderStatus } : o));
        success(`Order status updated to "${orderStatus}".`);
        notifyDataChanged('order');
        fetchData(true);
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update order status.');
    }
  };

  // Product handlers
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/products', newProduct);
      if (res.data?.success) {
        setProducts(prev => [res.data.data, ...prev]);
        setIsAddProductOpen(false);
        success('New product created and added to the Pet Store!', 'Inventory Updated');
        notifyDataChanged('product');
        fetchData(true);
        // Reset form
        setNewProduct({
          title: '',
          brand: 'PetCare Essentials',
          category: 'Pet Accessories',
          targetPet: 'All Pets',
          price: 19.99,
          originalPrice: 24.99,
          stockCount: 50,
          image: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=500&auto=format&fit=crop&q=80',
          description: 'High durability pet care accessory tested for comfort and safety.'
        });
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to create product.');
    }
  };

  const handleUpdateProductStock = async (productId, delta) => {
    const prod = products.find(p => p._id === productId);
    if (!prod) return;
    const newStock = Math.max(0, (prod.stockCount || 0) + delta);
    try {
      await api.patch(`/products/${productId}`, {
        stockCount: newStock,
        inStock: newStock > 0
      });
      setProducts(prev => prev.map(p => p._id === productId ? { ...p, stockCount: newStock, inStock: newStock > 0 } : p));
      success(`Updated stock for ${prod.title.slice(0, 20)}... to ${newStock} units.`);
      notifyDataChanged('product');
      fetchData(true);
    } catch (err) {
      toastError('Failed to update stock');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product from the store?')) return;
    try {
      await api.delete(`/products/${productId}`);
      setProducts(prev => prev.filter(p => p._id !== productId));
      success('Product removed from catalog.');
      notifyDataChanged('product');
      fetchData(true);
    } catch (err) {
      toastError('Failed to delete product');
    }
  };

  // Marketplace Pet handlers
  const handleUpdatePetListingStatus = async (listingId, status) => {
    try {
      await api.patch(`/pet-listings/${listingId}`, { status });
      setPetListings(prev => prev.map(p => p._id === listingId ? { ...p, status } : p));
      success(`Pet status updated to "${status}".`);
      notifyDataChanged('pet-listing');
      fetchData(true);
    } catch (err) {
      toastError('Failed to update pet status');
    }
  };

  const handleDeletePetListing = async (listingId) => {
    if (!confirm('Remove this pet listing from the marketplace?')) return;
    try {
      await api.delete(`/pet-listings/${listingId}`);
      setPetListings(prev => prev.filter(p => p._id !== listingId));
      success('Pet listing removed from adoption board.');
      notifyDataChanged('pet-listing');
      fetchData(true);
    } catch (err) {
      toastError('Failed to delete pet listing');
    }
  };

  // While checking auth token, show smooth loader to prevent premature redirect
  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-stone-500">Connecting to Administrator Console...</p>
      </div>
    );
  }

  // If user is not logged in as Admin, block access and show relevant gate
  if (!isAdmin) {
    if (user && user.role !== 'admin') {
      return (
        <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto shadow-md">
            <AlertCircle className="w-8 h-8 text-rose-600" />
          </div>
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-900 text-xs font-bold uppercase tracking-wider">
              Access Restricted
            </span>
            <h1 className="text-3xl font-black text-[#20351F]">
              Clinic Administrator Access Only
            </h1>
            <p className="text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
              You are currently signed in as a Pet Parent (<strong>{user.name}</strong>). Regular users cannot access the administration console or clinic management overviews.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/"
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#20351F] text-white text-xs font-bold hover:bg-[#152414] transition-colors"
            >
              ← Back to Pet Parent Home
            </Link>
            <Link
              to="/admin-login"
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-stone-100 text-stone-800 text-xs font-bold hover:bg-stone-200 transition-colors"
            >
              Sign In as Administrator
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-[#20351F] text-white flex items-center justify-center mx-auto shadow-lg">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
        </div>
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
            Protected Staff Area
          </span>
          <h1 className="text-3xl font-black text-[#20351F]">
            Clinic Administration Portal
          </h1>
          <p className="text-sm text-[#687166] max-w-md mx-auto">
            The PetCare Administration Console allows pet care clinical staff to approve appointments, restock inventory, process orders, and moderate adoption listings.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#20351F]/10 shadow-sm max-w-md mx-auto text-center space-y-4">
          <p className="text-xs text-stone-600">
            Please authenticate using your authorized administrator account to access clinic management controls.
          </p>

          <Link
            to="/admin-login"
            className="w-full py-3 rounded-2xl bg-[#20351F] hover:bg-[#152414] text-white text-xs font-black shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Go to Administrator Sign In (/admin-login)</span>
          </Link>
        </div>

        <div className="pt-4">
          <Link
            to="/"
            className="text-xs font-bold text-[#687166] hover:text-[#20351F] transition-colors inline-flex items-center gap-1"
          >
            ← Return to User Pet Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Filtered views
  const filteredBookings = bookings.filter(b => {
    if (bookingFilter === 'all') return true;
    return b.status?.toLowerCase() === bookingFilter.toLowerCase();
  });

  const filteredOrders = orders.filter(o => {
    if (orderFilter === 'all') return true;
    return o.orderStatus?.toLowerCase() === orderFilter.toLowerCase();
  });

  const filteredProducts = products.filter(p => {
    const matchesCat = productCategoryFilter === 'all' || p.category === productCategoryFilter;
    const matchesSearch = !productSearch || p.title?.toLowerCase().includes(productSearch.toLowerCase()) || p.category?.toLowerCase().includes(productSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const adminTabs = [
    { id: 'overview', label: 'Executive Overview', count: null, icon: DollarSign },
    { id: 'bookings', label: 'Care Bookings', count: bookings.length, icon: Calendar },
    { id: 'orders', label: 'Store Orders', count: orders.length, icon: ShoppingBag },
    { id: 'inventory', label: 'Products & Accessories', count: products.length, icon: Package },
    { id: 'pets', label: 'Marketplace Adoptions', count: petListings.length, icon: Heart },
    { id: 'emergency', label: 'Emergency Network', count: emergencyClinics.length, icon: AlertTriangle }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-800 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Clinic & Platform Operations Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#20351F] tracking-tight">
            Administrator Console
          </h1>
          <p className="text-xs sm:text-sm text-[#687166] mt-0.5">
            Logged in as <strong className="text-[#20351F] font-bold">{user?.name || 'Platform Administrator'}</strong> ({user?.email})
          </p>
        </div>

        {/* Active Console & Live Sync Indicators */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => fetchData(false)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 text-xs font-bold text-stone-700 shadow-2xs hover:shadow-sm transition-all cursor-pointer disabled:opacity-50"
            title="Click to force live sync now"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Now'}</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-[11px] font-bold text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Auto-Update</span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-stone-100/90 border border-stone-200 text-xs font-bold text-stone-700">
            <span className="text-stone-400 font-medium">Console:</span>
            <span className="text-[#20351F] font-black">
              {adminTabs.find((t) => t.id === activeTab)?.label}
            </span>
          </div>
        </div>
      </div>

      {/* Main Full-Width Content Area */}
      <div className="w-full space-y-8">
        {/* Easy-To-Understand Admin Onboarding Guide Banner */}
        {showHelpBanner && (
          <div className="p-5 rounded-3xl bg-emerald-50/80 border border-emerald-200/80 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h2 className="font-extrabold text-xs sm:text-sm text-emerald-950">
                  How to use the Admin Operations Console:
                </h2>
                <p className="text-xs text-emerald-800 leading-relaxed max-w-4xl">
                  • <strong>Care Bookings Tab:</strong> Review incoming care consultations and click <em>"Mark Completed"</em> after patient examinations.<br />
                  • <strong>Store Orders Tab:</strong> View store orders and click <em>"Mark as Shipped"</em> to generate tracking details.<br />
                  • <strong>Inventory Tab:</strong> Restock accessories, update pricing, or click <em>"+ Add New Product / Accessory"</em> to stock new items in the pet store.<br />
                  • <strong>Marketplace Tab:</strong> Moderate community adoptable pets and review seller inquiries.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowHelpBanner(false)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* KPI Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-white border border-[#20351F]/10 shadow-xs">
                <div className="flex items-center justify-between text-xs font-bold text-[#687166] mb-2">
                  <span>Total Parents</span>
                  <Users className="w-4 h-4 text-[#78936D]" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-[#20351F]">{stats?.totalUsers || 2}</p>
                <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">Registered pet owners</span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-[#20351F]/10 shadow-xs">
                <div className="flex items-center justify-between text-xs font-bold text-[#687166] mb-2">
                  <span>Enrolled Pets</span>
                  <Heart className="w-4 h-4 text-[#C8643D]" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-[#20351F]">{stats?.totalPets || 2}</p>
                <span className="text-[11px] text-stone-500 font-semibold mt-1 block">Active health monitoring</span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-[#20351F]/10 shadow-xs">
                <div className="flex items-center justify-between text-xs font-bold text-[#687166] mb-2">
                  <span>Care Bookings</span>
                  <Calendar className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-[#20351F]">{bookings.length}</p>
                <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">Clinics & In-Home visits</span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-[#20351F]/10 shadow-xs">
                <div className="flex items-center justify-between text-xs font-bold text-[#687166] mb-2">
                  <span>Total Revenue</span>
                  <DollarSign className="w-4 h-4 text-[#D9A83F]" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-[#20351F]">
                  ${(stats?.grossRevenue || orders.reduce((sum, o) => sum + (o.total || 0), 0) + bookings.reduce((sum, b) => sum + (b.total || 0), 0)).toFixed(2)}
                </p>
                <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">Consults + Supply store</span>
              </div>
            </div>

            {/* Quick Operations Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-white border border-[#20351F]/10 shadow-xs space-y-3">
                <div className="flex items-center gap-2 font-black text-sm text-[#20351F]">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Pending Appointments</span>
                </div>
                <p className="text-xs text-[#687166]">
                  You have {bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length} upcoming pet consultations ready for completion.
                </p>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className="w-full py-2.5 rounded-xl bg-[#F0F4ED] hover:bg-[#DCE7D5] text-[#20351F] text-xs font-bold transition-all cursor-pointer"
                >
                  Manage Consultations →
                </button>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-[#20351F]/10 shadow-xs space-y-3">
                <div className="flex items-center gap-2 font-black text-sm text-[#20351F]">
                  <Package className="w-4 h-4 text-[#C8643D]" />
                  <span>Store Inventory Status</span>
                </div>
                <p className="text-xs text-[#687166]">
                  Catalog has {products.length} active supplies and accessories ready for user purchase.
                </p>
                <button
                  onClick={() => {
                    setActiveTab('inventory');
                    setIsAddProductOpen(true);
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#F0F4ED] hover:bg-[#DCE7D5] text-[#20351F] text-xs font-bold transition-all cursor-pointer"
                >
                  + Add Product / Restock →
                </button>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-[#20351F]/10 shadow-xs space-y-3">
                <div className="flex items-center gap-2 font-black text-sm text-[#20351F]">
                  <Heart className="w-4 h-4 text-rose-600" />
                  <span>20 Adoptable Pets Moderation</span>
                </div>
                <p className="text-xs text-[#687166]">
                  {petListings.length} verified listings published on the community adoption marketplace.
                </p>
                <button
                  onClick={() => setActiveTab('pets')}
                  className="w-full py-2.5 rounded-xl bg-[#F0F4ED] hover:bg-[#DCE7D5] text-[#20351F] text-xs font-bold transition-all cursor-pointer"
                >
                  Review Pet Listings →
                </button>
              </div>
            </div>

            {/* System Health Check */}
            <div className="p-6 rounded-3xl bg-white border border-[#20351F]/10 shadow-xs">
              <h3 className="font-extrabold text-sm text-[#20351F] mb-3">Live Platform Infrastructure Health</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-[#FCFCF5] border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#20351F] block">Server API Routing</span>
                    <span className="text-[11px] text-stone-500">Port 3000 Ingress</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                    <Check className="w-3 h-3" /> Operational
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#FCFCF5] border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#20351F] block">Database Storage</span>
                    <span className="text-[11px] text-stone-500">In-Memory Store Sync</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                    <Check className="w-3 h-3" /> Synchronized
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#FCFCF5] border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#20351F] block">Gemini 3.8 Flash AI</span>
                    <span className="text-[11px] text-stone-500">Clinical Triage Engine</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                    <Check className="w-3 h-3" /> Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-[#20351F]">Clinical Consultations & Bookings</h2>
                <p className="text-xs text-[#687166]">Manage pet appointments, update status, and finalize examinations</p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl text-xs font-bold">
                {['all', 'confirmed', 'completed', 'cancelled'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setBookingFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl capitalize transition-all cursor-pointer ${
                      bookingFilter === filter ? 'bg-white text-[#20351F] shadow-xs' : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredBookings.length === 0 ? (
                <div className="py-12 text-center bg-white rounded-3xl border border-stone-200 text-xs text-stone-400">
                  No appointments matching the selected filter.
                </div>
              ) : (
                filteredBookings.map((b) => (
                  <div
                    key={b._id}
                    className="p-5 rounded-3xl bg-white border border-[#20351F]/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-[#20351F] text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Stethoscope className="w-5 h-5 text-[#DCE7D5]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-[#20351F]">{b.serviceName}</h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            b.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : b.status === 'cancelled'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {b.status}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 mt-0.5">
                          Patient: <strong>{b.petName || 'Milo'}</strong> · Doctor: <strong>{b.providerName}</strong>
                        </p>
                        <p className="text-xs text-stone-400 mt-0.5 flex items-center gap-2">
                          <span>🗓️ {b.date} at {b.timeSlot}</span>
                          <span>•</span>
                          <span>Fee: ${b.total?.toFixed(2)} ({b.paymentStatus || 'paid'})</span>
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end md:self-center">
                      {b.status !== 'completed' && (
                        <button
                          onClick={() => handleUpdateBookingStatus(b._id, 'completed')}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Completed</span>
                        </button>
                      )}

                      {b.status !== 'confirmed' && b.status !== 'completed' && (
                        <button
                          onClick={() => handleUpdateBookingStatus(b._id, 'confirmed')}
                          className="px-3.5 py-2 rounded-xl bg-[#20351F] hover:bg-[#152414] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirm</span>
                        </button>
                      )}

                      {b.status !== 'cancelled' && (
                        <button
                          onClick={() => handleUpdateBookingStatus(b._id, 'cancelled')}
                          className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-600 text-xs font-bold transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-[#20351F]">Pet Store Orders & Fulfillment</h2>
                <p className="text-xs text-[#687166]">Track customer purchases, assign delivery statuses, and manage shipments</p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl text-xs font-bold">
                {['all', 'Processing', 'Shipped', 'Delivered'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setOrderFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl capitalize transition-all cursor-pointer ${
                      orderFilter === filter ? 'bg-white text-[#20351F] shadow-xs' : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="py-12 text-center bg-white rounded-3xl border border-stone-200 text-xs text-stone-400">
                  No orders found under "{orderFilter}".
                </div>
              ) : (
                filteredOrders.map((o) => (
                  <div
                    key={o._id}
                    className="p-6 rounded-3xl bg-white border border-[#20351F]/10 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-extrabold text-[#20351F]">
                            Tracking: {o.trackingNumber || 'PET-AUTO'}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            o.orderStatus === 'Delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : o.orderStatus === 'Shipped'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {o.orderStatus || 'Processing'}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          Placed on {new Date(o.createdAt || Date.now()).toLocaleString()} · Payment: {o.paymentMethod || 'Card'}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-black text-[#20351F] block">
                          ${(o.total || o.totalAmount || 0).toFixed(2)}
                        </span>
                        <span className="text-[11px] text-emerald-700 font-semibold">
                          {o.paymentStatus === 'paid' ? '✓ Paid in Full' : 'Pending Payment'}
                        </span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {o.items?.map((item, idx) => {
                        const prod = item.product || item;
                        return (
                          <div key={idx} className="flex items-center gap-2.5 p-2 rounded-2xl bg-[#FCFCF5] border border-stone-100 text-xs">
                            {prod.image && (
                              <img src={prod.image} alt={prod.title} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-[#20351F] truncate">{prod.title}</p>
                              <p className="text-[11px] text-stone-500">Qty: {item.quantity || 1} · ${prod.price?.toFixed(2)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Destination & Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-stone-100 text-xs">
                      <div className="text-stone-600">
                        <strong>Deliver to:</strong> {o.shippingAddress?.fullName || 'Darshan'}, {o.shippingAddress?.street || '742 Evergreen Terrace'}, {o.shippingAddress?.city || 'Springfield'}
                      </div>

                      <div className="flex items-center gap-2">
                        {o.orderStatus !== 'Shipped' && o.orderStatus !== 'Delivered' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(o._id, 'Shipped')}
                            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Mark as Shipped</span>
                          </button>
                        )}

                        {o.orderStatus !== 'Delivered' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(o._id, 'Delivered')}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Delivered</span>
                          </button>
                        )}

                        {o.orderStatus !== 'Cancelled' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(o._id, 'Cancelled')}
                            className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-600 text-xs font-bold transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: INVENTORY & PET ACCESSORIES */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-[#20351F]">Store Products & Pet Accessories</h2>
                <p className="text-xs text-[#687166]">Manage catalog items, update prices, adjust inventory stock, or add accessories</p>
              </div>

              <button
                onClick={() => setIsAddProductOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-[#20351F] hover:bg-[#152414] text-white text-xs font-extrabold shadow-sm transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>+ Add New Product / Accessory</span>
              </button>
            </div>

            {/* Search & Category Filter */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search supplies or accessories..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 bg-white text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#78936D]"
                />
              </div>

              <select
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#78936D] cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="Pet Accessories">Pet Accessories</option>
                <option value="Dog Food">Dog Food</option>
                <option value="Cat Food">Cat Food</option>
                <option value="Treats">Treats</option>
                <option value="Supplements">Supplements</option>
                <option value="Grooming">Grooming</option>
              </select>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((p) => (
                <div
                  key={p._id}
                  className="p-4 rounded-3xl bg-white border border-[#20351F]/10 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="relative h-40 rounded-2xl overflow-hidden bg-stone-100 mb-3">
                      <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                      <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold backdrop-blur-xs">
                        {p.category}
                      </span>
                      <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        (p.stockCount || 0) > 10 ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                      }`}>
                        {p.stockCount || 0} in stock
                      </span>
                    </div>

                    <h3 className="font-extrabold text-sm text-[#20351F] line-clamp-2">{p.title}</h3>
                    <p className="text-[11px] text-stone-500 mt-1 line-clamp-2">{p.description}</p>
                  </div>

                  <div className="pt-2 border-t border-stone-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-black text-[#20351F]">${p.price.toFixed(2)}</span>
                      <span className="text-[11px] text-stone-400">Target: {p.targetPet || 'All'}</span>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        onClick={() => handleUpdateProductStock(p._id, 10)}
                        className="flex-1 py-1.5 rounded-xl bg-[#F0F4ED] hover:bg-[#DCE7D5] text-[#20351F] text-[11px] font-bold transition-all text-center cursor-pointer"
                      >
                        +10 Stock
                      </button>
                      <button
                        onClick={() => handleUpdateProductStock(p._id, -1)}
                        className="py-1.5 px-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-bold transition-all text-center cursor-pointer"
                      >
                        -1
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p._id)}
                        className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all cursor-pointer"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: PET ADOPTIONS MODERATION */}
        {activeTab === 'pets' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-[#20351F]">Marketplace & 20 Adoptable Pets</h2>
                <p className="text-xs text-[#687166]">Review community listings, approve adoptions, or update availability</p>
              </div>
              <Link
                to="/marketplace"
                className="px-4 py-2 rounded-2xl bg-[#F0F4ED] hover:bg-[#DCE7D5] text-[#20351F] text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto"
              >
                <span>View Live Marketplace →</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {petListings.map((p) => (
                <div
                  key={p._id}
                  className="p-3.5 rounded-3xl bg-white border border-[#20351F]/10 shadow-xs flex flex-col justify-between space-y-2.5"
                >
                  <div>
                    <div className="relative h-36 rounded-2xl overflow-hidden bg-stone-100 mb-2">
                      <img src={p.photos?.[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500'} alt={p.title} className="w-full h-full object-cover" />
                      <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold">
                        {p.species}
                      </span>
                      <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'available' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                      }`}>
                        {p.status}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm text-[#20351F]">{p.title}</h4>
                    <p className="text-[11px] text-stone-500">{p.breed} · {p.age}</p>
                    <p className="text-xs font-black text-[#C8643D] mt-1">
                      {p.isForAdoption ? 'Free Adoption' : `$${p.price}`}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center gap-1.5">
                    <button
                      onClick={() => handleUpdatePetListingStatus(p._id, p.status === 'available' ? 'sold' : 'available')}
                      className="flex-1 py-1.5 rounded-xl bg-[#F0F4ED] hover:bg-[#DCE7D5] text-[#20351F] text-[11px] font-bold transition-all text-center cursor-pointer"
                    >
                      {p.status === 'available' ? 'Mark Adopted/Sold' : 'Mark Available'}
                    </button>
                    <button
                      onClick={() => handleDeletePetListing(p._id)}
                      className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all cursor-pointer"
                      title="Delete listing"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: EMERGENCY NETWORK */}
        {activeTab === 'emergency' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-[#20351F]">Verified 24/7 Emergency Clinic Network</h2>
                <p className="text-xs text-[#687166]">Critical trauma hospitals connected to the PetCare 1-Tap SOS Dispatch</p>
              </div>
              <Link
                to="/emergency"
                className="px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Preview Emergency SOS Page →</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {emergencyClinics.map((clinic) => (
                <div
                  key={clinic._id}
                  className="p-6 rounded-3xl bg-white border border-[#20351F]/10 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {clinic.openHours}
                      </span>
                      <span className="text-xs font-bold text-[#20351F]">{clinic.distance} away</span>
                    </div>

                    <h3 className="font-extrabold text-base text-[#20351F]">{clinic.name}</h3>
                    <p className="text-xs text-stone-500 mt-1">{clinic.address}</p>

                    <div className="mt-3 p-3 rounded-2xl bg-[#FCFCF5] border border-stone-200 text-xs">
                      <span className="text-[10px] font-bold text-stone-400 block uppercase mb-1">Trauma Services</span>
                      <div className="flex flex-wrap gap-1">
                        {clinic.services?.map((s, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-white border border-stone-200 text-[10px] text-stone-700">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex gap-2">
                    <a
                      href={`tel:${clinic.phone}`}
                      className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{clinic.phone}</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-lg font-black text-[#20351F]">Add Product / Pet Accessory</h3>
              <button
                onClick={() => setIsAddProductOpen(false)}
                className="p-1 rounded-xl hover:bg-stone-100 text-stone-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={newProduct.title}
                  onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                  placeholder="e.g. Orthopedic Memory Foam Pet Bed"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#78936D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Category</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#78936D]"
                  >
                    <option value="Pet Accessories">Pet Accessories</option>
                    <option value="Dog Food">Dog Food</option>
                    <option value="Cat Food">Cat Food</option>
                    <option value="Treats">Treats</option>
                    <option value="Supplements">Supplements</option>
                    <option value="Grooming">Grooming</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Target Pet</label>
                  <select
                    value={newProduct.targetPet}
                    onChange={(e) => setNewProduct({ ...newProduct, targetPet: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#78936D]"
                  >
                    <option value="All Pets">All Pets</option>
                    <option value="Dogs">Dogs</option>
                    <option value="Cats">Cats</option>
                    <option value="Birds">Birds</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#78936D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Initial Stock Count</label>
                  <input
                    type="number"
                    required
                    value={newProduct.stockCount}
                    onChange={(e) => setNewProduct({ ...newProduct, stockCount: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#78936D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={newProduct.image}
                  onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#78936D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Product Description</label>
                <textarea
                  rows={3}
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#78936D]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#20351F] hover:bg-[#152414] text-white text-xs font-extrabold shadow-sm"
                >
                  Save & Publish to Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
