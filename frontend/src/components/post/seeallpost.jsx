// src/components/post/seeallpost.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { UserContext } from '../usercontext';
import axios from 'axios';
import CommentsSection from './comment';

export default function SeeAllPosts() {
  const { curruser } = useContext(UserContext);
  const [posts, setPosts] = useState([]);
  const [postlike, setpostlike] = useState({});
  const [showComments, setShowComments] = useState({});
  const [connectionMap, setConnectionMap] = useState({});

  useEffect(() => {
    async function fetchData() {
      const res = await axios.get('/post/getallpost', { withCredentials: true });
      const arr = res.data.posts;
      setPosts(arr);
      const likeObj = {};
      arr.forEach(p => { likeObj[p._id] = p.likeby; });
      setpostlike(likeObj);

      const map = {};
      const accepted = await axios.get('/connection/myconnections', { withCredentials: true });
      if (accepted.data.status) accepted.data.connections.forEach(u => { map[u._id] = 'accepted'; });
      const pending = await axios.get('/connection/newincomingrequest', { withCredentials: true });
      if (pending.data.status) pending.data.requests.forEach(r => { if (!map[r.sender._id]) map[r.sender._id] = 'incoming_pending'; });
      setConnectionMap(map);
    }
    fetchData();
  }, []);

  const handleLike = async (postId) => {
    const res = await axios.get(`/post/likepost/${postId}`, { withCredentials: true });
    if (res.data === 'liked') setpostlike(p => ({ ...p, [postId]: [...p[postId], curruser._id] }));
    if (res.data === 'like remove') setpostlike(p => ({ ...p, [postId]: p[postId].filter(id => id !== curruser._id) }));
  };

  const handleDelete = async (postId) => {
    await axios.delete(`/post/delete/${postId}`);
    setPosts(p => p.filter(post => post._id !== postId));
  };

  const handleConnect = async (id) => {
    await axios.get(`/connection/newrequestsend/${id}`, { withCredentials: true });
    setConnectionMap(p => ({ ...p, [id]: 'outgoing_pending' }));
  };

  const handleAccept = async (id) => {
    await axios.get(`/connection/acceptconnection/${id}`, { withCredentials: true });
    setConnectionMap(p => ({ ...p, [id]: 'accepted' }));
  };

  const fmtDate = (d) => {
    const date = new Date(d);
    return `${date.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][date.getMonth()]} ${date.getFullYear()}`;
  };

  const ConnectBtn = ({ authorId }) => {
    const s = connectionMap[authorId];
    if (s === 'accepted') return null;
    if (s === 'outgoing_pending') return <span className="text-xs px-3 py-1 bg-gray-100 text-gray-500 rounded-full">⏳ Pending</span>;
    if (s === 'incoming_pending') return <button onClick={() => handleAccept(authorId)} className="text-xs px-3 py-1 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors">✓ Accept</button>;
    return <button onClick={() => handleConnect(authorId)} className="text-xs px-3 py-1 bg-gray-900 text-white rounded-full hover:bg-gray-700 transition-colors">+ Connect</button>;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Feed</h1>

        {posts.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
            No posts yet. Be the first to share!
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => {
              const isOwn = post.owner._id === curruser._id;
              const liked = postlike[post.id]?.includes(curruser._id);
              return (
                <div key={post._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      {post.owner.profile_picture?.url ? (
                        <img src={post.owner.profile_picture.url} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
                          {post.owner.display_name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{isOwn ? 'You' : post.owner.display_name}</p>
                        <p className="text-xs text-gray-400">{fmtDate(post.createdAt)}</p>
                      </div>
                    </div>
                    {!isOwn && <ConnectBtn authorId={post.owner._id.toString()} />}
                  </div>

                  {/* Content */}
                  <div className="px-4 pb-3">
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{post.text}</p>
                    {post.media?.media_url && (
                      <img src={post.media.media_url} alt="" className="mt-3 w-full rounded-lg max-h-96 object-cover" />
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
                    <span>{postlike[post._id]?.length ?? 0} likes</span>
                    <span>{post.comments.length} comments</span>
                  </div>

                  {/* Actions */}
                  <div className="flex border-t border-gray-100">
                    <button onClick={() => handleLike(post._id)} className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${liked ? 'text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                      {liked ? '👍 Liked' : '👍 Like'}
                    </button>
                    <button onClick={() => setShowComments(p => ({ ...p, [post._id]: !p[post._id] }))} className="flex-1 py-2.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors border-l border-gray-100">
                      💬 Comment
                    </button>
                    {isOwn && (
                      <>
                        <Link to={`/editpost/${post._id}`} className="flex-1 py-2.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors border-l border-gray-100 text-center">
                          ✏️ Edit
                        </Link>
                        <button onClick={() => handleDelete(post._id)} className="flex-1 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-50 transition-colors border-l border-gray-100">
                          🗑️ Delete
                        </button>
                      </>
                    )}
                  </div>

                  {showComments[post._id] && (
                    <div className="border-t border-gray-100">
                      <CommentsSection postId={post._id} />
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