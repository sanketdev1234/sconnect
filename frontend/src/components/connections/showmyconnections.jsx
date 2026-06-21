// src/components/connections/showmyconnections.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../usercontext';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Users, UserX, MessageSquare, UserCircle,
  Search, RefreshCw, AlertCircle, Loader2
} from 'lucide-react';

// ── Connection Card ───────────────────────────────────────────────────────────

function ConnectionCard({ connection, onRemove, removeLoading }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:border-gray-300 hover:shadow-sm transition-all group">

      {/* Avatar */}
      <button
        onClick={() => navigate(`/getprofile/${connection._id}`)}
        className="flex-shrink-0"
        title="View profile"
      >
        {connection.profile_picture?.url ? (
          <img
            src={connection.profile_picture.url}
            alt={connection.display_name}
            className="w-12 h-12 rounded-full object-cover border border-gray-200 hover:opacity-90 transition-opacity"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-base font-bold text-gray-500 hover:bg-gray-300 transition-colors">
            {connection.display_name?.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <button
          onClick={() => navigate(`/getprofile/${connection._id}`)}
          className="text-sm font-semibold text-gray-900 hover:underline text-left block truncate"
        >
          {connection.display_name}
        </button>
        <p className="text-xs text-gray-400 truncate mt-0.5">
          {connection.full_name}
        </p>
        <p className="text-xs text-gray-400 truncate">
          {connection.email}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => navigate(`/getprofile/${connection._id}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          title="View profile"
        >
          <UserCircle size={13} />
          <span className="hidden sm:inline">Profile</span>
        </button>

        <button
          onClick={() => navigate('/newmeet')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
          title="Start a meeting"
        >
          <MessageSquare size={13} />
          <span className="hidden sm:inline">Message</span>
        </button>

        <button
          onClick={() => onRemove(connection._id)}
          disabled={removeLoading === connection._id}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
          title="Remove connection"
        >
          {removeLoading === connection._id
            ? <Loader2 size={14} className="animate-spin" />
            : <UserX size={14} />
          }
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ShowMyConnections() {
  const { curruser } = useContext(UserContext);
  const [connections, setConnections] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [removeLoading, setRemoveLoading] = useState(null);

  // Backend: GET /connection/myconnections
  // Returns: { connections: [{ _id, display_name, full_name,
  //             email, profile_picture: { url } }], status: true }
  const fetchConnections = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await axios.get(
        '/connection/myconnections',
        { withCredentials: true }
      );
      if (res.data?.status) {
        const list = res.data.connections || [];
        setConnections(list);
        setFiltered(list);
      } else {
        setConnections([]);
        setFiltered([]);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else {
        setFetchError('Failed to load connections. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConnections(); }, []);

  // Client-side search filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFiltered(connections);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFiltered(
      connections.filter(c =>
        c.display_name?.toLowerCase().includes(q) ||
        c.full_name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
      )
    );
  }, [searchQuery, connections]);

  // Backend: DELETE /connection/declineconnection/:userId
  // (used to remove / withdraw an accepted connection)
  // Returns: { message: "connection removed", status: true }
  const handleRemove = async (userId) => {
    if (!window.confirm('Remove this connection? They will no longer be in your network.')) return;
    setRemoveLoading(userId);
    try {
      await axios.delete(
        `/connection/declineconnection/${userId}`,
        { withCredentials: true }
      );
      const updated = connections.filter(c => c._id !== userId);
      setConnections(updated);
      setFiltered(updated.filter(c => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          c.display_name?.toLowerCase().includes(q) ||
          c.full_name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q)
        );
      }));
      toast.success('Connection removed');
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error('Connection not found — may have already been removed.');
        fetchConnections();
      } else {
        toast.error('Failed to remove connection. Please try again.');
      }
    } finally {
      setRemoveLoading(null);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Connections</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {loading
                ? 'Loading...'
                : `${connections.length} connection${connections.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>
          <button
            onClick={fetchConnections}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-300 text-gray-600 rounded-lg hover:bg-white disabled:opacity-50 transition-colors self-start sm:self-auto"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Search */}
        {!loading && !fetchError && connections.length > 0 && (
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={15} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-300 rounded-lg outline-none focus:border-gray-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Content */}
        {loading ? (
          // Skeleton
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-3.5 bg-gray-200 rounded w-32 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-24 mb-1.5" />
                  <div className="h-3 bg-gray-100 rounded w-40" />
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-16 bg-gray-100 rounded-lg" />
                  <div className="h-8 w-20 bg-gray-200 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : fetchError ? (
          <div className="bg-white border border-red-200 rounded-xl p-10 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={22} className="text-red-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">
              {fetchError}
            </p>
            <button
              onClick={fetchConnections}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-colors mx-auto mt-4"
            >
              <RefreshCw size={13} />
              Try Again
            </button>
          </div>
        ) : connections.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={24} className="text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">
              No connections yet
            </p>
            <p className="text-xs text-gray-400 mb-5">
              Start building your network by connecting with people on your feed.
            </p>
            <button
              onClick={() => window.location.href = '/feed'}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-colors"
            >
              Browse Feed
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
            <p className="text-sm font-semibold text-gray-700 mb-1">
              No results for "{searchQuery}"
            </p>
            <p className="text-xs text-gray-400 mb-4">
              Try a different name or email.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs font-semibold text-gray-900 hover:underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(c => (
              <ConnectionCard
                key={c._id}
                connection={c}
                onRemove={handleRemove}
                removeLoading={removeLoading}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}