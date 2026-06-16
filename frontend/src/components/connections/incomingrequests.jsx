// src/components/connections/incomingrequests.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function IncomingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/connection/newincomingrequest', { withCredentials: true })
      .then(res => { setRequests(res.data.requests); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleAccept = async (id) => {
    await axios.get(`/connection/acceptconnection/${id}`, { withCredentials: true });
    setRequests(p => p.filter(r => r.sender._id !== id));
  };

  const handleDecline = async (id) => {
    await axios.delete(`/connection/declineconnection/${id}`, { withCredentials: true });
    setRequests(p => p.filter(r => r.sender._id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">Connection Requests</h1>
          <p className="text-sm text-gray-500 mt-1">{requests.length} pending</p>
        </div>

        {loading ? (
          <p className="text-center text-sm text-gray-400 py-12">Loading...</p>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-400">
            No pending requests
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(req => (
              <div key={req.sender._id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                <img src={req.sender.profile_picture?.url} alt="" className="w-12 h-12 rounded-full object-cover border border-gray-200 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{req.sender.display_name}</p>
                  <p className="text-xs text-gray-400 truncate">{req.sender.email}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleAccept(req.sender._id)} className="px-3 py-1.5 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors">
                    Accept
                  </button>
                  <button onClick={() => handleDecline(req.sender._id)} className="px-3 py-1.5 text-xs font-semibold border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                    Decline
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