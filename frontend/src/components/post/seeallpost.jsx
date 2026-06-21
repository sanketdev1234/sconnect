// src/components/post/seeallpost.jsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../usercontext';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  ThumbsUp, MessageSquare, Pencil, Trash2,
  UserPlus, UserCheck, Clock, AlertCircle,
  RefreshCw, Send, X, ChevronDown, ChevronUp,
  UserMinus, Loader2
} from 'lucide-react';
// At top of seeallpost.jsx and seespecificpost.jsx — add this import
import CommentsSection from './comment';
// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (d) => {
  if (!d) return '';
  const date = new Date(d);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
};

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ user, size = 'md' }) {
  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
  };
  if (user?.profile_picture?.url) {
    return (
      <img
        src={user.profile_picture.url}
        alt={user.display_name}
        className={`${sizes[size]} rounded-full object-cover border border-gray-200 flex-shrink-0`}
      />
    );
  }
  return (
    <div className={`${sizes[size]} rounded-full bg-gray-200 flex items-center justify-center font-semibold text-gray-600 flex-shrink-0`}>
      {user?.display_name?.charAt(0).toUpperCase() || '?'}
    </div>
  );
}

// ── Post Card ─────────────────────────────────────────────────────────────────

function PostCard({
  post, currentUserId, connectionMap,
  onLike, onDelete, onConnect, onAccept,
  likeLoading, deleteLoading
}) {
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const isOwn = post.owner?._id === currentUserId;
  const liked = post.likeby?.includes(currentUserId);
  const authorId = post.owner?._id?.toString();
  const connStatus = connectionMap[authorId];

  const ConnectButton = () => {
    if (isOwn) return null;
    if (connStatus === 'accepted') {
      return (
        <div className="flex items-center gap-1 text-xs text-green-600">
          <UserCheck size={12} />
          <span>Connected</span>
        </div>
      );
    }
    if (connStatus === 'outgoing_pending') {
      return (
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock size={12} />
          <span>Pending</span>
        </div>
      );
    }
    if (connStatus === 'incoming_pending') {
      return (
        <button
          onClick={() => onAccept(authorId)}
          className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full hover:bg-green-100 transition-colors"
        >
          <UserCheck size={12} />
          Accept
        </button>
      );
    }
    return (
      <button
        onClick={() => onConnect(authorId)}
        className="flex items-center gap-1 text-xs font-semibold text-gray-700 border border-gray-300 px-2.5 py-1 rounded-full hover:bg-gray-50 transition-colors"
      >
        <UserPlus size={12} />
        Connect
      </button>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors">

      {/* Post Header */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={() => navigate(`/getprofile/${post.owner?._id}`)}
            className="flex-shrink-0"
          >
            <Avatar user={post.owner} size="md" />
          </button>
          <div className="min-w-0 flex-1">
            <button
              onClick={() => navigate(`/getprofile/${post.owner?._id}`)}
              className="text-sm font-semibold text-gray-900 hover:underline text-left"
            >
              {isOwn ? 'You' : post.owner?.display_name || 'Unknown'}
            </button>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <Clock size={10} />
              {formatDate(post.createdAt)}
            </p>
          </div>
        </div>
        <ConnectButton />
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        {post.text && (
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
            {post.text}
          </p>
        )}
        {post.media?.media_url && (
          <div className="mt-3 rounded-lg overflow-hidden border border-gray-100">
            <img
              src={post.media.media_url}
              alt="Post media"
              className="w-full max-h-96 object-cover"
              loading="lazy"
            />
          </div>
        )}
      </div>

      {/* Like + Comment counts */}
      {(post.likeby?.length > 0 || post.comments?.length > 0) && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            {post.likeby?.length > 0 && (
              <span className="flex items-center gap-1">
                <ThumbsUp size={11} className="text-blue-500 fill-blue-500" />
                {post.likeby.length} {post.likeby.length === 1 ? 'like' : 'likes'}
              </span>
            )}
          </span>
          {post.comments?.length > 0 && (
            <button
              onClick={() => setShowComments(p => !p)}
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
            </button>
          )}
        </div>
      )}

      {/* Action Bar */}
      <div className="flex border-t border-gray-100">
        {/* Like */}
        <button
          onClick={() => onLike(post._id)}
          disabled={likeLoading === post._id}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
            liked
              ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          {likeLoading === post._id
            ? <Loader2 size={13} className="animate-spin" />
            : <ThumbsUp size={13} className={liked ? 'fill-blue-600' : ''} />
          }
          {liked ? 'Liked' : 'Like'}
        </button>

        {/* Comment */}
        <button
          onClick={() => setShowComments(p => !p)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-l border-gray-100 transition-colors ${
            showComments
              ? 'text-gray-900 bg-gray-50'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <MessageSquare size={13} />
          Comment
          {showComments
            ? <ChevronUp size={11} />
            : <ChevronDown size={11} />
          }
        </button>

        {/* Owner actions */}
        {isOwn && (
          <>
            <Link
              to={`/editpost/${post._id}`}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-gray-500 border-l border-gray-100 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <Pencil size={13} />
              Edit
            </Link>
            <button
              onClick={() => onDelete(post._id)}
              disabled={deleteLoading === post._id}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-red-500 border-l border-gray-100 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {deleteLoading === post._id
                ? <Loader2 size={13} className="animate-spin" />
                : <Trash2 size={13} />
              }
              Delete
            </button>
          </>
        )}
      </div>

      {/* Comment Section — toggled */}
      {showComments && (
        <CommentsSection
          postId={post._id}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}

// ── Main Feed ─────────────────────────────────────────────────────────────────

export default function SeeAllPosts() {
  const { curruser } = useContext(UserContext);
  const [posts, setPosts] = useState([]);
  const [connectionMap, setConnectionMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [likeLoading, setLikeLoading] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);

  // Backend: GET /post/getallpost
  // Returns: { posts: [...], status: true }
  // Each post: { _id, text, media: { media_url }, owner: {...},
  //              likeby: [userId,...], comments: [...], createdAt }
  //
  // Backend: GET /connection/myconnections
  // Returns: { connections: [...], status: true }
  //
  // Backend: GET /connection/newincomingrequest
  // Returns: { requests: [{ sender: {...} }], status: true }
  const fetchData = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const [postsRes, acceptedRes, incomingRes] = await Promise.all([
        axios.get('/post/getallpost', { withCredentials: true }),
        axios.get('/connection/myconnections', { withCredentials: true }),
        axios.get('/connection/newincomingrequest', { withCredentials: true }),
      ]);

      setPosts(postsRes.data?.posts || postsRes.data || []);

      // Build connection state map: { userId: 'accepted' | 'incoming_pending' }
      const map = {};
      if (acceptedRes.data?.status && acceptedRes.data?.connections) {
        acceptedRes.data.connections.forEach(u => {
          map[u._id?.toString()] = 'accepted';
        });
      }
      if (incomingRes.data?.status && incomingRes.data?.requests) {
        incomingRes.data.requests.forEach(r => {
          const sid = r.sender?._id?.toString();
          if (sid && !map[sid]) map[sid] = 'incoming_pending';
        });
      }
      setConnectionMap(map);

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

  useEffect(() => { fetchData(); }, []);

  // Backend: GET /post/likepost/:postId
  // Returns: "liked" | "like remove" (plain text)
  const handleLike = async (postId) => {
    setLikeLoading(postId);
    try {
      const res = await axios.get(`/post/likepost/${postId}`, { withCredentials: true });
      const response = res.data;
      setPosts(prev => prev.map(p => {
        if (p._id !== postId) return p;
        if (response === 'liked') {
          return { ...p, likeby: [...(p.likeby || []), curruser._id] };
        }
        if (response === 'like remove') {
          return { ...p, likeby: (p.likeby || []).filter(id => id !== curruser._id) };
        }
        return p;
      }));
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Please log in to like posts');
      } else {
        toast.error('Failed to update like');
      }
    } finally {
      setLikeLoading(null);
    }
  };

  // Backend: DELETE /post/delete/:postId
  // 403 → "unauthorised user"
  const handleDelete = async (postId) => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    setDeleteLoading(postId);
    try {
      await axios.delete(`/post/delete/${postId}`, { withCredentials: true });
      setPosts(prev => prev.filter(p => p._id !== postId));
      toast.success('Post deleted');
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('You can only delete your own posts');
      } else {
        toast.error('Failed to delete post');
      }
    } finally {
      setDeleteLoading(null);
    }
  };

  // Backend: GET /connection/newrequestsend/:userId
  // Returns: { message: "request sent", status: true }
  const handleConnect = async (userId) => {
    try {
      await axios.get(`/connection/newrequestsend/${userId}`, { withCredentials: true });
      setConnectionMap(prev => ({ ...prev, [userId]: 'outgoing_pending' }));
      toast.success('Connection request sent');
    } catch (err) {
      if (err.response?.status === 400) {
        toast.error('Connection request already sent');
      } else {
        toast.error('Failed to send request');
      }
    }
  };

  // Backend: GET /connection/acceptconnection/:userId
  // Returns: { message: "connection accepted", status: true }
  const handleAccept = async (userId) => {
    try {
      await axios.get(`/connection/acceptconnection/${userId}`, { withCredentials: true });
      setConnectionMap(prev => ({ ...prev, [userId]: 'accepted' }));
      toast.success('Connection accepted');
    } catch (err) {
      toast.error('Failed to accept connection');
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Feed</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {loading ? 'Loading posts...' : `${posts.length} post${posts.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              title="Refresh feed"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <Link
              to="/createpost"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Pencil size={13} />
              Create Post
            </Link>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          // Skeleton loader
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-gray-200" />
                  <div>
                    <div className="h-3 bg-gray-200 rounded w-28 mb-1.5" />
                    <div className="h-2.5 bg-gray-100 rounded w-16" />
                  </div>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-4/5" />
                  <div className="h-3 bg-gray-100 rounded w-3/5" />
                </div>
                <div className="h-40 bg-gray-100 rounded-lg mb-3" />
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <div className="flex-1 h-8 bg-gray-100 rounded-lg" />
                  <div className="flex-1 h-8 bg-gray-100 rounded-lg" />
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
              Failed to load feed
            </p>
            <p className="text-xs text-gray-400 mb-5">
              Something went wrong. Check your connection and try again.
            </p>
            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-colors mx-auto"
            >
              <RefreshCw size={13} />
              Try Again
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={22} className="text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">No posts yet</p>
            <p className="text-xs text-gray-400 mb-5">
              Be the first to share something with your network.
            </p>
            <Link
              to="/createpost"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Pencil size={13} />
              Create your first post
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <PostCard
                key={post._id}
                post={post}
                currentUserId={curruser?._id?.toString()}
                connectionMap={connectionMap}
                onLike={handleLike}
                onDelete={handleDelete}
                onConnect={handleConnect}
                onAccept={handleAccept}
                likeLoading={likeLoading}
                deleteLoading={deleteLoading}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}