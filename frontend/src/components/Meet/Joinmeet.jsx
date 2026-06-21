// src/components/Meet/Joinmeet.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  ArrowLeft, LogIn, Hash,
  AlertCircle, Loader2
} from 'lucide-react';

export default function JoinMeeting() {
  const navigate = useNavigate();

  const [joinId, setJoinId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!joinId.trim()) {
      setError('Meeting ID is required');
      return false;
    }
    if (joinId.trim().length < 4) {
      setError('Please enter a valid meeting ID');
      return false;
    }
    return true;
  };

  // Backend: GET /meeting/:joinid/join
  // Finds meeting by Joining_id (NOT _id)
  // If user is not host → pushes to Participants array
  // Returns: the full meeting object (plain send, not JSON)
  // Note: backend sends plain text via res.send(curr_meet)
  //       but Mongoose objects sent via res.send get auto-serialised
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await axios.get(
        `/meeting/${joinId.trim().toUpperCase()}/join`,
        { withCredentials: true }
      );

      // Backend returns the meeting object
      const meetData = res.data;

      if (!meetData || (!meetData._id && !meetData.id)) {
        setError('Meeting not found. Please check the ID and try again.');
        return;
      }

      const meetId = meetData._id || meetData.id;

      toast.success('Joining meeting...');
      setTimeout(() => {
        navigate(`/ongoingmeet/${meetId}/${joinId.trim().toUpperCase()}`);
      }, 800);

    } catch (err) {
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
        toast.error('Session expired');
      } else if (err.response?.status === 404) {
        setError('Meeting not found. Please check the ID and try again.');
      } else if (err.response?.status === 400) {
        setError('This meeting has ended and cannot be joined.');
      } else {
        // Backend may crash if meeting not found (no error handling in controller)
        // Treat any error as "not found"
        setError('Meeting not found. Please check the ID and try again.');
      }
    } finally {
      setLoading(false);
    }
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
            <h1 className="text-xl font-bold text-gray-900">Join Meeting</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Enter the ID shared by the host
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <form onSubmit={handleSubmit} noValidate>
            <div className="p-5 space-y-4">

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Meeting ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash size={15} className={error ? 'text-red-400' : 'text-gray-400'} />
                  </div>
                  <input
                    type="text"
                    value={joinId}
                    onChange={e => {
                      // Auto uppercase as user types
                      setJoinId(e.target.value.toUpperCase());
                      if (error) setError('');
                    }}
                    placeholder="e.g. AB12CD34"
                    maxLength={20}
                    autoComplete="off"
                    autoFocus
                    disabled={loading}
                    className={`w-full pl-9 pr-4 py-3 text-sm border rounded-lg outline-none transition-colors font-mono tracking-widest disabled:bg-gray-50 ${
                      error
                        ? 'border-red-300 bg-red-50 focus:border-red-400'
                        : 'border-gray-300 focus:border-gray-500'
                    }`}
                  />
                </div>
                {error ? (
                  <p className="flex items-center gap-1 mt-1.5 text-xs text-red-600">
                    <AlertCircle size={11} />
                    {error}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1.5">
                    The host will share this ID with you before the meeting
                  </p>
                )}
              </div>
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
                disabled={loading || !joinId.trim()}
                className="flex items-center gap-1.5 px-5 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <LogIn size={13} />
                    Join Meeting
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Help */}
        <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 mb-2">Don't have an ID?</p>
          <ul className="space-y-1.5">
            {[
              'Ask the host to share the Meeting ID with you',
              'Check your messages or email for the ID',
              'Create your own meeting from the dashboard',
            ].map(tip => (
              <li key={tip} className="flex items-start gap-2 text-xs text-gray-400">
                <span className="w-1 h-1 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
          <button
            onClick={() => navigate('/newmeet')}
            className="mt-3 text-xs font-semibold text-gray-900 hover:underline"
          >
            Create a meeting instead →
          </button>
        </div>
      </div>
    </div>
  );
}