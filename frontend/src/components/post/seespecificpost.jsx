// src/components/post/seespecificpost.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { UserContext } from '../usercontext';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  ArrowLeft, ThumbsUp, MessageSquare, Pencil,
  Trash2, RefreshCw, AlertCircle, UserCircle,
  Loader2, Send, X, ChevronDown, ChevronUp
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

// ── Main Component ────────────────────────────────────────────────────────────

export default function SeeAllPostsUser() {
  const { full_name } = useParams();
  const navigate = useNavigate();
  const { curruser } = useContext(UserContext);

  const [posts, setPosts] = useState([]);
  const [profileOwner, setProfileOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [likeLoading, setLikeLoading] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [showComments, setShowComments] = useState({});

  // Backend: GET /post/getallpost
  // Returns: { posts: [...], status: true }
  // We filter client-side by full_name from URL param
  // Since backend has no per-user post endpoint, filter from all posts
  const fetchUserPosts = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await axios.get(
        '/post/getallpost',
        { withCredentials: true }
      );
      const allPosts = res.data?.posts || res.data || [];

      // Filter posts by full_name param (decoded from URL)
      const decodedName = decodeURIComponent(full_name || '');
      const userPosts = allPosts.filter(p =>
        p.owner?.full_name === decodedName ||
        p.owner?.display_name === decodedName
      );

      setPosts(userPosts);

      // Extract profile owner info from first post
      if (userPosts.length > 0) {
        setProfileOwner(userPosts[0].owner);
      }

    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else {
        setFetchError('Failed to load posts. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (full_name) fetchUserPosts();
  }, [full_name]);

  // Backend: GET /post/likepost/:postId
  // Returns: "liked" | "like remove" (plain text)
  const handleLike = async (postId) => {
    setLikeLoading(postId);
    try {
      const res = await axios.get(
        `/post/likepost/${postId}`,
        { withCredentials: true }
      );
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
    } catch {
      toast.error('Failed to update like');
    } finally {
      setLikeLoading(null);
    }
  };

  // Backend: DELETE /post/delete/:postId
  // Middleware: iscorrect_owner_post (403 if not owner)
  const handleDelete = async (postId) => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    setDeleteLoading(postId);
    try {
      await axios.delete(
        `/post/delete/${postId}`,
        { withCredentials: true }
      );
      setPosts(prev => prev.filter(p => p._id !== postId));
      toast.success('Post deleted');
    } catch (err) {
      toast.error(
        err.response?.status === 403
          ? 'You can only delete your own posts'
          : 'Failed to delete post'
      );
    } finally {
      setDeleteLoading(null);
    }
  };

  const decodedName = decodeURIComponent(full_name || '');
  const isOwnPage = curruser?.full_name === decodedName ||
                    curruser?.display_name === decodedName;

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
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
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                </div>
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <div className="flex-1 h-8 bg-gray-100 rounded-lg" />
                  <div className="flex-1 h-8 bg-gray-100 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Main Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">
              {isOwnPage ? 'My Posts' : `${decodedName}'s Posts`}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {loading
                ? 'Loading...'
                : `${posts.length} post${posts.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>
          <button
            onClick={fetchUserPosts}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-300 text-gray-600 rounded-lg hover:bg-white disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Profile owner banner */}
        {profileOwner && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex items-center gap-3">
            {profileOwner.profile_picture?.url ? (
              <img
                src={profileOwner.profile_picture.url}
                alt={profileOwner.display_name}
                className="w-12 h-12 rounded-full object-cover border border-gray-200 flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-500 flex-shrink-0">
                {profileOwner.display_name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                {profileOwner.full_name}
              </p>
              <p className="text-xs text-gray-400 truncate">
                @{profileOwner.display_name}
              </p>
            </div>
            <button
              onClick={() => navigate(`/getprofile/${profileOwner._id}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              <UserCircle size={13} />
              Profile
            </button>
          </div>
        )}

        {/* Error state */}
        {fetchError && (
          <div className="bg-white border border-red-200 rounded-xl p-10 text-center mb-4">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={22} className="text-red-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">{fetchError}</p>
            <button
              onClick={fetchUserPosts}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-colors mx-auto mt-4"
            >
              <RefreshCw size={13} />
              Try Again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!fetchError && posts.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={22} className="text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">
              {isOwnPage ? 'You haven\'t posted yet' : `${decodedName} hasn't posted yet`}
            </p>
            <p className="text-xs text-gray-400 mb-5">
              {isOwnPage
                ? 'Share something with your network.'
                : 'Check back later for new posts.'}
            </p>
            {isOwnPage && (
              <Link
                to="/createpost"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Pencil size={13} />
                Create your first post
              </Link>
            )}
          </div>
        )}

        {/* Posts list */}
        {posts.length > 0 && (
          <div className="space-y-4">
            {posts.map(post => {
              const isOwn = post.owner?._id === curruser?._id;
              const liked = post.likeby?.includes(curruser?._id);

              return (
                <div
                  key={post._id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors"
                >
                  {/* Post Header */}
                  <div className="flex items-center gap-3 p-4 pb-3">
                    {post.owner?.profile_picture?.url ? (
                      <img
                        src={post.owner.profile_picture.url}
                        alt={post.owner.display_name}
                        className="w-9 h-9 rounded-full object-cover border border-gray-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600 flex-shrink-0">
                        {post.owner?.display_name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {isOwn ? 'You' : post.owner?.display_name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(post.createdAt)}
                      </p>
                    </div>
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

                  {/* Stats */}
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
                          onClick={() => setShowComments(p => ({ ...p, [post._id]: !p[post._id] }))}
                          className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="flex border-t border-gray-100">
                    <button
                      onClick={() => handleLike(post._id)}
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

                    <button
                      onClick={() => setShowComments(p => ({ ...p, [post._id]: !p[post._id] }))}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-l border-gray-100 transition-colors ${
                        showComments[post._id]
                          ? 'text-gray-900 bg-gray-50'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <MessageSquare size={13} />
                      Comment
                      {showComments[post._id]
                        ? <ChevronUp size={11} />
                        : <ChevronDown size={11} />
                      }
                    </button>

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
                          onClick={() => handleDelete(post._id)}
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

                  {/* Comment Section */}
                  {showComments[post._id] && (
                    <div className="border-t border-gray-100">
                      <CommentsSection
                        postId={post._id}
                        currentUserId={curruser?._id?.toString()}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}