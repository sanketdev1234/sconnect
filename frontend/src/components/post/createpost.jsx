// src/components/post/createpost.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function CreatePost() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('text', text);
      if (file) fd.append('post_image', file);
      await axios.post('/post/addnewpost', fd, { withCredentials: true });
      toast.success('Post created!');
      setTimeout(() => navigate('/feed'), 1200);
    } catch {
      toast.error('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Create Post</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">What's on your mind?</label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={5}
                placeholder="Share something with your network..."
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-gray-500 resize-none transition-colors"
              />
              <p className="text-xs text-gray-400 text-right mt-1">{text.length} characters</p>
            </div>

            {!preview ? (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Add Image (optional)</label>
                <input type="file" accept="image/*" onChange={handleFile}
                  className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer" />
              </div>
            ) : (
              <div className="relative">
                <img src={preview} alt="Preview" className="w-full rounded-lg max-h-64 object-cover" />
                <button type="button" onClick={() => { setFile(null); setPreview(''); }}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600">
                  ✕
                </button>
              </div>
            )}

            <button type="submit" disabled={loading || !text.trim()}
              className="w-full py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
              {loading ? 'Posting...' : 'Post'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}