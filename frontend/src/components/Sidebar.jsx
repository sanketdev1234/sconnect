// src/components/Sidebar.jsx
import React, { useState, useContext, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserContext } from './usercontext';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  LayoutDashboard, Rss, Users, BellRing, PenSquare,
  Video, LogIn, UserCircle, UserPlus, UserCog,
  LogOut, ChevronRight, Menu, X, Download
} from 'lucide-react';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { curruser, setcurruser } = useContext(UserContext);

  // Backend: GET /profile/get/:userId
  // Always returns 200 with { profile: null, status: true } if no profile exists
  // — never throws, so we check res.data.profile, not just success
  useEffect(() => {
    if (!curruser?._id) {
      setProfileLoading(false);
      return;
    }
    axios.get(`/profile/get/${curruser._id}`, { withCredentials: true })
      .then(res => {
        if (res.data?.status && res.data?.profile) {
          setProfileData(res.data.profile);
        } else {
          setProfileData(null);
        }
      })
      .catch(() => {
        setProfileData(null);
      })
      .finally(() => setProfileLoading(false));
  }, [curruser?._id]);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await axios.get('/auth/logout', { withCredentials: true });
      if (setcurruser) setcurruser(null);
      toast.success('Logged out successfully');
      setTimeout(() => navigate('/login'), 800);
    } catch (err) {
      toast.error('Logout failed. Please try again.');
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!profileData) {
      toast.error('Create your profile first before downloading.');
      return;
    }
    try {
      toast.info('Preparing your resume PDF...');
      const res = await axios.get(
        `/profile/download-profile/${curruser._id}`,
        { responseType: 'blob', withCredentials: true }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${curruser.full_name}_Resume.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Resume downloaded!');
    } catch (err) {
      toast.error('Failed to download resume. Try again.');
    }
  };

  const isActive = (path) => location.pathname === path;

  // ✅ FIX: removed process.env.DEFAULT_PHOTO_URL — Vite has no `process`
  // Check the URL string itself instead
  const hasRealPhoto =
    curruser?.profile_picture?.url;
    
  const navItems = [
    {
      group: 'Main',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/feed', label: 'Feed', icon: Rss },
      ]
    },
    {
      group: 'Network',
      items: [
        { path: '/myconnections', label: 'My Connections', icon: Users },
        { path: '/incomingrequests', label: 'Requests', icon: BellRing },
      ]
    },
    {
      group: 'Content',
      items: [
        { path: '/createpost', label: 'Create Post', icon: PenSquare },
      ]
    },
    {
      group: 'Meetings',
      items: [
        { path: '/newmeet', label: 'Create Meeting', icon: Video },
        { path: '/joinmeet', label: 'Join Meeting', icon: LogIn },
      ]
    },
    {
      group: 'Profile',
      items: [
        {
          path: curruser?._id ? `/getprofile/${curruser._id}` : '/createprofile',
          label: 'My Profile',
          icon: UserCircle
        },
        ...(!profileLoading && !profileData
          ? [{ path: '/createprofile', label: 'Create Profile', icon: UserPlus }]
          : []
        ),
        ...(!profileLoading && profileData
          ? [{ path: `/updateprofile/${curruser?._id}/${profileData._id}`, label: 'Edit Profile', icon: UserCog }]
          : []
        ),
      ]
    }
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* User Info Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {hasRealPhoto ? (
            <img
              src={curruser.profile_picture.url}
              alt={curruser.display_name}
              className="w-10 h-10 rounded-full object-cover border border-gray-200 flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
              {curruser?.display_name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {curruser?.display_name || 'User'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {curruser?.email || ''}
            </p>
          </div>
        </div>

        {!profileLoading && (
          <div className={`mt-3 flex items-center gap-1.5 text-xs px-2 py-1 rounded-md w-fit ${
            profileData
              ? 'bg-green-50 text-green-700'
              : 'bg-amber-50 text-amber-700'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${profileData ? 'bg-green-500' : 'bg-amber-500'}`} />
            {profileData ? 'Profile active' : 'Profile not created'}
          </div>
        )}
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map((group) => (
          <div key={group.group} className="mb-1">
            <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {group.group}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors group ${
                    active
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon size={16} className={active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'} />
                    {item.label}
                  </span>
                  {active && <ChevronRight size={14} className="text-white" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-gray-100 space-y-2">
        {!profileLoading && profileData && (
          <button
            onClick={handleDownloadPDF}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <Download size={15} className="text-gray-400" />
            Download Resume
          </button>
        )}

        <button
          onClick={handleLogout}
          disabled={logoutLoading}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          <LogOut size={15} />
          {logoutLoading ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-white border border-gray-200 text-gray-700 p-2 rounded-lg shadow-sm"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-60 bg-white border-r border-gray-200 z-40
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="flex items-center gap-2 px-4 py-3.5 border-b border-gray-100">
          <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">S</span>
          </div>
          <span className="text-base font-bold text-gray-900">S-Connect</span>
        </div>

        <SidebarContent />
      </aside>
    </>
  );
}