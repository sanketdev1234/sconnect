// src/components/Auth/Signup.jsx
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../usercontext';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Eye, EyeOff, Mail, Lock, User, Calendar,
  Users, Camera, ArrowRight, AlertCircle, CheckCircle2
} from 'lucide-react';

// ── Password strength ─────────────────────────────────────────────────────────
const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  const checks = {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number:    /[0-9]/.test(password),
    special:   /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  score = Object.values(checks).filter(Boolean).length;
  if (score <= 2) return { score, label: 'Weak',   color: 'bg-red-400',   checks };
  if (score === 3) return { score, label: 'Fair',   color: 'bg-amber-400', checks };
  if (score === 4) return { score, label: 'Good',   color: 'bg-blue-400',  checks };
  return              { score, label: 'Strong', color: 'bg-green-500', checks };
};

// ── InputField — defined OUTSIDE Signup so it never gets recreated ────────────
// This is the fix — was previously defined inside Signup causing focus loss
const InputField = ({
  id, name, label, type = 'text', placeholder,
  icon: Icon, required = true, autoComplete,
  rightElement, hint, error, value, onChange, disabled
}) => (
  <div>
    <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon size={15} className={error ? 'text-red-400' : 'text-gray-400'} />
        </div>
      )}
      <input
        id={id}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        className={`w-full ${Icon ? 'pl-9' : 'pl-3'} ${rightElement ? 'pr-10' : 'pr-4'} py-2.5 text-sm border rounded-lg outline-none transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed ${
          error
            ? 'border-red-300 bg-red-50 focus:border-red-400'
            : 'border-gray-300 bg-white focus:border-gray-500'
        }`}
      />
      {rightElement && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {rightElement}
        </div>
      )}
    </div>
    {error ? (
      <p className="flex items-center gap-1 mt-1.5 text-xs text-red-600">
        <AlertCircle size={11} />
        {error}
      </p>
    ) : hint ? (
      <p className="mt-1.5 text-xs text-gray-400">{hint}</p>
    ) : null}
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

export default function Signup() {
  const navigate = useNavigate();
  const { setcurruser } = useContext(UserContext);

  const [form, setForm] = useState({
    display_name: '', full_name: '', email: '',
    password: '', confirmPassword: '', date_of_birth: '', gender: '',
  });
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors]   = useState({});
  const [showPassword, setShowPassword]  = useState(false);
  const [showConfirm, setShowConfirm]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep]       = useState(1);

  const passwordStrength = getPasswordStrength(form.password);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (errors.general) setErrors(prev => ({ ...prev, general: '' }));
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, photo: 'Only image files are allowed' }));
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, photo: 'Image must be under 5MB' }));
      return;
    }
    setErrors(prev => ({ ...prev, photo: '' }));
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const removePhoto = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  };

  const validateStep1 = () => {
    const errs = {};
    if (!form.display_name.trim()) {
      errs.display_name = 'Display name is required';
    } else if (form.display_name.trim().length < 2) {
      errs.display_name = 'Must be at least 2 characters';
    } else if (form.display_name.trim().length > 30) {
      errs.display_name = 'Must be under 30 characters';
    }
    if (!form.full_name.trim()) {
      errs.full_name = 'Full name is required';
    } else if (form.full_name.trim().length < 2) {
      errs.full_name = 'Must be at least 2 characters';
    }
    if (!form.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Enter a valid email address';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!form.password) {
      errs.password = 'Password is required';
    } else if (form.password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    } else if (passwordStrength.score < 3) {
      errs.password = 'Password is too weak — add uppercase, numbers, or symbols';
    }
    if (!form.confirmPassword) {
      errs.confirmPassword = 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }
    if (!form.date_of_birth) {
      errs.date_of_birth = 'Date of birth is required';
    } else {
      const dob = new Date(form.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 13) errs.date_of_birth = 'You must be at least 13 years old';
      if (dob > today) errs.date_of_birth = 'Date of birth cannot be in the future';
    }
    if (!form.gender) {
      errs.gender = 'Please select your gender';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;
    setLoading(true);
    setErrors({});
    try {
      const fd = new FormData();
      fd.append('display_name', form.display_name.trim());
      fd.append('full_name', form.full_name.trim());
      fd.append('email', form.email.trim().toLowerCase());
      fd.append('password', form.password);
      fd.append('date_of_birth', form.date_of_birth);
      fd.append('gender', form.gender);
      if (file) fd.append('profile_picture', file);

      const res = await axios.post('/auth/signup', fd, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const responseText = res.data;
      if (responseText === 'new user added' || res.status === 201) {
        const statusRes = await axios.get('/auth/authstatus', { withCredentials: true });
        if (statusRes.data?.status === true && statusRes.data?.user) {
          setcurruser(statusRes.data.user);
          toast.success('Account created! Welcome to S-Connect.');
          setTimeout(() => navigate('/createprofile'), 1000);
        } else {
          toast.success('Account created! Please sign in.');
          setTimeout(() => navigate('/login'), 1000);
        }
      } else if (typeof responseText === 'string' && responseText.includes('already exists')) {
        setErrors({ email: 'An account with this email already exists.' });
        setStep(1);
        toast.error('Email already registered');
      } else {
        setErrors({ general: 'Signup failed. Please try again.' });
        toast.error('Signup failed');
      }
    } catch (err) {
      const serverMsg = err.response?.data;
      if (typeof serverMsg === 'string' && serverMsg.includes('already exists')) {
        setErrors({ email: 'An account with this email already exists.' });
        setStep(1);
        toast.error('Email already registered');
      } else if (err.response?.status === 413) {
        setErrors({ photo: 'Image file is too large.' });
        toast.error('Image too large');
      } else {
        setErrors({ general: 'Unable to connect. Please try again.' });
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
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
          <p className="text-sm text-gray-500">Join S-Connect</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
              step >= 1 ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {step > 1 ? <CheckCircle2 size={14} /> : '1'}
            </div>
            <span className={`text-xs font-medium transition-colors ${step === 1 ? 'text-gray-900' : 'text-gray-400'}`}>
              Account
            </span>
          </div>
          <div className="flex-1 h-px bg-gray-200" />
          <div className="flex items-center gap-2 flex-1 justify-end">
            <span className={`text-xs font-medium transition-colors ${step === 2 ? 'text-gray-900' : 'text-gray-400'}`}>
              Personal
            </span>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
              step >= 2 ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              2
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">

          {errors.general && (
            <div className="flex items-start gap-3 bg-red-50 border-b border-red-200 rounded-t-xl px-5 py-3">
              <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            {/* ── Step 1 ── */}
            {step === 1 && (
              <div className="p-6 space-y-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                  Step 1 — Account Details
                </p>

                {/* Profile photo */}
                <div className="flex flex-col items-center pb-2">
                  <div className="relative mb-2">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
                      {preview ? (
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User size={28} className="text-gray-400" />
                      )}
                    </div>
                    <label
                      htmlFor="profile_picture"
                      className="absolute bottom-0 right-0 w-7 h-7 bg-gray-900 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors"
                    >
                      <Camera size={13} />
                    </label>
                    <input
                      id="profile_picture"
                      type="file"
                      accept="image/*"
                      onChange={handleFile}
                      className="hidden"
                    />
                  </div>
                  {preview ? (
                    <button type="button" onClick={removePhoto} className="text-xs text-red-500 hover:text-red-700 transition-colors">
                      Remove photo
                    </button>
                  ) : (
                    <p className="text-xs text-gray-400">Upload a profile photo (optional)</p>
                  )}
                  {errors.photo && (
                    <p className="flex items-center gap-1 mt-1 text-xs text-red-600">
                      <AlertCircle size={11} /> {errors.photo}
                    </p>
                  )}
                </div>

                {/* ✅ Now passing all props down — no re-creation on each render */}
                <InputField
                  id="display_name" name="display_name" label="Display Name"
                  placeholder="johndoe" icon={User} autoComplete="username"
                  hint="How others see you on S-Connect"
                  error={errors.display_name} value={form.display_name}
                  onChange={handleChange} disabled={loading}
                />
                <InputField
                  id="full_name" name="full_name" label="Full Name"
                  placeholder="John Doe" icon={User} autoComplete="name"
                  hint="Used in your profile and resume"
                  error={errors.full_name} value={form.full_name}
                  onChange={handleChange} disabled={loading}
                />
                <InputField
                  id="email" name="email" label="Email Address" type="email"
                  placeholder="you@example.com" icon={Mail} autoComplete="email"
                  error={errors.email} value={form.email}
                  onChange={handleChange} disabled={loading}
                />

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors mt-2"
                >
                  Continue <ArrowRight size={15} />
                </button>
              </div>
            )}

            {/* ── Step 2 ── */}
            {step === 2 && (
              <div className="p-6 space-y-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                  Step 2 — Personal Details
                </p>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={15} className={errors.password ? 'text-red-400' : 'text-gray-400'} />
                    </div>
                    <input
                      id="password" type={showPassword ? 'text' : 'password'}
                      name="password" value={form.password} onChange={handleChange}
                      placeholder="Min. 8 characters" autoComplete="new-password"
                      disabled={loading}
                      className={`w-full pl-9 pr-10 py-2.5 text-sm border rounded-lg outline-none transition-colors disabled:bg-gray-50 ${
                        errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300 focus:border-gray-500'
                      }`}
                    />
                    <button type="button" onClick={() => setShowPassword(p => !p)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      tabIndex={-1}>
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                            i <= passwordStrength.score ? passwordStrength.color : 'bg-gray-200'
                          }`} />
                        ))}
                      </div>
                      <p className={`text-xs ${
                        passwordStrength.score <= 2 ? 'text-red-500' :
                        passwordStrength.score === 3 ? 'text-amber-500' :
                        passwordStrength.score === 4 ? 'text-blue-500' : 'text-green-600'
                      }`}>
                        {passwordStrength.label}
                        {passwordStrength.score < 5 && ' — add '}
                        {passwordStrength.score < 5 && [
                          !passwordStrength.checks?.uppercase && 'uppercase',
                          !passwordStrength.checks?.number && 'numbers',
                          !passwordStrength.checks?.special && 'symbols',
                        ].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  )}
                  {errors.password && (
                    <p className="flex items-center gap-1 mt-1.5 text-xs text-red-600">
                      <AlertCircle size={11} /> {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={15} className={errors.confirmPassword ? 'text-red-400' : 'text-gray-400'} />
                    </div>
                    <input
                      id="confirmPassword" type={showConfirm ? 'text' : 'password'}
                      name="confirmPassword" value={form.confirmPassword}
                      onChange={handleChange} placeholder="Repeat your password"
                      autoComplete="new-password" disabled={loading}
                      className={`w-full pl-9 pr-10 py-2.5 text-sm border rounded-lg outline-none transition-colors disabled:bg-gray-50 ${
                        errors.confirmPassword ? 'border-red-300 bg-red-50' :
                        form.confirmPassword && form.password === form.confirmPassword
                          ? 'border-green-300 bg-green-50' : 'border-gray-300 focus:border-gray-500'
                      }`}
                    />
                    <button type="button" onClick={() => setShowConfirm(p => !p)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      tabIndex={-1}>
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.confirmPassword ? (
                    <p className="flex items-center gap-1 mt-1.5 text-xs text-red-600">
                      <AlertCircle size={11} /> {errors.confirmPassword}
                    </p>
                  ) : form.confirmPassword && form.password === form.confirmPassword ? (
                    <p className="flex items-center gap-1 mt-1.5 text-xs text-green-600">
                      <CheckCircle2 size={11} /> Passwords match
                    </p>
                  ) : null}
                </div>

                {/* Date of Birth */}
                <div>
                  <label htmlFor="date_of_birth" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar size={15} className={errors.date_of_birth ? 'text-red-400' : 'text-gray-400'} />
                    </div>
                    <input
                      id="date_of_birth" type="date" name="date_of_birth"
                      value={form.date_of_birth} onChange={handleChange}
                      max={new Date().toISOString().split('T')[0]} disabled={loading}
                      className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-lg outline-none transition-colors disabled:bg-gray-50 ${
                        errors.date_of_birth ? 'border-red-300 bg-red-50' : 'border-gray-300 focus:border-gray-500'
                      }`}
                    />
                  </div>
                  {errors.date_of_birth && (
                    <p className="flex items-center gap-1 mt-1.5 text-xs text-red-600">
                      <AlertCircle size={11} /> {errors.date_of_birth}
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label htmlFor="gender" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Users size={15} className={errors.gender ? 'text-red-400' : 'text-gray-400'} />
                    </div>
                    <select
                      id="gender" name="gender" value={form.gender}
                      onChange={handleChange} disabled={loading}
                      className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-lg outline-none transition-colors appearance-none disabled:bg-gray-50 ${
                        errors.gender ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white focus:border-gray-500'
                      }`}
                    >
                      <option value="">Select your gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                  {errors.gender && (
                    <p className="flex items-center gap-1 mt-1.5 text-xs text-red-600">
                      <AlertCircle size={11} /> {errors.gender}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setErrors({}); }}
                    disabled={loading}
                    className="flex-1 py-2.5 text-sm font-semibold border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit" disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</>
                    ) : (
                      <>Create Account <ArrowRight size={15} /></>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="px-6 py-4 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-gray-900 hover:underline">Sign in</Link>
            </p>
          </div>
        </div>

        <p className="text-center mt-5">
          <Link to="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}