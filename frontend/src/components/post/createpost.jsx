// src/components/post/createpost.jsx
import React, { useState, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserContext } from '../usercontext';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Image, X, Send, ArrowLeft,
  AlertCircle, Loader2, FileText,
  Eye
} from 'lucide-react';

const MAX_TEXT_LENGTH = 3000;
const MAX_FILE_SIZE_MB = 5;

export default function CreatePost() {
  const navigate = useNavigate();
  const { curruser } = useContext(UserContext);
  const fileInputRef = useRef(null);

  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [fileError, setFileError] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // ── File Handling ───────────────────────────────────────────────────────────

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;

    setFileError('');

    // Validate type
    if (!f.type.startsWith('image/')) {
      setFileError('Only image files are allowed (JPG, PNG, GIF, WebP)');
      return;
    }

    // Validate size
    if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setFileError(`Image must be under ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    setFile(f);
    // Revoke previous preview URL to avoid memory leak
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
  };

  const removeFile = () => {
    setFile(null);
    setFileError('');
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    // Reset file input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) {
      // Simulate file input change
      const dt = new DataTransfer();
      dt.items.add(f);
      fileInputRef.current.files = dt.files;
      handleFile({ target: { files: dt.files } });
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate — need at least text or image
    if (!text.trim() && !file) {
      setError('Please write something or add an image before posting.');
      return;
    }

    if (text.length > MAX_TEXT_LENGTH) {
      setError(`Post text cannot exceed ${MAX_TEXT_LENGTH} characters.`);
      return;
    }

    setLoading(true);

    try {
      // Backend: POST /post/addnewpost
      // Accepts: multipart/form-data
      // Fields: text (string), post_image (file, optional)
      // Returns: { post: {...}, status: true } or plain text
      const fd = new FormData();
      fd.append('text', text.trim());
      if (file) fd.append('post_image', file);

      const res = await axios.post('/post/addnewpost', fd, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Backend may return JSON or plain string
      const success =
        res.data?.status === true ||
        res.status === 200 ||
        res.status === 201;

      if (success) {
        toast.success('Post created successfully!');
        // Cleanup preview URL before leaving
        if (preview) URL.revokeObjectURL(preview);
        setTimeout(() => navigate('/feed'), 900);
      } else {
        setError('Something went wrong creating the post. Please try again.');
      }

    } catch (err) {
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
        toast.error('Session expired');
      } else if (err.response?.status === 413) {
        setFileError('Image is too large. Please use an image under 5MB.');
      } else {
        setError(
          err.response?.data?.message ||
          'Failed to create post. Please check your connection and try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Character count color ───────────────────────────────────────────────────

  const charCountColor = () => {
    const remaining = MAX_TEXT_LENGTH - text.length;
    if (remaining < 0) return 'text-red-500';
    if (remaining < 200) return 'text-amber-500';
    return 'text-gray-400';
  };

  // ── Avatar helper ───────────────────────────────────────────────────────────

  const UserAvatar = () => {
    if (curruser?.profile_picture?.url) {
      return (
        <img
          src={curruser.profile_picture.url}
          alt={curruser.display_name}
          className="w-10 h-10 rounded-full object-cover border border-gray-200 flex-shrink-0"
        />
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
        {curruser?.display_name?.charAt(0).toUpperCase() || 'U'}
      </div>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      <div className="max-w-xl mx-auto">

        {/* ── Page Header ── */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition-all"
            title="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Create Post</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Share something with your network
            </p>
          </div>
        </div>

        {/* ── Main Card ── */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

          {/* Tab bar — Write / Preview */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setPreviewMode(false)}
              className={`flex items-center gap-2 flex-1 py-3 text-sm font-semibold text-center transition-colors ${
                !previewMode
                  ? 'text-gray-900 border-b-2 border-gray-900 bg-white'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FileText size={14} className="mx-auto" />
              <span>Write</span>
            </button>
            <button
              onClick={() => setPreviewMode(true)}
              disabled={!text.trim() && !file}
              className={`flex items-center gap-2 flex-1 py-3 text-sm font-semibold text-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                previewMode
                  ? 'text-gray-900 border-b-2 border-gray-900 bg-white'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Eye size={14} className="mx-auto" />
              <span>Preview</span>
            </button>
          </div>

          {/* ── Write Mode ── */}
          {!previewMode ? (
            <form onSubmit={handleSubmit} noValidate>
              <div className="p-5">

                {/* User info row */}
                <div className="flex items-center gap-3 mb-4">
                  <UserAvatar />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {curruser?.display_name || 'You'}
                    </p>
                    <p className="text-xs text-gray-400">
                      Posting to your network
                    </p>
                  </div>
                </div>

                {/* General error */}
                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 mb-4">
                    <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-700">{error}</p>
                  </div>
                )}

                {/* Text area */}
                <div className="relative mb-4">
                  <textarea
                    value={text}
                    onChange={e => {
                      setText(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder={`What's on your mind, ${curruser?.display_name?.split(' ')[0] || 'there'}?`}
                    rows={5}
                    maxLength={MAX_TEXT_LENGTH + 50} // soft limit handled in submit
                    disabled={loading}
                    className="w-full px-3 py-3 text-sm border border-gray-300 rounded-lg outline-none focus:border-gray-500 resize-none transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed leading-relaxed"
                  />
                  {/* Character count */}
                  <p className={`text-xs mt-1 text-right ${charCountColor()}`}>
                    {text.length} / {MAX_TEXT_LENGTH}
                  </p>
                </div>

                {/* Image upload area */}
                {!preview ? (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-lg p-6 cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all"
                  >
                    <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Image size={18} className="text-gray-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600">
                        Add an image
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Click to browse or drag and drop
                      </p>
                      <p className="text-xs text-gray-300 mt-0.5">
                        JPG, PNG, GIF, WebP — max {MAX_FILE_SIZE_MB}MB
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFile}
                      className="hidden"
                    />
                  </div>
                ) : (
                  // Image preview with remove button
                  <div className="relative rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full max-h-72 object-cover"
                    />
                    <div className="absolute top-0 left-0 right-0 p-2 flex justify-between items-center bg-gradient-to-b from-black/40 to-transparent">
                      <span className="text-xs text-white font-medium px-2 py-1 bg-black/30 rounded-full">
                        {file?.name?.length > 30
                          ? file.name.substring(0, 30) + '...'
                          : file?.name}
                      </span>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                        title="Remove image"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/40 to-transparent">
                      <p className="text-xs text-white/80">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                )}

                {/* File error */}
                {fileError && (
                  <div className="flex items-center gap-2 mt-2">
                    <AlertCircle size={13} className="text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-600">{fileError}</p>
                  </div>
                )}
              </div>

              {/* Submit bar */}
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-400">
                  {!text.trim() && !file
                    ? 'Write something or add an image'
                    : text.trim() && file
                    ? 'Text + image ready'
                    : text.trim()
                    ? 'Text ready'
                    : 'Image ready'
                  }
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    disabled={loading}
                    className="px-4 py-2 text-xs font-semibold border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || (!text.trim() && !file) || text.length > MAX_TEXT_LENGTH}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send size={13} />
                        Post
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

          ) : (
            // ── Preview Mode ──
            <div>
              <div className="p-5">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-4">
                  Preview — how your post will look
                </p>

                {/* Simulated post card */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 p-4 pb-3">
                    <UserAvatar />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {curruser?.display_name}
                      </p>
                      <p className="text-xs text-gray-400">Just now</p>
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    {text.trim() && (
                      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed break-words mb-3">
                        {text}
                      </p>
                    )}
                    {preview && (
                      <div className="rounded-lg overflow-hidden border border-gray-100">
                        <img
                          src={preview}
                          alt="Post preview"
                          className="w-full max-h-72 object-cover"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex border-t border-gray-100 px-4 py-2.5 gap-4">
                    <span className="text-xs text-gray-300 flex items-center gap-1">
                      <span>0 likes</span>
                    </span>
                    <span className="text-xs text-gray-300">0 comments</span>
                  </div>
                </div>
              </div>

              {/* Preview footer */}
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={() => setPreviewMode(false)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors"
                >
                  <ArrowLeft size={13} />
                  Back to edit
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 disabled:bg-gray-300 transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      Post Now
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 mb-2">Tips for a great post</p>
          <ul className="space-y-1.5">
            {[
              'Keep it concise — shorter posts get more engagement',
              'Add an image to make your post stand out',
              'Share insights, updates, or questions your network would find useful',
            ].map(tip => (
              <li key={tip} className="flex items-start gap-2 text-xs text-gray-400">
                <span className="w-1 h-1 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}