// src/components/Meet/CreateMeeting.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  ArrowLeft, Video, Hash, Calendar,
  Clock, RefreshCw, AlertCircle, Loader2,
  Copy, Check
} from 'lucide-react';

// Generate random 8-char alphanumeric ID — same logic as original
const genId = () =>
  Math.random().toString(36).substring(2, 6).toUpperCase() +
  Math.random().toString(36).substring(2, 6).toUpperCase();

export default function CreateMeeting() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    Joining_id: genId(),
    StartAt: '',
    EndAt: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (errors.general) setErrors(prev => ({ ...prev, general: '' }));
  };

  const regenerateId = () => {
    setForm(prev => ({ ...prev, Joining_id: genId() }));
    toast.info('New meeting ID generated');
  };

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(form.Joining_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.StartAt) {
      errs.StartAt = 'Start time is required';
    }
    if (form.EndAt) {
      if (new Date(form.EndAt) <= new Date(form.StartAt)) {
        errs.EndAt = 'End time must be after start time';
      }
      const diffMs = new Date(form.EndAt) - new Date(form.StartAt);
      if (diffMs < 5 * 60 * 1000) {
        errs.EndAt = 'Meeting must be at least 5 minutes long';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Backend: POST /meeting/new
  // Body: { Joining_id, StartAt, EndAt (optional) }
  // Returns: plain text `added new meet ${curr_meet}`
  // Note: backend sends plain string — not JSON
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        Joining_id: form.Joining_id,
        StartAt: form.StartAt,
      };
      if (form.EndAt) payload.EndAt = form.EndAt;

      await axios.post('/meeting/new', payload, { withCredentials: true });

      // Backend returns plain text regardless — treat any 200 as success
      toast.success('Meeting created successfully!');
      setTimeout(() => navigate('/dashboard'), 1000);

    } catch (err) {
      if (err.response?.status === 401) {
        setErrors({ general: 'Session expired. Please log in again.' });
        toast.error('Session expired');
      } else if (err.response?.status === 400) {
        setErrors({ general: 'Invalid meeting details. Please check your inputs.' });
      } else {
        setErrors({ general: 'Failed to create meeting. Please try again.' });
        toast.error('Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  // Min datetime = now (can't create meeting in past)
  const nowLocal = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Create Meeting</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Schedule and share your meeting
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

          {/* General error */}
          {errors.general && (
            <div className="flex items-start gap-2 bg-red-50 border-b border-red-200 px-5 py-3">
              <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="p-5 space-y-5">

              {/* Meeting ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Meeting ID
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Hash size={14} className="text-gray-400" />
                    </div>
                    <input
                      value={form.Joining_id}
                      readOnly
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg bg-gray-50 font-mono tracking-widest text-gray-700 cursor-default"
                    />
                  </div>
                  {/* Copy ID */}
                  <button
                    type="button"
                    onClick={copyId}
                    className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Copy meeting ID"
                  >
                    {copied
                      ? <Check size={13} className="text-green-600" />
                      : <Copy size={13} />
                    }
                  </button>
                  {/* Regenerate ID */}
                  <button
                    type="button"
                    onClick={regenerateId}
                    className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Generate new ID"
                  >
                    <RefreshCw size={13} />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Share this ID with participants to let them join
                </p>
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={14} className={errors.StartAt ? 'text-red-400' : 'text-gray-400'} />
                  </div>
                  <input
                    type="datetime-local"
                    name="StartAt"
                    value={form.StartAt}
                    onChange={handleChange}
                    min={nowLocal()}
                    className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-lg outline-none transition-colors bg-gray-50 ${
                      errors.StartAt
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300 focus:border-gray-500'
                    }`}
                  />
                </div>
                {errors.StartAt && (
                  <p className="flex items-center gap-1 mt-1.5 text-xs text-red-600">
                    <AlertCircle size={11} />
                    {errors.StartAt}
                  </p>
                )}
              </div>

              {/* End Time */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  End Time
                  <span className="text-gray-400 font-normal ml-1">(optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock size={14} className={errors.EndAt ? 'text-red-400' : 'text-gray-400'} />
                  </div>
                  <input
                    type="datetime-local"
                    name="EndAt"
                    value={form.EndAt}
                    onChange={handleChange}
                    min={form.StartAt || nowLocal()}
                    className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-lg outline-none transition-colors bg-gray-50 ${
                      errors.EndAt
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300 focus:border-gray-500'
                    }`}
                  />
                </div>
                {errors.EndAt ? (
                  <p className="flex items-center gap-1 mt-1.5 text-xs text-red-600">
                    <AlertCircle size={11} />
                    {errors.EndAt}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1.5">
                    Leave blank for an open-ended meeting
                  </p>
                )}
              </div>

              {/* Meeting info preview */}
              {form.StartAt && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                    Meeting Summary
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Hash size={11} className="text-gray-400" />
                      ID: <span className="font-mono font-semibold">{form.Joining_id}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Calendar size={11} className="text-gray-400" />
                      Starts: <span className="font-medium">
                        {new Date(form.StartAt).toLocaleString('en-IN', {
                          dateStyle: 'medium', timeStyle: 'short'
                        })}
                      </span>
                    </div>
                    {form.EndAt && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Clock size={11} className="text-gray-400" />
                        Ends: <span className="font-medium">
                          {new Date(form.EndAt).toLocaleString('en-IN', {
                            dateStyle: 'medium', timeStyle: 'short'
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50">
              <button
                type="button"
                onClick={() => navigate(-1)}
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-5 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Video size={13} />
                    Create Meeting
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Tips */}
        <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 mb-2">How it works</p>
          <ul className="space-y-1.5">
            {[
              'A unique Meeting ID is auto-generated — copy and share it',
              'Participants use the Join Meeting page to enter by ID',
              'Chat is available in real-time during the meeting',
              'Your meeting appears in the dashboard after creation',
            ].map(tip => (
              <li key={tip} className="flex items-start gap-2 text-xs text-gray-400">
                <span className="w-1 h-1 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}