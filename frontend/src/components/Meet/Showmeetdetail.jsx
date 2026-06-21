// src/components/Meet/Showmeetdetail.jsx
import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { UserContext } from '../usercontext';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  ArrowLeft, Video, Hash, Calendar, Clock,
  Users, MessageSquare, Trash2, LogIn,
  AlertCircle, RefreshCw, Loader2, Copy, Check,
  User
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDateTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const getMeetingStatus = (startAt, endAt, isEnded) => {
  if (isEnded) return { label: 'Ended', color: 'bg-gray-100 text-gray-500' };
  const now = new Date();
  const start = new Date(startAt);
  const end = endAt ? new Date(endAt) : null;
  if (end && now > end) return { label: 'Ended', color: 'bg-gray-100 text-gray-500' };
  if (now >= start && (!end || now <= end)) {
    return { label: 'Live', color: 'bg-green-100 text-green-700' };
  }
  return { label: 'Upcoming', color: 'bg-blue-50 text-blue-700' };
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function ShowMeetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { curruser } = useContext(UserContext);

  const [meeting, setMeeting] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Backend: GET /meeting/:meetid/detail
  // Middleware: iscorrect_owner — only host can view details
  // Returns: full meeting object with populated Chats (each with Author),
  //          Participants (user objects), Hosted_by (user object)
  // Note: backend uses res.send() — auto serialises mongoose doc
  const fetchDetail = async () => {
    setFetchLoading(true);
    setFetchError('');
    try {
      const res = await axios.get(
        `/meeting/${id}/detail`,
        { withCredentials: true }
      );
      const data = res.data;

      // Backend sends plain mongoose doc — check if valid
      if (!data || (!data._id && !data.id)) {
        setFetchError('Meeting not found.');
        return;
      }
      setMeeting(data);

    } catch (err) {
      if (err.response?.status === 401) {
        setFetchError('Session expired. Please log in again.');
      } else if (err.response?.status === 403) {
        setFetchError('Only the meeting host can view these details.');
      } else if (err.response?.status === 404) {
        setFetchError('Meeting not found. It may have been deleted.');
      } else {
        setFetchError('Failed to load meeting details. Please try again.');
      }
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  // Backend: DELETE /meeting/:meetid/delete
  // Middleware: iscorrect_owner (403 if not host)
  // Returns: plain text `meet deleted ${deleted_meet}`
  // Also triggers meetingSchema.post("findOneAndDelete") to delete chats
  const handleDelete = async () => {
    if (!window.confirm(
      'Delete this meeting? All chat messages will also be deleted. This cannot be undone.'
    )) return;

    setDeleteLoading(true);
    try {
      await axios.delete(
        `/meeting/${id}/delete`,
        { withCredentials: true }
      );
      toast.success('Meeting deleted successfully');
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('Only the host can delete this meeting.');
      } else {
        toast.error('Failed to delete meeting. Please try again.');
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(meeting?.Joining_id || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Meeting ID copied to clipboard');
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => navigate(-1)} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition-all">
              <ArrowLeft size={18} />
            </button>
            <div className="h-6 bg-gray-200 rounded w-40 animate-pulse" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-28 mb-4" />
                <div className="space-y-3">
                  <div className="h-10 bg-gray-100 rounded-lg" />
                  <div className="h-10 bg-gray-100 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => navigate(-1)} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition-all">
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Meeting Details</h1>
          </div>
          <div className="bg-white border border-red-200 rounded-xl p-10 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={22} className="text-red-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">{fetchError}</p>
            <div className="flex items-center justify-center gap-3 mt-5">
              {!fetchError.includes('host') && (
                <button
                  onClick={fetchDetail}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <RefreshCw size={13} />
                  Try Again
                </button>
              )}
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Render ─────────────────────────────────────────────────────────────

  const status = getMeetingStatus(meeting.StartAt, meeting.EndAt, meeting.isEnded);
  const isHost = meeting.Hosted_by?._id?.toString() === curruser?._id?.toString();

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      <div className="max-w-2xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition-all"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Meeting Details</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Hosted by {meeting.Hosted_by?.display_name || 'Unknown'}
              </p>
            </div>
          </div>
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${status.color}`}>
            {status.label === 'Live' && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            )}
            {status.label}
          </span>
        </div>

        {/* ── Meeting Info Card ── */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
            <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">
              <Video size={14} className="text-gray-600" />
            </div>
            <h2 className="text-sm font-bold text-gray-900">Meeting Information</h2>
          </div>

          <div className="p-5 space-y-4">
            {/* Meeting ID + copy */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash size={14} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Meeting ID</p>
                  <p className="text-sm font-mono font-bold text-gray-900 tracking-widest">
                    {meeting.Joining_id}
                  </p>
                </div>
              </div>
              <button
                onClick={copyId}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy ID'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <div className="flex items-start gap-2">
                <Calendar size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Start</p>
                  <p className="text-sm font-medium text-gray-700">
                    {formatDateTime(meeting.StartAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">End</p>
                  <p className="text-sm font-medium text-gray-700">
                    {meeting.EndAt ? formatDateTime(meeting.EndAt) : 'Open ended'}
                  </p>
                </div>
              </div>
            </div>

            {/* Host info */}
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <User size={14} className="text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Host</p>
                <p className="text-sm font-medium text-gray-700">
                  {meeting.Hosted_by?.display_name || 'Unknown'}
                  {isHost && (
                    <span className="ml-2 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">
                      You
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Participants Card ── */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">
                <Users size={14} className="text-gray-600" />
              </div>
              <h2 className="text-sm font-bold text-gray-900">Participants</h2>
            </div>
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              {meeting.Participants?.length || 0}
            </span>
          </div>

          <div className="p-5">
            {!meeting.Participants || meeting.Participants.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No participants have joined yet
              </p>
            ) : (
              <div className="space-y-3">
                {meeting.Participants.map((participant, i) => {
                  const p = typeof participant === 'object' ? participant : null;
                  return (
                    <div key={p?._id || i} className="flex items-center gap-3">
                      {p?.profile_picture?.url ? (
                        <img
                          src={p.profile_picture.url}
                          alt={p.display_name}
                          className="w-8 h-8 rounded-full object-cover border border-gray-200 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                          {p?.display_name?.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {p?.display_name || 'Unknown participant'}
                          {p?._id?.toString() === curruser?._id?.toString() && (
                            <span className="ml-2 text-xs text-blue-600">(You)</span>
                          )}
                          {p?._id?.toString() === meeting.Hosted_by?._id?.toString() && (
                            <span className="ml-2 text-xs text-gray-400">(Host)</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{p?.email}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Chat History Card ── */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">
                <MessageSquare size={14} className="text-gray-600" />
              </div>
              <h2 className="text-sm font-bold text-gray-900">Chat History</h2>
            </div>
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              {meeting.Chats?.length || 0} messages
            </span>
          </div>

          <div className="p-5">
            {!meeting.Chats || meeting.Chats.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No messages in this meeting yet
              </p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {meeting.Chats.map((chat, i) => {
                  const author = chat.Author;
                  const isOwn = author?._id?.toString() === curruser?._id?.toString();
                  return (
                    <div key={chat._id || i} className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                      {author?.profile_picture?.url ? (
                        <img
                          src={author.profile_picture.url}
                          alt={author.display_name}
                          className="w-7 h-7 rounded-full object-cover border border-gray-200 flex-shrink-0 mt-0.5"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0 mt-0.5">
                          {author?.display_name?.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                      <div className={`max-w-xs ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className={`px-3 py-2 rounded-xl text-sm ${
                          isOwn
                            ? 'bg-gray-900 text-white rounded-tr-sm'
                            : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                        }`}>
                          {chat.Content}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {isOwn ? 'You' : author?.display_name || 'Unknown'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Join meeting — if not ended */}
          {status.label !== 'Ended' && (
            <Link
              to={`/ongoingmeet/${id}/${meeting.Joining_id}`}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-colors"
            >
              <LogIn size={15} />
              {status.label === 'Live' ? 'Join Now' : 'Join Meeting'}
            </Link>
          )}

          {/* Delete — host only */}
          {isHost && (
            <button
              onClick={handleDelete}
              disabled={deleteLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-red-200 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {deleteLoading
                ? <Loader2 size={15} className="animate-spin" />
                : <Trash2 size={15} />
              }
              {deleteLoading ? 'Deleting...' : 'Delete Meeting'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}