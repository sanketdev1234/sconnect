// src/components/connections/showmyconnections.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function MyConnections() {
  const navigate = useNavigate();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/connection/myconnections', { withCredentials: true })
      .then(res => { setConnections(res.data.connections); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">My Connections</h1>
          <p className="text-sm text-gray-500 mt-1">{connections.length} connections</p>
        </div>

        {loading ? (
          <p className="text-center text-sm text-gray-400 py-12">Loading...</p>
        ) : connections.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-400">
            No connections yet
          </div>
        ) : (
          <div className="space-y-3">
            {connections.map(c => (
              <div key={c._id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                <img src={c.profile_picture?.url} alt="" className="w-12 h-12 rounded-full object-cover border border-gray-200 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{c.display_name}</p>
                  <p className="text-xs text-gray-400 truncate">{c.email}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => navigate(`/getprofile/${c._id}`)} className="px-3 py-1.5 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors">
                    View Profile
                  </button>
                  <button onClick={() => navigate('/newmeet')} className="px-3 py-1.5 text-xs font-semibold border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    Message
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