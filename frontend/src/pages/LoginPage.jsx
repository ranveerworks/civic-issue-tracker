import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, ArrowRight, AlertCircle, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      return setError('Please enter both email and password.');
    }

    try {
      setSubmitting(true);
      const loggedUser = await login(email.trim(), password);
      
      // Role-based redirection
      if (from) {
        navigate(from, { replace: true });
      } else if (loggedUser.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error("Login failure:", err);
      const detail = err.response?.data?.detail;
      setError(
        typeof detail === 'string'
          ? detail
          : 'Invalid email or password. Please verify your credentials.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (role) => {
    setError('');
    if (role === 'admin') {
      setEmail('admin@civictracker.gov.in');
      setPassword('Admin@123');
    } else {
      setEmail('citizen@example.com');
      setPassword('Citizen@123');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-100">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-navy-900 to-teal-700 text-white shadow-md mx-auto">
            <ShieldCheck className="w-7 h-7 text-teal-300" />
          </div>
          <h2 className="text-2xl font-bold text-navy-950 tracking-tight">
            Sign in to Civic Portal
          </h2>
          <p className="text-xs text-slate-500">
            Access your civic complaint dashboard and official tracking history.
          </p>
        </div>

        {/* Quick Demo Credentials for Sharda Evaluation */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
          <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            Quick Demo Autofill (1-Click Evaluation):
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemo('citizen')}
              className="py-1.5 px-2 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-lg text-slate-700 font-medium text-left transition flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Demo Citizen</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin')}
              className="py-1.5 px-2 bg-white hover:bg-navy-50 border border-slate-200 hover:border-navy-300 rounded-lg text-slate-700 font-medium text-left transition flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-navy-700" />
              <span>Admin Demo</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Email */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen@example.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700">Password</label>
              <button
                type="button"
                onClick={() => alert("For academic evaluation, use the pre-configured password 'Citizen@123' or 'Admin@123'.")}
                className="text-[11px] text-teal-600 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-70 text-white font-semibold rounded-xl shadow-md shadow-teal-600/20 transition flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer Link */}
        <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-teal-600 hover:text-teal-700 font-semibold hover:underline">
            Register as Citizen
          </Link>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
