import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  User as UserIcon,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Heart,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const LoginPage = ({ initialTab }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabFromQuery = searchParams.get('tab') === 'register' ? 'register' : 'user';
  const defaultTab = initialTab || tabFromQuery;

  const { login, register, submitting } = useAuth();

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showPassword, setShowPassword] = useState(false);

  // User login form state
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  const handleUserLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!userEmail.trim() || !userPassword) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    // The server's actual reason is shown instead of a blanket "invalid
    // credentials", so a network or configuration failure is distinguishable
    // from a genuinely wrong password.
    const result = await login(userEmail.trim(), userPassword, 'user');
    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    // Matches the server-side minimum, so the rule is enforced before a
    // round-trip rather than only after one.
    if (regPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    const result = await register(regName.trim(), regEmail.trim(), regPassword);
    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#20351F] text-white shadow-md mb-2">
            <Heart className="w-7 h-7 text-[#DCE7D5] fill-[#DCE7D5]/40" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#20351F] tracking-tight">
            PetCare
          </h1>
          <p className="text-xs sm:text-sm text-[#687166]">
            {activeTab === 'user' ? 'Welcome back! Sign in to your pet parent account.' : 'Create an account to manage care, records, and appointments.'}
          </p>
        </div>

        {/* User Login / Register Selector Tabs (2 tabs only) */}
        <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-stone-200/70 text-xs font-bold gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('user');
              setErrorMsg('');
            }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'user'
                ? 'bg-white text-[#20351F] shadow-xs font-black'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5 text-[#78936D]" />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMsg('');
            }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'register'
                ? 'bg-white text-[#C8643D] shadow-xs font-black'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Register New Account</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* User Login Form */}
        {activeTab === 'user' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#20351F]/10 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h2 className="font-extrabold text-base text-[#20351F]">Pet Parent Login</h2>
                <p className="text-[11px] text-stone-500">Access pet profiles, bookings, and health records</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                Dashboard
              </span>
            </div>

            <form onSubmit={handleUserLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#78936D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#78936D]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-[#20351F] hover:bg-[#152414] text-white text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                <span>{submitting ? 'Signing in...' : 'Sign In as Pet Owner'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setErrorMsg('');
                }}
                className="text-xs text-stone-500 hover:text-[#20351F] font-semibold"
              >
                Don't have an account? <span className="text-[#C8643D] font-bold underline">Create one free</span>
              </button>
            </div>
          </div>
        )}

        {/* Register New Account Form */}
        {activeTab === 'register' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#20351F]/10 shadow-sm space-y-5">
            <div className="pb-3 border-b border-stone-100">
              <h2 className="font-extrabold text-base text-[#20351F]">Create Free Account</h2>
              <p className="text-[11px] text-stone-500">Join PetCare to safeguard and nurture your pet</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#78936D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#78936D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#78936D]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-[#20351F] hover:bg-[#152414] text-white text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                <span>{submitting ? 'Creating Account...' : 'Complete Registration'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('user');
                  setErrorMsg('');
                }}
                className="text-xs text-stone-500 hover:text-[#20351F] font-semibold"
              >
                Already have an account? <span className="text-[#78936D] font-bold underline">Sign in here</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer Navigation Links */}
        <div className="flex flex-col items-center gap-2 text-center pt-2">
          <Link
            to="/"
            className="text-xs font-bold text-[#78936D] hover:underline inline-flex items-center gap-1"
          >
            ← Back to Public PetCare Portal
          </Link>

          <Link
            to="/admin-login"
            className="text-[11px] font-medium text-stone-400 hover:text-stone-600 transition-colors pt-1"
          >
            Clinic Staff or Administrator? Go to /admin-login
          </Link>
        </div>
      </div>
    </div>
  );
};
