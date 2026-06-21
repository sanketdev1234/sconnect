// src/components/Auth/Login.jsx
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../usercontext';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { setcurruser } = useContext(UserContext);

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Clear field error as user types
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (errors.general) setErrors(prev => ({ ...prev, general: '' }));
  };

  // Client-side validation before hitting backend
  const validate = () => {
    const errs = {};
    if (!form.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Enter a valid email address';
    }
    if (!form.password) {
      errs.password = 'Password is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      // Backend: POST /auth/login
      // Success   → { message: "login successfull" }  status 200
      // Bad creds → { message: "incorrect email or password" }  status 201
      // No user   → { message: "user not register" }  status 201
      // Missing   → { message: "both the filed are required" } status 201
      // Note: backend returns status 201 even for errors — check message field
      const res = await axios.post('/auth/login', {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      }, { withCredentials: true });

      const msg = res.data?.message || '';

      if (msg === 'login successfull') {
        // Fetch full user object to populate context
        // Backend: GET /auth/authstatus → { status: true, user: {...} }
        const statusRes = await axios.get('/auth/authstatus', { withCredentials: true });
        if (statusRes.data?.status === true && statusRes.data?.user) {
          setcurruser(statusRes.data.user);
          toast.success('Welcome back!');
          setTimeout(() => navigate('/dashboard'), 800);
        } else {
          setErrors({ general: 'Login succeeded but session could not be verified. Please try again.' });
        }
      } else if (msg === 'user not register') {
        setErrors({ email: 'No account found with this email address.' });
        toast.error('Account not found');
      } else if (msg === 'incorrect email or password') {
        setErrors({ password: 'Incorrect password. Please try again.' });
        toast.error('Incorrect password');
      } else if (msg === 'both the filed are required') {
        setErrors({ general: 'Please fill in both email and password.' });
      } else {
        // Unknown response
        setErrors({ general: msg || 'Something went wrong. Please try again.' });
        toast.error('Login failed');
      }

    } catch (err) {
      // Network error or server down
      const serverMsg = err.response?.data?.message || err.response?.data;
      if (typeof serverMsg === 'string' && serverMsg.includes('not register')) {
        setErrors({ email: 'No account found with this email address.' });
      } else {
        setErrors({ general: 'Unable to connect. Please check your connection and try again.' });
        toast.error('Connection error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">S</span>
            </div>
            <span className="text-lg font-bold text-gray-900">S-Connect</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-sm text-gray-500">Sign in to your account to continue</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">

          {/* General error banner */}
          {errors.general && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-5">
              <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={15} className={errors.email ? 'text-red-400' : 'text-gray-400'} />
                </div>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={loading}
                  className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-lg outline-none transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed ${
                    errors.email
                      ? 'border-red-300 bg-red-50 focus:border-red-400'
                      : 'border-gray-300 bg-white focus:border-gray-500'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="flex items-center gap-1 mt-1.5 text-xs text-red-600">
                  <AlertCircle size={11} />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={15} className={errors.password ? 'text-red-400' : 'text-gray-400'} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                  className={`w-full pl-9 pr-10 py-2.5 text-sm border rounded-lg outline-none transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed ${
                    errors.password
                      ? 'border-red-300 bg-red-50 focus:border-red-400'
                      : 'border-gray-300 bg-white focus:border-gray-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p className="flex items-center gap-1 mt-1.5 text-xs text-red-600">
                  <AlertCircle size={11} />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Sign up link */}
          <p className="text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="font-semibold text-gray-900 hover:underline"
            >
              Create one for free
            </Link>
          </p>
        </div>

        {/* Back to home */}
        <p className="text-center mt-5">
          <Link
            to="/"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}