// src/components/Userdashboard.jsx
import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from './usercontext';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Video,
  Calendar,
  Clock,
  Users,
  Trash2,
  Eye,
  Plus,
  LogIn,
  AlertCircle,
  RefreshCw,
  Hash,
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (d) => {
  if (!d) return 'Not set';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatTime = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const getMeetingStatus = (startAt, endAt) => {
  const now = new Date();
  const start = new Date(startAt);
  const end = endAt ? new Date(endAt) : null;

  if (end && now > end) {
    return { label: 'Ended', color: 'bg-gray-100 text-gray-500' };
  }
  if (now >= start && (!end || now <= end)) {
    return { label: 'Live', color: 'bg-green-100 text-green-700' };
  }
  return { label: 'Upcoming', color: 'bg-blue-50 text-blue-700' };
};

// ── Meeting Card ─────────────────────────────────────────────────────────────

function MeetingCard({ meeting, onDelete, deleteLoading }) {
  const navigate = useNavigate();
  const status = getMeetingStatus(meeting.StartAt, meeting.EndAt);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4 hover:border-gray-300 hover:shadow-sm transition-all">

      {/* Card Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Video size={16} className="text-gray-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {meeting.Hosted_by?.display_name
                ? `${meeting.Hosted_by.display_name}'s Meeting`
                : 'Meeting'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              Hosted by {meeting.Hosted_by?.full_name || 'Unknown'}
            </p> 
          </div>
        </div>
        {/* Status badge */}
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${status.color}`}>
          {status.label === 'Live' && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
          )}
          {status.label}
        </span>
      </div>

      {/* Meeting Details */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-start gap-2">
          <Hash size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-400">Meeting ID</p>
            <p className="text-xs font-mono font-semibold text-gray-700 mt-0.5">
              {meeting.Joining_id}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Users size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-400">Participants</p>
            <p className="text-xs font-semibold text-gray-700 mt-0.5">
              {meeting.Participants?.length || 0} joined
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Calendar size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-400">Start</p>
            <p className="text-xs font-semibold text-gray-700 mt-0.5">
              {formatDate(meeting.StartAt)}
            </p>
            <p className="text-xs text-gray-400">{formatTime(meeting.StartAt)}</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Clock size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-400">End</p>
            <p className="text-xs font-semibold text-gray-700 mt-0.5">
              {meeting.EndAt ? formatDate(meeting.EndAt) : '—'}
            </p>
            <p className="text-xs text-gray-400">
              {meeting.EndAt ? formatTime(meeting.EndAt) : 'No end time'}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t border-gray-100">
        <Link
          to={`/meet/${meeting._id}/detail`}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Eye size={13} />
          View Details
        </Link>

        {/* Join only if meeting is live or upcoming */}
        {status.label !== 'Ended' && (
          <button
            onClick={() => navigate(`/ongoingmeet/${meeting._id}/${meeting.Joining_id}`)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <LogIn size={13} />
            {status.label === 'Live' ? 'Join Now' : 'Join'}
          </button>
        )}

        <button
          onClick={() => onDelete(meeting._id)}
          disabled={deleteLoading === meeting._id}
          className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Delete meeting"
        >
          {deleteLoading === meeting._id ? (
            <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Trash2 size={13} />
          )}
        </button>
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Video size={22} className="text-gray-400" />
      </div>
      <p className="text-sm font-semibold text-gray-700 mb-1">No meetings yet</p>
      <p className="text-xs text-gray-400 mb-5">
        Create your first meeting and share the ID with others to collaborate.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link
          to="/newmeet"
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Plus size={13} />
          Create Meeting
        </Link>
        <Link
          to="/joinmeet"
          className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          <LogIn size={13} />
          Join Meeting
        </Link>
      </div>
    </div>
  );
}

// ── Error State ───────────────────────────────────────────────────────────────

function ErrorState({ onRetry }) {
  return (
    <div className="bg-white border border-red-200 rounded-xl p-10 text-center">
      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle size={22} className="text-red-400" />
      </div>
      <p className="text-sm font-semibold text-gray-700 mb-1">Failed to load meetings</p>
      <p className="text-xs text-gray-400 mb-5">
        Could not fetch your meetings. Check your connection and try again.
      </p>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-colors mx-auto"
      >
        <RefreshCw size={13} />
        Try Again
      </button>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function UserDashboard() {
  const { curruser } = useContext(UserContext);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null); // stores meeting._id being deleted
  const [filter, setFilter] = useState('all'); // all | live | upcoming | ended

  // Backend: GET /meeting/all
  // Returns array of meeting objects
  // Each meeting: { _id, Joining_id, Hosted_by: { _id, display_name, full_name },
  //                 StartAt, EndAt, Participants: [...], isEnded }
  const fetchMeetings = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const res = await axios.get('/meeting/all', { withCredentials: true });
      // Backend returns array directly
      if (Array.isArray(res.data)) {
        setMeetings(res.data);
      } else if (res.data?.meetings) {
        setMeetings(res.data.meetings);
      } else {
        setMeetings([]);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else {
        setFetchError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  // Backend: DELETE /meeting/:meetid/delete
  // Success → string response (meeting deleted)
  // 403 → "unauthorized" (not meeting owner)
  const handleDelete = async (meetingId) => {
    if (!window.confirm('Are you sure you want to delete this meeting? This cannot be undone.')) return;

    setDeleteLoading(meetingId);
    try {
      await axios.delete(`/meeting/${meetingId}/delete`, { withCredentials: true });
      setMeetings(prev => prev.filter(m => m._id !== meetingId));
      toast.success('Meeting deleted successfully');
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('You can only delete meetings you created.');
      } else if (err.response?.status === 404) {
        toast.error('Meeting not found — it may have already been deleted.');
        setMeetings(prev => prev.filter(m => m._id !== meetingId));
      } else {
        toast.error('Failed to delete meeting. Please try again.');
      }
    } finally {
      setDeleteLoading(null);
    }
  };

  // Filter meetings by status
  const filteredMeetings = meetings.filter(m => {
    if (filter === 'all') return true;
    const status = getMeetingStatus(m.StartAt, m.EndAt);
    return status.label.toLowerCase() === filter;
  });

  // Counts for filter tabs
  const counts = {
    all: meetings.length,
    live: meetings.filter(m => getMeetingStatus(m.StartAt, m.EndAt).label === 'Live').length,
    upcoming: meetings.filter(m => getMeetingStatus(m.StartAt, m.EndAt).label === 'Upcoming').length,
    ended: meetings.filter(m => getMeetingStatus(m.StartAt, m.EndAt).label === 'Ended').length,
  };

  const filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'live', label: 'Live' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'ended', label: 'Ended' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      <div className="max-w-5xl mx-auto">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {curruser
                ? `Welcome back, ${curruser.display_name}`
                : 'Dashboard'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage your meetings and collaborations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/joinmeet"
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <LogIn size={14} />
              Join Meeting
            </Link>
            <Link
              to="/newmeet"
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Plus size={14} />
              New Meeting
            </Link>
          </div>
        </div>

        {/* ── Stats Row ── */}
        {!loading && !fetchError && meetings.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total', value: counts.all, color: 'text-gray-900' },
              { label: 'Live', value: counts.live, color: 'text-green-600' },
              { label: 'Upcoming', value: counts.upcoming, color: 'text-blue-600' },
              { label: 'Ended', value: counts.ended, color: 'text-gray-400' },
            ].map(stat => (
              <div
                key={stat.label}
                className="bg-white border border-gray-200 rounded-xl p-4 text-center"
              >
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Filter Tabs ── */}
        {!loading && !fetchError && meetings.length > 0 && (
          <div className="flex items-center gap-1 mb-4 bg-white border border-gray-200 rounded-lg p-1 w-fit">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  filter === tab.key
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label}
                {counts[tab.key] > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    filter === tab.key
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {counts[tab.key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── Content ── */}
        {loading ? (
          // Skeleton loader
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-gray-200 rounded-lg" />
                  <div className="flex-1">
                    <div className="h-3.5 bg-gray-200 rounded w-2/3 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[1, 2, 3, 4].map(j => (
                    <div key={j}>
                      <div className="h-2.5 bg-gray-100 rounded w-1/2 mb-1.5" />
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <div className="flex-1 h-8 bg-gray-100 rounded-lg" />
                  <div className="flex-1 h-8 bg-gray-200 rounded-lg" />
                  <div className="w-10 h-8 bg-gray-100 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : fetchError ? (
          <ErrorState onRetry={fetchMeetings} />
        ) : meetings.length === 0 ? (
          <EmptyState />
        ) : filteredMeetings.length === 0 ? (
          // No meetings match the current filter
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
            <p className="text-sm font-semibold text-gray-700 mb-1">
              No {filter} meetings
            </p>
            <p className="text-xs text-gray-400 mb-4">
              You don't have any {filter} meetings right now.
            </p>
            <button
              onClick={() => setFilter('all')}
              className="text-xs font-semibold text-gray-900 hover:underline"
            >
              Show all meetings
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMeetings.map(meeting => (
              <MeetingCard
                key={meeting._id}
                meeting={meeting}
                onDelete={handleDelete}
                deleteLoading={deleteLoading}
              />
            ))}
          </div>
        )}

        {/* ── Quick Links ── */}
        {!loading && !fetchError && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              to="/feed"
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 hover:border-gray-300 hover:shadow-sm transition-all group"
            >
              <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                <Video size={16} className="text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Feed</p>
                <p className="text-xs text-gray-400">See posts from your network</p>
              </div>
            </Link>

            <Link
              to="/myconnections"
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 hover:border-gray-300 hover:shadow-sm transition-all group"
            >
              <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                <Users size={16} className="text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Connections</p>
                <p className="text-xs text-gray-400">Manage your network</p>
              </div>
            </Link>

            <Link
              to="/createpost"
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 hover:border-gray-300 hover:shadow-sm transition-all group"
            >
              <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                <Plus size={16} className="text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Create Post</p>
                <p className="text-xs text-gray-400">Share with your network</p>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}