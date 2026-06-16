// src/components/Auth/Signup.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import S from '../../assets/S.webp';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    display_name: '', full_name: '', email: '',
    password: '', confirmPassword: '', date_of_birth: '', gender: ''
  });
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
  };

  const validate = () => {
    const errs = {};
    if (!form.display_name.trim()) errs.display_name = 'Display name is required';
    if (!form.full_name.trim()) errs.full_name = 'Full name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Min 8 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!form.date_of_birth) errs.date_of_birth = 'Date of birth is required';
    if (!form.gender) errs.gender = 'Gender is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (k !== 'confirmPassword') data.append(k, v); });
      if (file) data.append('profile_picture', file);
      await axios.post('/auth/signup', data, { withCredentials: true });
      toast.success('Account created! Please login.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Signup failed';
      setErrors({ general: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ name, label, type = 'text', placeholder }) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <input
        type={type} name={name} value={form[name]}
        onChange={handleChange} placeholder={placeholder}
        className={`w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-colors
          ${errors[name] ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-gray-500'}`}
      />
      {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">Create account</h2>
        <p className="text-sm text-gray-500 text-center mb-6">Join S-Connect</p>

        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
            {errors.general}
          </div>
        )}

        {/* Profile Picture */}
        <div className="flex flex-col items-center mb-5">
          <div className="relative">
            <img src={preview || S} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
            <label htmlFor="pfp" className="absolute bottom-0 right-0 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs cursor-pointer">+</label>
            <input id="pfp" type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </div>
          <p className="text-xs text-gray-400 mt-2">Upload photo (optional)</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field name="display_name" label="Display Name" placeholder="johndoe" />
            <Field name="full_name" label="Full Name" placeholder="John Doe" />
          </div>
          <Field name="email" label="Email" type="email" placeholder="you@example.com" />
          <Field name="password" label="Password" type="password" placeholder="Min 8 characters" />
          <Field name="confirmPassword" label="Confirm Password" type="password" placeholder="Repeat password" />
          <div className="grid grid-cols-2 gap-4">
            <Field name="date_of_birth" label="Date of Birth" type="date" />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
              <select
                name="gender" value={form.gender} onChange={handleChange}
                className={`w-full px-3 py-2.5 text-sm border rounded-lg outline-none
                  ${errors.gender ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-gray-500'}`}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender}</p>}
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-gray-900 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}