import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Heart,
  ShoppingBag,
  Bell,
  Sparkles,
  AlertTriangle,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Stethoscope,
  ShieldCheck,
  Calendar,
  LogIn,
  DollarSign,
  Package,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import api from '../../services/api.js';

export const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { totalItemCount, setIsCartOpen } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [adminSidebarOpen, setAdminSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    const handleToggle = () => setAdminSidebarOpen((prev) => !prev);
    window.addEventListener('toggle-admin-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-admin-sidebar', handleToggle);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setAdminSidebarOpen(false);
      }
    };
    if (adminSidebarOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [adminSidebarOpen]);

  const fetchNotifs = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data?.success) {
        setNotifications(res.data.data);
        setUnreadNotifs(res.data.unreadCount || 0);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifs();
    }
  }, [user, location.pathname]);

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setUnreadNotifs(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {
      // ignore
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Book Services', path: '/booking' },
    { name: 'My Pets', path: '/pets' },
    { name: 'Pet Supplies', path: '/store' },
  ];

  const handleSignOut = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    setAdminSidebarOpen(false);
    await logout();
    navigate('/');
  };

  const isAdminRoute = location.pathname.startsWith('/admin');

  const adminNavItems = [
    {
      id: 'overview',
      label: 'Executive Overview',
      subtitle: 'Financials, KPIs & metrics',
      icon: DollarSign,
    },
    {
      id: 'bookings',
      label: 'Care Bookings',
      subtitle: 'Appointments & patient triage',
      icon: Calendar,
    },
    {
      id: 'orders',
      label: 'Store Orders',
      subtitle: 'Purchases & fulfillment',
      icon: ShoppingBag,
    },
    {
      id: 'inventory',
      label: 'Products & Accessories',
      subtitle: 'Stock levels & price catalog',
      icon: Package,
    },
    {
      id: 'pets',
      label: 'Marketplace Adoptions',
      subtitle: 'Pet listings & moderation',
      icon: Heart,
    },
    {
      id: 'emergency',
      label: 'Emergency Network',
      subtitle: '24/7 Trauma hospitals',
      icon: AlertTriangle,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Admin Left Sidebar 3-Line Menu Toggle */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {isAdminRoute && (
              <button
                onClick={() => setAdminSidebarOpen(!adminSidebarOpen)}
                className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer shadow-2xs flex items-center justify-center min-w-[42px] min-h-[42px] group ${adminSidebarOpen
                  ? 'bg-[#20351F] text-white border-[#20351F]'
                  : 'bg-[#FCFCF9] hover:bg-emerald-50 text-[#20351F] hover:text-emerald-800 border-stone-200/90 hover:border-emerald-300'
                  }`}
                title={adminSidebarOpen ? 'Close Navigation Sidebar' : 'Open Navigation Sidebar'}
                aria-label="Toggle Navigation Sidebar"
              >
                <Menu className={`w-5 h-5 transition-transform group-hover:scale-110 ${adminSidebarOpen ? 'text-emerald-400' : 'text-[#20351F]'}`} />
              </button>
            )}

            <Link to={isAdminRoute ? "/admin" : "/"} className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#20351F] text-white flex items-center justify-center shadow-sm">
                <Heart className="w-5 h-5 text-[#DCE7D5] fill-[#DCE7D5]/40" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-[#20351F] leading-none">
                  PetCare
                </span>
                <span className="text-[10px] tracking-wider uppercase font-semibold text-[#78936D] mt-0.5">
                  {isAdminRoute ? 'Admin Operations Center' : 'Pet Care & Supplies'}
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links (Hidden in Admin Panel) */}
          {!isAdminRoute && (
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${isActive
                      ? 'bg-[#20351F] text-white shadow-xs'
                      : 'text-stone-700 hover:text-[#20351F] hover:bg-stone-100'
                      }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell (Only when logged in) */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative p-2 rounded-xl hover:bg-stone-100 text-stone-700 transition-colors"
                  aria-label="View notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifs > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-[#C8643D] text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                      {unreadNotifs}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-16 sm:top-full sm:mt-2 max-w-sm sm:w-96 mx-auto sm:mx-0 rounded-2xl bg-white shadow-2xl border border-stone-200 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-[#20351F]">Notifications</h3>
                        {unreadNotifs > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-[#C8643D] text-white text-[10px] font-bold">
                            {unreadNotifs}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadNotifs > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-xs text-[#78936D] hover:underline font-semibold cursor-pointer"
                          >
                            Mark read
                          </button>
                        )}
                        <button
                          onClick={() => setNotifOpen(false)}
                          className="p-1 text-stone-400 hover:text-stone-600 rounded-lg sm:hidden cursor-pointer"
                          title="Close notifications"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-stone-100 py-1">
                      {notifications.length === 0 ? (
                        <p className="text-center py-6 text-xs text-stone-400">No new notifications.</p>
                      ) : (
                        notifications.slice(0, 6).map((n) => (
                          <div key={n._id} className={`py-2.5 px-2 rounded-xl transition-colors ${n.read ? 'opacity-75' : 'bg-amber-50/50'}`}>
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-semibold text-[#20351F]">{n.title}</span>
                              <span className="text-[10px] text-stone-400 shrink-0">
                                {new Date(n.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="pt-2 border-t border-stone-100 text-center">
                      <Link
                        to="/calendar"
                        onClick={() => setNotifOpen(false)}
                        className="text-xs text-[#20351F] font-bold hover:underline"
                      >
                        View Care Schedule & Reminders →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
  
            {/* Profile Dropdown or Sign In */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                  title="Profile Menu"
                >
                  {user?.avatar ? (
                    <div className="w-8 h-8 rounded-full bg-[#20351F] text-white flex items-center justify-center font-bold text-xs">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  ) : (
                    <img src={user?.name.charAt(0).toUpperCase() || 'U'} className="w-8 h-8 rounded-full object-cover ring-1 ring-stone-300" />
                  )}
                </button>

                {userDropdownOpen && (
                  <div className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-full sm:mt-2 w-[calc(100vw-1rem)] sm:w-64 max-w-xs rounded-2xl bg-white shadow-2xl border border-stone-200 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-3 py-2 border-b border-stone-100 flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-[#20351F] truncate">{user?.name || 'Pet Parent'}</p>
                          {(isAdmin || isAdminRoute) && (
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 truncate">{user?.email}</p>
                      </div>
                      <button
                        onClick={() => setUserDropdownOpen(false)}
                        className="p-1 text-stone-400 hover:text-stone-600 rounded-lg sm:hidden cursor-pointer ml-2"
                        title="Close profile menu"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Consumer options only for regular pet parents */}
                    {!isAdmin && !isAdminRoute && (
                      <div className="py-1 space-y-0.5">
                        {/* Your Pet Bag / Shopping Cart */}
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            setIsCartOpen(true);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-[#20351F] shrink-0" />
                            <span className="font-semibold text-stone-800">Your Pet Bag</span>
                          </div>
                          {totalItemCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-[#20351F] text-white text-[10px] font-bold">
                              {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
                            </span>
                          ) : (
                            <span className="text-[10px] text-stone-400">Empty</span>
                          )}
                        </button>

                        <Link
                          to="/calendar"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
                        >
                          <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
                          <span>Care Calendar & Reminders</span>
                        </Link>

                        <Link
                          to="/emergency"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>Emergency SOS & 24/7 Clinics</span>
                        </Link>
                      </div>
                    )}

                    <div className="border-t border-stone-100 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#20351F] hover:bg-[#152414] text-white text-xs font-bold shadow-xs transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Mobile Menu Toggle (Consumer Only) */}
            {!isAdminRoute && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl lg:hidden text-stone-700 hover:bg-stone-100 cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop for open dropdowns on mobile */}
      {(notifOpen || userDropdownOpen) && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs sm:hidden"
          onClick={() => {
            setNotifOpen(false);
            setUserDropdownOpen(false);
          }}
        />
      )}

      {/* Mobile Drawer (Consumer Only) */}
      {mobileMenuOpen && !isAdminRoute && (
        <div className="lg:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-6 space-y-1.5 shadow-lg animate-in slide-in-from-top-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${location.pathname === link.path
                ? 'bg-[#20351F] text-white'
                : 'text-stone-800 hover:bg-stone-100'
                }`}
            >
              {link.name}
            </Link>
          ))}

          {/* Your Pet Bag in Mobile Drawer */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              setIsCartOpen(true);
            }}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#20351F]" />
              <span>Your Pet Bag</span>
            </div>
            {totalItemCount > 0 ? (
              <span className="px-2.5 py-0.5 rounded-full bg-[#20351F] text-white text-xs font-bold">
                {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
              </span>
            ) : (
              <span className="text-xs text-stone-400">Empty</span>
            )}
          </button>

          <div className="pt-2 border-t border-stone-200 space-y-1">
            <Link
              to="/emergency"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Emergency 24/7 Pet Clinics & SOS</span>
            </Link>

            {user ? (
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out ({user?.name || 'Account'})</span>
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold bg-[#20351F] text-white rounded-xl"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In / Register</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Admin Left-Side Slide-Over Navigation Drawer using Portal */}
      {isAdminRoute &&
        adminSidebarOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-stone-950/50 backdrop-blur-xs transition-opacity cursor-pointer"
              onClick={() => setAdminSidebarOpen(false)}
            />

            {/* Left Drawer Container (100% solid white, crisp borders, rich shadow) */}
            <aside className="relative z-10 w-80 sm:w-88 max-w-[85vw] h-full bg-white shadow-2xl border-r border-stone-200 flex flex-col justify-between animate-in slide-in-from-left duration-250 ease-out">
              <div className="flex flex-col flex-1 min-h-0">
                {/* Drawer Top Branding Header */}
                <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF9F5]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#20351F] text-white flex items-center justify-center shadow-xs">
                      <Heart className="w-5 h-5 text-[#DCE7D5] fill-[#DCE7D5]/40" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm text-[#20351F]">
                          PetCare
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                          Admin
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 font-medium">Operations Console</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAdminSidebarOpen(false)}
                    className="w-9 h-9 rounded-xl text-stone-400 hover:text-stone-800 hover:bg-stone-200/70 flex items-center justify-center transition-colors cursor-pointer"
                    title="Close sidebar (Esc)"
                    aria-label="Close sidebar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Navigation Items (Scrollable with custom sleek styling) */}
                <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-1.5">
                  <div className="px-2 pb-1.5 pt-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">
                      Management Consoles
                    </span>
                  </div>

                  {adminNavItems.map((item) => {
                    const Icon = item.icon;
                    const currentTab = searchParams.get('tab') || 'overview';
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSearchParams({ tab: item.id });
                          setAdminSidebarOpen(false);
                        }}
                        className={`w-full group flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer min-h-[54px] ${isActive
                          ? 'bg-[#20351F] text-white shadow-md ring-1 ring-[#20351F]'
                          : 'text-stone-700 hover:bg-[#F3F6F1] hover:text-[#20351F] border border-transparent hover:border-stone-200/70'
                          }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isActive
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-stone-100 text-stone-600 group-hover:bg-emerald-100 group-hover:text-emerald-800'
                              }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-stone-800'}`}>
                              {item.label}
                            </p>
                            <p className={`text-[10px] truncate ${isActive ? 'text-emerald-200/80' : 'text-stone-400'}`}>
                              {item.subtitle}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 ml-2">
                          {isActive ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 block shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-stone-500 group-hover:translate-x-0.5 transition-all" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Down Side: Sign Out Button */}
              <div className="p-4 border-t border-stone-200/80 bg-stone-50/80">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 hover:border-rose-300 text-xs font-bold transition-all cursor-pointer shadow-2xs group min-h-[46px]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center group-hover:bg-rose-200 transition-colors">
                      <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                    </div>
                    <span className="font-black">Sign Out</span>
                  </div>
                 
                </button>
              </div>
            </aside>
          </div>,
          document.body
        )}
    </header>
  );
};
