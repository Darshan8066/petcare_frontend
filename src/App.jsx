import React, { useEffect, useRef, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { PetProvider } from './context/PetContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { Navbar } from './components/layout/Navbar.jsx';
import { Footer } from './components/layout/Footer.jsx';
import { CartDrawer } from './components/layout/CartDrawer.jsx';

import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';

// Pages are loaded on demand so the first paint does not have to download the
// admin console, the video room and every other screen up front.
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx').then((m) => ({ default: m.DashboardPage })));
const PetsPage = lazy(() => import('./pages/PetsPage.jsx').then((m) => ({ default: m.PetsPage })));
const BookingPage = lazy(() => import('./pages/BookingPage.jsx').then((m) => ({ default: m.BookingPage })));
const StorePage = lazy(() => import('./pages/StorePage.jsx').then((m) => ({ default: m.StorePage })));
const MarketplacePage = lazy(() => import('./pages/MarketplacePage.jsx').then((m) => ({ default: m.MarketplacePage })));
const CalendarPage = lazy(() => import('./pages/CalendarPage.jsx').then((m) => ({ default: m.CalendarPage })));
const AIAssistantPage = lazy(() => import('./pages/AIAssistantPage.jsx').then((m) => ({ default: m.AIAssistantPage })));
const EmergencyPage = lazy(() => import('./pages/EmergencyPage.jsx').then((m) => ({ default: m.EmergencyPage })));
const AdminPage = lazy(() => import('./pages/AdminPage.jsx').then((m) => ({ default: m.AdminPage })));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx').then((m) => ({ default: m.LoginPage })));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage.jsx').then((m) => ({ default: m.AdminLoginPage })));
const VideoRoomPage = lazy(() => import('./pages/VideoRoomPage.jsx').then((m) => ({ default: m.VideoRoomPage })));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 rounded-full border-2 border-[#20351F]/20 border-t-[#20351F] animate-spin" />
  </div>
);

// RouteManager persists active path and prevents admin refresh from jumping to home
const RouteManager = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const hasRestoredRef = useRef(false);

  useEffect(() => {
    const isAuthPath = [
      '/login',
      '/register',
      '/admin-login',
      '/admin/login'
    ].includes(location.pathname);

    if (!isAuthPath) {
      const fullPath = location.pathname + location.search;
      sessionStorage.setItem('petcare_active_path', fullPath);
      if (location.pathname.startsWith('/admin')) {
        localStorage.setItem('petcare_last_admin_path', fullPath);
      }
    }
  }, [location]);

  useEffect(() => {
    if (loading) return;

    const storedRole = localStorage.getItem('petcare_user_role');
    const isAdminUser = user?.role === 'admin' || storedRole === 'admin';
    const lastAdminPath = localStorage.getItem('petcare_last_admin_path') || '/admin';
    const activePath = sessionStorage.getItem('petcare_active_path');

    if (isAdminUser) {
      if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/admin-login' || location.pathname === '/admin/login') {
        const target = activePath && activePath.startsWith('/admin') && !activePath.includes('login') ? activePath : lastAdminPath;
        navigate(target, { replace: true });
        return;
      }
    } else if (!hasRestoredRef.current && location.pathname === '/' && activePath && activePath !== '/' && !activePath.startsWith('/admin')) {
      hasRestoredRef.current = true;
      navigate(activePath, { replace: true });
    }
  }, [user, loading, location.pathname, navigate]);

  return null;
};

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <PetProvider>
            <CartProvider>
              <BrowserRouter>
                <RouteManager />
                <div className="min-h-screen bg-[#FCFCF5] text-[#263026] flex flex-col font-sans selection:bg-[#DCE7D5] selection:text-[#20351F]">
                  <Navbar />
                  <main className="flex-1">
                    <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<LoginPage initialTab="register" />} />
                      <Route path="/admin-login" element={<AdminLoginPage />} />
                      <Route path="/admin/login" element={<AdminLoginPage />} />
                      <Route path="/pets" element={<PetsPage />} />
                      <Route path="/book" element={<BookingPage />} />
                      <Route path="/booking" element={<BookingPage />} />
                      <Route path="/store" element={<StorePage />} />
                      <Route path="/marketplace" element={<MarketplacePage />} />
                      <Route path="/calendar" element={<CalendarPage />} />
                      <Route path="/ai-assistant" element={<AIAssistantPage />} />
                      <Route path="/emergency" element={<EmergencyPage />} />
                      <Route path="/admin" element={<AdminPage />} />
                      <Route path="/video-room" element={<VideoRoomPage />} />
                      <Route path="/consultation" element={<VideoRoomPage />} />
                      <Route path="/telehealth" element={<VideoRoomPage />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                    </Suspense>
                  </main>
                  <Footer />
                  <CartDrawer />
                </div>
              </BrowserRouter>
            </CartProvider>
          </PetProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
