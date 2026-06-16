// src/components/Userdashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function UserDashboard() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteToggle, setDeleteToggle] = useState(false);

  useEffect(() => {
    axios.get('/meeting/all', { withCredentials: true })
      .then(res => { setMeetings(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [deleteToggle]);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/meeting/${id}/delete`, { withCredentials: true });
      toast.success('Meeting deleted');
      setDeleteToggle(p => !p);
    } catch {
      toast.error('Failed to delete meeting');
    }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
  const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
          <h1 className="text-xl font-bold text-gray-900">My Meetings</h1>
          <p className="text-sm text-gray-500 mt-1">{meetings.length} total meetings</p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading...</div>
        ) : meetings.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <p className="text-3xl mb-3">📅</p>
            <p className="font-semibold text-gray-700">No meetings found</p>
            <p className="text-sm text-gray-400 mt-1">Your meetings will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meetings.map(m => (
              <div key={m._id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-100">
                  <div>
                    <p className="font-semibold text-gray-900">{m.Hosted_by?.display_name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">ID: {m.Joining_id}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Start</p>
                    <p className="text-gray-700">{fmtDate(m.StartAt)} at {fmtTime(m.StartAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">End</p>
                    <p className="text-gray-700">{m.EndAt ? `${fmtDate(m.EndAt)} at ${fmtTime(m.EndAt)}` : 'Ongoing'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Participants</p>
                    <p className="text-gray-700">{m.Participants?.length || 0} members</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                  <Link to={`/meet/${m._id}/detail`} className="flex-1 text-center py-2 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors">
                    View Details
                  </Link>
                  <button onClick={() => handleDelete(m._id)} className="flex-1 py-2 text-xs font-semibold bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}