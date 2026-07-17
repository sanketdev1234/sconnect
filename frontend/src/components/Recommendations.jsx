// src/components/Recommendations.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { UserContext } from './usercontext';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Sparkles, Loader2, AlertCircle, RefreshCw,
  MapPin, Briefcase, GraduationCap, Users,
  Building2, Brain, UserPlus, X
} from 'lucide-react';

// ── Reason Tag ────────────────────────────────────────────────────────────────
function ReasonTag({ reason }) {
  // Pick icon + color based on reason text
  let icon = <Sparkles size={10} />;
  let color = 'text-purple-600 bg-purple-50 border-purple-200';

  if (reason.includes('mutual connection')) {
    icon = <Users size={10} />;
    color = 'text-blue-600 bg-blue-50 border-blue-200';
  } else if (reason.includes('worked at')) {
    icon = <Building2 size={10} />;
    color = 'text-amber-600 bg-amber-50 border-amber-200';
  } else if (reason.includes('studied at')) {
    icon = <GraduationCap size={10} />;
    color = 'text-green-600 bg-green-50 border-green-200';
  } else if (reason.includes('Both in')) {
    icon = <MapPin size={10} />;
    color = 'text-rose-600 bg-rose-50 border-rose-200';
  } else if (reason.includes('Similar professional')) {
    icon = <Brain size={10} />;
    color = 'text-purple-600 bg-purple-50 border-purple-200';
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${color}`}>
      {icon}
      {reason}
    </span>
  );
}

// ── Score Ring ─────────────────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const percentage = Math.round(score * 100);
  const circumference = 2 * Math.PI * 16;
  const filled = (percentage / 100) * circumference;

  let strokeColor = '#9ca3af'; // gray
  if (percentage >= 60) strokeColor = '#22c55e'; // green
  else if (percentage >= 35) strokeColor = '#3b82f6'; // blue
  else if (percentage >= 15) strokeColor = '#f59e0b'; // amber

  return (
    <div className="relative w-11 h-11 flex-shrink-0">
      <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="16" fill="none" stroke="#f3f4f6" strokeWidth="2.5" />
        <circle
          cx="18" cy="18" r="16" fill="none"
          stroke={strokeColor} strokeWidth="2.5"
          strokeDasharray={`${filled} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
        {percentage}
      </span>
    </div>
  );
}

// ── Recommendation Card ───────────────────────────────────────────────────────
function RecommendationCard({ suggestion }) {
  const owner = suggestion.owner;
  const hasPhoto = owner?.profile_picture?.url;
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const handleConnect = async (e) => {
    e.preventDefault(); // Don't navigate to profile
    e.stopPropagation();
    setSendingRequest(true);
    try {
      await axios.get(
        `/connection/newrequestsend/${owner._id}`,
        { withCredentials: true }
      );
      setRequestSent(true);
      toast.success(`Connection request sent to ${owner.display_name}!`);
    } catch (err) {
      if (err.response?.status === 400) {
        toast.info('Request already sent or you are already connected.');
        setRequestSent(true);
      } else {
        toast.error('Failed to send request. Try again.');
      }
    } finally {
      setSendingRequest(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-sm transition-all">
      <div className="flex items-start gap-4">
        {/* Score Ring */}
        <ScoreRing score={suggestion.recommendationScore} />

        {/* Profile Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <Link to={`/getprofile/${owner?._id}`} className="group min-w-0">
              <div className="flex items-center gap-2.5">
                {hasPhoto ? (
                  <img
                    src={owner.profile_picture.url}
                    alt={owner.display_name}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200 flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {owner?.display_name?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                    {owner?.full_name || owner?.display_name || 'Unknown'}
                  </h3>
                  {suggestion.headline && (
                    <p className="text-xs text-gray-500 truncate">{suggestion.headline}</p>
                  )}
                </div>
              </div>
            </Link>

            {/* Connect Button */}
            <button
              onClick={handleConnect}
              disabled={sendingRequest || requestSent}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex-shrink-0 ${
                requestSent
                  ? 'bg-gray-100 text-gray-400 cursor-default'
                  : 'bg-gray-900 text-white hover:bg-gray-700'
              }`}
            >
              {sendingRequest ? (
                <Loader2 size={12} className="animate-spin" />
              ) : requestSent ? (
                <>Sent</>
              ) : (
                <>
                  <UserPlus size={12} />
                  Connect
                </>
              )}
            </button>
          </div>

          {/* Location + Experience quick info */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {suggestion.location && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <MapPin size={10} />
                {suggestion.location}
              </span>
            )}
            {suggestion.Experience?.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Briefcase size={10} />
                {suggestion.Experience[0].title} at {suggestion.Experience[0].company}
              </span>
            )}
          </div>

          {/* Reason Tags — WHY this person is recommended */}
          {suggestion.reasons?.length > 0 && (
            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              {suggestion.reasons.map((reason, i) => (
                <ReasonTag key={i} reason={reason} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Signal Legend ──────────────────────────────────────────────────────────────
function SignalLegend({ weights }) {
  const signals = [
    { label: 'Mutual Connections', weight: weights?.mutualConnections || 0.30, color: 'bg-blue-500' },
    { label: 'Same Company', weight: weights?.sameCompany || 0.25, color: 'bg-amber-500' },
    { label: 'Same School', weight: weights?.sameSchool || 0.20, color: 'bg-green-500' },
    { label: 'Same Location', weight: weights?.sameLocation || 0.10, color: 'bg-rose-500' },
    { label: 'AI Profile Similarity', weight: weights?.profileSimilarity || 0.15, color: 'bg-purple-500' },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
      <p className="text-xs font-semibold text-gray-500 mb-3">Recommendation Signals</p>
      <div className="flex items-center gap-1 h-2 rounded-full overflow-hidden mb-3">
        {signals.map((s, i) => (
          <div
            key={i}
            className={`h-full ${s.color}`}
            style={{ width: `${s.weight * 100}%` }}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {signals.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${s.color}`} />
            <span className="text-xs text-gray-500">
              {s.label} ({Math.round(s.weight * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Recommendations() {
  const { curruser } = useContext(UserContext);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weights, setWeights] = useState(null);
  const [totalCandidates, setTotalCandidates] = useState(0);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/features/suggestions', { withCredentials: true });
      setSuggestions(res.data.suggestions || []);
      setWeights(res.data.weights || null);
      setTotalCandidates(res.data.totalCandidates || 0);
    } catch (err) {
      if (err.response?.status === 400) {
        setError('Create your profile first to get personalized recommendations.');
      } else {
        setError('Failed to load recommendations. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Brain size={16} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">People You May Know</h1>
            </div>
            <p className="text-sm text-gray-500 ml-[42px]">
              AI-powered recommendations based on your profile, network & activity
            </p>
          </div>
          {!loading && (
            <button
              onClick={fetchRecommendations}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition-all"
              title="Refresh recommendations"
            >
              <RefreshCw size={16} />
            </button>
          )}
        </div>

        {/* Signal Legend */}
        {!loading && !error && weights && <SignalLegend weights={weights} />}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center py-16">
            <Loader2 size={28} className="text-purple-500 animate-spin mb-3" />
            <p className="text-sm text-gray-500">Analyzing your network...</p>
            <p className="text-xs text-gray-400 mt-1">
              Scoring candidates across 5 signals
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-white border border-red-200 rounded-xl p-10 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={20} className="text-red-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">{error}</p>
            <button
              onClick={fetchRecommendations}
              className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-colors mx-auto"
            >
              <RefreshCw size={13} />
              Try Again
            </button>
          </div>
        )}

        {/* Results */}
        {!loading && !error && suggestions.length > 0 && (
          <>
            <p className="text-xs text-gray-400 mb-3 px-1">
              {suggestions.length} recommendation{suggestions.length !== 1 ? 's' : ''} from {totalCandidates} candidate{totalCandidates !== 1 ? 's' : ''}
            </p>
            <div className="space-y-3">
              {suggestions.map((suggestion) => (
                <RecommendationCard key={suggestion._id} suggestion={suggestion} />
              ))}
            </div>
          </>
        )}

        {/* No Recommendations */}
        {!loading && !error && suggestions.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={22} className="text-purple-500" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">
              No recommendations yet
            </p>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Add more details to your profile (education, experience, location) and connect with more people to get better recommendations.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
