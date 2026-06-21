// src/components/profile/profileview.jsx
import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { UserContext } from '../usercontext';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  MapPin, Link2, Briefcase, GraduationCap,
  Calendar, ArrowLeft, Pencil, Download,
  UserPlus, UserCheck, Clock, RefreshCw,
  AlertCircle, ExternalLink, FileText,
  Building2, BookOpen, Star, Loader2
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatMonthYear = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  });
};

const getDuration = (from, to, current) => {
  const start = new Date(from);
  const end = current ? new Date() : new Date(to);
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  if (months < 1) return 'Less than a month';
  if (months < 12) return `${months} mo`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years} yr ${rem} mo` : `${years} yr`;
};

// ── Section Wrapper ───────────────────────────────────────────────────────────

function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
        <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon size={14} className="text-gray-600" />
        </div>
        <h2 className="text-sm font-bold text-gray-900">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Experience Item ───────────────────────────────────────────────────────────

function ExperienceItem({ exp, isLast }) {
  return (
    <div className={`flex gap-4 ${!isLast ? 'pb-5 mb-5 border-b border-gray-100' : ''}`}>
      <div className="flex flex-col items-center mt-1">
        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Building2 size={14} className="text-gray-500" />
        </div>
        {!isLast && (
          <div className="w-px flex-1 bg-gray-200 mt-2" />
        )}
      </div>

      <div className="flex-1 min-w-0 pb-1">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">{exp.title}</p>
            <p className="text-sm text-blue-600 font-medium mt-0.5">{exp.company}</p>
            {exp.location && (
              <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                <MapPin size={10} />
                {exp.location}
              </p>
            )}
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-xs font-medium text-gray-500">
              {formatMonthYear(exp.from)} — {exp.current ? 'Present' : formatMonthYear(exp.to)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {getDuration(exp.from, exp.to, exp.current)}
            </p>
            {exp.current && (
              <span className="inline-block mt-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                Current
              </span>
            )}
          </div>
        </div>
        {exp.description && (
          <p className="text-xs text-gray-500 leading-relaxed mt-2">
            {exp.description}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Education Item ────────────────────────────────────────────────────────────

function EducationItem({ edu, isLast }) {
  return (
    <div className={`flex gap-4 ${!isLast ? 'pb-5 mb-5 border-b border-gray-100' : ''}`}>
      <div className="flex flex-col items-center mt-1">
        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <BookOpen size={14} className="text-gray-500" />
        </div>
        {!isLast && (
          <div className="w-px flex-1 bg-gray-200 mt-2" />
        )}
      </div>

      <div className="flex-1 min-w-0 pb-1">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">{edu.school}</p>
            <p className="text-sm text-blue-600 font-medium mt-0.5">
              {edu.degree} · {edu.field_of_study}
            </p>
            {edu.gpa && (
              <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                <Star size={10} />
                GPA: {edu.gpa}
              </p>
            )}
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-xs font-medium text-gray-500">
              {formatMonthYear(edu.from)} — {edu.current ? 'Present' : formatMonthYear(edu.to)}
            </p>
            {edu.current && (
              <span className="inline-block mt-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                Current
              </span>
            )}
          </div>
        </div>
        {edu.description && (
          <p className="text-xs text-gray-500 leading-relaxed mt-2">
            {edu.description}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function DisplayProfile() {
  const { wantid } = useParams();
  const navigate = useNavigate();
  const { curruser } = useContext(UserContext);

  const [profile, setProfile] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [connectLoading, setConnectLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const isOwnProfile = curruser?._id?.toString() === wantid?.toString();

  // ── Fetch Profile ───────────────────────────────────────────────────────────

  const fetchProfile = async () => {
    setFetchLoading(true);
    setFetchError('');
    try {
      const res = await axios.get(
        `/profile/get/${wantid}`,
        { withCredentials: true }
      );
      if (res.data?.status && res.data?.profile) {
        setProfile(res.data.profile);
      } else {
        setProfile(null);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setFetchError('Session expired. Please log in again.');
      } else if (err.response?.status === 404) {
        setFetchError('User not found.');
      } else {
        setFetchError('Failed to load profile. Please try again.');
      }
    } finally {
      setFetchLoading(false);
    }
  };

  // ── Fetch Connection Status ─────────────────────────────────────────────────

  const fetchConnectionStatus = async () => {
    if (isOwnProfile || !curruser) return;
    try {
      const [acceptedRes, incomingRes] = await Promise.all([
        axios.get('/connection/myconnections', { withCredentials: true }),
        axios.get('/connection/newincomingrequest', { withCredentials: true }),
      ]);

      const accepted = acceptedRes.data?.connections || [];
      const incoming = incomingRes.data?.requests || [];

      const isConnected = accepted.some(
        u => u._id?.toString() === wantid?.toString()
      );
      if (isConnected) {
        setConnectionStatus('accepted');
        return;
      }

      const isIncoming = incoming.some(
        r => r.sender?._id?.toString() === wantid?.toString()
      );
      if (isIncoming) {
        setConnectionStatus('incoming_pending');
        return;
      }

      setConnectionStatus('none');
    } catch {
      setConnectionStatus('none');
    }
  };

  useEffect(() => {
    if (wantid) {
      fetchProfile();
      fetchConnectionStatus();
    }
  }, [wantid]);

  // ── Connect ─────────────────────────────────────────────────────────────────

  const handleConnect = async () => {
    setConnectLoading(true);
    try {
      await axios.get(
        `/connection/newrequestsend/${wantid}`,
        { withCredentials: true }
      );
      setConnectionStatus('outgoing_pending');
      toast.success('Connection request sent');
    } catch (err) {
      if (err.response?.status === 400) {
        toast.error('Connection request already sent');
        setConnectionStatus('outgoing_pending');
      } else {
        toast.error('Failed to send connection request');
      }
    } finally {
      setConnectLoading(false);
    }
  };

  // ── Accept ──────────────────────────────────────────────────────────────────

  const handleAccept = async () => {
    setConnectLoading(true);
    try {
      await axios.get(
        `/connection/acceptconnection/${wantid}`,
        { withCredentials: true }
      );
      setConnectionStatus('accepted');
      toast.success('Connection accepted!');
    } catch {
      toast.error('Failed to accept connection');
    } finally {
      setConnectLoading(false);
    }
  };

  // ── Download Resume ─────────────────────────────────────────────────────────

  const handleDownload = async () => {
    setDownloadLoading(true);
    try {
      toast.info('Preparing resume PDF...');
      const res = await axios.get(
        `/profile/download-profile/${wantid}`,
        {
          responseType: 'blob',
          withCredentials: true,
        }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const filename = profile?.owner?.full_name
        ? `${profile.owner.full_name}_Resume.pdf`
        : 'Resume.pdf';
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Resume downloaded!');
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error('Profile not found — cannot generate resume.');
      } else {
        toast.error('Failed to download resume. Please try again.');
      }
    } finally {
      setDownloadLoading(false);
    }
  };

  // ── Connection Button ───────────────────────────────────────────────────────

  const ConnectionButton = () => {
    if (isOwnProfile) return null;

    if (connectionStatus === 'accepted') {
      return (
        <div className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg">
          <UserCheck size={15} />
          Connected
        </div>
      );
    }

    if (connectionStatus === 'outgoing_pending') {
      return (
        <div className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-500 bg-gray-50 border border-gray-200 rounded-lg">
          <Clock size={15} />
          Request Sent
        </div>
      );
    }

    if (connectionStatus === 'incoming_pending') {
      return (
        <button
          onClick={handleAccept}
          disabled={connectLoading}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {connectLoading
            ? <Loader2 size={15} className="animate-spin" />
            : <UserCheck size={15} />
          }
          Accept Request
        </button>
      );
    }

    return (
      <button
        onClick={handleConnect}
        disabled={connectLoading}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
      >
        {connectLoading
          ? <Loader2 size={15} className="animate-spin" />
          : <UserPlus size={15} />
        }
        Connect
      </button>
    );
  };

  // ── Loading State ─────────────────────────────────────────────────────────

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition-all"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-40 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-56 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-32" />
              </div>
            </div>
          </div>

          {[1, 2].map(i => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 mb-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-28 mb-4" />
              {[1, 2].map(j => (
                <div key={j} className="flex gap-4 mb-4">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-3.5 bg-gray-200 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/4 mb-2" />
                    <div className="h-2.5 bg-gray-100 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error State ───────────────────────────────────────────────────────────

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition-all"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Profile</h1>
          </div>
          <div className="bg-white border border-red-200 rounded-xl p-10 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={22} className="text-red-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">{fetchError}</p>
            <p className="text-xs text-gray-400 mb-5">
              Check your connection and try again.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={fetchProfile}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RefreshCw size={13} />
                Try Again
              </button>
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── No Profile Created ────────────────────────────────────────────────────

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition-all"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Profile</h1>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={24} className="text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">
              {isOwnProfile ? "You haven't created a profile yet" : 'No profile found'}
            </p>
            <p className="text-xs text-gray-400 mb-5">
              {isOwnProfile
                ? 'Create your professional profile to showcase your experience and connect with others.'
                : "This user hasn't set up their profile yet."}
            </p>
            {isOwnProfile && (
              <Link
                to="/createprofile"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-colors"
              >
                <FileText size={13} />
                Create Profile
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Main Profile View ─────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      <div className="max-w-2xl mx-auto space-y-4">

        {/* ── Back nav ── */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition-all"
            title="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <p className="text-sm text-gray-500">
            {isOwnProfile ? 'My Profile' : 'Viewing profile'}
          </p>
        </div>

        {/* ── Profile Header Card ── */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-900 h-20" />

          <div className="px-5 pb-5">
            <div className="flex items-end justify-between -mt-10 mb-4">
              <div className="relative">
                {profile.owner?.profile_picture?.url ? (
                  <img
                    src={profile.owner.profile_picture.url}
                    alt={profile.owner.display_name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-200 border-4 border-white shadow-sm flex items-center justify-center text-2xl font-bold text-gray-500">
                    {profile.owner?.display_name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button
                  onClick={handleDownload}
                  disabled={downloadLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  {downloadLoading
                    ? <Loader2 size={13} className="animate-spin" />
                    : <Download size={13} />
                  }
                  {downloadLoading ? 'Preparing...' : 'Resume'}
                </button>

                {isOwnProfile && (
                  <Link
                    to={`/updateprofile/${curruser._id}/${profile._id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Pencil size={13} />
                    Edit Profile
                  </Link>
                )}

                {!isOwnProfile && <ConnectionButton />}
              </div>
            </div>

            {/* Name + Headline */}
            <div className="mb-3">
              <h1 className="text-xl font-bold text-gray-900">
                {profile.owner?.full_name || profile.owner?.display_name}
              </h1>
              {profile.owner?.display_name &&
               profile.owner?.display_name !== profile.owner?.full_name && (
                <p className="text-sm text-gray-400 mt-0.5">
                  @{profile.owner.display_name}
                </p>
              )}
              {profile.headline && (
                <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                  {profile.headline}
                </p>
              )}
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-4">
              {profile.location && (
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <MapPin size={12} className="text-gray-400" />
                  {profile.location}
                </span>
              )}
              {profile.owner?.email && (
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Link2 size={12} className="text-gray-400" />
                  {profile.owner.email}
                </span>
              )}
              {profile.Experience?.length > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Briefcase size={12} className="text-gray-400" />
                  {profile.Experience.length} position{profile.Experience.length !== 1 ? 's' : ''}
                </span>
              )}
              {profile.Education?.length > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <GraduationCap size={12} className="text-gray-400" />
                  {profile.Education.length} education{profile.Education.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Social Links */}
            {(profile.social?.twitter || profile.social?.github || profile.social?.linkedin) && (
              <div className="flex flex-wrap gap-2">
                {profile.social?.twitter && (
                  <a
                    href={profile.social.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <ExternalLink size={11} />
                    Twitter
                  </a>
                )}
                {profile.social?.github && (
                  <a
                    href={profile.social.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <ExternalLink size={11} />
                    GitHub
                  </a>
                )}
                {profile.social?.linkedin && (
                  <a
                    href={profile.social.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <ExternalLink size={11} />
                    LinkedIn
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── About ── */}
        {profile.bio && (
          <Section icon={FileText} title="About">
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {profile.bio}
            </p>
          </Section>
        )}

        {/* ── Experience ── */}
        {profile.Experience?.length > 0 && (
          <Section icon={Briefcase} title="Experience">
            {profile.Experience.map((exp, i) => (
              <ExperienceItem
                key={exp._id || i}
                exp={exp}
                isLast={i === profile.Experience.length - 1}
              />
            ))}
          </Section>
        )}

        {/* ── Education ── */}
        {profile.Education?.length > 0 && (
          <Section icon={GraduationCap} title="Education">
            {profile.Education.map((edu, i) => (
              <EducationItem
                key={edu._id || i}
                edu={edu}
                isLast={i === profile.Education.length - 1}
              />
            ))}
          </Section>
        )}

        {/* ── Empty sections notice ── */}
        {isOwnProfile && !profile.bio && !profile.Experience?.length && !profile.Education?.length && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800 mb-1">
                  Your profile looks empty
                </p>
                <p className="text-xs text-amber-700 mb-3">
                  Add your bio, work experience, and education to make your profile stand out and improve your connections.
                </p>
                <Link
                  to={`/updateprofile/${curruser._id}/${profile._id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 text-white text-xs font-semibold rounded-lg hover:bg-amber-800 transition-colors"
                >
                  <Pencil size={12} />
                  Complete Your Profile
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── Quick Actions ── */}
        {isOwnProfile && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Quick Actions
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to={`/updateprofile/${curruser._id}/${profile._id}`}
                className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                <Pencil size={14} className="text-gray-500" />
                <span className="text-xs font-medium text-gray-700">Edit Profile</span>
              </Link>
              <button
                onClick={handleDownload}
                disabled={downloadLoading}
                className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
              >
                {downloadLoading
                  ? <Loader2 size={14} className="text-gray-500 animate-spin" />
                  : <Download size={14} className="text-gray-500" />
                }
                <span className="text-xs font-medium text-gray-700">Download Resume</span>
              </button>
              <Link
                to="/feed"
                className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                <FileText size={14} className="text-gray-500" />
                <span className="text-xs font-medium text-gray-700">View Feed</span>
              </Link>
              <Link
                to="/myconnections"
                className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                <UserCheck size={14} className="text-gray-500" />
                <span className="text-xs font-medium text-gray-700">My Connections</span>
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}