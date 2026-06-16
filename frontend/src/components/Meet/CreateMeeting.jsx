// src/components/Meet/CreateMeeting.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

const genId = () => Math.random().toString(36).substring(2, 10).toUpperCase();

export default function CreateMeeting() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ Joining_id: genId(), StartAt: '', EndAt: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.StartAt) { toast.error('Start time is required'); return; }
    if (form.EndAt && new Date(form.EndAt) <= new Date(form.StartAt)) { toast.error('End time must be after start time'); return; }
    setLoading(true);
    try {
      await axios.post('/meeting/new', { Joining_id: form.Joining_id, StartAt: form.StartAt, EndAt: form.EndAt || undefined }, { withCredentials: true });
      toast.success('Meeting created!');
      setTimeout(() => navigate(-1), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="bg-white rounded-xl border border-gray-200 p-8 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Create Meeting</h2>
        <p className="text-sm text-gray-400 mb-6">Schedule and share your meeting instantly</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Meeting ID</label>
            <div className="flex gap-2">
              <input value={form.Joining_id} readOnly
                className="flex-1 px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-gray-50 font-mono tracking-widest" />
              <button type="button" onClick={() => { setForm(p => ({ ...p, Joining_id: genId() })); toast.info('New ID generated'); }}
                className="px-3 py-2.5 text-xs font-semibold border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Generate
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Start Time <span className="text-red-500">*</span></label>
            <input type="datetime-local" name="StartAt" value={form.StartAt} onChange={handleChange} required
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-gray-500 bg-gray-50" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">End Time <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="datetime-local" name="EndAt" value={form.EndAt} onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-gray-500 bg-gray-50" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
            {loading ? 'Creating...' : 'Create Meeting'}
          </button>
        </form>
      </div>
    </div>
  );
}