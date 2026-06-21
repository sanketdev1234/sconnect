// src/components/post/comment.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Send, X, Loader2 } from 'lucide-react';

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

export default function CommentsSection({ postId, currentUserId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const inputRef = useRef(null);

  // ✅ FIXED: Backend route is GET /post/:postId/comment/all
  // Returns: { comments: [...] } — note: no `status` field on this one
  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `/post/${postId}/comment/all`,
          { withCredentials: true }
        );
        setComments(res.data?.comments || []);
      } catch (err) {
        console.error('Failed to load comments:', err);
        toast.error('Could not load comments');
      } finally {
        setLoading(false);
      }
    };
    if (postId) fetchComments();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [postId]);

  // ✅ FIXED: Backend route is POST /post/:postId/comment/new
  // Returns: { comment: {...} } — populated with Author
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const res = await axios.post(
        `/post/${postId}/comment/new`,
        { text: newComment.trim() },
        { withCredentials: true }
      );
      const added = res.data?.comment;
      if (added) {
        setComments(prev => [...prev, added]);
        setNewComment('');
      } else {
        toast.error('Comment was not saved correctly.');
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
      if (err.response?.status === 401) {
        toast.error('Please log in to comment');
      } else {
        toast.error('Failed to add comment');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // This one was already correct: DELETE /post/:postId/comment/:commentId/delete
  // Backend sends plain text "comment delted" on success
  const handleDeleteComment = async (commentId) => {
    setDeleteLoading(commentId);
    try {
      await axios.delete(
        `/post/${postId}/comment/${commentId}/delete`,
        { withCredentials: true }
      );
      setComments(prev => prev.filter(c => c._id !== commentId));
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('You can only delete your own comments');
      } else {
        toast.error('Failed to delete comment');
      }
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <div className="px-4 pt-3 pb-4 bg-gray-50 border-t border-gray-100">

      <form onSubmit={handleAddComment} className="flex gap-2 mb-3">
        <input
          ref={inputRef}
          type="text"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          maxLength={500}
          disabled={submitting}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-gray-500 bg-white disabled:bg-gray-50 transition-colors"
        />
        <button
          type="submit"
          disabled={!newComment.trim() || submitting}
          className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {submitting
            ? <Loader2 size={13} className="animate-spin" />
            : <Send size={13} />
          }
        </button>
      </form>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="flex gap-2 animate-pulse">
              <div className="w-7 h-7 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1">
                <div className="h-2.5 bg-gray-200 rounded w-1/4 mb-1.5" />
                <div className="h-2.5 bg-gray-100 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-2">
          No comments yet. Be the first to comment.
        </p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {comments.map(comment => {
            const isOwn = comment.Author?._id === currentUserId ||
                          comment.Author === currentUserId;
            return (
              <div key={comment._id} className="flex gap-2 group">
                {comment.Author?.profile_picture?.url ? (
                  <img
                    src={comment.Author.profile_picture.url}
                    alt={comment.Author.display_name}
                    className="w-7 h-7 rounded-full object-cover border border-gray-200 flex-shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 flex-shrink-0">
                    {comment.Author?.display_name?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 mb-0.5">
                        {comment.Author?.display_name || 'User'}
                      </p>
                      <p className="text-xs text-gray-700 break-words">
                        {comment.text}
                      </p>
                    </div>
                    {isOwn && (
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        disabled={deleteLoading === comment._id}
                        className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-all"
                        title="Delete comment"
                      >
                        {deleteLoading === comment._id
                          ? <Loader2 size={12} className="animate-spin" />
                          : <X size={12} />
                        }
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1 ml-1">
                    {formatDate(comment.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}