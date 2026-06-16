// src/components/Sidebar.jsx
import React, { useState, useContext, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserContext } from './usercontext';
import axios from 'axios';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { curruser } = useContext(UserContext);

  const handleLogout = async () => {
    await axios.get('/auth/logout', { withCredentials: true });
    navigate('/login');
    setIsOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/feed', label: 'Feed', icon: '📰' },
    { path: '/myconnections', label: 'My Connections', icon: '👥' },
    { path: '/incomingrequests', label: 'Requests', icon: '📬' },
    { path: '/createpost', label: 'Create Post', icon: '✍️' },
    { path: '/newmeet', label: 'Create Meeting', icon: '📹' },
    { path: '/joinmeet', label: 'Join Meeting', icon: '🔗' },
    { path: `/getprofile/${curruser?._id}`, label: 'My Profile', icon: '👤' },
    { path: '/createprofile', label: 'Create Profile', icon: '📝' },
    { path: `/updateprofile/${curruser?._id}/${curruser?.profileId || 'profile'}`, label: 'Edit Profile', icon: '✏️' },
  ];

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-gray-900 text-white p-2 rounded-lg shadow-md"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {/* Overlay on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-40
        flex flex-col shadow-sm
        transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">S-Connect</h2>
          {curruser && (
            <div className="mt-3 flex items-center gap-3">
              {curruser.profile_picture?.url ? (
                <img
                  src={curruser.profile_picture.url}
                  alt={curruser.display_name}
                  className="w-9 h-9 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-800 text-white flex items-center justify-center text-sm font-semibold">
                  {curruser.display_name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{curruser.display_name}</p>
                <p className="text-xs text-gray-500 truncate">{curruser.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto py-3">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors
                ${isActive(item.path)
                  ? 'bg-gray-100 text-gray-900 border-l-4 border-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
              `}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full py-2 px-4 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}