// src/components/post/editpost.jsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { UserContext } from '../usercontext';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  ArrowLeft, Image, X, Save,
  AlertCircle, Loader2, Eye,
  FileText, RefreshCw
} from 'lucide-react';

const MAX_TEXT_LENGTH = 3000;
const MAX_FILE_SIZE_MB = 5;

export default function EditPost() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { curruser } = useContext(UserContext);
  const fileInputRef = useRef(null);

  // ── State ───────────────────────────────────────────────────────────────────
  const [originalPost, setOriginalPost] = useState(null);
  const [text, setText] = useState('');
  const [existingImage, setExistingImage] = useState(null); // URL from DB
  const [newFile, setNewFile] = useState(null);             // new file selected
  const [newPreview, setNewPreview] = useState(null);       // preview for new file
  const [removeImage, setRemoveImage] = useState(false);    // flag to remove existing

  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileError, setFileError] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // ── Fetch existing post ─────────────────────────────────────────────────────

  // Backend: GET /post/getsinglepost/:postId
  // Returns: { post: { _id, text, media: { media_url }, owner: {...} }, status: true }
  const fetchPost = async () => {
    setFetchLoading(true);
    setFetchError('');
    try {
      const res = await axios.get(
        `/post/getpost/${postId}`,
        { withCredentials: true }
      );

      const post = res.data;

      if (!post) {
        setFetchError('Post not found.');
        return;
      }

      // Check ownership — only owner can edit
      // Backend also enforces this via iscorrect_owner_post middleware
      const ownerId = post.owner?._id?.toString() || post.owner?.toString();
      if (ownerId && curruser?._id && ownerId !== curruser._id.toString()) {
        setFetchError('You are not authorised to edit this post.');
        return;
      }

      setOriginalPost(post);
      setText(post.text || '');
      setExistingImage(post.media?.media_url || null);

    } catch (err) {
      const serverMsg = err.response?.data?.message;
      if (err.response?.status === 401) {
        setFetchError('Session expired. Please log in again.');
      } else if (err.response?.status === 403) {
        setFetchError(serverMsg || 'You are not authorised to edit this post.');
      } else if (err.response?.status === 404) {
        setFetchError('Post not found. It may have been deleted.');
      } else {
        setFetchError('Failed to load post. Please try again.');
      }
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    if (postId) fetchPost();
  }, [postId]);

  // Track if any changes have been made
  useEffect(() => {
    if (!originalPost) return;
    const textChanged = text !== (originalPost.text || '');
    const imageChanged = newFile !== null || removeImage;
    setHasChanges(textChanged || imageChanged);
  }, [text, newFile, removeImage, originalPost]);

  // ── File Handling ───────────────────────────────────────────────────────────

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;

    setFileError('');

    if (!f.type.startsWith('image/')) {
      setFileError('Only image files are allowed (JPG, PNG, GIF, WebP)');
      return;
    }

    if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setFileError(`Image must be under ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    setNewFile(f);
    setRemoveImage(false); // cancel any remove flag if new file picked
    if (newPreview) URL.revokeObjectURL(newPreview);
    setNewPreview(URL.createObjectURL(f));
  };

  const handleRemoveExistingImage = () => {
    setRemoveImage(true);
    setExistingImage(null);
  };

  const handleRemoveNewFile = () => {
    setNewFile(null);
    setFileError('');
    if (newPreview) {
      URL.revokeObjectURL(newPreview);
      setNewPreview(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    // Restore existing image if it wasn't explicitly removed
    if (!removeImage && originalPost?.media?.media_url) {
      setExistingImage(originalPost.media.media_url);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) {
      const dt = new DataTransfer();
      dt.items.add(f);
      fileInputRef.current.files = dt.files;
      handleFile({ target: { files: dt.files } });
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  // Backend: PUT /post/edit/:postId
  // Middleware: iscorrect_owner_post (403 if not owner)
  // Accepts: multipart/form-data
  // Fields: text (string), post_image (file, optional), remove_image (boolean string)
  // Returns: { post: {...}, status: true } or plain text
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!text.trim() && !existingImage && !newFile) {
      setError('Post cannot be empty — add some text or an image.');
      return;
    }

    if (text.length > MAX_TEXT_LENGTH) {
      setError(`Post text cannot exceed ${MAX_TEXT_LENGTH} characters.`);
      return;
    }

    if (!hasChanges) {
      toast.info('No changes made to save.');
      return;
    }

    setSaveLoading(true);

    try {
      const fd = new FormData();
      fd.append('text', text.trim());
      if (newFile) fd.append('edited-post-image', newFile);
      if (removeImage) fd.append('remove_image', 'true');

      const res = await axios.put(
        `/post/edit/${postId}`,
        fd,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      const success =
        res.data?.status === true ||
        res.status === 200 ||
        res.status === 201;

      if (success) {
        if (newPreview) URL.revokeObjectURL(newPreview);
        toast.success('Post updated successfully!');
        setTimeout(() => navigate('/feed'), 900);
      } else {
        setError('Something went wrong. Please try again.');
      }

    } catch (err) {
      const serverMsg = err.response?.data?.message;
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
        toast.error('Session expired');
      } else if (err.response?.status === 403) {
        const msg = serverMsg || 'You are not authorised to edit this post.';
        setError(msg);
        toast.error(msg);
      } else if (err.response?.status === 413) {
        setFileError('Image is too large. Please use an image under 5MB.');
      } else {
        setError(
          serverMsg ||
          'Failed to update post. Please try again.'
        );
      }
    } finally {
      setSaveLoading(false);
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const charCountColor = () => {
    const remaining = MAX_TEXT_LENGTH - text.length;
    if (remaining < 0) return 'text-red-500';
    if (remaining < 200) return 'text-amber-500';
    return 'text-gray-400';
  };

  // Current image to display — new file takes priority over existing
  const displayImage = newPreview || (existingImage && !removeImage ? existingImage : null);

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

  // ── Loading State ───────────────────────────────────────────────────────────

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition-all"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Edit Post</h1>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div>
                <div className="h-3.5 bg-gray-200 rounded w-28 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-20" />
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-4/5" />
              <div className="h-3 bg-gray-100 rounded w-3/5" />
            </div>
            <div className="h-40 bg-gray-100 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // ── Fetch Error State ───────────────────────────────────────────────────────

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition-all"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Edit Post</h1>
          </div>
          <div className="bg-white border border-red-200 rounded-xl p-10 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={22} className="text-red-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">
              {fetchError}
            </p>
            <p className="text-xs text-gray-400 mb-5">
              {fetchError.includes('expired') || fetchError.includes('30 minutes')
                ? 'Posts can only be edited within 30 minutes of creation.'
                : fetchError.includes('authorised')
                ? 'Only the post author can edit this post.'
                : 'Check your connection and try again.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              {!fetchError.includes('authorised') && (
                <button
                  onClick={fetchPost}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <RefreshCw size={13} />
                  Try Again
                </button>
              )}
              <button
                onClick={() => navigate('/feed')}
                className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Feed
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      <div className="max-w-xl mx-auto">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition-all"
              title="Go back"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Edit Post</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Update your post content
              </p>
            </div>
          </div>

          {/* Unsaved changes indicator */}
          {hasChanges && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Unsaved changes
            </span>
          )}
        </div>

        {/* ── Main Card ── */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

          {/* Tab bar — Edit / Preview */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setPreviewMode(false)}
              className={`flex items-center justify-center gap-2 flex-1 py-3 text-sm font-semibold transition-colors ${
                !previewMode
                  ? 'text-gray-900 border-b-2 border-gray-900 bg-white'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FileText size={14} />
              Edit
            </button>
            <button
              onClick={() => setPreviewMode(true)}
              disabled={!text.trim() && !displayImage}
              className={`flex items-center justify-center gap-2 flex-1 py-3 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                previewMode
                  ? 'text-gray-900 border-b-2 border-gray-900 bg-white'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Eye size={14} />
              Preview
            </button>
          </div>

          {/* ── Edit Mode ── */}
          {!previewMode ? (
            <form onSubmit={handleSubmit} noValidate>
              <div className="p-5">

                {/* User info */}
                <div className="flex items-center gap-3 mb-4">
                  <UserAvatar />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {curruser?.display_name}
                    </p>
                    <p className="text-xs text-gray-400">Editing post</p>
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
                <div className="mb-4">
                  <textarea
                    value={text}
                    onChange={e => {
                      setText(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="What would you like to say?"
                    rows={5}
                    disabled={saveLoading}
                    className="w-full px-3 py-3 text-sm border border-gray-300 rounded-lg outline-none focus:border-gray-500 resize-none transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed leading-relaxed"
                  />
                  <p className={`text-xs mt-1 text-right ${charCountColor()}`}>
                    {text.length} / {MAX_TEXT_LENGTH}
                  </p>
                </div>

                {/* Image section */}
                <div className="mb-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                    Image
                  </p>

                  {/* Show current image (existing or new preview) */}
                  {displayImage ? (
                    <div className="relative rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={displayImage}
                        alt="Post image"
                        className="w-full max-h-64 object-cover"
                      />
                      {/* New file badge */}
                      {newPreview && (
                        <div className="absolute top-2 left-2">
                          <span className="text-xs font-semibold text-white bg-blue-600 px-2 py-1 rounded-full">
                            New image
                          </span>
                        </div>
                      )}
                      {/* Action buttons overlay */}
                      <div className="absolute top-2 right-2 flex gap-1.5">
                        {/* Replace image */}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-black/50 text-white text-xs font-semibold rounded-lg hover:bg-black/70 transition-colors"
                          title="Replace image"
                        >
                          <Image size={11} />
                          Replace
                        </button>
                        {/* Remove image */}
                        <button
                          type="button"
                          onClick={newPreview ? handleRemoveNewFile : handleRemoveExistingImage}
                          className="p-1.5 bg-black/50 text-white rounded-lg hover:bg-red-600/80 transition-colors"
                          title="Remove image"
                        >
                          <X size={13} />
                        </button>
                      </div>

                      {/* File info for new files */}
                      {newFile && (
                        <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/50 to-transparent">
                          <p className="text-xs text-white/80">
                            {newFile.name} · {(newFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    // No image — show upload area
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-lg p-5 cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all"
                    >
                      <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Image size={17} className="text-gray-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600">
                          {removeImage ? 'Image removed — add a new one?' : 'Add an image'}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Click to browse or drag and drop
                        </p>
                        <p className="text-xs text-gray-300 mt-0.5">
                          JPG, PNG, GIF, WebP — max {MAX_FILE_SIZE_MB}MB
                        </p>
                      </div>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFile}
                    className="hidden"
                  />

                  {/* File error */}
                  {fileError && (
                    <div className="flex items-center gap-2 mt-2">
                      <AlertCircle size={13} className="text-red-500 flex-shrink-0" />
                      <p className="text-xs text-red-600">{fileError}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit bar */}
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-400">
                  {!hasChanges
                    ? 'No changes yet'
                    : 'You have unsaved changes'}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    disabled={saveLoading}
                    className="px-4 py-2 text-xs font-semibold border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors disabled:opacity-50"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    disabled={
                      saveLoading ||
                      !hasChanges ||
                      text.length > MAX_TEXT_LENGTH ||
                      (!text.trim() && !displayImage)
                    }
                    className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {saveLoading ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={13} />
                        Save Changes
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

                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 p-4 pb-3">
                    <UserAvatar />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {curruser?.display_name}
                      </p>
                      <p className="text-xs text-gray-400">Edited · Just now</p>
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    {text.trim() && (
                      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed break-words mb-3">
                        {text}
                      </p>
                    )}
                    {displayImage && (
                      <div className="rounded-lg overflow-hidden border border-gray-100">
                        <img
                          src={displayImage}
                          alt="Post preview"
                          className="w-full max-h-64 object-cover"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex border-t border-gray-100 px-4 py-2.5 gap-4">
                    <span className="text-xs text-gray-300">
                      {originalPost?.likeby?.length || 0} likes
                    </span>
                    <span className="text-xs text-gray-300">
                      {originalPost?.comments?.length || 0} comments
                    </span>
                  </div>
                </div>

                {/* Changes summary */}
                {hasChanges && (
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                    <p className="text-xs font-semibold text-amber-700 mb-1">
                      Changes pending:
                    </p>
                    <ul className="space-y-1">
                      {text !== (originalPost?.text || '') && (
                        <li className="text-xs text-amber-600 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-amber-500" />
                          Text updated
                        </li>
                      )}
                      {newFile && (
                        <li className="text-xs text-amber-600 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-amber-500" />
                          New image selected
                        </li>
                      )}
                      {removeImage && !newFile && (
                        <li className="text-xs text-amber-600 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-amber-500" />
                          Image removed
                        </li>
                      )}
                    </ul>
                  </div>
                )}
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
                  disabled={saveLoading || !hasChanges}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {saveLoading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={13} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Original post reference */}
        {originalPost && (
          <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Original post
            </p>
            <div className="border-l-2 border-gray-200 pl-3">
              {originalPost.text && (
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                  {originalPost.text}
                </p>
              )}
              {originalPost.media?.media_url && (
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                  <Image size={11} />
                  <span>Has an image attached</span>
                </div>
              )}
              {!originalPost.text && !originalPost.media?.media_url && (
                <p className="text-xs text-gray-400">Empty post</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}