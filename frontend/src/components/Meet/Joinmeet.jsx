// src/components/Meet/Joinmeet.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

export default function JoinMeeting() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ Joining_id: '', email: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.Joining_id) { toast.error('Meeting ID is required'); return; }
    setLoading(true);
    try {
      const res = await axios.get(`/meeting/${form.Joining_id}/join`, { withCredentials: true });
      toast.success('Joined meeting!');
      setTimeout(() => navigate(`/ongoingmeet/${res.data._id}/${form.Joining_id}`), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="bg-white rounded-xl border border-gray-200 p-8 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Join Meeting</h2>
        <p className="text-sm text-gray-400 mb-6">Enter the meeting ID to join</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Meeting ID <span className="text-red-500">*</span></label>
            <input type="text" name="Joining_id" value={form.Joining_id}
              onChange={e => setForm(p => ({ ...p, Joining_id: e.target.value }))}
              placeholder="Enter meeting ID"
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-gray-500 font-mono tracking-widest" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="email" name="email" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-gray-500" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
            {loading ? 'Joining...' : 'Join Meeting'}
          </button>
        </form>
      </div>
    </div>
  );
}