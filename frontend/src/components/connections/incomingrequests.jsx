// src/components/connections/incomingrequests.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../usercontext';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  BellRing, UserCheck, UserX, UserCircle,
  RefreshCw, AlertCircle, Loader2, Clock
} from 'lucide-react';

// ── Request Card ──────────────────────────────────────────────────────────────

function RequestCard({ request, onAccept, onDecline, actionLoading }) {
  const navigate = useNavigate();
  const sender = request.sender;
  const isActing = actionLoading === sender._id;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all">
      <div className="flex items-center gap-4">

        {/* Avatar */}
        <button
          onClick={() => navigate(`/getprofile/${sender._id}`)}
          className="flex-shrink-0"
        >
          {sender.profile_picture?.url ? (
            <img
              src={sender.profile_picture.url}
              alt={sender.display_name}
              className="w-12 h-12 rounded-full object-cover border border-gray-200 hover:opacity-90 transition-opacity"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-base font-bold text-gray-500 hover:bg-gray-300 transition-colors">
              {sender.display_name?.charAt(0).toUpperCase()}
            </div>
          )}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <button
            onClick={() => navigate(`/getprofile/${sender._id}`)}
            className="text-sm font-semibold text-gray-900 hover:underline text-left block truncate"
          >
            {sender.display_name}
          </button>
          <p className="text-xs text-gray-400 truncate mt-0.5">
            {sender.full_name}
          </p>
          <p className="text-xs text-gray-400 truncate">
            {sender.email}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => navigate(`/getprofile/${sender._id}`)}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="View profile"
          >
            <UserCircle size={16} />
          </button>

          <button
            onClick={() => onDecline(sender._id)}
            disabled={isActing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
            title="Decline request"
          >
            {isActing
              ? <Loader2 size={13} className="animate-spin" />
              : <UserX size={13} />
            }
            <span className="hidden sm:inline">Decline</span>
          </button>

          <button
            onClick={() => onAccept(sender._id)}
            disabled={isActing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
            title="Accept request"
          >
            {isActing
              ? <Loader2 size={13} className="animate-spin" />
              : <UserCheck size={13} />
            }
            <span className="hidden sm:inline">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function IncomingRequests() {
  const { curruser } = useContext(UserContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Backend: GET /connection/newincomingrequest
  // Returns: { requests: [{ _id, sender: { _id, display_name,
  //             full_name, email, profile_picture }, status }], status: true }
  const fetchRequests = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await axios.get(
        '/connection/newincomingrequest',
        { withCredentials: true }
      );
      if (res.data?.status) {
        setRequests(res.data.requests || []);
      } else {
        setRequests([]);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else {
        setFetchError('Failed to load requests. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  // Backend: GET /connection/acceptconnection/:userId
  // Returns: { message: "connection accepted", status: true }
  const handleAccept = async (senderId) => {
    setActionLoading(senderId);
    try {
      await axios.get(
        `/connection/acceptconnection/${senderId}`,
        { withCredentials: true }
      );
      setRequests(prev => prev.filter(r => r.sender._id !== senderId));
      toast.success('Connection accepted! You are now connected.');
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error('Request no longer exists.');
        setRequests(prev => prev.filter(r => r.sender._id !== senderId));
      } else {
        toast.error('Failed to accept request. Please try again.');
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Backend: DELETE /connection/declineconnection/:userId
  // Returns: { message: "connection declined", status: true }
  const handleDecline = async (senderId) => {
    setActionLoading(senderId);
    try {
      await axios.delete(
        `/connection/declineconnection/${senderId}`,
        { withCredentials: true }
      );
      setRequests(prev => prev.filter(r => r.sender._id !== senderId));
      toast.success('Request declined');
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error('Request not found — may have already been removed.');
        setRequests(prev => prev.filter(r => r.sender._id !== senderId));
      } else {
        toast.error('Failed to decline request. Please try again.');
      }
    } finally {
      setActionLoading(null);
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
            <h1 className="text-xl font-bold text-gray-900">Connection Requests</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {loading
                ? 'Loading...'
                : requests.length === 0
                ? 'No pending requests'
                : `${requests.length} pending request${requests.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>
          <button
            onClick={fetchRequests}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-300 text-gray-600 rounded-lg hover:bg-white disabled:opacity-50 transition-colors self-start sm:self-auto"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Pending count badge */}
        {!loading && requests.length > 0 && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 mb-4">
            <BellRing size={15} className="text-blue-600 flex-shrink-0" />
            <p className="text-xs text-blue-700">
              You have <span className="font-bold">{requests.length}</span> pending
              connection {requests.length === 1 ? 'request' : 'requests'} waiting
              for your response.
            </p>
          </div>
        )}

        {/* Content */}
        {loading ? (
          // Skeleton
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-3.5 bg-gray-200 rounded w-32 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-24 mb-1.5" />
                  <div className="h-3 bg-gray-100 rounded w-40" />
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-20 bg-gray-100 rounded-lg" />
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
              onClick={fetchRequests}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-colors mx-auto mt-4"
            >
              <RefreshCw size={13} />
              Try Again
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BellRing size={24} className="text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">
              No pending requests
            </p>
            <p className="text-xs text-gray-400 mb-5">
              When someone sends you a connection request, it will appear here.
            </p>
            <div className="flex items-center gap-2 justify-center">
              <button
                onClick={() => window.location.href = '/feed'}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-colors"
              >
                Browse Feed
              </button>
              <button
                onClick={() => window.location.href = '/myconnections'}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                My Connections
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(req => (
              <RequestCard
                key={req.sender._id}
                request={req}
                onAccept={handleAccept}
                onDecline={handleDecline}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}