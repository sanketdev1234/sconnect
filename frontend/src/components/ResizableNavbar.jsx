// src/components/ResizableNavbar.jsx
import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserContext } from './usercontext';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Menu,
  X,
  Video,
  LogIn,
  LogOut,
  LayoutDashboard,
  Rss,
  Users,
} from 'lucide-react';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const { curruser, setcurruser } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Backend: GET /auth/logout → plain text "logout done"
  // No error status from backend on logout — always treat as success
  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await axios.get('/auth/logout', { withCredentials: true });
      if (setcurruser) setcurruser(null);
      toast.success('Logged out successfully');
      setMenuOpen(false);
      setTimeout(() => navigate('/landingpage'), 800);
    } catch (err) {
      // Even if request fails, clear local state and redirect
      if (setcurruser) setcurruser(null);
      navigate('/login');
    } finally {
      setLogoutLoading(false);
    }
  };

  const isActive = (path) => location.pathname === path;

  // Nav links shown only when logged in
  const loggedInLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/feed', label: 'Feed', icon: Rss },
    { path: '/myconnections', label: 'Connections', icon: Users },
    { path: '/newmeet', label: 'New Meet', icon: Video },
    { path: '/joinmeet', label: 'Join Meet', icon: LogIn },
  ];

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">

            {/* ── Logo ── */}
            <Link
              to={curruser ? '/dashboard' : '/'}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">S</span>
              </div>
              <span className="text-base font-bold text-gray-900">S-Connect</span>
            </Link>

            {/* ── Desktop Center Links — logged in only ── */}
            {curruser && (
              <div className="hidden md:flex items-center gap-1">
                {loggedInLinks.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive(path)
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon size={14} />
                    {label}
                  </Link>
                ))}
              </div>
            )}

            {/* ── Desktop Right Side ── */}
            <div className="hidden md:flex items-center gap-2">
              {curruser ? (
                <>
                  {/* User avatar + name */}
                  <Link
                    to={`/getprofile/${curruser._id}`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {curruser.profile_picture?.url ? (
                      <img
                        src={curruser.profile_picture.url}
                        alt={curruser.display_name}
                        className="w-7 h-7 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold">
                        {curruser.display_name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">
                      {curruser.display_name}
                    </span>
                  </Link>

                  {/* Logout button */}
                  <button
                    onClick={handleLogout}
                    disabled={logoutLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <LogOut size={14} />
                    {logoutLoading ? 'Logging out...' : 'Logout'}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className={`px-4 py-1.5 text-sm font-semibold rounded-lg border transition-colors ${
                      isActive('/login')
                        ? 'bg-gray-100 border-gray-300 text-gray-900'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                      isActive('/signup')
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-900 text-white hover:bg-gray-700'
                    }`}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* ── Mobile Toggle ── */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">

            {/* Logged in — user info */}
            {curruser && (
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                {curruser.profile_picture?.url ? (
                  <img
                    src={curruser.profile_picture.url}
                    alt={curruser.display_name}
                    className="w-9 h-9 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold">
                    {curruser.display_name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {curruser.display_name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{curruser.email}</p>
                </div>
              </div>
            )}

            {/* Logged in nav links */}
            {curruser && (
              <div className="py-2">
                {loggedInLinks.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                      isActive(path)
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon size={16} className="text-gray-400" />
                    {label}
                  </Link>
                ))}
              </div>
            )}

            {/* Bottom actions */}
            <div className="px-4 py-3 border-t border-gray-100 space-y-2">
              {curruser ? (
                <>
                  <Link
                    to={`/getprofile/${curruser._id}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-2 text-sm font-semibold border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    View My Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={logoutLoading}
                    className="flex items-center justify-center gap-2 w-full py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <LogOut size={14} />
                    {logoutLoading ? 'Logging out...' : 'Logout'}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block w-full py-2 text-sm font-semibold border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMenuOpen(false)}
                    className="block w-full py-2 text-sm font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors text-center"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}